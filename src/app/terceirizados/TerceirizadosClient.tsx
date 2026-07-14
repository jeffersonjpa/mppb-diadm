'use client';

import { useState, useMemo } from 'react';
import { Users, Package, Activity } from 'lucide-react';

import KpiCard       from '@/components/kpi/KpiCard';
import AiInsight    from '@/components/ai/AiInsight';
import FilterBar     from '@/components/filters/FilterBar';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import PeriodRange   from '@/components/filters/PeriodRange';
import ChartCard     from '@/components/charts/ChartCard';
import BarByDimension from '@/components/charts/BarByDimension';
import ScatterQtyValue from '@/components/charts/ScatterQtyValue';
import MonthlyLine   from '@/components/charts/MonthlyLine';
import DataTable, { type Column } from '@/components/table/DataTable';

import {
  getRegistros,
  getSerieMensal,
  getRegistrosBase,
  CIDADES,
  ANOS,
} from '@/lib/api/terceirizados';

import { useTerceirizadosFilters } from '@/features/terceirizados/useFilters';
import {
  computeKpis,
  computeTopDimension,
  computeScatterData,
  formatSerieForChart,
} from '@/features/terceirizados/selectors';

import { formatBRL, signedAmount, MESES_SHORT } from '@/lib/format';
import type { TerceirizadoRecord } from '@/features/terceirizados/types';

/* ── Colunas da tabela ─────────────────────────────────────────── */
const COLUMNS: Column<TerceirizadoRecord>[] = [
  {
    key: 'cidade',
    label: 'Localidade',
    sortable: true,
  },
  {
    key: 'unidade',
    label: 'Unidade',
    sortable: true,
  },
  {
    key: 'cargo',
    label: 'Cargo',
    sortable: true,
    render: (v) => <span className="font-semibold text-mp-text">{String(v)}</span>,
  },
  {
    key: 'fornecedor',
    label: 'Fornecedor',
    sortable: true,
  },
  {
    key: 'nome',
    label: 'Nome',
    sortable: true,
  },
  {
    key: 'ano',
    label: 'Ano',
    align: 'center',
    sortable: true,
    render: (v) => String(v),
  },
  {
    key: 'valor',
    label: 'Valor',
    align: 'right',
    sortable: true,
    render: (v) => formatBRL(v as number),
  },
  {
    key: 'origem',
    label: 'Origem',
    render: (v) => (
      <span className="inline-block px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-bold text-mp-primary bg-mp-tint whitespace-nowrap">
        {String(v)}
      </span>
    ),
  },
];

type ToggleView = 'POR CARGO' | 'POR UNIDADE' | 'POR FORNECEDOR' | 'POR TERCEIRIZADO';

export default function TerceirizadosClient() {
  const {
    filters,
    setCidades,
    setUnidades,
    setFornecedores,
    setCargos,
    toggleCargo,
    toggleUnidade,
    toggleFornecedor,
    setPeriod,
    clearFilters,
    activeCount,
  } = useTerceirizadosFilters();

  const [toggleView, setToggleView] = useState<ToggleView>('POR FORNECEDOR');

  // Recupera todos os registros brutos para extrair opções de filtros exclusivas
  const baseRecords = useMemo(() => getRegistrosBase(), []);

  // Opções exclusivas de Unidades e Fornecedores baseadas nos registros
  const UNIDADE_OPTIONS = useMemo(() => {
    const list = [...new Set(baseRecords.map((r) => r.unidade))].sort();
    return list.map((u) => ({ value: u, label: u }));
  }, [baseRecords]);

  const FORNECEDOR_OPTIONS = useMemo(() => {
    const list = [...new Set(baseRecords.map((r) => r.fornecedor))].sort();
    return list.map((f) => ({ value: f, label: f }));
  }, [baseRecords]);

  const CIDADE_OPTIONS = useMemo(() => {
    return CIDADES.map((c) => ({ value: c, label: c }));
  }, []);

  // Dados filtrados do período atual
  const records = useMemo(() => getRegistros(filters), [filters]);

  // Cálculos de KPIs
  const kpis = useMemo(() => computeKpis(records, baseRecords, filters), [records, baseRecords, filters]);

  // Gráfico de barras por dimensão
  const dimField = useMemo(() => {
    const map: Record<ToggleView, 'cargo' | 'unidade' | 'fornecedor' | 'nome'> = {
      'POR CARGO': 'cargo',
      'POR UNIDADE': 'unidade',
      'POR FORNECEDOR': 'fornecedor',
      'POR TERCEIRIZADO': 'nome',
    };
    return map[toggleView];
  }, [toggleView]);

  const topDimensionData = useMemo(() => {
    return computeTopDimension(records, dimField, 12).map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }, [records, dimField]);

  // Dispersão Qtd × Valor por Cargo
  const scatterData = useMemo(() => computeScatterData(records), [records]);

  // Evolução Mensal (séries de 2025 e 2026)
  const serie = useMemo(() => getSerieMensal([2025, 2026]), []);
  const serie2025 = useMemo(() => formatSerieForChart(serie, 2025), [serie]);
  const serie2026 = useMemo(() => formatSerieForChart(serie, 2026), [serie]);

  const line2025 = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const found = serie2025.find((s) => s.mes === mes);
      return found ? found.valor : null;
    });
  }, [serie2025]);

  const line2026 = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const found = serie2026.find((s) => s.mes === mes);
      return found ? found.valor : null;
    });
  }, [serie2026]);

  // Top 5 cargos por custo (usado no payload da IA)
  const topCargos = useMemo(
    () => computeTopDimension(records, 'cargo', 5),
    [records]
  );

  // Subtítulo do período descritivo
  const periodoLabel = useMemo(() => {
    const parts = [
      filters.cidades.length      > 0 ? filters.cidades.join(', ')      : null,
      filters.unidades.length     > 0 ? filters.unidades.join(', ')     : null,
      filters.fornecedores.length > 0 ? filters.fornecedores.join(', ') : null,
      filters.cargos.length       > 0 ? filters.cargos.join(', ')       : null,
      `${MESES_SHORT[filters.mFrom - 1]}/${filters.yFrom} – ${MESES_SHORT[filters.mTo - 1]}/${filters.yTo}`,
    ].filter(Boolean);
    return parts.join(' · ');
  }, [filters]);

  // Manipulador de clique nas barras do gráfico (toggle)
  function handleBarClick(label: string) {
    if (toggleView === 'POR CARGO')        toggleCargo(label);
    else if (toggleView === 'POR UNIDADE')      toggleUnidade(label);
    else if (toggleView === 'POR FORNECEDOR')   toggleFornecedor(label);
  }

  // Manipulador de clique nos pontos da linha temporal
  function handleSeriesClick(seriesName: string, monthLabel: string) {
    const ano = parseInt(seriesName, 10);
    if (isNaN(ano)) return;
    const mesIdx = MESES_SHORT.indexOf(monthLabel);
    if (mesIdx === -1) return;
    const mes = mesIdx + 1;
    setPeriod({ mFrom: mes, yFrom: ano, mTo: mes, yTo: ano });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-[13px] text-mp-muted -mt-2">{periodoLabel}</p>

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <KpiCard
          label="Total Terceirizados"
          value={formatBRL(kpis.valorTotal)}
          icon={<Users size={16} strokeWidth={2} />}
          iconBg="bg-mp-accent-bg"
          iconColor="text-mp-accent"
          delta={kpis.varTotal}
          deltaAbsolute={kpis.varTotalAbs != null ? signedAmount(kpis.varTotalAbs, formatBRL) : undefined}
          subtitle={kpis.varTotal !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Média Terceirizados"
          value={formatBRL(kpis.valorMedio)}
          icon={<Activity size={16} strokeWidth={2} />}
          iconBg="bg-mp-success-bg"
          iconColor="text-mp-success"
          delta={kpis.varMedio}
          deltaAbsolute={kpis.varMedioAbs != null ? signedAmount(kpis.varMedioAbs, formatBRL) : undefined}
          subtitle={kpis.varMedio !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Qtd Terceirizados"
          value={kpis.quantidade.toLocaleString('pt-BR')}
          icon={<Package size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          delta={kpis.varQuantidade}
          deltaAbsolute={kpis.varQuantidadeAbs != null ? signedAmount(kpis.varQuantidadeAbs, v => v.toLocaleString('pt-BR')) : undefined}
          subtitle={kpis.varQuantidade !== null ? 'vs mês anterior' : undefined}
        />
      </div>

      {/* ── Análise IA ───────────────────────────────────────────── */}
      <AiInsight
        endpoint="/api/ai/terceirizados"
        payload={{ periodoLabel, kpis, topCidades: topCargos }}
      />

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <FilterBar activeCount={activeCount} onClear={clearFilters}>
        <MultiSelectFilter
          label="Cidade"
          values={filters.cidades}
          options={CIDADE_OPTIONS}
          onChange={setCidades}
          placeholder="Todos"
        />
        <MultiSelectFilter
          label="Unidade"
          values={filters.unidades}
          options={UNIDADE_OPTIONS}
          onChange={setUnidades}
          placeholder="Todos"
        />
        <MultiSelectFilter
          label="Fornecedor"
          values={filters.fornecedores}
          options={FORNECEDOR_OPTIONS}
          onChange={setFornecedores}
          placeholder="Todos"
        />
        <MultiSelectFilter
          label="Cargo"
          values={filters.cargos}
          options={[...new Set(baseRecords.map((r) => r.cargo))].sort().map((c) => ({ value: c, label: c }))}
          onChange={setCargos}
          placeholder="Todos"
        />
        <PeriodRange
          mFrom={filters.mFrom}
          yFrom={filters.yFrom}
          mTo={filters.mTo}
          yTo={filters.yTo}
          onChange={setPeriod}
          years={ANOS}
        />
      </FilterBar>

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        
        {/* Gráfico de barras com toggle */}
        <ChartCard
          title={`Terceirizados ${toggleView.toLowerCase()}`}
          subtitle={`Valor total contratado · agrupado por ${dimField}`}
          actions={
            <div className="flex bg-[#F1F4F8] border border-[#E7EBF0] rounded-[9px] p-0.5 gap-0.5">
              {(['POR CARGO', 'POR UNIDADE', 'POR FORNECEDOR'] as ToggleView[]).map((opt) => {
                const active = toggleView === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setToggleView(opt)}
                    className={`
                      border-0 cursor-pointer font-bold text-[10px] tracking-[0.4px] px-2.5 py-1.5 rounded-[6px]
                      transition-all duration-150
                      ${active
                        ? 'bg-[#1E7E25] text-white shadow-[0_1px_2px_rgba(30,126,37,0.3)]'
                        : 'bg-transparent text-mp-muted hover:text-mp-text'}
                    `}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          }
          minHeight={Math.max(320, topDimensionData.length * 30)}
        >
          <BarByDimension
            data={topDimensionData}
            height={Math.max(320, topDimensionData.length * 30)}
            onBarClick={handleBarClick}
          />
        </ChartCard>

        {/* Evolução Mensal */}
        <ChartCard
          title="Valor Mensal de Terceirizados"
          subtitle="Comparativo 2025 × 2026 (R$)"
          minHeight={320}
        >
          <MonthlyLine
            labels={MESES_SHORT}
            series={[
              { name: '2025', data: line2025, color: '#A6AEBA' },
              { name: '2026', data: line2026, color: '#1D5288' },
            ]}
            height={320}
            unit="brl"
            onSeriesClick={handleSeriesClick}
          />
        </ChartCard>

        {/* Scatterplot */}
        <ChartCard
          title="Qtd × Valor por Cargo"
          subtitle="Dispersão — quantidade de pessoas vs. valor total"
          minHeight={320}
        >
          <ScatterQtyValue data={scatterData} height={320} />
        </ChartCard>
      </div>

      {/* ── Tabela detalhada ─────────────────────────────────────── */}
      <DataTable<TerceirizadoRecord>
        columns={COLUMNS}
        rows={records}
        caption={`Detalhamento de Terceirizados · ${periodoLabel}`}
        pageSize={10}
        searchable
      />
    </div>
  );
}
