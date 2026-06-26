export const dynamic = 'force-dynamic';

import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { REPORT_LABELS, REPORT_DESCRIPTIONS, type ReportType } from '@/lib/reports';

const REPORT_TYPES: ReportType[] = [
  'overdue-all',
  'overdue-by-company',
  'owner-workload',
  'initiative-status',
  'executive-summary',
];

const REPORT_ICONS: Record<ReportType, string> = {
  'overdue-all': '🔴',
  'overdue-by-company': '🏢',
  'owner-workload': '👤',
  'initiative-status': '📋',
  'executive-summary': '📊',
};

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav activePath="/reports" />

      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">Reports &amp; Export</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Generate Excel or print-to-PDF reports across all RAILs</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-4">
          {REPORT_TYPES.map(type => (
            <div
              key={type}
              className="bg-white rounded-lg border border-zinc-200 shadow-sm px-5 py-4 flex items-start gap-4"
            >
              <span className="text-2xl mt-0.5 shrink-0">{REPORT_ICONS[type]}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-zinc-800">{REPORT_LABELS[type]}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{REPORT_DESCRIPTIONS[type]}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/reports/${type}/excel`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                  download
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Excel
                </a>
                <Link
                  href={`/reports/${type}/print`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  PDF
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-zinc-400 text-center">
          PDF opens in a new tab — use your browser&apos;s Print dialog and choose &quot;Save as PDF&quot;.
        </p>
      </div>
    </div>
  );
}
