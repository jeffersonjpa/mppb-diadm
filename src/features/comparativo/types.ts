export interface ComparativoUnidade {
  id: string;
  label: string;
  cidade: string;
  energia: number;
  agua: number;
  correios: number;
  total: number;
}

export interface ComparativoSerieMes {
  ano: number;
  mes: number;
  energia: number;
  agua: number;
  correios: number;
}

export interface ComparativoFilters {
  anos: number[];
  mes: number | null;
  modulos: ('energia' | 'agua' | 'correios')[];
}
