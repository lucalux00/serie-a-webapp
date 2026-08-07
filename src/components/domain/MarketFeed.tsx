"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft, ArrowRight, ArrowLeft, RefreshCw,
  CheckCircle2, Search, Clock, Loader2, TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { ALL_TEAMS } from '@/data/teams';
import TeamLogo from '@/components/ui/TeamLogo';
import { dedupeTransfers } from '@/lib/transfers';

type LeagueKey = 'A' | 'B' | 'PL' | 'LL' | 'BL' | 'L1';
type FilterKey = 'acquisti' | 'cessioni' | 'prestiti' | 'trattative';
type SortKey = 'recent' | 'team' | 'status';

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

function formatAcquiredAt(value?: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return null;
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function getDayGroup(tr: any) {
  const timestamp = tr.created_at ? new Date(tr.created_at) : null;
  if (timestamp && !Number.isNaN(timestamp.getTime())) {
    return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .format(timestamp);
  }
  return tr.date || 'Data non disponibile';
}

function getSafeSourceUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function TransferCard({ tr }: { tr: any }) {
  const isRumor = tr.status === 'Rumor';
  const accent  = isRumor ? '#F59E0B' : getAccentColor(tr.type);
  const hasFee  = tr.fee && tr.fee !== 'N/D' && tr.fee !== '';
  const hasDate = tr.date && tr.date !== '';
  const acquiredAt = formatAcquiredAt(tr.created_at);
  const sourceUrl = getSafeSourceUrl(tr.source_url);
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
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
              isRumor
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/35'
            }`}>
              {isRumor ? 'DA CONFERMARE' : 'UFFICIALE'}
            </span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${getBadge(tr.type)}`}>
              {tr.type}
            </span>
          </div>
        </div>

        {/* Giocatore */}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-2 inline-flex items-center gap-1 text-base font-black leading-tight text-[var(--color-sport-text)] transition-colors hover:text-[#FCD34D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
          >
            {tr.player}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-label="Apri la fonte originale" />
          </a>
        ) : (
          <div className="mb-2 text-base font-black leading-tight text-[var(--color-sport-text)] transition-colors group-hover:text-white">
            {tr.player}
          </div>
        )}

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

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-[var(--color-sport-muted)]">
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#F59E0B] hover:text-[#FCD34D]">
              Leggi notizia: {tr.source_name || 'apri articolo'} <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : <span>Fonte: dati aggregati</span>}
          {acquiredAt && <span>Acquisito: {acquiredAt}</span>}
        </div>
      </div>
    </div>
  );
}


export default function MarketFeed() {
  const [leagueTab,   setLeagueTab]   = useState<LeagueKey>('A');
  const [filterTab,   setFilterTab]   = useState<FilterKey>('trattative');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [allData,     setAllData]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mercato/live?league=${leagueTab}&limit=200`);
      const json = await res.json();
      setAllData(dedupeTransfers(json.transfers || []));
      setLastUpdated(json.lastUpdated || null);
    } catch {
      setAllData([]);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, [leagueTab]);

  useEffect(() => {
    loadData();
    setSelectedTeam(null);
    setSearchQuery('');
    const interval = window.setInterval(loadData, 60_000);
    return () => window.clearInterval(interval);
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

  const sortedList = [...currentList].sort((a, b) => {
    if (sortBy === 'team') return (a.team || a.team_id || '').localeCompare(b.team || b.team_id || '', 'it');
    if (sortBy === 'status') {
      const statusDifference = Number(a.status === 'Rumor') - Number(b.status === 'Rumor');
      if (statusDifference !== 0) return statusDifference;
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  const groupedList = sortedList.reduce<Array<{ label: string; transfers: any[] }>>((groups, transfer) => {
    const label = getDayGroup(transfer);
    const currentGroup = groups.find((group) => group.label === label);
    if (currentGroup) currentGroup.transfers.push(transfer);
    else groups.push({ label, transfers: [transfer] });
    return groups;
  }, []);

  const teamsInLeague = ALL_TEAMS.filter((t) => t.league === leagueTab);

  // Counter per ogni tab
  const counts = {
    acquisti:   acquisti.length,
    cessioni:   cessioni.length,
    prestiti:   prestiti.length,
    trattative: trattative.length,
  };

  const updatedLabel = lastUpdated
    ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastUpdated))
    : null;

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

      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[10px] text-[var(--color-sport-muted)]">
        <span>Dati aggregati automaticamente: le voci <strong className="text-[#F59E0B]">Rumor</strong> richiedono conferma.</span>
        {updatedLabel && <span className="shrink-0 font-bold">Agg. {updatedLabel}</span>}
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

      <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] text-[var(--color-sport-muted)]">
          {currentList.length} movimenti mostrati. Gli ufficiali e i rumor restano sempre distinguibili.
        </p>
        <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-sport-muted)]">
          Ordina per
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="rounded-lg border border-white/10 bg-[#0B1120] px-2 py-1 text-[10px] font-black text-white outline-none focus:border-[var(--color-sport-primary)]"
          >
            <option value="recent">Più recenti</option>
            <option value="team">Squadra</option>
            <option value="status">Stato</option>
          </select>
        </label>
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
          ) : sortedList.length > 0 ? (
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
                  {sortedList.length} movimenti
                </span>
              </div>
              <div className="space-y-6">
                {groupedList.map((group) => (
                  <section key={group.label} aria-label={`Movimenti del ${group.label}`}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-px flex-1 bg-white/10" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-sport-muted)]">{group.label}</h3>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {group.transfers.map((tr) => <TransferCard key={tr.id} tr={tr} />)}
                    </div>
                  </section>
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
