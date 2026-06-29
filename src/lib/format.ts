export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBRLShort(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Mi`;
  if (value >= 1_000)     return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} k`;
  return formatBRL(value);
}

export function formatKwh(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh`;
}

export function formatKwhShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MWh`;
  if (value >= 1_000)     return `${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MWh`;
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatDelta(delta: number | null): string {
  if (delta === null) return '—';
  const sign = delta >= 0 ? '▲' : '▼';
  return `${sign} ${formatPercent(delta)}`;
}

export function formatMonthYear(mes: number, ano: number): string {
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${MESES[mes - 1]}/${ano}`;
}

export const MESES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MESES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

