'use client';

import { MESES_SHORT } from '@/lib/format';

interface PeriodRangeProps {
  mFrom: number;
  yFrom: number;
  mTo: number;
  yTo: number;
  onChange: (updates: { mFrom?: number; yFrom?: number; mTo?: number; yTo?: number }) => void;
  years: number[];
}

export default function PeriodRange({
  mFrom,
  yFrom,
  mTo,
  yTo,
  onChange,
  years,
}: PeriodRangeProps) {
  const periodLabel = `${MESES_SHORT[mFrom - 1]}/${yFrom} – ${MESES_SHORT[mTo - 1]}/${yTo}`;

  function handleMFromChange(m: number) {
    onChange({ mFrom: m });
  }

  function handleYFromChange(y: number) {
    onChange({ yFrom: y });
  }

  function handleMToChange(m: number) {
    onChange({ mTo: m });
  }

  function handleYToChange(y: number) {
    onChange({ yTo: y });
  }

  return (
    <div className="flex flex-col gap-1.5 col-span-full">
      <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-mp-muted">
        Período (Mês/Ano): <span className="text-mp-primary font-extrabold">{periodLabel}</span>
      </span>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* De */}
        <span className="text-[11px] font-bold text-mp-muted w-5">De</span>
        
        {/* Mês De */}
        <div className="relative min-w-[84px]">
          <select
            value={mFrom}
            onChange={(e) => handleMFromChange(parseInt(e.target.value, 10))}
            className="
              w-full h-9 pl-3 pr-8 appearance-none
              bg-mp-surface border border-mp-border-strong rounded-mp-input
              text-[13px] text-mp-text font-medium
              focus:outline-none focus:border-mp-primary
              transition-colors cursor-pointer
            "
          >
            {MESES_SHORT.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mp-muted text-[10px]">
            ▾
          </span>
        </div>

        {/* Ano De */}
        <div className="relative min-w-[90px]">
          <select
            value={yFrom}
            onChange={(e) => handleYFromChange(parseInt(e.target.value, 10))}
            className="
              w-full h-9 pl-3 pr-8 appearance-none
              bg-mp-surface border border-mp-border-strong rounded-mp-input
              text-[13px] text-mp-text font-medium
              focus:outline-none focus:border-mp-primary
              transition-colors cursor-pointer
            "
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mp-muted text-[10px]">
            ▾
          </span>
        </div>

        {/* Divisor */}
        <span className="w-3.5 h-[1px] bg-mp-border-strong shrink-0" />

        {/* Até */}
        <span className="text-[11px] font-bold text-mp-muted w-6">Até</span>

        {/* Mês Até */}
        <div className="relative min-w-[84px]">
          <select
            value={mTo}
            onChange={(e) => handleMToChange(parseInt(e.target.value, 10))}
            className="
              w-full h-9 pl-3 pr-8 appearance-none
              bg-mp-surface border border-mp-border-strong rounded-mp-input
              text-[13px] text-mp-text font-medium
              focus:outline-none focus:border-mp-primary
              transition-colors cursor-pointer
            "
          >
            {MESES_SHORT.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mp-muted text-[10px]">
            ▾
          </span>
        </div>

        {/* Ano Até */}
        <div className="relative min-w-[90px]">
          <select
            value={yTo}
            onChange={(e) => handleYToChange(parseInt(e.target.value, 10))}
            className="
              w-full h-9 pl-3 pr-8 appearance-none
              bg-mp-surface border border-mp-border-strong rounded-mp-input
              text-[13px] text-mp-text font-medium
              focus:outline-none focus:border-mp-primary
              transition-colors cursor-pointer
            "
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mp-muted text-[10px]">
            ▾
          </span>
        </div>
      </div>
    </div>
  );
}
