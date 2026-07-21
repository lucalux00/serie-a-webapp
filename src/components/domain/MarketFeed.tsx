"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft, ArrowRight, ArrowLeft, RefreshCw,
  CheckCircle2, Search, Clock, Loader2, TrendingUp,
} from 'lucide-react';
import { ALL_TEAMS } from '@/data/teams';
import TeamLogo from '@/components/ui/TeamLogo';

type LeagueKey = 'A' | 'B' | 'PL' | 'LL' | 'BL' | 'L1';
type FilterKey = 'acquisti' | 'cessioni' | 'prestiti' | 'trattative';

const LEAGUES: { id: LeagueKey; label: string }[] = [
  { id: 'A',  label: 'Serie A' },
  { id: 'B',  label: 'Serie B' },
  { id: 'PL', label: 'Premier' },
  { id: 'LL', label: 'La Liga' },
  { id: 'BL', label: 'Bundesliga' },
  { id: 'L1', label: 'Ligue 1' },
];

const FILTERS: { id: FilterKey; label: string; color: string }[] = [
  { id: 'acquisti',  label: 'Acquisti',  color: '#10B981' },
  { id: 'cessioni',  label: 'Cessioni',  color: '#EF4444' },
  { id: 'prestiti',  label: 'Prestiti',  color: '#0EA5E9' },
  { id: 'trattative', label: 'Rumors',   color: '#F59E0B' },
];

function getTypeIcon(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'acquisto')  return <ArrowRight  className="text-[#10B981] w-4 h-4" />;
  if (t === 'cessione')  return <ArrowLeft   className="text-[#EF4444] w-4 h-4" />;
  if (t === 'prestito')  return <ArrowRightLeft className="text-[#0EA5E9] w-4 h-4" />;
  return <RefreshCw className="text-[#F59E0B] w-4 h-4" />;
}

function getBadge(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'acquisto')  return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40';
  if (t === 'cessione')  return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40';
  if (t === 'prestito')  return 'bg-[#0EA5E9]/20 text-[#0EA5E9] border-[#0EA5E9]/40';
  return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40';
}

function getAccentColor(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'acquisto') return '#10B981';
  if (t === 'cessione') return '#EF4444';
  if (t === 'prestito') return '#0EA5E9';
  return '#F59E0B';
}

function TransferCard({ tr }: { tr: any }) {
  const isRumor = tr.status === 'Rumor';
  const accent  = isRumor ? '#F59E0B' : getAccentColor(tr.type);
  const hasFee  = tr.fee && tr.fee !== 'N/D' && tr.fee !== '';
  const hasDate = tr.date && tr.date !== '';
  const teamInfo = ALL_TEAMS.find(
    (t) =>
      t.id === tr.team_id ||
      t.name.toLowerCase() === tr.team?.toLowerCase()
  );

  return (
    <div className="bg-[var(--color-sport-card)]/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-sm relative overflow-hidden hover:border-white/15 transition-all duration-200 group">
      {/* Barra colore sinistra */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all"
        style={{ backgroundColor: accent }}
      />

      <div className="pl-3">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {teamInfo ? (
              <TeamLogo src={teamInfo.logoUrl} alt={teamInfo.name} fallbackText={teamInfo.logo} className="w-5 h-5 rounded-full" />
            ) : (
              getTypeIcon(tr.type)
            )}
            <span className="text-xs font-bold text-[var(--color-sport-muted)] truncate max-w-[120px]">
              {teamInfo?.name || tr.team || tr.team_id}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isRumor && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase border bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40">
                RUMOR
              </span>
            )}
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${getBadge(tr.type)}`}>
              {tr.type}
            </span>
          </div>
        </div>

        {/* Giocatore */}
        <div className="text-base font-black text-[var(--color-sport-text)] leading-tight mb-2 group-hover:text-white transition-colors">
          {tr.player}
        </div>

        {/* Provenienza/destinazione */}
        {tr['fromTo'] && tr['fromTo'] !== 'N/D' && (
          <div className="text-xs text-[var(--color-sport-muted)] mb-2 flex items-center gap-1">
            <span style={{ color: accent }}>↔</span>
            <span className="text-[var(--color-sport-text)]/70 font-medium">{tr['fromTo']}</span>
          </div>
        )}

        {/* Fee + Data — riga ben visibile */}
        {(hasFee || hasDate) && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
            {/* Fee / Cifra */}
            {hasFee ? (
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border"
                  style={{
                    backgroundColor: accent + '18',
                    color: accent,
                    borderColor: accent + '40',
                  }}
                >
                  <span className="text-[11px]">€</span>
                  {tr.fee}
                </div>
                {isRumor && (
                  <span className="text-[9px] font-bold text-[var(--color-sport-muted)] uppercase tracking-wider">
                    stimata
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-[var(--color-sport-muted)] font-medium italic">
                {isRumor ? 'Cifra non divulgata' : 'Quota non comunicata'}
              </div>
            )}

            {/* Data */}
            {hasDate && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-sport-muted)] uppercase tracking-wider">
                <span>📅</span>
                {tr.date}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


export default function MarketFeed() {
  const [leagueTab,   setLeagueTab]   = useState<LeagueKey>('A');
  const [filterTab,   setFilterTab]   = useState<FilterKey>('acquisti');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [allData,     setAllData]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mercato/live?league=${leagueTab}&limit=200`);
      const json = await res.json();
      setAllData(json.transfers || []);
    } catch {
      setAllData([]);
    } finally {
      setLoading(false);
    }
  }, [leagueTab]);

  useEffect(() => {
    loadData();
    setSelectedTeam(null);
    setSearchQuery('');
  }, [loadData]);

  // Filtra per squadra e ricerca
  const filtered = allData.filter((d) => {
    const matchTeam  = !selectedTeam || d.team_id === selectedTeam || d.team?.toLowerCase() === selectedTeam.toLowerCase();
    const matchQuery = !searchQuery  ||
      d.player?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.team?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d['fromTo']?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTeam && matchQuery;
  });

  // Dividi per categoria
  const acquisti   = filtered.filter((d) => (d.type || '').toLowerCase() === 'acquisto' && d.status !== 'Rumor');
  const cessioni   = filtered.filter((d) => (d.type || '').toLowerCase() === 'cessione' && d.status !== 'Rumor');
  const prestiti   = filtered.filter((d) => (d.type || '').toLowerCase() === 'prestito' && d.status !== 'Rumor');
  const trattative = filtered.filter((d) => d.status === 'Rumor' || (d.type || '').toLowerCase() === 'trattativa');

  const currentList =
    filterTab === 'acquisti'   ? acquisti :
    filterTab === 'cessioni'   ? cessioni :
    filterTab === 'prestiti'   ? prestiti : trattative;

  const activeFilter = FILTERS.find((f) => f.id === filterTab)!;

  const teamsInLeague = ALL_TEAMS.filter((t) => t.league === leagueTab);

  // Counter per ogni tab
  const counts = {
    acquisti:   acquisti.length,
    cessioni:   cessioni.length,
    prestiti:   prestiti.length,
    trattative: trattative.length,
  };

  return (
    <div className="w-full flex flex-col space-y-5">

      {/* ── Barra di Ricerca ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-sport-muted)] w-4 h-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Cerca giocatore, squadra o club..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--color-sport-card)]/70 border border-white/10 rounded-full py-3 pl-10 pr-4 text-sm text-[var(--color-sport-text)] placeholder-[var(--color-sport-muted)] focus:outline-none focus:border-[var(--color-sport-secondary)]/60 transition-colors"
        />
      </div>

      {/* ── Tabs Lega ── */}
      <div className="flex bg-[var(--color-sport-card)] p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
        {LEAGUES.map((lg) => (
          <button
            key={lg.id}
            onClick={() => setLeagueTab(lg.id)}
            className={`flex-1 py-2.5 px-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              leagueTab === lg.id
                ? 'bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)] text-white shadow-md'
                : 'text-[var(--color-sport-muted)] hover:text-white'
            }`}
          >
            {lg.label}
          </button>
        ))}
      </div>

      {/* ── Selettore Squadra ── */}
      {teamsInLeague.length > 0 && (
        <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedTeam(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
              !selectedTeam
                ? 'bg-[var(--color-sport-primary)] text-white shadow-md'
                : 'bg-[var(--color-sport-card)] text-[var(--color-sport-muted)] border border-white/10 hover:bg-white/5'
            }`}
          >
            Tutte
          </button>
          {teamsInLeague.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                selectedTeam === team.id
                  ? 'border-[var(--color-sport-primary)] bg-[var(--color-sport-primary)]/10 text-white'
                  : 'bg-[var(--color-sport-card)] border-white/10 text-[var(--color-sport-muted)] hover:bg-white/5 hover:border-white/20'
              }`}
            >
              <TeamLogo src={team.logoUrl} alt={team.name} fallbackText={team.logo} className="w-4 h-4 rounded-full flex-shrink-0" />
              <span>{team.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Tabs Filtro Categoria ── */}
      <div className="flex bg-[var(--color-sport-bg)] border-b border-white/5 overflow-x-auto no-scrollbar rounded-t-xl">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterTab(f.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-black whitespace-nowrap border-b-2 transition-all ${
              filterTab === f.id
                ? 'border-current'
                : 'border-transparent text-[var(--color-sport-muted)] hover:text-white'
            }`}
            style={filterTab === f.id ? { color: f.color, borderColor: f.color } : {}}
          >
            {f.label}
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={
                filterTab === f.id
                  ? { backgroundColor: f.color + '30', color: f.color }
                  : { backgroundColor: '#334155', color: '#94A3B8' }
              }
            >
              {counts[f.id]}
            </span>
          </button>
        ))}

        {/* Refresh */}
        <button
          onClick={loadData}
          disabled={loading}
          className="ml-auto px-3 text-[var(--color-sport-muted)] hover:text-white transition-colors disabled:opacity-50"
          title="Aggiorna"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Contenuto ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${leagueTab}-${filterTab}-${selectedTeam}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: activeFilter.color }} />
              <span className="text-xs text-[var(--color-sport-muted)] font-bold uppercase tracking-widest">
                Caricamento {activeFilter.label}...
              </span>
            </div>
          ) : currentList.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h2
                  className="font-black text-sm uppercase tracking-widest flex items-center gap-2"
                  style={{ color: activeFilter.color }}
                >
                  <TrendingUp size={14} />
                  {activeFilter.label}
                  {selectedTeam && (
                    <span className="text-[var(--color-sport-muted)] font-bold normal-case tracking-normal text-xs">
                      — {ALL_TEAMS.find((t) => t.id === selectedTeam)?.name}
                    </span>
                  )}
                </h2>
                <span className="text-[10px] font-bold text-[var(--color-sport-muted)] bg-white/5 px-2 py-0.5 rounded-full">
                  {currentList.length} movimenti
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {currentList.map((tr) => (
                  <TransferCard key={tr.id} tr={tr} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-sport-muted)]">
              <CheckCircle2 className="w-10 h-10 opacity-20" />
              <p className="font-bold text-sm">Nessun {activeFilter.label.toLowerCase()} trovato</p>
              <p className="text-xs text-center max-w-xs">
                {filterTab === 'trattative'
                  ? 'Nessuna trattativa o rumor registrata per questa selezione.'
                  : `Il cron aggiorna i dati quotidianamente. Controlla di aver lanciato /api/migrate/setup e che il cron mercato abbia già girato.`}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}} />
    </div>
  );
}
