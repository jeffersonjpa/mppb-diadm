'use client';

import { useState, useMemo } from 'react';
import { Mail, TrendingUp, Activity } from 'lucide-react';

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
} from '@/lib/api/correios';
import { computeKpis, computeTopCidades, formatSerieForChart } from '@/features/correios/selectors';
import { formatBRL, MESES_SHORT, MESES_FULL } from '@/lib/format';
import type { CorreiosRecord, CorreiosFilters } from '@/features/correios/types';

/* ── Defaults ──────────────────────────────────────────────────── */
const DEFAULT_ANO = Math.max(...ANOS);
const DEFAULT_MES = Math.max(...getMesesPorAno(DEFAULT_ANO));

/* ── Colunas da tabela ─────────────────────────────────────────── */
const COLUMNS: Column<CorreiosRecord>[] = [
  {
    key: 'ano', label: 'Ano', align: 'center', sortable: true,
    render: v => String(v),
  },
  {
    key: 'mes', label: 'Mês', align: 'center', sortable: true,
    render: v => MESES_SHORT[(v as number) - 1],
  },
  { key: 'dataPostagem', label: 'Data Postagem', align: 'center', sortable: true },
  { key: 'titular',      label: 'Titular do Cartão', sortable: true },
  { key: 'unidadePostagem', label: 'Unidade de Postagem', sortable: true },
  { key: 'cidade',       label: 'Cidade',            sortable: true },
  {
    key: 'quantidade', label: 'Qtd', align: 'center', sortable: true,
    render: v => (v as number).toLocaleString('pt-BR'),
  },
  {
    key: 'peso', label: 'Peso', align: 'right', sortable: true,
    render: v => {
      const g = v as number;
      return g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g} g`;
    },
  },
  {
    key: 'valorLiquido', label: 'Valor Líquido', align: 'right', sortable: true,
    render: v => formatBRL(v as number),
  },
];

export default function CorreiosClient() {
  const [filters, setFilters] = useState<CorreiosFilters>({
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
    const currTotal = currMonthRecs.reduce((s, r) => s + r.valorLiquido, 0);
    const currQty = currMonthRecs.reduce((s, r) => s + r.quantidade, 0);
    const currPeso = currMonthRecs.reduce((s, r) => s + r.peso, 0);

    const prevIdx = maxIdx - 1;
    const prevAno = Math.floor(prevIdx / 12);
    const prevMes = (prevIdx % 12) + 1;

    const prevMonthRecs = getRegistros({
      ...filters,
      ano: prevAno,
      mes: prevMes,
    });
    const prevTotal = prevMonthRecs.reduce((s, r) => s + r.valorLiquido, 0);
    const prevQty = prevMonthRecs.reduce((s, r) => s + r.quantidade, 0);
    const prevPeso = prevMonthRecs.reduce((s, r) => s + r.peso, 0);

    return {
      latest: { valorTotal: currTotal, quantidade: currQty, peso: currPeso },
      prev: prevMonthRecs.length > 0 ? { valorTotal: prevTotal, quantidade: prevQty, peso: prevPeso } : null,
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

  const custoMedioStr = kpis.custoMedio > 0
    ? `R$ ${kpis.custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/item`
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
          icon={<Mail size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          delta={kpis.varValor}
          subtitle={kpis.varValor !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Objetos Postados"
          value={kpis.quantidade.toLocaleString('pt-BR')}
          icon={<Activity size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          delta={kpis.varQuantidade}
          subtitle={kpis.varQuantidade !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Custo Médio/Objeto"
          value={custoMedioStr}
          icon={<TrendingUp size={16} strokeWidth={2} />}
          iconBg="bg-mp-accent-bg"
          iconColor="text-mp-accent"
          delta={kpis.varCustoMedio}
          subtitle={kpis.varCustoMedio !== null ? 'vs mês anterior' : undefined}
        />
        <KpiCard
          label="Peso Total Enviado"
          value={kpis.pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' kg'}
          icon={<Mail size={16} strokeWidth={2} className="opacity-75" />}
          iconBg="bg-mp-head"
          iconColor="text-mp-ghost"
          delta={kpis.varPeso}
          subtitle={kpis.varPeso !== null ? 'vs mês anterior' : undefined}
        />
      </div>

      {/* ── Análise IA ───────────────────────────────────────────── */}
      <AiInsight
        endpoint="/api/ai/correios"
        payload={{ periodoLabel, kpis, topCidades }}
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
      <DataTable<CorreiosRecord>
        columns={COLUMNS}
        rows={records}
        caption={`Detalhamento por postagem Correios · ${periodoLabel}`}
        pageSize={10}
        searchable
      />
    </div>
  );
}
