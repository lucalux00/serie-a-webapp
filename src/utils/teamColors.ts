export const TEAM_COLORS: Record<string, { primary: string, secondary: string }> = {
  atalanta: { primary: '#2563EB', secondary: '#1E40AF' }, // blue-600, blue-800
  bologna: { primary: '#B91C1C', secondary: '#7F1D1D' }, // red-700, red-900
  cagliari: { primary: '#1E3A8A', secondary: '#172554' }, // blue-900, blue-950
  como: { primary: '#3B82F6', secondary: '#2563EB' }, // blue-500, blue-600
  empoli: { primary: '#1D4ED8', secondary: '#1E40AF' }, // blue-700, blue-800
  fiorentina: { primary: '#9333EA', secondary: '#7E22CE' }, // purple-600, purple-700
  genoa: { primary: '#991B1B', secondary: '#7F1D1D' }, // red-800, red-900
  inter: { primary: '#1E40AF', secondary: '#172554' }, // blue-800, blue-950
  juventus: { primary: '#000000', secondary: '#333333' }, // black, dark gray
  lazio: { primary: '#38BDF8', secondary: '#0EA5E9' }, // sky-400, sky-500
  lecce: { primary: '#EAB308', secondary: '#CA8A04' }, // yellow-500, yellow-600
  milan: { primary: '#DC2626', secondary: '#000000' }, // red-600, black
  monza: { primary: '#EF4444', secondary: '#DC2626' }, // red-500, red-600
  napoli: { primary: '#0EA5E9', secondary: '#0284C7' }, // sky-500, sky-600
  parma: { primary: '#FACC15', secondary: '#EAB308' }, // yellow-400, yellow-500
  roma: { primary: '#B91C1C', secondary: '#F59E0B' }, // red-700, warning
  torino: { primary: '#7F1D1D', secondary: '#450A0A' }, // red-900, red-950
  udinese: { primary: '#000000', secondary: '#FFFFFF' }, // black, white
  venezia: { primary: '#F97316', secondary: '#22C55E' }, // orange-500, green-500
  verona: { primary: '#1E40AF', secondary: '#FACC15' }, // blue-800, yellow-400
};

export function getTeamColors(teamId?: string | null) {
  if (!teamId || !TEAM_COLORS[teamId]) {
    return { primary: '#10B981', secondary: '#0EA5E9' }; // default sport colors
  }
  return TEAM_COLORS[teamId];
}
