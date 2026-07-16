"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';

const LEAGUES = [
  { id: 'A',  name: 'Serie A',        color: '#10B981', flag: '🇮🇹' },
  { id: 'B',  name: 'Serie B',        color: '#0EA5E9', flag: '🇮🇹' },
  { id: 'PL', name: 'Premier League', color: '#3B82F6', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'LL', name: 'La Liga',        color: '#F59E0B', flag: '🇪🇸' },
  { id: 'BL', name: 'Bundesliga',     color: '#EF4444', flag: '🇩🇪' },
  { id: 'L1', name: 'Ligue 1',        color: '#8B5CF6', flag: '🇫🇷' },
];

type ViewMode = 'standings' | 'calendar';

export default function ClassifichePage() {
  const [activeLeague, setActiveLeague] = useState('A');
  const [viewMode, setViewMode] = useState<ViewMode>('standings');
  const [standings, setStandings] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [displayMatchday, setDisplayMatchday] = useState(1);
  const [season, setSeason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const league = LEAGUES.find(l => l.id === activeLeague) || LEAGUES[0];

  // Fetch classifica
  const fetchStandings = useCallback(async (lkey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/classifiche?league=${lkey}&type=standings`);
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      const data = await res.json();
      setStandings(data.standings || []);
      setSeason(data.season || '');
      if (data.currentMatchday) {
        setCurrentMatchday(data.currentMatchday);
        setDisplayMatchday(data.currentMatchday);
      }
    } catch (e: any) {
      setError('Impossibile caricare la classifica. Riprova tra poco.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch calendario per giornata
  const fetchMatches = useCallback(async (lkey: string, matchday: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/classifiche?league=${lkey}&type=matches&matchday=${matchday}`);
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (e: any) {
      setError('Impossibile caricare il calendario. Riprova tra poco.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Quando cambia campionato
  useEffect(() => {
    setStandings([]);
    setMatches([]);
    setCurrentMatchday(1);
    setDisplayMatchday(1);
    fetchStandings(activeLeague);
  }, [activeLeague, fetchStandings]);

  // Quando cambia view o giornata
  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchMatches(activeLeague, displayMatchday);
    }
  }, [viewMode, displayMatchday, activeLeague, fetchMatches]);

  const handlePrev = () => setDisplayMatchday(d => Math.max(1, d - 1));
  const handleNext = () => setDisplayMatchday(d => Math.min(38, d + 1));

  const getZoneColor = (pos: number, leagueId: string) => {
    if (leagueId === 'A') {
      if (pos <= 4) return { bg: 'bg-[#10B981]/8', text: 'text-[#10B981]', dot: '#10B981' };
      if (pos <= 6) return { bg: '', text: 'text-[#0EA5E9]', dot: '#0EA5E9' };
      if (pos >= 18) return { bg: 'bg-[#EF4444]/8', text: 'text-[#EF4444]', dot: '#EF4444' };
    }
    if (leagueId === 'B') {
      if (pos <= 2) return { bg: 'bg-[#10B981]/8', text: 'text-[#10B981]', dot: '#10B981' };
      if (pos <= 8) return { bg: '', text: 'text-[#0EA5E9]', dot: '#0EA5E9' };
      if (pos >= 16) return { bg: 'bg-[#EF4444]/8', text: 'text-[#EF4444]', dot: '#EF4444' };
    }
    if (['PL','LL','BL','L1'].includes(leagueId)) {
      if (pos <= 4) return { bg: 'bg-[#10B981]/8', text: 'text-[#10B981]', dot: '#10B981' };
      if (pos <= 6) return { bg: '', text: 'text-[#0EA5E9]', dot: '#0EA5E9' };
      if (pos >= 18) return { bg: 'bg-[#EF4444]/8', text: 'text-[#EF4444]', dot: '#EF4444' };
    }
    return { bg: '', text: 'text-[#94A3B8]', dot: '#334155' };
  };

  const getStatusLabel = (status: string, homeScore: number | null, awayScore: number | null) => {
    if (status === 'FINISHED' && homeScore !== null) return `${homeScore} - ${awayScore}`;
    if (status === 'IN_PLAY' || status === 'PAUSED') return '🔴 LIVE';
    if (status === 'SCHEDULED') return 'VS';
    if (status === 'POSTPONED') return 'POSTICIPATA';
    if (status === 'CANCELLED') return 'ANNULLATA';
    return 'VS';
  };

  const getStatusColor = (status: string) => {
    if (status === 'FINISHED') return 'text-[#10B981] bg-[#10B981]/10';
    if (status === 'IN_PLAY' || status === 'PAUSED') return 'text-white bg-red-500 animate-pulse';
    if (status === 'POSTPONED' || status === 'CANCELLED') return 'text-[#EF4444] bg-[#EF4444]/10';
    return 'text-[#94A3B8] bg-[#0F172A]';
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#0B1120] text-white">
      {/* Header */}
      <div className="sticky top-[56px] z-20 bg-[#0B1120] px-4 pt-4 pb-2">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: league.color + '22', color: league.color }}>
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Campionati</h1>
            {season && <p className="text-xs font-bold uppercase tracking-widest" style={{ color: league.color }}>Stagione {season}</p>}
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
                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:border-[#475569]'
              }`}
              style={activeLeague === l.id ? { backgroundColor: l.color, borderColor: l.color } : {}}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex bg-[#1E293B] p-1 rounded-xl border border-[#334155] mt-3">
          <button
            onClick={() => setViewMode('standings')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-1 ${viewMode === 'standings' ? 'text-white' : 'text-[#94A3B8]'}`}
            style={viewMode === 'standings' ? { backgroundColor: league.color } : {}}
          >
            <Trophy size={12} /> CLASSIFICA
          </button>
          <button
            onClick={() => { setViewMode('calendar'); fetchMatches(activeLeague, displayMatchday || currentMatchday); }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-1 ${viewMode === 'calendar' ? 'text-white' : 'text-[#94A3B8]'}`}
            style={viewMode === 'calendar' ? { backgroundColor: league.color } : {}}
          >
            <CalendarIcon size={12} /> CALENDARIO
          </button>
        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Error state */}
        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#EF4444]">Errore di caricamento</p>
              <p className="text-xs text-[#94A3B8] mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2 animate-pulse">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="h-12 bg-[#1E293B] rounded-xl border border-[#334155]" />
            ))}
          </div>
        )}

        {/* STANDINGS VIEW */}
        {!loading && viewMode === 'standings' && standings.length > 0 && (
          <div className="bg-[#1E293B] rounded-2xl overflow-hidden border border-[#334155] shadow-xl">
            {/* Header row */}
            <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
              <span className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">Classifica {league.name}</span>
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

            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-[#94A3B8] uppercase bg-[#0F172A]/50 border-b border-[#334155]">
                <tr>
                  <th className="px-3 py-2 font-black text-center w-8">#</th>
                  <th className="px-2 py-2 font-black">Squadra</th>
                  <th className="px-2 py-2 font-black text-center" style={{ color: league.color }}>Pt</th>
                  <th className="px-2 py-2 font-bold text-center text-[#64748B]">G</th>
                  <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden sm:table-cell">V</th>
                  <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden sm:table-cell">N</th>
                  <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden sm:table-cell">P</th>
                  <th className="px-2 py-2 font-bold text-center text-[#64748B] hidden md:table-cell">GD</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team) => {
                  const zone = getZoneColor(team.pos, activeLeague);
                  return (
                    <tr key={team.teamId} className={`border-b border-[#334155]/30 ${zone.bg} hover:bg-[#334155]/20 transition-colors`}>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: zone.dot }} />
                          <span className={`text-xs font-black ${zone.text}`}>{team.pos}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          {team.crest && (
                            <img src={team.crest} alt="" loading="lazy" className="w-5 h-5 object-contain shrink-0" />
                          )}
                          <span className="font-bold text-white text-xs truncate max-w-[120px]">{team.team}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center font-black" style={{ color: league.color }}>{team.points}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium">{team.played}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium hidden sm:table-cell">{team.w}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium hidden sm:table-cell">{team.d}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-[#94A3B8] font-medium hidden sm:table-cell">{team.l}</td>
                      <td className={`px-2 py-2.5 text-center text-xs font-bold hidden md:table-cell ${team.gd > 0 ? 'text-[#10B981]' : team.gd < 0 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                        {team.gd > 0 ? '+' : ''}{team.gd}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CALENDAR VIEW */}
        {!loading && viewMode === 'calendar' && (
          <>
            {/* Matchday navigator */}
            <div className="flex items-center justify-between bg-[#1E293B] border border-[#334155] rounded-xl p-2 mb-4 shadow-md">
              <button
                onClick={handlePrev}
                disabled={displayMatchday <= 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0F172A] border border-[#334155] disabled:opacity-40 active:scale-95 transition-transform"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="font-black text-lg tracking-widest uppercase flex items-center gap-2">
                {displayMatchday === currentMatchday && <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />}
                {displayMatchday}ª Giornata
              </div>
              <button
                onClick={handleNext}
                disabled={displayMatchday >= 38}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0F172A] border border-[#334155] disabled:opacity-40 active:scale-95 transition-transform"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {matches.length === 0 && !loading && (
              <div className="text-center text-[#94A3B8] py-12">
                <CalendarIcon size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold">Nessuna partita trovata per questa giornata.</p>
                <p className="text-xs mt-1 opacity-60">Prova a navigare su un'altra giornata.</p>
              </div>
            )}

            <div className="space-y-3">
              {matches.map((match) => {
                const isFinished = match.status === 'FINISHED';
                const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
                return (
                  <div key={match.id} className={`bg-[#1E293B] border rounded-xl p-4 transition-all ${isLive ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-[#334155]'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">{match.date}</span>
                      {isLive && <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      {/* Home */}
                      <div className="flex-1 flex items-center justify-end gap-2">
                        <span className={`font-black text-sm text-right ${isFinished && match.homeScore > match.awayScore ? 'text-white' : 'text-[#94A3B8]'}`}>
                          {match.home}
                        </span>
                        {match.homeCrest && <img src={match.homeCrest} alt="" loading="lazy" className="w-7 h-7 object-contain shrink-0" />}
                      </div>

                      {/* Score / VS */}
                      <div className={`mx-3 min-w-[52px] text-center font-black text-sm px-3 py-1.5 rounded-lg border ${getStatusColor(match.status)} ${isLive ? 'border-red-500/50' : 'border-[#334155]'}`}>
                        {getStatusLabel(match.status, match.homeScore, match.awayScore)}
                      </div>

                      {/* Away */}
                      <div className="flex-1 flex items-center justify-start gap-2">
                        {match.awayCrest && <img src={match.awayCrest} alt="" loading="lazy" className="w-7 h-7 object-contain shrink-0" />}
                        <span className={`font-black text-sm text-left ${isFinished && match.awayScore > match.homeScore ? 'text-white' : 'text-[#94A3B8]'}`}>
                          {match.away}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
