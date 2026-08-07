import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="border-t border-[#334155] bg-[#0F172A]/95 px-4 py-5 text-center text-xs text-[#94A3B8]">
      <nav aria-label="Link legali" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link className="transition-colors hover:text-[#F8FAFC]" href="/privacy-policy">Privacy Policy</Link>
        <Link className="transition-colors hover:text-[#F8FAFC]" href="/terms">Termini e Condizioni</Link>
        <Link className="transition-colors hover:text-[#F8FAFC]" href="/contacts">Contatti</Link>
      </nav>
    </footer>
  );
}
