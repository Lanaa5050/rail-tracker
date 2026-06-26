'use client';

const CONFIG = {
  1: { label: '1 — High',   className: 'bg-red-100 text-red-700 border-red-200' },
  2: { label: '2 — Med',    className: 'bg-orange-100 text-orange-700 border-orange-200' },
  3: { label: '3 — Low',    className: 'bg-slate-100 text-slate-600 border-slate-200' },
} as const;

export default function PriorityBadge({ priority }: { priority: 1 | 2 | 3 }) {
  const { label, className } = CONFIG[priority] ?? CONFIG[2];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

export const PRIORITY_OPTIONS = [1, 2, 3] as const;
