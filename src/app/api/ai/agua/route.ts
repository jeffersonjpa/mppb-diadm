import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'ai-cache', 'agua');

interface AguaAiPayload {
  periodoLabel: string;
  kpis: {
    valorTotal: number;
    consumo: number;
    precoMedio: number;
    matriculas: number;
    varValor: number | null;
    varConsumo: number | null;
    varPreco: number | null;
  };
  topCidades: { label: string; value: number }[];
}

function buildCacheKey(payload: AguaAiPayload): string {
  const normalized = JSON.stringify({
    p: payload.periodoLabel,
    v: payload.kpis.valorTotal,
    c: payload.kpis.consumo,
    m: payload.kpis.matriculas,
    tc: payload.topCidades.slice(0, 5).map(c => `${c.label}:${c.value}`).join(','),
  });
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function buildPrompt(payload: AguaAiPayload): string {
  const { kpis, periodoLabel, topCidades } = payload;

  const varValorStr  = kpis.varValor  != null ? `${kpis.varValor > 0 ? '+' : ''}${kpis.varValor.toFixed(1)}%` : 'sem comparativo';
  const varConsumoStr = kpis.varConsumo != null ? `${kpis.varConsumo > 0 ? '+' : ''}${kpis.varConsumo.toFixed(1)}%` : 'sem comparativo';
  const topStr = topCidades.slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.label}: R$ ${c.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`)
    .join('; ');

  return `
Você é um analista de dados do Ministério Público da Paraíba (MPPB) analisando gastos com água e saneamento.
Gere um parágrafo curto (2-3 frases) em português, em linguagem objetiva e técnica, resumindo os dados a seguir.
Não use bullet points. Não mencione "análise" ou "relatório". Comece diretamente pelos números e contexto.

Período: ${periodoLabel}
Custo total: R$ ${kpis.valorTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} (variação vs mês anterior: ${varValorStr})
Consumo total: ${kpis.consumo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³ (variação: ${varConsumoStr})
Preço médio: R$ ${kpis.precoMedio.toFixed(2)}/m³
Matrículas ativas: ${kpis.matriculas}
Top cidades por custo: ${topStr}
`.trim();
}

export async function POST(req: NextRequest) {
  const payload: AguaAiPayload = await req.json();

  const key = buildCacheKey(payload);
  const cacheFile = path.join(CACHE_DIR, `${key}.md`);

  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf-8');
    return NextResponse.json({ text: cached, cached: true });
  }

  const client = new OpenAI({ apiKey: process.env.GPT_API_KEY });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(payload) }],
    max_tokens: 200,
    temperature: 0.4,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? '';

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, text, 'utf-8');

  return NextResponse.json({ text, cached: false });
}
