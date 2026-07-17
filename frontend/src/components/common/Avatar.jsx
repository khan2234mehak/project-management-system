import { resolveFileUrl } from '../../utils/api';

const SIZE_MAP = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const COLOR_PALETTE = [
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500',
  'bg-green-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
];

function colorFromName(name = '') {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  if (src) {
    return (
      <img
        src={resolveFileUrl(src)}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-ink-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${colorFromName(name)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white dark:ring-ink-800 ${className}`}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
