import rawData from '@/data/contratos-data.json';
import type { ContratoRecord, ContratoFilters } from '@/features/contratos/types';

const registros = rawData.registros as ContratoRecord[];

export const ANOS_PUBLICACAO = rawData.anos as number[];
export const SITUACOES       = rawData.situacoes as string[];
export const MODALIDADES     = rawData.modalidades as string[];

const TODAY = new Date();

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

function matchAlerta(r: ContratoRecord, alerta: string): boolean {
  if (r.situacao !== 'Ativo') return false;
  const dt   = parseDate(r.vigenciaTermino);
  const dias = dt ? Math.round((dt.getTime() - TODAY.getTime()) / 86_400_000) : null;
  switch (alerta) {
    case 'expirado':   return dias !== null && dias < 0;
    case 'vencendo30': return dias !== null && dias >= 0 && dias <= 30;
    case 'vencendo60': return dias !== null && dias >= 0 && dias <= 60;
    case 'vencendo90': return dias !== null && dias >= 0 && dias <= 90;
    case 'vigente':    return dias === null || dias >= 0;
    default:           return false;
  }
}

export function getContratos(filters: ContratoFilters): ContratoRecord[] {
  let result = registros;
  if (filters.situacoes.length      > 0) result = result.filter(r => filters.situacoes.includes(r.situacao));
  if (filters.anoPublicacoes.length > 0) result = result.filter(r => r.anoPublicacao != null && filters.anoPublicacoes.includes(r.anoPublicacao));
  if (filters.alertasVencimento.length > 0) {
    result = result.filter(r => filters.alertasVencimento.some(a => matchAlerta(r, a)));
  }
  if (filters.modalidades.length > 0) result = result.filter(r => filters.modalidades.includes(r.modalidade));
  if (filters.mesesVencimento.length > 0) {
    result = result.filter(r => {
      const dt = parseDate(r.vigenciaTermino);
      if (!dt) return false;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      return filters.mesesVencimento.includes(key);
    });
  }
  return result;
}
