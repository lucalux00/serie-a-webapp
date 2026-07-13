import React from 'react';
import FantaLiveTable from '@/components/domain/FantaLiveTable';

export default function FantacalcioPage() {
  return (
    <div className="flex flex-col w-full h-full p-4 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          Voti Live <span className="ml-2 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
        </h1>
        <FantaLiveTable />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Consigli della Settimana</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1E293B] border border-[#10B981]/50 rounded-xl p-4 shadow-md flex flex-col justify-end h-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-[#10B981]/10 rounded-bl-full">
              <span className="text-[#10B981] font-black text-2xl">+3</span>
            </div>
            <h3 className="font-bold text-sm z-10 leading-tight">Top 5 Difensori per questa giornata</h3>
          </div>
          
          <div className="bg-[#1E293B] border border-[#F59E0B]/50 rounded-xl p-4 shadow-md flex flex-col justify-end h-32">
            <h3 className="font-bold text-sm leading-tight text-[#F59E0B]">Scommesse e Sorprese</h3>
          </div>
          
          <div className="bg-[#1E293B] border border-[#EF4444]/50 rounded-xl p-4 shadow-md flex flex-col justify-end h-32 col-span-2">
            <h3 className="font-bold text-sm leading-tight text-[#EF4444]">Indisponibili e Squalificati Ufficiali</h3>
          </div>
        </div>
      </section>
    </div>
  );
}
