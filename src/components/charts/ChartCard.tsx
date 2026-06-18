interface ChartCardProps {
  title:      string;
  subtitle?:  string;
  actions?:   React.ReactNode;
  children:   React.ReactNode;
  minHeight?: number;
}

export default function ChartCard({ title, subtitle, actions, children, minHeight = 320 }: ChartCardProps) {
  return (
    <div className="bg-mp-surface rounded-mp-card shadow-mp-card p-5 flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3
            className="text-[14px] font-extrabold text-mp-ink"
            style={{ letterSpacing: '-0.2px' }}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-mp-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Conteúdo do gráfico */}
      <div className="flex-1" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}
