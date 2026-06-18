import { Filter, Trash2 } from 'lucide-react';

interface FilterBarProps {
  children:    React.ReactNode;
  activeCount: number;
  onClear:     () => void;
}

export default function FilterBar({ children, activeCount, onClear }: FilterBarProps) {
  return (
    <div className="bg-mp-surface rounded-mp-card shadow-mp-card p-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={15} className="text-mp-muted" strokeWidth={2} />
        <span className="text-[13px] font-bold text-mp-text">Filtros</span>
        {activeCount > 0 && (
          <span className="text-[11px] font-bold text-mp-muted">
            · {activeCount} ativo{activeCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid de filtros */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {children}
      </div>

      {/* Rodapé com botão limpar */}
      {activeCount > 0 && (
        <>
          <div className="border-t border-mp-border mt-4 pt-3 flex justify-end">
            <button
              onClick={onClear}
              className="
                flex items-center gap-1.5 text-[12px] font-bold text-mp-danger
                hover:text-[#9D3232] transition-colors
              "
            >
              <Trash2 size={13} strokeWidth={2.5} />
              Limpar Filtros
            </button>
          </div>
        </>
      )}
    </div>
  );
}
