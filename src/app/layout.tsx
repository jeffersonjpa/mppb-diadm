import type { Metadata } from 'next';
import './globals.css';
import ShellClient from '@/components/layout/ShellClient';
import Providers from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: 'BI Administrativo — MPPB',
  description: 'Painel de gestão de despesas administrativas do Ministério Público da Paraíba.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="h-full">
        <Providers>
          <ShellClient>{children}</ShellClient>
        </Providers>
      </body>
    </html>
  );
}
