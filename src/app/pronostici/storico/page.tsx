import React from 'react';
import { ShieldCheck, TrendingUp, BarChart3, Info } from 'lucide-react';
import Link from 'next/link';
import { sql } from '@vercel/postgres';
import { ensurePredictionSchema } from '@/lib/predictionSchema';

export const dynamic = 'force-dynamic';

export default async function MLStoricoPage() {
  const stats = {
    totalPredictions: 0,
    correctPredictions: 0,
    hitRate: 0,
    brierScore: 0,
    modelVersion: 'baseline-v1',
    modelSampleSize: 0,
  };

  try {
    await ensurePredictionSchema();
    const [evaluations, models] = await Promise.all([sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct,
        AVG(brier_score) as avg_brier
      FROM prediction_evaluations
      WHERE is_correct IS NOT NULL
    `, sql`
      SELECT version, sample_size
      FROM prediction_model_weights
      ORDER BY active DESC, created_at DESC
      LIMIT 1
    `]);
    const rows = evaluations.rows;
    
    if (rows && rows.length > 0 && rows[0].total > 0) {
      const total = parseInt(rows[0].total);
      const correct = parseInt(rows[0].correct) || 0;
      const brierScore = parseFloat(rows[0].avg_brier) || 0;
      
      stats.totalPredictions = total;
      stats.correctPredictions = correct;
      stats.hitRate = (correct / total) * 100;
      stats.brierScore = brierScore;
    }
    stats.modelVersion = String(models.rows[0]?.version || 'baseline-v1');
    stats.modelSampleSize = Number(models.rows[0]?.sample_size || 0);
  } catch (error) {
    console.error("Errore fetching stats:", error);
  }

  return (
    <div className="flex flex-col w-full min-h-screen p-4 pb-24">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] mr-3">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Trasparenza MLOps</h1>
          <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Storico e Metriche Algoritmo</p>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <BarChart3 size={100} />
        </div>
        
        <h2 className="text-lg font-black text-white mb-4 relative z-10">Performance Complessiva</h2>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155]">
            <p className="text-xs text-[#94A3B8] uppercase font-bold tracking-wider mb-1">Hit Rate</p>
            <p className="text-3xl font-black text-[#10B981]">{stats.hitRate.toFixed(1)}%</p>
            <p className="text-[10px] text-[#64748B] mt-1">{stats.correctPredictions} su {stats.totalPredictions} prese</p>
          </div>
          
          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155]">
            <p className="text-xs text-[#94A3B8] uppercase font-bold tracking-wider mb-1">Brier Score</p>
            <p className="text-3xl font-black text-[#0EA5E9]">{stats.brierScore.toFixed(3)}</p>
            <p className="text-[10px] text-[#64748B] mt-1">Errore di calibrazione: più basso è meglio</p>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155] col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase font-bold tracking-wider mb-1">Modello attivo</p>
                <p className="text-xl font-black text-[#0EA5E9]">{stats.modelVersion}</p>
                <p className="mt-1 text-[10px] text-[#64748B]">{stats.modelSampleSize} valutazioni nella ricalibrazione</p>
              </div>
              <TrendingUp className="text-[#0EA5E9] opacity-50" size={32} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[#3B82F6]/30 p-5 rounded-xl flex flex-col mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <Info className="text-[#3B82F6]" size={20} />
          <h3 className="text-[#3B82F6] font-bold">Come funziona?</h3>
        </div>
        <p className="text-sm text-[#cbd5e1] leading-relaxed">
          La pipeline acquisisce i risultati reali, confronta ogni selezione con l&apos;esito finale e registra accuratezza e Brier Score.
          Ogni settimana i nuovi dati ricalibrano i pesi usati esclusivamente dai pronostici futuri; i pronostici già generati restano immutabili.
        </p>
      </div>

      <Link 
        href="/pronostici" 
        className="w-full bg-[#334155] hover:bg-[#475569] text-white font-black text-center py-4 rounded-xl transition-colors"
      >
        TORNA AI PRONOSTICI
      </Link>
    </div>
  );
}
