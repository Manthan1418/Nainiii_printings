"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/', icon: 'dashboard' },
  { label: 'Inventory', href: '/inventory', icon: 'inventory_2' },
  { label: 'Orders', href: '/sales', icon: 'shopping_cart' },
  { label: 'Parties', href: '/parties', icon: 'group' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-surface-container dark:bg-inverse-surface text-primary dark:text-primary-fixed-dim font-body-md text-body-md w-sidebar-width h-full border-r border-outline-variant dark:border-outline hidden md:flex fixed left-0 top-toolbar-height flex-col p-4 z-40">
<div className="mb-8 flex items-center gap-3 px-2">
<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">N</div>
<div>
<div className="font-h3 text-h3 font-bold">Admin</div>
<div className="text-on-surface-variant text-body-sm">Nainiii Printing</div>
</div>
</div>
<nav className="flex flex-col gap-1 flex-1">
  {navItems.map(item => {
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ease-in-out ${
          active
            ? 'bg-secondary-container dark:bg-on-primary-fixed-variant text-on-secondary-container dark:text-on-primary-fixed'
            : 'text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-surface-variant'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}>{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  })}
</nav>
<div className="mt-auto pt-4 border-t border-outline-variant dark:border-outline">
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-surface-variant transition-all duration-200 ease-in-out rounded-full" href="#">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
<span>Settings</span>
</a>
<div className="px-4 py-2 text-on-surface-variant text-body-sm mt-2">v1.0.0</div>
</div>
</aside>
  );
}
