import type { EnergiaRecord, EnergiaKpis, CidadeSummary, SerieItem } from './types';

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
    valorTotal: round2(valorTotal),
    kwh:        round2(kwh),
    custoPorKwh: round4(custoPorKwh),
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
    .slice(0, limit)
    .map(d => ({ ...d, kwh: round2(d.kwh), valorTotal: round2(d.valorTotal) }));
}

export function formatSerieForChart(serie: SerieItem[], ano: number): { mes: number; valor: number; kwh: number }[] {
  return serie
    .filter(s => s.ano === ano)
    .sort((a, b) => a.mes - b.mes)
    .map(s => ({ mes: s.mes, valor: round2(s.valorTotal), kwh: round2(s.kwh) }));
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function round4(n: number) { return Math.round(n * 10000) / 10000; }
