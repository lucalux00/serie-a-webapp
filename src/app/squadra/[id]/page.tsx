import React from 'react';
import TeamHubClient from './TeamHubClient';
import { ALL_TEAMS } from '@/data/teams';
import { fetchNewsForTeam } from '@/lib/news';
import fs from 'fs';
import path from 'path';

import { sql } from '@vercel/postgres';

// ISR: Rigenera la pagina ogni 30 minuti (1800 secondi) in produzione
export const revalidate = 1800;

export default async function SquadraPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const teamId = resolvedParams.id;
  
  const team = ALL_TEAMS.find(t => t.id === teamId) || { name: 'Squadra', logo: '?', league: 'A' };
  
  // Fetch delle news live (Google News RSS + Postgres Cache in futuro)
  const news = await fetchNewsForTeam(team.name, team.league);

  let squadData = null;
  let trofeiData = null;
  
  // 1. Prova a leggere da Postgres
  let dbHasData = false;
  if (process.env.POSTGRES_URL) {
    try {
      const { rows: players } = await sql`SELECT * FROM players WHERE team_id = ${teamId}`;
      const { rows: transfers } = await sql`SELECT * FROM transfers WHERE team_id = ${teamId} ORDER BY id DESC`;

      if (players.length > 0) {
        dbHasData = true;
        squadData = {
          firstTeam: {
            coach: players.find(p => p.squad_type === 'first' && p.is_coach) || { name: "Non Assegnato", role: "Allenatore" },
            staff: players.filter(p => p.squad_type === 'first' && p.is_staff),
            players: players.filter(p => p.squad_type === 'first' && !p.is_coach && !p.is_staff)
          },
          primavera: {
            coach: players.find(p => p.squad_type === 'primavera' && p.is_coach) || { name: "Non Assegnato", role: "Allenatore" },
            staff: players.filter(p => p.squad_type === 'primavera' && p.is_staff),
            players: players.filter(p => p.squad_type === 'primavera' && !p.is_coach && !p.is_staff)
          },
          transfers: transfers.map(t => ({
            id: t.id,
            type: t.type,
            player: t.player,
            otherTeam: t.other_team,
            fee: t.fee,
            date: t.date,
            status: t.status
          }))
        };
      }
    } catch (e) {
      console.warn("DB fetch failed, falling back to JSON:", e);
    }
  }

  // 2. Fallback al JSON locale se il DB è vuoto o fallisce
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

  return <TeamHubClient team={team} news={news} squadData={squadData} trofeiData={trofeiData} />;
}
