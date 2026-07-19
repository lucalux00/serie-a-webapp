"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, Search, Clock, Star } from 'lucide-react';
import Script from 'next/script';
import { ALL_TEAMS } from '@/data/teams';
import TeamLogo from '@/components/ui/TeamLogo';

export default function MarketFeed() {
  const [leagueTab, setLeagueTab] = useState<'A' | 'B' | 'PL' | 'LL'>('A');
  const [filterTab, setFilterTab] = useState<'acquisti' | 'prestiti' | 'svincolati' | 'trattative'>('acquisti');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveData, setLiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/mercato/live?league=${leagueTab}`)
      .then(r => r.json())
      .then(data => {
        setLiveData(data.transfers || []);
        setLoading(false);
      })
      .catch(() => {
        setLiveData([]);
        setLoading(false);
      });
  }, [leagueTab]);

  const currentData = liveData.filter(d => 
    (!selectedTeam || (d.team && d.team.toLowerCase() === selectedTeam.toLowerCase())) &&
    ((d.player && d.player.toLowerCase().includes(searchQuery.toLowerCase())) || 
     (d.team && d.team.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const acquisti = currentData.filter(d => d.type && d.type.toLowerCase() === 'acquisto' && d.status !== 'Rumor');
  const prestiti = currentData.filter(d => d.type && d.type.toLowerCase() === 'prestito' && d.status !== 'Rumor');
  const svincolati = currentData.filter(d => d.type && d.type.toLowerCase() === 'svincolato' && d.status !== 'Rumor');

  const getIconForType = (type: string) => {
    const t = type ? type.toLowerCase() : '';
    switch (t) {
      case 'acquisto': return <ArrowRight className="text-[#10B981] w-4 h-4" />;
      case 'cessione': return <ArrowLeft className="text-[#EF4444] w-4 h-4" />;
      case 'prestito': return <ArrowRightLeft className="text-[#0EA5E9] w-4 h-4" />;
      case 'svincolato': return <CheckCircle2 className="text-[#94A3B8] w-4 h-4" />;
      case 'trattativa': return <RefreshCw className="text-[#F59E0B] w-4 h-4 animate-spin-slow" />;
      default: return null;
    }
  };

  const getBadgeColor = (type: string) => {
    const t = type ? type.toLowerCase() : '';
    switch (t) {
      case 'acquisto': return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50';
      case 'cessione': return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50';
      case 'prestito': return 'bg-[#0EA5E9]/20 text-[#0EA5E9] border-[#0EA5E9]/50';
      case 'svincolato': return 'bg-[#94A3B8]/20 text-[#E2E8F0] border-[#94A3B8]/50';
      case 'trattativa': return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50';
      default: return 'bg-[#334155] text-white';
    }
  };

  const renderTransferCard = (tr: any) => {
    const t = tr.type ? tr.type.toLowerCase() : '';
    const isRumor = tr.status === 'Rumor';
    
    const teamInfo = ALL_TEAMS.find(team => team.name.toLowerCase() === tr.team?.toLowerCase() || team.id === tr.team?.toLowerCase());
    
    return (
    <div key={tr.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-sm relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isRumor ? 'bg-[#F59E0B]' : t === 'acquisto' ? 'bg-[#10B981]' : t === 'cessione' ? 'bg-[#EF4444]' : t === 'prestito' ? 'bg-[#0EA5E9]' : t === 'svincolato' ? 'bg-[#94A3B8]' : 'bg-[#F59E0B]'}`} />
      
      <div className="flex justify-between items-start mb-2 pl-2">
        <div className="flex items-center space-x-2">
          {teamInfo ? <TeamLogo src={teamInfo.logoUrl} alt={teamInfo.name} fallbackText={teamInfo.logo} className="w-5 h-5 rounded-full" /> : getIconForType(tr.type)}
          <span className="font-bold text-sm text-white">{tr.team}</span>
        </div>
        <div className="flex items-center space-x-2">
          {isRumor && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase border bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50">
              RUMOR
            </span>
          )}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${getBadgeColor(tr.type)}`}>
            {tr.type}
          </span>
        </div>
      </div>
      
      <div className="pl-2">
        <div className="text-lg font-black text-[#F8FAFC] leading-tight mb-1">{tr.player}</div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#94A3B8] font-medium">{tr.fromTo}</span>
          <span className="font-bold text-[#10B981]">{tr.fee}</span>
        </div>
      </div>
      <div className="absolute bottom-2 right-4 text-[9px] text-[#64748B] font-bold uppercase">{tr.date}</div>
    </div>
    );
  };

  return (
    <div className="w-full flex flex-col h-full space-y-6">
      
      {/* Barra Ricerca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4" />
        <input 
          type="text" 
          placeholder="Cerca giocatore o squadra..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#1E293B] border border-[#334155] rounded-full py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#0EA5E9]"
        />
      </div>

      {/* Tabs Lega */}
      <div className="flex bg-[#1E293B] p-1 rounded-2xl border border-[#334155] mb-2 overflow-x-auto no-scrollbar">
        {['A', 'B', 'PL', 'LL', 'BL', 'L1'].map((l) => (
          <button 
            key={l}
            onClick={() => {
              setLeagueTab(l as any);
              setSelectedTeam(null);
            }} 
            className={`flex-1 py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-colors whitespace-nowrap ${leagueTab === l ? 'bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
          >
            {l === 'A' ? 'Serie A' : l === 'B' ? 'Serie B' : l === 'PL' ? 'Premier' : l === 'LL' ? 'La Liga' : l === 'BL' ? 'Bundesliga' : 'Ligue 1'}
          </button>
        ))}
      </div>

      {/* Selettore Squadra */}
      <div className="flex overflow-x-auto space-x-3 px-1 py-2 no-scrollbar mb-4 border-b border-[#334155]/50 pb-4">
        <button 
          onClick={() => setSelectedTeam(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-xs transition-colors shadow-sm ${!selectedTeam ? 'bg-[#10B981] text-white shadow-[#10B981]/20' : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:bg-[#334155]/50'}`}
        >
          Tutte le Squadre
        </button>
        {ALL_TEAMS.filter(t => t.league === leagueTab).map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeam(team.name)}
            className={`flex-shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-colors shadow-sm ${selectedTeam === team.name ? 'bg-gradient-to-r from-[#10B981]/20 to-[#0EA5E9]/20 border-[#10B981] text-white' : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:bg-[#334155]/50'}`}
          >
            <TeamLogo src={team.logoUrl} alt={team.name} fallbackText={team.logo} className="w-5 h-5 rounded-full" />
            <span className="text-xs font-bold">{team.name}</span>
          </button>
        ))}
      </div>

      {/* Tabs Filtro Categoria */}
      <div className="flex bg-[#0F172A] border-b border-[#334155] overflow-x-auto no-scrollbar">
        {[
          { id: 'acquisti', label: 'Acquisti' },
          { id: 'prestiti', label: 'Prestiti' },
          { id: 'svincolati', label: 'Svincolati' },
          { id: 'trattative', label: 'Trattative' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${filterTab === tab.id ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={`${leagueTab}-${filterTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {filterTab === 'acquisti' && (
            <section>
              <h2 className="flex items-center text-[#10B981] font-black text-sm uppercase tracking-widest mb-4 border-b border-[#334155] pb-2">
                <CheckCircle2 size={16} className="mr-2" /> Acquisti a Titolo Definitivo
              </h2>
              {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {acquisti.length > 0 ? acquisti.map(renderTransferCard) : <div className="text-sm text-[#64748B]">Nessun acquisto definitivo recente trovato.</div>}
                </div>
              )}
            </section>
          )}

          {filterTab === 'prestiti' && (
            <section>
              <h2 className="flex items-center text-[#0EA5E9] font-black text-sm uppercase tracking-widest mb-4 border-b border-[#334155] pb-2">
                <ArrowRightLeft size={16} className="mr-2" /> Movimenti in Prestito
              </h2>
              {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {prestiti.length > 0 ? prestiti.map(renderTransferCard) : <div className="text-sm text-[#64748B]">Nessun prestito recente trovato.</div>}
                </div>
              )}
            </section>
          )}

          {filterTab === 'svincolati' && (
            <section>
              <h2 className="flex items-center text-[#94A3B8] font-black text-sm uppercase tracking-widest mb-4 border-b border-[#334155] pb-2">
                <CheckCircle2 size={16} className="mr-2" /> Mercato Svincolati
              </h2>
              {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#94A3B8] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {svincolati.length > 0 ? svincolati.map(renderTransferCard) : <div className="text-sm text-[#64748B]">Nessuno svincolato trovato di recente.</div>}
                </div>
              )}
            </section>
          )}

          {filterTab === 'trattative' && (() => {
            const rumors = currentData.filter(d => d.status === 'Rumor');

            return (
            <section className="space-y-6">
              
              <h2 className="flex items-center text-[#F59E0B] font-black text-sm uppercase tracking-widest mb-4 border-b border-[#334155] pb-2 mt-8">
                <RefreshCw size={16} className="mr-2" /> Rumors & Trattative
              </h2>

              {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {rumors.length > 0 ? rumors.map(renderTransferCard) : <div className="text-sm text-[#64748B]">Nessuna trattativa recente trovata.</div>}
                </div>
              )}
            </section>
            );
          })()}
        </motion.div>
      </AnimatePresence>
      
    </div>
  );
}
