'use client';

import Image from 'next/image';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/visao-geral':   'Visão Geral',
  '/terceirizados': 'Terceirizados',
  '/energia':       'Energia Elétrica',
  '/agua':          'Água',
  '/correios':      'Correios',
  '/telefonia':     'Telefonia',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES).find(([key]) =>
      pathname === key || pathname.startsWith(key + '/')
    )?.[1] ?? 'DIADM';

  return (
    <header
      className="
        sticky top-0 z-10 min-h-[56px] py-2
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
        className="min-[980px]:hidden p-1.5 -ml-1 rounded text-mp-muted hover:text-mp-text hover:bg-mp-head transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {/* Título da página */}
      <h1 className="text-[20px] font-extrabold text-mp-ink tracking-[-0.3px] leading-none flex-1">
        {title}
      </h1>

      {/* Logo DIADM — lado direito */}
      <div className="flex items-center shrink-0">
        <Image
          src="/logotipo-diadm.png"
          alt="Diretoria Administrativa — MPPB"
          width={360}
          height={120}
          className="h-[120px] w-auto object-contain"
          priority
        />
      </div>
    </header>
  );
}
