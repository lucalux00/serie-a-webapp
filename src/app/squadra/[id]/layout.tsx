import type { Metadata } from 'next';
import { ALL_TEAMS } from '@/data/teams';

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const team = ALL_TEAMS.find((item) => item.id === id);
  if (!team) return { title: 'Squadra non trovata' };

  return {
    title: `${team.name}: notizie, rosa e mercato`,
    description: `Segui ${team.name}: rosa, calciomercato, notizie e dati della squadra su Tattica & Pronostici.`,
    alternates: { canonical: `/squadra/${team.id}` },
  };
}

export default function TeamLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
