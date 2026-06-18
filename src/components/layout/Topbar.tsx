'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/visao-geral':   'Visão Geral',
  '/terceirizados': 'Terceirizados',
  '/energia':       'Energia Elétrica',
  '/agua':          'Água e Esgoto',
  '/telefonia':     'Telefonia',
  '/combustivel':   'Combustível e Frota',
  '/material':      'Material de Consumo',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES).find(([key]) =>
      pathname === key || pathname.startsWith(key + '/')
    )?.[1] ?? 'BI Administrativo';

  return (
    <header
      className="
        sticky top-0 z-10 h-[56px]
        flex items-center gap-3 px-5
        border-b border-mp-border
        bg-[rgba(255,255,255,0.85)] backdrop-blur-[10px]
        shrink-0
      "
      style={{ WebkitBackdropFilter: 'blur(10px)' }}
    >
      {/* Botão hambúrguer (mobile) */}
      <button
        onClick={onMenuClick}
        className="hamburger-btn p-1.5 -ml-1 rounded text-mp-muted hover:text-mp-text hover:bg-mp-head transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {/* Título da página */}
      <h1
        className="text-[20px] font-extrabold text-mp-ink tracking-[-0.3px] leading-none"
      >
        {title}
      </h1>

      <style>{`
        @media (min-width: 980px) {
          .hamburger-btn { display: none; }
        }
      `}</style>
    </header>
  );
}
