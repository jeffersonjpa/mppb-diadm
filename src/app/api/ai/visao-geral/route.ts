import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const CACHE_DIR     = path.join(process.cwd(), 'ai-cache', 'visao-geral');
const TMP_CACHE_DIR = path.join(os.tmpdir(), 'ai-cache', 'visao-geral');

interface ModuloResumo {
  valor: number;
  variacao: number | null;
}

interface VisaoGeralAiPayload {
  periodoLabel: string;
  kpis: {
    totalMonitorado: number;
    modulosAtivos: number;
    energia: ModuloResumo | null;
    terceirizados: ModuloResumo | null;
    agua: ModuloResumo | null;
    correios: ModuloResumo | null;
  };
}

function buildCacheKey(payload: VisaoGeralAiPayload): string {
  const { kpis } = payload;
  const normalized = JSON.stringify({
    _v: 3,
    p: payload.periodoLabel,
    t: Math.round(kpis.totalMonitorado),
    e: kpis.energia ? Math.round(kpis.energia.valor) : null,
    te: kpis.terceirizados ? Math.round(kpis.terceirizados.valor) : null,
    a: kpis.agua ? Math.round(kpis.agua.valor) : null,
    c: kpis.correios ? Math.round(kpis.correios.valor) : null,
  });
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function fmtVar(v: number | null) {
  if (v == null) return 'sem comparativo';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function fmtBRL(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildPrompt(payload: VisaoGeralAiPayload): string {
  const { kpis, periodoLabel } = payload;

  const modulos = [
    kpis.energia       && `Energia Elétrica: ${fmtBRL(kpis.energia.valor)} (${fmtVar(kpis.energia.variacao)})`,
    kpis.terceirizados && `Terceirizados: ${fmtBRL(kpis.terceirizados.valor)} (${fmtVar(kpis.terceirizados.variacao)})`,
    kpis.agua          && `Água: ${fmtBRL(kpis.agua.valor)} (${fmtVar(kpis.agua.variacao)})`,
    kpis.correios      && `Correios: ${fmtBRL(kpis.correios.valor)} (${fmtVar(kpis.correios.variacao)})`,
  ].filter(Boolean).join('\n- ');

  return `
Você é um analista de dados do Ministério Público da Paraíba (MPPB) analisando o painel consolidado de despesas administrativas.
Gere um parágrafo curto (2-3 frases) em português, em linguagem objetiva e técnica, com visão geral dos módulos monitorados.
Não use bullet points. Não mencione "análise" ou "relatório". Comece diretamente pelos números.
Use **negrito** (markdown) para destacar valores totais, variações expressivas e pontos de atenção.

Período de referência: ${periodoLabel}
Total consolidado monitorado: ${fmtBRL(kpis.totalMonitorado)}
Módulos ativos: ${kpis.modulosAtivos}

Despesas por módulo (variação vs mês anterior):
- ${modulos}
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
    const payload: VisaoGeralAiPayload = await req.json();
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
      max_tokens: 200,
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    writeCache(key, text);
    return NextResponse.json({ text, cached: false });
  } catch (err) {
    console.error('[ai/visao-geral]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
