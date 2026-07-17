"use client";

import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Trash2, Shield, User, Loader2 } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface RosterPlayer {
  id: number;
  playerName: string;
  teamName: string;
  role: string;
}

interface SearchResult {
  name: string;
  role: string;
  team: string;
}

export default function FantaRoster() {
  const { data, mutate, error } = useSWR('/api/fanta-roster', fetcher);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Autocomplete state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roster: RosterPlayer[] = data?.roster || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPlayers = async () => {
      if (newPlayerName.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/player/search?q=${encodeURIComponent(newPlayerName)}`);
        const resultData = await res.json();
        setSearchResults(resultData.results || []);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      searchPlayers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [newPlayerName]);

  const addPlayer = async (player: SearchResult) => {
    setIsAdding(true);
    setShowDropdown(false);
    setNewPlayerName('');
    
    try {
      await fetch('/api/fanta-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          player_name: player.name,
          role: player.role,
          team_name: player.team
        })
      });
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
    <div className="bg-[#1E293B] rounded-3xl p-6 shadow-2xl border border-[#334155] mb-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-[#3B82F6]" />
          Il Mio Fanta-Roster
        </h2>
        <span className="text-xs font-bold bg-[#0F172A] text-[#94A3B8] px-3 py-1 rounded-full">
          {roster.length} Giocatori
        </span>
      </div>

      <div className="relative mb-6" ref={dropdownRef}>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cerca giocatore (es. Meret)..."
              value={newPlayerName}
              onChange={(e) => {
                setNewPlayerName(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-white outline-none focus:border-[#3B82F6] text-sm"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="w-4 h-4 text-[#64748B] animate-spin" />
              </div>
            )}
          </div>
          <button
            disabled={true}
            className="bg-[#334155] text-[#94A3B8] p-2 rounded-xl transition-colors flex items-center justify-center w-10 cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-[#0F172A] border border-[#334155] rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map((player, idx) => {
              // Convert role safely for coloring
              const shortRole = player.role ? (player.role.substring(0, 3).toUpperCase()) : 'CEN';
              return (
                <button
                  key={idx}
                  onClick={() => addPlayer(player)}
                  className="w-full text-left px-4 py-3 hover:bg-[#1E293B] border-b border-[#334155]/50 flex items-center justify-between transition-colors last:border-0"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{player.name}</div>
                    <div className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">{player.team}</div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded border ${roleColors[shortRole] || roleColors['CEN']}`}>
                    {shortRole}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {roster.length === 0 ? (
        <div className="text-center py-8 bg-[#0F172A] rounded-xl border border-dashed border-[#334155]">
          <User className="w-8 h-8 mx-auto text-[#64748B] mb-2" />
          <p className="text-[#64748B] text-sm font-medium">Nessun giocatore in rosa.</p>
          <p className="text-[#64748B] text-xs mt-1">Aggiungi i tuoi campioni per ricevere news mirate!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {roster.map(p => {
             const shortRole = p.role ? (p.role.substring(0, 3).toUpperCase()) : 'CEN';
             return (
              <div key={p.id} className="flex items-center justify-between bg-[#0F172A] p-3 rounded-xl border border-[#334155]">
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded border ${roleColors[shortRole] || roleColors['CEN']}`}>
                    {shortRole}
                  </span>
                  <div>
                    <span className="text-white font-bold text-sm block leading-tight">{p.playerName}</span>
                    <span className="text-[#64748B] text-[10px] font-medium uppercase">{p.teamName}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(p.id)}
                  className="text-[#64748B] hover:text-[#EF4444] p-1 transition-colors shrink-0"
                  title="Rimuovi giocatore"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
