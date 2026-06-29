import rawData from '@/data/energia-data.json';
import type { EnergiaRecord, SerieItem, CidadeSummary, EnergiaFilters } from '@/features/energia/types';

const registros   = rawData.registros   as EnergiaRecord[];
const serieMensal = rawData.serieMensal as SerieItem[];
const mesesPorAno = rawData.mesesPorAno as Record<string, number[]>;

export const CIDADES  = rawData.cidades as string[];
export const ANOS     = rawData.anos    as number[];
export const UNIDADES = [...new Set(registros.map(r => r.unidade))].sort();

export function getMesesPorAno(ano: number): number[] {
  return mesesPorAno[String(ano)] ?? [];
}

export function getRegistros(filters: EnergiaFilters): EnergiaRecord[] {
  let result = registros;
  if (filters.anos.length     > 0) result = result.filter(r => filters.anos.includes(r.ano));
  if (filters.mes            != null)     result = result.filter(r => r.mes === filters.mes);
  if (filters.cidades.length  > 0)        result = result.filter(r => filters.cidades.includes(r.cidade));
  if (filters.unidades.length > 0)        result = result.filter(r => filters.unidades.includes(r.unidade));
  return result;
}

export function getSerieMensal(anos: number[] = [2022, 2023, 2024, 2025, 2026]): SerieItem[] {
  return serieMensal.filter(s => anos.includes(s.ano));
}

export function getTopCidades(filters: EnergiaFilters, limit = 12): CidadeSummary[] {
  const recs = getRegistros(filters);
  const map  = new Map<string, CidadeSummary>();
  for (const r of recs) {
    const e = map.get(r.cidade);
    if (e) { e.kwh += r.kwh; e.valorTotal += r.valorTotal; e.ucs++; }
    else    map.set(r.cidade, { cidade: r.cidade, kwh: r.kwh, valorTotal: r.valorTotal, ucs: 1 });
  }
  return [...map.values()]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, limit);
}

// Retorna o sumário do período anterior na série mensal (para variação MoM)
export function getSumarioMesAnterior(
  mes: number,
  ano: number
): { valorTotal: number; kwh: number } | null {
  const mesPrev = mes <= 1 ? 12 : mes - 1;
  const anoPrev = mes <= 1 ? ano - 1 : ano;
  const item = serieMensal.find(s => s.ano === anoPrev && s.mes === mesPrev);
  return item ? { valorTotal: item.valorTotal, kwh: item.kwh } : null;
}
