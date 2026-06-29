'use client';

import { useState, useCallback, useMemo } from 'react';
import type { TerceirizadosFilters } from './types';

export const DEFAULT_FILTERS: TerceirizadosFilters = {
  cidades:      [],
  unidades:     [],
  fornecedores: [],
  cargos:       [],
  mFrom: 5,
  yFrom: 2025,
  mTo: 2,
  yTo: 2026,
};

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

export function useTerceirizadosFilters() {
  const [filters, setFilters] = useState<TerceirizadosFilters>(DEFAULT_FILTERS);

  const setCidades     = useCallback((cidades: string[]) => {
    setFilters(f => ({ ...f, cidades }));
  }, []);

  const setUnidades    = useCallback((unidades: string[]) => {
    setFilters(f => ({ ...f, unidades }));
  }, []);

  const setFornecedores = useCallback((fornecedores: string[]) => {
    setFilters(f => ({ ...f, fornecedores }));
  }, []);

  const setCargos      = useCallback((cargos: string[]) => {
    setFilters(f => ({ ...f, cargos }));
  }, []);

  const toggleCidade    = useCallback((v: string) => setFilters(f => ({ ...f, cidades:      toggle(f.cidades, v)      })), []);
  const toggleUnidade   = useCallback((v: string) => setFilters(f => ({ ...f, unidades:     toggle(f.unidades, v)     })), []);
  const toggleFornecedor = useCallback((v: string) => setFilters(f => ({ ...f, fornecedores: toggle(f.fornecedores, v) })), []);
  const toggleCargo     = useCallback((v: string) => setFilters(f => ({ ...f, cargos:       toggle(f.cargos, v)       })), []);

  const setPeriod = useCallback((updates: Partial<Pick<TerceirizadosFilters, 'mFrom' | 'yFrom' | 'mTo' | 'yTo'>>) => {
    setFilters(prev => {
      const next = { ...prev, ...updates };
      const fromVal = next.yFrom * 12 + (next.mFrom - 1);
      const toVal = next.yTo * 12 + (next.mTo - 1);
      if (fromVal > toVal) {
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
    if (filters.cidades.length      > 0) count++;
    if (filters.unidades.length     > 0) count++;
    if (filters.fornecedores.length > 0) count++;
    if (filters.cargos.length       > 0) count++;
    const isPeriodDefault =
      filters.mFrom === DEFAULT_FILTERS.mFrom &&
      filters.yFrom === DEFAULT_FILTERS.yFrom &&
      filters.mTo   === DEFAULT_FILTERS.mTo   &&
      filters.yTo   === DEFAULT_FILTERS.yTo;
    if (!isPeriodDefault) count++;
    return count;
  }, [filters]);

  return {
    filters,
    setCidades,
    setUnidades,
    setFornecedores,
    setCargos,
    toggleCidade,
    toggleUnidade,
    toggleFornecedor,
    toggleCargo,
    setPeriod,
    clearFilters,
    activeCount,
  };
}
