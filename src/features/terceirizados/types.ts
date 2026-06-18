import type { DespesaBase } from '@/types/common';

export interface TerceirizadoRecord extends DespesaBase {
  modulo: 'terceirizados';
  cargo: string;
  nome: string;
  cpf: string;
}

export interface TerceirizadosFilters {
  cidade: string | null;
  unidade: string | null;
  fornecedor: string | null;
  cargo: string | null; // Adicionado para suporte ao filtro interativo via gráfico
  mFrom: number;
  yFrom: number;
  mTo: number;
  yTo: number;
}

export interface TerceirizadosKpis {
  valorTotal: number;
  valorMedio: number;
  quantidade: number;
  varTotal: number | null;
  varMedio: number | null;
  varQuantidade: number | null;
}
