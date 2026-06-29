export interface AguaRecord extends Record<string, unknown> {
  id:         string;
  modulo:     'agua';
  matricula:  string;
  unidade:    string;
  cidade:     string;
  inscricao:  string;
  consumo:    number;
  valor:      number;
  ano:        number;
  mes:        number;
}

export interface SerieItem {
  ano:        number;
  mes:        number;
  consumo:    number;
  valorTotal: number;
  registros:  number;
}

export interface CidadeSummary {
  cidade:     string;
  consumo:    number;
  valorTotal: number;
  matriculas: number;
}

export interface UnidadeSummary {
  unidade:    string;
  consumo:    number;
  valorTotal: number;
  matriculas: number;
}

export interface AguaKpis {
  valorTotal:  number;
  consumo:     number;
  precoMedio:  number;
  matriculas:  number;
  varValor:    number | null;
  varConsumo:  number | null;
  varPreco:    number | null;
}

export interface AguaFilters {
  anos:    number[];
  mes:     number | null;
  cidades: string[];
}
