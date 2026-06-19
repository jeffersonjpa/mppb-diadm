import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'ai-cache', 'terceirizados');

interface TerceirizadosAiPayload {
  periodoLabel: string;
  kpis: {
    valorTotal: number;
    valorMedio: number;
    quantidade: number;
    varTotal: number | null;
    varMedio: number | null;
    varQuantidade: number | null;
  };
  topCidades: { label: string; value: number }[];
}

function buildCacheKey(payload: TerceirizadosAiPayload): string {
  const normalized = JSON.stringify({
    _v: 2,
    p: payload.periodoLabel,
    v: Math.round(payload.kpis.valorTotal),
    q: payload.kpis.quantidade,
    tc: payload.topCidades.slice(0, 5).map(c => `${c.label}:${Math.round(c.value)}`).join(','),
  });
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function buildPrompt(payload: TerceirizadosAiPayload): string {
  const { kpis, periodoLabel, topCidades } = payload;
  const varTotalStr = kpis.varTotal != null
    ? `${kpis.varTotal > 0 ? '+' : ''}${kpis.varTotal.toFixed(1)}%`
    : 'sem comparativo';
  const varQtyStr = kpis.varQuantidade != null
    ? `${kpis.varQuantidade > 0 ? '+' : ''}${kpis.varQuantidade.toFixed(1)}%`
    : 'sem comparativo';
  const varMedioStr = kpis.varMedio != null
    ? `${kpis.varMedio > 0 ? '+' : ''}${kpis.varMedio.toFixed(1)}%`
    : 'sem comparativo';
  const topStr = topCidades.slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.label}: R$ ${c.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`)
    .join('; ');

  return `
Você é um analista de dados do Ministério Público da Paraíba (MPPB) especializado em gestão de contratos de terceirização de mão de obra no setor público.
Escreva em português, em linguagem objetiva e técnica, sem bullet points e sem mencionar "análise" ou "relatório".
Use **negrito** (markdown) para destacar valores, variações expressivas e termos-chave.

Estruture a resposta em exatamente três parágrafos curtos:
1. **Situação atual** (2 frases): resuma custo total, quantidade de contratos, custo médio por contrato e os cargos de maior impacto financeiro.
2. **Tendência e projeção** (1-2 frases): com base nas variações observadas, indique a tendência; estime o impacto no próximo mês e sinalize se a variação decorre de aumento no número de contratos ou de reajuste de valores.
3. **Recomendações** (2 frases): sugira ações concretas para otimizar despesas com terceirizados em um órgão público — ex.: revisão de cargos com sobreposição de funções, renegociação de contratos, licitações competitivas, avaliação de internalização de serviços.

Dados do período ${periodoLabel}:
Custo total: R$ ${kpis.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (variação vs mês anterior: ${varTotalStr})
Quantidade de contratos/registros: ${kpis.quantidade.toLocaleString('pt-BR')} (variação: ${varQtyStr})
Custo médio por contrato: R$ ${kpis.valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (variação: ${varMedioStr})
Top cargos por custo total: ${topStr}
`.trim();
}

export async function POST(req: NextRequest) {
  const payload: TerceirizadosAiPayload = await req.json();

  const key = buildCacheKey(payload);
  const cacheFile = path.join(CACHE_DIR, `${key}.md`);

  if (fs.existsSync(cacheFile)) {
    return NextResponse.json({ text: fs.readFileSync(cacheFile, 'utf-8'), cached: true });
  }

  const client = new OpenAI({ apiKey: process.env.GPT_API_KEY });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(payload) }],
    max_tokens: 420,
    temperature: 0.4,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? '';

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, text, 'utf-8');

  return NextResponse.json({ text, cached: false });
}
