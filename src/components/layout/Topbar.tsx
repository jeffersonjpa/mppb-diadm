'use client';

import Image from 'next/image';
import { Menu, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

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
  const { data: session } = useSession();

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

      {/* Usuário + logout */}
      {session?.user && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden min-[980px]:block text-[12px] text-mp-secondary truncate max-w-[160px]">
            {session.user.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sair"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium text-mp-muted hover:text-mp-danger hover:bg-mp-danger-bg transition-colors"
          >
            <LogOut size={15} strokeWidth={2} />
            <span className="hidden min-[980px]:inline">Sair</span>
          </button>
        </div>
      )}

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
