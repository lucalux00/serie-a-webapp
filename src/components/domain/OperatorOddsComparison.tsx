import Image from "next/image";
import { ExternalLink, Info, Scale } from "lucide-react";
import ComplianceMarks from "@/components/legal/ComplianceMarks";

const OPERATORS = [
  {
    name: "Sisal",
    concession: "16020",
    href: "https://www.sisal.it/",
    logo: "/legal/sisal.svg",
    logoClassName: "h-10 w-28",
  },
  {
    name: "Lottomatica",
    concession: "16010",
    href: "https://www.lottomatica.it/",
    logo: "/legal/lottomatica.svg",
    logoClassName: "h-8 w-36",
  },
  {
    name: "bet365",
    concession: "16030",
    href: "https://www.bet365.it/",
    logo: null,
    logoClassName: "",
  },
] as const;

function OperatorLogo({ operator }: { operator: (typeof OPERATORS)[number] }) {
  if (operator.logo) {
    return (
      <Image
        src={operator.logo}
        alt={`Logo ${operator.name}`}
        width={160}
        height={60}
        className={`${operator.logoClassName} object-contain`}
      />
    );
  }

  return (
    <span
      className="inline-flex h-10 items-center rounded-md bg-[#027B5B] px-3 text-xl font-black tracking-tight text-white"
      role="img"
      aria-label="Logo bet365"
    >
      bet<span className="text-[#F6E300]">365</span>
    </span>
  );
}

export default function OperatorOddsComparison() {
  return (
    <section className="mt-14" aria-labelledby="operator-comparison-title">
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sky-300">
          <Scale className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Confronto informativo</p>
          <h2 id="operator-comparison-title" className="mt-1 text-xl font-black text-white sm:text-2xl">Comparazione operatori ADM</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            Tre concessionari autorizzati, mostrati con pari evidenza. Le quote del feed sono aggregate: il valore del singolo operatore va verificato sul relativo sito.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-900/70 shadow-xl shadow-black/10">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
          <caption className="sr-only">Confronto informativo tra tre operatori di gioco autorizzati ADM</caption>
          <thead>
            <tr className="border-b border-slate-700/80 bg-slate-950/60">
              <th scope="col" className="w-36 px-4 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Informazione</th>
              {OPERATORS.map((operator) => (
                <th key={operator.name} scope="col" className="border-l border-slate-700/70 px-5 py-4">
                  <div className="flex h-12 items-center justify-center rounded-lg bg-white px-3">
                    <OperatorLogo operator={operator} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr>
              <th scope="row" className="px-4 py-5 text-xs font-black uppercase tracking-wider text-slate-500">Quota / bonus</th>
              {OPERATORS.map((operator) => (
                <td key={operator.name} className="border-l border-slate-800 px-5 py-5 text-center">
                  <p className="font-black text-white">Quota da verificare</p>
                  <p className="mt-1 text-xs text-slate-500">Nessun bonus evidenziato</p>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-4 py-5 text-xs font-black uppercase tracking-wider text-slate-500">Legalità</th>
              {OPERATORS.map((operator) => (
                <td key={operator.name} className="border-l border-slate-800 px-5 py-5 text-center">
                  <ComplianceMarks compact />
                  <p className="mt-2 text-[11px] font-bold text-slate-500">Concessione ADM n. {operator.concession}</p>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-4 py-5 text-xs font-black uppercase tracking-wider text-slate-500">Approfondimento</th>
              {OPERATORS.map((operator) => (
                <td key={operator.name} className="border-l border-slate-800 px-5 py-5 text-center">
                  <a
                    href={operator.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:border-slate-500 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    aria-label={`Visita il sito di ${operator.name} in una nuova scheda`}
                  >
                    Visita il sito
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Ordine non preferenziale. I collegamenti sono diretti, non affiliati e non costituiscono un invito al gioco.
      </p>
    </section>
  );
}
