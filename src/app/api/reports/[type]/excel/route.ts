import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getReportData, REPORT_LABELS, type ReportType, type ReportItem, type CompanyInitiativeGroup } from '@/lib/reports';

type Params = { params: Promise<{ type: string }> };

const VALID_TYPES: ReportType[] = [
  'overdue-all', 'overdue-by-company', 'owner-workload', 'initiative-status', 'company-initiatives', 'executive-summary',
];

function fmtDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function styleHeader(ws: ExcelJS.Worksheet, row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 20;
}

function itemRows(ws: ExcelJS.Worksheet, items: ReportItem[]) {
  for (const item of items) {
    const row = ws.addRow([
      item.priority,
      item.action,
      item.owner,
      item.status,
      fmtDate(item.due_date),
      fmtDate(item.last_update),
      item.rail_name,
      item.company_name,
      item.notes,
    ]);
    // Red background for overdue rows
    if (item.due_date && item.status !== 'Closed' && new Date(item.due_date) < new Date(new Date().toDateString())) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
      });
    }
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as ReportType)) {
    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  }

  const reportType = type as ReportType;
  const data = await getReportData(reportType);
  const label = REPORT_LABELS[reportType];
  const generatedAt = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'RAIL Tracker';
  wb.created = new Date();

  const ITEM_COLS = ['Priority', 'Action', 'Owner', 'Status', 'Due Date', 'Last Update', 'RAIL', 'Company', 'Notes'];
  const ITEM_WIDTHS = [9, 40, 20, 14, 14, 14, 30, 22, 40];

  switch (reportType) {
    case 'overdue-all': {
      const ws = wb.addWorksheet(label);
      ws.columns = ITEM_COLS.map((h, i) => ({ header: h, key: h, width: ITEM_WIDTHS[i] }));
      styleHeader(ws, ws.getRow(1));
      itemRows(ws, data as ReportItem[]);
      ws.addRow([]);
      ws.addRow([`Generated ${generatedAt} — RAIL Tracker`]);
      break;
    }
    case 'overdue-by-company': {
      const byCompany = data as Map<string, ReportItem[]>;
      for (const [company, items] of byCompany) {
        const ws = wb.addWorksheet(company.slice(0, 31));
        ws.columns = ITEM_COLS.map((h, i) => ({ header: h, key: h, width: ITEM_WIDTHS[i] }));
        styleHeader(ws, ws.getRow(1));
        itemRows(ws, items);
      }
      // Summary sheet
      const summary = wb.addWorksheet('Summary');
      summary.columns = [
        { header: 'Company', key: 'company', width: 24 },
        { header: 'Overdue Items', key: 'count', width: 16 },
      ];
      styleHeader(summary, summary.getRow(1));
      for (const [company, items] of byCompany) {
        summary.addRow([company, items.length]);
      }
      break;
    }
    case 'owner-workload': {
      type OwnerRow = { owner: string; overdue: number; dueThisWeek: number; p1: number; p2: number; p3: number; total: number };
      const rows = data as OwnerRow[];
      const ws = wb.addWorksheet('Owner Workload');
      ws.columns = [
        { header: 'Owner', key: 'owner', width: 24 },
        { header: 'Overdue', key: 'overdue', width: 12 },
        { header: 'Due This Week', key: 'dueThisWeek', width: 16 },
        { header: 'P1', key: 'p1', width: 8 },
        { header: 'P2', key: 'p2', width: 8 },
        { header: 'P3', key: 'p3', width: 8 },
        { header: 'Total Open', key: 'total', width: 12 },
      ];
      styleHeader(ws, ws.getRow(1));
      for (const row of rows) {
        ws.addRow([row.owner, row.overdue, row.dueThisWeek, row.p1, row.p2, row.p3, row.total]);
      }
      break;
    }
    case 'initiative-status': {
      const byRail = data as Map<string, { rail_name: string; company_name: string; closed: boolean; items: ReportItem[] }>;
      for (const [, { rail_name, company_name, closed, items }] of byRail) {
        const sheetName = `${closed ? '[A] ' : ''}${company_name} — ${rail_name}`.slice(0, 31);
        const ws = wb.addWorksheet(sheetName);
        ws.columns = ITEM_COLS.map((h, i) => ({ header: h, key: h, width: ITEM_WIDTHS[i] }));
        styleHeader(ws, ws.getRow(1));
        if (closed) {
          ws.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };
          });
        }
        itemRows(ws, items);
      }
      break;
    }
    case 'company-initiatives': {
      const groups = data as CompanyInitiativeGroup[];
      const ws = wb.addWorksheet('Company Initiatives');
      ws.columns = [
        { header: 'Company', key: 'company', width: 24 },
        { header: 'Initiative', key: 'rail', width: 36 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Total Items', key: 'total', width: 12 },
        { header: 'Open', key: 'open', width: 10 },
        { header: 'Closed Items', key: 'closedItems', width: 12 },
        { header: 'Overdue', key: 'overdue', width: 10 },
        { header: 'Due This Week', key: 'dueThisWeek', width: 14 },
      ];
      styleHeader(ws, ws.getRow(1));
      for (const { company, rails } of groups) {
        for (const rail of rails) {
          const row = ws.addRow([
            company,
            rail.rail_name,
            rail.closed ? 'Archived' : 'Active',
            rail.total,
            rail.open,
            rail.closedItems,
            rail.overdue,
            rail.dueThisWeek,
          ]);
          if (rail.closed) {
            row.eachCell(cell => {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
            });
          }
        }
      }
      ws.addRow([]);
      ws.addRow([`Generated ${generatedAt} — RAIL Tracker`]);
      break;
    }
    case 'executive-summary': {
      type SummaryRow = { company: string; total: number; open: number; closed: number; overdue: number; dueThisWeek: number; rails: string[] };
      const rows = data as SummaryRow[];
      const ws = wb.addWorksheet('Executive Summary');
      ws.columns = [
        { header: 'Company', key: 'company', width: 24 },
        { header: 'Total Items', key: 'total', width: 12 },
        { header: 'Open', key: 'open', width: 10 },
        { header: 'Closed', key: 'closed', width: 10 },
        { header: 'Overdue', key: 'overdue', width: 10 },
        { header: 'Due This Week', key: 'dueThisWeek', width: 16 },
        { header: 'Initiatives', key: 'rails', width: 50 },
      ];
      styleHeader(ws, ws.getRow(1));
      for (const row of rows) {
        ws.addRow([row.company, row.total, row.open, row.closed, row.overdue, row.dueThisWeek, row.rails.join(', ')]);
      }
      ws.addRow([]);
      ws.addRow([`Generated ${generatedAt} — RAIL Tracker`]);
      break;
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const filename = `RAIL-${label.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
