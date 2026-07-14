import type { CorreiosRecord, CorreiosKpis, CidadeSummary, SerieItem } from './types';

export function computeKpis(
  records: CorreiosRecord[],
  prev: { valorTotal: number; quantidade: number; peso: number } | null,
  latest?: { valorTotal: number; quantidade: number; peso: number } | null
): CorreiosKpis {
  const valorTotal = records.reduce((s, r) => s + r.valorLiquido, 0);
  const quantidade = records.reduce((s, r) => s + r.quantidade, 0);
  const custoMedio = quantidade > 0 ? valorTotal / quantidade : 0;
  const pesoGrams  = records.reduce((s, r) => s + r.peso, 0);
  const pesoTotal  = pesoGrams / 1000; // converter para kg

  const currentTotal = latest ? latest.valorTotal : valorTotal;
  const currentQty   = latest ? latest.quantidade : quantidade;
  const currentCusto = currentQty > 0 ? currentTotal / currentQty : 0;
  const currentPeso  = latest ? latest.peso / 1000 : pesoTotal;

  const varValor = prev && prev.valorTotal > 0 ? (currentTotal - prev.valorTotal) / prev.valorTotal * 100 : null;
  const varQty   = prev && prev.quantidade > 0 ? (currentQty - prev.quantidade) / prev.quantidade * 100 : null;
  
  const prevCusto = prev && prev.quantidade > 0 ? prev.valorTotal / prev.quantidade : 0;
  const varCusto  = prevCusto > 0 ? (currentCusto - prevCusto) / prevCusto * 100 : null;

  const prevPesoKg = prev ? prev.peso / 1000 : 0;
  const varPeso    = prevPesoKg > 0 ? (currentPeso - prevPesoKg) / prevPesoKg * 100 : null;

  return {
    valorTotal: round2(valorTotal),
    quantidade,
    custoMedio: round2(custoMedio),
    pesoTotal:  round2(pesoTotal),
    varValor:   varValor  != null ? round1(varValor)  : null,
    varQuantidade: varQty != null ? round1(varQty)    : null,
    varCustoMedio: varCusto != null ? round1(varCusto) : null,
    varPeso:    varPeso   != null ? round1(varPeso)   : null,
    varValorAbs:      varValor  != null ? round2(currentTotal - prev!.valorTotal)  : null,
    varQuantidadeAbs: varQty    != null ? round2(currentQty   - prev!.quantidade)  : null,
    varCustoMedioAbs: varCusto  != null ? round2(currentCusto - prevCusto)         : null,
    varPesoAbs:       varPeso   != null ? round2(currentPeso  - prevPesoKg)        : null,
  };
}

export function computeTopCidades(records: CorreiosRecord[], limit = 12): CidadeSummary[] {
  const map = new Map<string, CidadeSummary>();
  for (const r of records) {
    const e = map.get(r.cidade);
    if (e) {
      e.quantidade += r.quantidade;
      e.valorTotal += r.valorLiquido;
      e.registros++;
    } else {
      map.set(r.cidade, {
        cidade: r.cidade,
        quantidade: r.quantidade,
        valorTotal: r.valorLiquido,
        registros: 1
      });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, limit)
    .map(d => ({ ...d, quantidade: d.quantidade, valorTotal: round2(d.valorTotal) }));
}

export function formatSerieForChart(serie: SerieItem[], ano: number): { mes: number; valor: number; quantidade: number }[] {
  return serie
    .filter(s => s.ano === ano)
    .sort((a, b) => a.mes - b.mes)
    .map(s => ({ mes: s.mes, valor: round2(s.valorTotal), quantidade: s.quantidade }));
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
