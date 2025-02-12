'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, Info, Search, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import dynamic from 'next/dynamic';

const SimpleBar = dynamic(() => import('simplebar-react'), {
  ssr: false,
});

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isVideoEditor = pathname === '/video-editor';
  const isAuthPage = pathname.startsWith('/auth');

  if (isVideoEditor || isAuthPage) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-highlight-alpha/30 to-theme-accent-alpha/30">
      <div className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-end h-16 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg bg-background border border-theme-accent-alpha/20 focus:outline-none focus:ring-2 focus:ring-theme-primary/20"
              />
            </div>
            <button className="p-2 hover:bg-theme-highlight-alpha/20 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-theme-primary" />
            </button>
            <button className="p-2 hover:bg-theme-highlight-alpha/20 rounded-lg transition-colors">
              <Info className="w-5 h-5 text-theme-primary" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-16 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
