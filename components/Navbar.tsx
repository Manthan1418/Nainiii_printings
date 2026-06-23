"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebaseClient';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'Orders', href: '/sales' },
  ];

  return (
    <header className="bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed-dim font-h3 text-h3 fixed top-0 w-full z-50 border-b border-outline-variant dark:border-outline flex justify-between items-center h-toolbar-height px-gutter max-w-full">
<div className="flex items-center gap-4">
<span className="text-h3 font-h3 font-bold text-primary dark:text-primary-fixed-dim">Nainiii Printing</span>
</div>
<div className="flex items-center gap-4 hidden md:flex">
<nav className="flex gap-1 mr-6">
  {navItems.map(item => (
    <Link
      key={item.href}
      href={item.href}
      className={`text-sm font-medium px-3 py-2 rounded-DEFAULT transition-colors active:opacity-80 ${
        pathname === item.href
          ? 'text-primary bg-surface-container-high'
          : 'text-on-surface-variant hover:bg-surface-container-high'
      }`}
    > 
      {item.label}
    </Link>
  ))}
</nav>
<button
  onClick={handleLogout}
  title="Logout"
  className="flex items-center gap-1 text-on-surface-variant hover:text-error transition-colors text-sm px-3 py-2 rounded-DEFAULT hover:bg-error-container"
>
  <span className="material-symbols-outlined text-[18px]">logout</span>
  <span className="hidden lg:inline">Logout</span>
</button>
</div>
</header>
  );
}
