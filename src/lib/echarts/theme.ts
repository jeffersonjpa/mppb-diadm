const MP_COLORS = {
  primary:     '#1D5288',
  primaryDark: '#16406B',
  ink:         '#16273B',
  secondary:   '#475467',
  muted:       '#6B7480',
  border:      '#ECEEF1',
  surface:     '#FFFFFF',
  success:     '#1E7E25',
  danger:      '#B23B3B',
  warning:     '#B98900',
  accent:      '#C2410C',
};

export const BAR_COLORS = [
  MP_COLORS.primary,
  '#2563EB',
  '#0891B2',
  '#059669',
  '#7C3AED',
  '#DB2777',
  '#D97706',
  '#DC2626',
  '#16A34A',
  '#9333EA',
  '#0284C7',
  '#EA580C',
];

export const mppbTheme = {
  color: BAR_COLORS,

  backgroundColor: 'transparent',

  textStyle: {
    fontFamily: "'Public Sans', system-ui, sans-serif",
    color: MP_COLORS.secondary,
  },

  title: {
    textStyle: {
      fontFamily: "'Public Sans', system-ui, sans-serif",
      color: MP_COLORS.ink,
      fontWeight: 800,
    },
  },

  tooltip: {
    backgroundColor: MP_COLORS.ink,
    borderColor: 'transparent',
    textStyle: {
      color: '#FFFFFF',
      fontFamily: "'Public Sans', system-ui, sans-serif",
      fontSize: 12,
    },
    extraCssText: 'border-radius:8px; padding:10px 14px;',
  },

  legend: {
    textStyle: {
      color: MP_COLORS.secondary,
      fontFamily: "'Public Sans', system-ui, sans-serif",
      fontSize: 12,
    },
  },

  categoryAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: MP_COLORS.muted,
      fontFamily: "'Public Sans', system-ui, sans-serif",
      fontSize: 11,
    },
    splitLine: {
      lineStyle: { color: MP_COLORS.border, type: 'dashed' },
    },
  },

  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: MP_COLORS.muted,
      fontFamily: "'Public Sans', system-ui, sans-serif",
      fontSize: 11,
    },
    splitLine: {
      lineStyle: { color: MP_COLORS.border, type: 'dashed' },
    },
  },

  grid: {
    top: 16,
    right: 16,
    bottom: 16,
    left: 16,
    containLabel: true,
  },

  line: {
    lineStyle: { width: 2 },
    symbolSize: 5,
    smooth: false,
  },

  bar: {
    barMaxWidth: 40,
    itemStyle: { borderRadius: [4, 4, 0, 0] },
  },

  animationDuration: 500,
  animationEasing: 'cubicOut' as const,
};
