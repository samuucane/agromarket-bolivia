'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastEmitter: ((toast: Toast) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'info') {
  toastEmitter?.({ id: Math.random().toString(36).slice(2), message, type });
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastEmitter = (t) => {
      setToasts(p => [...p, t]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 4000);
    };
    return () => { toastEmitter = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium min-w-64 animate-fade-in ${
          t.type === 'success' ? 'bg-am-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        }`}>
          {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> :
           t.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> :
           <Info className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="shrink-0 min-h-0 min-w-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
