
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="bg-surface-container dark:bg-inverse-surface text-primary dark:text-primary-fixed-dim font-body-md text-body-md w-sidebar-width h-full border-r border-outline-variant dark:border-outline flat no shadows hidden md:flex fixed left-0 top-toolbar-height flex-col p-4 z-40">
<div className="mb-8 flex items-center gap-3 px-2">
<img alt="Executive User" className="w-10 h-10 rounded-full object-cover" data-alt="A small circular avatar showing a corporate executive. Soft, neutral lighting on a professional face." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCywDazddOQaJqw2NHUcwjNW5wweydLajDEp-d8pM0qMkC2sel3YfGtASznjZsZ4peXAS8RwoMcFhHT3ymPk8l3NLTjtpYLzwaswJ1iRiIo3dI3RU4Aql0TyC1dH978-gJ_rL517I8E4eLGqnOCKHLIWk4YT2TQGFzDh5HmtaONGJzciV1OWotKj1GPjeFW8b06xpA8vv7iFbsOb0rxya5v_NPLkRgDYNuJg5v-4lFY-SDJG5GjA-wiK7rzCtUFGr5dywJdklSccm2"/>
<div>
<div className="font-h3 text-h3 font-bold">Admin User</div>
<div className="text-on-surface-variant text-body-sm">Executive Manager</div>
</div>
</div>
<nav className="flex flex-col gap-1 flex-1">
<a className="flex items-center gap-3 px-4 py-3 bg-secondary-container dark:bg-on-primary-fixed-variant text-on-secondary-container dark:text-on-primary-fixed rounded-full transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 1"}}>dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-surface-variant transition-all duration-200 ease-in-out rounded-full" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 0"}}>inventory_2</span>
<span>Inventory</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-surface-variant transition-all duration-200 ease-in-out rounded-full" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 0"}}>shopping_cart</span>
<span>Orders</span>
</a>

</nav>
<div className="mt-auto pt-4 border-t border-outline-variant dark:border-outline">
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-highest dark:hover:bg-on-surface-variant transition-all duration-200 ease-in-out rounded-full" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 0"}}>settings</span>
<span>Settings</span>
</a>
<div className="px-4 py-2 text-on-surface-variant text-body-sm mt-2">v2.4.0</div>
</div>
</aside>
  );
}
