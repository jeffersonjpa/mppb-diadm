export type ModuleId =
  | 'terceirizados'
  | 'energia'
  | 'agua'
  | 'telefonia';

export interface DespesaBase extends Record<string, unknown> {
  id: string;
  modulo: ModuleId;
  cidade: string;
  unidade: string;
  fornecedor: string;
  ano: number;
  mes: number;
  valor: number;
  origem: string;
}
