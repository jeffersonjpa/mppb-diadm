'use client';

import { useState, useCallback, useMemo } from 'react';
import type { TerceirizadosFilters } from './types';

export const DEFAULT_FILTERS: TerceirizadosFilters = {
  cidade: null,
  unidade: null,
  fornecedor: null,
  cargo: null,
  mFrom: 5,
  yFrom: 2025,
  mTo: 2,
  yTo: 2026,
};

export function useTerceirizadosFilters() {
  const [filters, setFilters] = useState<TerceirizadosFilters>(DEFAULT_FILTERS);

  const setCidade = useCallback((cidade: string | null) => {
    setFilters(f => ({ ...f, cidade }));
  }, []);

  const setUnidade = useCallback((unidade: string | null) => {
    setFilters(f => ({ ...f, unidade }));
  }, []);

  const setFornecedor = useCallback((fornecedor: string | null) => {
    setFilters(f => ({ ...f, fornecedor }));
  }, []);

  const setCargo = useCallback((cargo: string | null) => {
    setFilters(f => ({ ...f, cargo }));
  }, []);

  const setPeriod = useCallback((updates: Partial<Pick<TerceirizadosFilters, 'mFrom' | 'yFrom' | 'mTo' | 'yTo'>>) => {
    setFilters(prev => {
      const next = { ...prev, ...updates };
      const fromVal = next.yFrom * 12 + (next.mFrom - 1);
      const toVal = next.yTo * 12 + (next.mTo - 1);
      if (fromVal > toVal) {
        // Autocorrige invertendo a ordem se o fim for anterior ao início
        return {
          ...next,
          mFrom: prev.mTo,
          yFrom: prev.yTo,
          mTo: prev.mFrom,
          yTo: prev.yFrom,
        };
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.cidade !== null) count++;
    if (filters.unidade !== null) count++;
    if (filters.fornecedor !== null) count++;
    if (filters.cargo !== null) count++;
    const isPeriodDefault =
      filters.mFrom === DEFAULT_FILTERS.mFrom &&
      filters.yFrom === DEFAULT_FILTERS.yFrom &&
      filters.mTo === DEFAULT_FILTERS.mTo &&
      filters.yTo === DEFAULT_FILTERS.yTo;
    if (!isPeriodDefault) count++;
    return count;
  }, [filters]);

  return {
    filters,
    setCidade,
    setUnidade,
    setFornecedor,
    setCargo,
    setPeriod,
    clearFilters,
    activeCount,
  };
}
