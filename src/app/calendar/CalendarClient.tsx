'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CalendarItem, CalendarRail } from './page';
import TopNav from '@/components/TopNav';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

interface Props {
  items: CalendarItem[];
  rails: CalendarRail[];
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY_DOT: Record<1 | 2 | 3, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-slate-400',
};

const PRIORITY_CHIP: Record<1 | 2 | 3, string> = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200',
  3: 'bg-slate-100 text-slate-700 border-slate-200',
};

function isoDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarClient({ items, rails }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [railFilter, setRailFilter] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const filtered = useMemo(
    () => (railFilter ? items.filter(i => i.rail_id === railFilter) : items),
    [items, railFilter]
  );

  // Build map: dateString -> items[]
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of filtered) {
      const key = item.due_date.slice(0, 10); // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filtered]);

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  const todayStr = isoDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedItems = selectedDay ? (byDate.get(selectedDay) ?? []) : [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav activePath="/calendar" />

      {/* Page header */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Calendar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Due dates across all RAILs</p>
        </div>

        {/* RAIL filter */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Filter RAIL</label>
          <select
            className="text-sm border border-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-xs"
            value={railFilter}
            onChange={e => { setRailFilter(e.target.value); setSelectedDay(null); }}
          >
            <option value="">All RAILs</option>
            {rails.map(r => (
              <option key={r.id} value={r.id}>{r.company} — {r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <h2 className="text-base font-semibold text-zinc-800">{monthLabel}</h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Grid */}
          <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-zinc-200">
              {DAY_HEADERS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-zinc-100">
              {Array.from({ length: totalCells }, (_, i) => {
                const dayNum = i - firstDayOfMonth + 1;
                const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
                const dateStr = inMonth ? isoDateString(year, month, dayNum) : '';
                const dayItems = inMonth ? (byDate.get(dateStr) ?? []) : [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                const hasItems = dayItems.length > 0;

                // Show at most 3 dots; overflow shown as count
                const dotsToShow = dayItems.slice(0, 3);
                const overflow = dayItems.length - 3;

                return (
                  <button
                    key={i}
                    disabled={!inMonth}
                    onClick={() => inMonth && setSelectedDay(isSelected ? null : dateStr)}
                    className={[
                      'relative min-h-[72px] p-1.5 text-left border-b border-zinc-100 transition-colors',
                      !inMonth ? 'bg-zinc-50 cursor-default' : 'cursor-pointer',
                      inMonth && !isSelected && hasItems ? 'hover:bg-blue-50/40' : '',
                      inMonth && !isSelected && !hasItems ? 'hover:bg-zinc-50' : '',
                      isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : '',
                    ].join(' ')}
                  >
                    {inMonth && (
                      <>
                        <span className={[
                          'inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1',
                          isToday ? 'bg-blue-600 text-white' : 'text-zinc-700',
                        ].join(' ')}>
                          {dayNum}
                        </span>

                        <div className="flex flex-wrap gap-0.5">
                          {dotsToShow.map(item => (
                            <span
                              key={item.id}
                              className={`w-2 h-2 rounded-full ${PRIORITY_DOT[item.priority]}`}
                              title={`P${item.priority}: ${item.action}`}
                            />
                          ))}
                          {overflow > 0 && (
                            <span className="text-[10px] text-zinc-400 leading-none mt-0.5">+{overflow}</span>
                          )}
                        </div>

                        {/* Show action label on larger cells if only 1 item */}
                        {dayItems.length === 1 && (
                          <p className="mt-0.5 text-[10px] text-zinc-500 truncate leading-tight hidden sm:block">
                            {dayItems[0].action || dayItems[0].owner}
                          </p>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span className="font-medium">Priority:</span>
            {([1, 2, 3] as const).map(p => (
              <span key={p} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[p]}`} />
                P{p}
              </span>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="lg:w-80 shrink-0">
          {selectedDay ? (
            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-800">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">×</button>
              </div>

              {selectedItems.length === 0 ? (
                <p className="px-4 py-6 text-sm text-zinc-400 italic text-center">No items due this day.</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {selectedItems.map(item => (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-start gap-2 mb-1.5">
                        <PriorityBadge priority={item.priority} />
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-sm font-medium text-zinc-800 leading-snug">
                        {item.action || <span className="italic text-zinc-400">No action text</span>}
                      </p>
                      {item.owner && (
                        <p className="text-xs text-zinc-500 mt-0.5">{item.owner}</p>
                      )}
                      <div className="mt-1.5">
                        <Link
                          href={`/rail/${item.rail_id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          {item.rail_name}
                        </Link>
                        <span className="text-xs text-zinc-400"> · {item.company_name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm px-6 py-10 text-center text-zinc-400 text-sm">
              Click a day to see items due
            </div>
          )}

          {/* Month item count */}
          <div className="mt-4 bg-white rounded-lg border border-zinc-200 shadow-sm px-4 py-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">This Month</p>
            <MonthlySummary items={filtered} year={year} month={month} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlySummary({ items, year, month }: { items: CalendarItem[]; year: number; month: number }) {
  const monthItems = items.filter(i => {
    const d = new Date(i.due_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (monthItems.length === 0) {
    return <p className="text-sm text-zinc-400 italic">No items due this month.</p>;
  }

  const byPriority = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
  const closed = monthItems.filter(i => i.status === 'Closed').length;
  for (const i of monthItems) byPriority[i.priority as 1 | 2 | 3]++;

  const today = new Date(new Date().toDateString());
  const endOfMonth = new Date(year, month + 1, 0);
  const overdue = monthItems.filter(i => i.status !== 'Closed' && new Date(i.due_date) < today).length;

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex justify-between text-zinc-700">
        <span>Total due</span>
        <span className="font-semibold">{monthItems.length}</span>
      </div>
      {overdue > 0 && (
        <div className="flex justify-between text-red-600">
          <span>Overdue</span>
          <span className="font-semibold">{overdue}</span>
        </div>
      )}
      <div className="flex justify-between text-zinc-500">
        <span>Closed</span>
        <span>{closed}</span>
      </div>
      {([1, 2, 3] as const).map(p => byPriority[p] > 0 && (
        <div key={p} className="flex justify-between items-center">
          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${PRIORITY_CHIP[p]}`}>P{p}</span>
          <span className="text-zinc-600 text-xs">{byPriority[p]}</span>
        </div>
      ))}
    </div>
  );
}
