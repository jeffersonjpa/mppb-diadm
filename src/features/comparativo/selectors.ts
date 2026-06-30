import { getRegistros as getEnergiaRegistros, getSerieMensal as getEnergiaSerie } from '@/lib/api/energia';
import { getRegistros as getAguaRegistros, getSerieMensal as getAguaSerie } from '@/lib/api/agua';
import { getRegistros as getCorreiosRegistros, getSerieMensal as getCorreiosSerie } from '@/lib/api/correios';
import { UNIDADES_NORMALIZADAS } from '@/data/unidades-normalizadas';
import type { ComparativoUnidade, ComparativoSerieMes } from './types';

export function computeComparativoPorUnidade(
  anos: number[],
  mes: number | null,
): ComparativoUnidade[] {
  const energiaRecs  = getEnergiaRegistros({ anos, mes, cidades: [], unidades: [] });
  const aguaRecs     = getAguaRegistros({ anos, mes, cidades: [] });
  const correiosRecs = getCorreiosRegistros({ anos, mes, cidades: [] });

  // unidade -> total
  const energiaMap = new Map<string, number>();
  // `${unidade}|${cidade}` -> total (for ambiguous unidade names)
  const energiaCidadeMap = new Map<string, number>();
  for (const r of energiaRecs) {
    energiaMap.set(r.unidade, (energiaMap.get(r.unidade) ?? 0) + r.valorTotal);
    const ck = `${r.unidade}|${r.cidade}`;
    energiaCidadeMap.set(ck, (energiaCidadeMap.get(ck) ?? 0) + r.valorTotal);
  }

  const aguaMap = new Map<string, number>();
  for (const r of aguaRecs) {
    aguaMap.set(r.unidade, (aguaMap.get(r.unidade) ?? 0) + r.valor);
  }

  const correiosMap = new Map<string, number>();
  for (const r of correiosRecs) {
    correiosMap.set(r.cidade, (correiosMap.get(r.cidade) ?? 0) + r.valorLiquido);
  }

  const result: ComparativoUnidade[] = [];

  for (const u of UNIDADES_NORMALIZADAS) {
    let energia = 0;
    for (const eu of u.energiaUnidades) {
      if (u.energiaCidade) {
        energia += energiaCidadeMap.get(`${eu}|${u.energiaCidade}`) ?? 0;
      } else {
        energia += energiaMap.get(eu) ?? 0;
      }
    }

    let agua = 0;
    for (const au of u.aguaUnidades) {
      agua += aguaMap.get(au) ?? 0;
    }

    let correios = 0;
    for (const cc of u.correiosCidades) {
      correios += correiosMap.get(cc) ?? 0;
    }

    const total = energia + agua + correios;
    if (total === 0) continue;

    result.push({ id: u.id, label: u.label, cidade: u.cidade, energia, agua, correios, total });
  }

  return result.sort((a, b) => b.total - a.total);
}

export function computeComparativoSerieMensal(anos: number[]): ComparativoSerieMes[] {
  const energiaSerie  = getEnergiaSerie(anos);
  const aguaSerie     = getAguaSerie(anos);
  const correiosSerie = getCorreiosSerie(anos);

  const map = new Map<string, ComparativoSerieMes>();

  for (const s of energiaSerie) {
    const key   = `${s.ano}-${s.mes}`;
    const entry = map.get(key) ?? { ano: s.ano, mes: s.mes, energia: 0, agua: 0, correios: 0 };
    entry.energia += s.valorTotal;
    map.set(key, entry);
  }
  for (const s of aguaSerie) {
    const key   = `${s.ano}-${s.mes}`;
    const entry = map.get(key) ?? { ano: s.ano, mes: s.mes, energia: 0, agua: 0, correios: 0 };
    entry.agua += s.valorTotal;
    map.set(key, entry);
  }
  for (const s of correiosSerie) {
    const key   = `${s.ano}-${s.mes}`;
    const entry = map.get(key) ?? { ano: s.ano, mes: s.mes, energia: 0, agua: 0, correios: 0 };
    entry.correios += s.valorTotal;
    map.set(key, entry);
  }

  return [...map.values()].sort((a, b) =>
    a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes,
  );
}
