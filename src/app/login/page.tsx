'use client';

import { Suspense, useActionState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { credentialsLogin } from './actions';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [formError, formAction, isPending] = useActionState(credentialsLogin, undefined);
  const searchParams = useSearchParams();
  const oauthError =
    searchParams.get('error') === 'AccessDenied'
      ? 'Usuário não autorizado. Procure o administrador do sistema.'
      : undefined;
  const error = formError ?? oauthError;

  async function handleGoogle() {
    await signIn('google', { redirectTo: '/visao-geral' });
  }

  return (
    <div className="min-h-screen bg-mp-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] bg-mp-surface rounded-[var(--radius-mp-card)] shadow-[var(--shadow-mp-overlay)] p-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/logotipo-diadm.png"
            alt="DIADM"
            width={260}
            height={80}
            className="h-[80px] w-auto object-contain"
            priority
          />
        </div>

        {/* Botão Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-mp-border-strong rounded-[var(--radius-mp-input)] px-4 py-2.5 text-[13px] font-medium text-mp-text hover:bg-mp-head transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Entrar com Google
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-mp-border" />
          <span className="text-[11px] text-mp-ghost">ou acesse com email</span>
          <div className="flex-1 h-px bg-mp-border" />
        </div>

        {/* Formulário com Server Action */}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[12px] font-medium text-mp-secondary">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-[var(--radius-mp-input)] border border-mp-border px-3 py-2 text-[13px] text-mp-text placeholder:text-mp-ghost outline-none focus:border-mp-primary focus:ring-2 focus:ring-mp-primary/20 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[12px] font-medium text-mp-secondary">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-[var(--radius-mp-input)] border border-mp-border px-3 py-2 text-[13px] text-mp-text placeholder:text-mp-ghost outline-none focus:border-mp-primary focus:ring-2 focus:ring-mp-primary/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[12px] text-mp-danger bg-mp-danger-bg rounded-[var(--radius-mp-badge)] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 w-full bg-mp-primary hover:bg-mp-primary-dark text-white font-semibold text-[13px] rounded-[var(--radius-mp-input)] px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
