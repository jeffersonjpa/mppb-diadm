import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'ai-cache', 'correios');

interface CorreiosAiPayload {
  periodoLabel: string;
  kpis: {
    valorTotal: number;
    quantidade: number;
    custoMedio: number;
    pesoTotal: number;
    varValor: number | null;
    varQuantidade: number | null;
    varCustoMedio: number | null;
    varPeso: number | null;
  };
  topCidades: { label: string; value: number }[];
}

function buildCacheKey(payload: CorreiosAiPayload): string {
  const normalized = JSON.stringify({
    _v: 2,
    p: payload.periodoLabel,
    v: Math.round(payload.kpis.valorTotal),
    q: payload.kpis.quantidade,
    tc: payload.topCidades.slice(0, 5).map(c => `${c.label}:${Math.round(c.value)}`).join(','),
  });
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function buildPrompt(payload: CorreiosAiPayload): string {
  const { kpis, periodoLabel, topCidades } = payload;
  const varValorStr = kpis.varValor != null
    ? `${kpis.varValor > 0 ? '+' : ''}${kpis.varValor.toFixed(1)}%`
    : 'sem comparativo';
  const varQtyStr = kpis.varQuantidade != null
    ? `${kpis.varQuantidade > 0 ? '+' : ''}${kpis.varQuantidade.toFixed(1)}%`
    : 'sem comparativo';
  const varCustoStr = kpis.varCustoMedio != null
    ? `${kpis.varCustoMedio > 0 ? '+' : ''}${kpis.varCustoMedio.toFixed(1)}%`
    : 'sem comparativo';
  const topStr = topCidades.slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.label}: R$ ${c.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`)
    .join('; ');

  return `
Você é um analista de dados do Ministério Público da Paraíba (MPPB) especializado em gestão de custos postais e logística em órgãos públicos.
Escreva em português, em linguagem objetiva e técnica, sem bullet points e sem mencionar "análise" ou "relatório".
Use **negrito** (markdown) para destacar valores, variações expressivas e termos-chave.

Estruture a resposta em exatamente três parágrafos curtos:
1. **Situação atual** (2 frases): resuma custo total, volume de objetos postados, custo médio por objeto e as cidades de maior gasto.
2. **Tendência e projeção** (1-2 frases): com base nas variações de custo e volume, indique a tendência; estime o impacto provável no próximo mês e sinalize se o aumento é causado por volume ou por elevação tarifária.
3. **Recomendações** (2 frases): sugira ações concretas para reduzir despesas postais em um órgão público — ex.: digitalização de processos e notificações, uso de modalidades mais econômicas dos Correios, análise de contratos, centralização de postagens.

Dados do período ${periodoLabel}:
Custo total: R$ ${kpis.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (variação vs mês anterior: ${varValorStr})
Objetos postados: ${kpis.quantidade.toLocaleString('pt-BR')} (variação: ${varQtyStr})
Custo médio por objeto: R$ ${kpis.custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (variação: ${varCustoStr})
Peso total: ${kpis.pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg
Top cidades por custo: ${topStr}
`.trim();
}

export async function POST(req: NextRequest) {
  const payload: CorreiosAiPayload = await req.json();

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
