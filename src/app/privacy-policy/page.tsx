import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", description: "Informativa sul trattamento dei dati personali." };

const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contatti@esempio.it";
const owner = process.env.NEXT_PUBLIC_LEGAL_ENTITY || "Tattica & Pronostici";

export default function PrivacyPolicyPage() {
  return <article className="mx-auto max-w-3xl space-y-6 p-4 pb-28 text-sm leading-relaxed text-[#CBD5E1]">
    <h1 className="text-2xl font-bold text-[#F8FAFC]">Privacy Policy</h1>
    <p>Ultimo aggiornamento: 7 agosto 2026.</p>
    <section><h2 className="font-bold text-[#F8FAFC]">Titolare del trattamento</h2><p>{owner}. Per richieste sulla privacy: <a className="text-[#10B981] underline" href={`mailto:${email}`}>{email}</a>.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Dati trattati e finalità</h2><p>Trattiamo i dati necessari al funzionamento del servizio, incluse preferenze locali e dati eventualmente forniti dall&apos;utente. I dati sono usati per erogare il servizio, gestire la sicurezza e adempiere agli obblighi di legge.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Cookie, analytics e pubblicità</h2><p>I cookie tecnici sono necessari al funzionamento. Strumenti di analisi e pubblicitari saranno attivati solo dopo il consenso, tramite il gestore di consenso cookie configurato sul sito. Le preferenze possono essere modificate dal relativo banner.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Base giuridica e conservazione</h2><p>Il trattamento si basa sull&apos;esecuzione del servizio, sugli obblighi di legge, sul legittimo interesse per sicurezza e prevenzione abusi, oppure sul consenso quando richiesto. I dati sono conservati per il tempo strettamente necessario alle finalità indicate.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Diritti dell&apos;interessato</h2><p>Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità o opposizione al trattamento e revocare il consenso in qualsiasi momento. Hai inoltre diritto di proporre reclamo all&apos;autorità di controllo competente.</p></section>
  </article>;
}
