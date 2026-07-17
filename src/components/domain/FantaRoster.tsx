"use client";

import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Swords, Activity, User } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface RosterPlayer {
  id: number;
  playerName: string;
  teamName: string;
  role: string;
}

export default function FantaRoster() {
  const { data, mutate, error } = useSWR('/api/fanta-roster', fetcher);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('ATT');
  const [isAdding, setIsAdding] = useState(false);

  const roster: RosterPlayer[] = data?.roster || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    setIsAdding(true);
    try {
      await fetch('/api/fanta-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          player_name: newPlayerName.trim(),
          role: newPlayerRole,
          team_name: ''
        })
      });
      setNewPlayerName('');
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await fetch('/api/fanta-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', id })
      });
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  const roleColors: Record<string, string> = {
    'POR': 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50',
    'DIF': 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50',
    'CEN': 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/50',
    'ATT': 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50',
  };

  if (error) return <div className="text-red-500 text-sm">Errore caricamento rosa.</div>;

  return (
    <div className="bg-[#1E293B] rounded-3xl p-6 shadow-2xl border border-[#334155] mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-[#3B82F6]" />
          Il Mio Fanta-Roster
        </h2>
        <span className="text-xs font-bold bg-[#0F172A] text-[#94A3B8] px-3 py-1 rounded-full">
          {roster.length} Giocatori
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex space-x-2 mb-6">
        <input
          type="text"
          placeholder="Nome giocatore..."
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-white outline-none focus:border-[#3B82F6] text-sm"
          maxLength={50}
        />
        <select
          value={newPlayerRole}
          onChange={(e) => setNewPlayerRole(e.target.value)}
          className="bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-white outline-none focus:border-[#3B82F6] text-sm font-bold"
        >
          <option value="POR">POR</option>
          <option value="DIF">DIF</option>
          <option value="CEN">CEN</option>
          <option value="ATT">ATT</option>
        </select>
        <button
          type="submit"
          disabled={isAdding || !newPlayerName.trim()}
          className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white p-2 rounded-xl transition-colors flex items-center justify-center w-10"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </form>

      {roster.length === 0 ? (
        <div className="text-center py-8 bg-[#0F172A] rounded-xl border border-dashed border-[#334155]">
          <User className="w-8 h-8 mx-auto text-[#64748B] mb-2" />
          <p className="text-[#64748B] text-sm font-medium">Nessun giocatore in rosa.</p>
          <p className="text-[#64748B] text-xs mt-1">Aggiungi i tuoi campioni per ricevere news mirate!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {roster.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-[#0F172A] p-3 rounded-xl border border-[#334155]">
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-black px-2 py-1 rounded border ${roleColors[p.role] || roleColors['CEN']}`}>
                  {p.role}
                </span>
                <span className="text-white font-bold text-sm">{p.playerName}</span>
              </div>
              <button
                onClick={() => handleRemove(p.id)}
                className="text-[#64748B] hover:text-[#EF4444] p-1 transition-colors"
                title="Rimuovi giocatore"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
