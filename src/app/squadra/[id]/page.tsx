import React from 'react';
import TeamHubClient from './TeamHubClient';
import { ALL_TEAMS } from '@/data/teams';
import { fetchNewsForTeam } from '@/lib/news';
import fs from 'fs';
import path from 'path';

// ISR: Rigenera la pagina ogni 30 minuti (1800 secondi) in produzione
export const revalidate = 1800;

export default async function SquadraPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const teamId = resolvedParams.id;
  
  const team = ALL_TEAMS.find(t => t.id === teamId) || { name: 'Squadra', logo: '?', league: 'A' };
  
  // Fetch delle news live (Google News RSS)
  const news = await fetchNewsForTeam(team.name);

  // Caricamento Deep Squads (Mock generato)
  let squadData = null;
  try {
    const squadsPath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
    const allSquads = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));
    squadData = allSquads[teamId] || null;
  } catch (error) {
    console.error('Error loading deepSquads:', error);
  }

  return <TeamHubClient team={team} news={news} squadData={squadData} />;
}
