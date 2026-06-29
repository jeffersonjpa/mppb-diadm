import type { EnergiaRecord, EnergiaKpis, CidadeSummary, UnidadeSummary, SerieItem, EficienciaUnidade } from './types';
import type { EficienciaItem } from '@/components/charts/EfficiencyGroupedBar';

export function computeKpis(
  records: EnergiaRecord[],
  prev: { valorTotal: number; kwh: number } | null,
  latest?: { valorTotal: number; kwh: number } | null
): EnergiaKpis {
  const valorTotal  = records.reduce((s, r) => s + r.valorTotal, 0);
  const kwh         = records.reduce((s, r) => s + r.kwh, 0);
  const custoPorKwh = kwh > 0 ? valorTotal / kwh : 0;
  const ucs         = records.length;

  const currentTotal = latest ? latest.valorTotal : valorTotal;
  const currentKwh   = latest ? latest.kwh : kwh;
  const currentCusto = currentKwh > 0 ? currentTotal / currentKwh : 0;

  const varValor  = prev && prev.valorTotal > 0 ? (currentTotal - prev.valorTotal) / prev.valorTotal * 100 : null;
  const varKwh    = prev && prev.kwh > 0         ? (currentKwh   - prev.kwh)   / prev.kwh   * 100 : null;
  const prevCusto = prev && prev.kwh > 0 ? prev.valorTotal / prev.kwh : 0;
  const varCusto  = prevCusto > 0 ? (currentCusto - prevCusto) / prevCusto * 100 : null;

  return {
    valorTotal,
    kwh,
    custoPorKwh,
    ucs,
    varValor:   varValor  != null ? round1(varValor)  : null,
    varKwh:     varKwh    != null ? round1(varKwh)    : null,
    varCusto:   varCusto  != null ? round1(varCusto)  : null,
  };
}

export function computeTopCidades(records: EnergiaRecord[], limit = 12): CidadeSummary[] {
  const map = new Map<string, CidadeSummary>();
  for (const r of records) {
    const e = map.get(r.cidade);
    if (e) { e.kwh += r.kwh; e.valorTotal += r.valorTotal; e.ucs++; }
    else    map.set(r.cidade, { cidade: r.cidade, kwh: r.kwh, valorTotal: r.valorTotal, ucs: 1 });
  }
  return [...map.values()]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, limit);
}

export function computeTopUnidades(records: EnergiaRecord[], limit = 20): UnidadeSummary[] {
  const map = new Map<string, UnidadeSummary>();
  for (const r of records) {
    const e = map.get(r.unidade);
    if (e) { e.kwh += r.kwh; e.valorTotal += r.valorTotal; e.registros++; }
    else    map.set(r.unidade, { unidade: r.unidade, kwh: r.kwh, valorTotal: r.valorTotal, registros: 1 });
  }
  return [...map.values()]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, limit);
}

export function formatSerieForChart(serie: SerieItem[], ano: number): { mes: number; valor: number; kwh: number }[] {
  return serie
    .filter(s => s.ano === ano)
    .sort((a, b) => a.mes - b.mes)
    .map(s => ({ mes: s.mes, valor: s.valorTotal, kwh: s.kwh }));
}

function round1(n: number) { return Math.round(n * 10) / 10; }

export function computeEficiencia(unidades: EficienciaUnidade[]): EficienciaItem[] {
  const totalConsumo = unidades.reduce((s, u) => s + u.consumo, 0);
  const totalArea    = unidades.reduce((s, u) => s + (u.areaM2  ?? 0), 0);
  const totalMembros = unidades.reduce((s, u) => s + (u.membros ?? 0), 0);

  return unidades.map(u => {
    const consumoPct  = totalConsumo > 0 ? (u.consumo  / totalConsumo)  * 100 : 0;
    const areaPct     = totalArea    > 0 && u.areaM2   != null ? (u.areaM2   / totalArea)    * 100 : null;
    const membrosPct  = totalMembros > 0 && u.membros  != null ? (u.membros  / totalMembros) * 100 : null;
    const eficiencia  = consumoPct > 0 && membrosPct != null && membrosPct > 0
      ? consumoPct / membrosPct
      : null;

    return {
      label:      u.label,
      consumoPct: round2(consumoPct),
      areaPct:    areaPct   != null ? round2(areaPct)   : null,
      membrosPct: membrosPct != null ? round2(membrosPct) : null,
      eficiencia: eficiencia != null ? round2(eficiencia) : null,
      isServidor: u.isServidor,
    };
  });
}

function round2(n: number) { return Math.round(n * 100) / 100; }
