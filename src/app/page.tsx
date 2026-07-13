import React from 'react';
import TeamSelector from '@/components/domain/TeamSelector';

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-4">Scegli la tua squadra</h1>
      <TeamSelector />
      
      {/* Placeholder per il Team Hub */}
      <div className="mt-8 bg-[#1E293B] rounded-xl p-6 text-center border border-[#334155]">
        <p className="text-[#94A3B8]">Seleziona una squadra per aprire l'hub dedicato (News, Rosa, Statistiche).</p>
      </div>
    </div>
  );
}
