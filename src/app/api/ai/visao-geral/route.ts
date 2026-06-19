import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'ai-cache', 'visao-geral');

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
    _v: 2,
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
    kpis.agua          && `Água e Esgoto: ${fmtBRL(kpis.agua.valor)} (${fmtVar(kpis.agua.variacao)})`,
    kpis.correios      && `Correios: ${fmtBRL(kpis.correios.valor)} (${fmtVar(kpis.correios.variacao)})`,
  ].filter(Boolean).join('\n- ');

  return `
Você é um analista de dados do Ministério Público da Paraíba (MPPB) especializado em gestão estratégica de despesas administrativas públicas.
Escreva em português, em linguagem objetiva e técnica, sem bullet points e sem mencionar "análise" ou "relatório".
Use **negrito** (markdown) para destacar valores totais, variações expressivas e termos-chave.

Estruture a resposta em exatamente três parágrafos curtos:
1. **Situação atual** (2 frases): resuma o total monitorado e destaque os módulos com maiores despesas e variações mais expressivas.
2. **Tendência e projeção** (1-2 frases): com base nas variações percentuais dos módulos, projete o comportamento do gasto consolidado no próximo mês; identifique quais módulos representam maior risco de escalada de custos.
3. **Recomendações** (2 frases): sugira prioridades de ação para a gestão administrativa — ex.: qual módulo merece atenção imediata, possíveis revisões contratuais, ações de eficiência, ou monitoramento de alertas.

Período de referência: ${periodoLabel}
Total consolidado monitorado: ${fmtBRL(kpis.totalMonitorado)}
Módulos ativos: ${kpis.modulosAtivos}

Despesas por módulo (variação vs mês anterior):
- ${modulos}
`.trim();
}

export async function POST(req: NextRequest) {
  const payload: VisaoGeralAiPayload = await req.json();

  const key = buildCacheKey(payload);
  const cacheFile = path.join(CACHE_DIR, `${key}.md`);

  if (fs.existsSync(cacheFile)) {
    return NextResponse.json({ text: fs.readFileSync(cacheFile, 'utf-8'), cached: true });
  }

  const client = new OpenAI({ apiKey: process.env.GPT_API_KEY });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(payload) }],
    max_tokens: 450,
    temperature: 0.4,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? '';

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, text, 'utf-8');

  return NextResponse.json({ text, cached: false });
}
