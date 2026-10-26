const TONES: Record<string, string> = {
  New: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  Contacted: "bg-slate-100 text-slate-700 ring-slate-200",
  Qualified: "bg-amber-50 text-amber-900 ring-amber-200",
  Booked: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Google Ads": "bg-sky-50 text-sky-800 ring-sky-200",
  "Meta Ads": "bg-violet-50 text-violet-800 ring-violet-200",
};

export function Badge({ children }: { children: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[children] ?? TONES.Contacted}`}>
      {children}
    </span>
  );
}
