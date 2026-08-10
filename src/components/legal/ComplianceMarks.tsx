type ComplianceMarksProps = {
  compact?: boolean;
  className?: string;
};

export default function ComplianceMarks({ compact = false, className = "" }: ComplianceMarksProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`} aria-label="Gioco legale riservato ai maggiorenni">
      <span
        className={`inline-flex items-center rounded-md border border-slate-500 bg-white font-black text-slate-900 ${compact ? "h-7 gap-1 px-2 text-[10px]" : "h-10 gap-2 px-3 text-xs"}`}
        aria-label="Logo ADM - Agenzia delle Dogane e dei Monopoli"
      >
        <span className="bg-gradient-to-b from-emerald-600 via-white to-red-600 bg-clip-text text-transparent">ADM</span>
        <span className="font-bold text-slate-600">Gioco legale</span>
      </span>
      <span
        className={`inline-grid place-items-center rounded-full border-2 border-red-500 bg-white font-black text-red-600 ${compact ? "size-7 text-[10px]" : "size-10 text-sm"}`}
        aria-label="Logo più 18 - gioco vietato ai minori"
      >
        +18
      </span>
    </div>
  );
}
