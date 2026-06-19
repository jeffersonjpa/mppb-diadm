import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'ai-cache', 'energia');

interface EnergiaAiPayload {
  periodoLabel: string;
  kpis: {
    valorTotal: number;
    kwh: number;
    custoPorKwh: number;
    ucs: number;
    varValor: number | null;
    varKwh: number | null;
    varCusto: number | null;
  };
  topCidades: { label: string; value: number }[];
}

function buildCacheKey(payload: EnergiaAiPayload): string {
  const normalized = JSON.stringify({
    _v: 2,
    p: payload.periodoLabel,
    v: Math.round(payload.kpis.valorTotal),
    k: Math.round(payload.kpis.kwh),
    u: payload.kpis.ucs,
    tc: payload.topCidades.slice(0, 5).map(c => `${c.label}:${Math.round(c.value)}`).join(','),
  });
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function buildPrompt(payload: EnergiaAiPayload): string {
  const { kpis, periodoLabel, topCidades } = payload;
  const varValorStr = kpis.varValor != null ? `${kpis.varValor > 0 ? '+' : ''}${kpis.varValor.toFixed(1)}%` : 'sem comparativo';
  const varKwhStr   = kpis.varKwh   != null ? `${kpis.varKwh   > 0 ? '+' : ''}${kpis.varKwh.toFixed(1)}%`   : 'sem comparativo';
  const topStr = topCidades.slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.label}: R$ ${c.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`)
    .join('; ');

  return `
Você é um analista de dados do Ministério Público da Paraíba (MPPB) especializado em eficiência energética e gestão de despesas.
Escreva em português, em linguagem objetiva e técnica, sem bullet points e sem mencionar "análise" ou "relatório".
Use **negrito** (markdown) para destacar valores, variações expressivas e termos-chave.

Estruture a resposta em exatamente três parágrafos curtos:
1. **Situação atual** (2 frases): resuma os principais números do período, destacando o custo total, o consumo em kWh, o custo médio e as cidades de maior gasto.
2. **Tendência e projeção** (1-2 frases): com base na variação percentual observada, indique a tendência (alta, queda ou estabilidade) e estime o impacto provável no próximo mês caso o padrão se mantenha.
3. **Recomendações** (2 frases): sugira ações concretas e aplicáveis a um órgão público para mitigar gastos excessivos ou aproveitar a tendência favorável — ex.: auditoria de UCs, negociação tarifária, programa de eficiência energética, revisão de contratos.

Dados do período ${periodoLabel}:
Custo total: R$ ${kpis.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (variação vs mês anterior: ${varValorStr})
Consumo total: ${kpis.kwh.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh (variação: ${varKwhStr})
Custo médio: R$ ${kpis.custoPorKwh.toFixed(4)}/kWh
Unidades consumidoras: ${kpis.ucs}
Top cidades por custo: ${topStr}
`.trim();
}

export async function POST(req: NextRequest) {
  const payload: EnergiaAiPayload = await req.json();

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
