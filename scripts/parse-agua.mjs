import fs from 'fs';
import path from 'path';

const CSV_PATH = 'C:/Users/Dell/workspace/diadm/dados/CAGEPA/saida_agua_mppb.csv';
const OUT_PATH = path.resolve('src/data/agua-data.json');

const raw = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split('\n').filter(l => l.trim());

const HEADER = lines[0].split(';').map(h => h.trim());
const idx = (name) => HEADER.indexOf(name);

const I = {
  matricula:  idx('MATRICULA'),
  unidade:    idx('UNIDADE'),
  localidade: idx('LOCALIDADE'),
  inscricao:  idx('INSCRICAO'),
  consumo:    idx('CONSUMO'),
  valor:      idx('VALOR_CONTA'),
  data:       idx('DATA'),
};

function toTitle(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

// 1º Passo: Mapear Matricula -> Localidade e Unidade para preencher lacunas
const matriculaToLocalidade = {};
const matriculaToUnidade = {};

for (const line of lines.slice(1)) {
  const c = line.split(';');
  if (c.length < HEADER.length) continue;
  
  const matricula = c[I.matricula]?.trim();
  const localidade = c[I.localidade]?.trim();
  const unidade = c[I.unidade]?.trim();

  if (matricula) {
    if (localidade && !matriculaToLocalidade[matricula]) {
      matriculaToLocalidade[matricula] = localidade.toUpperCase();
    }
    if (unidade && !matriculaToUnidade[matricula]) {
      matriculaToUnidade[matricula] = unidade;
    }
  }
}

// 2º Passo: Parsear todos os registros
const allRecords = [];
for (const line of lines.slice(1)) {
  const c = line.split(';');
  if (c.length < HEADER.length) continue;

  const dataRaw = c[I.data]?.trim();
  if (!dataRaw) continue;

  const parts = dataRaw.split('/');
  if (parts.length !== 2) continue;
  const mes = parseInt(parts[0]);
  const ano = parseInt(parts[1]);

  if (isNaN(ano) || isNaN(mes)) continue;

  const matricula = c[I.matricula]?.trim() || '';
  
  // Preencher localidade e unidade vazias a partir do mapa da matrícula
  let cidade = c[I.localidade]?.trim()?.toUpperCase() || matriculaToLocalidade[matricula] || 'NÃO INFORMADO';
  let unidade = c[I.unidade]?.trim() || matriculaToUnidade[matricula] || 'NÃO INFORMADO';

  const consumoStr = c[I.consumo]?.trim() || '0';
  const consumo = parseFloat(consumoStr.replace(',', '.')) || 0;

  const valorStr = c[I.valor]?.trim() || '0';
  const valor = parseFloat(valorStr.replace(',', '.')) || 0;

  allRecords.push({
    id: `${ano}-${mes}-${matricula}-${c[I.inscricao]?.trim()}`,
    modulo: 'agua',
    matricula,
    unidade: toTitle(unidade),
    cidade: cidade.toUpperCase(),
    inscricao: c[I.inscricao]?.trim() || '',
    consumo,
    valor,
    ano,
    mes
  });
}

// Normalizar nomes de cidades
const cidadeNorm = {};
for (const r of allRecords) {
  const key = r.cidade.toUpperCase();
  if (!cidadeNorm[key]) cidadeNorm[key] = toTitle(r.cidade);
  r._cidadeKey = key;
}
for (const r of allRecords) {
  r.cidade = cidadeNorm[r._cidadeKey];
  delete r._cidadeKey;
}

// Série mensal histórica (todos os anos)
const porMesAno = {};
for (const r of allRecords) {
  const key = `${r.ano}-${String(r.mes).padStart(2, '0')}`;
  if (!porMesAno[key]) {
    porMesAno[key] = { ano: r.ano, mes: r.mes, consumo: 0, valorTotal: 0, registros: 0 };
  }
  porMesAno[key].consumo    += r.consumo;
  porMesAno[key].valorTotal += r.valor;
  porMesAno[key].registros  += 1;
}

const serieMensal = Object.values(porMesAno)
  .sort((a, b) => (a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes))
  .map(s => ({
    ...s,
    consumo: +s.consumo.toFixed(2),
    valorTotal: +s.valorTotal.toFixed(2)
  }));

// Filtrar registros de 2022 a 2026 para exibição em tabelas e filtros
const ANOS_TABELA = [2022, 2023, 2024, 2025, 2026];
const registros = allRecords
  .filter(r => ANOS_TABELA.includes(r.ano))
  .map(r => ({
    ...r,
    consumo: +r.consumo.toFixed(2),
    valor: +r.valor.toFixed(2)
  }));

const anos = [...new Set(registros.map(r => r.ano))].sort();
const cidades = [...new Set(registros.map(r => r.cidade.toUpperCase()))].sort()
  .map(k => cidadeNorm[k]);

const mesesPorAno = {};
for (const ano of ANOS_TABELA) {
  mesesPorAno[ano] = [...new Set(registros.filter(r => r.ano === ano).map(r => r.mes))].sort((a, b) => a - b);
}

const out = {
  _gerado: new Date().toISOString(),
  anos,
  mesesPorAno,
  cidades,
  serieMensal,
  registros
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');

console.log(`✓ ${registros.length} registros de água processados (2022-2026).`);
console.log(`  Série mensal: ${serieMensal.length} meses.`);
console.log(`  Salvo em: ${OUT_PATH}`);
