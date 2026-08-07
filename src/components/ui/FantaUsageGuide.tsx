"use client";

import { CircleHelp } from 'lucide-react';

type FantaUsageGuideProps = {
  title?: string;
  steps: string[];
  accentClassName?: string;
};

export default function FantaUsageGuide({
  title = 'Come usare questa scheda',
  steps,
  accentClassName = 'text-emerald-300',
}: FantaUsageGuideProps) {
  return (
    <aside className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4" aria-label={title}>
      <div className="flex items-start gap-3">
        <CircleHelp className={`mt-0.5 h-5 w-5 shrink-0 ${accentClassName}`} aria-hidden="true" />
        <div>
          <h2 className="text-sm font-black text-white">{title}</h2>
          <ol className="mt-2 grid gap-1.5 text-xs leading-relaxed text-slate-300 sm:grid-cols-3 sm:gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className={`font-black ${accentClassName}`}>{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  );
}
