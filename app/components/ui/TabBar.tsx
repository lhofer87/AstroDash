'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TabDashboardIcon,
  TabMapIcon,
  TabSpotsIcon,
} from '@/app/components/icons/AstroIcons';

const tabs = [
  { href: '/dashboard', label: 'Dashboard', Icon: TabDashboardIcon },
  { href: '/map', label: 'Map', Icon: TabMapIcon },
  { href: '/spots', label: 'Spots', Icon: TabSpotsIcon },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl safe-area-pb"
      style={{ boxShadow: '0 -1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="grid grid-cols-3 h-16 max-w-[431px] mx-auto w-full px-10 sm:px-12">
        {tabs.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 py-2 min-h-0 w-full transition-colors"
            >
              <Icon
                className={`h-6 w-6 shrink-0 ${active ? 'text-[var(--star-blue)]' : 'text-[var(--comet-silver)]'}`}
              />
              <span
                className={`text-xs leading-tight text-center ${active ? 'text-[var(--star-blue)]' : 'text-[var(--comet-silver)]'}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
