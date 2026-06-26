export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import type { RailItem, Rail, Company } from '@/types/database';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import TopNav from '@/components/TopNav';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

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

export default async function PriorityBoardPage() {
  const db = createServerClient();

  const [{ data: items }, { data: rails }] = await Promise.all([
    db
      .from('rail_items')
      .select('*')
      .neq('status', 'Closed')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false }),
    db.from('rails').select('*, companies(id, name)'),
  ]);

  const railMap = new Map<string, { name: string; company: string }>();
  for (const rail of (rails ?? []) as RailWithCompany[]) {
    const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;
    railMap.set(rail.id, {
      name: rail.initiative_name,
      company: company?.name ?? '',
    });
  }

  type EnrichedItem = RailItem & { rail_name: string; company_name: string };
  const enriched: EnrichedItem[] = ((items ?? []) as RailItem[]).map(item => {
    const info = railMap.get(item.rail_id);
    return { ...item, rail_name: info?.name ?? '', company_name: info?.company ?? '' };
  });

  const byPriority: Record<1 | 2 | 3, EnrichedItem[]> = { 1: [], 2: [], 3: [] };
  for (const item of enriched) {
    byPriority[item.priority as 1 | 2 | 3].push(item);
  }

  const overdueCount = enriched.filter(i => isOverdue(i.due_date)).length;
  const dueThisWeekCount = enriched.filter(i => isDueThisWeek(i.due_date)).length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav activePath="/priority-board" />

      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">Priority Board</h1>
        <p className="text-sm text-zinc-500 mt-0.5">All open items across every RAIL — what matters most right now</p>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-2 flex flex-wrap gap-4 text-sm">
        <span className="text-zinc-500">
          <span className="font-semibold text-zinc-800">{enriched.length}</span> open items
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
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 flex flex-col gap-8">
        {enriched.length === 0 ? (
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
                        <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Action</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Owner</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Due Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">RAIL / Company</th>
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
    </div>
  );
}
