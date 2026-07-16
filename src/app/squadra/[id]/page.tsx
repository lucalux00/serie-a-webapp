import React from 'react';
import TeamHubClient from './TeamHubClient';
import { ALL_TEAMS } from '@/data/teams';
import { fetchNewsForTeam } from '@/lib/news';
import fs from 'fs';
import path from 'path';

import { sql } from '@vercel/postgres';

// ISR: Rigenera la pagina ogni 30 minuti (1800 secondi) in produzione
export const revalidate = 1800;

export default async function SquadraPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const teamId = resolvedParams.id;
  const initialTab = resolvedSearch.tab || 'news';
  
  const team = ALL_TEAMS.find(t => t.id === teamId) || { name: 'Squadra', logo: '?', league: 'A' };
  
  // Esecuzione parallela delle chiamate principali
  const newsPromise = fetchNewsForTeam(team.name, team.league);
  
  let dbPlayersPromise: Promise<{ rows: any[] }> = Promise.resolve({ rows: [] });
  let dbTransfersPromise: Promise<{ rows: any[] }> = Promise.resolve({ rows: [] });
  if (process.env.POSTGRES_URL) {
    dbPlayersPromise = sql`SELECT * FROM players WHERE team_id = ${teamId}`;
    dbTransfersPromise = sql`SELECT * FROM transfers WHERE team_id = ${teamId} ORDER BY id DESC`;
  }

  // Risolvi tutto in parallelo!
  const [news, { rows: players }, { rows: transfers }] = await Promise.all([
    newsPromise,
    dbPlayersPromise,
    dbTransfersPromise
  ]);

  let squadData = null;
  let trofeiData = null;
  
  // 1. Elabora i dati da Postgres
  let dbHasData = false;
  if (process.env.POSTGRES_URL) {
    try {
      if (players.length > 0) {
        dbHasData = true;

        let finalTransfers = transfers.map((t: any) => ({
          id: t.id,
          type: t.type,
          player: t.player,
          otherTeam: t.other_team,
          fee: t.fee,
          salary: t.salary || null,
          date: t.date,
          status: t.status
        }));

        if (finalTransfers.length === 0) {
          try {
            const squadsPath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
            const allSquads = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));
            if (allSquads[teamId] && allSquads[teamId].transfers) {
              finalTransfers = allSquads[teamId].transfers;
            }
          } catch (e) {}
        }

        // Mappa i ruoli italiani di Transfermarkt in 4 categorie UI
        const mapRole = (role: string): string => {
          if (!role) return 'CEN';
          const r = role.toLowerCase();
          if (r.includes('portiere') || r.includes('keeper')) return 'POR';
          if (r.includes('difensore') || r.includes('terzino') || r.includes('libero') || r.includes('stopper') || r.includes('back')) return 'DIF';
          if (r.includes('attaccante') || r.includes('ala') || r.includes('centravanti') || r.includes('punta') || r.includes('striker') || r.includes('winger') || r.includes('forward')) return 'ATT';
          return 'CEN';
        };

        // Normalizza tutti i giocatori dal DB
        const normalizedPlayers = players
          .filter((p: any) => !p.is_coach && !p.is_staff)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            number: p.number || '?',
            position: mapRole(p.role),
            roleLabel: p.role || 'Calciatore',
            status: null,
            squad_type: p.squad_type || 'first',
          }));

        const coach = players.find((p: any) => p.is_coach) || { name: 'Allenatore N/D', role: 'Allenatore', module: '4-3-3' };
        const staff = players.filter((p: any) => p.is_staff).map((s: any) => ({ name: s.name, role: s.role || 'Staff' }));

        squadData = {
          firstTeam: {
            coach: { name: coach.name, role: coach.role || 'Allenatore', module: coach.module || '4-3-3' },
            staff: staff,
            players: normalizedPlayers
          },
          primavera: {
            coach: { name: 'N/D', role: 'Allenatore Primavera', module: '4-3-3' },
            staff: [],
            players: []
          },
          transfers: finalTransfers
        };
      }
    } catch (e) {
      console.warn("DB fetch failed, falling back to JSON:", e);
    }
  }

  // 2. Fallback totale al JSON locale se il DB è vuoto per questa squadra
  if (!dbHasData) {
    try {
      const squadsPath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
      const allSquads = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));
      squadData = allSquads[teamId] || null;
    } catch (error) {
      console.error('Error loading JSON fallback:', error);
    }
  }

  // 3. Caricamento Trofei (attualmente statico)
  try {
    const trofeiPath = path.join(process.cwd(), 'src', 'data', 'trofeiCronologia.json');
    if (fs.existsSync(trofeiPath)) {
      const allTrofei = JSON.parse(fs.readFileSync(trofeiPath, 'utf8'));
      trofeiData = allTrofei.filter((t: any) => t.team === teamId);
    } else {
      trofeiData = [];
    }
  } catch (e) {
    console.error('Error loading trofei:', e);
  }

  return <TeamHubClient team={team} news={news} squadData={squadData} trofeiData={trofeiData} initialTab={initialTab} />;
}
