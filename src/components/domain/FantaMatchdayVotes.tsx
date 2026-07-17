"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { Calculator, AlertCircle, Edit2, CheckCircle2, ChevronDown, Save, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FantaMatchdayVotes() {
  const { data: matchdayData } = useSWR('/api/fantacalcio/matchdays', fetcher);
  const currentMatchday = matchdayData?.current_matchday || 1;
  
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);
  
  // Setta la selectedMatchday una volta al caricamento se disponibile
  React.useEffect(() => {
    if (matchdayData?.current_matchday) {
      setSelectedMatchday(matchdayData.current_matchday);
    }
  }, [matchdayData]);

  const { data: votesData, mutate: mutateVotes, isLoading } = useSWR(
    selectedMatchday ? `/api/fantacalcio/votes?matchday=${selectedMatchday}` : null, 
    fetcher
  );

  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editVoteObj, setEditVoteObj] = useState({ base: 6, bm: 0, final: 6 });
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (player: any) => {
    setEditingPlayer(player.player_name);
    setEditVoteObj({
      base: player.base_vote ? parseFloat(player.base_vote) : 6,
      bm: player.bonus_malus ? parseFloat(player.bonus_malus) : 0,
      final: player.final_vote ? parseFloat(player.final_vote) : 6
    });
  };

  const handleSaveVote = async (playerName: string) => {
    setIsSaving(true);
    try {
      await fetch('/api/fantacalcio/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchday: selectedMatchday,
          player_name: playerName,
          base_vote: editVoteObj.base,
          bonus_malus: editVoteObj.bm,
          final_vote: editVoteObj.base + editVoteObj.bm
        })
      });
      setEditingPlayer(null);
      mutateVotes();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!matchdayData) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#10B981]" /></div>;

  const lineup = votesData?.lineup || [];
  const titolari = lineup.filter((p: any) => p.position_type === 'titolare');
  const panchina = lineup.filter((p: any) => p.position_type === 'panchina').sort((a: any, b: any) => a.bench_order - b.bench_order);
  
  // Calcolo Totale Squadra (semplificato, somma solo i titolari. In futuro si implementano le sostituzioni reali)
  let totalScore = 0;
  titolari.forEach((t: any) => {
    if (t.final_vote) totalScore += parseFloat(t.final_vote);
  });

  const renderPlayerRow = (p: any, index: number) => {
    const isEditing = editingPlayer === p.player_name;
    const shortRole = p.role ? p.role.substring(0, 3).toUpperCase() : 'CEN';
    let badgeColor = 'bg-[#3B82F6]';
    if (shortRole === 'POR') badgeColor = 'bg-[#F59E0B]';
    if (shortRole === 'DIF') badgeColor = 'bg-[#10B981]';
    if (shortRole === 'ATT') badgeColor = 'bg-[#EF4444]';

    return (
      <div key={index} className="flex items-center justify-between bg-[#0F172A] p-3 rounded-lg border border-[#334155] mb-2 hover:bg-[#1E293B] transition-colors">
        <div className="flex items-center space-x-3 w-1/2">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white ${badgeColor}`}>
            {shortRole}
          </span>
          <span className="text-white font-bold text-sm truncate">{p.player_name}</span>
        </div>
        
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input type="number" step="0.5" className="w-12 bg-[#1E293B] text-white text-xs p-1 rounded outline-none text-center" value={editVoteObj.base} onChange={e => setEditVoteObj({...editVoteObj, base: parseFloat(e.target.value) || 0})} title="Voto Base" />
            <input type="number" step="0.5" className="w-12 bg-[#1E293B] text-[#10B981] font-bold text-xs p-1 rounded outline-none text-center" value={editVoteObj.bm} onChange={e => setEditVoteObj({...editVoteObj, bm: parseFloat(e.target.value) || 0})} title="Bonus/Malus" />
            <button onClick={() => handleSaveVote(p.player_name)} disabled={isSaving} className="text-[#10B981]">
              <Save size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="text-center w-8">
              <span className="block text-[9px] text-[#64748B] uppercase">Base</span>
              <span className="text-xs text-[#94A3B8]">{p.base_vote || '-'}</span>
            </div>
            <div className="text-center w-8">
              <span className="block text-[9px] text-[#64748B] uppercase">B/M</span>
              <span className={`text-xs font-bold ${p.bonus_malus > 0 ? 'text-[#10B981]' : p.bonus_malus < 0 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                {p.bonus_malus ? (p.bonus_malus > 0 ? `+${p.bonus_malus}` : p.bonus_malus) : '-'}
              </span>
            </div>
            <div className="text-center w-8 border-l border-[#334155] pl-2">
              <span className="block text-[9px] text-[#0EA5E9] font-bold uppercase">Fin</span>
              <span className="text-sm font-black text-[#0EA5E9]">{p.final_vote || 'S.V.'}</span>
            </div>
            <button onClick={() => handleEditClick(p)} className="text-[#64748B] hover:text-white transition-colors ml-2">
              <Edit2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer AI */}
      <div className="bg-[#10B981]/10 border border-[#10B981]/30 p-3 rounded-lg flex items-start sm:items-center">
        <AlertCircle size={20} className="text-[#10B981] mr-3 mt-0.5 sm:mt-0 shrink-0" />
        <p className="text-xs text-[#10B981] leading-relaxed">
          <strong>Voti Statistici AI:</strong> I voti assegnati in questa piattaforma sono simulati e calcolati automaticamente da un'IA basata su statistiche oggettive (G/A, tiri, parate). Hai sempre la possibilità di <strong>modificarli manualmente</strong> tramite l'icona matita per allinearli al tuo fanta reale!
        </p>
      </div>

      <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex justify-between items-center relative z-20">
        <div>
          <h2 className="text-white font-black text-lg">Seleziona Giornata</h2>
        </div>
        <div className="relative">
          <select 
            value={selectedMatchday}
            onChange={(e) => setSelectedMatchday(parseInt(e.target.value))}
            className="appearance-none bg-[#0F172A] border border-[#334155] text-white text-sm font-bold py-2 pl-4 pr-10 rounded-lg outline-none focus:border-[#0EA5E9]"
          >
            {matchdayData?.matchdays?.map((m: any) => (
              <option key={m.matchday} value={m.matchday}>
                Giornata {m.matchday} {m.is_completed ? '(Conclusa)' : m.is_active ? '(Attuale)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 text-[#94A3B8] pointer-events-none" size={16} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#0EA5E9]" /></div>
      ) : lineup.length === 0 ? (
        <div className="bg-[#0F172A] p-8 rounded-xl border border-dashed border-[#334155] text-center">
          <Calculator className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
          <p className="text-[#94A3B8] text-sm">Nessuna formazione schierata per questa giornata.</p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#334155] p-6 rounded-2xl flex justify-between items-center shadow-xl">
            <div>
              <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest mb-1">Punteggio Totale</p>
              <h3 className="text-3xl font-black text-[#10B981]">{totalScore.toFixed(1)}</h3>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <Calculator className="text-[#10B981] w-8 h-8" />
            </div>
          </div>

          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
            <h3 className="text-white font-bold mb-4">Titolari ({titolari.length})</h3>
            <div className="space-y-1">
              {titolari.map((p: any, i: number) => renderPlayerRow(p, i))}
            </div>
          </div>

          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
            <h3 className="text-[#94A3B8] font-bold mb-4">Panchina ({panchina.length})</h3>
            <div className="space-y-1 opacity-80">
              {panchina.map((p: any, i: number) => renderPlayerRow(p, i))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
