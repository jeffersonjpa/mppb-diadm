'use client';

import ReactECharts from 'echarts-for-react';
import { mppbTheme } from '@/lib/echarts/theme';
import { formatBRLShort } from '@/lib/format';

interface BarItem {
  label: string;
  value: number;
}

interface BarByDimensionProps {
  data:        BarItem[];
  valueLabel?: string;
  height?:     number;
  color?:      string;
  onBarClick?: (label: string) => void;
}

export default function BarByDimension({
  data,
  valueLabel = 'Valor (R$)',
  height = 320,
  color = '#1D5288',
  onBarClick,
}: BarByDimensionProps) {
  // Ordena crescente p/ barras horizontais (ECharts exibe de baixo p/ cima)
  const sorted = [...data].sort((a, b) => a.value - b.value);

  const option = {
    ...mppbTheme,
    tooltip: {
      ...mppbTheme.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `<b>${p.name}</b><br/>${formatBRLShort(p.value)}`;
      },
    },
    grid: { top: 8, right: 80, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#6B7480',
        fontSize: 10,
        formatter: (v: number) => formatBRLShort(v),
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
          formatter: ({ value }: { value: number }) => formatBRLShort(value),
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
