export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getReportData, REPORT_LABELS, REPORT_DESCRIPTIONS, type ReportType, type ReportItem } from '@/lib/reports';
import PrintView from './PrintView';

const VALID_TYPES: ReportType[] = [
  'overdue-all', 'overdue-by-company', 'owner-workload', 'initiative-status', 'executive-summary',
];

type Params = { params: Promise<{ type: string }> };

export default async function PrintPage({ params }: Params) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as ReportType)) notFound();

  const reportType = type as ReportType;
  const data = await getReportData(reportType);

  return (
    <PrintView
      type={reportType}
      label={REPORT_LABELS[reportType]}
      description={REPORT_DESCRIPTIONS[reportType]}
      data={data}
      generatedAt={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
    />
  );
}
