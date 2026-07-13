"use client";

import React, { useState } from 'react';
import { ChevronLeft, ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerSheet from '@/components/domain/PlayerSheet';

export default function TeamHubClient({ team, news, squadData }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'news' | 'rosa' | 'mercato' | 'stats'>('news');
  const [rosterView, setRosterView] = useState<'first' | 'primavera'>('first');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

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
      </div>

      {/* Contenuto Tabs */}
      <div className="p-4 flex-1">
        <AnimatePresence mode="wait">
          
          {/* TAB: NEWS */}
          {activeTab === 'news' && (
            <motion.div key="news" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              {topNews.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {topNews.map((item: any, idx: number) => (
                    <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 shadow-md flex flex-col justify-between aspect-square active:scale-95 transition-transform">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] uppercase">{item.source}</span>
                      </div>
                      <h3 className="text-sm font-bold leading-tight mt-2 line-clamp-3">{item.cleanTitle}</h3>
                      <div className="text-[10px] text-[#94A3B8] font-bold text-right mt-2">{item.time}</div>
                    </a>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {otherNews.map((item: any, idx: number) => (
                  <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="block bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-md active:scale-95 transition-transform">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-[#0EA5E9] uppercase">{item.source}</span>
                      <span className="text-[10px] text-[#94A3B8] font-bold">{item.time}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug">{item.cleanTitle}</h3>
                  </a>
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
        </AnimatePresence>
      </div>

      <PlayerSheet player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
