'use client';

import ReactECharts from 'echarts-for-react';
import { mppbTheme } from '@/lib/echarts/theme';
import { formatBRL, formatBRLShort } from '@/lib/format';

interface BarItem {
  label: string;
  value: number;
}

interface BarByDimensionProps {
  data:        BarItem[];
  valueLabel?: string;
  height?:     number;
  color?:      string;
  unit?:       'brl' | 'm3' | 'count';
  onBarClick?: (label: string) => void;
  /** Quando false, preserva a ordem recebida em `data` em vez de ordenar por valor. */
  sortByValue?: boolean;
}

export default function BarByDimension({
  data,
  valueLabel = 'Valor (R$)',
  height = 320,
  color = '#1D5288',
  unit = 'brl',
  onBarClick,
  sortByValue = true,
}: BarByDimensionProps) {
  const fmt      = unit === 'm3'
    ? (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' m³'
    : unit === 'count'
    ? (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : formatBRL;
  const fmtShort = unit === 'm3'
    ? (v: number) => (v >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k m³' : v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' m³')
    : unit === 'count'
    ? (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : formatBRLShort;
  // Ordena crescente p/ barras horizontais (ECharts exibe de baixo p/ cima)
  const sorted = sortByValue ? [...data].sort((a, b) => a.value - b.value) : data;

  const option = {
    ...mppbTheme,
    tooltip: {
      ...mppbTheme.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `<b>${p.name}</b><br/>${fmt(p.value)}`;
      },
    },
    grid: { top: 8, right: 80, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#6B7480',
        fontSize: 10,
        formatter: (v: number) => fmtShort(v),
      },
      splitLine: { lineStyle: { color: '#ECEEF1', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: sorted.map(d => d.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#475467',
        fontSize: 11,
        width: 140,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: valueLabel,
        type: 'bar',
        data: sorted.map(d => d.value),
        barMaxWidth: 28,
        itemStyle: {
          color,
          borderRadius: [0, 5, 5, 0],
          cursor: onBarClick ? 'pointer' : 'default',
        },
        label: {
          show: true,
          position: 'right',
          color: '#475467',
          fontSize: 11,
          formatter: ({ value }: { value: number }) => fmt(value),
        },
      },
    ],
    animationDuration: 500,
  };

  const onEvents = onBarClick
    ? { click: (params: { name: string }) => onBarClick(params.name) }
    : undefined;

  return <ReactECharts option={option} style={{ height }} notMerge onEvents={onEvents} />;
}
