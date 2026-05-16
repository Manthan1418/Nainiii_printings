'use client';
import { useEffect } from 'react';
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, variant?: ToastVariant) => void;
  remove: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, variant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const add = useToastStore((s) => s.add);
  return {
    toast: (message: string, variant?: ToastVariant) => add(message, variant),
    success: (message: string) => add(message, 'success'),
    error: (message: string) => add(message, 'error'),
    warning: (message: string) => add(message, 'warning'),
    info: (message: string) => add(message, 'info'),
  };
}

// ─── Config per variant ───────────────────────────────────────────────────────
const CONFIG: Record<ToastVariant, { icon: string; bg: string; border: string; text: string; iconColor: string }> = {
  success: {
    icon: 'check_circle',
    bg: 'bg-surface-container-lowest',
    border: 'border-l-4 border-l-[#4caf50] border border-outline-variant',
    text: 'text-on-surface',
    iconColor: 'text-[#4caf50]',
  },
  error: {
    icon: 'cancel',
    bg: 'bg-surface-container-lowest',
    border: 'border-l-4 border-l-error border border-outline-variant',
    text: 'text-on-surface',
    iconColor: 'text-error',
  },
  warning: {
    icon: 'warning',
    bg: 'bg-surface-container-lowest',
    border: 'border-l-4 border-l-[#ff9800] border border-outline-variant',
    text: 'text-on-surface',
    iconColor: 'text-[#ff9800]',
  },
  info: {
    icon: 'info',
    bg: 'bg-surface-container-lowest',
    border: 'border-l-4 border-l-primary border border-outline-variant',
    text: 'text-on-surface',
    iconColor: 'text-primary',
  },
};

// ─── Individual toast item ────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const c = CONFIG[toast.variant];
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm w-full ${c.bg} ${c.border} animate-slide-in`}
      role="alert"
    >
      <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${c.iconColor}`}>
        {c.icon}
      </span>
      <p className={`font-body-sm text-body-sm flex-1 ${c.text}`}>{toast.message}</p>
      <button
        onClick={onRemove}
        className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

// ─── Toaster (mount once in layout) ──────────────────────────────────────────
export function Toaster() {
  const { toasts, remove } = useToastStore();
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={() => remove(t.id)} />
        </div>
      ))}
    </div>
  );
}
