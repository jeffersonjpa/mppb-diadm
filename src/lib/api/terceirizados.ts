import rawData from '@/data/terceirizados-data.json';
import type { TerceirizadoRecord, TerceirizadosFilters } from '@/features/terceirizados/types';

const registros   = rawData.registros   as TerceirizadoRecord[];
export const serieMensal = rawData.serieMensal as { ano: number; mes: number; valorTotal: number; registros: number }[];
const mesesPorAno = rawData.mesesPorAno as Record<string, number[]>;

export const CIDADES = rawData.cidades as string[];
export const ANOS    = rawData.anos    as number[];

// Retorna todos os registros sem filtrar
export function getRegistrosBase(): TerceirizadoRecord[] {
  return registros;
}

export function getMesesPorAno(ano: number): number[] {
  return mesesPorAno[String(ano)] ?? [];
}

export function getRegistros(filters: TerceirizadosFilters): TerceirizadoRecord[] {
  let result = registros;
  if (filters.cidade    != null) result = result.filter(r => r.cidade === filters.cidade);
  if (filters.unidade   != null) result = result.filter(r => r.unidade === filters.unidade);
  if (filters.fornecedor != null) result = result.filter(r => r.fornecedor === filters.fornecedor);
  if (filters.cargo     != null) result = result.filter(r => r.cargo === filters.cargo);

  const from = filters.yFrom * 12 + (filters.mFrom - 1);
  const to = filters.yTo * 12 + (filters.mTo - 1);

  return result.filter(r => {
    const idx = r.ano * 12 + (r.mes - 1);
    return idx >= from && idx <= to;
  });
}

export function getSerieMensal(anosFiltrados: number[] = [2025, 2026]) {
  return serieMensal.filter(s => anosFiltrados.includes(s.ano));
}
