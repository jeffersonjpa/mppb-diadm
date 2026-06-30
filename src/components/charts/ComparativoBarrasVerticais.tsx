'use client';

import ReactECharts from 'echarts-for-react';
import { formatBRL, formatBRLShort } from '@/lib/format';
import type { ComparativoUnidade } from '@/features/comparativo/types';

type Modulo = 'energia' | 'agua' | 'correios';

interface Props {
  data: ComparativoUnidade[];
  modulos: Modulo[];
  height?: number;
}

const SERIES_CONFIG: { key: Modulo; name: string; color: string }[] = [
  { key: 'energia',  name: 'Energia',  color: '#1D5288' },
  { key: 'agua',     name: 'Água',     color: '#0891B2' },
  { key: 'correios', name: 'Correios', color: '#C2410C' },
];

export default function ComparativoBarrasVerticais({ data, modulos, height = 420 }: Props) {
  const labels = data.map(d => d.label);

  const initialEndPct = data.length > 0
    ? Math.min(100, Math.round((20 / data.length) * 100))
    : 100;

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#16273B',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12, fontFamily: "'Public Sans', system-ui, sans-serif" },
      extraCssText: 'border-radius:8px; padding:10px 14px;',
      formatter: (params: { seriesName: string; value: number; marker: string; dataIndex: number }[]) => {
        const idx   = params[0]?.dataIndex ?? 0;
        const unit  = data[idx];
        const total = params.reduce((s, p) => s + (p.value || 0), 0);
        const lines = params
          .filter(p => p.value > 0)
          .map(p => `${p.marker} ${p.seriesName}: <b>${formatBRL(p.value)}</b>`)
          .join('<br/>');
        return `<div style="font-weight:700;margin-bottom:4px;max-width:220px;white-space:normal">${unit?.label}</div>${lines}<hr style="border-color:rgba(255,255,255,.15);margin:6px 0"/><span style="opacity:.7">Total: </span><b>${formatBRL(total)}</b>`;
      },
    },
    legend: {
      top: 0,
      left: 0,
      textStyle: { color: '#475467', fontSize: 12 },
      itemHeight: 8,
      itemWidth: 20,
    },
    grid: {
      top: 36,
      right: 16,
      bottom: 56,
      left: 16,
      containLabel: true,
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: 8,
        height: 18,
        start: 0,
        end: initialEndPct,
        borderColor: '#ECEEF1',
        fillerColor: 'rgba(29,82,136,0.08)',
        handleStyle: { color: '#1D5288' },
        moveHandleStyle: { color: '#1D5288' },
        textStyle: { color: '#6B7480', fontSize: 10 },
        showDetail: false,
      },
    ],
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#6B7480',
        fontSize: 10,
        rotate: 35,
        interval: 0,
        overflow: 'truncate',
        width: 100,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#6B7480',
        fontSize: 10,
        formatter: (v: number) => formatBRLShort(v),
      },
      splitLine: { lineStyle: { color: '#ECEEF1', type: 'dashed' } },
    },
    series: SERIES_CONFIG
      .filter(s => modulos.includes(s.key))
      .map(s => ({
        name: s.name,
        type: 'bar',
        data: data.map(d => d[s.key] || null),
        itemStyle: { color: s.color, borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 22,
        emphasis: { itemStyle: { opacity: 0.85 } },
      })),
    animationDuration: 500,
  };

  return <ReactECharts option={option} style={{ height }} notMerge />;
}
