'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function ShellClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Área principal — offset da sidebar em desktop */}
      <div className="flex flex-col flex-1 min-w-0 min-[980px]:ml-[248px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto bg-mp-bg">
          <div className="max-w-[1480px] mx-auto px-5 py-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
