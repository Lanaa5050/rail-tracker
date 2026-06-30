export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import RailSidebar from '@/components/RailSidebar';
import type { SidebarCompany } from '@/components/RailSidebar';
import type { Company, Rail } from '@/types/database';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

// params is not used here — the sidebar shows all rails regardless of which one is active.
// The active highlight is handled client-side via currentRailId prop derived from the URL.
export default async function RailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ railId: string }>;
}) {
  const { railId } = await params;
  const db = createServerClient();

  const { data: rails } = await db
    .from('rails')
    .select('*, companies(id, name)')
    .order('created_at', { ascending: true });

  // Group by company, preserving insertion order
  const companyMap = new Map<string, SidebarCompany>();
  for (const rail of (rails ?? []) as RailWithCompany[]) {
    const company = rail.companies;
    if (!company) continue;
    if (!companyMap.has(company.id)) {
      companyMap.set(company.id, { id: company.id, name: company.name, rails: [] });
    }
    companyMap.get(company.id)!.rails.push({
      id: rail.id,
      initiative_name: rail.initiative_name,
    });
  }

  const companies = Array.from(companyMap.values());

  return (
    <div className="relative flex h-screen overflow-hidden">
      <RailSidebar companies={companies} currentRailId={railId} />
      <main className="flex-1 overflow-y-auto min-w-0 pt-0">
        {children}
      </main>
    </div>
  );
}
