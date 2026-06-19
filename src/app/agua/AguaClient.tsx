'use client';

import { useState, useMemo } from 'react';
import { Droplets, TrendingUp, Activity } from 'lucide-react';

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
  CIDADES, ANOS,
} from '@/lib/api/agua';
import { computeKpis, computeTopCidades, formatSerieForChart } from '@/features/agua/selectors';
import { formatBRL, MESES_SHORT, MESES_FULL } from '@/lib/format';
import type { AguaRecord, AguaFilters } from '@/features/agua/types';

/* ── Defaults ──────────────────────────────────────────────────── */
const DEFAULT_ANO = Math.max(...ANOS);
const DEFAULT_MES = Math.max(...getMesesPorAno(DEFAULT_ANO));

/* ── Colunas da tabela ─────────────────────────────────────────── */
const COLUMNS: Column<AguaRecord>[] = [
  {
    key: 'ano', label: 'Ano', align: 'center', sortable: true,
    render: v => String(v),
  },
  {
    key: 'mes', label: 'Mês', align: 'center', sortable: true,
    render: v => MESES_SHORT[(v as number) - 1],
  },
  { key: 'matricula', label: 'Matrícula', align: 'center', sortable: true },
  { key: 'unidade',    label: 'Unidade',    sortable: true },
  { key: 'inscricao',  label: 'Inscrição',  align: 'center', sortable: true },
  { key: 'cidade',     label: 'Cidade',     sortable: true },
  {
    key: 'consumo', label: 'Consumo (m³)', align: 'right', sortable: true,
    render: v => (v as number).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' m³',
  },
  {
    key: 'valor', label: 'Valor Conta', align: 'right', sortable: true,
    render: v => formatBRL(v as number),
  },
];

export default function AguaClient() {
  const [filters, setFilters] = useState<AguaFilters>({
    ano: DEFAULT_ANO,
    mes: DEFAULT_MES,
    cidade: null,
  });

  const mesesDisponiveis = useMemo(
    () => filters.ano != null ? getMesesPorAno(filters.ano) : [],
    [filters.ano]
  );

  const ANOS_OPTIONS   = ANOS.map(a => ({ value: a, label: String(a) }));
  const MESES_OPTIONS  = mesesDisponiveis.map(m => ({ value: m, label: MESES_FULL[m - 1] }));
  const CIDADE_OPTIONS = CIDADES.map(c => ({ value: c, label: c }));

  const activeCount =
    (filters.ano    != null ? 1 : 0) +
    (filters.mes    != null ? 1 : 0) +
    (filters.cidade != null ? 1 : 0);

  const records = useMemo(() => getRegistros(filters), [filters]);

  /* Encontra o último mês com dados e o mês anterior aplicando filtros (para MoM dinâmico) */
  const latestAndPrev = useMemo(() => {
    if (records.length === 0) return { latest: null, prev: null };

    const maxIdx = Math.max(...records.map(r => r.ano * 12 + (r.mes - 1)));
    const latestAno = Math.floor(maxIdx / 12);
    const latestMes = (maxIdx % 12) + 1;

    const currMonthRecs = records.filter(r => r.ano === latestAno && r.mes === latestMes);
    const currTotal = currMonthRecs.reduce((s, r) => s + r.valor, 0);
    const currConsumo = currMonthRecs.reduce((s, r) => s + r.consumo, 0);

    const prevIdx = maxIdx - 1;
    const prevAno = Math.floor(prevIdx / 12);
    const prevMes = (prevIdx % 12) + 1;

    const prevMonthRecs = getRegistros({
      ...filters,
      ano: prevAno,
      mes: prevMes,
    });
    const prevTotal = prevMonthRecs.reduce((s, r) => s + r.valor, 0);
    const prevConsumo = prevMonthRecs.reduce((s, r) => s + r.consumo, 0);

    return {
      latest: { valorTotal: currTotal, consumo: currConsumo },
      prev: prevMonthRecs.length > 0 ? { valorTotal: prevTotal, consumo: prevConsumo } : null,
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

  const topCidades = useMemo(
    () => computeTopCidades(records, 12).map(d => ({ label: d.cidade, value: d.valorTotal })),
    [records]
  );

  const serie = useMemo(() => getSerieMensal([2024, 2025, 2026]), []);
  const serie2024 = useMemo(() => formatSerieForChart(serie, 2024), [serie]);
  const serie2025 = useMemo(() => formatSerieForChart(serie, 2025), [serie]);
  const serie2026 = useMemo(() => formatSerieForChart(serie, 2026), [serie]);

  const lastMes2026 = serie2026.length > 0 ? Math.max(...serie2026.map(s => s.mes)) : 0;
  const allMonths = [...new Set([...serie2025, ...serie2026].map(s => s.mes))]
    .sort((a, b) => a - b)
    .filter(m => m <= Math.max(12, lastMes2026));

  const lineLabels = allMonths.map(m => MESES_SHORT[m - 1]);
  const line2024   = allMonths.map(m => serie2024.find(s => s.mes === m)?.valor ?? null);
  const line2025   = allMonths.map(m => serie2025.find(s => s.mes === m)?.valor ?? null);
  const line2026   = allMonths.map(m => {
    const found = serie2026.find(s => s.mes === m);
    return found ? found.valor : null;
  });

  const periodoLabel = [
    filters.ano   ? String(filters.ano)                  : 'Todos os anos',
    filters.mes   ? MESES_FULL[filters.mes - 1]          : 'Todos os meses',
    filters.cidade ?? null,
  ].filter(Boolean).join(' · ');

  const precoMedioStr = kpis.precoMedio > 0
    ? `R$ ${kpis.precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m³`
    : '—';

  function handleAnoChange(v: string | null) {
    const newAno = v ? parseInt(v) : null;
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
          icon={<Droplets size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          delta={kpis.varValor}
          subtitle={kpis.varValor !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Consumo"
          value={kpis.consumo.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' m³'}
          icon={<Activity size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          delta={kpis.varConsumo}
          subtitle={kpis.varConsumo !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Preço Médio"
          value={precoMedioStr}
          icon={<TrendingUp size={16} strokeWidth={2} />}
          iconBg="bg-mp-accent-bg"
          iconColor="text-mp-accent"
          delta={kpis.varPreco}
          subtitle={kpis.varPreco !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Contas/Matrículas"
          value={String(kpis.matriculas)}
          icon={<Droplets size={16} strokeWidth={2} className="opacity-75" />}
          iconBg="bg-mp-head"
          iconColor="text-mp-ghost"
        />
      </div>

      {/* ── Análise IA ───────────────────────────────────────────── */}
      <AiInsight
        endpoint="/api/ai/agua"
        payload={{ periodoLabel, kpis, topCidades }}
        mockText="Em **abril de 2026**, o MPPB registrou custo total de **R$ 18.574,64** com água e esgoto, com **variação de +13,9%** em relação ao mês anterior. O consumo atingiu **591 m³** (+9,6%), a um preço médio de **R$ 31,43/m³**, distribuídos em **39 matrículas ativas** junto à CAGEPA. **João Pessoa concentra 95% do total faturado** (R$ 17.704) — a alta expressiva no período recomenda verificação de consumo anômalo nas unidades da capital."
      />

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <FilterBar
        activeCount={activeCount}
        onClear={() => setFilters({ ano: null, mes: null, cidade: null })}
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
      </FilterBar>

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        <ChartCard
          title="Top Cidades por Custo"
          subtitle={`${topCidades.length} cidades · ${periodoLabel}`}
          minHeight={Math.max(300, topCidades.length * 34)}
        >
          <BarByDimension
            data={topCidades}
            height={Math.max(300, topCidades.length * 34)}
            onBarClick={cidade => setFilters(f => ({ ...f, cidade }))}
          />
        </ChartCard>

        <ChartCard
          title="Evolução Mensal de Custo"
          subtitle="Comparativo 2024 × 2025 × 2026 (R$)"
          minHeight={280}
        >
          <MonthlyLine
            labels={lineLabels}
            series={[
              { name: '2024', data: line2024, color: '#D0D5DD' },
              { name: '2025', data: line2025, color: '#A6AEBA' },
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

      {/* ── Tabela detalhada ─────────────────────────────────────── */}
      <DataTable<AguaRecord>
        columns={COLUMNS}
        rows={records}
        caption={`Detalhamento por matrícula CAGEPA · ${periodoLabel}`}
        pageSize={10}
      />
    </div>
  );
}
