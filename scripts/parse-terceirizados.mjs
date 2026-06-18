import fs from 'fs';
import path from 'path';

const CSV_PATH = 'C:/Users/Dell/workspace/diadm/dados/TERCEIRIZADOS/terceirizados.csv';
const OUT_PATH = path.resolve('src/data/terceirizados-data.json');

const raw = fs.readFileSync(CSV_PATH, 'utf8');

function parseCSV(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if (c === '\n' && !inQuotes) {
      lines.push(row);
      row = [''];
    } else if (c !== '\r') {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  return lines;
}

const lines = parseCSV(raw);
const HEADER = lines[0].map(h => h.trim().replace(/^\uFEFF/, '')); // remove BOM

const idx = (name) => HEADER.indexOf(name);

const I = {
  cargo:      idx('CARGO'),
  cpf:        idx('CPF'),
  data:       idx('DATA'),
  cidade:     idx('LOCALIDADE'),
  nome:       idx('NOME'),
  origem:     idx('ORIGEM'),
  fornecedor: idx('FORNECEDOR'),
  unidade:    idx('UNIDADE'),
  valor:      idx('VALOR'),
};

function toTitle(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

const allRecords = [];

for (let i = 1; i < lines.length; i++) {
  const row = lines[i];
  if (row.length < 9) continue;

  const cargoRaw = row[I.cargo].trim();
  const cpf = row[I.cpf].trim();
  const dataRaw = row[I.data].trim();
  const cidadeRaw = row[I.cidade].trim();
  const nomeRaw = row[I.nome].trim();
  const origemRaw = row[I.origem].trim();
  const fornecedorRaw = row[I.fornecedor].trim();
  const unidadeRaw = row[I.unidade].trim();
  const valorRaw = row[I.valor].trim();

  // If valor is empty, skip this record (as per user instruction to use only CSV values and not mock data)
  if (!valorRaw) continue;

  const valor = parseFloat(valorRaw.replace(',', '.'));
  if (isNaN(valor)) continue;

  const dateParts = dataRaw.split('-');
  const ano = parseInt(dateParts[0]);
  const mes = parseInt(dateParts[1]);

  if (isNaN(ano) || isNaN(mes)) continue;

  // Standardize cargo names to match uppercase expected formats
  let cargo = cargoRaw.toUpperCase();
  if (cargo === 'AUX. DE SERVIÇOS GERAIS') {
    cargo = 'AUX. DE SERV. GERAIS';
  }

  allRecords.push({
    id: `${ano}-${mes}-${cpf}`, // Unique ID
    modulo: 'terceirizados',
    cargo,
    cpf,
    cidade: cidadeRaw.toUpperCase(),
    nome: toTitle(nomeRaw),
    origem: origemRaw.toUpperCase(),
    fornecedor: fornecedorRaw.toUpperCase(),
    unidade: unidadeRaw.toUpperCase(),
    ano,
    mes,
    valor: +valor.toFixed(2),
  });
}

// Extract available dimensions
const anos = [...new Set(allRecords.map(r => r.ano))].sort((a, b) => a - b);
const cidades = [...new Set(allRecords.map(r => r.cidade))].sort();

const mesesPorAno = {};
for (const ano of anos) {
  mesesPorAno[ano] = [...new Set(allRecords.filter(r => r.ano === ano).map(r => r.mes))].sort((a, b) => a - b);
}

// Serie mensal de terceirizados
const porMesAno = {};
for (const r of allRecords) {
  const key = `${r.ano}-${String(r.mes).padStart(2, '0')}`;
  if (!porMesAno[key]) {
    porMesAno[key] = { ano: r.ano, mes: r.mes, valorTotal: 0, registros: 0 };
  }
  porMesAno[key].valorTotal += r.valor;
  porMesAno[key].registros += 1;
}

const serieMensal = Object.values(porMesAno)
  .sort((a, b) => (a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes))
  .map(s => ({ ...s, valorTotal: +s.valorTotal.toFixed(2) }));

const out = {
  _gerado: new Date().toISOString(),
  anos,
  mesesPorAno,
  cidades,
  serieMensal,
  registros: allRecords,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');

console.log(`✓ ${allRecords.length} registros de terceirizados processados.`);
console.log(`  Anos disponíveis: ${anos.join(', ')}`);
console.log(`  Cidades disponíveis: ${cidades.length}`);
console.log(`  Meses históricos: ${serieMensal.length}`);
console.log(`  Salvo em: ${OUT_PATH}`);
