import type { ContratoRecord, ContratoKpis, VencimentoMes, ModalidadeSummary } from './types';

const TODAY = new Date(2026, 5, 25); // June 25, 2026 — data de referência

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

function diasAteVencimento(vigenciaTermino: string | null): number | null {
  const dt = parseDate(vigenciaTermino);
  if (!dt) return null;
  return Math.round((dt.getTime() - TODAY.getTime()) / 86_400_000);
}

export function computeKpis(records: ContratoRecord[]): ContratoKpis {
  const ativos     = records.filter(r => r.situacao === 'Ativo');
  const concluidos = records.filter(r => r.situacao === 'Concluído');
  const rescindidos = records.filter(r => r.situacao === 'Rescindido');

  const valorAtivos = ativos.reduce((s, r) => s + (r.valorTotalContrato ?? 0), 0);

  const vencendo30 = ativos.filter(r => {
    const dias = diasAteVencimento(r.vigenciaTermino);
    return dias !== null && dias >= 0 && dias <= 30;
  }).length;

  const vencendo90 = ativos.filter(r => {
    const dias = diasAteVencimento(r.vigenciaTermino);
    return dias !== null && dias >= 0 && dias <= 90;
  }).length;

  const expirados = ativos.filter(r => {
    const dias = diasAteVencimento(r.vigenciaTermino);
    return dias !== null && dias < 0;
  }).length;

  return {
    total:       records.length,
    ativos:      ativos.length,
    concluidos:  concluidos.length,
    rescindidos: rescindidos.length,
    valorAtivos,
    vencendo30,
    vencendo90,
    expirados,
  };
}

export function computeVencimentosMensais(records: ContratoRecord[], meses = 18): VencimentoMes[] {
  const ativos = records.filter(r => r.situacao === 'Ativo');
  const map = new Map<string, VencimentoMes>();

  for (const r of ativos) {
    const dt = parseDate(r.vigenciaTermino);
    if (!dt) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const existing = map.get(key);
    const valor = r.valorTotalContrato ?? 0;
    if (existing) {
      existing.count++;
      existing.valor += valor;
    } else {
      const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      map.set(key, {
        label: `${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`,
        mes:   dt.getMonth() + 1,
        ano:   dt.getFullYear(),
        count: 1,
        valor,
      });
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, meses)
    .map(([, v]) => v);
}

export function computeModalidades(records: ContratoRecord[]): ModalidadeSummary[] {
  const map = new Map<string, ModalidadeSummary>();
  for (const r of records) {
    const e = map.get(r.modalidade);
    const valor = r.valorTotalContrato ?? 0;
    if (e) { e.count++; e.valor += valor; }
    else   map.set(r.modalidade, { modalidade: r.modalidade, count: 1, valor });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getAlertaVencimento(r: ContratoRecord): 'critico' | 'alerta' | 'expirado' | null {
  if (r.situacao !== 'Ativo') return null;
  const dias = diasAteVencimento(r.vigenciaTermino);
  if (dias === null) return null;
  if (dias < 0)   return 'expirado';
  if (dias <= 30) return 'critico';
  if (dias <= 90) return 'alerta';
  return null;
}
