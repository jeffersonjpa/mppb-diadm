interface Option {
  value: string | number;
  label: string;
}

interface SelectFilterProps {
  label:    string;
  value:    string | number | null;
  options:  Option[];
  onChange: (v: string | null) => void;
  placeholder?: string;
}

export default function SelectFilter({ label, value, options, onChange, placeholder = 'Todos' }: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <label className="text-[11px] font-bold uppercase tracking-[0.5px] text-mp-muted">
        {label}
      </label>
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value || null)}
          className="
            w-full h-9 pl-3 pr-8 appearance-none
            bg-mp-surface border border-mp-border-strong rounded-mp-input
            text-[13px] text-mp-text
            focus:outline-none focus:border-mp-primary
            transition-colors cursor-pointer
          "
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {/* Seta custom */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mp-muted text-[10px]">
          ▾
        </span>
      </div>
    </div>
  );
}
