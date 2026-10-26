import { ChevronDown } from "lucide-react";

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  className = "",
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-2.5 hidden items-center text-slate-500 sm:flex" aria-hidden="true">
            {icon}
          </span>
        )}
        <select
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-9 w-full min-w-0 appearance-none truncate rounded-lg border border-slate-300 bg-white pr-8 text-sm font-medium text-slate-900 shadow-xs hover:border-slate-400 focus-visible:border-indigo-600 ${icon ? "pl-3 sm:pl-8" : "pl-3"}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      </div>
    </div>
  );
}
