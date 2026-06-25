'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutGrid,
  Users,
  Zap,
  Droplets,
  Mail,
  FileText,
  X,
  LogOut,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  soon?: boolean;
}

const NAV: NavItem[] = [
  { href: '/visao-geral', label: 'Visão Geral', icon: LayoutGrid },
  { href: '/energia', label: 'Energia Elétrica', icon: Zap },
  { href: '/agua', label: 'Água e Esgoto', icon: Droplets },
  { href: '/correios', label: 'Correios', icon: Mail },
  { href: '/terceirizados', label: 'Terceirizados', icon: Users },
  { href: '/contratos', label: 'Contratos', icon: FileText },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  analista: 'Analista',
  consulta: 'Consulta',
};

function UserFooter() {
  const { data: session } = useSession();

  return (
    <div className="px-4 py-3 border-t border-mp-border shrink-0">
      {session?.user ? (
        <div className="flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-mp-text truncate leading-tight">
              {session.user.name}
            </p>
            <p className="text-[11px] text-mp-ghost truncate leading-tight">
              {ROLE_LABEL[session.user.role] ?? session.user.role}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sair"
            className="p-1.5 rounded text-mp-muted hover:text-mp-danger hover:bg-mp-danger-bg transition-colors shrink-0"
            aria-label="Sair"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-mp-ghost leading-snug">
          Ministério Público do Estado da Paraíba
        </p>
      )}
    </div>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Scrim mobile — só aparece quando open=true, oculto em desktop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-[rgba(16,40,70,0.4)] min-[980px]:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-[248px]
          bg-mp-surface border-r border-mp-border
          flex flex-col
          transition-transform duration-[280ms]
          ${open ? 'translate-x-0' : '-translate-x-full'}
          min-[980px]:translate-x-0
        `}
        aria-label="Navegação principal"
      >
        {/* Logo / cabeçalho */}
        <div className="flex items-start justify-between pt-3 pb-3 px-4 border-b border-mp-border shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Image
              src="/logoMPPB_color.png"
              alt="MPPB"
              width={360}
              height={108}
              className="h-[108px] w-auto object-contain"
              priority
            />
          </div>

          {/* Fechar (mobile) */}
          <button
            onClick={onClose}
            className="min-[980px]:hidden p-1 rounded text-mp-muted hover:text-mp-text hover:bg-mp-head transition-colors shrink-0 ml-1 mt-1"
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

        {/* Rodapé — perfil do usuário */}
        <UserFooter />
      </aside>
    </>
  );
}
