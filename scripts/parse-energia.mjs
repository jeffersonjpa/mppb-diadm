import fs from 'fs';
import path from 'path';

const CSV_PATH = 'C:/Users/Dell/workspace/diadm/dados/ENERGISA/saida_energia_mppb.csv';
const OUT_PATH = path.resolve('src/data/energia-data.json');

const raw = fs.readFileSync(CSV_PATH, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

const HEADER = lines[0].split(';');
const idx = (name) => HEADER.indexOf(name);

const I = {
  nomecsd:    idx('nomecsd_cad'),
  logradouro: idx('nomelgr'),
  cidade:     idx('nomelcd'),
  mes:        idx('nummes_ref'),
  ano:        idx('numano_ref'),
  vencimento: idx('datavcm_cta'),
  kwh:        idx('qtdcns_kwh_cad'),
  tensao:     idx('tensao'),
  icms:       idx('valicms_cta'),
  liquido:    idx('valliq_cta'),
  ilp:        idx('valilm_pbl_cta'),
  outros:     idx('valdvs_cta'),
  multa:      idx('val_multa'),
  juros:      idx('val_juros'),
  total:      idx('valtot_cta'),
  uc:         idx('numcdc_cad'),
};

function toTitle(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

// Parse all records
const allRecords = [];
for (const line of lines.slice(1)) {
  const c = line.split(';');
  if (c.length < 20) continue;

  const ano = parseInt(c[I.ano]);
  const mes = parseInt(c[I.mes]);
  if (isNaN(ano) || isNaN(mes)) continue;

  allRecords.push({
    uc:             c[I.uc].trim(),
    unidade:        toTitle(c[I.nomecsd].trim()),
    logradouro:     toTitle(c[I.logradouro].trim()),
    cidade:         toTitle(c[I.cidade].trim()),
    mes,
    ano,
    dataVencimento: c[I.vencimento].trim(),
    kwh:            parseFloat(c[I.kwh])    || 0,
    tensao:         c[I.tensao].trim(),
    valorTotal:     parseFloat(c[I.total])   || 0,
    valorLiquido:   parseFloat(c[I.liquido]) || 0,
    valorICMS:      parseFloat(c[I.icms])    || 0,
    valorILP:       parseFloat(c[I.ilp])     || 0,
    valorOutros:    parseFloat(c[I.outros])  || 0,
    valorMulta:     parseFloat(c[I.multa])   || 0,
    valorJuros:     parseFloat(c[I.juros])   || 0,
  });
}

// Normalizar cidade (variações de maiúsculas)
const cidadeNorm = {};
for (const r of allRecords) {
  const key = r.cidade.toUpperCase();
  if (!cidadeNorm[key]) cidadeNorm[key] = r.cidade;
  r._cidadeKey = key;
}
for (const r of allRecords) {
  r.cidade = cidadeNorm[r._cidadeKey];
  delete r._cidadeKey;
}

// Série mensal (todos os anos — para gráfico histórico)
const porMesAno = {};
for (const r of allRecords) {
  const key = `${r.ano}-${String(r.mes).padStart(2, '0')}`;
  if (!porMesAno[key]) porMesAno[key] = { ano: r.ano, mes: r.mes, kwh: 0, valorTotal: 0, registros: 0 };
  porMesAno[key].kwh        += r.kwh;
  porMesAno[key].valorTotal += r.valorTotal;
  porMesAno[key].registros  += 1;
}
const serieMensal = Object.values(porMesAno)
  .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes)
  .map(s => ({ ...s, kwh: +s.kwh.toFixed(2), valorTotal: +s.valorTotal.toFixed(2) }));

// Registros 2025 e 2026 (para tabela e filtros)
const ANOS_TABELA = [2025, 2026];
const registros = allRecords
  .filter(r => ANOS_TABELA.includes(r.ano))
  .map(r => ({
    ...r,
    kwh:          +r.kwh.toFixed(3),
    valorTotal:   +r.valorTotal.toFixed(2),
    valorLiquido: +r.valorLiquido.toFixed(2),
    valorICMS:    +r.valorICMS.toFixed(2),
    valorILP:     +r.valorILP.toFixed(2),
    valorOutros:  +r.valorOutros.toFixed(2),
    valorMulta:   +r.valorMulta.toFixed(2),
    valorJuros:   +r.valorJuros.toFixed(2),
  }));

// Meses disponíveis por ano
const mesesPorAno = {};
for (const ano of ANOS_TABELA) {
  mesesPorAno[ano] = [...new Set(registros.filter(r => r.ano === ano).map(r => r.mes))]
    .sort((a, b) => a - b);
}

// Listas de dimensões (para filtros)
const anos    = [...new Set(registros.map(r => r.ano))].sort();
const cidades = [...new Set(registros.map(r => r.cidade.toUpperCase()))].sort()
  .map(k => cidadeNorm[k]);

const out = {
  _gerado: new Date().toISOString(),
  anos,
  mesesPorAno,
  cidades,
  serieMensal,
  registros,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');

const n2025 = registros.filter(r => r.ano === 2025).length;
const n2026 = registros.filter(r => r.ano === 2026).length;
console.log(`✓ ${registros.length} registros (${n2025} em 2025, ${n2026} em 2026)`);
console.log(`  ${serieMensal.length} meses históricos | ${cidades.length} cidades`);
console.log(`  Meses 2025: ${mesesPorAno[2025]?.join(', ')}`);
console.log(`  Meses 2026: ${mesesPorAno[2026]?.join(', ')}`);
console.log(`  Salvo em: ${OUT_PATH}`);
