interface EmptyStateProps {
  module: string;
}

export default function EmptyState({ module }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-mp-warning-bg flex items-center justify-center mb-4">
        <span className="text-mp-warning text-xl">⏳</span>
      </div>
      <h2 className="text-[15px] font-bold text-mp-ink mb-1">{module}</h2>
      <p className="text-[13px] text-mp-muted">
        Este módulo está em integração e estará disponível em breve.
      </p>
      <span className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.4px] px-2.5 py-1 rounded bg-mp-warning-bg text-mp-warning">
        Em integração
      </span>
    </div>
  );
}
