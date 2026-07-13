"use client";

import React, { useState } from 'react';
import { ChevronLeft, ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerSheet from '@/components/domain/PlayerSheet';

export default function TeamHubClient({ team, news, squadData, trofeiData }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'news' | 'rosa' | 'mercato' | 'stats' | 'trofei'>('news');
  const [rosterView, setRosterView] = useState<'first' | 'primavera'>('first');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);
  const [fullArticleText, setFullArticleText] = useState<string>('');
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false);

  // Fetch full article when selectedNews changes
  React.useEffect(() => {
    if (selectedNews && selectedNews.link) {
      setLoadingArticle(true);
      setFullArticleText('');
      // Passa anche lo snippet RSS - se disponibile e lungo abbastanza, viene usato direttamente senza scraping
      const snippetParam = selectedNews.snippet && selectedNews.snippet.length > 100 
        ? `&snippet=${encodeURIComponent(selectedNews.snippet)}` 
        : '';
      fetch(`/api/news/read?url=${encodeURIComponent(selectedNews.link)}${snippetParam}`)
        .then(res => res.json())
        .then(data => {
          setFullArticleText(data.content || "Testo non disponibile.");
          setLoadingArticle(false);
        })
        .catch(() => {
          setFullArticleText("Errore durante l'estrazione dell'articolo.");
          setLoadingArticle(false);
        });
    }
  }, [selectedNews]);

  const topNews = news.slice(0, 4);
  const otherNews = news.slice(4);

  const activeSquad = rosterView === 'first' ? squadData?.firstTeam : squadData?.primavera;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#0B1120] text-white font-sans pb-28">
      {/* Header Immagine */}
      <div className="sticky top-[56px] z-30 bg-[#1E293B] border-b border-[#334155] p-4 flex items-center shadow-lg">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-[#94A3B8]">
          <ChevronLeft size={28} />
        </button>
        <div className="ml-2 flex items-center">
          <div className="w-12 h-12 bg-[#0F172A] rounded-full flex items-center justify-center text-xl font-black text-white border-2 border-[#10B981]">
            {team.logo}
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-bold">{team.name}</h1>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase">Serie {team.league}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#334155] bg-[#1E293B] sticky top-[136px] z-20 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('news')} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'news' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}>
          NEWS
        </button>
        <button onClick={() => setActiveTab('rosa')} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'rosa' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}>
          ROSA
        </button>
        <button onClick={() => setActiveTab('mercato')} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'mercato' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}>
          MERCATO
        </button>
        <button onClick={() => setActiveTab('stats')} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'stats' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}>
          STATISTICHE
        </button>
        <button onClick={() => setActiveTab('trofei')} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'trofei' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}>
          TROFEI
        </button>
      </div>

      {/* Contenuto Tabs */}
      <div className="p-4 flex-1">
        <AnimatePresence mode="wait">
          
          {/* TAB: NEWS */}
          {activeTab === 'news' && (
            <motion.div key="news" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              {news.length > 0 ? (
                <div className="space-y-3">
                  {[...news]
                    .sort((a: any, b: any) => {
                       const tA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
                       const tB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
                       return tB - tA;
                    })
                    .map((item: any, idx: number) => {
                      const pubTs = item.pubDate ? new Date(item.pubDate).getTime() : 0;
                      const isNew = pubTs > 0 && (Date.now() - pubTs < 24 * 60 * 60 * 1000);
                      const displayTitle = item.cleanTitle || item.title || 'Notizia senza titolo';
                      const displayDate = item.pubDate 
                        ? new Date(item.pubDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <button key={idx} onClick={() => setSelectedNews(item)} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-md flex flex-col active:scale-95 transition-transform text-left">
                          <div className="flex justify-between items-start mb-2 w-full">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] uppercase">{item.source || 'News'}</span>
                            <div className="flex items-center space-x-2">
                              {isNew && (
                                <span className="bg-[#EF4444] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                                  Nuova
                                </span>
                              )}
                              <span className="text-[10px] text-[#94A3B8] font-bold">{displayDate}</span>
                            </div>
                          </div>
                          <h3 className="text-sm font-bold leading-tight text-[#F8FAFC]">{displayTitle}</h3>
                        </button>
                      );
                  })}
                </div>
              ) : (
                <div className="text-center text-[#94A3B8] font-medium py-10">Nessuna notizia disponibile.</div>
              )}
            </motion.div>
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
                const playersInPos = activeSquad.players.filter((p: any) => p.position === pos);
                if (playersInPos.length === 0) return null;
                return (
                  <div key={pos} className="mb-6">
                    <h3 className="text-[#0EA5E9] font-black text-lg mb-3 border-b border-[#334155] pb-2">{pos}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {playersInPos.map((player: any) => (
                        <div 
                          key={player.id} 
                          onClick={() => setSelectedPlayer(player)}
                          className={`bg-[#1E293B] border rounded-lg p-3 flex flex-col justify-center active:scale-95 cursor-pointer ${player.status === 'In Prestito' ? 'border-[#F59E0B]/50 opacity-80' : 'border-[#334155]'}`}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm mr-3 shrink-0">
                              {player.number}
                            </div>
                            <div className="truncate flex-1">
                              <div className="text-sm font-bold truncate">{player.name}</div>
                            </div>
                          </div>
                          {player.status === 'In Prestito' && (
                            <div className="text-[10px] text-[#F59E0B] font-bold mt-2 uppercase flex items-center">
                              <ArrowRightLeft size={10} className="mr-1" /> Prestito
                            </div>
                          )}
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
            <motion.div key="mercato" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              <h2 className="text-lg font-bold mb-4">Registro Operazioni</h2>
              {squadData.transfers.map((tr: any) => {
                let StatusIcon = Clock;
                let statusColor = "text-[#F59E0B]";
                if (tr.status === 'Conclusa') { StatusIcon = CheckCircle2; statusColor = "text-[#10B981]"; }
                if (tr.status === 'Fallita') { StatusIcon = XCircle; statusColor = "text-[#EF4444]"; }

                return (
                  <div key={tr.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-md">
                    <div className="flex justify-between items-start mb-2 border-b border-[#334155] pb-2">
                      <span className="text-xs font-bold uppercase text-[#0EA5E9]">{tr.type}</span>
                      <span className={`text-xs font-bold uppercase flex items-center ${statusColor}`}>
                        <StatusIcon size={12} className="mr-1" /> {tr.status}
                      </span>
                    </div>
                    <div className="font-bold text-lg mb-1">{tr.player}</div>
                    <div className="flex justify-between items-center mt-2 text-sm text-[#94A3B8]">
                      <span>Operazione con: <strong>{tr.otherTeam}</strong></span>
                      <span className="font-black text-[#F8FAFC]">{tr.fee}</span>
                    </div>
                    <div className="text-[10px] mt-2 text-right">{tr.date}</div>
                  </div>
                );
              })}
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
                
                {trofeiData && trofeiData.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {trofeiData.map((trofeo: any, idx: number) => (
                        <button 
                        key={idx} 
                        onClick={() => trofeo.formation && setSelectedTrophy(trofeo)}
                        className={`bg-[#0F172A]/80 border ${trofeo.formation ? 'border-[#10B981] hover:bg-[#1E293B] cursor-pointer active:scale-95' : 'border-[#334155] cursor-default'} rounded-xl p-4 backdrop-blur-sm flex items-center justify-between shadow-md transition-all text-left w-full`}
                      >
                        <div className="flex items-center">
                          <div className="text-3xl mr-3">{trofeo.icon}</div>
                          <div>
                            <div className="font-black text-lg text-white">
                              {trofeo.name}
                            </div>
                            <div className="text-[#10B981] font-bold text-xs uppercase tracking-widest">
                              Trionfo: {trofeo.year}
                            </div>
                          </div>
                        </div>
                        {trofeo.formation && (
                          <div className="text-[#94A3B8] opacity-50">
                            <ChevronLeft className="rotate-180" size={20} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#94A3B8] font-medium py-10">Nessun dato storico trovato o la squadra non ha trofei maggiori.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PlayerSheet player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />

      {/* News Sheet Modal */}
      <AnimatePresence>
        {selectedNews && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#1E293B] border-t border-[#334155] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col"
            >
              <div className="bg-[#1E293B] px-6 py-4 border-b border-[#334155] flex justify-between items-start rounded-t-3xl shrink-0">
                <div className="w-12 h-1.5 bg-[#334155] rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
                <div className="pr-4 mt-2 flex-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] uppercase">
                    {selectedNews.source || 'Notizia'}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-bold ml-2">
                    {selectedNews.pubDate ? new Date(selectedNews.pubDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </span>
                  <h2 className="text-base font-black mt-2 leading-tight">
                    {selectedNews.cleanTitle || selectedNews.title || 'Notizia'}
                  </h2>
                </div>
                <button onClick={() => setSelectedNews(null)} className="p-2 bg-[#334155] rounded-full text-white mt-2 shrink-0 ml-2">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar flex-1 text-[#94A3B8] text-sm leading-relaxed relative">
                {loadingArticle ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[#10B981] text-xs font-black uppercase mt-4 animate-pulse">Estrazione articolo...</span>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div 
                      className="whitespace-pre-wrap font-medium text-[#F8FAFC] leading-loose text-[15px] prose prose-invert max-w-none prose-img:rounded-xl prose-img:my-4 prose-a:text-[#0EA5E9] prose-p:mb-4"
                      dangerouslySetInnerHTML={{ __html: fullArticleText }}
                    />
                    {selectedNews.link && (
                      <div className="mt-8 mb-4 border-t border-[#334155] pt-6 flex flex-col items-center">
                        <span className="text-xs text-[#94A3B8] mb-3 text-center uppercase tracking-widest font-bold">Vuoi aprire l'articolo nel browser?</span>
                        <a
                          href={selectedNews.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full max-w-sm bg-[#334155] hover:bg-[#475569] text-white font-bold text-sm py-3 rounded-2xl transition-all"
                        >
                          Apri nel Browser
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Trophy Sheet Modal */}
      <AnimatePresence>
        {selectedTrophy && selectedTrophy.formation && (
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
                <div>
                  <h3 className="text-xs text-[#94A3B8] font-black uppercase tracking-widest mb-3 border-b border-[#334155] pb-2">Formazione Tipo</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedTrophy.formation?.map((player: string, i: number) => (
                      <div key={i} className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-sm font-bold text-[#E2E8F0] shadow-sm flex items-center">
                        <span className="text-[#10B981] font-black w-6 text-xs">{i+1}.</span> {player}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
