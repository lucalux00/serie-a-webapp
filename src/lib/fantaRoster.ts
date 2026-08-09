import deepSquads from '@/data/deepSquads.json';
import { ALL_TEAMS } from '@/data/teams';

export type FantaRole = 'POR' | 'DIF' | 'CEN' | 'ATT';
const validRoles = new Set<FantaRole>(['POR', 'DIF', 'CEN', 'ATT']);
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function cleanPlayerName(value: string) {
  return value.replace(/\s*\([^)]*\)\s*$/u, '').trim();
}

const playerRoles = new Map<string, FantaRole>();
const playerRolesByName = new Map<string, FantaRole>();
const ambiguousNames = new Set<string>();
for (const [teamId, squad] of Object.entries(deepSquads)) {
  for (const player of squad.firstTeam.players) {
    if (!validRoles.has(player.position as FantaRole)) continue;
    const role = player.position as FantaRole;
    const name = normalize(cleanPlayerName(player.name));
    playerRoles.set(`${teamId}:${name}`, role);
    const existing = playerRolesByName.get(name);
    if (existing && existing !== role) ambiguousNames.add(name);
    else playerRolesByName.set(name, role);
  }
}

export function canonicalRole(name: string, team: string): FantaRole | null {
  const teamId = ALL_TEAMS.find((item) => normalize(item.id) === normalize(team) || normalize(item.name) === normalize(team))?.id || team;
  const normalizedName = normalize(cleanPlayerName(name));
  return playerRoles.get(`${teamId}:${normalizedName}`) || (!ambiguousNames.has(normalizedName) ? playerRolesByName.get(normalizedName) || null : null);
}

export function isFantaRole(value: unknown): value is FantaRole {
  return typeof value === 'string' && validRoles.has(value as FantaRole);
}
