"use client";

import React, { useState } from 'react';
import { ChevronLeft, ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerSheet from '@/components/domain/PlayerSheet';

export default function TeamHubClient({ team, news, squadData }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'news' | 'rosa' | 'mercato' | 'stats' | 'trofei'>('news');
  const [rosterView, setRosterView] = useState<'first' | 'primavera'>('first');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [fullArticleText, setFullArticleText] = useState<string>('');
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false);

  // Fetch full article when selectedNews changes
  React.useEffect(() => {
    if (selectedNews && selectedNews.link) {
      setLoadingArticle(true);
      setFullArticleText('');
      fetch(`/api/news/read?url=${encodeURIComponent(selectedNews.link)}`)
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
    <div className="flex flex-col w-full min-h-screen bg-[#0F172A] pb-[100px]">
      {/* Header Squadra */}
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
              {topNews.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {topNews.map((item: any, idx: number) => (
                    <button key={idx} onClick={() => setSelectedNews(item)} className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 shadow-md flex items-center active:scale-95 transition-transform text-left">
                      {/* Thumbnail Placeholder/Image */}
                      <div className="w-16 h-16 bg-[#0F172A] rounded-lg shrink-0 mr-4 flex items-center justify-center overflow-hidden border border-[#334155]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[#334155] font-black text-2xl">📰</div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] uppercase">{item.source}</span>
                          <span className="text-[10px] text-[#94A3B8] font-bold">{item.time}</span>
                        </div>
                        <h3 className="text-sm font-bold leading-tight line-clamp-2">{item.cleanTitle}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {otherNews.map((item: any, idx: number) => (
                  <button key={idx} onClick={() => setSelectedNews(item)} className="w-full text-left bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-md active:scale-95 transition-transform">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-[#0EA5E9] uppercase">{item.source}</span>
                      <span className="text-[10px] text-[#94A3B8] font-bold">{item.time}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug">{item.cleanTitle}</h3>
                  </button>
                ))}
              </div>
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
                <p className="text-sm text-[#94A3B8] mb-6">Database Storico AI in espansione: componenti e statistiche chiave dell'ultimo grande trionfo.</p>
                
                {/* Esempio Scudetto Napoli 22/23 o Generico se altra squadra */}
                <div className="bg-[#0F172A]/80 border border-[#334155] rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-[#334155] pb-3">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">🇮🇹</div>
                      <div>
                        <div className="font-black text-lg text-white">Campionato Serie A</div>
                        <div className="text-[#10B981] font-bold text-xs uppercase tracking-widest">Stagione 2022/2023</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] text-[#94A3B8] uppercase font-black tracking-widest mb-2">Allenatore Trionfatore</h4>
                      <div className="text-white font-bold bg-[#1E293B] p-2 rounded-lg border border-[#334155]">Luciano Spalletti</div>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] text-[#94A3B8] uppercase font-black tracking-widest mb-2">Formazione Tipo (Eroi)</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#0EA5E9] font-bold mr-2">POR</span> Meret</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#10B981] font-bold mr-2">DIF</span> Di Lorenzo</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#10B981] font-bold mr-2">DIF</span> Kim Min-jae</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#10B981] font-bold mr-2">DIF</span> Rrahmani</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#10B981] font-bold mr-2">DIF</span> Mario Rui</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#F59E0B] font-bold mr-2">CEN</span> Lobotka</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#F59E0B] font-bold mr-2">CEN</span> Anguissa</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#F59E0B] font-bold mr-2">CEN</span> Zielinski</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#EF4444] font-bold mr-2">ATT</span> Kvaratskhelia</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155]"><span className="text-[#EF4444] font-bold mr-2">ATT</span> Politano</div>
                        <div className="bg-[#1E293B] p-2 rounded-lg border border-[#334155] col-span-2"><span className="text-[#EF4444] font-bold mr-2">ATT</span> Victor Osimhen (Capocannoniere)</div>
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="pr-4 mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] uppercase">{selectedNews.source}</span>
                  <span className="text-[10px] text-[#94A3B8] font-bold ml-2">{selectedNews.time}</span>
                  <h2 className="text-lg font-black mt-2 leading-tight">{selectedNews.cleanTitle}</h2>
                </div>
                <button onClick={() => setSelectedNews(null)} className="p-2 bg-[#334155] rounded-full text-white mt-2 shrink-0">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar flex-1 text-[#94A3B8] text-sm leading-relaxed relative">
                {loadingArticle ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[#10B981] text-xs font-black uppercase mt-4 animate-pulse">Estrazione integrale...</span>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap font-medium text-[#F8FAFC] leading-loose text-[15px]">
                      {fullArticleText}
                    </p>
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
