"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ALL_TEAMS } from '@/data/teams';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, RefreshCw, Trash2, Edit2, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'transfers' | 'news'>('transfers');

  const { data: allNews, mutate: mutateNews } = useSWR('/api/news?limit=100', fetcher);

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
    status: 'published',
    link: ''
  });
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || (!user.isAdmin && user.email !== 'lucapinelli0000@gmail.com' && user.email !== 'luca.pinelli0000@gmail.com')) {
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
      const isEditing = editingNewsId !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing ? { ...newsForm, id: editingNewsId } : newsForm;

      const res = await fetch('/api/admin/news', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(isEditing ? '✅ Notizia modificata con successo!' : '✅ Notizia inserita con successo!');
        setNewsForm({ title: '', content: '', type: 'live', status: 'published', link: '' });
        setEditingNewsId(null);
        mutateNews(); // Ricarica la lista dal db
      } else {
        setMessage(`❌ Errore: ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Errore di rete');
    }
    setLoading(false);
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Sicuro di voler eliminare definitivamente questa notizia?')) return;
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('✅ Notizia eliminata.');
        mutateNews();
      }
    } catch (e) {
      setMessage('❌ Errore durante l\'eliminazione');
    }
  };

  const handleEditNews = (news: any) => {
    setEditingNewsId(news.id);
    setNewsForm({
      title: news.title || '',
      content: news.snippet || '',
      type: news.type || 'live',
      status: news.status || 'published',
      link: news.link || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingNewsId(null);
    setNewsForm({ title: '', content: '', type: 'live', status: 'published', link: '' });
  };

  const runCronNews = async () => {
    setMessage('⏳ Avvio fetch feed RSS in corso...');
    try {
      const res = await fetch('/api/cron/news');
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Trovate ${data.fetched} notizie, Inserite ${data.inserted} nuove.`);
        mutateNews();
      } else {
        setMessage(`❌ Errore cron: ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Errore di rete');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
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

        {/* --- TAB MERCATO --- */}
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

        {/* --- TAB NOTIZIE (Auto-gestione) --- */}
        {activeTab === 'news' && (
          <div className="space-y-8">
            <form onSubmit={handleSubmitNews} className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-blue-400 uppercase flex items-center">
                  {editingNewsId ? <Edit2 className="w-3 h-3 mr-1"/> : <Plus className="w-3 h-3 mr-1"/>}
                  {editingNewsId ? 'Modifica Notizia' : 'Inserimento Manuale'}
                </span>
                {!editingNewsId && (
                  <button type="button" onClick={runCronNews} className="flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full transition-colors">
                    <RefreshCw className="w-3 h-3 mr-1" /> Auto-Importa dal Web
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Titolo Notizia</label>
                <input required type="text" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" placeholder="es. Ufficiale: Colpo di mercato..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contenuto (Snippet / Testo Completo)</label>
                <textarea value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none min-h-[100px]" placeholder="Dettagli della notizia..." />
              </div>

              {editingNewsId && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Link Originale (Fonte)</label>
                  <input type="text" value={newsForm.link} onChange={e => setNewsForm({...newsForm, link: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none text-xs" />
                </div>
              )}

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

              <div className="flex gap-2 mt-4">
                {editingNewsId && (
                  <button type="button" onClick={cancelEdit} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-black uppercase text-xs tracking-widest rounded-xl p-4 transition-colors">
                    Annulla
                  </button>
                )}
                <button disabled={loading} type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-xl p-4 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {loading ? 'Salvataggio...' : (editingNewsId ? 'Salva Modifiche' : 'Pubblica Notizia')}
                </button>
              </div>
            </form>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">Gestione Notizie Importate</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                {(!allNews || allNews.length === 0) ? (
                  <div className="text-slate-500 text-sm italic">Nessuna notizia nel database.</div>
                ) : (
                  allNews.map((newsItem: any) => (
                    <div key={newsItem.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-1 bg-slate-800 text-slate-300 rounded uppercase">
                          Fonte: {newsItem.source}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditNews(newsItem)} className="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-1.5 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteNews(newsItem.id)} className="text-red-400 hover:text-red-300 bg-red-500/10 p-1.5 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight">{newsItem.title}</h3>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{new Date(newsItem.pub_date).toLocaleDateString('it-IT')} {newsItem.time}</span>
                        <span>{newsItem.type} / {newsItem.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
