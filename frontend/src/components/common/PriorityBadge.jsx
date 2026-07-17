import { ArrowDown, Minus, ArrowUp, AlertTriangle } from 'lucide-react';

const PRIORITY_CONFIG = {
  low: { label: 'Low', icon: ArrowDown, className: 'text-priority-low bg-green-50 dark:bg-green-900/20' },
  medium: { label: 'Medium', icon: Minus, className: 'text-priority-medium bg-blue-50 dark:bg-blue-900/20' },
  high: { label: 'High', icon: ArrowUp, className: 'text-priority-high bg-orange-50 dark:bg-orange-900/20' },
  critical: { label: 'Critical', icon: AlertTriangle, className: 'text-priority-critical bg-red-50 dark:bg-red-900/20' },
};

export default function PriorityBadge({ priority, className = '' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.className} ${className}`}>
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
