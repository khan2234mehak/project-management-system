const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  planning: 'Planning',
  testing: 'Testing',
  completed: 'Completed',
};

// Static class strings so Tailwind's JIT compiler can pick them up
// (dynamic string interpolation into class names doesn't work with Tailwind).
const STATUS_STYLES = {
  backlog: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-200',
  todo: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-signal-100 text-signal-600 dark:bg-signal-500/20 dark:text-signal-300',
  review: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  done: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  planning: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-200',
  testing: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  completed: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

const DOT_STYLES = {
  backlog: 'bg-ink-300',
  todo: 'bg-blue-500',
  in_progress: 'bg-signal-500',
  review: 'bg-purple-500',
  done: 'bg-green-500',
  planning: 'bg-ink-300',
  testing: 'bg-purple-500',
  completed: 'bg-green-500',
};

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.backlog;
  const dot = DOT_STYLES[status] || DOT_STYLES.backlog;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
