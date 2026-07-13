"use client";

import React from 'react';
import { MOCK_FANTA } from '@/data/mockData';

export default function FantaLiveTable() {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-lg w-full">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0F172A] text-[#94A3B8] text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Giocatore</th>
            <th className="px-2 py-3 text-center">Base</th>
            <th className="px-2 py-3 text-center text-[#10B981]">B/M</th>
            <th className="px-4 py-3 text-right">Fin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]">
          {MOCK_FANTA.map(row => {
            const isZero = row.final === 0;
            return (
              <tr key={row.id} className="hover:bg-[#334155]/30 transition-colors">
                <td className="px-4 py-3 font-semibold">{row.player}</td>
                <td className="px-2 py-3 text-center text-[#94A3B8]">{isZero ? '-' : row.baseVote}</td>
                <td className={`px-2 py-3 text-center font-bold ${row.bonus > 0 ? 'text-[#10B981]' : row.malus > 0 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                  {isZero ? '-' : `${row.bonus > 0 ? '+' : ''}${row.bonus - row.malus !== 0 ? (row.bonus > 0 ? row.bonus : -row.malus) : ''}`}
                </td>
                <td className="px-4 py-3 text-right font-black text-[#0EA5E9]">{isZero ? 'S.V.' : row.final}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
