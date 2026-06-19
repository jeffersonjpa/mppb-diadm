import type { Metadata } from 'next';
import './globals.css';
import ShellClient from '@/components/layout/ShellClient';
import Providers from '@/components/layout/Providers';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'BI Administrativo — MPPB',
  description: 'Painel de gestão de despesas administrativas do Ministério Público da Paraíba.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="h-full">
        <Providers session={session}>
          <ShellClient>{children}</ShellClient>
        </Providers>
      </body>
    </html>
  );
}
