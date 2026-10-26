import type { ReactNode } from "react";

export function Card({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "",
  id,
  headingLevel = 3,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section
      aria-labelledby={title && id ? `${id}-title` : undefined}
      className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-8px_rgba(15,23,42,0.08)] ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            {title && (
              <Heading id={id ? `${id}-title` : undefined} className="text-[15px] font-semibold tracking-tight text-slate-900">
                {title}
              </Heading>
            )}
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={`px-5 pb-5 pt-4 sm:px-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function SectionHeading({ id, title, description, icon }: { id: string; title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {icon && (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
    </div>
  );
}
