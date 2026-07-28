import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calciomercato live',
  description: 'Trasferimenti, trattative e rumor: consulta il calciomercato filtrato per campionato e squadra.',
  alternates: { canonical: '/mercato' },
};

export default function MercatoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
