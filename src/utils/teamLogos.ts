import { ALL_TEAMS } from '@/data/teams';

export function getTeamLogoUrl(teamName: string, defaultCrest?: string): string {
  if (!teamName) return defaultCrest || '';
  
  // Normalizza e cerca match esatto
  const searchName = teamName.toLowerCase().trim();
  let t = ALL_TEAMS.find(x => x.name.toLowerCase() === searchName || x.id.toLowerCase() === searchName);
  
  // Se non lo trova esatto, cerca se è contenuto
  if (!t) {
    t = ALL_TEAMS.find(x => searchName.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(searchName));
  }
  
  if (t && t.logoUrl) {
    return t.logoUrl;
  }
  
  // Se ha già un crest di fallback fornito (es. football-data API), usalo
  if (defaultCrest) {
    return defaultCrest;
  }

  // Genera un bel crest con le iniziali
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff&bold=true`;
}
