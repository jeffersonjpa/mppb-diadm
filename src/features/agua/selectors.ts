import type { AguaRecord, AguaKpis, CidadeSummary, UnidadeSummary, SerieItem } from './types';

export function computeKpis(
  records: AguaRecord[],
  prev: { valorTotal: number; consumo: number } | null,
  latest?: { valorTotal: number; consumo: number } | null
): AguaKpis {
  const valorTotal  = records.reduce((s, r) => s + r.valor, 0);
  const consumo     = records.reduce((s, r) => s + r.consumo, 0);
  const precoMedio  = consumo > 0 ? valorTotal / consumo : 0;
  const matriculas  = new Set(records.map(r => r.matricula)).size;

  const currentTotal = latest ? latest.valorTotal : valorTotal;
  const currentConsumo = latest ? latest.consumo : consumo;
  const currentPreco = currentConsumo > 0 ? currentTotal / currentConsumo : 0;

  const varValor  = prev && prev.valorTotal > 0 ? (currentTotal - prev.valorTotal) / prev.valorTotal * 100 : null;
  const varConsumo = prev && prev.consumo > 0    ? (currentConsumo - prev.consumo) / prev.consumo * 100 : null;
  const prevPreco = prev && prev.consumo > 0 ? prev.valorTotal / prev.consumo : 0;
  const varPreco  = prevPreco > 0 ? (currentPreco - prevPreco) / prevPreco * 100 : null;

  return {
    valorTotal: round2(valorTotal),
    consumo:    round2(consumo),
    precoMedio: round2(precoMedio),
    matriculas,
    varValor:   varValor  != null ? round1(varValor)  : null,
    varConsumo: varConsumo != null ? round1(varConsumo) : null,
    varPreco:   varPreco  != null ? round1(varPreco)  : null,
    varValorAbs:   varValor   != null ? round2(currentTotal   - prev!.valorTotal) : null,
    varConsumoAbs: varConsumo != null ? round2(currentConsumo - prev!.consumo)    : null,
    varPrecoAbs:   varPreco   != null ? round2(currentPreco   - prevPreco)        : null,
  };
}

export function computeTopCidades(records: AguaRecord[], limit = 12): CidadeSummary[] {
  const map = new Map<string, CidadeSummary>();
  for (const r of records) {
    const e = map.get(r.cidade);
    if (e) {
      e.consumo += r.consumo;
      e.valorTotal += r.valor;
      e.matriculas++;
    } else {
      map.set(r.cidade, {
        cidade: r.cidade,
        consumo: r.consumo,
        valorTotal: r.valor,
        matriculas: 1
      });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, limit)
    .map(d => ({ ...d, consumo: round2(d.consumo), valorTotal: round2(d.valorTotal) }));
}

export function computeTopUnidades(records: AguaRecord[], limit = 15): UnidadeSummary[] {
  const map = new Map<string, UnidadeSummary>();
  for (const r of records) {
    const key = r.unidade || 'Não Informado';
    const e = map.get(key);
    if (e) {
      e.consumo    += r.consumo;
      e.valorTotal += r.valor;
      e.matriculas += 1;
    } else {
      map.set(key, { unidade: key, consumo: r.consumo, valorTotal: r.valor, matriculas: 1 });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, limit)
    .map(d => ({ ...d, consumo: round2(d.consumo), valorTotal: round2(d.valorTotal) }));
}

export function formatSerieForChart(serie: SerieItem[], ano: number): { mes: number; valor: number; consumo: number }[] {
  return serie
    .filter(s => s.ano === ano)
    .sort((a, b) => a.mes - b.mes)
    .map(s => ({ mes: s.mes, valor: round2(s.valorTotal), consumo: round2(s.consumo) }));
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
