export interface CorreiosRecord extends Record<string, unknown> {
  id:              string;
  modulo:          'correios';
  titular:         string;
  cidade:          string;
  unidadePostagem: string;
  dataPostagem:    string;
  peso:            number; // em gramas
  quantidade:      number;
  valorLiquido:    number;
  ano:             number;
  mes:             number;
}

export interface SerieItem {
  ano:        number;
  mes:        number;
  quantidade: number;
  peso:       number; // em gramas
  valorTotal: number;
  registros:  number;
}

export interface CidadeSummary {
  cidade:     string;
  quantidade: number;
  valorTotal: number;
  registros:  number;
}

export interface CorreiosKpis {
  valorTotal:   number;
  quantidade:   number;
  custoMedio:   number;
  pesoTotal:    number; // em kg para exibição
  varValor:     number | null;
  varQuantidade: number | null;
  varCustoMedio: number | null;
  varPeso:      number | null;
}

export interface CorreiosFilters {
  anos:    number[];
  mes:     number | null;
  cidades: string[];
}
