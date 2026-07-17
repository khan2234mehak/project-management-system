import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} animate-slide-up rounded-card bg-white dark:bg-ink-800 shadow-popover max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between border-b border-ink-100 dark:border-ink-700 px-5 py-4">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && <div className="border-t border-ink-100 dark:border-ink-700 px-5 py-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
