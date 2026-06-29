'use client';

import ReactECharts from 'echarts-for-react';
import { mppbTheme } from '@/lib/echarts/theme';

export interface EficienciaItem {
  label:      string;
  consumoPct: number;
  areaPct:    number | null;
  membrosPct: number | null;
  eficiencia: number | null;  // consumoPct / membrosPct — null se sem membros
  isServidor: boolean;
}

interface Props {
  data:    EficienciaItem[];
  height?: number;
}

const COLORS = {
  consumo: '#1D5288',   // navy — Índice Consumo Energia
  area:    '#1E7E25',   // verde — % Área Própria
  membros: '#98A2B3',   // cinza — % Qtd Membros
};

const FMT_PCT = (v: number) => `${v.toFixed(2)}%`;

function eficienciaLabel(ef: number | null, isServidor: boolean): string {
  if (isServidor) return 'Servidores administrativos';
  if (ef === null) return '—';
  if (ef <= 0.50)             return 'Muito Eficiente';
  if (ef <= 0.80)             return 'Eficiente';
  if (ef <= 1.20)             return 'Moderado';
  if (ef <= 2.00)             return 'Ineficiente';
  return 'Muito Ineficiente';
}

export default function EfficiencyGroupedBar({ data, height = 420 }: Props) {
  // Ordenar: sem membros (isServidor) por consumo desc, com membros por eficiência desc
  const sorted = [...data].sort((a, b) => {
    const ef_a = a.eficiencia ?? Infinity;
    const ef_b = b.eficiencia ?? Infinity;
    if (ef_a !== ef_b) return ef_a - ef_b;
    return a.consumoPct - b.consumoPct;
  });

  const labels     = sorted.map(d => d.label);
  const consumoSer = sorted.map(d => d.consumoPct);
  const areaSer    = sorted.map(d => d.areaPct   ?? null);
  const membrosSer = sorted.map(d => d.membrosPct ?? null);

  const option = {
    ...mppbTheme,
    legend: {
      ...mppbTheme.legend,
      top: 0,
      left: 0,
      data: [
        { name: 'Índice Consumo Energia', itemStyle: { color: COLORS.consumo } },
        { name: '% Área Própria',         itemStyle: { color: COLORS.area    } },
        { name: '% Qtd Membros',          itemStyle: { color: COLORS.membros } },
      ],
    },
    tooltip: {
      ...mppbTheme.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number | null; dataIndex: number }[]) => {
        const idx  = params[0]?.dataIndex ?? 0;
        const item = sorted[idx];
        const lines = params
          .filter(p => p.value !== null && p.value > 0)
          .map(p => `${p.seriesName}: <b>${FMT_PCT(p.value as number)}</b>`)
          .join('<br/>');
        const efStr = eficienciaLabel(item.eficiencia, item.isServidor);
        return `<b>${item.label}</b><br/>${lines}<br/><span style="opacity:.7">Eficiência: ${efStr}</span>`;
      },
    },
    grid: { top: 32, right: 72, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: 'value',
      max: (val: { max: number }) => Math.ceil(val.max * 1.15),
      axisLabel: {
        color: '#6B7480',
        fontSize: 10,
        formatter: (v: number) => `${v}%`,
      },
      splitLine: { lineStyle: { color: '#ECEEF1', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#475467',
        fontSize: 10,
        width: 180,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: 'Índice Consumo Energia',
        type: 'bar',
        data: consumoSer,
        barMaxWidth: 14,
        itemStyle: { color: COLORS.consumo, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: '#475467',
          fontSize: 10,
          formatter: ({ value }: { value: number | null }) =>
            value !== null && value > 0 ? FMT_PCT(value) : '',
        },
      },
      {
        name: '% Área Própria',
        type: 'bar',
        data: areaSer,
        barMaxWidth: 14,
        itemStyle: { color: COLORS.area, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: '#475467',
          fontSize: 10,
          formatter: ({ value }: { value: number | null }) =>
            value !== null && value > 0 ? FMT_PCT(value) : '',
        },
      },
      {
        name: '% Qtd Membros',
        type: 'bar',
        data: membrosSer,
        barMaxWidth: 14,
        itemStyle: { color: COLORS.membros, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: '#475467',
          fontSize: 10,
          formatter: ({ value }: { value: number | null }) =>
            value !== null && value > 0 ? FMT_PCT(value) : '',
        },
      },
    ],
    animationDuration: 500,
  };

  return <ReactECharts option={option} style={{ height }} notMerge />;
}
