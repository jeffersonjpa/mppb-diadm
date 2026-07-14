import type { DespesaBase } from '@/types/common';

export interface TerceirizadoRecord extends DespesaBase {
  modulo: 'terceirizados';
  cargo: string;
  nome: string;
  cpf: string;
}

export interface TerceirizadosFilters {
  cidades:     string[];
  unidades:    string[];
  fornecedores: string[];
  cargos:      string[];
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
  varTotalAbs:      number | null;
  varMedioAbs:      number | null;
  varQuantidadeAbs: number | null;
}
