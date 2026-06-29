export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import type { Company, Rail } from '@/types/database';
import TopNav from '@/components/TopNav';
import HomeAdminPanel from './HomeAdminPanel';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

export default async function Home() {
  const db = createServerClient();

  const [{ data: rails }, { data: companiesRaw }] = await Promise.all([
    db.from('rails').select('*, companies(id, name)').order('created_at', { ascending: true }),
    db.from('companies').select('id, name').order('name'),
  ]);

  // Group by company
  const byCompany = new Map<string, { name: string; rails: RailWithCompany[] }>();
  for (const rail of (rails ?? []) as RailWithCompany[]) {
    const company = rail.companies;
    if (!company) continue;
    if (!byCompany.has(company.id)) {
      byCompany.set(company.id, { name: company.name, rails: [] });
    }
    byCompany.get(company.id)!.rails.push(rail);
  }

  const companies = (companiesRaw ?? []) as Pick<Company, 'id' | 'name'>[];

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

        {byCompany.size === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 px-6 py-10 text-center text-zinc-400">
            No RAILs yet. Add companies and RAILs via the Admin panel.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Array.from(byCompany.entries()).map(([companyId, { name, rails }]) => (
              <div key={companyId} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200">
                  <h2 className="text-sm font-semibold text-zinc-700">{name}</h2>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {rails.map(rail => (
                    <li key={rail.id}>
                      <Link
                        href={`/rail/${rail.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors group"
                      >
                        <span className="text-sm font-medium text-zinc-800 group-hover:text-blue-700">
                          {rail.initiative_name}
                        </span>
                        <span className="text-zinc-300 group-hover:text-blue-400 text-lg">›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
