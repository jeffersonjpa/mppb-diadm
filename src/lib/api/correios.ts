import rawData from '@/data/correios-data.json';
import type { CorreiosRecord, SerieItem, CorreiosFilters } from '@/features/correios/types';

const registros   = rawData.registros   as CorreiosRecord[];
const serieMensal = rawData.serieMensal as SerieItem[];
const mesesPorAno = rawData.mesesPorAno as Record<string, number[]>;

export const CIDADES = rawData.cidades as string[];
export const ANOS    = rawData.anos    as number[];

export function getMesesPorAno(ano: number): number[] {
  return mesesPorAno[String(ano)] ?? [];
}

export function getRegistros(filters: CorreiosFilters): CorreiosRecord[] {
  let result = registros;
  if (filters.anos.length    > 0) result = result.filter(r => filters.anos.includes(r.ano));
  if (filters.mes            != null) result = result.filter(r => r.mes    === filters.mes);
  if (filters.cidades.length > 0) result = result.filter(r => filters.cidades.includes(r.cidade));
  return result;
}

export function getSerieMensal(anos: number[] = [2025, 2026]): SerieItem[] {
  return serieMensal.filter(s => anos.includes(s.ano));
}
