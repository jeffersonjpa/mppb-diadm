'use client';

import { useState, useMemo } from 'react';

import FilterBar         from '@/components/filters/FilterBar';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import SelectFilter      from '@/components/filters/SelectFilter';
import ChartCard         from '@/components/charts/ChartCard';
import ComparativoBarrasVerticais from '@/components/charts/ComparativoBarrasVerticais';
import MonthlyLine       from '@/components/charts/MonthlyLine';

import { MESES_SHORT, MESES_FULL } from '@/lib/format';
import {
  computeComparativoPorUnidade,
  computeComparativoSerieMensal,
} from '@/features/comparativo/selectors';

type Modulo = 'energia' | 'agua' | 'correios';

const ANOS_DISPONIVEIS = [2022, 2023, 2024, 2025, 2026];
const DEFAULT_ANOS: number[] = [2026];
const DEFAULT_MODULOS: Modulo[] = ['energia', 'agua', 'correios'];

const ANOS_OPTIONS = ANOS_DISPONIVEIS.map(a => ({ value: String(a), label: String(a) }));
const MESES_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: MESES_FULL[i],
}));
const MODULO_OPTIONS = [
  { value: 'energia',  label: 'Energia Elétrica' },
  { value: 'agua',     label: 'Água' },
  { value: 'correios', label: 'Correios' },
];

const COR: Record<Modulo, string> = {
  energia:  '#1D5288',
  agua:     '#0891B2',
  correios: '#C2410C',
};

export default function ComparativoPanel() {
  const [anos,    setAnos]    = useState<number[]>(DEFAULT_ANOS);
  const [mes,     setMes]     = useState<number | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>(DEFAULT_MODULOS);

  const activeCount =
    (anos.length    !== DEFAULT_ANOS.length   || !anos.every(a => DEFAULT_ANOS.includes(a)) ? 1 : 0) +
    (mes           != null                                                                    ? 1 : 0) +
    (modulos.length  < DEFAULT_MODULOS.length                                                 ? 1 : 0);

  const comparativoData = useMemo(
    () => computeComparativoPorUnidade(anos, mes),
    [anos, mes],
  );

  const serieMensal = useMemo(
    () => computeComparativoSerieMensal(anos),
    [anos],
  );

  // Build monthly line series filtered by selected modulos
  const allMonths  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const lineLabels = allMonths.map(m => MESES_SHORT[m - 1]);

  const lineSeries = (['energia', 'agua', 'correios'] as Modulo[])
    .filter(m => modulos.includes(m))
    .map(m => ({
      name:  m === 'energia' ? 'Energia' : m === 'agua' ? 'Água' : 'Correios',
      color: COR[m],
      data:  allMonths.map(month => {
        const total = serieMensal
          .filter(s => s.mes === month)
          .reduce((sum, s) => sum + s[m], 0);
        return total > 0 ? total : null;
      }),
    }));

  const periodoLabel = [
    anos.length > 0 ? anos.join(', ')          : 'Todos os anos',
    mes != null      ? MESES_FULL[mes - 1]     : 'Todos os meses',
  ].join(' · ');

  const barHeight = Math.max(420, comparativoData.length * 30);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <FilterBar
        activeCount={activeCount}
        onClear={() => { setAnos(DEFAULT_ANOS); setMes(null); setModulos(DEFAULT_MODULOS); }}
      >
        <MultiSelectFilter
          label="Ano"
          values={anos.map(String)}
          options={ANOS_OPTIONS}
          onChange={v => setAnos(v.map(Number))}
          placeholder="Todos"
          searchable={false}
        />
        <SelectFilter
          label="Mês"
          value={mes}
          options={MESES_OPTIONS}
          onChange={v => setMes(v ? parseInt(v) : null)}
          placeholder="Todos"
        />
        <MultiSelectFilter
          label="Módulos"
          values={modulos}
          options={MODULO_OPTIONS}
          onChange={v => setModulos(v as Modulo[])}
          placeholder="Todos"
          searchable={false}
        />
      </FilterBar>

      {/* Gráfico de barras verticais – custo por unidade */}
      <ChartCard
        title="Custo por Unidade"
        subtitle={`${periodoLabel} · ${comparativoData.length} unidades`}
        minHeight={barHeight}
      >
        <ComparativoBarrasVerticais
          data={comparativoData}
          modulos={modulos}
          height={barHeight}
        />
      </ChartCard>

      {/* Gráfico de linhas – evolução mensal por fonte */}
      <ChartCard
        title="Evolução Mensal por Fonte"
        subtitle={`${periodoLabel} · Energia · Água · Correios (R$)`}
        minHeight={280}
      >
        <MonthlyLine
          labels={lineLabels}
          series={lineSeries}
          height={280}
          unit="brl"
        />
      </ChartCard>
    </div>
  );
}
