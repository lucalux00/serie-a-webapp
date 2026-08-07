import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termini e Condizioni", description: "Termini di utilizzo del servizio." };

export default function TermsPage() {
  return <article className="mx-auto max-w-3xl space-y-6 p-4 pb-28 text-sm leading-relaxed text-[#CBD5E1]">
    <h1 className="text-2xl font-bold text-[#F8FAFC]">Termini e Condizioni</h1>
    <p>Ultimo aggiornamento: 7 agosto 2026.</p>
    <section><h2 className="font-bold text-[#F8FAFC]">Utilizzo del servizio</h2><p>Il servizio fornisce contenuti informativi relativi al calcio. L&apos;utente si impegna a usarlo in modo lecito, corretto e senza comprometterne sicurezza, disponibilità o diritti di terzi.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Contenuti e fonti</h2><p>Notizie, dati e analisi hanno finalità esclusivamente informative. Gli eventuali collegamenti a fonti esterne restano soggetti ai termini e alle politiche dei rispettivi titolari. Non costituiscono consulenza professionale o invito a scommettere.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Proprietà intellettuale</h2><p>Marchi, layout, software e contenuti originali sono protetti dalle norme applicabili. Non è consentita la riproduzione o distribuzione non autorizzata dei contenuti.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Limitazione di responsabilità</h2><p>Il servizio è fornito nello stato in cui si trova. Pur adottando ragionevoli misure di aggiornamento, non garantiamo completezza, continuità o assenza di errori nei dati e nei contenuti.</p></section>
    <section><h2 className="font-bold text-[#F8FAFC]">Modifiche</h2><p>I presenti termini possono essere aggiornati; la versione pubblicata su questa pagina è quella applicabile al momento dell&apos;utilizzo.</p></section>
  </article>;
}
