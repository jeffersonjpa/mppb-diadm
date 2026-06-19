import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const CACHE_DIR     = path.join(process.cwd(), 'ai-cache', 'terceirizados');
const TMP_CACHE_DIR = path.join(os.tmpdir(), 'ai-cache', 'terceirizados');

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
    _v: 3,
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
  const topStr = topCidades.slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.label}: R$ ${c.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`)
    .join('; ');

  return `
Você é um analista de dados do Ministério Público da Paraíba (MPPB) analisando contratos de terceirização de mão de obra.
Gere um parágrafo curto (2-3 frases) em português, em linguagem objetiva e técnica, resumindo os dados a seguir.
Não use bullet points. Não mencione "análise" ou "relatório". Comece diretamente pelos números e contexto.
Use **negrito** (markdown) para destacar valores e pontos de atenção.

Período: ${periodoLabel}
Custo total com terceirizados: R$ ${kpis.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (variação vs mês anterior: ${varTotalStr})
Quantidade de contratos/registros: ${kpis.quantidade.toLocaleString('pt-BR')} (variação: ${varQtyStr})
Custo médio por contrato: R$ ${kpis.valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Top cargos por custo total: ${topStr}
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
    const payload: TerceirizadosAiPayload = await req.json();
    const key = buildCacheKey(payload);

    const cached = readCache(key);
    if (cached) return NextResponse.json({ text: cached, cached: true });

    const client = new OpenAI({ apiKey: process.env.GPT_API_KEY });
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
    console.error('[ai/terceirizados]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
