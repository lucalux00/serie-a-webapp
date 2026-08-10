import Link from "next/link";
import CookiePreferencesButton from "@/components/layout/CookiePreferencesButton";
import ComplianceMarks from "@/components/legal/ComplianceMarks";

export default function LegalFooter() {
  return (
    <footer className="border-t border-[#334155] bg-[#0F172A]/95 px-4 py-8 text-center text-xs text-[#94A3B8]">
      <div className="mx-auto max-w-5xl">
        <ComplianceMarks />
        <div className="mx-auto mt-5 max-w-3xl space-y-2 leading-5">
          <p className="font-bold text-[#CBD5E1]">Il gioco d&apos;azzardo è vietato ai minori di 18 anni e può causare dipendenza patologica.</p>
          <p>Tattica e Pronostici è un portale informativo di analisi statistiche sul calcio. Non raccoglie scommesse e non offre collegamenti a operatori di gioco.</p>
        </div>
        <nav aria-label="Link legali" className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[#334155]/70 pt-5">
          <Link className="transition-colors hover:text-[#F8FAFC]" href="/privacy-policy">Privacy Policy</Link>
          <Link className="transition-colors hover:text-[#F8FAFC]" href="/terms">Termini e Condizioni</Link>
          <Link className="transition-colors hover:text-[#F8FAFC]" href="/contacts">Contatti</Link>
          <CookiePreferencesButton />
        </nav>
      </div>
    </footer>
  );
}
