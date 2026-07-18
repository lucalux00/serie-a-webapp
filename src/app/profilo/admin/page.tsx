"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ALL_TEAMS } from '@/data/teams';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'transfers' | 'news'>('transfers');

  // Form Transfers
  const [form, setForm] = useState({
    player: '',
    team_id: '',
    other_team: '',
    fee: '',
    type: 'IN',
    status: 'Trattativa'
  });

  // Form News
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    type: 'live',
    status: 'published'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-white">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black uppercase">Accesso Negato</h1>
        <p className="text-gray-400 mt-2">Devi essere amministratore per vedere questa pagina.</p>
        <Link href="/profilo" className="text-emerald-500 mt-4 inline-block font-bold">Torna al Profilo</Link>
      </div>
    );
  }

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Trattativa inserita con successo!');
        setForm({ ...form, player: '', other_team: '', fee: '' });
      } else {
        setMessage(`❌ Errore: ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Errore di rete');
    }
    setLoading(false);
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsForm)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Notizia inserita con successo!');
        setNewsForm({ ...newsForm, title: '', content: '' });
      } else {
        setMessage(`❌ Errore: ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Errore di rete');
    }
    setLoading(false);
  };

  const runCronNews = async () => {
    setMessage('⏳ Avvio fetch feed RSS in corso...');
    try {
      const res = await fetch('/api/cron/news');
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Trovate ${data.fetched} notizie, Inserite ${data.inserted} nuove.`);
      } else {
        setMessage(`❌ Errore cron: ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Errore di rete');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Link href="/profilo" className="flex items-center text-emerald-500 font-bold mb-6 hover:text-emerald-400 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Torna al Profilo
      </Link>

      <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-fuchsia-500 uppercase tracking-tighter">Pannello Admin</h1>
        </div>

        <div className="flex space-x-2 mb-6">
          <button 
            onClick={() => {setActiveTab('transfers'); setMessage('');}}
            className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase transition-colors ${activeTab === 'transfers' ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            Mercato
          </button>
          <button 
            onClick={() => {setActiveTab('news'); setMessage('');}}
            className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase transition-colors ${activeTab === 'news' ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            Notizie
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${message.includes('✅') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : (message.includes('⏳') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20')}`}>
            {message}
          </div>
        )}

        {activeTab === 'transfers' && (
          <form onSubmit={handleSubmitTransfer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome Giocatore</label>
              <input required type="text" value={form.player} onChange={e => setForm({...form, player: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none" placeholder="es. Romelu Lukaku" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Squadra Principale</label>
              <select required value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none">
                <option value="">-- Seleziona --</option>
                {ALL_TEAMS.filter(t => t.league === 'A').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Direzione</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none">
                  <option value="IN">Acquisto (IN)</option>
                  <option value="OUT">Cessione (OUT)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stato</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none">
                  <option value="Trattativa">Trattativa</option>
                  <option value="Rumor">Rumor</option>
                  <option value="Ufficiale">Ufficiale</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Altra Squadra</label>
              <input required type="text" value={form.other_team} onChange={e => setForm({...form, other_team: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none" placeholder="es. Chelsea" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Costo Cartellino / Dettagli</label>
              <input required type="text" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none" placeholder="es. Prestito con obbligo a 30M" />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-widest rounded-xl p-4 transition-colors shadow-lg shadow-fuchsia-500/20 mt-4 disabled:opacity-50">
              {loading ? 'Inserimento...' : 'Aggiungi Trattativa'}
            </button>
          </form>
        )}

        {activeTab === 'news' && (
          <form onSubmit={handleSubmitNews} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase">Inserimento Manuale</span>
              <button type="button" onClick={runCronNews} className="flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full">
                <RefreshCw className="w-3 h-3 mr-1" /> Forza Fetch RSS
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Titolo Notizia</label>
              <input required type="text" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" placeholder="es. Ufficiale: Colpo di mercato..." />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contenuto (Opzionale)</label>
              <textarea value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none min-h-[100px]" placeholder="Dettagli della notizia..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                <select value={newsForm.type} onChange={e => setNewsForm({...newsForm, type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none">
                  <option value="live">Live News</option>
                  <option value="mercato">Calciomercato</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stato</label>
                <select value={newsForm.status} onChange={e => setNewsForm({...newsForm, status: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none">
                  <option value="published">Pubblicato</option>
                  <option value="ufficiale">Ufficiale</option>
                  <option value="trattativa">Trattativa</option>
                </select>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl p-4 transition-colors shadow-lg shadow-blue-500/20 mt-4 disabled:opacity-50">
              {loading ? 'Inserimento...' : 'Pubblica Notizia'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
