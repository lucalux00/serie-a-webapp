"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, Search } from 'lucide-react';

const ADVANCED_MARKET_DATA = [
  // SERIE A - Ufficiali
  { id: 1, league: 'A', status: 'ufficiale', type: 'acquisto', team: 'Napoli', player: 'Alessandro Buongiorno', fromTo: 'dal Torino', fee: '35M €', date: 'Oggi 14:30' },
  { id: 2, league: 'A', status: 'ufficiale', type: 'acquisto', team: 'Inter', player: 'Albert Gudmundsson', fromTo: 'dal Genoa', fee: '30M €', date: 'Ieri 18:00' },
  { id: 3, league: 'A', status: 'ufficiale', type: 'cessione', team: 'Juventus', player: 'Federico Chiesa', fromTo: 'al Liverpool', fee: '40M €', date: 'Ieri 10:15' },
  { id: 4, league: 'A', status: 'ufficiale', type: 'prestito', team: 'Milan', player: 'Lazar Samardzic', fromTo: 'dall\'Udinese', fee: 'Prestito con obbligo', date: '11 Luglio' },
  { id: 5, league: 'A', status: 'ufficiale', type: 'acquisto', team: 'Roma', player: 'Matias Soulé', fromTo: 'dalla Juventus', fee: '28M €', date: '10 Luglio' },
  
  // SERIE A - Trattative
  { id: 6, league: 'A', status: 'trattativa', type: 'trattativa', team: 'Juventus', player: 'Teun Koopmeiners', fromTo: 'dall\'Atalanta', fee: 'Offerta: 55M €', date: 'In corso' },
  { id: 7, league: 'A', status: 'trattativa', type: 'trattativa', team: 'Napoli', player: 'Romelu Lukaku', fromTo: 'dal Chelsea', fee: 'In attesa cessione Osimhen', date: 'In corso' },
  { id: 8, league: 'A', status: 'trattativa', type: 'trattativa', team: 'Milan', player: 'Youssouf Fofana', fromTo: 'dal Monaco', fee: 'Distanza di 5M €', date: 'Fase avanzata' },
  
  // SERIE B - Ufficiali
  { id: 9, league: 'B', status: 'ufficiale', type: 'acquisto', team: 'Palermo', player: 'Thomas Henry', fromTo: 'dal Verona', fee: '4M €', date: 'Oggi 11:00' },
  { id: 10, league: 'B', status: 'ufficiale', type: 'acquisto', team: 'Sampdoria', player: 'Massimo Coda', fromTo: 'dal Genoa', fee: 'Svincolato', date: 'Ieri 15:45' },
  { id: 11, league: 'B', status: 'ufficiale', type: 'cessione', team: 'Cremonese', player: 'Dennis Johnsen', fromTo: 'al Venezia', fee: 'Risoluzione', date: '10 Luglio' },
  { id: 12, league: 'B', status: 'ufficiale', type: 'prestito', team: 'Bari', player: 'Kevin Lasagna', fromTo: 'dal Verona', fee: 'Prestito secco', date: '09 Luglio' },
  
  // SERIE B - Trattative
  { id: 13, league: 'B', status: 'trattativa', type: 'trattativa', team: 'Sassuolo', player: 'Domenico Berardi', fromTo: 'alla Juventus', fee: 'Richiesta: 20M €', date: 'In corso' },
  { id: 14, league: 'B', status: 'trattativa', type: 'trattativa', team: 'Frosinone', player: 'Emanuele Valeri', fromTo: 'dal Parma', fee: 'Sondaggio', date: 'Iniziale' },
];

export default function MarketFeed() {
  const [leagueTab, setLeagueTab] = useState<'A' | 'B'>('A');
  const [searchQuery, setSearchQuery] = useState('');

  const currentData = ADVANCED_MARKET_DATA.filter(d => d.league === leagueTab && (
    d.player.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.team.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const ufficiali = currentData.filter(d => d.status === 'ufficiale');
  const trattative = currentData.filter(d => d.status === 'trattativa');

  const getIconForType = (type: string) => {
    switch (type) {
      case 'acquisto': return <ArrowRight className="text-[#10B981] w-4 h-4" />;
      case 'cessione': return <ArrowLeft className="text-[#EF4444] w-4 h-4" />;
      case 'prestito': return <ArrowRightLeft className="text-[#0EA5E9] w-4 h-4" />;
      case 'trattativa': return <RefreshCw className="text-[#F59E0B] w-4 h-4 animate-spin-slow" />;
      default: return null;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'acquisto': return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50';
      case 'cessione': return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50';
      case 'prestito': return 'bg-[#0EA5E9]/20 text-[#0EA5E9] border-[#0EA5E9]/50';
      case 'trattativa': return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50';
      default: return 'bg-[#334155] text-white';
    }
  };

  const renderTransferCard = (tr: typeof ADVANCED_MARKET_DATA[0]) => (
    <div key={tr.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-sm relative overflow-hidden">
      {/* Indicatore visivo laterale */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${tr.type === 'acquisto' ? 'bg-[#10B981]' : tr.type === 'cessione' ? 'bg-[#EF4444]' : tr.type === 'prestito' ? 'bg-[#0EA5E9]' : 'bg-[#F59E0B]'}`} />
      
      <div className="flex justify-between items-start mb-2 pl-2">
        <div className="flex items-center space-x-2">
          {getIconForType(tr.type)}
          <span className="font-bold text-sm text-white">{tr.team}</span>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${getBadgeColor(tr.type)}`}>
          {tr.type}
        </span>
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
      <div className="flex bg-[#1E293B] p-1 rounded-full border border-[#334155]">
        <button 
          onClick={() => setLeagueTab('A')} 
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-colors ${leagueTab === 'A' ? 'bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white shadow-md' : 'text-[#94A3B8]'}`}
        >
          Serie A
        </button>
        <button 
          onClick={() => setLeagueTab('B')} 
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-colors ${leagueTab === 'B' ? 'bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white shadow-md' : 'text-[#94A3B8]'}`}
        >
          Serie B
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={leagueTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-8"
        >
          {/* Sezione Ufficiali */}
          <section>
            <h2 className="flex items-center text-[#10B981] font-black text-sm uppercase tracking-widest mb-4 border-b border-[#334155] pb-2">
              <CheckCircle2 size={16} className="mr-2" /> Ufficialità
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {ufficiali.length > 0 ? ufficiali.map(renderTransferCard) : <div className="text-sm text-[#64748B]">Nessuna ufficialità trovata.</div>}
            </div>
          </section>

          {/* Sezione Trattative */}
          <section>
            <h2 className="flex items-center text-[#F59E0B] font-black text-sm uppercase tracking-widest mb-4 border-b border-[#334155] pb-2">
              <RefreshCw size={16} className="mr-2" /> Trattative in Corso
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {trattative.length > 0 ? trattative.map(renderTransferCard) : <div className="text-sm text-[#64748B]">Nessuna trattativa trovata.</div>}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
      
    </div>
  );
}
