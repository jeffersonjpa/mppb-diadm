import rawData from '@/data/contratos-data.json';
import type { ContratoRecord, ContratoFilters } from '@/features/contratos/types';

const registros = rawData.registros as ContratoRecord[];

export const ANOS_PUBLICACAO = rawData.anos as number[];
export const SITUACOES       = rawData.situacoes as string[];
export const MODALIDADES     = rawData.modalidades as string[];

export function getContratos(filters: ContratoFilters): ContratoRecord[] {
  let result = registros;
  if (filters.situacao      != null) result = result.filter(r => r.situacao      === filters.situacao);
  if (filters.anoPublicacao != null) result = result.filter(r => r.anoPublicacao === filters.anoPublicacao);
  return result;
}
