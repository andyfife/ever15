'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavigationMenuDemo } from '@/components/NavigationMenu';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow flex flex-col">
      <div className="absolute left-4 flex items-center gap-2">
        <SidebarTrigger className="-ml-1 mt-4" />
      </div>
      <div className="flex items-center justify-center h-16 px-4">
        <img
          src="/images/evergreen-logo.webp"
          alt="Evergreen Education Foundation logo"
          className="h-10 w-10 object-contain"
        />
        <Link href="/">
          <span className="ml-3 text-lg font-semibold text-gray-800">
            Evergreen Education Foundation
          </span>
        </Link>
      </div>

      {/* Navigation menu underneath logo + text, only on large screens */}
      <div className="hidden lg:flex justify-center bg-gray-50 shadow-inner h-12">
        <NavigationMenuDemo />
      </div>
    </header>
  );
}
