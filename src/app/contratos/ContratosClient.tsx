'use client';

import { useState, useMemo } from 'react';
import { FileText, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

import KpiCard        from '@/components/kpi/KpiCard';
import AiInsight      from '@/components/ai/AiInsight';
import FilterBar      from '@/components/filters/FilterBar';
import SelectFilter   from '@/components/filters/SelectFilter';
import ChartCard      from '@/components/charts/ChartCard';
import BarByDimension from '@/components/charts/BarByDimension';
import DataTable, { type Column } from '@/components/table/DataTable';

import { getContratos, ANOS_PUBLICACAO, SITUACOES } from '@/lib/api/contratos';
import {
  computeKpis,
  computeVencimentosMensais,
  computeModalidades,
  getAlertaVencimento,
} from '@/features/contratos/selectors';
import { formatBRL, formatBRLShort } from '@/lib/format';
import type { ContratoRecord, ContratoFilters } from '@/features/contratos/types';

/* ── Colunas da tabela ─────────────────────────────────────────── */
const COLUMNS: Column<ContratoRecord>[] = [
  {
    key: 'numContrato', label: 'Nº', align: 'center', sortable: true,
  },
  {
    key: 'situacao', label: 'Situação', align: 'center', sortable: true,
    render: (v, row) => {
      const alerta = getAlertaVencimento(row as ContratoRecord);
      const situacaoColors: Record<string, string> = {
        'Ativo':      'bg-mp-success-bg text-mp-success',
        'Concluído':  'bg-mp-head text-mp-muted',
        'Rescindido': 'bg-mp-danger-bg text-mp-danger',
        'Indefinido': 'bg-mp-warning-bg text-mp-warning',
      };
      const alertaIcon =
        alerta === 'expirado' ? ' ⚠' :
        alerta === 'critico'  ? ' ●' :
        alerta === 'alerta'   ? ' ○' : '';
      const sit = String(v);
      return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${situacaoColors[sit] ?? 'bg-mp-head text-mp-muted'}`}>
          {sit}{alertaIcon}
        </span>
      );
    },
  },
  {
    key: 'anoPublicacao', label: 'Publicação', align: 'center', sortable: true,
    render: (v, row) => {
      const r = row as ContratoRecord;
      return r.dataPublicacao ?? String(v ?? '—');
    },
  },
  {
    key: 'vigenciaTermino', label: 'Venc.', align: 'center', sortable: true,
    render: (v, row) => {
      const r = row as ContratoRecord;
      const alerta = getAlertaVencimento(r);
      const colorMap: Record<string, string> = {
        expirado: 'text-mp-danger font-bold',
        critico:  'text-mp-danger',
        alerta:   'text-mp-warning',
      };
      const cls = alerta ? colorMap[alerta] : '';
      return <span className={cls}>{String(v ?? '—')}</span>;
    },
  },
  {
    key: 'modalidade', label: 'Modalidade', sortable: true,
  },
  {
    key: 'valorTotalContrato', label: 'Valor Total', align: 'right', sortable: true,
    render: (v) => {
      const n = v as number | null;
      return n != null ? formatBRL(n) : '—';
    },
  },
  {
    key: 'objeto', label: 'Objeto', sortable: false,
    render: (v) => {
      const s = String(v ?? '');
      return (
        <span title={s} className="block max-w-[320px] truncate">
          {s || '—'}
        </span>
      );
    },
  },
  {
    key: 'contratado', label: 'Contratado', sortable: true,
    render: (v) => {
      const s = String(v ?? '');
      return (
        <span title={s} className="block max-w-[200px] truncate">
          {s || '—'}
        </span>
      );
    },
  },
  {
    key: 'numAditivos', label: 'Aditivos', align: 'center', sortable: true,
    render: (v) => {
      const n = v as number;
      return n > 0 ? String(n) : '—';
    },
  },
  {
    key: 'fiscais', label: 'Fiscal', sortable: false,
    render: (v) => {
      const s = String(v ?? '');
      return (
        <span title={s} className="block max-w-[180px] truncate text-mp-muted">
          {s || '—'}
        </span>
      );
    },
  },
];

/* ── Componente principal ──────────────────────────────────────── */
export default function ContratosClient() {
  const [filters, setFilters] = useState<ContratoFilters>({
    situacao:         null,
    anoPublicacao:    null,
    alertaVencimento: null,
  });

  const activeCount =
    (filters.situacao         != null ? 1 : 0) +
    (filters.anoPublicacao    != null ? 1 : 0) +
    (filters.alertaVencimento != null ? 1 : 0);

  const records = useMemo(() => getContratos(filters), [filters]);

  const kpis = useMemo(() => computeKpis(records), [records]);

  const vencimentos = useMemo(() => computeVencimentosMensais(records, 24), [records]);

  const modalidades = useMemo(() => computeModalidades(records), [records]);

  const ANOS_OPTIONS     = ANOS_PUBLICACAO.map(a => ({ value: a, label: String(a) })).reverse();
  const SITUACAO_OPTIONS = SITUACOES.map(s => ({ value: s, label: s }));
  const ALERTA_OPTIONS   = [
    { value: 'expirado', label: 'Expirado (Ativo)' },
    { value: 'vigente',  label: 'Vigente (Ativo)'  },
  ];

  const periodoLabel = [
    filters.situacao         ? filters.situacao                                     : null,
    filters.alertaVencimento ? ALERTA_OPTIONS.find(o => o.value === filters.alertaVencimento)?.label : null,
    filters.anoPublicacao    ? String(filters.anoPublicacao)                        : null,
  ].filter(Boolean).join(' · ') || 'Todos os contratos';

  const aiPayload = useMemo(() => ({
    periodoLabel,
    kpis,
    topModalidades: modalidades.map(m => ({ label: m.modalidade, value: m.count })),
  }), [periodoLabel, kpis, modalidades]);

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-mp-muted -mt-2">{periodoLabel}</p>

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <KpiCard
          label="Total de Contratos"
          value={String(kpis.total)}
          icon={<FileText size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          subtitle={`${kpis.ativos} ativos · ${kpis.concluidos} concluídos`}
        />
        <KpiCard
          label="Valor Comprometido (Ativos)"
          value={formatBRLShort(kpis.valorAtivos)}
          icon={<FileText size={16} strokeWidth={2} />}
          iconBg="bg-mp-tint"
          iconColor="text-mp-primary"
          subtitle={`${kpis.ativos} contratos ativos`}
        />
        <KpiCard
          label="Vencendo em 90 dias"
          value={String(kpis.vencendo90)}
          icon={<Clock size={16} strokeWidth={2} />}
          iconBg="bg-mp-warning-bg"
          iconColor="text-mp-warning"
          subtitle={`${kpis.vencendo30} vencem em até 30 dias`}
        />
        <KpiCard
          label="Expirados (Ativo)"
          value={String(kpis.expirados)}
          icon={kpis.expirados > 0
            ? <ShieldAlert size={16} strokeWidth={2} />
            : <AlertTriangle size={16} strokeWidth={2} />}
          iconBg={kpis.expirados > 0 ? 'bg-mp-danger-bg' : 'bg-mp-head'}
          iconColor={kpis.expirados > 0 ? 'text-mp-danger' : 'text-mp-muted'}
          subtitle="Situação 'Ativo' com vigência vencida"
        />
      </div>

      {/* ── Análise IA ───────────────────────────────────────────── */}
      <AiInsight
        endpoint="/api/ai/contratos"
        payload={aiPayload}
      />

      {/* ── Filtros ──────────────────────────────────────────────── */}
      <FilterBar
        activeCount={activeCount}
        onClear={() => setFilters({ situacao: null, anoPublicacao: null, alertaVencimento: null })}
      >
        <SelectFilter
          label="Situação"
          value={filters.situacao}
          options={SITUACAO_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, situacao: v }))}
          placeholder="Todas"
        />
        <SelectFilter
          label="Vigência"
          value={filters.alertaVencimento}
          options={ALERTA_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, alertaVencimento: v as 'expirado' | 'vigente' | null }))}
          placeholder="Todas"
        />
        <SelectFilter
          label="Ano de Publicação"
          value={filters.anoPublicacao}
          options={ANOS_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, anoPublicacao: v ? parseInt(v) : null }))}
          placeholder="Todos"
        />
      </FilterBar>

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        {/* Vencimentos mensais (ativos) */}
        <ChartCard
          title="Contratos Ativos por Mês de Vencimento"
          subtitle={`Quantidade de contratos · ${periodoLabel}`}
          minHeight={Math.max(280, vencimentos.length * 34)}
        >
          <BarByDimension
            data={vencimentos.map(v => ({ label: v.label, value: v.count }))}
            valueLabel="Contratos"
            height={Math.max(280, vencimentos.length * 34)}
            color="#1D5288"
          />
        </ChartCard>

        {/* Modalidade */}
        <ChartCard
          title="Distribuição por Modalidade"
          subtitle={`Quantidade de contratos · ${periodoLabel}`}
          minHeight={280}
        >
          <BarByDimension
            data={modalidades.map(m => ({ label: m.modalidade, value: m.count }))}
            valueLabel="Contratos"
            height={Math.max(280, modalidades.length * 40)}
            color="#2E6DB4"
          />
        </ChartCard>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────── */}
      <DataTable<ContratoRecord>
        columns={COLUMNS}
        rows={records}
        caption={`Detalhamento · ${periodoLabel} · ${records.length} contrato${records.length !== 1 ? 's' : ''}`}
        pageSize={15}
      />
    </div>
  );
}
