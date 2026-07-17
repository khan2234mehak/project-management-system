import { Inbox } from 'lucide-react';

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`animate-spin text-signal-500 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-ink-100 dark:bg-ink-700 p-4">
        <Icon size={28} className="text-ink-300 dark:text-ink-400" />
      </div>
      <div>
        <p className="font-display font-medium text-ink-700 dark:text-ink-100">{title}</p>
        {description && <p className="text-sm text-ink-400 mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 w-2/3 rounded bg-ink-100 dark:bg-ink-700 mb-3" />
      <div className="h-3 w-full rounded bg-ink-100 dark:bg-ink-700 mb-2" />
      <div className="h-3 w-1/2 rounded bg-ink-100 dark:bg-ink-700" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-ink-100 dark:bg-ink-700" />
      <div className="h-3 flex-1 rounded bg-ink-100 dark:bg-ink-700" />
      <div className="h-3 w-20 rounded bg-ink-100 dark:bg-ink-700" />
      <div className="h-3 w-16 rounded bg-ink-100 dark:bg-ink-700" />
    </div>
  );
}
