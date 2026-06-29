'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { normalizeSearch } from '@/lib/format';

export interface Column<T> {
  key:       keyof T;
  label:     string;
  align?:    'left' | 'right' | 'center';
  sortable?: boolean;
  render?:   (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns:    Column<T>[];
  rows:       T[];
  caption?:   string;
  pageSize?:  number;
  searchable?: boolean;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  pageSize = 10,
  searchable = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: keyof T; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const normalizedSearch = normalizeSearch(search.trim());
  const filtered = searchable && normalizedSearch
    ? rows.filter(row =>
        columns.some(col => {
          const val = row[col.key];
          return normalizeSearch(String(val ?? '')).includes(normalizedSearch);
        })
      )
    : rows;

  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        const diff =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'pt-BR');
        return sort.dir === 'asc' ? diff : -diff;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const visible    = sorted.slice(start, start + pageSize);

  const toggleSort = (key: keyof T) => {
    setPage(1);
    setSort(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  // Páginas visíveis na navegação (máx. 5)
  const pageWindow = (() => {
    const half = 2;
    let lo = Math.max(1, safePage - half);
    let hi = Math.min(totalPages, safePage + half);
    if (hi - lo < 4) {
      if (lo === 1) hi = Math.min(totalPages, lo + 4);
      else          lo = Math.max(1, hi - 4);
    }
    const pages: number[] = [];
    for (let i = lo; i <= hi; i++) pages.push(i);
    return pages;
  })();

  return (
    <div className="bg-mp-surface rounded-mp-card shadow-mp-card overflow-hidden">
      {/* Caption + Search */}
      {(caption || searchable) && (
        <div className="px-5 py-3 border-b border-mp-border flex items-center justify-between gap-4">
          {caption
            ? <p className="text-[12px] text-mp-muted">{caption}</p>
            : <span />}
          {searchable && (
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mp-faint pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Pesquisar…"
                className="
                  pl-7 pr-3 py-1.5 text-[12px] rounded border border-mp-border
                  bg-mp-head text-mp-text placeholder:text-mp-faint
                  focus:outline-none focus:ring-1 focus:ring-mp-primary focus:border-mp-primary
                  w-48 transition-all
                "
              />
            </div>
          )}
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]" style={{ minWidth: 680 }}>
          <thead>
            <tr className="bg-mp-head border-b border-mp-border">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={`
                    px-4 py-3 text-[11px] font-bold uppercase tracking-[0.4px] text-mp-muted
                    ${col.align === 'right'  ? 'text-right'  :
                      col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer hover:text-mp-text select-none' : ''}
                    whitespace-nowrap
                  `}
                >
                  {col.label}
                  {col.sortable && sort?.key === col.key && (
                    <span className="ml-1">{sort.dir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((row, i) => (
              <tr
                key={start + i}
                className={`
                  border-b border-mp-border last:border-0
                  ${(start + i) % 2 === 1 ? 'bg-mp-row-alt' : 'bg-mp-surface'}
                  hover:bg-mp-head transition-colors
                `}
              >
                {columns.map(col => {
                  const val = row[col.key];
                  return (
                    <td
                      key={String(col.key)}
                      className={`
                        px-4 py-3 text-mp-secondary tabular-nums
                        ${col.align === 'right'  ? 'text-right'  :
                          col.align === 'center' ? 'text-center' : 'text-left'}
                      `}
                    >
                      {col.render ? col.render(val, row) : String(val ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-mp-muted text-[13px]">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé de paginação */}
      {rows.length > 0 && (
        <div className="px-5 py-3 border-t border-mp-border flex items-center justify-between flex-wrap gap-3">
          {/* Info */}
          <p className="text-[12px] text-mp-muted tabular-nums">
            {sorted.length === 0
              ? 'Nenhum registro encontrado'
              : <>
                  {`Exibindo ${start + 1}–${Math.min(start + pageSize, sorted.length)} de ${sorted.length} registro${sorted.length !== 1 ? 's' : ''}`}
                  {searchable && search.trim() && sorted.length !== rows.length && (
                    <span className="ml-1 text-mp-faint">(de {rows.length} total)</span>
                  )}
                </>}
          </p>

          {/* Navegação */}
          {totalPages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Paginação">
              <button
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded text-mp-muted hover:bg-mp-head disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft size={15} strokeWidth={2} />
              </button>

              {pageWindow[0] > 1 && (
                <>
                  <button onClick={() => goTo(1)} className={pageBtn(1 === safePage)}>1</button>
                  {pageWindow[0] > 2 && <span className="px-1 text-mp-faint text-[12px]">…</span>}
                </>
              )}

              {pageWindow.map(p => (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={pageBtn(p === safePage)}
                  aria-current={p === safePage ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}

              {pageWindow.at(-1)! < totalPages && (
                <>
                  {pageWindow.at(-1)! < totalPages - 1 && (
                    <span className="px-1 text-mp-faint text-[12px]">…</span>
                  )}
                  <button onClick={() => goTo(totalPages)} className={pageBtn(totalPages === safePage)}>
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => goTo(safePage + 1)}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded text-mp-muted hover:bg-mp-head disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Próxima página"
              >
                <ChevronRight size={15} strokeWidth={2} />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

function pageBtn(active: boolean) {
  return `
    w-8 h-8 flex items-center justify-center rounded text-[12px] font-medium
    transition-colors
    ${active
      ? 'bg-mp-primary text-white font-bold'
      : 'text-mp-secondary hover:bg-mp-head'}
  `;
}
