import fs from 'fs';
import path from 'path';

const CSV_PATH = 'C:/Users/Dell/workspace/diadm/dados/CORREIOS/saida_correios_mppb.csv';
const OUT_PATH = path.resolve('src/data/correios-data.json');

const raw = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split('\n').filter(l => l.trim());

const HEADER = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
const idx = (name) => HEADER.indexOf(name);

const I = {
  titular:          idx('titular_do_cartao'),
  cartao:           idx('cartao_de_postagem'),
  data:             idx('data_da_postagem'),
  servicoCod:       idx('codigo_do_servico'),
  servicoAdic:      idx('servicos_adicionais'),
  cep:              idx('cep_destinatario'),
  localidade:       idx('LOCALIDADE'),
  unidadePostagem:  idx('unidade_da_postagem'),
  peso:             idx('peso_(gramas)'),
  quantidade:       idx('quantidade'),
  etiqueta:         idx('numero_da_etiqueta'),
  documento:        idx('documento'),
  valorUnitario:    idx('valor_unitario_(r$)'),
  valorServico:     idx('valor_do_servico_(r$)'),
  desconto:         idx('desconto_(r$)'),
  valorLiquido:     idx('valor_liquido_(r$)'),
  valorDeclarado:   idx('valor_declarado_(r$)'),
};

function toTitle(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// 1º Passo: Mapear titular_do_cartao -> LOCALIDADE para preencher lacunas
const titularToLocalidade = {};
for (const line of lines.slice(1)) {
  const c = parseCSVLine(line);
  if (c.length < HEADER.length) continue;
  
  const titular = c[I.titular]?.trim()?.toUpperCase();
  const localidade = c[I.localidade]?.trim()?.toUpperCase();
  if (titular && localidade && !titularToLocalidade[titular]) {
    titularToLocalidade[titular] = localidade;
  }
}

// 2º Passo: Parsear todos os registros
const allRecords = [];
for (const line of lines.slice(1)) {
  const c = parseCSVLine(line);
  if (c.length < HEADER.length) continue;

  const dataRaw = c[I.data]?.trim();
  if (!dataRaw) continue;

  // DD/MM/YYYY
  const parts = dataRaw.split('/');
  if (parts.length !== 3) continue;
  const mes = parseInt(parts[1]);
  const ano = parseInt(parts[2]);

  if (isNaN(ano) || isNaN(mes)) continue;

  const titular = c[I.titular]?.trim() || '';
  const localidade = c[I.localidade]?.trim()?.toUpperCase() || titularToLocalidade[titular.toUpperCase()] || 'NÃO INFORMADO';

  const qtyStr = c[I.quantidade]?.trim() || '0';
  const quantidade = parseInt(qtyStr) || 0;

  const pesoStr = c[I.peso]?.trim() || '0';
  const peso = parseFloat(pesoStr) || 0;

  // Limpar e converter valores
  const parseCurrency = (valStr) => {
    if (!valStr) return 0;
    const clean = valStr.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const valorLiquido = parseCurrency(c[I.valorLiquido]);

  allRecords.push({
    id: `${ano}-${mes}-${c[I.etiqueta]?.trim() || Math.random().toString(36).substr(2, 9)}`,
    modulo: 'correios',
    titular: toTitle(titular),
    cidade: toTitle(localidade),
    unidadePostagem: toTitle(c[I.unidadePostagem]?.trim() || 'AC Central'),
    dataPostagem: dataRaw,
    peso,
    quantidade,
    valorLiquido,
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
    porMesAno[key] = { ano: r.ano, mes: r.mes, quantidade: 0, peso: 0, valorTotal: 0, registros: 0 };
  }
  porMesAno[key].quantidade += r.quantidade;
  porMesAno[key].peso       += r.peso;
  porMesAno[key].valorTotal += r.valorLiquido;
  porMesAno[key].registros  += 1;
}

const serieMensal = Object.values(porMesAno)
  .sort((a, b) => (a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes))
  .map(s => ({
    ...s,
    peso: +s.peso.toFixed(2),
    valorTotal: +s.valorTotal.toFixed(2)
  }));

// Filtrar registros de 2025 e 2026 para exibição em tabelas
const ANOS_TABELA = [2025, 2026];
const registros = allRecords
  .filter(r => ANOS_TABELA.includes(r.ano))
  .map(r => ({
    ...r,
    valorLiquido: +r.valorLiquido.toFixed(2)
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

console.log(`✓ ${registros.length} registros de correios processados (2025-2026).`);
console.log(`  Série mensal: ${serieMensal.length} meses.`);
console.log(`  Salvo em: ${OUT_PATH}`);
