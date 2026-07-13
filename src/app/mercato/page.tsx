import React from 'react';
import MarketFeed from '@/components/domain/MarketFeed';

export default function MercatoPage() {
  return (
    <div className="flex flex-col w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-4">Live Calciomercato</h1>
      <MarketFeed />
    </div>
  );
}
