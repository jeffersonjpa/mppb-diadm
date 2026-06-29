export interface ContratoRecord extends Record<string, unknown> {
  numContrato:        string;
  objeto:             string;
  dataPublicacao:     string | null;
  anoPublicacao:      number | null;
  numEdital:          string;
  modalidade:         string;
  vigenciaInicio:     string | null;
  vigenciaTermino:    string | null;
  situacao:           string;
  itemFornecido:      string;
  valorTotalContrato: number | null;
  contratado:         string;
  cnpjCpf:            string;
  numAditivos:        number;
  numApostilamentos:  number;
  fiscais:            string;
}

export interface ContratoKpis {
  total:           number;
  ativos:          number;
  concluidos:      number;
  rescindidos:     number;
  valorAtivos:     number;
  vencendo30:      number;
  vencendo90:      number;
  expirados:       number;
}

export interface VencimentoMes {
  label:    string;  // "Jul/26"
  mes:      number;
  ano:      number;
  count:    number;
  valor:    number;
}

export interface ModalidadeSummary {
  modalidade: string;
  count:      number;
  valor:      number;
}

export interface ContratoFilters {
  situacoes:         string[];
  anoPublicacoes:    number[];
  alertasVencimento: string[];
}
