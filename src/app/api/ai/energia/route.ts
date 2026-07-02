import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const CACHE_DIR     = path.join(process.cwd(), 'ai-cache', 'energia');
const TMP_CACHE_DIR = path.join(os.tmpdir(), 'ai-cache', 'energia');

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
    _v: 3,
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
Você é um analista de dados do Ministério Público da Paraíba (MPPB) analisando gastos com energia elétrica.
Gere um parágrafo curto (2-3 frases) em português, em linguagem objetiva e técnica, resumindo os dados a seguir.
Não use bullet points. Não mencione "análise" ou "relatório". Comece diretamente pelos números e contexto.
Use **negrito** (markdown) para destacar valores e pontos de atenção.

Período: ${periodoLabel}
Custo total: R$ ${kpis.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (variação vs mês anterior: ${varValorStr})
Consumo total: ${kpis.kwh.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh (variação: ${varKwhStr})
Custo médio: R$ ${kpis.custoPorKwh.toFixed(4)}/kWh
Unidades consumidoras: ${kpis.ucs}
Top cidades por custo: ${topStr}
`.trim();
}

function readCache(key: string): string | null {
  for (const dir of [CACHE_DIR, TMP_CACHE_DIR]) {
    try {
      const file = path.join(dir, `${key}.md`);
      if (fs.existsSync(file)) return fs.readFileSync(file, 'utf-8');
    } catch { /* ignore */ }
  }
  return null;
}

function writeCache(key: string, text: string): void {
  for (const dir of [CACHE_DIR, TMP_CACHE_DIR]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${key}.md`), text, 'utf-8');
      return;
    } catch { /* try next */ }
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload: EnergiaAiPayload = await req.json();
    const key = buildCacheKey(payload);

    const cached = readCache(key);
    if (cached) return NextResponse.json({ text: cached, cached: true });

    if (process.env.AI_ENABLED !== 'true') return NextResponse.json({ disabled: true });

    const apiKey = process.env.GPT_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GPT_API_KEY not set" }, { status: 500 });
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(payload) }],
      max_tokens: 180,
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    writeCache(key, text);
    return NextResponse.json({ text, cached: false });
  } catch (err) {
    console.error('[ai/energia]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
