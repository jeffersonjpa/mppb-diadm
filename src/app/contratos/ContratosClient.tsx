'use client';

import { useState, useMemo } from 'react';
import { FileText, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

import KpiCard        from '@/components/kpi/KpiCard';
import AiInsight      from '@/components/ai/AiInsight';
import FilterBar      from '@/components/filters/FilterBar';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import ChartCard      from '@/components/charts/ChartCard';
import BarByDimension from '@/components/charts/BarByDimension';
import DataTable, { type Column } from '@/components/table/DataTable';

import { getContratos, ANOS_PUBLICACAO, SITUACOES, MODALIDADES } from '@/lib/api/contratos';
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
    situacoes:         [],
    anoPublicacoes:    [],
    alertasVencimento: [],
    modalidades:       [],
    mesesVencimento:   [],
  });

  const [ordenacaoVencimento, setOrdenacaoVencimento] = useState<'mes' | 'quantidade'>('mes');

  const activeCount =
    (filters.situacoes.length         > 0 ? 1 : 0) +
    (filters.anoPublicacoes.length    > 0 ? 1 : 0) +
    (filters.alertasVencimento.length > 0 ? 1 : 0) +
    (filters.modalidades.length       > 0 ? 1 : 0) +
    (filters.mesesVencimento.length   > 0 ? 1 : 0);

  const records = useMemo(() => getContratos(filters), [filters]);

  const kpis = useMemo(() => computeKpis(records), [records]);

  const vencimentos = useMemo(() => computeVencimentosMensais(records, 24), [records]);

  const modalidades = useMemo(() => computeModalidades(records), [records]);

  const ANOS_OPTIONS       = ANOS_PUBLICACAO.map(a => ({ value: a, label: String(a) })).reverse();
  const SITUACAO_OPTIONS   = SITUACOES.map(s => ({ value: s, label: s }));
  const MODALIDADE_OPTIONS = MODALIDADES.map(m => ({ value: m, label: m }));
  const ALERTA_OPTIONS = [
    { value: 'expirado',   label: 'Expirado (Ativo)'     },
    { value: 'vencendo30', label: 'Vencendo em 30 dias'  },
    { value: 'vencendo60', label: 'Vencendo em 60 dias'  },
    { value: 'vencendo90', label: 'Vencendo em 90 dias'  },
    { value: 'vigente',    label: 'Vigente (Ativo)'      },
  ];

  const periodoLabel = [
    filters.situacoes.length         > 0 ? filters.situacoes.join(', ')                                                                               : null,
    filters.alertasVencimento.length > 0 ? filters.alertasVencimento.map(v => ALERTA_OPTIONS.find(o => o.value === v)?.label ?? v).join(', ') : null,
    filters.anoPublicacoes.length    > 0 ? filters.anoPublicacoes.join(', ')                                                                          : null,
    filters.modalidades.length       > 0 ? filters.modalidades.join(', ')                                                                            : null,
    filters.mesesVencimento.length   > 0 ? filters.mesesVencimento.map(k => vencimentos.find(v => `${v.ano}-${String(v.mes).padStart(2, '0')}` === k)?.label ?? k).join(', ') : null,
  ].filter(Boolean).join(' · ') || 'Todos os contratos';

  // Clique na barra "Mês de Vencimento" (toggle) — filtra pelo mês/ano e trava Situação = Ativo
  function toggleMesVencimento(label: string) {
    const v = vencimentos.find(x => x.label === label);
    if (!v) return;
    const key = `${v.ano}-${String(v.mes).padStart(2, '0')}`;
    setFilters(f => {
      const jaSelecionado = f.mesesVencimento.includes(key);
      return {
        ...f,
        mesesVencimento: jaSelecionado
          ? f.mesesVencimento.filter(k => k !== key)
          : [...f.mesesVencimento, key],
        situacoes: jaSelecionado ? f.situacoes : ['Ativo'],
      };
    });
  }

  // Clique na barra "Modalidade" (toggle)
  function toggleModalidade(label: string) {
    setFilters(f => ({
      ...f,
      modalidades: f.modalidades.includes(label)
        ? f.modalidades.filter(m => m !== label)
        : [...f.modalidades, label],
    }));
  }

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
        onClear={() => setFilters({ situacoes: [], anoPublicacoes: [], alertasVencimento: [], modalidades: [], mesesVencimento: [] })}
      >
        <MultiSelectFilter
          label="Situação"
          values={filters.situacoes}
          options={SITUACAO_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, situacoes: v }))}
          placeholder="Todas"
          searchable={false}
        />
        <MultiSelectFilter
          label="Vigência"
          values={filters.alertasVencimento}
          options={ALERTA_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, alertasVencimento: v }))}
          placeholder="Todas"
          searchable={false}
        />
        <MultiSelectFilter
          label="Ano de Publicação"
          values={filters.anoPublicacoes.map(String)}
          options={ANOS_OPTIONS.map(o => ({ ...o, value: String(o.value) }))}
          onChange={v => setFilters(f => ({ ...f, anoPublicacoes: v.map(Number) }))}
          placeholder="Todos"
          searchable={false}
        />
        <MultiSelectFilter
          label="Modalidade"
          values={filters.modalidades}
          options={MODALIDADE_OPTIONS}
          onChange={v => setFilters(f => ({ ...f, modalidades: v }))}
          placeholder="Todas"
          searchable={false}
        />
      </FilterBar>

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        {/* Vencimentos mensais (ativos) */}
        <ChartCard
          title="Contratos Ativos por Mês de Vencimento"
          subtitle={`Quantidade de contratos · ${periodoLabel}`}
          minHeight={Math.max(280, vencimentos.length * 34)}
          actions={
            <div className="flex bg-[#F1F4F8] border border-[#E7EBF0] rounded-[9px] p-0.5 gap-0.5">
              {([
                { value: 'mes',        label: 'MÊS' },
                { value: 'quantidade', label: 'QUANTITATIVO' },
              ] as const).map(opt => {
                const active = ordenacaoVencimento === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setOrdenacaoVencimento(opt.value)}
                    className={`
                      border-0 cursor-pointer font-bold text-[10px] tracking-[0.4px] px-2.5 py-1.5 rounded-[6px]
                      transition-all duration-150
                      ${active
                        ? 'bg-mp-primary text-white shadow-[0_1px_2px_rgba(29,82,136,0.3)]'
                        : 'bg-transparent text-mp-muted hover:text-mp-text'}
                    `}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          }
        >
          <BarByDimension
            data={
              ordenacaoVencimento === 'mes'
                ? [...vencimentos].reverse().map(v => ({ label: v.label, value: v.count }))
                : vencimentos.map(v => ({ label: v.label, value: v.count }))
            }
            valueLabel="Contratos"
            unit="count"
            height={Math.max(280, vencimentos.length * 34)}
            color="#1D5288"
            onBarClick={toggleMesVencimento}
            sortByValue={ordenacaoVencimento === 'quantidade'}
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
            unit="count"
            height={Math.max(280, modalidades.length * 40)}
            color="#2E6DB4"
            onBarClick={toggleModalidade}
          />
        </ChartCard>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────── */}
      <DataTable<ContratoRecord>
        columns={COLUMNS}
        rows={records}
        caption={`Detalhamento · ${periodoLabel} · ${records.length} contrato${records.length !== 1 ? 's' : ''}`}
        pageSize={15}
        searchable
      />
    </div>
  );
}
