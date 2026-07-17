"use client";

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Save, AlertCircle, CheckCircle2, Loader2, Info, Cpu } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FantaLineupBuilder() {
  const { data: matchdayData } = useSWR('/api/fantacalcio/matchdays', fetcher);
  const { data: rosterData } = useSWR('/api/fanta-roster', fetcher);
  
  const currentMatchday = matchdayData?.current_matchday || 1;
  const isMatchdayActive = matchdayData?.matchdays?.find((m: any) => m.matchday === currentMatchday)?.is_active;

  const { data: lineupData, mutate: mutateLineup } = useSWR(
    matchdayData ? `/api/fantacalcio/lineup?matchday=${currentMatchday}` : null, 
    fetcher
  );

  const [titolari, setTitolari] = useState<any[]>([]);
  const [panchina, setPanchina] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (lineupData?.lineup) {
      setTitolari(lineupData.lineup.filter((p: any) => p.position_type === 'titolare'));
      setPanchina(lineupData.lineup.filter((p: any) => p.position_type === 'panchina'));
    }
  }, [lineupData]);

  const roster = rosterData?.roster || [];
  
  // Available players = roster - (titolari + panchina)
  const availablePlayers = roster.filter((p: any) => 
    !titolari.find(t => t.player_name === p.playerName) && 
    !panchina.find(pan => pan.player_name === p.playerName)
  );

  const movePlayer = (player: any, target: 'titolare' | 'panchina' | 'roster') => {
    if (!isMatchdayActive) return;

    // Remove from current lists
    let newTit = titolari.filter(t => t.player_name !== player.playerName && t.player_name !== player.player_name);
    let newPan = panchina.filter(p => p.player_name !== player.playerName && p.player_name !== player.player_name);

    const formattedPlayer = {
      player_name: player.playerName || player.player_name,
      team_name: player.teamName || player.team_name,
      role: player.role,
    };

    if (target === 'titolare') {
      if (newTit.length >= 11) {
        alert("Hai già 11 titolari!");
        return;
      }
      // Controlla che ci sia max 1 portiere titolare
      if (formattedPlayer.role === 'POR' && newTit.find(t => t.role === 'POR')) {
        alert("Puoi schierare solo 1 portiere titolare!");
        return;
      }
      newTit.push({ ...formattedPlayer, position_type: 'titolare' });
    } else if (target === 'panchina') {
      if (newPan.length >= 7) {
        alert("Massimo 7 giocatori in panchina!");
        return;
      }
      newPan.push({ ...formattedPlayer, position_type: 'panchina', bench_order: newPan.length + 1 });
    }

    setTitolari(newTit);
    setPanchina(newPan);
  };

  const handleSave = async () => {
    if (titolari.length !== 11) {
      alert("Devi schierare esattamente 11 titolari.");
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    try {
      const payload = [...titolari, ...panchina.map((p, i) => ({ ...p, bench_order: i + 1 }))];
      
      const res = await fetch('/api/fantacalcio/lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchday: currentMatchday, lineup: payload })
      });
      
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || "Errore di salvataggio");
      }
      setSaveMessage('Formazione salvata con successo!');
      mutateLineup();
    } catch (e: any) {
      setSaveMessage(e.message || "Errore generico");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleAutoFill = async () => {
    if (!isMatchdayActive) return;
    setIsAutoFilling(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/fantacalcio/advisor');
      if (!res.ok) throw new Error("Errore nel calcolo AI");
      const data = await res.json();
      
      if (data.recommendedLineup && data.recommendedLineup.length > 0) {
        const aiTitolari = data.recommendedLineup.map((p: any) => ({
          player_name: p.playerName,
          team_name: p.teamName,
          role: p.role,
          position_type: 'titolare'
        }));
        
        // Auto-fill panchina with remaining top players
        const remaining = data.playerScores
          .filter((p: any) => !aiTitolari.find((t: any) => t.player_name === p.playerName))
          .slice(0, 7)
          .map((p: any, idx: number) => ({
            player_name: p.playerName,
            team_name: p.teamName,
            role: p.role,
            position_type: 'panchina',
            bench_order: idx + 1
          }));

        setTitolari(aiTitolari);
        setPanchina(remaining);
        setSaveMessage('Formazione ideale schierata! Ricordati di salvare.');
      } else {
        setSaveMessage('Roster vuoto o errore AI.');
      }
    } catch (e: any) {
      setSaveMessage(e.message || "Errore generico");
    } finally {
      setIsAutoFilling(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const renderPlayerList = (players: any[], type: 'titolare' | 'panchina' | 'roster') => {
    return players.map((p, idx) => {
      const pName = p.playerName || p.player_name;
      const role = p.role || 'CEN';
      const shortRole = role.substring(0, 3).toUpperCase();
      
      let badgeColor = 'bg-[#3B82F6]';
      if (shortRole === 'POR') badgeColor = 'bg-[#F59E0B]';
      if (shortRole === 'DIF') badgeColor = 'bg-[#10B981]';
      if (shortRole === 'ATT') badgeColor = 'bg-[#EF4444]';

      return (
        <div key={idx} className="flex items-center justify-between bg-[#0F172A] p-2 rounded-lg border border-[#334155] mb-2 text-sm">
          <div className="flex items-center space-x-2 truncate">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${badgeColor}`}>
              {shortRole}
            </span>
            <span className="text-white font-bold truncate">{pName}</span>
          </div>
          
          {isMatchdayActive && (
            <div className="flex space-x-1 shrink-0 ml-2">
              {type !== 'titolare' && (
                <button onClick={() => movePlayer(p, 'titolare')} className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-1 rounded">TIT</button>
              )}
              {type !== 'panchina' && (
                <button onClick={() => movePlayer(p, 'panchina')} className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-1 rounded">PAN</button>
              )}
              {type !== 'roster' && (
                <button onClick={() => movePlayer(p, 'roster')} className="text-[10px] bg-[#EF4444]/20 text-[#EF4444] px-2 py-1 rounded">X</button>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  if (!matchdayData || !rosterData) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#10B981]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
        <div>
          <h2 className="text-white font-black text-lg">Giornata {currentMatchday}</h2>
          <p className={`text-xs font-bold ${isMatchdayActive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {isMatchdayActive ? '✓ Formazione Modificabile' : '✕ Giornata Chiusa'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAutoFill}
            disabled={!isMatchdayActive || isAutoFilling}
            className="bg-[#3B82F6] disabled:bg-[#334155] disabled:text-[#64748B] text-white font-black px-3 py-2 rounded-lg flex items-center shadow-lg transition-colors text-sm"
          >
            {isAutoFilling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cpu className="w-4 h-4 mr-2" />}
            AUTO-SCHIERA (AI)
          </button>
          <button
            onClick={handleSave}
            disabled={!isMatchdayActive || isSaving || titolari.length !== 11}
            className="bg-[#10B981] disabled:bg-[#334155] disabled:text-[#64748B] text-[#0F172A] font-black px-4 py-2 rounded-lg flex items-center shadow-lg transition-colors text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            SALVA
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-3 rounded-lg text-xs font-bold text-center ${saveMessage.includes('Errore') ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#10B981]/20 text-[#10B981]'}`}>
          {saveMessage}
        </div>
      )}

      {roster.length === 0 ? (
        <div className="bg-[#0F172A] p-6 rounded-xl border border-dashed border-[#334155] text-center">
          <Info className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
          <p className="text-[#94A3B8] text-sm">Non hai giocatori in rosa.</p>
          <a href="/profilo" className="text-[#10B981] font-bold text-xs mt-2 inline-block">Vai al Profilo per aggiungerli</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
            <h3 className="text-white font-bold mb-3 flex items-center justify-between">
              <span>Titolari in Campo</span>
              <span className={`text-xs px-2 py-1 rounded ${titolari.length === 11 ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                {titolari.length}/11
              </span>
            </h3>
            <div className="min-h-[300px] bg-[#0F172A]/50 rounded-lg p-2">
              {titolari.length === 0 ? <p className="text-[#64748B] text-xs text-center mt-4">Nessun titolare scelto</p> : renderPlayerList(titolari, 'titolare')}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
              <h3 className="text-white font-bold mb-3 flex items-center justify-between">
                <span>Panchina</span>
                <span className="text-xs text-[#94A3B8]">{panchina.length}/7</span>
              </h3>
              <div className="min-h-[150px] bg-[#0F172A]/50 rounded-lg p-2">
                {panchina.length === 0 ? <p className="text-[#64748B] text-xs text-center mt-4">Panchina vuota</p> : renderPlayerList(panchina, 'panchina')}
              </div>
            </div>

            <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
              <h3 className="text-[#94A3B8] font-bold mb-3 text-sm">Rosa Disponibile</h3>
              <div className="max-h-[200px] overflow-y-auto bg-[#0F172A]/50 rounded-lg p-2 custom-scrollbar">
                {availablePlayers.length === 0 ? <p className="text-[#64748B] text-xs text-center mt-4">Tutti schierati</p> : renderPlayerList(availablePlayers, 'roster')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
