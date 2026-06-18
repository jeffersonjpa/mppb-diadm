'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  Zap,
  Droplets,
  Phone,
  Fuel,
  Package,
  X,
} from 'lucide-react';

interface NavItem {
  href:    string;
  label:   string;
  icon:    React.ComponentType<{ size?: number; strokeWidth?: number }>;
  soon?:   boolean;
}

const NAV: NavItem[] = [
  { href: '/visao-geral',   label: 'Visão Geral',         icon: LayoutGrid },
  { href: '/terceirizados', label: 'Terceirizados',        icon: Users },
  { href: '/energia',       label: 'Energia Elétrica',     icon: Zap },
  { href: '/agua',          label: 'Água e Esgoto',        icon: Droplets, soon: true },
  { href: '/telefonia',     label: 'Telefonia',            icon: Phone,    soon: true },
  { href: '/combustivel',   label: 'Combustível e Frota',  icon: Fuel,     soon: true },
  { href: '/material',      label: 'Material de Consumo',  icon: Package,  soon: true },
];

interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Scrim mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-[rgba(16,40,70,0.4)]"
          style={{ display: 'none' }}
          id="sidebar-scrim"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className="
          fixed top-0 left-0 z-30 h-full w-[248px]
          bg-mp-surface border-r border-mp-border
          flex flex-col
          transition-transform duration-[280ms] cubic-bezier(0.4,0,0.2,1)
          sidebar-panel
        "
        aria-label="Navegação principal"
      >
        {/* Logo / cabeçalho */}
        <div className="flex items-center justify-between h-[56px] px-5 border-b border-mp-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #1D5288 0%, #16406B 100%)' }}
            >
              <span className="text-white font-extrabold text-[11px] leading-none tracking-tight">MP</span>
            </div>
            <div>
              <p className="text-[12px] font-800 text-mp-ink leading-none tracking-tight">BI Administrativo</p>
              <p className="text-[10px] text-mp-muted mt-0.5 leading-none">MPPB</p>
            </div>
          </div>

          {/* Fechar (mobile) */}
          <button
            onClick={onClose}
            className="sidebar-close-btn p-1 rounded text-mp-muted hover:text-mp-text hover:bg-mp-head transition-colors"
            aria-label="Fechar menu"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-mp-ghost px-2 mb-2 mt-1">
            Módulos
          </p>

          <ul className="space-y-0.5" role="list">
            {NAV.map(({ href, label, icon: Icon, soon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={soon ? '#' : href}
                    onClick={soon ? (e) => e.preventDefault() : onClose}
                    className={`
                      flex items-center gap-3 px-3 py-[9px] rounded-[8px] text-[13px] font-medium
                      transition-colors duration-150 group select-none
                      ${active
                        ? 'bg-mp-primary text-white'
                        : 'text-mp-secondary hover:bg-mp-head hover:text-mp-text'
                      }
                      ${soon ? 'cursor-default opacity-70' : ''}
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {soon && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.4px] px-1.5 py-0.5 rounded bg-mp-warning-bg text-mp-warning leading-none">
                        Em breve
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Rodapé */}
        <div className="px-5 py-4 border-t border-mp-border shrink-0">
          <p className="text-[11px] text-mp-ghost leading-snug">
            Ministério Público do Estado da Paraíba
          </p>
        </div>
      </aside>

      <style>{`
        /* Desktop: sidebar sempre visível */
        @media (min-width: 980px) {
          .sidebar-panel { transform: translateX(0) !important; }
          .sidebar-close-btn { display: none; }
          #sidebar-scrim { display: none !important; }
        }

        /* Mobile: sidebar como overlay */
        @media (max-width: 979px) {
          .sidebar-panel {
            transform: ${open ? 'translateX(0)' : 'translateX(-100%)'};
            box-shadow: var(--shadow-mp-overlay);
          }
          #sidebar-scrim { display: block !important; }
        }
      `}</style>
    </>
  );
}
