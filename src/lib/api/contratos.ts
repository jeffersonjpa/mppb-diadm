import rawData from '@/data/contratos-data.json';
import type { ContratoRecord, ContratoFilters } from '@/features/contratos/types';

const registros = rawData.registros as ContratoRecord[];

export const ANOS_PUBLICACAO = rawData.anos as number[];
export const SITUACOES       = rawData.situacoes as string[];
export const MODALIDADES     = rawData.modalidades as string[];

const TODAY = new Date(2026, 5, 25);

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

export function getContratos(filters: ContratoFilters): ContratoRecord[] {
  let result = registros;
  if (filters.situacao      != null) result = result.filter(r => r.situacao      === filters.situacao);
  if (filters.anoPublicacao != null) result = result.filter(r => r.anoPublicacao === filters.anoPublicacao);
  if (filters.alertaVencimento != null) {
    result = result.filter(r => {
      if (r.situacao !== 'Ativo') return false;
      const dt   = parseDate(r.vigenciaTermino);
      const dias = dt ? Math.round((dt.getTime() - TODAY.getTime()) / 86_400_000) : null;
      switch (filters.alertaVencimento) {
        case 'expirado':   return dias !== null && dias < 0;
        case 'vencendo30': return dias !== null && dias >= 0 && dias <= 30;
        case 'vencendo60': return dias !== null && dias >= 0 && dias <= 60;
        case 'vencendo90': return dias !== null && dias >= 0 && dias <= 90;
        case 'vigente':    return dias === null || dias >= 0;
        default:           return true;
      }
    });
  }
  return result;
}
