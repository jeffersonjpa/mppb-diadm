import Link from 'next/link';
import AiInsight from '@/components/ai/AiInsight';
import {
  Users, Zap, Droplets, Mail, Phone,
  ArrowRight, TrendingUp,
} from 'lucide-react';
import { formatBRL, formatMonthYear } from '@/lib/format';
import { getSerieMensal as getEnergiaSerie } from '@/lib/api/energia';
import { getSerieMensal as getTerceirizadosSerie } from '@/lib/api/terceirizados';
import { getSerieMensal as getAguaSerie } from '@/lib/api/agua';
import { getSerieMensal as getCorreiosSerie } from '@/lib/api/correios';

/* ── Dados do mês mais recente da Energia (Fev/2026) ───────────── */
function getEnergiaResumo() {
  const serie = getEnergiaSerie([2026]);
  const ultimo = serie.at(-1);
  const penultimo = serie.at(-2);
  if (!ultimo) return null;
  const variacao = penultimo && penultimo.valorTotal > 0
    ? ((ultimo.valorTotal - penultimo.valorTotal) / penultimo.valorTotal * 100)
    : null;
  return { valor: ultimo.valorTotal, variacao, mes: ultimo.mes, ano: ultimo.ano };
}

/* ── Dados do mês mais recente dos Terceirizados (Fev/2026) ────── */
function getTerceirizadosResumo() {
  const serie = getTerceirizadosSerie([2026]);
  const ultimo = serie.at(-1);
  const penultimo = serie.at(-2);
  if (!ultimo) return null;
  const variacao = penultimo && penultimo.valorTotal > 0
    ? ((ultimo.valorTotal - penultimo.valorTotal) / penultimo.valorTotal * 100)
    : null;
  return { valor: ultimo.valorTotal, variacao, totalContratos: ultimo.registros, mes: ultimo.mes, ano: ultimo.ano };
}

/* ── Dados do mês mais recente de Água (Abr/2026) ──────── */
function getAguaResumo() {
  const serie = getAguaSerie([2026]);
  const ultimo = serie.at(-1);
  const penultimo = serie.at(-2);
  if (!ultimo) return null;
  const variacao = penultimo && penultimo.valorTotal > 0
    ? ((ultimo.valorTotal - penultimo.valorTotal) / penultimo.valorTotal * 100)
    : null;
  return { valor: ultimo.valorTotal, variacao, mes: ultimo.mes, ano: ultimo.ano };
}

/* ── Dados do mês mais recente dos Correios (Fev/2026) ──────────── */
function getCorreiosResumo() {
  const serie = getCorreiosSerie([2026]);
  const ultimo = serie.at(-1);
  const penultimo = serie.at(-2);
  if (!ultimo) return null;
  const variacao = penultimo && penultimo.valorTotal > 0
    ? ((ultimo.valorTotal - penultimo.valorTotal) / penultimo.valorTotal * 100)
    : null;
  return { valor: ultimo.valorTotal, variacao, totalObjetos: ultimo.quantidade, mes: ultimo.mes, ano: ultimo.ano };
}

/* ── Definição dos módulos ─────────────────────────────────────── */
interface ModuleCard {
  id:       string;
  href:     string;
  label:    string;
  icon:     React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  ativo:    boolean;
  valor?:   number;
  variacao?: number | null;
  subtitulo?: string;
}

export default function VisaoGeralPage() {
  const energiaResumo = getEnergiaResumo();
  const terceirizadosResumo = getTerceirizadosResumo();
  const aguaResumo = getAguaResumo();
  const correiosResumo = getCorreiosResumo();

  const modulos: ModuleCard[] = [
    {
      id: 'energia', href: '/energia', label: 'Energia Elétrica',
      icon: Zap, ativo: true,
      valor:    energiaResumo?.valor,
      variacao: energiaResumo?.variacao,
      subtitulo: 'Fev/2026 · ENERGISA',
    },
    {
      id: 'terceirizados', href: '/terceirizados', label: 'Terceirizados',
      icon: Users, ativo: true,
      valor:    terceirizadosResumo?.valor,
      variacao: terceirizadosResumo?.variacao,
      subtitulo: `Fev/2026 · ${terceirizadosResumo?.totalContratos || 0} contratos`,
    },
    {
      id: 'agua', href: '/agua', label: 'Água',
      icon: Droplets, ativo: true,
      valor:    aguaResumo?.valor,
      variacao: aguaResumo?.variacao,
      subtitulo: aguaResumo ? `${formatMonthYear(aguaResumo.mes, aguaResumo.ano)} · CAGEPA` : 'Em integração',
    },
    {
      id: 'correios', href: '/correios', label: 'Correios',
      icon: Mail, ativo: true,
      valor:    correiosResumo?.valor,
      variacao: correiosResumo?.variacao,
      subtitulo: correiosResumo ? `${formatMonthYear(correiosResumo.mes, correiosResumo.ano)} · ${correiosResumo.totalObjetos} objetos` : 'Em integração',
    },
    {
      id: 'telefonia', href: '/telefonia', label: 'Telefonia',
      icon: Phone, ativo: false,
      subtitulo: 'Em integração',
    },
  ];

  const totalMonitorado = modulos
    .filter(m => m.ativo && m.valor != null)
    .reduce((s, m) => s + (m.valor ?? 0), 0);

  const modulosAtivos = modulos.filter(m => m.ativo).length;

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div
        className="rounded-mp-hero px-8 py-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D5288 0%, #16406B 100%)' }}
      >
        {/* Decoração de fundo */}
        <div
          className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 70%)',
          }}
        />

        <p className="text-[12px] font-bold uppercase tracking-[1px] text-white/60 mb-3">
          Ministério Público da Paraíba
        </p>

        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-[13px] text-white/70 mb-1">Total monitorado / mês</p>
            <p
              className="text-[32px] font-extrabold leading-none tabular-nums"
              style={{ letterSpacing: '-0.8px' }}
            >
              {formatBRL(totalMonitorado)}
            </p>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-[0.5px] mb-0.5">Módulos ativos</p>
              <p className="text-[22px] font-extrabold text-white">{modulosAtivos}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-[0.5px] mb-0.5">Total módulos</p>
              <p className="text-[22px] font-extrabold text-white">{modulos.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-white/50" strokeWidth={2} />
          <p className="text-[12px] text-white/60">
            Referência: Fevereiro - Abril de 2026
          </p>
        </div>
      </div>

      {/* ── Análise IA ───────────────────────────────────────────── */}
      <AiInsight
        endpoint="/api/ai/visao-geral"
        payload={{
          periodoLabel: 'Fevereiro – Abril de 2026',
          kpis: {
            totalMonitorado,
            modulosAtivos,
            energia:       energiaResumo       ? { valor: energiaResumo.valor,       variacao: energiaResumo.variacao       } : null,
            terceirizados: terceirizadosResumo ? { valor: terceirizadosResumo.valor, variacao: terceirizadosResumo.variacao } : null,
            agua:          aguaResumo          ? { valor: aguaResumo.valor,          variacao: aguaResumo.variacao          } : null,
            correios:      correiosResumo      ? { valor: correiosResumo.valor,      variacao: correiosResumo.variacao      } : null,
          },
        }}
      />

      {/* ── Grid de módulos ──────────────────────────────────────── */}
      <div>
        <h2 className="text-[13px] font-bold text-mp-muted uppercase tracking-[0.5px] mb-3">
          Fontes de Despesa
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {modulos.map(mod => (
            <ModuleCardItem key={mod.id} {...mod} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Card de módulo ─────────────────────────────────────────────── */
function ModuleCardItem({
  href, label, icon: Icon, ativo, valor, variacao, subtitulo,
}: ModuleCard) {
  const isPositive = (variacao ?? 0) >= 0;

  const inner = (
    <div
      className={`
        bg-mp-surface rounded-mp-card shadow-mp-card p-5 h-full
        flex flex-col gap-3
        ${ativo ? 'hover:shadow-md transition-shadow cursor-pointer' : 'opacity-75'}
      `}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`
            w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0
            ${ativo ? 'bg-mp-tint text-mp-primary' : 'bg-mp-head text-mp-ghost'}
          `}>
            <Icon size={18} strokeWidth={1.8} />
          </span>
          <span className="text-[13px] font-bold text-mp-ink">{label}</span>
        </div>

        {ativo ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.4px] px-2 py-0.5 rounded bg-mp-success-bg text-mp-success">
            Ativo
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-[0.4px] px-2 py-0.5 rounded bg-mp-warning-bg text-mp-warning">
            Em breve
          </span>
        )}
      </div>

      {/* Valor ou placeholder */}
      {ativo && valor != null ? (
        <>
          <div className="flex items-end gap-2 flex-wrap">
            <span
              className="text-[24px] font-extrabold text-mp-ink tabular-nums leading-none"
              style={{ letterSpacing: '-0.5px' }}
            >
              {formatBRL(valor)}
            </span>
            {variacao != null && (
              <span className={`
                text-[11px] font-bold px-1.5 py-0.5 rounded
                ${isPositive ? 'bg-mp-danger-bg text-mp-danger' : 'bg-mp-success-bg text-mp-success'}
              `}>
                {isPositive ? '▲' : '▼'} {Math.abs(variacao).toFixed(1)}%
              </span>
            )}
          </div>

          {/* Subtítulo + CTA */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <p className="text-[11px] text-mp-muted">{subtitulo}</p>
            <ArrowRight size={14} className="text-mp-primary" strokeWidth={2} />
          </div>
        </>
      ) : (
        <p className="text-[12px] text-mp-muted mt-1">{subtitulo}</p>
      )}
    </div>
  );

  return ativo ? (
    <Link href={href} className="block h-full">{inner}</Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}
