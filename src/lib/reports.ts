import { createServerClient } from './supabase';
import type { RailItem, Rail, Company } from '@/types/database';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

export interface ReportItem extends RailItem {
  rail_name: string;
  company_name: string;
}

export type ReportType =
  | 'overdue-all'
  | 'overdue-by-company'
  | 'owner-workload'
  | 'initiative-status'
  | 'executive-summary';

export const REPORT_LABELS: Record<ReportType, string> = {
  'overdue-all': 'Overdue — All Items',
  'overdue-by-company': 'Overdue — By Company',
  'owner-workload': 'Owner Workload',
  'initiative-status': 'Initiative Status',
  'executive-summary': 'Executive Summary',
};

export const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  'overdue-all': 'All past-due open items across every RAIL, sorted by priority.',
  'overdue-by-company': 'Past-due open items grouped by company and initiative.',
  'owner-workload': 'Open item counts by owner — overdue, due-this-week, total, and by priority.',
  'initiative-status': 'All items per initiative with status breakdown.',
  'executive-summary': 'High-level counts and overdue summary across all companies.',
};

async function fetchAll() {
  const db = createServerClient();
  const [{ data: items }, { data: rails }] = await Promise.all([
    db.from('rail_items').select('*').order('priority', { ascending: true }),
    db.from('rails').select('*, companies(id, name)'),
  ]);

  const railMap = new Map<string, { name: string; company: string; company_id: string }>();
  for (const rail of (rails ?? []) as RailWithCompany[]) {
    const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;
    railMap.set(rail.id, {
      name: rail.initiative_name,
      company: company?.name ?? '',
      company_id: company?.id ?? '',
    });
  }

  const enriched: ReportItem[] = ((items ?? []) as RailItem[]).map(i => ({
    ...i,
    rail_name: railMap.get(i.rail_id)?.name ?? '',
    company_name: railMap.get(i.rail_id)?.company ?? '',
  }));

  return { enriched, railMap };
}

function isOverdue(item: ReportItem) {
  if (!item.due_date || item.status === 'Closed') return false;
  return new Date(item.due_date) < new Date(new Date().toDateString());
}

function isDueThisWeek(item: ReportItem) {
  if (!item.due_date || item.status === 'Closed') return false;
  const today = new Date(new Date().toDateString());
  const d = new Date(item.due_date);
  const week = new Date(today); week.setDate(today.getDate() + 7);
  return d >= today && d <= week;
}

export async function getReportData(type: ReportType) {
  const { enriched } = await fetchAll();
  const today = new Date(new Date().toDateString());

  switch (type) {
    case 'overdue-all': {
      return enriched.filter(isOverdue).sort((a, b) => a.priority - b.priority || (a.due_date ?? '').localeCompare(b.due_date ?? ''));
    }
    case 'overdue-by-company': {
      const overdue = enriched.filter(isOverdue).sort((a, b) => a.company_name.localeCompare(b.company_name) || a.priority - b.priority);
      const byCompany = new Map<string, ReportItem[]>();
      for (const item of overdue) {
        if (!byCompany.has(item.company_name)) byCompany.set(item.company_name, []);
        byCompany.get(item.company_name)!.push(item);
      }
      return byCompany;
    }
    case 'owner-workload': {
      const open = enriched.filter(i => i.status !== 'Closed');
      const ownerMap = new Map<string, { owner: string; overdue: number; dueThisWeek: number; p1: number; p2: number; p3: number; total: number }>();
      for (const item of open) {
        const key = item.owner || '(Unassigned)';
        if (!ownerMap.has(key)) ownerMap.set(key, { owner: key, overdue: 0, dueThisWeek: 0, p1: 0, p2: 0, p3: 0, total: 0 });
        const row = ownerMap.get(key)!;
        row.total++;
        if (isOverdue(item)) row.overdue++;
        else if (isDueThisWeek(item)) row.dueThisWeek++;
        if (item.priority === 1) row.p1++;
        else if (item.priority === 2) row.p2++;
        else row.p3++;
      }
      return Array.from(ownerMap.values()).sort((a, b) => b.overdue - a.overdue || b.total - a.total);
    }
    case 'initiative-status': {
      const byRail = new Map<string, { rail_name: string; company_name: string; items: ReportItem[] }>();
      for (const item of enriched) {
        if (!byRail.has(item.rail_id)) byRail.set(item.rail_id, { rail_name: item.rail_name, company_name: item.company_name, items: [] });
        byRail.get(item.rail_id)!.items.push(item);
      }
      return byRail;
    }
    case 'executive-summary': {
      const companies = [...new Set(enriched.map(i => i.company_name))].sort();
      return companies.map(company => {
        const items = enriched.filter(i => i.company_name === company);
        const open = items.filter(i => i.status !== 'Closed');
        const overdue = items.filter(isOverdue);
        const dueThisWeek = items.filter(isDueThisWeek);
        const rails = [...new Set(items.map(i => i.rail_name))];
        return { company, total: items.length, open: open.length, closed: items.length - open.length, overdue: overdue.length, dueThisWeek: dueThisWeek.length, rails };
      });
    }
  }
}
