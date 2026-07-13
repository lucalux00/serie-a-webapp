import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center text-[#10B981] mb-6">
        <ShieldAlert size={32} className="mr-3" />
        <h1 className="text-2xl font-bold">Privacy Policy & Dati</h1>
      </div>
      
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4 text-sm text-[#94A3B8]">
        <h2 className="text-[#F8FAFC] font-bold text-lg">1. Diritto d'Autore e News</h2>
        <p>
          Questo sito opera come <strong>Aggregatore RSS</strong> e motore di ricerca verticale per le notizie di calcio.
          Gli articoli mostrati nel portale (Feed News) provengono da feed RSS pubblici (come Google News).
        </p>
        <p>
          In ottemperanza alla <em>Direttiva (UE) 2019/790 sul diritto d'autore nel mercato unico digitale</em> (Articolo 15), 
          il portale non riproduce copie integrali degli articoli, ma si limita a condividere <strong>estratti brevi (snippet)</strong>, titoli e collegamenti ipertestuali diretti (link) alla testata giornalistica originaria, generando traffico per la fonte.
        </p>

        <h2 className="text-[#F8FAFC] font-bold text-lg mt-6">2. Trattamento Dati (GDPR)</h2>
        <p>
          L'applicazione utilizza unicamente cookie tecnici necessari al funzionamento dell'interfaccia (es. preferenze salvate in locale).
          Non sono presenti tracker pubblicitari di terze parti né profilazione dell'utente senza consenso esplicito.
        </p>

        <h2 className="text-[#F8FAFC] font-bold text-lg mt-6">3. Contatti Legali</h2>
        <p>
          Serie A Portal Inc.<br/>
          Corso Vittorio Emanuele II, 12 - Milano (MI)<br/>
          P.IVA: 00000000000
        </p>
      </div>
    </div>
  );
}
