"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function WonPredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from /api/predictions/won
    // For now we use mocked data to show the layout
    setTimeout(() => {
      setPredictions([
        {
          id: 1,
          title: "Raddoppio Serie A",
          win_date: "2024-05-18",
          total_odds: "2.10",
          matches: [
            { match: "Inter - Juventus", prediction: "1X", result: "1-0", status: "won" },
            { match: "Milan - Napoli", prediction: "Over 1.5", result: "2-1", status: "won" }
          ]
        },
        {
          id: 2,
          title: "Quota Alta Europei",
          win_date: "2024-06-20",
          total_odds: "12.50",
          matches: [
            { match: "Italia - Spagna", prediction: "X", result: "1-1", status: "won" },
            { match: "Germania - Francia", prediction: "Gol", result: "2-2", status: "won" },
            { match: "Inghilterra - Olanda", prediction: "1", result: "2-0", status: "won" }
          ]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Link href="/profilo" className="flex items-center text-[#94A3B8] hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Torna al Profilo
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-[#F59E0B]/20 rounded-xl">
            <Trophy className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">Pronostici <span className="text-[#F59E0B]">Vinti</span></h1>
            <p className="text-[#94A3B8] text-sm">Lo storico globale delle scommesse centrate dal nostro algoritmo</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {predictions.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1E293B] border border-[#F59E0B]/30 rounded-2xl p-5 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4 border-b border-[#334155] pb-3">
                <h3 className="text-white font-black text-lg">{p.title}</h3>
                <div className="text-right">
                  <span className="block text-xs text-[#94A3B8]">{p.win_date}</span>
                  <span className="block text-[#F59E0B] font-black">Quota: {p.total_odds}</span>
                </div>
              </div>

              <div className="space-y-3">
                {p.matches.map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-[#0F172A] p-3 rounded-xl border border-[#334155]/50">
                    <div>
                      <div className="text-white font-bold text-sm mb-1">{m.match}</div>
                      <div className="text-xs text-[#94A3B8]">
                        Pronostico: <span className="text-white font-bold">{m.prediction}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-center px-3 py-1 bg-[#10B981]/10 rounded-lg border border-[#10B981]/20">
                        <span className="block text-[10px] text-[#10B981] font-black uppercase mb-0.5">Risultato</span>
                        <span className="block text-white font-black text-sm">{m.result}</span>
                      </div>
                      <CheckCircle2 className="text-[#10B981] w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
          
          {predictions.length === 0 && (
            <div className="text-center py-10 bg-[#1E293B] rounded-2xl border border-[#334155]">
              <Trophy className="w-12 h-12 text-[#334155] mx-auto mb-3" />
              <p className="text-[#94A3B8]">Nessun pronostico vinto registrato al momento.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
