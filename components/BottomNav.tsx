"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/', icon: 'analytics' },
  { label: 'Stock', href: '/inventory', icon: 'inventory' },
  { label: 'Sales', href: '/sales', icon: 'receipt_long' },
  { label: 'Parties', href: '/parties', icon: 'group' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed-dim font-label-caps text-label-caps fixed bottom-0 left-0 w-full z-50 border-t border-outline-variant dark:border-outline flex justify-around items-center h-16 px-4 md:hidden">
      {navItems.map(item => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-4 py-1 active:scale-95 transition-transform rounded-full ${
              active
                ? 'bg-secondary-container dark:bg-on-primary-fixed-variant text-on-secondary-container dark:text-on-primary-fixed'
                : 'text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}>{item.icon}</span>
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
