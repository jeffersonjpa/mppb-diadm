'use client';

import ReactECharts from 'echarts-for-react';
import { formatBRL, formatBRLShort, formatKwh } from '@/lib/format';

interface Series {
  name:   string;
  data:   (number | null)[];
  color?: string;
}

interface MonthlyLineProps {
  labels:         string[];
  series:         Series[];
  height?:        number;
  unit?:          'brl' | 'kwh';
  onSeriesClick?: (seriesName: string, monthLabel: string) => void;
}

export default function MonthlyLine({
  labels,
  series,
  height = 280,
  unit = 'brl',
  onSeriesClick,
}: MonthlyLineProps) {
  const axisFormatter = unit === 'brl'
    ? (v: number) => formatBRLShort(v)
    : (v: number) => `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k kWh`;

  const tooltipFormatter = unit === 'brl'
    ? (v: number) => formatBRL(v)
    : (v: number) => formatKwh(v);

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#16273B',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12, fontFamily: "'Public Sans', system-ui, sans-serif" },
      extraCssText: 'border-radius:8px; padding:10px 14px;',
      formatter: (params: { seriesName: string; value: number | null; marker: string }[]) =>
        params
          .filter(p => p.value != null)
          .map(p => `${p.marker} ${p.seriesName}: <b>${tooltipFormatter(p.value as number)}</b>`)
          .join('<br/>'),
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#475467', fontSize: 12 },
      itemHeight: 8,
      itemWidth: 20,
    },
    grid: { top: 36, right: 16, bottom: 16, left: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B7480', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B7480', fontSize: 10, formatter: axisFormatter },
      splitLine: { lineStyle: { color: '#ECEEF1', type: 'dashed' } },
    },
    series: series.map(s => ({
      name: s.name,
      type: 'line',
      data: s.data,
      connectNulls: false,
      smooth: false,
      symbolSize: 5,
      lineStyle: { width: 2, color: s.color },
      itemStyle: { color: s.color, cursor: onSeriesClick ? 'pointer' : 'default' },
      areaStyle: s.color === '#1D5288' ? {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0,   color: 'rgba(29,82,136,0.18)' },
            { offset: 1,   color: 'rgba(29,82,136,0)' },
          ],
        },
      } : undefined,
    })),
    animationDuration: 500,
  };

  const onEvents = onSeriesClick
    ? { click: (params: { seriesName: string; name: string }) => onSeriesClick(params.seriesName, params.name) }
    : undefined;

  return <ReactECharts option={option} style={{ height }} notMerge onEvents={onEvents} />;
}
