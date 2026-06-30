'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { ReportType, ReportItem, CompanyInitiativeGroup } from '@/lib/reports';

interface Props {
  type: ReportType;
  label: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  generatedAt: string;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(item: ReportItem) {
  if (!item.due_date || item.status === 'Closed') return false;
  return new Date(item.due_date) < new Date(new Date().toDateString());
}

const PRIORITY_LABEL: Record<1 | 2 | 3, string> = { 1: 'P1', 2: 'P2', 3: 'P3' };
const PRIORITY_CLASS: Record<1 | 2 | 3, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-slate-100 text-slate-700',
};

function ItemTable({ items, showRail = true }: { items: ReportItem[]; showRail?: boolean }) {
  return (
    <table className="w-full text-xs border-collapse mb-4">
      <thead>
        <tr className="bg-blue-800 text-white print:bg-blue-800">
          <th className="px-2 py-1.5 text-left font-semibold w-10">Pri</th>
          <th className="px-2 py-1.5 text-left font-semibold">Action</th>
          <th className="px-2 py-1.5 text-left font-semibold w-28">Owner</th>
          <th className="px-2 py-1.5 text-left font-semibold w-20">Status</th>
          <th className="px-2 py-1.5 text-left font-semibold w-24">Due Date</th>
          {showRail && <th className="px-2 py-1.5 text-left font-semibold w-36">RAIL</th>}
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.id} className={[
            i % 2 === 0 ? 'bg-white' : 'bg-zinc-50',
            isOverdue(item) ? 'bg-red-50' : '',
          ].join(' ')}>
            <td className="px-2 py-1 border-b border-zinc-100">
              <span className={`inline-block px-1 rounded text-[10px] font-bold ${PRIORITY_CLASS[item.priority as 1 | 2 | 3]}`}>
                {PRIORITY_LABEL[item.priority as 1 | 2 | 3]}
              </span>
            </td>
            <td className="px-2 py-1 border-b border-zinc-100 font-medium">{item.action || '—'}</td>
            <td className="px-2 py-1 border-b border-zinc-100">{item.owner || '—'}</td>
            <td className="px-2 py-1 border-b border-zinc-100">{item.status}</td>
            <td className={`px-2 py-1 border-b border-zinc-100 ${isOverdue(item) ? 'text-red-700 font-semibold' : ''}`}>
              {fmtDate(item.due_date)}
            </td>
            {showRail && <td className="px-2 py-1 border-b border-zinc-100 text-zinc-500">{item.rail_name}</td>}
          </tr>
        ))}
        {items.length === 0 && (
          <tr><td colSpan={showRail ? 6 : 5} className="px-2 py-3 text-center text-zinc-400 italic">No items.</td></tr>
        )}
      </tbody>
    </table>
  );
}

export default function PrintView({ type, label, description, data, generatedAt }: Props) {
  useEffect(() => {
    document.title = `${label} — RAIL Tracker`;
  }, [label]);

  return (
    <div className="min-h-screen bg-white">
      {/* Screen-only controls */}
      <div className="print:hidden bg-zinc-800 text-white px-6 py-3 flex items-center gap-4">
        <Link href="/reports" className="text-zinc-300 hover:text-white text-sm">← Back to Reports</Link>
        <span className="text-zinc-400">|</span>
        <span className="text-sm font-medium">{label}</span>
        <button
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
        >
          🖨 Print / Save as PDF
        </button>
      </div>

      {/* Report content */}
      <div className="max-w-5xl mx-auto px-6 py-8 print:px-4 print:py-6">
        {/* Header */}
        <div className="mb-6 pb-4 border-b-2 border-blue-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Duncan Aviation — RAIL Tracker</p>
              <h1 className="text-2xl font-bold text-zinc-900">{label}</h1>
              <p className="text-sm text-zinc-500 mt-1">{description}</p>
            </div>
            <div className="text-right text-xs text-zinc-400 mt-1">
              <p>Generated</p>
              <p className="font-medium text-zinc-600">{generatedAt}</p>
            </div>
          </div>
        </div>

        {/* Body by type */}
        {type === 'overdue-all' && (
          <>
            <p className="text-sm text-zinc-600 mb-4">
              <span className="font-semibold text-red-600">{(data as ReportItem[]).length}</span> overdue items across all RAILs.
            </p>
            <ItemTable items={data as ReportItem[]} />
          </>
        )}

        {type === 'overdue-by-company' && (
          <>
            {(data as Map<string, ReportItem[]>).size === 0 ? (
              <p className="text-zinc-400 italic">No overdue items.</p>
            ) : (
              Array.from((data as Map<string, ReportItem[]>).entries()).map(([company, items]) => (
                <div key={company} className="mb-8 break-inside-avoid-page">
                  <h2 className="text-base font-bold text-zinc-800 mb-2 flex items-center gap-2">
                    {company}
                    <span className="text-sm font-normal text-red-600">({items.length} overdue)</span>
                  </h2>
                  <ItemTable items={items} showRail />
                </div>
              ))
            )}
          </>
        )}

        {type === 'owner-workload' && (() => {
          type OwnerRow = { owner: string; overdue: number; dueThisWeek: number; p1: number; p2: number; p3: number; total: number };
          const rows = data as OwnerRow[];
          return (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-blue-800 text-white">
                  {['Owner', 'Overdue', 'Due This Week', 'P1', 'P2', 'P3', 'Total Open'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.owner} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                    <td className="px-2 py-1 border-b border-zinc-100 font-medium">{row.owner}</td>
                    <td className={`px-2 py-1 border-b border-zinc-100 ${row.overdue > 0 ? 'text-red-700 font-bold' : ''}`}>{row.overdue || '—'}</td>
                    <td className={`px-2 py-1 border-b border-zinc-100 ${row.dueThisWeek > 0 ? 'text-orange-700 font-semibold' : ''}`}>{row.dueThisWeek || '—'}</td>
                    <td className="px-2 py-1 border-b border-zinc-100">{row.p1 || '—'}</td>
                    <td className="px-2 py-1 border-b border-zinc-100">{row.p2 || '—'}</td>
                    <td className="px-2 py-1 border-b border-zinc-100">{row.p3 || '—'}</td>
                    <td className="px-2 py-1 border-b border-zinc-100 font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}

        {type === 'initiative-status' && (() => {
          const byRail = data as Map<string, { rail_name: string; company_name: string; closed: boolean; items: ReportItem[] }>;
          return Array.from(byRail.values()).map(({ rail_name, company_name, closed, items }) => {
            const open = items.filter(i => i.status !== 'Closed').length;
            const overdue = items.filter(isOverdue).length;
            return (
              <div key={rail_name + company_name} className={`mb-10 break-inside-avoid-page ${closed ? 'opacity-60' : ''}`}>
                <div className="mb-2">
                  <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                    {rail_name}
                    {closed && <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Archived</span>}
                  </h2>
                  <p className="text-xs text-zinc-500">{company_name} · {items.length} total · {open} open · {overdue > 0 ? <span className="text-red-600 font-semibold">{overdue} overdue</span> : '0 overdue'}</p>
                </div>
                <ItemTable items={items} showRail={false} />
              </div>
            );
          });
        })()}

        {type === 'company-initiatives' && (() => {
          const groups = data as CompanyInitiativeGroup[];
          return groups.map(({ company, rails }) => (
            <div key={company} className="mb-10 break-inside-avoid-page">
              <h2 className="text-base font-bold text-zinc-800 mb-2 border-b border-zinc-200 pb-1">{company}</h2>
              <table className="w-full text-xs border-collapse mb-2">
                <thead>
                  <tr className="bg-blue-800 text-white print:bg-blue-800">
                    {['Initiative', 'Total', 'Open', 'Closed', 'Overdue', 'Due This Week'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rails.map((rail, i) => (
                    <tr key={rail.rail_name} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                      <td className="px-2 py-1.5 border-b border-zinc-100 font-medium flex items-center gap-1.5">
                        {rail.rail_name}
                        {rail.closed && <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1 rounded">Archived</span>}
                      </td>
                      <td className="px-2 py-1.5 border-b border-zinc-100">{rail.total}</td>
                      <td className="px-2 py-1.5 border-b border-zinc-100">{rail.open}</td>
                      <td className="px-2 py-1.5 border-b border-zinc-100">{rail.closedItems}</td>
                      <td className={`px-2 py-1.5 border-b border-zinc-100 ${rail.overdue > 0 ? 'text-red-700 font-bold' : ''}`}>{rail.overdue || '—'}</td>
                      <td className={`px-2 py-1.5 border-b border-zinc-100 ${rail.dueThisWeek > 0 ? 'text-orange-700 font-semibold' : ''}`}>{rail.dueThisWeek || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ));
        })()}

        {type === 'executive-summary' && (() => {
          type SummaryRow = { company: string; total: number; open: number; closed: number; overdue: number; dueThisWeek: number; rails: string[] };
          const rows = data as SummaryRow[];
          const totals = rows.reduce((acc, r) => ({
            total: acc.total + r.total, open: acc.open + r.open, closed: acc.closed + r.closed,
            overdue: acc.overdue + r.overdue, dueThisWeek: acc.dueThisWeek + r.dueThisWeek,
          }), { total: 0, open: 0, closed: 0, overdue: 0, dueThisWeek: 0 });
          return (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-5 gap-3 mb-8">
                {[
                  { label: 'Total Items', value: totals.total, color: 'text-zinc-800' },
                  { label: 'Open', value: totals.open, color: 'text-blue-700' },
                  { label: 'Closed', value: totals.closed, color: 'text-green-700' },
                  { label: 'Overdue', value: totals.overdue, color: 'text-red-600' },
                  { label: 'Due This Week', value: totals.dueThisWeek, color: 'text-orange-600' },
                ].map(kpi => (
                  <div key={kpi.label} className="border border-zinc-200 rounded-lg p-3 text-center">
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>
              {/* By company */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-800 text-white">
                    {['Company', 'Total', 'Open', 'Closed', 'Overdue', 'Due This Week', 'Initiatives'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.company} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                      <td className="px-2 py-1.5 border-b border-zinc-100 font-medium">{row.company}</td>
                      <td className="px-2 py-1.5 border-b border-zinc-100">{row.total}</td>
                      <td className="px-2 py-1.5 border-b border-zinc-100">{row.open}</td>
                      <td className="px-2 py-1.5 border-b border-zinc-100">{row.closed}</td>
                      <td className={`px-2 py-1.5 border-b border-zinc-100 ${row.overdue > 0 ? 'text-red-700 font-bold' : ''}`}>{row.overdue || '—'}</td>
                      <td className={`px-2 py-1.5 border-b border-zinc-100 ${row.dueThisWeek > 0 ? 'text-orange-700 font-semibold' : ''}`}>{row.dueThisWeek || '—'}</td>
                      <td className="px-2 py-1.5 border-b border-zinc-100 text-zinc-500 text-[10px]">{row.rails.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        })()}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-zinc-200 text-[10px] text-zinc-400 flex justify-between">
          <span>Duncan Aviation — RAIL Tracker</span>
          <span>Generated {generatedAt}</span>
        </div>
      </div>
    </div>
  );
}
