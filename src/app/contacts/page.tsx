import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contatti", description: "Come contattare Tattica & Pronostici." };

const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contatti@tatticaepronostici.it";
const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "privacy@tatticaepronostici.it";

export default function ContactsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 p-4 pb-28 text-sm leading-relaxed text-[#CBD5E1]">
      <h1 className="text-2xl font-bold text-[#F8FAFC]">Contatti</h1>
      <p>Per assistenza e segnalazioni relative ai contenuti:</p>
      <a className="inline-block rounded-lg border border-[#10B981]/40 bg-[#1E293B] px-4 py-3 font-medium text-[#10B981] underline" href={`mailto:${email}`}>{email}</a>
      <p>Per richieste relative alla protezione dei dati:</p>
      <a className="inline-block rounded-lg border border-[#10B981]/40 bg-[#1E293B] px-4 py-3 font-medium text-[#10B981] underline" href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
    </article>
  );
}
