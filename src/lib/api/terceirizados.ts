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
  if (filters.cidades.length      > 0) result = result.filter(r => filters.cidades.includes(r.cidade));
  if (filters.unidades.length     > 0) result = result.filter(r => filters.unidades.includes(r.unidade));
  if (filters.fornecedores.length > 0) result = result.filter(r => filters.fornecedores.includes(r.fornecedor));
  if (filters.cargos.length       > 0) result = result.filter(r => filters.cargos.includes(r.cargo));

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
