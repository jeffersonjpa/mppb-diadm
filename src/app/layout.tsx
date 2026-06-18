import type { Metadata } from 'next';
import './globals.css';
import ShellClient from '@/components/layout/ShellClient';

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
        <ShellClient>{children}</ShellClient>
      </body>
    </html>
  );
}
