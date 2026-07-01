export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import RailSidebar from '@/components/RailSidebar';
import { SidebarProvider } from '@/context/SidebarContext';
import type { SidebarCompany } from '@/components/RailSidebar';
import type { Company, Rail } from '@/types/database';

type RailWithCompany = Rail & { companies: Pick<Company, 'id' | 'name'> | null };

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
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <RailSidebar companies={companies} currentRailId={railId} />
        <main className="flex-1 min-w-0 min-h-0 flex flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
