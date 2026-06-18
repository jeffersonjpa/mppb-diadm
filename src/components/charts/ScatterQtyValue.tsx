'use client';

import ReactECharts from 'echarts-for-react';
import { mppbTheme } from '@/lib/echarts/theme';
import { formatBRL } from '@/lib/format';

interface ScatterItem {
  name: string;
  value: [number, number]; // [qtd, total]
}

interface ScatterQtyValueProps {
  data: ScatterItem[];
  height?: number;
}

export default function ScatterQtyValue({ data, height = 320 }: ScatterQtyValueProps) {
  const option = {
    ...mppbTheme,
    grid: {
      top: 36,
      bottom: 42,
      left: 10,
      right: 26,
      containLabel: true,
    },
    tooltip: {
      backgroundColor: '#16273B',
      borderColor: 'transparent',
      textStyle: {
        color: '#FFFFFF',
        fontFamily: "'Public Sans', system-ui, sans-serif",
        fontSize: 12,
      },
      extraCssText: 'border-radius:8px; padding:10px 14px;',
      trigger: 'item',
      formatter: (params: { data: ScatterItem; value: [number, number] }) => {
        const item = params.data;
        return `<b>${item.name}</b><br/>Qtd: <b>${params.value[0]}</b><br/>Total: <b>${formatBRL(params.value[1])}</b>`;
      },
    },
    xAxis: {
      type: 'value',
      name: 'Qtd Terceirizados',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: {
        color: '#8A94A3',
        fontSize: 11,
        fontFamily: "'Public Sans', system-ui, sans-serif",
      },
      splitLine: {
        lineStyle: { color: '#ECEEF1', type: 'dashed' },
      },
      axisLabel: {
        color: '#8A94A3',
        fontSize: 11,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Valor Total',
      nameTextStyle: {
        color: '#8A94A3',
        fontSize: 11,
        fontFamily: "'Public Sans', system-ui, sans-serif",
      },
      axisLabel: {
        color: '#8A94A3',
        fontSize: 10,
        formatter: (v: number) => `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`,
      },
      splitLine: {
        lineStyle: { color: '#ECEEF1', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'scatter',
        data: data,
        symbolSize: (val: [number, number]) => {
          // Normalizes sizes between 10 and 34 based on quantity
          return Math.max(10, Math.min(34, val[0] * 1.4));
        },
        itemStyle: {
          color: 'rgba(29, 82, 136, 0.78)',
          borderColor: '#1D5288',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            color: '#1D5288',
          },
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 9,
          color: '#6B7480',
          fontFamily: "'Public Sans', system-ui, sans-serif",
          formatter: (params: { data: ScatterItem }) => {
            const name = params.data.name;
            return name.length > 18 ? `${name.slice(0, 16)}…` : name;
          },
        },
      },
    ],
    animationDuration: 500,
  };

  return <ReactECharts option={option} style={{ height }} notMerge />;
}
