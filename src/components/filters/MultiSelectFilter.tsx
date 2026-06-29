'use client';

import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { normalizeSearch } from '@/lib/format';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label:        string;
  values:       string[];
  options:      Option[];
  onChange:     (values: string[]) => void;
  placeholder?: string;
  searchable?:  boolean;
}

export default function MultiSelectFilter({
  label,
  values,
  options,
  onChange,
  placeholder = 'Todos',
  searchable  = true,
}: MultiSelectFilterProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = search
    ? options.filter(o => normalizeSearch(o.label).includes(normalizeSearch(search)))
    : options;

  function toggle(value: string) {
    onChange(values.includes(value)
      ? values.filter(v => v !== value)
      : [...values, value]);
  }

  const triggerLabel =
    values.length === 0 ? placeholder :
    values.length === 1 ? values[0]   :
    `${values.length} selecionadas`;

  return (
    <div className="flex flex-col gap-1 min-w-[160px]" ref={ref}>
      <label className="text-[11px] font-bold uppercase tracking-[0.5px] text-mp-muted">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setSearch(''); }}
          className={`
            w-full h-9 pl-3 pr-8 text-left appearance-none
            bg-mp-surface border rounded-mp-input
            text-[13px] transition-colors focus:outline-none
            ${open
              ? 'border-mp-primary'
              : 'border-mp-border-strong'
            }
            ${values.length > 0 ? 'text-mp-text' : 'text-mp-muted'}
          `}
        >
          <span className="block truncate">{triggerLabel}</span>
        </button>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mp-muted text-[10px]">
          ▾
        </span>

        {open && (
          <div className="
            absolute z-50 mt-1 w-full min-w-[220px]
            bg-mp-surface border border-mp-border-strong rounded-mp-card shadow-mp-card
            overflow-hidden
          ">
            {searchable && (
              <div className="p-2 border-b border-mp-border">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="
                    w-full h-7 px-2.5
                    bg-mp-bg border border-mp-border rounded
                    text-[12px] text-mp-text placeholder:text-mp-muted
                    focus:outline-none focus:border-mp-primary
                  "
                />
              </div>
            )}

            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-[12px] text-mp-muted">Nenhum resultado</li>
              ) : filtered.map(o => {
                const selected = values.includes(o.value);
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => toggle(o.value)}
                      className={`
                        w-full flex items-center gap-2.5 px-3 py-2 text-left
                        text-[13px] transition-colors
                        ${selected ? 'bg-mp-tint text-mp-primary' : 'text-mp-text hover:bg-mp-tint/40'}
                      `}
                    >
                      <span className={`
                        flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center
                        ${selected
                          ? 'bg-mp-primary border-mp-primary'
                          : 'border-mp-border-strong bg-mp-surface'
                        }
                      `}>
                        {selected && <Check size={10} strokeWidth={3} className="text-white" />}
                      </span>
                      <span className="truncate">{o.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {values.length > 0 && (
              <div className="border-t border-mp-border p-2">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="w-full text-[11px] font-bold text-mp-danger hover:text-[#9D3232] transition-colors py-1"
                >
                  Limpar seleção
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
