"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/common/ui";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  pageSize?: number;
  emptyTitle?: string;
}

export function DataTable<T>({ rows, columns, rowKey, searchText, searchPlaceholder = "Search…", toolbar, pageSize = 8, emptyTitle = "Nothing here yet" }: Props<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = term && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(term)) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) out = [...out].sort((a, b) => (col.sortValue!(a) > col.sortValue!(b) ? 1 : col.sortValue!(a) < col.sortValue!(b) ? -1 : 0) * sort.dir);
    }
    return out;
  }, [rows, q, sort, columns, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {searchText && (
          <label className="relative md:w-72">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-full border-[1.5px] border-line bg-white pr-4 pl-10 text-sm focus:border-ink focus:outline-none"
            />
          </label>
        )}
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title={q ? "No results" : emptyTitle} description={q ? `Nothing matches “${q}”.` : undefined} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-cream-2 text-xs tracking-wide text-muted uppercase">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className={cn("px-4 py-3 font-semibold", c.className)}>
                      {c.sortValue ? (
                        <button
                          className="inline-flex items-center gap-1 uppercase hover:text-ink"
                          onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}
                        >
                          {c.header}
                          {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {slice.map((r) => (
                  <tr key={rowKey(r)} className="transition hover:bg-cream-2/60">
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              Showing {current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className="grid size-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30">
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 font-semibold text-ink">
                {current + 1} / {pages}
              </span>
              <button aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="grid size-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function IconButton({ label, onClick, children, tone = "default" }: { label: string; onClick: () => void; children: ReactNode; tone?: "default" | "danger" | "success" }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("grid size-9 place-items-center rounded-full transition", tone === "danger" ? "text-danger hover:bg-danger/10" : tone === "success" ? "text-success hover:bg-success/10" : "text-ink-soft hover:bg-cream hover:text-ink")}
    >
      {children}
    </button>
  );
}
