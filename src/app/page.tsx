export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import type { Company } from '@/types/database';
import TopNav from '@/components/TopNav';
import HomeAdminPanel from './HomeAdminPanel';
import RailList, { type CompanyEntry } from './RailList';

export default async function Home() {
  const db = createServerClient();

  const [{ data: rails }, { data: companiesRaw }] = await Promise.all([
    db.from('rails').select('id, initiative_name, closed_at, company_id, companies(id, name)').order('created_at', { ascending: true }),
    db.from('companies').select('id, name').order('name'),
  ]);

  // Group rails by company
  type RailRow = { id: string; initiative_name: string; closed_at: string | null; company_id: string; companies: { id: string; name: string } | { id: string; name: string }[] | null };
  const byCompany = new Map<string, CompanyEntry>();
  for (const rail of (rails ?? []) as RailRow[]) {
    const company = Array.isArray(rail.companies) ? rail.companies[0] : rail.companies;
    if (!company) continue;
    if (!byCompany.has(company.id)) {
      byCompany.set(company.id, { id: company.id, name: company.name, rails: [] });
    }
    byCompany.get(company.id)!.rails.push({
      id: rail.id,
      initiative_name: rail.initiative_name,
      closed_at: rail.closed_at ?? null,
    });
  }

  const companies = (companiesRaw ?? []) as Pick<Company, 'id' | 'name'>[];
  const companyList = Array.from(byCompany.values());

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav activePath="/" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">All RAILs</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Duncan Aviation — OEM Strategic Initiatives
            </p>
          </div>
          <HomeAdminPanel companies={companies} />
        </div>

        {companyList.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 px-6 py-10 text-center text-zinc-400">
            No RAILs yet. Add companies and RAILs via the Admin panel.
          </div>
        ) : (
          <RailList companies={companyList} />
        )}
      </div>
    </div>
  );
}
