"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerSheet from '@/components/domain/PlayerSheet';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

import { getTeamLogoUrl } from '@/utils/teamLogos';

// Componente Partite con dati reali da football-data.org
function PartiteTab({ team }: { team: any }) {
  const { data, error, isLoading } = useSWR(
    `/api/team-matches?teamId=${team.id}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const MatchCard = ({ match, isFinished }: { match: any, isFinished: boolean }) => {
    const isHome = match.home.id && team.id && 
      (match.home.shortName?.toLowerCase().includes(team.name?.toLowerCase().slice(0, 4)) ||
       match.home.name?.toLowerCase().includes(team.name?.toLowerCase().slice(0, 4)));
    
    const teamScore = isFinished ? (isHome ? match.score.home : match.score.away) : null;
    const oppScore = isFinished ? (isHome ? match.score.away : match.score.home) : null;
    const won = teamScore !== null && oppScore !== null && teamScore > oppScore;
    const drew = teamScore !== null && oppScore !== null && teamScore === oppScore;
    const lost = teamScore !== null && oppScore !== null && teamScore < oppScore;
    
    const resultColor = won ? '#10B981' : lost ? '#EF4444' : drew ? '#F59E0B' : team.primaryColor || '#334155';
    const resultLabel = won ? 'V' : lost ? 'P' : drew ? 'N' : null;

    const oppCrest = isHome ? match.away.crest : match.home.crest;

    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: resultColor }} />
        
        <div className="flex items-center justify-between mb-2 pl-3">
          <div className="flex items-center gap-1.5">
            {match.competitionEmblem && <img src={match.competitionEmblem} alt="" className="w-4 h-4 object-contain" loading="lazy" />}
            <span className="text-[10px] font-bold text-[#64748B] uppercase">{match.competition}</span>
            {match.matchday && <span className="text-[9px] text-[#475569]">· G{match.matchday}</span>}
          </div>
          {resultLabel && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ backgroundColor: resultColor + '22', color: resultColor }}>
              {resultLabel}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pl-3">
          {/* HOME TEAM */}
          <div className="flex flex-col items-center flex-1">
            {isHome ? (
              <>
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt="" loading="lazy" className="w-10 h-10 object-contain mb-1" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black mb-1" style={{ backgroundColor: team.primaryColor + '33', color: team.primaryColor }}>
                    {team.logo || team.name?.slice(0, 3)}
                  </div>
                )}
                <span className="text-[10px] font-bold text-center leading-tight max-w-[70px] truncate">{team.name}</span>
              </>
            ) : (
              <>
                <img src={getTeamLogoUrl(match.home.shortName || match.home.name, match.home.crest)} alt="" loading="lazy" className="w-10 h-10 object-contain mb-1" />
                <span className="text-[10px] font-bold text-center leading-tight max-w-[70px] truncate text-[#94A3B8]">{match.home.shortName || match.home.name}</span>
              </>
            )}
          </div>

          {/* Score / Date */}
          <div className="flex flex-col items-center px-3 min-w-[80px]">
            {isFinished && teamScore !== null ? (
              <>
                <div className="text-2xl font-black tracking-wide" style={{ color: resultColor }}>
                  {`${match.score.home} - ${match.score.away}`}
                </div>
                <span className="text-[9px] text-[#475569] font-bold uppercase mt-0.5">Finale</span>
              </>
            ) : (
              <>
                <div className="text-sm font-black text-[#94A3B8]">{match.timeLabel || 'TBD'}</div>
                <div className="text-[9px] text-[#475569] font-bold">
                  {match.dateLabel}
                </div>
              </>
            )}
          </div>

          {/* AWAY TEAM */}
          <div className="flex flex-col items-center flex-1">
            {!isHome ? (
              <>
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt="" loading="lazy" className="w-10 h-10 object-contain mb-1" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black mb-1" style={{ backgroundColor: team.primaryColor + '33', color: team.primaryColor }}>
                    {team.logo || team.name?.slice(0, 3)}
                  </div>
                )}
                <span className="text-[10px] font-bold text-center leading-tight max-w-[70px] truncate">{team.name}</span>
              </>
            ) : (
              <>
                <img src={getTeamLogoUrl(match.away.shortName || match.away.name, match.away.crest)} alt="" loading="lazy" className="w-10 h-10 object-contain mb-1" />
                <span className="text-[10px] font-bold text-center leading-tight max-w-[70px] truncate text-[#94A3B8]">{match.away.shortName || match.away.name}</span>
              </>
            )}
          </div>
        </div>

        {isFinished && <div className="text-[9px] text-[#475569] text-center mt-2 pl-3">{match.dateLabel}</div>}
      </div>
    );
  };

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-[#1E293B] rounded-xl border border-[#334155]" />)}
    </div>
  );

  if (error || data?.error) return (
    <div className="text-center py-12">
      <div className="text-3xl mb-3">⚽</div>
      <p className="font-bold text-[#94A3B8]">Partite non disponibili</p>
      <p className="text-xs text-[#475569] mt-1">Squadra non ancora mappata nell'archivio europeo</p>
    </div>
  );

  const { finished = [], scheduled = [] } = data || {};

  return (
    <motion.div key="partite" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {scheduled.length > 0 && (
        <div>
          <h3 className="text-sm font-black uppercase text-[#94A3B8] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse inline-block" />
            Prossime Partite
          </h3>
          <div className="space-y-3">
            {scheduled.map((m: any) => <MatchCard key={m.id} match={m} isFinished={false} />)}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div>
          <h3 className="text-sm font-black uppercase text-[#94A3B8] mb-3">Ultimi Risultati</h3>
          <div className="space-y-3">
            {finished.map((m: any) => <MatchCard key={m.id} match={m} isFinished={true} />)}
          </div>
        </div>
      )}

      {finished.length === 0 && scheduled.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-bold text-[#94A3B8]">Nessuna partita disponibile al momento</p>
          <p className="text-xs text-[#475569] mt-1">Torna a controllare quando la stagione inizierà</p>
        </div>
      )}
    </motion.div>
  );
}

export default function TeamHubClient({ team, news: initialNews, squadData, trofeiData, initialTab = 'news' }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');
  const [activeTab, setActiveTab] = useState<'news' | 'analisi' | 'rosa' | 'mercato' | 'stats' | 'trofei' | 'partite'>(initialTab as any);
  const [teamMercatoFilter, setTeamMercatoFilter] = useState<'acquisti' | 'cessioni' | 'prestiti' | 'trattative'>('acquisti');
  const [rosterView, setRosterView] = useState<'first' | 'primavera'>('first');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedTrophyGroup, setSelectedTrophyGroup] = useState<any>(null);
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);
  const [selectedMatchAnalysis, setSelectedMatchAnalysis] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [newsSummary, setNewsSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  const { data: matchdayData, isLoading: isLoadingMatchday } = useSWR(
    `/api/analisi/matchday`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Real-time news fetching with SWR
  const { data: news = initialNews } = useSWR(
    `/api/news?team=${encodeURIComponent(team.name)}&league=${encodeURIComponent(team.league)}`,
    fetcher,
    { fallbackData: initialNews, refreshInterval: 30000 }
  );

  // Nessun fetch dell'articolo completo. Mostriamo solo le Pillole.

  const topNews = news.slice(0, 4);
  const otherNews = news.slice(4);

  const activeSquad = rosterView === 'first' ? squadData?.firstTeam : squadData?.primavera;

  const openNewsModal = async (item: any) => {
    const isManual = item.source === 'Redazione';
    const targetHref = isManual ? item.link : `/notizie/leggi?url=${encodeURIComponent(item.link)}&source=${encodeURIComponent(item.source || 'News')}`;
    router.push(targetHref);
  };

  // Group trophies by name
  const groupedTrofei = React.useMemo(() => {
    if (!trofeiData) return [];
    const groups = trofeiData.reduce((acc: any, t: any) => {
      if (!acc[t.name]) acc[t.name] = { name: t.name, icon: t.icon, count: 0, items: [] };
      acc[t.name].items.push(t);
      acc[t.name].count++;
      return acc;
    }, {});
    // Sort items inside groups by year descending
    Object.values(groups).forEach((g: any) => {
      g.items.sort((a: any, b: any) => {
        const yA = parseInt(a.year.split('/')[0]);
        const yB = parseInt(b.year.split('/')[0]);
        return yB - yA;
      });
    });
    return Object.values(groups);
  }, [trofeiData]);

  // Gestione apertura automatica del trofeo tramite parametro URL
  useEffect(() => {
    if (activeTab === 'trofei' && yearParam && trofeiData && groupedTrofei.length > 0) {
      const foundTrophy = trofeiData.find((t: any) => {
        if (t.year === yearParam) return true;
        
        // Match "1925/26" with "1926" or "1925/1926"
        if (yearParam.includes('/')) {
          const parts = yearParam.split('/');
          const startYear = parts[0];
          const endYearStr = parts[1];
          const fullEndYear = startYear.slice(0, 4 - endYearStr.length) + endYearStr;
          
          if (t.year === startYear || t.year === fullEndYear || t.year.endsWith(endYearStr)) {
            return true;
          }
        }
        
        // General fallback
        return yearParam.includes(t.year) || t.year.includes(yearParam);
      });
      
      if (foundTrophy) {
        const group = groupedTrofei.find((g: any) => g.name === foundTrophy.name);
        if (group) {
          setSelectedTrophyGroup(group);
          setSelectedTrophy(foundTrophy);
        }
      }
    }
  }, [activeTab, yearParam, trofeiData, groupedTrofei]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#0B1120] text-white font-sans pb-28">
      {/* Header Immagine */}
      <div 
        className="sticky top-[56px] z-30 border-b p-4 flex items-center shadow-lg"
        style={{ backgroundColor: team.primaryColor || '#1E293B', borderColor: team.secondaryColor || '#334155' }}
      >
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-white/90">
          <ChevronLeft size={28} />
        </button>
        <div className="ml-2 flex items-center">
          <div 
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl font-black text-[#0B1120] border-2 overflow-hidden shrink-0"
            style={{ borderColor: team.secondaryColor || '#10B981' }}
          >
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} loading="lazy" className="w-full h-full object-contain p-1" />
            ) : (
              <span>{team.logo}</span>
            )}
          </div>
          <div className="ml-4 text-white">
            <h1 className="text-xl font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{team.name}</h1>
            <span className="text-xs font-semibold uppercase opacity-90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {team.league === 'A' ? 'Serie A' : team.league === 'B' ? 'Serie B' : team.league === 'PL' ? 'Premier League' : team.league === 'LL' ? 'La Liga' : team.league === 'BL' ? 'Bundesliga' : team.league === 'L1' ? 'Ligue 1' : team.league}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#334155] bg-[#1E293B] sticky top-[136px] z-20 overflow-x-auto no-scrollbar shadow-md">
        <button 
          onClick={() => setActiveTab('news')} 
          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'news' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          style={activeTab === 'news' ? { borderColor: team.primaryColor || '#10B981', color: team.primaryColor || '#10B981' } : {}}
        >
          NEWS (PILLOLE)
        </button>
        <button 
          onClick={() => setActiveTab('analisi')} 
          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'analisi' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          style={activeTab === 'analisi' ? { borderColor: team.primaryColor || '#10B981', color: team.primaryColor || '#10B981' } : {}}
        >
          ANALISI
        </button>
        <button 
          onClick={() => setActiveTab('partite')} 
          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'partite' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          style={activeTab === 'partite' ? { borderColor: team.primaryColor || '#10B981', color: team.primaryColor || '#10B981' } : {}}
        >
          PARTITE
        </button>
        <button 
          onClick={() => setActiveTab('rosa')} 
          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'rosa' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          style={activeTab === 'rosa' ? { borderColor: team.primaryColor || '#10B981', color: team.primaryColor || '#10B981' } : {}}
        >
          ROSA
        </button>
        <button 
          onClick={() => setActiveTab('mercato')} 
          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'mercato' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          style={activeTab === 'mercato' ? { borderColor: team.primaryColor || '#10B981', color: team.primaryColor || '#10B981' } : {}}
        >
          MERCATO
        </button>
        <button 
          onClick={() => setActiveTab('stats')} 
          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'stats' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          style={activeTab === 'stats' ? { borderColor: team.primaryColor || '#10B981', color: team.primaryColor || '#10B981' } : {}}
        >
          STATISTICHE
        </button>
        <button 
          onClick={() => setActiveTab('trofei')} 
          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'trofei' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          style={activeTab === 'trofei' ? { borderColor: team.primaryColor || '#10B981', color: team.primaryColor || '#10B981' } : {}}
        >
          TROFEI
        </button>
      </div>

      {/* Contenuto Tabs */}
      <div className="p-4 flex-1">
        <AnimatePresence mode="wait">
          
          {/* TAB: NEWS (PILLOLE) */}
          {activeTab === 'news' && (
            <motion.div key="news" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              {news.length > 0 ? (
                <div className="space-y-3 relative">
                  <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-[#334155]" />
                  {[...news]
                    .sort((a: any, b: any) => {
                       const tA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
                       const tB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
                       return tB - tA;
                    })
                    .map((item: any, idx: number) => {
                      const pubTs = item.pubDate ? new Date(item.pubDate).getTime() : 0;
                      const isNew = pubTs > 0 && (Date.now() - pubTs < 24 * 60 * 60 * 1000);
                      const rawTitle = item.cleanTitle || item.title || 'Notizia senza titolo';
                      const displayTitle = typeof document !== 'undefined' ? (() => { const t = document.createElement('textarea'); t.innerHTML = rawTitle; return t.value; })() : rawTitle;
                      const displayDate = item.pubDate 
                        ? new Date(item.pubDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '';
                      const snippet = item.snippet && item.snippet.length > 30 ? item.snippet : "Nessun estratto testuale disponibile.";

                      return (
                        <div key={idx} className="relative pl-12">
                          <div className="absolute left-[22px] top-4 w-3 h-3 bg-[#0EA5E9] rounded-full ring-4 ring-[#0F172A]" />
                          <button onClick={() => openNewsModal(item)} className="w-full text-left bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-sm relative overflow-hidden transition-transform active:scale-[0.98] hover:border-[#0EA5E9]/50">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold px-2 py-1 bg-[#0F172A] text-[#38BDF8] rounded">
                                {item.source || 'News'}
                                {item.relatedSources && item.relatedSources.length > 0 && (
                                  <span className="text-[#64748B] ml-1 font-normal">+ altre {item.relatedSources.length} fonti</span>
                                )}
                              </span>
                              <div className="flex items-center gap-2">
                                {isNew && (
                                  <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                                    Flash
                                  </span>
                                )}
                                <span className="text-[10px] text-[#94A3B8] font-bold">{displayDate}</span>
                              </div>
                            </div>
                            <h3 className="text-sm font-bold leading-tight text-white mb-2">{displayTitle}</h3>
                            <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">{snippet}</p>
                            <div className="mt-3 pt-3 border-t border-[#334155] flex justify-between items-center">
                              <span className="text-[10px] text-[#94A3B8] font-bold">Clicca per il riassunto AI</span>
                              <span className="text-[10px] text-[#0EA5E9] font-black uppercase tracking-widest flex items-center">
                                Leggi <ArrowRightLeft size={10} className="ml-1" />
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                  })}
                </div>
              ) : (
                <div className="text-center text-[#94A3B8] font-medium py-10">Nessuna pillola disponibile.</div>
              )}
            </motion.div>
          )}

          {/* TAB: ANALISI */}
          {activeTab === 'analisi' && (
            <motion.div key="analisi" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              
              <div className="bg-[#1E293B] border-l-4 border-[#10B981] p-4 rounded-r-xl shadow-md flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-1">Hub Analisi Tattica</h3>
                  <div className="text-white font-bold text-base">
                    Giornata {matchdayData?.matchday || '...'} <span className="text-[#10B981] text-sm ml-2">(Serie A 26/27)</span>
                  </div>
                </div>
              </div>

              {isLoadingMatchday ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#0EA5E9] text-[10px] font-black uppercase mt-4 animate-pulse">Caricamento Matchday...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchdayData?.matches?.map((match: any, idx: number) => {
                    const isMyTeam = match.homeTeam.includes(team.name?.slice(0,4)) || match.awayTeam.includes(team.name?.slice(0,4));
                    return (
                      <button 
                        key={match.id}
                        onClick={() => setSelectedMatchAnalysis(match)}
                        className={`w-full bg-[#0F172A] border ${isMyTeam ? 'border-[#0EA5E9]' : 'border-[#334155]'} rounded-xl p-4 shadow-sm active:scale-95 transition-transform relative overflow-hidden`}
                      >
                        {isMyTeam && <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#0EA5E9] rounded-bl-lg text-white font-black text-[9px] uppercase">Il tuo Match</div>}
                        
                        <div className="flex justify-between items-center w-full">
                          <div className="flex flex-col items-center w-[40%]">
                            {match.homeCrest ? <img src={match.homeCrest} className="w-10 h-10 object-contain mb-1" /> : <div className="w-10 h-10 rounded-full bg-[#1E293B] mb-1" />}
                            <span className="text-xs font-bold text-white truncate w-full text-center">{match.homeTeam}</span>
                          </div>
                          <div className="flex flex-col items-center w-[20%]">
                            <span className="text-[#0EA5E9] font-black text-xs uppercase mb-1">VS</span>
                            <span className="text-[9px] text-[#64748B] font-bold uppercase">{new Date(match.date).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className="flex flex-col items-center w-[40%]">
                            {match.awayCrest ? <img src={match.awayCrest} className="w-10 h-10 object-contain mb-1" /> : <div className="w-10 h-10 rounded-full bg-[#1E293B] mb-1" />}
                            <span className="text-xs font-bold text-white truncate w-full text-center">{match.awayTeam}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#334155] flex justify-between items-center">
                          <span className="text-[10px] text-[#94A3B8] font-bold">Clicca per l'analisi tattica</span>
                          <span className="text-[10px] text-[#10B981] font-black uppercase tracking-widest flex items-center">
                            Apri <ArrowRightLeft size={10} className="ml-1" />
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: PARTITE - DATI REALI */}
          {activeTab === 'partite' && (
            <PartiteTab team={team} />
          )}

          {/* TAB: ROSA */}
          {activeTab === 'rosa' && activeSquad && (
            <motion.div key="rosa" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              
              {/* Pill Toggle */}
              <div className="flex bg-[#1E293B] p-1 rounded-full border border-[#334155]">
                <button 
                  onClick={() => setRosterView('first')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${rosterView === 'first' ? 'bg-[#10B981] text-[#0F172A]' : 'text-[#94A3B8]'}`}
                >
                  Prima Squadra
                </button>
                <button 
                  onClick={() => setRosterView('primavera')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${rosterView === 'primavera' ? 'bg-[#10B981] text-[#0F172A]' : 'text-[#94A3B8]'}`}
                >
                  Primavera U19
                </button>
              </div>

              <div className="bg-[#1E293B] border border-[#10B981] rounded-xl p-4 mb-4 active:scale-95 cursor-pointer" onClick={() => setSelectedPlayer({...activeSquad.coach, isStaff: true})}>
                <h3 className="text-xs text-[#94A3B8] uppercase font-bold mb-1">{activeSquad.coach.role} ({activeSquad.coach.module})</h3>
                <div className="font-bold text-lg">{activeSquad.coach.name}</div>
              </div>

              <div className="mb-6">
                <h3 className="text-[#94A3B8] uppercase font-bold text-sm mb-3 border-b border-[#334155] pb-2">Staff Tecnico</h3>
                <div className="space-y-2">
                  {activeSquad.staff.map((s: any, idx: number) => (
                    <div key={idx} onClick={() => setSelectedPlayer({...s, isStaff: true})} className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 flex items-center justify-between active:scale-95 cursor-pointer">
                      <div className="text-sm font-bold">{s.name}</div>
                      <div className="text-xs text-[#0EA5E9] font-bold uppercase">{s.role}</div>
                    </div>
                  ))}
                </div>
              </div>

              {['POR', 'DIF', 'CEN', 'ATT'].map(pos => {
                const posLabels: Record<string,string> = { POR: '🧤 Portieri', DIF: '🛡️ Difensori', CEN: '⚙️ Centrocampisti', ATT: '⚡ Attaccanti' };
                const posColors: Record<string,string> = { POR: '#F59E0B', DIF: '#3B82F6', CEN: '#10B981', ATT: '#EF4444' };
                const playersInPos = activeSquad.players.filter((p: any) => p.position === pos);
                if (playersInPos.length === 0) return null;
                return (
                  <div key={pos} className="mb-6">
                    <h3 className="font-black text-base mb-3 border-b border-[#334155] pb-2 flex items-center gap-2" style={{ color: posColors[pos] }}>
                      {posLabels[pos]}
                      <span className="text-[10px] text-[#94A3B8] font-bold ml-1">({playersInPos.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {playersInPos.map((player: any) => (
                        <div 
                          key={player.id} 
                          onClick={() => setSelectedPlayer(player)}
                          className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 flex flex-col justify-center active:scale-95 cursor-pointer hover:border-[#334155]/80 transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: posColors[pos] }}></div>
                          <div className="flex items-center pl-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs mr-3 shrink-0 text-white"
                              style={{ backgroundColor: posColors[pos] + '33', border: `1px solid ${posColors[pos]}55`, color: posColors[pos] }}
                            >
                              {player.number || '?'}
                            </div>
                            <div className="truncate flex-1">
                              <div className="text-sm font-bold truncate leading-tight">{player.name}</div>
                              {player.roleLabel && (
                                <div className="text-[10px] text-[#64748B] truncate mt-0.5">{player.roleLabel}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* TAB: MERCATO */}
          {activeTab === 'mercato' && squadData && (
            <motion.div key="mercato" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              
              {/* Tabs Filtro Categoria */}
              <div className="flex bg-[#0F172A] border-b border-[#334155] overflow-x-auto no-scrollbar">
                {[
                  { id: 'acquisti', label: 'Acquisti' },
                  { id: 'cessioni', label: 'Cessioni' },
                  { id: 'prestiti', label: 'Prestiti' },
                  { id: 'trattative', label: 'Trattative' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTeamMercatoFilter(tab.id as any)}
                    className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${teamMercatoFilter === tab.id ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {(() => {
                const acquisti = squadData.transfers.filter((t: any) => t.type.toLowerCase().includes('acquisto') && !t.type.toLowerCase().includes('prestito'));
                const cessioni = squadData.transfers.filter((t: any) => t.type.toLowerCase().includes('cessione') && !t.type.toLowerCase().includes('prestito'));
                const prestiti = squadData.transfers.filter((t: any) => t.type.toLowerCase().includes('prestito'));

                const renderTransferCard = (tr: any, colorHex: string, icon: any) => {
                  let StatusIcon = Clock;
                  if (tr.status === 'Conclusa' || tr.status === 'Ufficiale' || tr.status === 'ufficiale') StatusIcon = CheckCircle2;
                  if (tr.status === 'Fallita') StatusIcon = XCircle;

                  return (
                    <div key={tr.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-sm relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[${colorHex}]`} style={{ backgroundColor: colorHex }} />
                      <div className="flex justify-between items-start mb-2 pl-2 border-b border-[#334155] pb-2">
                        <div className="flex items-center space-x-2">
                          <span style={{ color: colorHex }}>{icon}</span>
                          <span className="font-bold text-sm text-white uppercase tracking-wider">{tr.type}</span>
                        </div>
                        <span className={`text-[10px] font-black flex items-center uppercase text-[${colorHex}]`} style={{ color: colorHex }}>
                          <StatusIcon size={12} className="mr-1" /> {tr.status || 'Ufficiale'}
                        </span>
                      </div>
                      <div className="pl-2">
                        <div className="font-black text-lg text-[#F8FAFC] leading-tight mb-1">{tr.player}</div>
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <span className="text-[#94A3B8] font-medium">Controparte: <strong className="text-white">{tr.otherTeam}</strong></span>
                          <span className="font-black" style={{ color: colorHex }}>{tr.fee}</span>
                        </div>
                        {tr.salary && (
                          <div className="flex justify-between items-center mt-1 text-xs border-t border-[#334155] pt-1">
                            <span className="text-[#94A3B8] font-medium">Stipendio:</span>
                            <span className="font-black text-[#0EA5E9]">{tr.salary}</span>
                          </div>
                        )}
                        <div className="text-[10px] mt-2 text-right text-[#64748B] uppercase font-bold tracking-widest">{tr.date}</div>
                      </div>
                    </div>
                  );
                };

                return (
                  <AnimatePresence mode="wait">
                    <motion.div key={teamMercatoFilter} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      
                      {teamMercatoFilter === 'acquisti' && (
                        <div className="grid grid-cols-1 gap-3">
                          <h2 className="flex items-center text-[#10B981] font-black text-sm uppercase tracking-widest mb-2 border-b border-[#334155] pb-2">
                            <CheckCircle2 size={16} className="mr-2" /> Acquisti Definitivi
                          </h2>
                          {acquisti.length > 0 ? acquisti.map((t:any) => renderTransferCard(t, '#10B981', <ArrowRightLeft size={14}/>)) : <div className="text-sm text-[#64748B] p-4">Nessun acquisto definitivo registrato.</div>}
                        </div>
                      )}

                      {teamMercatoFilter === 'cessioni' && (
                        <div className="grid grid-cols-1 gap-3">
                          <h2 className="flex items-center text-[#EF4444] font-black text-sm uppercase tracking-widest mb-2 border-b border-[#334155] pb-2">
                            <XCircle size={16} className="mr-2" /> Cessioni Definitive
                          </h2>
                          {cessioni.length > 0 ? cessioni.map((t:any) => renderTransferCard(t, '#EF4444', <ArrowRightLeft size={14}/>)) : <div className="text-sm text-[#64748B] p-4">Nessuna cessione definitiva registrata.</div>}
                        </div>
                      )}

                      {teamMercatoFilter === 'prestiti' && (
                        <div className="grid grid-cols-1 gap-3">
                          <h2 className="flex items-center text-[#0EA5E9] font-black text-sm uppercase tracking-widest mb-2 border-b border-[#334155] pb-2">
                            <ArrowRightLeft size={16} className="mr-2" /> Movimenti in Prestito
                          </h2>
                          {prestiti.length > 0 ? prestiti.map((t:any) => renderTransferCard(t, '#0EA5E9', <ArrowRightLeft size={14}/>)) : <div className="text-sm text-[#64748B] p-4">Nessun prestito registrato.</div>}
                        </div>
                      )}

                      {teamMercatoFilter === 'trattative' && (() => {
                        const rumors = squadData.transfers.filter((t: any) => 
                          t.status?.toLowerCase().includes('trattativa') || 
                          t.status?.toLowerCase().includes('rumor') ||
                          t.type.toLowerCase().includes('trattativa') || 
                          t.type.toLowerCase().includes('rumor')
                        );

                        return (
                        <div className="grid grid-cols-1 gap-3">
                          {rumors.length > 0 && (
                            <>
                              <h2 className="flex items-center text-[#F59E0B] font-black text-sm uppercase tracking-widest mb-2 border-b border-[#334155] pb-2">
                                <Clock size={16} className="mr-2" /> Calciomercato {team.name}
                              </h2>
                              {rumors.map((r: any, idx: number) => (
                                <div key={idx} className="bg-[#1E293B] border border-[#F59E0B]/50 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B]" />
                                  <div className="flex justify-between items-start mb-2 pl-2 border-b border-[#334155] pb-2">
                                    <div className="flex items-center space-x-2">
                                      <Clock size={14} className="text-[#F59E0B]" />
                                      <span className="font-bold text-sm text-white uppercase tracking-wider">{r.type === 'IN' ? 'Acquisto' : r.type === 'OUT' ? 'Cessione' : r.type}</span>
                                    </div>
                                    <span className="text-[10px] font-black flex items-center uppercase text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-1 rounded">
                                      {r.status}
                                    </span>
                                  </div>
                                  <div className="pl-2">
                                    <div className="font-black text-lg text-[#F8FAFC] leading-tight mb-1">{r.player}</div>
                                    <div className="flex justify-between items-center mt-2 text-xs">
                                      <span className="text-[#94A3B8] font-medium">Controparte: <strong className="text-white">{r.otherTeam || r.from}</strong></span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-xs border-t border-[#334155] pt-1">
                                      <span className="text-[#94A3B8] font-medium">Valutazione:</span>
                                      <span className="font-black text-[#F59E0B] text-right">{r.fee}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                          {rumors.length === 0 && (
                             <div className="text-sm text-[#64748B] p-4">Nessun rumor o trattativa confermata in questo momento.</div>
                          )}
                          <h2 className="flex items-center text-[#0EA5E9] font-black text-sm uppercase tracking-widest mb-2 border-b border-[#334155] pb-2 mt-4">
                            <ArrowRightLeft size={16} className="mr-2" /> Mercato Globale (Feed X)
                          </h2>
                          <div className="bg-[#1E293B] rounded-xl overflow-hidden h-[500px] border border-[#334155] flex flex-col relative">
                            <div className="absolute inset-0 z-0 flex items-center justify-center text-[#64748B] text-xs uppercase tracking-widest animate-pulse font-bold">
                              Caricamento Rumors...
                            </div>
                            <div className="z-10 w-full h-full overflow-y-auto no-scrollbar relative bg-[#0F172A]">
                              <a className="twitter-timeline" data-theme="dark" data-chrome="noheader nofooter noborders transparent" href="https://twitter.com/FabrizioRomano?ref_src=twsrc%5Etfw">
                              </a> 
                              <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
                            </div>
                          </div>
                        </div>
                        );
                      })()}

                    </motion.div>
                  </AnimatePresence>
                );
              })()}
            </motion.div>
          )}

          {/* TAB: STATISTICHE */}
          {activeTab === 'stats' && squadData && (
            <motion.div key="stats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-lg">
                <h3 className="font-black text-[#10B981] text-xl mb-4">Metriche Stagionali (Prima Squadra)</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Possesso Palla</span>
                      <span>54.2%</span>
                    </div>
                    <div className="h-2 w-full bg-[#0F172A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#10B981] w-[54.2%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Expected Goals (xG)</span>
                      <span>1.84 / match</span>
                    </div>
                    <div className="h-2 w-full bg-[#0F172A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0EA5E9] w-[75%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Precisione Passaggi</span>
                      <span>88.1%</span>
                    </div>
                    <div className="h-2 w-full bg-[#0F172A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#F59E0B] w-[88.1%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: TROFEI */}
          {activeTab === 'trofei' && (
            <motion.div key="trofei" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#F59E0B]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden">
                <div className="absolute -top-4 -right-4 opacity-5 text-9xl">🏆</div>
                <h2 className="text-2xl font-black text-[#F59E0B] mb-2 uppercase tracking-widest drop-shadow-md">Hall of Fame</h2>
                <p className="text-sm text-[#94A3B8] mb-4">Database Storico ufficiale dei trofei aggiornato al 2026.</p>
                <div className="inline-block px-3 py-1 bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] text-[10px] font-black uppercase tracking-widest rounded-lg mb-6">
                  Sincronizzazione Live Attiva
                </div>
                
                {/* Visualizzazione Gruppi di Trofei */}
                {!selectedTrophyGroup ? (
                  groupedTrofei.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {groupedTrofei.map((group: any, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedTrophyGroup(group)}
                          className="bg-[#0F172A]/80 border border-[#10B981] hover:bg-[#1E293B] cursor-pointer active:scale-95 rounded-xl p-4 backdrop-blur-sm flex items-center justify-between shadow-md transition-all text-left w-full"
                        >
                          <div className="flex items-center">
                            <div className="text-3xl mr-3">{group.icon}</div>
                            <div>
                              <div className="font-black text-lg text-white">
                                {group.name}
                              </div>
                              <div className="text-[#10B981] font-bold text-xs uppercase tracking-widest">
                                {group.count} {group.count === 1 ? 'Vittoria' : 'Vittorie'}
                              </div>
                            </div>
                          </div>
                          <div className="text-[#94A3B8] opacity-50">
                            <ChevronLeft className="rotate-180" size={20} />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-[#94A3B8] font-medium py-10">Nessun dato storico trovato o la squadra non ha trofei maggiori.</div>
                  )
                ) : (
                  /* Visualizzazione Annate per un Trofeo specifico */
                  <div className="space-y-4">
                    <button 
                      onClick={() => setSelectedTrophyGroup(null)}
                      className="flex items-center text-[#0EA5E9] font-bold text-sm mb-4 active:scale-95"
                    >
                      <ChevronLeft size={16} className="mr-1" /> Torna ai Trofei
                    </button>
                    
                    <div className="flex items-center mb-6 border-b border-[#334155] pb-4">
                      <div className="text-4xl mr-3">{selectedTrophyGroup.icon}</div>
                      <div>
                        <h3 className="text-xl font-black text-white">{selectedTrophyGroup.name}</h3>
                        <p className="text-xs font-bold text-[#94A3B8] uppercase">Seleziona un'annata per i dettagli</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {selectedTrophyGroup.items.map((trofeo: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => (trofeo.formation || (trofeo.roster && trofeo.roster.length > 0)) && setSelectedTrophy(trofeo)}
                          className={`bg-[#1E293B] border ${(trofeo.formation || (trofeo.roster && trofeo.roster.length > 0)) ? 'border-[#10B981] cursor-pointer hover:bg-[#334155] active:scale-95' : 'border-[#334155] cursor-default opacity-60'} rounded-xl p-3 flex flex-col items-center justify-center transition-all`}
                        >
                          <span className="font-black text-lg text-white">{trofeo.year}</span>
                          <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest mt-1">
                            {(trofeo.formation || (trofeo.roster && trofeo.roster.length > 0)) ? 'Vedi Dettagli' : 'Dati non disp.'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PlayerSheet player={selectedPlayer} teamName={team.name} onClose={() => setSelectedPlayer(null)} />

      {/* Match Analysis Modal */}
      <AnimatePresence>
        {selectedMatchAnalysis && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedMatchAnalysis(null)}
              className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#1E293B] border-t border-[#334155] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col"
            >
              <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-6 py-5 border-b border-[#334155] rounded-t-3xl shrink-0 relative overflow-hidden">
                <div className="w-12 h-1.5 bg-[#334155] rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-3">
                    {selectedMatchAnalysis.homeCrest && <img src={selectedMatchAnalysis.homeCrest} className="w-10 h-10 object-contain drop-shadow-md" />}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">Casa</span>
                      <span className="text-sm font-black text-white">{selectedMatchAnalysis.homeTeam}</span>
                    </div>
                  </div>
                  <span className="text-[#0EA5E9] font-black text-xl italic px-2">VS</span>
                  <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">Trasferta</span>
                      <span className="text-sm font-black text-white">{selectedMatchAnalysis.awayTeam}</span>
                    </div>
                    {selectedMatchAnalysis.awayCrest && <img src={selectedMatchAnalysis.awayCrest} className="w-10 h-10 object-contain drop-shadow-md" />}
                  </div>
                </div>

                <button onClick={() => setSelectedMatchAnalysis(null)} className="absolute top-4 right-4 p-2 bg-[#334155]/50 hover:bg-[#334155] rounded-full text-white transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar flex-1 text-[#E2E8F0] text-[15px] leading-relaxed relative">
                <div className="flex justify-around mb-6 bg-[#0F172A] p-3 rounded-xl border border-[#334155]">
                  <div className="text-center">
                    <div className="text-[10px] text-[#64748B] font-bold uppercase">Spettatori</div>
                    <div className="font-black text-[#10B981]">{selectedMatchAnalysis.attendance}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[#64748B] font-bold uppercase">Biglietti</div>
                    <div className="font-black text-[#0EA5E9]">{selectedMatchAnalysis.ticketCost}</div>
                  </div>
                </div>

                <div 
                  className="whitespace-pre-wrap font-medium leading-loose prose prose-invert max-w-none prose-headings:text-[#0EA5E9] prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-6 prose-li:my-1 prose-ul:my-2"
                  dangerouslySetInnerHTML={{ __html: selectedMatchAnalysis.markdownAnalysis.replace(/\n/g, '<br/>') }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

        {/* Trophy Sheet Modal */}
        <AnimatePresence>
          {selectedTrophy && (
            <>
              <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTrophy(null)}
              className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1E293B] border-t border-[#334155] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col max-h-[85vh]"
            >
              <div className="bg-[#1E293B] px-6 py-4 border-b border-[#334155] flex justify-between items-start rounded-t-3xl shrink-0">
                <div className="w-12 h-1.5 bg-[#334155] rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
                <div className="pr-4 mt-2 flex-1">
                  <div className="text-4xl mb-2">{selectedTrophy.icon}</div>
                  <h2 className="text-xl font-black leading-tight text-white">{selectedTrophy.name}</h2>
                  <div className="text-[#10B981] font-bold text-xs uppercase tracking-widest mt-1">
                    Trionfo: {selectedTrophy.year}
                  </div>
                </div>
                <button onClick={() => setSelectedTrophy(null)} className="p-2 bg-[#334155] rounded-full text-white mt-2 shrink-0 ml-2">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-6">
                <div>
                  <h3 className="text-xs text-[#94A3B8] font-black uppercase tracking-widest mb-2 border-b border-[#334155] pb-2">Allenatore</h3>
                  <div className="text-lg font-bold text-white">{selectedTrophy.coach}</div>
                </div>
                <div>
                    <h3 className="text-xs text-[#94A3B8] font-black uppercase tracking-widest mb-2 border-b border-[#334155] pb-2">Risultato / Punti</h3>
                    <div className="text-lg font-bold text-[#F59E0B]">{selectedTrophy.points}</div>
                  </div>
                  
                  {/* CHAMPIONS LEAGUE / FINALE STATS */}
                  {selectedTrophy.runnerUp && (
                    <div className="col-span-1 sm:col-span-2 bg-[#0B1120] p-4 rounded-xl border border-[#1E293B]">
                      <h3 className="text-xs text-[#94A3B8] font-black uppercase tracking-widest mb-4 border-b border-[#334155] pb-2">Dettagli Finale</h3>
                      
                      <div className="flex justify-between items-center bg-[#1E293B] p-4 rounded-lg mb-4">
                        <div className="text-center w-1/3">
                          <span className="block text-sm font-bold text-white truncate">{team.name}</span>
                          <span className="text-xs text-[#10B981]">Vincitore</span>
                        </div>
                        <div className="text-center w-1/3">
                          <span className="block text-2xl font-black text-[#F59E0B]">{selectedTrophy.score}</span>
                        </div>
                        <div className="text-center w-1/3">
                          <span className="block text-sm font-bold text-[#94A3B8] truncate">{selectedTrophy.runnerUp}</span>
                          <span className="text-xs text-[#EF4444]">Sconfitto</span>
                        </div>
                      </div>

                      {selectedTrophy.stadium && (
                        <div className="text-center mb-4 text-xs text-[#64748B]">
                          📍 Stadio: <span className="text-[#94A3B8]">{selectedTrophy.stadium}</span>
                        </div>
                      )}

                      {selectedTrophy.stats && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest text-center mb-2">Statistiche Partita</h4>
                          {Object.entries(selectedTrophy.stats).map(([key, value]) => {
                            const [val1, val2] = (value as string).split(' - ');
                            const label = key === 'possession' ? 'Possesso Palla' : key === 'shots' ? 'Tiri Totali' : key === 'shotsOnTarget' ? 'Tiri in Porta' : key === 'corners' ? 'Calci d\'Angolo' : key === 'fouls' ? 'Falli' : key;
                            return (
                              <div key={key} className="flex items-center justify-between text-xs">
                                <span className="w-8 text-right font-bold text-white">{val1}</span>
                                <span className="text-[#64748B] uppercase text-[10px] tracking-wider">{label}</span>
                                <span className="w-8 text-left font-bold text-[#94A3B8]">{val2}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 col-span-1 sm:col-span-2">
                    <h3 className="text-xs text-[#94A3B8] font-black uppercase tracking-widest mb-4 border-b border-[#334155] pb-2">
                      Rosa Completa
                    </h3>
                  
                  {/* NUOVO FORMATO (Oggetti con ruolo e isStarter) */}
                  {selectedTrophy.roster && selectedTrophy.roster.length > 0 && typeof selectedTrophy.roster[0] === 'object' ? (
                    <div className="flex flex-col space-y-4">
                      {['POR', 'DIF', 'CEN', 'ATT'].map(role => {
                        const playersInRole = selectedTrophy.roster.filter((p: any) => p.role === role);
                        if (playersInRole.length === 0) return null;
                        
                        return (
                          <div key={role}>
                            <h4 className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 flex items-center">
                              <span className="w-6 h-px bg-[#334155] inline-block mr-2"></span>
                              {role === 'POR' ? 'Portieri' : role === 'DIF' ? 'Difensori' : role === 'CEN' ? 'Centrocampisti' : 'Attaccanti'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {playersInRole.map((player: any, idx: number) => (
                                <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${player.isStarter ? 'bg-[#1E293B] border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.05)]' : 'bg-[#0F172A] border-[#334155] opacity-80 hover:opacity-100'}`}>
                                  <div className="flex items-center">
                                    <div className={`text-[9px] font-black w-8 text-center rounded mr-3 py-1 ${player.isStarter ? 'bg-[#10B981] text-[#0F172A]' : 'bg-[#334155] text-[#94A3B8]'}`}>
                                      {player.role}
                                    </div>
                                    <span className={`text-[13px] ${player.isStarter ? 'text-white font-black' : 'text-[#E2E8F0] font-semibold'}`}>
                                      {player.name}
                                    </span>
                                  </div>
                                  {player.isStarter && (
                                    <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_5px_#10B981]" title="Titolare"></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* VECCHIO FORMATO / FALLBACK */
                    <>
                      {selectedTrophy.formation && selectedTrophy.formation.length > 0 && (
                        <div>
                          <h4 className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 flex items-center">
                            <span className="w-6 h-px bg-[#334155] inline-block mr-2"></span>
                            Formazione Tipo (Storico)
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {selectedTrophy.formation.map((player: string, i: number) => (
                              <div key={i} className="bg-[#1E293B] border border-[#10B981] rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm cursor-default">
                                {player}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedTrophy.roster && selectedTrophy.roster.length > 0 && typeof selectedTrophy.roster[0] === 'string' && (
                        <div>
                          <h4 className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 flex items-center">
                            <span className="w-6 h-px bg-[#334155] inline-block mr-2"></span>
                            Altri giocatori
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedTrophy.roster.map((player: string, i: number) => (
                              <div key={`r-${i}`} className="bg-[#0F172A] border border-[#334155] rounded-full px-3 py-1.5 text-xs font-medium text-[#94A3B8] cursor-default">
                                {player}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* News Summary Modal */}
      <AnimatePresence>
        {selectedNews && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] sm:h-[80vh] sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl bg-[#0F172A] rounded-t-3xl sm:rounded-3xl shadow-2xl z-[101] flex flex-col overflow-hidden border border-[#334155]"
            >
              <div className="sticky top-0 bg-[#0F172A]/80 backdrop-blur-md border-b border-[#334155] p-4 flex justify-between items-start z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-[#1E293B] text-[#38BDF8] rounded">
                      {selectedNews.source || 'News'}
                    </span>
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
                      Riassunto AI
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white leading-tight">
                    {selectedNews.cleanTitle || selectedNews.title}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="bg-[#1E293B] text-[#94A3B8] hover:text-white p-2 rounded-full transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar relative">
                {isSummarizing ? (
                  <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <div className="w-10 h-10 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-[#0EA5E9] animate-pulse">L'AI sta leggendo l'articolo per te...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="prose prose-invert max-w-none text-sm text-[#E2E8F0] leading-relaxed">
                      {newsSummary.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="mb-4">{paragraph}</p>
                      ))}
                    </div>

                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col items-center justify-center text-center mt-8">
                      <p className="text-xs text-[#94A3B8] mb-3">Questo è un riassunto generato dall'intelligenza artificiale. Per i dettagli completi, supporta il lavoro dei giornalisti leggendo l'articolo originale.</p>
                      <a 
                        href={selectedNews.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white font-bold text-sm px-6 py-3 rounded-full hover:shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all flex items-center"
                      >
                        Leggi l'articolo originale su {selectedNews.source}
                        <ArrowRightLeft size={16} className="ml-2" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
