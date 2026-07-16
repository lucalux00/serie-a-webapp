"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle, Swords, Crown, ChevronDown } from 'lucide-react';
import { HISTORY_DATA } from '@/data/history';
import { ALL_TEAMS } from '@/data/teams';
import { useRouter } from 'next/navigation';

const LEAGUES = [
  { id: 'A',  name: 'Serie A',        color: '#10B981', flag: '🇮🇹', short: 'SA' },
  { id: 'B',  name: 'Serie B',        color: '#0EA5E9', flag: '🇮🇹', short: 'SB' },
  { id: 'PL', name: 'Premier League', color: '#3B82F6', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', short: 'PL' },
  { id: 'LL', name: 'La Liga',        color: '#F59E0B', flag: '🇪🇸', short: 'LL' },
  { id: 'BL', name: 'Bundesliga',     color: '#EF4444', flag: '🇩🇪', short: 'BL' },
  { id: 'L1', name: 'Ligue 1',        color: '#8B5CF6', flag: '🇫🇷', short: 'L1' },
];

type ViewMode = 'standings' | 'scorers' | 'calendar' | 'history';

export default function ClassifichePage() {
  const router = useRouter();
  const [activeLeague, setActiveLeague] = useState('A');
  const [viewMode, setViewMode] = useState<ViewMode>('standings');

  // Standings
  const [standings, setStandings] = useState<any[]>([]);
  const [season, setSeason] = useState('');
  const [seasonNotStarted, setSeasonNotStarted] = useState(false);
  const [selectedHistorySeason, setSelectedHistorySeason] = useState<number | null>(null);
  
  // Calendar
  const [matches, setMatches] = useState<any[]>([]);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [displayMatchday, setDisplayMatchday] = useState(1);

  // Scorers
  const [scorers, setScorers] = useState<any[]>([]);

  // History
  const [seasons, setSeasons] = useState<any[]>([]);
  const [historicalStandings, setHistoricalStandings] = useState<any[]>([]);
  const [historySeason, setHistorySeason] = useState('');
  const [historyWinner, setHistoryWinner] = useState<any>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const groupedHistory = useMemo(() => {
    // Se abbiamo dati storici statici completi (es. Serie A dal 1898), usiamo quelli.
    if (HISTORY_DATA[activeLeague]) {
      return HISTORY_DATA[activeLeague].map(teamData => {
        return [
          teamData.team,
          {
            crest: teamData.crest,
            wins: teamData.wins.map(yearLabel => ({
              year: parseInt(yearLabel.split('/')[0]),
              label: yearLabel,
              isStatic: true
            }))
          }
        ];
      });
    }

    // Altrimenti usiamo il raggruppamento dinamico dalle stagioni restituite dall'API
    const map: Record<string, { crest: string, wins: any[] }> = {};
    seasons.forEach(s => {
      if (!s.winner) return;
      if (!map[s.winner]) map[s.winner] = { crest: s.winnerCrest, wins: [] };
      map[s.winner].wins.push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [seasons, activeLeague]);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const league = LEAGUES.find(l => l.id === activeLeague) || LEAGUES[0];

  const apiFetch = useCallback(async (params: string) => {
    const res = await fetch(`/api/classifiche?league=${activeLeague}${params}`);
    if (!res.ok) throw new Error(`Errore ${res.status}`);
    return res.json();
  }, [activeLeague]);

  // Fetch classifica corrente (con fallback a stagione precedente se non iniziata, oppure specifica un anno)
  const fetchStandings = useCallback(async (lkey?: string, forceYear?: number) => {
    setLoading(true);
    setError(null);
    setSeasonNotStarted(false);
    try {
      const url = forceYear 
        ? `/api/classifiche?league=${lkey || activeLeague}&type=standings&season=${forceYear}`
        : `/api/classifiche?league=${lkey || activeLeague}&type=standings`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error === 'season_not_started') {
        setSeasonNotStarted(true);
        setSeason(data.season || '');
        // Auto-load la stagione precedente
        const prevYear = parseInt(data.season?.split('/')[0] || '2025') - 1;
        const prevRes = await fetch(`/api/classifiche?league=${lkey || activeLeague}&type=standings&season=${prevYear}`);
        const prevData = await prevRes.json();
        setStandings(prevData.standings || []);
        setSeason(prevData.season || '');
        if (prevData.currentMatchday) setCurrentMatchday(prevData.currentMatchday);
      } else {
        setStandings(data.standings || []);
        setSeason(data.season || '');
        if (data.currentMatchday) {
          setCurrentMatchday(data.currentMatchday);
          setDisplayMatchday(data.currentMatchday);
        }
      }
    } catch (e: any) {
      setError('Impossibile caricare la classifica.');
    } finally {
      setLoading(false);
    }
  }, [activeLeague]);

  const fetchMatches = useCallback(async (matchday: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`&type=matches&matchday=${matchday}`);
      setMatches(data.matches || []);
    } catch { setError('Impossibile caricare il calendario.'); }
    finally { setLoading(false); }
  }, [apiFetch]);

  const fetchScorers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('&type=scorers');
      setScorers(data.scorers || []);
    } catch { setError('Impossibile caricare la classifica marcatori.'); }
    finally { setLoading(false); }
  }, [apiFetch]);

  const fetchSeasons = useCallback(async () => {
    if (HISTORY_DATA[activeLeague]) {
      // Se abbiamo i dati storici hardcoded, non serve attendere l'API per l'Albo d'oro,
      // ma possiamo comunque fetchare per altri motivi, oppure impostiamo 'seasons' a qualcosa di finto
      // per bypassare il loading
      setSeasons([{ dummy: true }]); 
      return;
    }
    try {
      const data = await apiFetch('&type=seasons');
      // Esclude la stagione corrente (non ancora finita / 0 punti)
      const pastSeasons = (data.seasons || []).filter((s: any) => s.winner);
      setSeasons(pastSeasons);
    } catch { /* silent */ }
  }, [apiFetch, activeLeague]);

  const fetchHistoricalStandings = useCallback(async (year: number) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/classifiche?league=${activeLeague}&type=standings&season=${year}`);
      const data = await res.json();
      setHistoricalStandings(data.standings || []);
      setHistorySeason(data.season || '');
      setHistoryWinner(data.winner || (data.standings?.[0] || null));
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, [activeLeague]);

  // Reset on league change
  useEffect(() => {
    setStandings([]); setMatches([]); setScorers([]); setSeasons([]);
    setHistoricalStandings([]); setSelectedHistorySeason(null); setExpandedTeam(null);
    setCurrentMatchday(1); setDisplayMatchday(1);
    setViewMode('standings');
    fetchStandings(activeLeague);
  }, [activeLeague]);

  // View changes
  useEffect(() => {
    if (viewMode === 'calendar') fetchMatches(displayMatchday);
    if (viewMode === 'scorers' && scorers.length === 0) fetchScorers();
    if (viewMode === 'history' && seasons.length === 0) fetchSeasons();
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'calendar') fetchMatches(displayMatchday);
  }, [displayMatchday]);

  const getZoneColor = (pos: number) => {
    if (pos <= 4) return { bg: 'bg-[#10B981]/8', text: 'text-[#10B981]', dot: '#10B981' };
    if (pos <= 6) return { bg: '', text: 'text-[#0EA5E9]', dot: '#0EA5E9' };
    if (pos >= 18) return { bg: 'bg-[#EF4444]/8', text: 'text-[#EF4444]', dot: '#EF4444' };
    return { bg: '', text: 'text-[#94A3B8]', dot: '#334155' };
  };

  const getStatusLabel = (status: string, h: number | null, a: number | null) => {
    if (status === 'FINISHED' && h !== null) return `${h} - ${a}`;
    if (status === 'IN_PLAY' || status === 'PAUSED') return '🔴 LIVE';
    if (status === 'POSTPONED') return 'POSTICIPATA';
    return 'VS';
  };

  const ViewBtn = ({ mode, icon, label }: { mode: ViewMode, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 ${viewMode === mode ? 'text-white' : 'text-[#94A3B8]'}`}
      style={viewMode === mode ? { backgroundColor: league.color } : {}}
    >
      {icon} {label}
    </button>
  );

  const StandingsTable = ({ rows, compact }: { rows: any[], compact?: boolean }) => (
    <table className="w-full text-sm text-left">
      <thead className="text-[10px] text-[#94A3B8] uppercase bg-[#0F172A]/50 border-b border-[#334155]">
        <tr>
          <th className="px-3 py-2 font-black text-center w-8">#</th>
          <th className="px-2 py-2 font-black">Squadra</th>
          <th className="px-2 py-2 font-black text-center" style={{ color: league.color }}>Pt</th>
          <th className="px-2 py-2 font-bold text-center text-[#64748B]">G</th>
          {!compact && <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden sm:table-cell">V</th>}
          {!compact && <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden sm:table-cell">N</th>}
          {!compact && <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden sm:table-cell">P</th>}
          <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden md:table-cell">GD</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((team) => {
          const zone = getZoneColor(team.pos);
          return (
            <tr key={team.teamId || team.pos} className={`border-b border-[#334155]/30 ${zone.bg} hover:bg-[#334155]/20 transition-colors`}>
              <td className="px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: zone.dot }} />
                  <span className={`text-xs font-black ${zone.text}`}>{team.pos}</span>
                </div>
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  {team.crest && <img src={team.crest} alt="" loading="lazy" className="w-5 h-5 object-contain shrink-0" />}
                  <span className="font-bold text-white text-xs truncate max-w-[120px]">{team.team}</span>
                  {team.pos === 1 && <span className="text-yellow-400 text-xs">👑</span>}
                </div>
              </td>
              <td className="px-2 py-2.5 text-center font-black" style={{ color: league.color }}>{team.points}</td>
              <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium">{team.played}</td>
              {!compact && <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium hidden sm:table-cell">{team.w}</td>}
              {!compact && <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium hidden sm:table-cell">{team.d}</td>}
              {!compact && <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium hidden sm:table-cell">{team.l}</td>}
              <td className={`px-2 py-2.5 text-center text-xs font-bold hidden md:table-cell ${team.gd > 0 ? 'text-[#10B981]' : team.gd < 0 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                {team.gd > 0 ? '+' : ''}{team.gd}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const Skeleton = () => (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-[#1E293B] rounded-xl border border-[#334155]" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#0B1120] text-white">
      {/* Sticky Header */}
      <div className="sticky top-[56px] z-20 bg-[#0B1120] px-4 pt-4 pb-2">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: league.color + '22', color: league.color }}>
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Campionati</h1>
            {season && (
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: league.color }}>
                {seasonNotStarted ? `Stagione ${season} – Ultima disponibile` : `Stagione ${season}`}
              </p>
            )}
          </div>
        </div>

        {/* League Selector */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
          {LEAGUES.map(l => (
            <button
              key={l.id}
              onClick={() => setActiveLeague(l.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                activeLeague === l.id
                  ? 'text-white border-transparent shadow-lg scale-105'
                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
              }`}
              style={activeLeague === l.id ? { backgroundColor: l.color, borderColor: l.color } : {}}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>

        {/* View Toggle — 4 tabs */}
        <div className="flex bg-[#1E293B] p-1 rounded-xl border border-[#334155] mt-3 gap-0.5">
          <ViewBtn mode="standings" icon={<Trophy size={11} />} label="CLASSIFICA" />
          <ViewBtn mode="scorers"   icon={<Swords size={11} />}  label="MARCATORI" />
          <ViewBtn mode="calendar"  icon={<CalendarIcon size={11} />} label="CALENDARIO" />
          <ViewBtn mode="history"   icon={<Crown size={11} />}   label="STORIA" />
        </div>
      </div>

      <div className="px-4 pt-3">
        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
            <p className="text-sm text-[#94A3B8]">{error}</p>
          </div>
        )}

        {/* ── CLASSIFICA ── */}
        {viewMode === 'standings' && (
          <>
            {loading ? <Skeleton /> : standings.length > 0 ? (
              <div className="bg-[#1E293B] rounded-2xl overflow-hidden border border-[#334155] shadow-xl">
                <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
                  <span className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">{league.name} · {season}</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: league.color, backgroundColor: league.color + '15' }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: league.color }} />
                    DATI REALI
                  </div>
                </div>

                {/* Legend */}
                <div className="px-4 py-2 border-b border-[#334155]/50 flex gap-4 text-[9px] font-bold uppercase text-[#64748B]">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10B981]" /> Champions</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0EA5E9]" /> Europa</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#EF4444]" /> Retrocessione</div>
                </div>

                <StandingsTable rows={standings} />
              </div>
            ) : (
              <div className="text-center py-16 text-[#94A3B8]">
                <Trophy size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold">Classifica non disponibile</p>
              </div>
            )}
          </>
        )}

        {/* ── MARCATORI ── */}
        {viewMode === 'scorers' && (
          <>
            {loading ? <Skeleton /> : (
              <div className="bg-[#1E293B] rounded-2xl overflow-hidden border border-[#334155] shadow-xl">
                <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
                  <span className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">Classifica Marcatori · {season}</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: league.color, backgroundColor: league.color + '15' }}>
                    <Swords size={10} /> TOP 20
                  </div>
                </div>

                {scorers.length === 0 ? (
                  <div className="text-center py-12 text-[#94A3B8]">
                    <Swords size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-sm">Dati marcatori non ancora disponibili</p>
                    <p className="text-xs mt-1 opacity-60">Saranno aggiornati all'inizio della stagione</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[10px] text-[#94A3B8] uppercase bg-[#0F172A]/50 border-b border-[#334155]">
                      <tr>
                        <th className="px-3 py-2 text-center">#</th>
                        <th className="px-2 py-2 text-left">Giocatore</th>
                        <th className="px-2 py-2 text-center" style={{ color: league.color }}>⚽</th>
                        <th className="px-2 py-2 text-center text-[#64748B] hidden sm:table-cell">ASS</th>
                        <th className="px-2 py-2 text-center text-[#64748B] hidden sm:table-cell">RIG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scorers.map((s) => (
                        <tr key={s.pos} className="border-b border-[#334155]/30 hover:bg-[#334155]/20 transition-colors">
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-black ${s.pos <= 3 ? '' : 'text-[#94A3B8]'}`}
                              style={s.pos <= 3 ? { color: ['#F59E0B','#94A3B8','#CD7F32'][s.pos-1] } : {}}>
                              {s.pos <= 3 ? ['🥇','🥈','🥉'][s.pos-1] : s.pos}
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              {s.teamCrest && <img src={s.teamCrest} alt="" loading="lazy" className="w-5 h-5 object-contain shrink-0" />}
                              <div>
                                <div className="font-bold text-white text-xs">{s.name}</div>
                                <div className="text-[10px] text-[#64748B]">{s.teamName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center font-black text-lg" style={{ color: league.color }}>{s.goals}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] hidden sm:table-cell">{s.assists ?? '-'}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] hidden sm:table-cell">{s.penalties ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        {/* ── CALENDARIO ── */}
        {viewMode === 'calendar' && (
          <>
            <div className="flex items-center justify-between bg-[#1E293B] border border-[#334155] rounded-xl p-2 mb-4">
              <button onClick={() => setDisplayMatchday(d => Math.max(1, d - 1))} disabled={displayMatchday <= 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0F172A] border border-[#334155] disabled:opacity-40 active:scale-95 transition-transform">
                <ChevronLeft size={20} />
              </button>
              <div className="font-black text-lg tracking-widest uppercase flex items-center gap-2">
                {displayMatchday === currentMatchday && <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />}
                {displayMatchday}ª Giornata
              </div>
              <button onClick={() => setDisplayMatchday(d => Math.min(38, d + 1))} disabled={displayMatchday >= 38}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0F172A] border border-[#334155] disabled:opacity-40 active:scale-95 transition-transform">
                <ChevronRight size={20} />
              </button>
            </div>

            {loading ? <Skeleton /> : (
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center py-12 text-[#94A3B8]">
                    <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold">Nessuna partita trovata</p>
                  </div>
                ) : matches.map((match) => {
                  const isFinished = match.status === 'FINISHED';
                  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
                  return (
                    <div key={match.id} className={`bg-[#1E293B] border rounded-xl p-4 ${isLive ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-[#334155]'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-[#64748B]">{match.date}</span>
                        {isLive && <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex-1 flex items-center justify-end gap-2">
                          <span className={`font-black text-sm text-right ${isFinished && match.homeScore > match.awayScore ? 'text-white' : 'text-[#94A3B8]'}`}>{match.home}</span>
                          {match.homeCrest && <img src={match.homeCrest} alt="" loading="lazy" className="w-7 h-7 object-contain shrink-0" />}
                        </div>
                        <div className={`mx-3 min-w-[52px] text-center font-black text-sm px-3 py-1.5 rounded-lg border ${isFinished ? 'text-white bg-[#10B981]/10 border-[#10B981]/30' : isLive ? 'text-white bg-red-500 border-red-500/50 animate-pulse' : 'text-[#94A3B8] bg-[#0F172A] border-[#334155]'}`}>
                          {getStatusLabel(match.status, match.homeScore, match.awayScore)}
                        </div>
                        <div className="flex-1 flex items-center justify-start gap-2">
                          {match.awayCrest && <img src={match.awayCrest} alt="" loading="lazy" className="w-7 h-7 object-contain shrink-0" />}
                          <span className={`font-black text-sm ${isFinished && match.awayScore > match.homeScore ? 'text-white' : 'text-[#94A3B8]'}`}>{match.away}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── STORIA ── */}
        {viewMode === 'history' && (
          <div className="space-y-5">
            {/* Timeline scudetti */}
            <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden shadow-xl">
              <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center gap-2">
                <Crown size={16} style={{ color: league.color }} />
                <span className="text-xs font-black text-white uppercase tracking-widest">Albo d'Oro · {league.name}</span>
              </div>
              <div className="p-3 space-y-2">
                {seasons.length === 0 ? (
                  <div className="text-center py-8 text-[#94A3B8] text-sm animate-pulse">Caricamento storico...</div>
                ) : groupedHistory.map(([team, data]: any) => (
                  <div key={team} className="bg-[#0F172A] border border-[#334155] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedTeam(expandedTeam === team ? null : team)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#334155]/20"
                    >
                      <div className="flex items-center gap-3">
                        {data.crest && <img src={data.crest} alt="" loading="lazy" className="w-6 h-6 object-contain" />}
                        <span className="font-black text-sm text-white">{team}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#F59E0B]/20">
                          {data.wins.length} Titoli
                        </span>
                        <ChevronRight size={18} className={`text-[#64748B] transition-transform ${expandedTeam === team ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                    {expandedTeam === team && (
                      <div className="p-3 bg-[#1E293B] border-t border-[#334155] grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {data.wins.map((s: any) => (
                          <button
                            key={s.year}
                            onClick={() => {
                              if (selectedHistorySeason === s.year) {
                                setSelectedHistorySeason(null);
                              } else {
                                setSelectedHistorySeason(s.year);
                                fetchHistoricalStandings(s.year);
                              }
                            }}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all active:scale-95 ${
                              selectedHistorySeason === s.year 
                                ? 'bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white border-transparent shadow-lg' 
                                : 'bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:text-white hover:border-[#475569]'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-70">Stagione</span>
                            <span className="text-sm font-black">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Classifica storica espansa */}
            {selectedHistorySeason && (
              <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden shadow-xl mt-6 animate-fade-in">
                <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[#F59E0B]" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Classifica Finale · Stagione {selectedHistorySeason}</span>
                  </div>
                  <button onClick={() => setSelectedHistorySeason(null)} className="p-1 hover:bg-[#334155] rounded-full transition-colors">
                    <ChevronDown size={18} className="text-[#94A3B8]" />
                  </button>
                </div>
                
                <div className="p-5 flex flex-col items-center border-b border-[#334155]/50 bg-gradient-to-b from-[#1E293B] to-[#0F172A]">
                   <p className="text-sm text-[#94A3B8] text-center mb-4 max-w-md">
                     Puoi visualizzare le statistiche dettagliate, l'allenatore e i giocatori storici di quell'annata nella bacheca trofei del club.
                   </p>
                   <button 
                     onClick={() => {
                        const t = ALL_TEAMS.find(x => x.name.toLowerCase() === expandedTeam?.toLowerCase() || expandedTeam?.toLowerCase().includes(x.name.toLowerCase()));
                        if (t) {
                          router.push(`/squadra/${t.id}?tab=trofei`);
                        }
                     }}
                     className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
                   >
                     <Crown size={16} /> Vedi Rosa e Trofeo Storico
                   </button>
                </div>

                <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                  {historyLoading ? (
                    <div className="p-8 space-y-3 animate-pulse">
                      {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-[#334155]/30 rounded-lg" />)}
                    </div>
                  ) : historicalStandings.length > 0 ? (
                    <StandingsTable rows={historicalStandings} compact={true} />
                  ) : (
                    <div className="text-center py-10 text-[#64748B] text-sm">
                      Dettaglio classifica non disponibile per questa stagione nell'archivio europeo.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
