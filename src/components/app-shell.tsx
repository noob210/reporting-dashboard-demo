"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarRange,
  Download,
  Info,
  LayoutDashboard,
  Megaphone,
  Menu,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { CLIENTS } from "@/lib/clients";
import { RANGES, type RangeKey } from "@/lib/data";
import { useDashboard } from "./dashboard-context";
import { SelectField } from "./select-field";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/seo/", label: "SEO", icon: Search },
  { href: "/ads/", label: "Paid Ads", icon: Megaphone },
];

function normalize(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm" aria-hidden="true">
        <BarChart3 className="size-4.5" strokeWidth={2.25} />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight text-slate-900">Northwind Digital</span>
        <span className="block text-xs text-slate-600">Client reporting</span>
      </span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = normalize(usePathname() ?? "/");
  return (
    <nav aria-label="Main">
      <ul className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = normalize(href) === pathname;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`size-4.5 ${active ? "text-indigo-700" : "text-slate-500 group-hover:text-slate-700"}`}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
        <Info className="size-3.5 text-indigo-700" aria-hidden="true" />
        Sample data
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Agency, clients and figures are fictional and generated for demonstration.
      </p>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-8 px-4 py-5">
      <div className="px-1">
        <Brand />
      </div>
      <div className="flex-1">
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">Reports</p>
        <NavLinks onNavigate={onNavigate} />
      </div>
      <SidebarFooter />
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const returnTarget = returnFocusRef.current;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select, [tabindex]:not([tabindex="-1"])') ?? [],
      );
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnTarget?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="animate-drawer-in absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-3 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Close navigation</span>
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}

function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:justify-end sm:px-6" role="status" aria-live="polite">
      {message && (
        <div className="animate-toast-in pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg" data-testid="toast">
          <Info className="mt-0.5 size-4 shrink-0 text-indigo-300" aria-hidden="true" />
          <p>{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="-mr-1 rounded-md p-0.5 text-slate-300 hover:text-white focus-visible:outline-white"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Dismiss notification</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Filters() {
  const { clientId, setClientId, range, setRange } = useDashboard();
  return (
    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 sm:flex sm:flex-none sm:items-end">
      <SelectField
        id="client-select"
        label="Client"
        value={clientId}
        onChange={setClientId}
        options={CLIENTS.map((c) => ({ value: c.id, label: c.name }))}
        className="sm:w-56"
        icon={<Building2 className="size-4" />}
      />
      <SelectField
        id="range-select"
        label="Date range"
        value={range}
        onChange={(value) => setRange(value as RangeKey)}
        options={RANGES.map((r) => ({ value: r.key, label: r.label }))}
        className="sm:w-44"
        icon={<CalendarRange className="size-4" />}
      />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#main-content"
        className="sr-only z-[70] rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-800 shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block" aria-label="Sidebar">
        <div className="sticky top-0 h-dvh">
          <SidebarContent />
        </div>
      </aside>

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} returnFocusRef={menuButtonRef} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
            <div className="flex items-center justify-between gap-3 md:self-center">
              <div className="flex items-center gap-2">
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-expanded={drawerOpen}
                  aria-controls="mobile-navigation"
                  className="-ml-1.5 rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
                >
                  <Menu className="size-5" aria-hidden="true" />
                  <span className="sr-only">Open navigation</span>
                </button>
                <div className="lg:hidden">
                  <Brand />
                </div>
                <p className="hidden text-sm text-slate-600 lg:block">
                  Reporting workspace
                </p>
              </div>
              <div className="md:hidden">
                <ExportButton onClick={() => setToast("Export is disabled in this demo.")} />
              </div>
            </div>
            <div className="flex min-w-0 items-end gap-3">
              <Filters />
              <div className="hidden md:block">
                <ExportButton onClick={() => setToast("Export is disabled in this demo.")} />
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1400px] px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>

        <footer className="mx-auto max-w-[1400px] px-4 pb-8 text-xs text-slate-600 sm:px-6 lg:px-8">
          Northwind Digital is a fictional agency. All clients and metrics on this page are sample data.
        </footer>
      </div>

      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
    >
      <Download className="size-4" aria-hidden="true" />
      Export
    </button>
  );
}
