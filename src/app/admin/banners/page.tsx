"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert, ArrowLeft, Plus, Megaphone, Zap, AlertTriangle,
  Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, CheckCircle, XCircle, Save, X
} from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  type: 'info' | 'promo' | 'warning';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const TYPE_META = {
  info: { label: 'Info', icon: <Megaphone size={14} />, color: 'text-[var(--color-sport-secondary)] bg-[var(--color-sport-secondary)]/10' },
  promo: { label: 'Promo', icon: <Zap size={14} />, color: 'text-[var(--color-sport-warning)] bg-[var(--color-sport-warning)]/10' },
  warning: { label: 'Warning', icon: <AlertTriangle size={14} />, color: 'text-[var(--color-sport-danger)] bg-[var(--color-sport-danger)]/10' },
};

const EMPTY_FORM = {
  title: '',
  message: '',
  link: '',
  linkLabel: '',
  type: 'info' as Banner['type'],
  isActive: true,
  startDate: '',
  endDate: '',
};

export default function AdminBannersPage() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const isAdmin = user && (user.isAdmin || user.email === 'lucapinelli0000@gmail.com' || user.email === 'luca.pinelli0000@gmail.com');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      setBanners(data);
    } catch {
      showFeedback('err', 'Errore nel caricamento dei banner');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'ok' | 'err', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (b: Banner) => {
    setForm({
      title: b.title ?? '',
      message: b.message,
      link: b.link ?? '',
      linkLabel: b.linkLabel ?? '',
      type: b.type,
      isActive: b.isActive,
      startDate: b.startDate ? b.startDate.slice(0, 16) : '',
      endDate: b.endDate ? b.endDate.slice(0, 16) : '',
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.message) {
      showFeedback('err', 'Il messaggio è obbligatorio');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        link: form.link || null,
        linkLabel: form.linkLabel || null,
        title: form.title || null,
      };

      const res = editingId
        ? await fetch(`/api/banners/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

      if (!res.ok) throw new Error('Errore nel salvataggio');

      showFeedback('ok', editingId ? 'Banner aggiornato!' : 'Banner creato!');
      setShowForm(false);
      await fetchBanners();
    } catch {
      showFeedback('err', 'Salvataggio fallito');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo banner?')) return;
    try {
      await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      showFeedback('ok', 'Banner eliminato');
      await fetchBanners();
    } catch {
      showFeedback('err', 'Errore eliminazione');
    }
  };

  const handleToggle = async (b: Banner) => {
    try {
      await fetch(`/api/banners/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...b, isActive: !b.isActive, startDate: b.startDate ?? null, endDate: b.endDate ?? null, link: b.link ?? null, linkLabel: b.linkLabel ?? null, title: b.title ?? null }),
      });
      await fetchBanners();
    } catch {
      showFeedback('err', 'Errore toggle');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-[var(--color-sport-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-black uppercase text-white">Accesso Negato</h1>
        <p className="text-[var(--color-sport-muted)] mt-2">Devi essere amministratore.</p>
        <Link href="/" className="text-[var(--color-sport-primary)] mt-4 inline-block font-bold">← Torna alla Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <Link href="/admin/brand-kit" className="inline-flex items-center text-[var(--color-sport-muted)] hover:text-white transition-colors mb-4 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Megaphone className="text-[var(--color-sport-primary)]" />
              Gestione Banner
            </h1>
            <p className="text-[var(--color-sport-muted)] text-sm mt-1">
              Max 1 banner attivo mostrato per sessione. Appare dopo 3 secondi, chiudibile dall'utente.
            </p>
          </div>
          <button
            onClick={openNew}
            id="add-banner-btn"
            className="flex items-center gap-2 bg-[var(--color-sport-primary)] text-[#0f172a] font-black text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Nuovo
          </button>
        </div>
      </header>

      {/* Feedback toast */}
      {feedback && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${feedback.type === 'ok' ? 'bg-[var(--color-sport-primary)]/20 text-[var(--color-sport-primary)] border border-[var(--color-sport-primary)]/30' : 'bg-[var(--color-sport-danger)]/20 text-[var(--color-sport-danger)] border border-[var(--color-sport-danger)]/30'}`}>
          {feedback.type === 'ok' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* Form creazione/modifica */}
      {showForm && (
        <div className="mb-6 bg-[var(--color-sport-card)]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-white text-base">{editingId ? 'Modifica Banner' : 'Nuovo Banner'}</h2>
            <button onClick={() => setShowForm(false)} className="text-[var(--color-sport-muted)] hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Titolo */}
            <div>
              <label className="text-[10px] text-[var(--color-sport-muted)] font-bold uppercase tracking-widest block mb-1">Titolo (opzionale)</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="es. ⚡ Novità"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-sport-muted)] focus:outline-none focus:border-[var(--color-sport-primary)]/50"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="text-[10px] text-[var(--color-sport-muted)] font-bold uppercase tracking-widest block mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as Banner['type'] }))}
                className="w-full bg-[var(--color-sport-card)] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-sport-primary)]/50"
              >
                <option value="info">Info (Blu)</option>
                <option value="promo">Promo (Giallo)</option>
                <option value="warning">Warning (Rosso)</option>
              </select>
            </div>
          </div>

          {/* Messaggio */}
          <div>
            <label className="text-[10px] text-[var(--color-sport-muted)] font-bold uppercase tracking-widest block mb-1">Messaggio *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Testo del banner visualizzato agli utenti..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-sport-muted)] focus:outline-none focus:border-[var(--color-sport-primary)]/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Link */}
            <div>
              <label className="text-[10px] text-[var(--color-sport-muted)] font-bold uppercase tracking-widest block mb-1">Link (opzionale)</label>
              <input
                type="text"
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="/fantacalcio o https://..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-sport-muted)] focus:outline-none focus:border-[var(--color-sport-primary)]/50"
              />
            </div>
            {/* Label link */}
            <div>
              <label className="text-[10px] text-[var(--color-sport-muted)] font-bold uppercase tracking-widest block mb-1">Etichetta CTA</label>
              <input
                type="text"
                value={form.linkLabel}
                onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))}
                placeholder="es. Scopri, Vai, Leggi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-sport-muted)] focus:outline-none focus:border-[var(--color-sport-primary)]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data inizio */}
            <div>
              <label className="text-[10px] text-[var(--color-sport-muted)] font-bold uppercase tracking-widest block mb-1">Data Inizio (opzionale)</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-sport-primary)]/50"
              />
            </div>
            {/* Data fine */}
            <div>
              <label className="text-[10px] text-[var(--color-sport-muted)] font-bold uppercase tracking-widest block mb-1">Data Fine (opzionale)</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-sport-primary)]/50"
              />
            </div>
          </div>

          {/* Toggle attivo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`transition-colors ${form.isActive ? 'text-[var(--color-sport-primary)]' : 'text-[var(--color-sport-muted)]'}`}
            >
              {form.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
            <span className="text-sm text-white font-bold">{form.isActive ? 'Attivo' : 'Disattivo'}</span>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            id="save-banner-btn"
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-sport-primary)] text-[#0f172a] font-black py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvataggio...' : 'Salva Banner'}
          </button>
        </div>
      )}

      {/* Lista banner */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-sport-primary)]" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Megaphone className="w-12 h-12 text-[var(--color-sport-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-[var(--color-sport-muted)] font-bold">Nessun banner creato.</p>
          <p className="text-xs text-[var(--color-sport-muted)] mt-1">Clicca "Nuovo" per aggiungerne uno.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => {
            const meta = TYPE_META[b.type];
            return (
              <div
                key={b.id}
                className={`bg-[var(--color-sport-card)]/50 backdrop-blur-md border rounded-2xl p-4 transition-all ${b.isActive ? 'border-white/10' : 'border-white/5 opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Tipo badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase shrink-0 ${meta.color}`}>
                    {meta.icon}
                    {meta.label}
                  </div>

                  {/* Contenuto */}
                  <div className="flex-1 min-w-0">
                    {b.title && (
                      <p className="text-xs font-black text-white">{b.title}</p>
                    )}
                    <p className="text-sm text-[var(--color-sport-muted)] truncate">{b.message}</p>
                    {b.link && (
                      <p className="text-[10px] text-[var(--color-sport-secondary)] mt-0.5 truncate">🔗 {b.link}</p>
                    )}
                    {(b.startDate || b.endDate) && (
                      <p className="text-[10px] text-[var(--color-sport-muted)] mt-0.5">
                        {b.startDate && `Dal ${new Date(b.startDate).toLocaleDateString('it-IT')}`}
                        {b.endDate && ` → ${new Date(b.endDate).toLocaleDateString('it-IT')}`}
                      </p>
                    )}
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle attivo */}
                    <button
                      onClick={() => handleToggle(b)}
                      title={b.isActive ? 'Disattiva' : 'Attiva'}
                      className={`p-2 rounded-lg transition-colors ${b.isActive ? 'text-[var(--color-sport-primary)] hover:bg-[var(--color-sport-primary)]/10' : 'text-[var(--color-sport-muted)] hover:bg-white/5'}`}
                    >
                      {b.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => openEdit(b)}
                      title="Modifica"
                      className="p-2 rounded-lg text-[var(--color-sport-muted)] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(b.id)}
                      title="Elimina"
                      className="p-2 rounded-lg text-[var(--color-sport-muted)] hover:text-[var(--color-sport-danger)] hover:bg-[var(--color-sport-danger)]/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info setup */}
      <div className="mt-8 bg-[var(--color-sport-card)]/30 border border-white/5 rounded-2xl p-4 text-xs text-[var(--color-sport-muted)] space-y-1">
        <p className="font-bold text-[var(--color-sport-muted)] uppercase tracking-wide text-[10px] mb-2">ℹ️ Note operative</p>
        <p>• Solo il <strong>primo banner attivo</strong> nel periodo valido viene mostrato all'utente.</p>
        <p>• Il banner appare <strong>dopo 3 secondi</strong> dal caricamento pagina.</p>
        <p>• L'utente può chiuderlo; non riapparirà per <strong>24 ore</strong>.</p>
        <p>• Prima di usare, esegui la migrazione: <code className="bg-white/5 px-1 py-0.5 rounded">/api/migrate/banners</code></p>
      </div>
    </div>
  );
}
