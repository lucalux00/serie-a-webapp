"use client";

import { useState } from 'react';

export default function AdminPromotions() {
  const [email, setEmail] = useState('');
  const [months, setMonths] = useState(1);
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState(20);
  const [kind, setKind] = useState<'discount' | 'gift'>('discount');
  const [message, setMessage] = useState('');
  const isGift = kind === 'gift';

  async function send(body: unknown) {
    setMessage('Salvataggio in corso…');
    const response = await fetch('/api/admin/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    setMessage(data.error || (response.ok ? 'Operazione salvata con successo.' : 'Impossibile salvare l’operazione.'));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-black text-white">Pro, codici e campagne</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">Qui puoi attivare Pro manualmente oppure creare un codice promozionale da condividere con gli utenti.</p>
      </div>

      <section className="rounded-xl bg-slate-900 p-4">
        <h3 className="font-bold text-white">Sblocca Pro per una persona</h3>
        <p className="mt-1 text-xs text-slate-400">Usalo per regalare Pro a un utente già registrato, senza inviare alcun codice.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px_auto] sm:items-end">
          <label className="text-xs font-bold text-slate-300">Email dell’utente<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="es. mario@email.it" className="mt-1.5 w-full rounded bg-slate-800 p-2.5 font-normal text-white outline-none" /></label>
          <label className="text-xs font-bold text-slate-300">Durata Pro (mesi)<input type="number" min="1" value={months} onChange={(event) => setMonths(Number(event.target.value) || 1)} className="mt-1.5 w-full rounded bg-slate-800 p-2.5 font-normal text-white outline-none" /></label>
          <button onClick={() => send({ action: 'grant', email, months })} className="rounded bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950">ATTIVA PRO</button>
        </div>
        <p className="mt-3 rounded-lg bg-slate-800/70 p-2 text-[11px] text-slate-400">Esempio: inserendo <strong className="text-white">mario@email.it</strong> e <strong className="text-white">3</strong>, Mario riceve 3 mesi di Pro gratuiti.</p>
      </section>

      <section className="rounded-xl border border-fuchsia-500/20 bg-slate-900 p-4">
        <h3 className="font-bold text-white">Genera un codice promozionale</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">Il codice viene creato qui e poi comunicato agli utenti. Scegli prima il tipo di vantaggio.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-300">1. Codice da condividere<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="es. ESTATE20" className="mt-1.5 w-full rounded bg-slate-800 p-2.5 font-normal uppercase text-white outline-none" /><span className="mt-1 block font-normal text-slate-500">Solo lettere, numeri, trattini o underscore; minimo 4 caratteri.</span></label>
          <label className="text-xs font-bold text-slate-300">2. Cosa riceve l’utente?<select value={kind} onChange={(event) => setKind(event.target.value as 'discount' | 'gift')} className="mt-1.5 w-full rounded bg-slate-800 p-2.5 font-normal text-white outline-none"><option value="discount">Sconto sul pagamento</option><option value="gift">Pro gratuito</option></select><span className="mt-1 block font-normal text-slate-500">Sconto riduce il prezzo; Pro gratuito attiva direttamente il periodo indicato.</span></label>
          <label className="text-xs font-bold text-slate-300">3. Percentuale di sconto<input disabled={isGift} type="number" min="0" max="100" value={percent} onChange={(event) => setPercent(Number(event.target.value) || 0)} className="mt-1.5 w-full rounded bg-slate-800 p-2.5 font-normal text-white outline-none disabled:cursor-not-allowed disabled:opacity-40" /><span className="mt-1 block font-normal text-slate-500">{isGift ? 'Non serve: hai scelto Pro gratuito.' : 'Esempio: 20 significa che l’utente paga il 20% in meno.'}</span></label>
          <label className="text-xs font-bold text-slate-300">4. Mesi Pro inclusi<input type="number" min="0" value={months} onChange={(event) => setMonths(Number(event.target.value) || 0)} className="mt-1.5 w-full rounded bg-slate-800 p-2.5 font-normal text-white outline-none" /><span className="mt-1 block font-normal text-slate-500">{isGift ? 'Esempio: 3 attiva 3 mesi Pro gratis.' : 'Lascia 0 se il codice offre solo lo sconto.'}</span></label>
        </div>

        <div className="mt-4 rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-100"><strong>Anteprima:</strong> {code || 'ESTATE20'} {isGift ? `regala ${months} ${months === 1 ? 'mese' : 'mesi'} di Pro.` : `applica uno sconto del ${percent}%${months > 0 ? ` e include ${months} ${months === 1 ? 'mese' : 'mesi'} di Pro.` : '.'}`}</div>
        <button onClick={() => send({ action: 'code', code, kind, percent: isGift ? 0 : percent, months })} className="mt-4 rounded bg-fuchsia-600 px-4 py-2.5 text-xs font-black text-white">CREA CODICE</button>
      </section>

      {message && <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-200">{message}</p>}
    </div>
  );
}
