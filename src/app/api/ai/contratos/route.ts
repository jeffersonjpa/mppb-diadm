import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const CACHE_DIR     = path.join(process.cwd(), 'ai-cache', 'contratos');
const TMP_CACHE_DIR = path.join(os.tmpdir(), 'ai-cache', 'contratos');

interface ContratosAiPayload {
  periodoLabel: string;
  kpis: {
    total:       number;
    ativos:      number;
    concluidos:  number;
    rescindidos: number;
    valorAtivos: number;
    vencendo30:  number;
    vencendo90:  number;
    expirados:   number;
  };
  topModalidades: { label: string; value: number }[];
}

function buildCacheKey(payload: ContratosAiPayload): string {
  const normalized = JSON.stringify({
    _v: 1,
    p:  payload.periodoLabel,
    t:  payload.kpis.total,
    a:  payload.kpis.ativos,
    v:  Math.round(payload.kpis.valorAtivos),
    v30: payload.kpis.vencendo30,
    v90: payload.kpis.vencendo90,
    ex: payload.kpis.expirados,
    m:  payload.topModalidades.slice(0, 4).map(m => `${m.label}:${m.value}`).join(','),
  });
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function buildPrompt(payload: ContratosAiPayload): string {
  const { kpis, periodoLabel, topModalidades } = payload;
  const modalStr = topModalidades
    .map(m => `${m.label}: ${m.value} contrato${m.value !== 1 ? 's' : ''}`)
    .join('; ');
  const valorStr = kpis.valorAtivos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return `
Você é um analista de contratos do Ministério Público da Paraíba (MPPB).
Gere um parágrafo curto (2-4 frases) em português, em linguagem objetiva e técnica, resumindo o painel de contratos.
Não use bullet points. Não mencione "análise" ou "relatório". Comece diretamente pelos números.
Use **negrito** (markdown) para destacar valores críticos e pontos de atenção.
Destaque especialmente alertas de vencimento e contratos expirados com status ativo.

Filtro aplicado: ${periodoLabel}
Total de contratos: ${kpis.total} (${kpis.ativos} ativos, ${kpis.concluidos} concluídos, ${kpis.rescindidos} rescindidos)
Valor total comprometido (ativos): ${valorStr}
Contratos ativos vencendo em 90 dias: ${kpis.vencendo90} (${kpis.vencendo30} vencem em até 30 dias)
Contratos com vigência expirada e situação "Ativo": ${kpis.expirados}
Distribuição por modalidade: ${modalStr}
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
    const payload: ContratosAiPayload = await req.json();
    const key = buildCacheKey(payload);

    const cached = readCache(key);
    if (cached) return NextResponse.json({ text: cached, cached: true });

    if (process.env.AI_ENABLED !== 'true') return NextResponse.json({ disabled: true });

    const apiKey = process.env.GPT_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GPT_API_KEY not set' }, { status: 500 });

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [{ role: 'user', content: buildPrompt(payload) }],
      max_tokens:  220,
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    writeCache(key, text);
    return NextResponse.json({ text, cached: false });
  } catch (err) {
    console.error('[ai/contratos]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
