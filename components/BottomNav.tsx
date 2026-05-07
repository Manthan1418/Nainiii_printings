
import Link from 'next/link';

export default function BottomNav() {
  return (
    <nav className="bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed-dim font-label-caps text-label-caps fixed bottom-0 w-full z-50 border-t border-outline-variant dark:border-outline flat no shadows md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-4 bg-surface dark:bg-surface-dim">
<a className="flex flex-col items-center justify-center bg-secondary-container dark:bg-on-primary-fixed-variant text-on-secondary-container dark:text-on-primary-fixed rounded-full px-4 py-1 active:scale-95 transition-transform" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 1"}}>analytics</span>
<span className="mt-1">Metrics</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed active:scale-95 transition-transform px-4 py-1" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 0"}}>inventory</span>
<span className="mt-1">Stock</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed active:scale-95 transition-transform px-4 py-1" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 0"}}>receipt_long</span>
<span className="mt-1">Sales</span>
</a>

</nav>
  );
}
