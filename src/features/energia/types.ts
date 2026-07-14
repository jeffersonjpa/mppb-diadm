export interface EnergiaRecord extends Record<string, unknown> {
  uc:             string;
  unidade:        string;
  logradouro:     string;
  cidade:         string;
  mes:            number;
  ano:            number;
  dataVencimento: string;
  kwh:            number;
  tensao:         string;
  valorTotal:     number;
  valorLiquido:   number;
  valorICMS:      number;
  valorILP:       number;
  valorOutros:    number;
  valorMulta:     number;
  valorJuros:     number;
}

export interface SerieItem {
  ano:        number;
  mes:        number;
  kwh:        number;
  valorTotal: number;
  registros:  number;
}

export interface CidadeSummary {
  cidade:     string;
  kwh:        number;
  valorTotal: number;
  ucs:        number;
}

export interface UnidadeSummary {
  unidade:    string;
  kwh:        number;
  valorTotal: number;
  registros:  number;
}

export interface EnergiaKpis {
  valorTotal:  number;
  kwh:         number;
  custoPorKwh: number;
  ucs:         number;
  varValor:    number | null;
  varKwh:      number | null;
  varCusto:    number | null;
  varValorAbs: number | null;
  varKwhAbs:   number | null;
  varCustoAbs: number | null;
}

export interface EnergiaFilters {
  anos:     number[];
  mes:      number | null;
  cidades:  string[];
  unidades: string[];
}

export interface EficienciaUnidade {
  key:             string;
  label:           string;
  cidade:          string;
  energiaUnidades: string[];
  consumo:         number;
  areaM2:          number | null;
  membros:         number | null;
  isServidor:      boolean;
}
