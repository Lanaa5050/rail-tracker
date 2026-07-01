export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import type { RailItem, Rail, Company } from '@/types/database';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import TopNav from '@/components/TopNav';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

interface OwnerRow {
  owner: string;
  overdue: number;
  dueThisWeek: number;
  p1: number;
  p2: number;
  p3: number;
  open: number;
  closed: number;
  initiativesByCompany: Map<string, string[]>;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function RollupPage() {
  const db = createServerClient();

  const [{ data: items }, { data: rails }] = await Promise.all([
    db.from('rail_items').select('*'),
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

  const today = new Date(new Date().toDateString());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);

  // Group by owner
  const ownerMap = new Map<string, OwnerRow>();

  for (const item of (items ?? []) as RailItem[]) {
    const key = item.owner || '(Unassigned)';
    if (!ownerMap.has(key)) {
      ownerMap.set(key, {
        owner: key,
        overdue: 0,
        dueThisWeek: 0,
        p1: 0, p2: 0, p3: 0,
        open: 0,
        closed: 0,
        initiativesByCompany: new Map(),
      });
    }
    const row = ownerMap.get(key)!;

    if (item.status === 'Closed') {
      row.closed++;
    } else {
      row.open++;
      if (item.due_date) {
        const d = new Date(item.due_date);
        if (d < today) row.overdue++;
        else if (d <= weekFromNow) row.dueThisWeek++;
      }
    }

    if (item.priority === 1) row.p1++;
    else if (item.priority === 2) row.p2++;
    else row.p3++;

    const railInfo = railMap.get(item.rail_id);
    if (railInfo) {
      if (!row.initiativesByCompany.has(railInfo.company)) {
        row.initiativesByCompany.set(railInfo.company, []);
      }
      const rails = row.initiativesByCompany.get(railInfo.company)!;
      if (!rails.includes(railInfo.name)) rails.push(railInfo.name);
    }
  }

  // Sort by overdue desc, then open desc
  const rows = Array.from(ownerMap.values()).sort(
    (a, b) => b.overdue - a.overdue || b.open - a.open
  );

  // Also prepare a detail table: all open items grouped by owner for drill-down
  const openItems = ((items ?? []) as RailItem[])
    .filter(i => i.status !== 'Closed')
    .sort((a, b) => a.priority - b.priority || (a.due_date ?? '').localeCompare(b.due_date ?? ''));

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav activePath="/rollup" />
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">Team Rollup</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Workload summary by owner across all RAILs</p>
      </div>

      <div className="px-4 sm:px-6 py-6 flex flex-col gap-8">

        {/* Summary table */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-700 mb-3">Owner Summary</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm bg-white">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Owner</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-red-500 uppercase tracking-wide whitespace-nowrap">Overdue</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-orange-500 uppercase tracking-wide whitespace-nowrap">Due This Week</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">P1</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">P2</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">P3</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">Open</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">Closed</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Initiatives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-zinc-400 italic">No data yet.</td>
                  </tr>
                ) : rows.map(row => (
                  <tr key={row.owner} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 font-medium text-zinc-800 whitespace-nowrap">{row.owner}</td>
                    <td className="px-3 py-2 text-center">
                      {row.overdue > 0
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">{row.overdue}</span>
                        : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.dueThisWeek > 0
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{row.dueThisWeek}</span>
                        : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-zinc-600">{row.p1 || '—'}</td>
                    <td className="px-3 py-2 text-center text-xs text-zinc-600">{row.p2 || '—'}</td>
                    <td className="px-3 py-2 text-center text-xs text-zinc-600">{row.p3 || '—'}</td>
                    <td className="px-3 py-2 text-center text-xs font-semibold text-zinc-700">{row.open}</td>
                    <td className="px-3 py-2 text-center text-xs text-zinc-400">{row.closed || '—'}</td>
                    <td className="px-3 py-2 text-xs text-zinc-500 max-w-xs">
                      <div className="flex flex-col gap-1">
                        {Array.from(row.initiativesByCompany.entries()).map(([company, rails]) => (
                          <div key={company}>
                            <span className="font-bold text-zinc-700">{company}</span>
                            {' — '}
                            {rails.join(', ')}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Per-owner open item detail */}
        {rows.filter(r => r.open > 0).map(row => {
          const ownerItems = openItems.filter(i => (i.owner || '(Unassigned)') === row.owner);
          if (ownerItems.length === 0) return null;
          return (
            <section key={row.owner}>
              <h2 className="text-sm font-semibold text-zinc-700 mb-2 flex items-center gap-2">
                {row.owner}
                <span className="text-xs font-normal text-zinc-400">{ownerItems.length} open item{ownerItems.length !== 1 ? 's' : ''}</span>
                {row.overdue > 0 && (
                  <span className="text-xs font-semibold text-red-600">{row.overdue} overdue</span>
                )}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
                <table className="min-w-full divide-y divide-zinc-200 text-sm bg-white">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Priority</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Action</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Due Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">RAIL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {ownerItems.map(item => {
                      const overdue = item.due_date && new Date(item.due_date) < today;
                      const railInfo = railMap.get(item.rail_id);
                      return (
                        <tr key={item.id} className="hover:bg-blue-50/30">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <PriorityBadge priority={item.priority} />
                          </td>
                          <td className="px-3 py-2 max-w-sm text-zinc-800">{item.action || <span className="italic text-zinc-400">—</span>}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className={`px-3 py-2 whitespace-nowrap ${overdue ? 'text-red-600 font-medium' : 'text-zinc-600'}`}>
                            {item.due_date ? formatDate(item.due_date) : <span className="text-zinc-300">—</span>}
                            {overdue && <span className="block text-[10px] font-semibold text-red-500 uppercase tracking-wide">Overdue</span>}
                          </td>
                          <td className="px-3 py-2">
                            {railInfo && (
                              <>
                                <Link href={`/rail/${item.rail_id}`} className="text-blue-600 hover:underline text-xs font-medium">
                                  {railInfo.name}
                                </Link>
                                <p className="text-xs text-zinc-400">{railInfo.company}</p>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
