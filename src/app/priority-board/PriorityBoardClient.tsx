'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import type { RailItemStatus } from '@/types/database';

export type EnrichedItem = {
  id: string;
  rail_id: string;
  priority: number;
  action: string;
  owner: string;
  notes: string;
  due_date: string | null;
  status: RailItemStatus;
  last_update: string;
  rail_name: string;
  company_name: string;
};

type SortKey = 'action' | 'owner' | 'status' | 'due_date' | 'rail_name';
type SortDir = 'asc' | 'desc';

const PRIORITY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Priority 1 — High',
  2: 'Priority 2 — Medium',
  3: 'Priority 3 — Low',
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(due_date: string | null) {
  if (!due_date) return false;
  return new Date(due_date) < new Date(new Date().toDateString());
}

function isDueThisWeek(due_date: string | null) {
  if (!due_date) return false;
  const today = new Date(new Date().toDateString());
  const weekOut = new Date(today);
  weekOut.setDate(today.getDate() + 7);
  const d = new Date(due_date);
  return d >= today && d <= weekOut;
}

function sortItems(items: EnrichedItem[], key: SortKey, dir: SortDir): EnrichedItem[] {
  return [...items].sort((a, b) => {
    let av: string = '';
    let bv: string = '';
    if (key === 'due_date') {
      // nulls always last
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      av = a.due_date;
      bv = b.due_date;
    } else {
      av = (a[key] ?? '').toLowerCase();
      bv = (b[key] ?? '').toLowerCase();
    }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-zinc-300">↕</span>;
  return <span className="ml-1 text-blue-500">{dir === 'asc' ? '↑' : '↓'}</span>;
}

function ColHeader({
  label, col, sortKey, sortDir, onSort,
}: {
  label: string; col: SortKey; sortKey: SortKey; sortDir: SortDir;
  onSort: (col: SortKey) => void;
}) {
  return (
    <th
      className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-zinc-800 transition-colors"
      onClick={() => onSort(col)}
      title={`Sort by ${label}`}
    >
      {label}<SortIcon active={sortKey === col} dir={sortDir} />
    </th>
  );
}

export default function PriorityBoardClient({ items }: { items: EnrichedItem[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('due_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (col: SortKey) => {
    if (sortKey === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  const byPriority = useMemo(() => {
    const groups: Record<1 | 2 | 3, EnrichedItem[]> = { 1: [], 2: [], 3: [] };
    for (const item of items) {
      groups[item.priority as 1 | 2 | 3].push(item);
    }
    groups[1] = sortItems(groups[1], sortKey, sortDir);
    groups[2] = sortItems(groups[2], sortKey, sortDir);
    groups[3] = sortItems(groups[3], sortKey, sortDir);
    return groups;
  }, [items, sortKey, sortDir]);

  const overdueCount = items.filter(i => isOverdue(i.due_date)).length;
  const dueThisWeekCount = items.filter(i => isDueThisWeek(i.due_date)).length;

  return (
    <>
      {/* Stats bar */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-2 flex flex-wrap gap-4 text-sm">
        <span className="text-zinc-500">
          <span className="font-semibold text-zinc-800">{items.length}</span> open items
        </span>
        {overdueCount > 0 && (
          <span className="text-red-600">
            <span className="font-semibold">{overdueCount}</span> overdue
          </span>
        )}
        {dueThisWeekCount > 0 && (
          <span className="text-orange-600">
            <span className="font-semibold">{dueThisWeekCount}</span> due this week
          </span>
        )}
        <span className="text-zinc-400">
          {byPriority[1].length} P1 · {byPriority[2].length} P2 · {byPriority[3].length} P3
        </span>
        <span className="text-zinc-400 ml-auto text-[11px] italic">Click a column header to sort</span>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 flex flex-col gap-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 px-6 py-12 text-center text-zinc-400 italic">
            No open items found.
          </div>
        ) : (
          ([1, 2, 3] as const).map(priority => {
            const group = byPriority[priority];
            if (group.length === 0) return null;
            return (
              <section key={priority}>
                <div className="flex items-center gap-3 mb-3">
                  <PriorityBadge priority={priority} />
                  <h2 className="text-sm font-semibold text-zinc-700">{PRIORITY_LABELS[priority]}</h2>
                  <span className="text-xs text-zinc-400">{group.length} item{group.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm bg-white">
                    <thead className="bg-zinc-50">
                      <tr>
                        <ColHeader label="Action" col="action" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <ColHeader label="Owner" col="owner" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <ColHeader label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <ColHeader label="Due Date" col="due_date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <ColHeader label="RAIL / Company" col="rail_name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {group.map(item => {
                        const overdue = isOverdue(item.due_date);
                        const soonDue = !overdue && isDueThisWeek(item.due_date);
                        return (
                          <tr
                            key={item.id}
                            className={[
                              'hover:bg-blue-50/30 transition-colors',
                              overdue ? 'bg-red-50/40' : '',
                            ].join(' ')}
                          >
                            <td className="px-3 py-2 max-w-sm">
                              <p className="font-medium text-zinc-800">{item.action || <span className="italic text-zinc-400">—</span>}</p>
                              {item.notes && <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">{item.notes}</p>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-zinc-700">{item.owner || <span className="text-zinc-300">—</span>}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <StatusBadge status={item.status} />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {item.due_date ? (
                                <span className={overdue ? 'text-red-600 font-semibold' : soonDue ? 'text-orange-600 font-medium' : 'text-zinc-600'}>
                                  {formatDate(item.due_date)}
                                  {overdue && <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wide">Overdue</span>}
                                  {soonDue && <span className="block text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Due soon</span>}
                                </span>
                              ) : (
                                <span className="text-zinc-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Link href={`/rail/${item.rail_id}`} className="text-blue-600 hover:underline text-xs font-medium">
                                {item.rail_name}
                              </Link>
                              <p className="text-xs text-zinc-400">{item.company_name}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
