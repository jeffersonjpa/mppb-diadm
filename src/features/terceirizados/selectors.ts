import type { TerceirizadoRecord, TerceirizadosFilters, TerceirizadosKpis } from './types';

export function getFilteredRecords(
  records: TerceirizadoRecord[],
  filters: TerceirizadosFilters
): TerceirizadoRecord[] {
  const from = filters.yFrom * 12 + (filters.mFrom - 1);
  const to = filters.yTo * 12 + (filters.mTo - 1);

  return records.filter(r => {
    const idx = r.ano * 12 + (r.mes - 1);
    if (filters.cidades.length      > 0 && !filters.cidades.includes(r.cidade))           return false;
    if (filters.unidades.length     > 0 && !filters.unidades.includes(r.unidade))         return false;
    if (filters.fornecedores.length > 0 && !filters.fornecedores.includes(r.fornecedor))  return false;
    if (filters.cargos.length       > 0 && !filters.cargos.includes(r.cargo))             return false;
    return idx >= from && idx <= to;
  });
}

// Retorna os filtros para o período anterior equivalente (mesmo comprimento)
export function getPrevPeriodFilters(
  filters: TerceirizadosFilters
): TerceirizadosFilters | null {
  const from = filters.yFrom * 12 + (filters.mFrom - 1);
  const to = filters.yTo * 12 + (filters.mTo - 1);
  const L = to - from + 1;

  const fromPrev = from - L;
  const toPrev = from - 1;

  const yFromPrev = Math.floor(fromPrev / 12);
  const mFromPrev = (fromPrev % 12) + 1;
  const yToPrev = Math.floor(toPrev / 12);
  const mToPrev = (toPrev % 12) + 1;

  // Garantir que não volte antes do início dos dados (2025)
  if (yFromPrev < 2025) return null;

  return {
    ...filters,
    mFrom: mFromPrev,
    yFrom: yFromPrev,
    mTo: mToPrev,
    yTo: yToPrev,
  };
}

export function computeKpis(
  records: TerceirizadoRecord[],
  allRecords: TerceirizadoRecord[],
  filters: TerceirizadosFilters
): TerceirizadosKpis {
  const valorTotal = records.reduce((s, r) => s + r.valor, 0);
  const quantidade = records.length;
  const valorMedio = quantidade > 0 ? valorTotal / quantidade : 0;

  let varTotal: number | null = null;
  let varMedio: number | null = null;
  let varQuantidade: number | null = null;
  let varTotalAbs: number | null = null;
  let varMedioAbs: number | null = null;
  let varQuantidadeAbs: number | null = null;

  if (records.length > 0) {
    // Encontra o último mês com dados dentro do período selecionado
    const maxIdx = Math.max(...records.map(r => r.ano * 12 + (r.mes - 1)));
    const latestAno = Math.floor(maxIdx / 12);
    const latestMes = (maxIdx % 12) + 1;

    const currMonthRecs = records.filter(r => r.ano === latestAno && r.mes === latestMes);
    const currTotal = currMonthRecs.reduce((s, r) => s + r.valor, 0);
    const currQty = currMonthRecs.length;
    const currAvg = currQty > 0 ? currTotal / currQty : 0;

    // Determina o mês imediatamente anterior
    const prevIdx = maxIdx - 1;
    const prevAno = Math.floor(prevIdx / 12);
    const prevMes = (prevIdx % 12) + 1;

    // Filtra no banco completo aplicando os mesmos filtros do módulo, exceto o período
    const prevMonthRecs = allRecords.filter(r => {
      if (r.ano !== prevAno || r.mes !== prevMes) return false;
      if (filters.cidades.length      > 0 && !filters.cidades.includes(r.cidade))           return false;
      if (filters.unidades.length     > 0 && !filters.unidades.includes(r.unidade))         return false;
      if (filters.fornecedores.length > 0 && !filters.fornecedores.includes(r.fornecedor))  return false;
      if (filters.cargos.length       > 0 && !filters.cargos.includes(r.cargo))             return false;
      return true;
    });

    if (prevMonthRecs.length > 0) {
      const prevTotal = prevMonthRecs.reduce((s, r) => s + r.valor, 0);
      const prevQty = prevMonthRecs.length;
      const prevAvg = prevQty > 0 ? prevTotal / prevQty : 0;

      if (prevTotal > 0) { varTotal = ((currTotal - prevTotal) / prevTotal) * 100; varTotalAbs = currTotal - prevTotal; }
      if (prevQty > 0)   { varQuantidade = ((currQty - prevQty) / prevQty) * 100; varQuantidadeAbs = currQty - prevQty; }
      if (prevAvg > 0)   { varMedio = ((currAvg - prevAvg) / prevAvg) * 100; varMedioAbs = currAvg - prevAvg; }
    }
  }

  return {
    valorTotal: round2(valorTotal),
    valorMedio: round2(valorMedio),
    quantidade,
    varTotal: varTotal !== null ? round1(varTotal) : null,
    varMedio: varMedio !== null ? round1(varMedio) : null,
    varQuantidade: varQuantidade !== null ? round1(varQuantidade) : null,
    varTotalAbs:      varTotalAbs      !== null ? round2(varTotalAbs)      : null,
    varMedioAbs:      varMedioAbs      !== null ? round2(varMedioAbs)      : null,
    varQuantidadeAbs: varQuantidadeAbs !== null ? round2(varQuantidadeAbs) : null,
  };
}

export function computeTopDimension(
  records: TerceirizadoRecord[],
  dimension: 'cargo' | 'unidade' | 'fornecedor' | 'nome',
  limit = 12
): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const val = r[dimension];
    map.set(val, (map.get(val) || 0) + r.valor);
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value: round2(value) }));
}

export function computeScatterData(
  records: TerceirizadoRecord[]
): { name: string; value: [number, number] }[] {
  const map = new Map<string, { qtd: number; total: number }>();
  for (const r of records) {
    const cargo = r.cargo;
    const current = map.get(cargo) || { qtd: 0, total: 0 };
    map.set(cargo, {
      qtd: current.qtd + 1,
      total: current.total + r.valor,
    });
  }

  return [...map.entries()].map(([name, val]) => ({
    name,
    value: [val.qtd, round2(val.total)] as [number, number],
  }));
}

export function formatSerieForChart(
  serie: { ano: number; mes: number; valorTotal: number }[],
  ano: number
): { mes: number; valor: number }[] {
  return serie
    .filter(s => s.ano === ano)
    .sort((a, b) => a.mes - b.mes)
    .map(s => ({ mes: s.mes, valor: round2(s.valorTotal) }));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
