
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed-dim font-h3 text-h3 fixed top-0 w-full z-50 border-b border-outline-variant dark:border-outline flat no shadows flex justify-between items-center h-toolbar-height px-gutter max-w-full">
<div className="flex items-center gap-4">
<button className="hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors active:opacity-80 p-2 rounded-full hidden md:block">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 0"}}>menu</span>
</button>
<span className="text-h3 font-h3 font-bold text-primary dark:text-primary-fixed-dim">Enterprise Resources</span>
</div>
<div className="flex items-center gap-4 hidden md:flex">
<nav className="flex gap-6 mr-6">
<a className="text-primary dark:text-primary-fixed-dim hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors active:opacity-80 px-3 py-2 rounded-DEFAULT" href="#">Dashboard</a>
<a className="text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors active:opacity-80 px-3 py-2 rounded-DEFAULT" href="#">Inventory</a>
<a className="text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors active:opacity-80 px-3 py-2 rounded-DEFAULT" href="#">Orders</a>
<a className="text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors active:opacity-80 px-3 py-2 rounded-DEFAULT" href="#">Employees</a>
</nav>
<img alt="User profile photo" className="w-8 h-8 rounded-full border border-outline-variant" data-alt="A professional headshot of an executive in a modern office setting. Crisp white lighting highlights the sharp suit and confident expression. The background is a slightly blurred corporate environment to maintain focus on the subject." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwf86WRybbLvQHuSCFY9Me5sqhGfn6cGYVSwtUPfrQydkizG4u8wPvEbWI2L-yWX8OJoFYMoQWRfMi-mRT8SAI6n3jTL_mF1CSfY51c0AYDGzROqFs0qbtoiOq7vtmA7NNvOdwyYlnW0Y9j1avEc3eMExFjfovc91xa4rmp32chSlfn16UHiZaB1iU5kVh446gbwAmQz4TPv_hCziO6pE-VnBv4NARli50TppnPbKh4o6DHSqszCejiN7WBPlspNvhN54VUZAH4_d3"/>
</div>
</header>
  );
}
