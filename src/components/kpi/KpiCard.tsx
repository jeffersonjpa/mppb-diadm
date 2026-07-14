import { formatPercent } from '@/lib/format';

interface KpiCardProps {
  label:           string;
  value:           string;
  icon:            React.ReactNode;
  iconBg?:         string;
  iconColor?:      string;
  delta?:          number | null;
  deltaAbsolute?:  string | null;
  subtitle?:       string;
}

export default function KpiCard({
  label,
  value,
  icon,
  iconBg    = 'bg-mp-tint',
  iconColor = 'text-mp-primary',
  delta,
  deltaAbsolute,
  subtitle,
}: KpiCardProps) {
  const hasDelta = delta != null;
  const isPositive = hasDelta && delta >= 0;

  return (
    <div className="bg-mp-surface rounded-mp-card shadow-mp-card p-5 flex flex-col gap-3">
      {/* Cabeçalho: ícone + label */}
      <div className="flex items-center gap-2.5">
        <span className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-mp-muted">
          {label}
        </span>
      </div>

      {/* Valor + delta */}
      <div className="flex items-end gap-2.5 flex-wrap">
        <span
          className="text-[28px] font-extrabold text-mp-ink leading-none tabular-nums"
          style={{ letterSpacing: '-0.6px' }}
        >
          {value}
        </span>

        {hasDelta && (
          <span className="relative inline-flex group">
            <span
              tabIndex={0}
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[12px] font-bold cursor-default
                ${isPositive
                  ? 'bg-mp-success-bg text-mp-success'
                  : 'bg-mp-danger-bg  text-mp-danger'}
              `}
            >
              {isPositive ? '▲' : '▼'}
              {formatPercent(delta)}
            </span>

            {deltaAbsolute && (
              <span
                role="tooltip"
                className="
                  pointer-events-none absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2
                  whitespace-nowrap rounded-[6px] bg-mp-ink px-2 py-1 text-[11px] font-semibold text-white
                  opacity-0 scale-95 transition-all duration-100
                  group-hover:opacity-100 group-hover:scale-100
                  group-focus-within:opacity-100 group-focus-within:scale-100
                  z-10
                "
              >
                {deltaAbsolute}
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-mp-ink" />
              </span>
            )}
          </span>
        )}
      </div>

      {/* Subtítulo */}
      {subtitle && (
        <p className="text-[11px] text-mp-faint leading-none">{subtitle}</p>
      )}
    </div>
  );
}
