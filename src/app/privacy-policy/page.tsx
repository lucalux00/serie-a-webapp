import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", description: "Informativa sul trattamento dei dati personali e sull'uso dei cookie." };

const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "privacy@tatticaepronostici.it";
const owner = process.env.NEXT_PUBLIC_LEGAL_ENTITY || "Tattica & Pronostici";

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 p-4 pb-28 text-sm leading-relaxed text-[#CBD5E1]">
      <h1 className="text-2xl font-bold text-[#F8FAFC]">Privacy Policy</h1>
      <p>Ultimo aggiornamento: 9 agosto 2026.</p>
      <section><h2 className="font-bold text-[#F8FAFC]">Titolare del trattamento</h2><p>{owner}. Per richieste relative alla privacy: <a className="text-[#10B981] underline" href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p></section>
      <section><h2 className="font-bold text-[#F8FAFC]">Dati e finalità</h2><p>Trattiamo i dati necessari a fornire il servizio, gestire account e abbonamenti, memorizzare le preferenze richieste, proteggere il sito da abusi e rispondere alle comunicazioni dell’utente. I pagamenti sono gestiti dal fornitore indicato durante l’acquisto; il sito non conserva i dati completi della carta.</p></section>
      <section><h2 className="font-bold text-[#F8FAFC]">Cookie e strumenti opzionali</h2><p>Gli strumenti tecnici indispensabili sono sempre attivi. Analytics e pubblicità sono bloccati fino a una scelta positiva nel banner. Il rifiuto non impedisce l’uso delle funzioni essenziali. Puoi modificare o revocare la scelta con “Preferenze cookie” nel footer.</p></section>
      <section><h2 className="font-bold text-[#F8FAFC]">Notizie e collegamenti esterni</h2><p>Il sito mostra titoli, brevi estratti e collegamenti alle fonti originali. L’apertura di un sito esterno è soggetta all’informativa privacy della relativa fonte; non incorporiamo il testo integrale delle pagine esterne nel lettore interno.</p></section>
      <section><h2 className="font-bold text-[#F8FAFC]">Base giuridica e conservazione</h2><p>Il trattamento si basa sull’esecuzione del servizio, sugli obblighi di legge, sul legittimo interesse alla sicurezza oppure sul consenso, quando richiesto. I dati sono conservati solo per il periodo necessario alle finalità indicate e agli eventuali obblighi applicabili.</p></section>
      <section><h2 className="font-bold text-[#F8FAFC]">Diritti</h2><p>Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità o opposizione e revocare il consenso in qualsiasi momento. Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali.</p></section>
    </article>
  );
}
