import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pronostici e analisi statistiche',
  description: 'Prossimi match, selezioni del modello e analisi statistiche sul calcio, a solo scopo informativo.',
  alternates: { canonical: '/pronostici' },
};

export default function PronosticiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
