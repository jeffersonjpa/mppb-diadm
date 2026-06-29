'use client';

import { useState, useMemo } from 'react';
import { Zap, TrendingUp, Activity } from 'lucide-react';

import KpiCard       from '@/components/kpi/KpiCard';
import AiInsight    from '@/components/ai/AiInsight';
import FilterBar     from '@/components/filters/FilterBar';
import SelectFilter  from '@/components/filters/SelectFilter';
import ChartCard     from '@/components/charts/ChartCard';
import BarByDimension from '@/components/charts/BarByDimension';
import MonthlyLine   from '@/components/charts/MonthlyLine';
import DataTable, { type Column } from '@/components/table/DataTable';

import {
  getRegistros, getSerieMensal, getMesesPorAno,
  CIDADES, ANOS, UNIDADES,
} from '@/lib/api/energia';
import { computeKpis, computeTopCidades, computeTopUnidades, formatSerieForChart, computeEficiencia } from '@/features/energia/selectors';
import EfficiencyGroupedBar from '@/components/charts/EfficiencyGroupedBar';
import eficienciaData from '@/data/eficiencia-data.json';
import type { EficienciaUnidade } from '@/features/energia/types';
import { formatBRL, formatKwh, MESES_SHORT, MESES_FULL } from '@/lib/format';
import type { EnergiaRecord, EnergiaFilters } from '@/features/energia/types';

/* ── Defaults ──────────────────────────────────────────────────── */
const DEFAULT_ANO = Math.max(...ANOS);
const DEFAULT_MES = Math.max(...getMesesPorAno(DEFAULT_ANO));

/* ── Colunas da tabela ─────────────────────────────────────────── */
const COLUMNS: Column<EnergiaRecord>[] = [
  {
    key: 'ano', label: 'Ano', align: 'center', sortable: true,
    render: v => String(v),
  },
  {
    key: 'mes', label: 'Mês', align: 'center', sortable: true,
    render: v => MESES_SHORT[(v as number) - 1],
  },
  {
    key: 'dataVencimento', label: 'Vencimento', align: 'center', sortable: true,
  },
  { key: 'unidade',   label: 'Unidade',    sortable: true },
  { key: 'logradouro', label: 'Logradouro', sortable: true },
  { key: 'cidade',    label: 'Cidade',      sortable: true },
  {
    key: 'kwh', label: 'Consumo (kWh)', align: 'right', sortable: true,
    render: v => (v as number).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
  },
  {
    key: 'valorTotal', label: 'Valor Total', align: 'right', sortable: true,
    render: v => formatBRL(v as number),
  },
  {
    key: 'valorLiquido', label: 'Valor Líquido', align: 'right', sortable: true,
    render: v => formatBRL(v as number),
  },
  {
    key: 'valorICMS', label: 'ICMS', align: 'right', sortable: true,
    render: v => formatBRL(v as number),
  },
  {
    key: 'valorILP', label: 'ILP', align: 'right', sortable: true,
    render: v => formatBRL(v as number),
  },
  {
    key: 'valorOutros', label: 'Outros', align: 'right', sortable: true,
    render: v => formatBRL(v as number),
  },
  {
    key: 'valorMulta', label: 'Multa', align: 'right', sortable: true,
    render: (v) => {
      const n = v as number;
      return n > 0 ? <span className="text-mp-danger">{formatBRL(n)}</span> : '—';
    },
  },
  {
    key: 'valorJuros', label: 'Juros', align: 'right', sortable: true,
    render: (v) => {
      const n = v as number;
      return n > 0 ? <span className="text-mp-danger">{formatBRL(n)}</span> : '—';
    },
  },
  {
    key: 'tensao', label: 'Tensão', align: 'center',
    render: v => {
      const labels: Record<string, string> = { '1': 'Baixa', '2': 'Média', '3': 'Alta' };
      const colors: Record<string, string> = {
        '1': 'bg-mp-tint text-mp-primary',
        '2': 'bg-mp-warning-bg text-mp-warning',
        '3': 'bg-mp-danger-bg text-mp-danger',
      };
      const t = String(v);
      return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[t] ?? ''}`}>
          {labels[t] ?? t}
        </span>
      );
    },
  },
];

/* ── Componente principal ──────────────────────────────────────── */
export default function EnergiaClient() {
  const [cidadeView, setCidadeView] = useState<'cidades' | 'eficiencia'>('cidades');

  const [filters, setFilters] = useState<EnergiaFilters>({
    ano:     DEFAULT_ANO,
    mes:     DEFAULT_MES,
    cidade:  null,
    unidade: null,
  });

  // Opções de mês dependem do ano selecionado
  const mesesDisponiveis = useMemo(
    () => filters.ano != null ? getMesesPorAno(filters.ano) : [],
    [filters.ano]
  );

  const ANOS_OPTIONS    = ANOS.map(a => ({ value: a, label: String(a) }));
  const MESES_OPTIONS   = mesesDisponiveis.map(m => ({ value: m, label: MESES_FULL[m - 1] }));
  const CIDADE_OPTIONS  = CIDADES.map(c => ({ value: c, label: c }));
  const UNIDADE_OPTIONS = UNIDADES.map(u => ({ value: u, label: u }));

  // Conta quantos filtros estão fora do padrão
  const activeCount =
    (filters.ano     != null ? 1 : 0) +
    (filters.mes     != null ? 1 : 0) +
    (filters.cidade  != null ? 1 : 0) +
    (filters.unidade != null ? 1 : 0);

  /* Dados filtrados */
  const records = useMemo(() => getRegistros(filters), [filters]);

  /* Encontra o último mês com dados e o mês anterior aplicando filtros (para MoM dinâmico) */
  const latestAndPrev = useMemo(() => {
    if (records.length === 0) return { latest: null, prev: null };

    // Encontra o mês e ano mais recente na seleção filtrada
    const maxIdx = Math.max(...records.map(r => r.ano * 12 + (r.mes - 1)));
    const latestAno = Math.floor(maxIdx / 12);
    const latestMes = (maxIdx % 12) + 1;

    // Registros do último mês na seleção atual
    const currMonthRecs = records.filter(r => r.ano === latestAno && r.mes === latestMes);
    const currTotal = currMonthRecs.reduce((s, r) => s + r.valorTotal, 0);
    const currKwh = currMonthRecs.reduce((s, r) => s + r.kwh, 0);

    // Mês imediatamente anterior com os mesmos filtros da tela
    const prevIdx = maxIdx - 1;
    const prevAno = Math.floor(prevIdx / 12);
    const prevMes = (prevIdx % 12) + 1;

    const prevMonthRecs = getRegistros({
      ...filters,
      ano: prevAno,
      mes: prevMes,
    });
    const prevTotal = prevMonthRecs.reduce((s, r) => s + r.valorTotal, 0);
    const prevKwh = prevMonthRecs.reduce((s, r) => s + r.kwh, 0);

    return {
      latest: { valorTotal: currTotal, kwh: currKwh },
      prev: prevMonthRecs.length > 0 ? { valorTotal: prevTotal, kwh: prevKwh } : null,
    };
  }, [records, filters]);

  const kpis = useMemo(() => {
    const isSingleMonth = filters.ano !== null && filters.mes !== null;
    if (isSingleMonth) {
      return computeKpis(records, latestAndPrev.prev);
    } else {
      return computeKpis(records, latestAndPrev.prev, latestAndPrev.latest);
    }
  }, [records, latestAndPrev, filters.ano, filters.mes]);

  /* Gráfico de barras — cidades */
  const topCidades = useMemo(
    () => computeTopCidades(records, 12).map(d => ({ label: d.cidade, value: d.valorTotal })),
    [records]
  );

  /* Gráfico de eficiência (dados estáticos — acumulado histórico) */
  const eficienciaItems = useMemo(
    () => computeEficiencia(eficienciaData.unidades as EficienciaUnidade[]),
    []
  );

  /* Gráfico de barras — unidades */
  const topUnidades = useMemo(
    () => computeTopUnidades(records, 20).map(d => ({ label: d.unidade, value: d.valorTotal })),
    [records]
  );

  /* Série histórica (2022–2026) */
  const serie = useMemo(() => getSerieMensal([2022, 2023, 2024, 2025, 2026]), []);
  const serie2022 = useMemo(() => formatSerieForChart(serie, 2022), [serie]);
  const serie2023 = useMemo(() => formatSerieForChart(serie, 2023), [serie]);
  const serie2024 = useMemo(() => formatSerieForChart(serie, 2024), [serie]);
  const serie2025 = useMemo(() => formatSerieForChart(serie, 2025), [serie]);
  const serie2026 = useMemo(() => formatSerieForChart(serie, 2026), [serie]);

  // Todos os 12 meses, limitando pelo último mês com dado em 2026
  const lastMes2026 = serie2026.length > 0 ? Math.max(...serie2026.map(s => s.mes)) : 12;
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    .filter(m => m <= Math.max(12, lastMes2026));

  const lineLabels = allMonths.map(m => MESES_SHORT[m - 1]);
  const line2022   = allMonths.map(m => serie2022.find(s => s.mes === m)?.valor ?? null);
  const line2023   = allMonths.map(m => serie2023.find(s => s.mes === m)?.valor ?? null);
  const line2024   = allMonths.map(m => serie2024.find(s => s.mes === m)?.valor ?? null);
  const line2025   = allMonths.map(m => serie2025.find(s => s.mes === m)?.valor ?? null);
  const line2026   = allMonths.map(m => serie2026.find(s => s.mes === m)?.valor ?? null);

  /* Subtítulo do período */
  const periodoLabel = [
    filters.ano   ? String(filters.ano)                  : 'Todos os anos',
    filters.mes   ? MESES_FULL[filters.mes - 1]          : 'Todos os meses',
    filters.cidade ?? null,
  ].filter(Boolean).join(' · ');

  const custoKwhStr = kpis.custoPorKwh > 0
    ? `R$ ${kpis.custoPorKwh.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}/kWh`
    : '—';

  function handleAnoChange(v: string | null) {
    const newAno = v ? parseInt(v) : null;
    // Reseta o mês para o mais recente do novo ano
    const meses  = newAno ? getMesesPorAno(newAno) : [];
    const newMes = meses.length > 0 ? Math.max(...meses) : null;
    setFilters(f => ({ ...f, ano: newAno, mes: newMes }));
  }

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-mp-muted -mt-2">{periodoLabel}</p>

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <KpiCard
          label="Custo Total"
          value={formatBRL(kpis.valorTotal)}
          icon={<Zap size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          delta={kpis.varValor}
          subtitle={kpis.varValor !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Consumo"
          value={formatKwh(kpis.kwh)}
          icon={<Activity size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          delta={kpis.varKwh}
          subtitle={kpis.varKwh !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Custo Médio"
          value={custoKwhStr}
          icon={<TrendingUp size={16} strokeWidth={2} />}
          iconBg="bg-mp-accent-bg"
          iconColor="text-mp-accent"
          delta={kpis.varCusto}
          subtitle={kpis.varCusto !== null ? 'vs mês anterior' : undefined}
        />
      </div>

      {/* ── Análise IA ───────────────────────────────────────────── */}
      <AiInsight
        endpoint="/api/ai/energia"
        payload={{ periodoLabel, kpis, topCidades }}
      />

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <FilterBar
        activeCount={activeCount}
        onClear={() => setFilters({ ano: null, mes: null, cidade: null, unidade: null })}
      >
        <SelectFilter
          label="Ano"
          value={filters.ano}
          options={ANOS_OPTIONS}
          onChange={handleAnoChange}
          placeholder="Todos"
        />
        <SelectFilter
          label="Mês"
          value={filters.mes}
          options={MESES_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, mes: v ? parseInt(v) : null }))}
          placeholder="Todos"
        />
        <SelectFilter
          label="Cidade"
          value={filters.cidade}
          options={CIDADE_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, cidade: v }))}
          placeholder="Todas"
        />
        <SelectFilter
          label="Unidade"
          value={filters.unidade}
          options={UNIDADE_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, unidade: v }))}
          placeholder="Todas"
        />
      </FilterBar>

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        <ChartCard
          title={cidadeView === 'cidades' ? 'Top Cidades por Custo' : 'Índice Membros × Consumo de Energia'}
          subtitle={cidadeView === 'cidades'
            ? `${topCidades.length} cidades · ${periodoLabel}`
            : 'Consumo acumulado · % Área Própria · % Qtd Membros'}
          minHeight={cidadeView === 'cidades'
            ? Math.max(300, topCidades.length * 34)
            : Math.max(400, eficienciaItems.length * 54)}
          actions={
            <div className="flex rounded-md overflow-hidden border border-mp-border text-[11px] font-semibold">
              <button
                onClick={() => setCidadeView('cidades')}
                className={`px-3 py-1 transition-colors ${
                  cidadeView === 'cidades'
                    ? 'bg-mp-primary text-white'
                    : 'bg-mp-surface text-mp-muted hover:bg-mp-tint'
                }`}
              >
                CIDADES
              </button>
              <button
                onClick={() => setCidadeView('eficiencia')}
                className={`px-3 py-1 transition-colors ${
                  cidadeView === 'eficiencia'
                    ? 'bg-mp-primary text-white'
                    : 'bg-mp-surface text-mp-muted hover:bg-mp-tint'
                }`}
              >
                EFICIÊNCIA
              </button>
            </div>
          }
        >
          {cidadeView === 'cidades' ? (
            <BarByDimension
              data={topCidades}
              height={Math.max(300, topCidades.length * 34)}
              onBarClick={cidade => setFilters(f => ({ ...f, cidade }))}
            />
          ) : (
            <EfficiencyGroupedBar
              data={eficienciaItems}
              height={Math.max(400, eficienciaItems.length * 54)}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Evolução Mensal de Custo"
          subtitle="Comparativo 2022 × 2023 × 2024 × 2025 × 2026 (R$)"
          minHeight={280}
        >
          <MonthlyLine
            labels={lineLabels}
            series={[
              { name: '2022', data: line2022, color: '#E4E7EC' },
              { name: '2023', data: line2023, color: '#C8CDD6' },
              { name: '2024', data: line2024, color: '#98A2B3' },
              { name: '2025', data: line2025, color: '#4A7BB7' },
              { name: '2026', data: line2026, color: '#1D5288' },
            ]}
            height={280}
            unit="brl"
            onSeriesClick={(seriesName, monthLabel) => {
              const ano = parseInt(seriesName, 10);
              if (isNaN(ano)) return;
              const mesIdx = MESES_SHORT.indexOf(monthLabel);
              const mes = mesIdx >= 0 ? mesIdx + 1 : (() => {
                const meses = getMesesPorAno(ano);
                return meses.length > 0 ? Math.max(...meses) : null;
              })();
              setFilters(f => ({ ...f, ano, mes }));
            }}
          />
        </ChartCard>
      </div>

      {/* ── Gráfico Top Unidades ──────────────────────────────────── */}
      <ChartCard
        title="Top 20 Unidades por Custo"
        subtitle={`Valor Total (R$) · ${periodoLabel}`}
        minHeight={Math.max(400, topUnidades.length * 34)}
      >
        <BarByDimension
          data={topUnidades}
          height={Math.max(400, topUnidades.length * 34)}
          color="#2E6DB4"
          onBarClick={unidade => setFilters(f => ({ ...f, unidade }))}
        />
      </ChartCard>

      {/* ── Tabela detalhada ─────────────────────────────────────── */}
      <DataTable<EnergiaRecord>
        columns={COLUMNS}
        rows={records}
        caption={`Detalhamento por unidade · ${periodoLabel}`}
        pageSize={10}
        searchable
      />
    </div>
  );
}
