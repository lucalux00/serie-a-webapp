"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { CalendarClock, Cpu, Info, Loader2, Save } from 'lucide-react';
import { FantaInsightPlayer } from '@/components/domain/FantaPlayerInsightCard';

type RosterPlayer = { id?: number; playerName: string; teamName: string; role: string };
type LineupPlayer = { player_name: string; team_name: string; role: string; position_type: 'titolare' | 'panchina'; bench_order?: number };
type MatchdayResponse = { current_matchday: number; is_active?: boolean; deadline?: string | null; matchdays?: Array<{ matchday: number; is_active: boolean }> };
type AdvisorResponse = { playerScores?: FantaInsightPlayer[]; recommendedLineup?: FantaInsightPlayer[] };
type PlayerLike = RosterPlayer | LineupPlayer;

const fetcher = async <T,>(url: string): Promise<T> => { const response = await fetch(url); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Richiesta non riuscita'); return body as T; };
const nameOf = (player: PlayerLike) => 'playerName' in player ? player.playerName : player.player_name;
const teamOf = (player: PlayerLike) => 'teamName' in player ? player.teamName : player.team_name;

export default function FantaLineupBuilder() {
  const [starters, setStarters] = useState<LineupPlayer[]>([]);
  const [bench, setBench] = useState<LineupPlayer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { data: matchdayData, error: matchdayError, mutate: refreshMatchday } = useSWR<MatchdayResponse>('/api/fantacalcio/matchdays', fetcher, { refreshInterval: 300000 });
  const { data: rosterData, error: rosterError } = useSWR<{ roster: RosterPlayer[] }>('/api/fanta-roster', fetcher);
  const { data: advisorData, mutate: refreshAdvisor } = useSWR<AdvisorResponse>('/api/fantacalcio/advisor', fetcher, { dedupingInterval: 60000 });
  const currentMatchday = matchdayData?.current_matchday || 1;
  const isMatchdayActive = matchdayData?.is_active ?? matchdayData?.matchdays?.find((matchday) => matchday.matchday === currentMatchday)?.is_active ?? false;
  const { mutate: mutateLineup } = useSWR<{ lineup: LineupPlayer[] }>(matchdayData ? `/api/fantacalcio/lineup?matchday=${currentMatchday}` : null, fetcher, {
    revalidateOnFocus: false,
    onSuccess: (response) => {
      setStarters(response.lineup.filter((player) => player.position_type === 'titolare'));
      setBench(response.lineup.filter((player) => player.position_type === 'panchina'));
    },
  });

  const roster = rosterData?.roster || [];
  const selectedNames = new Set([...starters, ...bench].map((player) => player.player_name.toLocaleLowerCase('it')));
  const availablePlayers = roster.filter((player) => !selectedNames.has(player.playerName.toLocaleLowerCase('it')));

  function setTemporaryMessage(message: string) {
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(''), 4000);
  }

  function movePlayer(player: PlayerLike, target: 'titolare' | 'panchina' | 'roster') {
    if (!isMatchdayActive) return;
    const playerName = nameOf(player);
    const newStarters = starters.filter((item) => item.player_name !== playerName);
    const newBench = bench.filter((item) => item.player_name !== playerName);
    const formatted: LineupPlayer = { player_name: playerName, team_name: teamOf(player), role: player.role, position_type: target === 'panchina' ? 'panchina' : 'titolare' };
    if (!['POR', 'DIF', 'CEN', 'ATT'].includes(formatted.role)) return setTemporaryMessage('Giocatore bloccato: ruolo non verificato.');
    if (target === 'titolare') {
      if (newStarters.length >= 11) return setTemporaryMessage('Hai già 11 titolari. Sposta prima un giocatore.');
      if (formatted.role === 'POR' && newStarters.some((item) => item.role === 'POR')) return setTemporaryMessage('Puoi schierare un solo portiere titolare.');
      newStarters.push(formatted);
    } else if (target === 'panchina') {
      if (newBench.length >= 7) return setTemporaryMessage('La panchina può contenere al massimo 7 giocatori.');
      newBench.push({ ...formatted, position_type: 'panchina', bench_order: newBench.length + 1 });
    }
    setStarters(newStarters);
    setBench(newBench.map((item, index) => ({ ...item, bench_order: index + 1 })));
  }

  async function handleSave() {
    if (starters.length !== 11) return setTemporaryMessage('Devi schierare esattamente 11 titolari.');
    setIsSaving(true);
    setSaveMessage('');
    try {
      const payload = [...starters, ...bench.map((player, index) => ({ ...player, bench_order: index + 1 }))];
      const response = await fetch('/api/fantacalcio/lineup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchday: currentMatchday, lineup: payload }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Errore di salvataggio');
      await mutateLineup();
      setTemporaryMessage('Formazione salvata e validata con successo.');
    } catch (error: unknown) {
      setTemporaryMessage(error instanceof Error ? error.message : 'Errore di salvataggio');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAutoFill() {
    if (!isMatchdayActive) return;
    setIsAutoFilling(true);
    setSaveMessage('');
    try {
      const data = advisorData || await refreshAdvisor();
      if (!data?.recommendedLineup?.length) throw new Error('Rosa incompleta: non posso generare un undici valido.');
      const aiStarters: LineupPlayer[] = data.recommendedLineup.map((player) => ({ player_name: player.playerName || player.name || '', team_name: player.teamName || player.team || '', role: player.role, position_type: 'titolare' }));
      const starterNames = new Set(aiStarters.map((player) => player.player_name));
      const aiBench: LineupPlayer[] = (data.playerScores || []).filter((player) => !starterNames.has(player.playerName || player.name || '')).slice(0, 7).map((player, index) => ({ player_name: player.playerName || player.name || '', team_name: player.teamName || player.team || '', role: player.role, position_type: 'panchina', bench_order: index + 1 }));
      setStarters(aiStarters);
      setBench(aiBench);
      setTemporaryMessage('Formazione ideale pronta: controlla i dati e premi Salva.');
    } catch (error: unknown) {
      setTemporaryMessage(error instanceof Error ? error.message : 'Calcolo non disponibile');
    } finally {
      setIsAutoFilling(false);
    }
  }

  function renderPlayerList(players: PlayerLike[], type: 'titolare' | 'panchina' | 'roster') {
    return players.map((player) => {
      const playerName = nameOf(player);
      const shortRole = player.role?.slice(0, 3).toUpperCase() || 'N/D';
      const insight = advisorData?.playerScores?.find((item) => (item.playerName || item.name)?.toLocaleLowerCase('it') === playerName.toLocaleLowerCase('it'));
      const badgeColor = shortRole === 'POR' ? 'bg-[#F59E0B]' : shortRole === 'DIF' ? 'bg-[#10B981]' : shortRole === 'ATT' ? 'bg-[#EF4444]' : shortRole === 'CEN' ? 'bg-[#3B82F6]' : 'bg-[#64748B]';
      return <div key={`${type}-${playerName}`} className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#0F172A] p-3 text-sm"><div className="min-w-0 flex-1"><div className="flex items-center space-x-2 truncate"><span className={`rounded px-1.5 py-0.5 text-[9px] font-black text-white ${badgeColor}`}>{shortRole}</span><span className="truncate font-bold text-white">{playerName}</span>{insight ? <span className="rounded bg-[#10B981]/15 px-1.5 py-0.5 text-[10px] font-black text-[#6EE7B7]">{insight.score}/100</span> : null}</div>{insight ? <><p className="mt-1 truncate text-[10px] text-[#94A3B8]">{insight.matchInfo}</p><p className="mt-0.5 text-[9px] font-bold text-[#CBD5E1]">Rendimento {insight.successProbability ?? '—'}% · Titolarità {insight.estimatedStartProbability ?? '—'}% · Bonus {insight.bonusProbability ?? '—'}%</p></> : null}</div>{isMatchdayActive ? <div className="ml-2 flex shrink-0 space-x-1">{type !== 'titolare' ? <button type="button" onClick={() => movePlayer(player, 'titolare')} className="rounded bg-[#10B981]/20 px-2 py-1 text-[10px] text-[#10B981]">TIT</button> : null}{type !== 'panchina' ? <button type="button" onClick={() => movePlayer(player, 'panchina')} className="rounded bg-[#F59E0B]/20 px-2 py-1 text-[10px] text-[#F59E0B]">PAN</button> : null}{type !== 'roster' ? <button type="button" onClick={() => movePlayer(player, 'roster')} className="rounded bg-[#EF4444]/20 px-2 py-1 text-[10px] text-[#EF4444]">X</button> : null}</div> : null}</div>;
    });
  }

  if (!matchdayData || !rosterData) {
    if (matchdayError || rosterError) return <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-5 text-center text-sm text-rose-100">Impossibile caricare formazione o calendario. <button type="button" onClick={() => refreshMatchday()} className="font-black underline">Riprova</button></div>;
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#10B981]" /></div>;
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-xl border border-[#334155] bg-[#1E293B] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-white">Giornata {currentMatchday}</h2><p className={`text-xs font-bold ${isMatchdayActive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{isMatchdayActive ? '✓ Formazione modificabile' : '✕ Giornata chiusa'}</p>{matchdayData.deadline ? <p className="mt-1 flex items-center text-[10px] text-[#94A3B8]"><CalendarClock className="mr-1 h-3.5 w-3.5" />Scadenza {new Date(matchdayData.deadline).toLocaleString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p> : <p className="mt-1 text-[10px] text-amber-300">Scadenza ufficiale in aggiornamento</p>}</div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={handleAutoFill} disabled={!isMatchdayActive || isAutoFilling} className="flex items-center justify-center rounded-lg bg-[#3B82F6] px-3 py-2 text-xs font-black text-white disabled:bg-[#334155] disabled:text-[#64748B]">{isAutoFilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cpu className="mr-2 h-4 w-4" />}AUTO-SCHIERA</button><button type="button" onClick={handleSave} disabled={!isMatchdayActive || isSaving || starters.length !== 11} className="flex items-center justify-center rounded-lg bg-[#10B981] px-4 py-2 text-xs font-black text-[#0F172A] disabled:bg-[#334155] disabled:text-[#64748B]">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}SALVA</button></div></div>
    {saveMessage ? <div className={`rounded-lg p-3 text-center text-xs font-bold ${/errore|non |bloccato|chiusa|massimo/i.test(saveMessage) ? 'bg-[#EF4444]/20 text-[#FCA5A5]' : 'bg-[#10B981]/20 text-[#6EE7B7]'}`}>{saveMessage}</div> : null}
    {!roster.length ? <div className="rounded-xl border border-dashed border-[#334155] bg-[#0F172A] p-6 text-center"><Info className="mx-auto mb-2 h-8 w-8 text-[#64748B]" /><p className="text-sm text-[#94A3B8]">Non hai giocatori in rosa.</p><p className="mt-2 text-xs font-bold text-[#10B981]">Apri “La mia rosa” per aggiungerli.</p></div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-xl border border-[#334155] bg-[#1E293B] p-4"><h3 className="mb-3 flex items-center justify-between font-bold text-white"><span>Titolari in campo</span><span className={`rounded px-2 py-1 text-xs ${starters.length === 11 ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>{starters.length}/11</span></h3><div className="min-h-[300px] rounded-lg bg-[#0F172A]/50 p-2">{starters.length ? renderPlayerList(starters, 'titolare') : <p className="mt-4 text-center text-xs text-[#64748B]">Nessun titolare scelto</p>}</div></div><div className="space-y-4"><div className="rounded-xl border border-[#334155] bg-[#1E293B] p-4"><h3 className="mb-3 flex items-center justify-between font-bold text-white"><span>Panchina</span><span className="text-xs text-[#94A3B8]">{bench.length}/7</span></h3><div className="min-h-[150px] rounded-lg bg-[#0F172A]/50 p-2">{bench.length ? renderPlayerList(bench, 'panchina') : <p className="mt-4 text-center text-xs text-[#64748B]">Panchina vuota</p>}</div></div><div className="rounded-xl border border-[#334155] bg-[#1E293B] p-4"><h3 className="mb-3 text-sm font-bold text-[#94A3B8]">Rosa disponibile</h3><div className="custom-scrollbar max-h-[260px] overflow-y-auto rounded-lg bg-[#0F172A]/50 p-2">{availablePlayers.length ? renderPlayerList(availablePlayers, 'roster') : <p className="mt-4 text-center text-xs text-[#64748B]">Tutti schierati</p>}</div></div></div></div>}
  </div>;
}
