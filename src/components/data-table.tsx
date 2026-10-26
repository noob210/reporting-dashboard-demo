"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  sortValue?: (row: T) => number | string;
  cell: (row: T) => ReactNode;
  /** Applied to both header and body cells. */
  className?: string;
  /** Sort descending first (useful for numeric "more is better" columns). */
  defaultDesc?: boolean;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  caption,
  initialSort = null,
  emptyMessage = "No rows match your filters.",
  minWidth = 640,
  footer,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  caption: string;
  initialSort?: SortState;
  emptyMessage?: string;
  minWidth?: number;
  footer?: ReactNode;
}) {
  const [sort, setSort] = useState<SortState>(initialSort);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const getValue = column.sortValue;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
      return String(va).localeCompare(String(vb)) * factor;
    });
  }, [rows, columns, sort]);

  function toggle(column: Column<T>) {
    setSort((prev) => {
      if (prev?.key === column.key) return { key: column.key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key: column.key, dir: column.defaultDesc ? "desc" : "asc" };
    });
  }

  return (
    <div
      className="relative -mx-5 overflow-x-auto overscroll-x-contain sm:-mx-6"
      role="region"
      aria-label={`${caption} (scrollable)`}
      tabIndex={0}
    >
      <table className="w-full border-separate border-spacing-0 text-sm" style={{ minWidth }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : column.sortValue ? "none" : undefined;
              const alignClass = column.align === "right" ? "text-right" : "text-left";
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`sticky top-0 border-y border-slate-200 bg-slate-50/90 px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-slate-600 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6 ${alignClass} ${column.className ?? ""}`}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(column)}
                      className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1 hover:bg-slate-200/60 hover:text-slate-900 ${column.align === "right" ? "flex-row-reverse" : ""} ${active ? "text-slate-900" : ""}`}
                    >
                      <span>{column.header}</span>
                      {active ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 text-slate-500" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {active ? `, sorted ${sort.dir === "asc" ? "ascending" : "descending"}` : ", sortable"}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-slate-600">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={getRowId(row)} className="group">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`border-b border-slate-100 px-3 py-3 whitespace-nowrap text-slate-700 tabular-nums group-last:border-b-0 group-hover:bg-slate-50/70 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6 ${column.align === "right" ? "text-right" : "text-left"} ${column.className ?? ""}`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer}
      </table>
    </div>
  );
}
