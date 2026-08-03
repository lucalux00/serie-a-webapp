import deepSquads from '@/data/deepSquads.json';
import { ALL_TEAMS } from '@/data/teams';

export type FantaRole = 'POR' | 'DIF' | 'CEN' | 'ATT';
const validRoles = new Set<FantaRole>(['POR', 'DIF', 'CEN', 'ATT']);
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const playerRoles = new Map<string, FantaRole>();
for (const [teamId, squad] of Object.entries(deepSquads)) {
  for (const player of squad.firstTeam.players) playerRoles.set(`${teamId}:${normalize(player.name)}`, player.position as FantaRole);
}

export function canonicalRole(name: string, team: string, candidate?: string | null): FantaRole | null {
  const teamId = ALL_TEAMS.find((item) => normalize(item.id) === normalize(team) || normalize(item.name) === normalize(team))?.id || team;
  return playerRoles.get(`${teamId}:${normalize(name)}`) || (candidate && validRoles.has(candidate as FantaRole) ? candidate as FantaRole : null);
}
