/**
 * Seed script — run once against your Supabase project to populate test data.
 * Usage: npx tsx src/lib/db-seed.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function seed() {
  // Insert companies
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .insert([
      { name: 'Honeywell' },
      { name: 'GE Aviation' },
      { name: 'Pratt & Whitney' },
    ])
    .select();
  if (compErr) throw compErr;
  console.log('Inserted companies:', companies?.map((c) => c.name));

  // Insert rails for each company
  const railInserts = companies!.flatMap((co) => [
    { company_id: co.id, initiative_name: `${co.name} — Initiative A` },
    { company_id: co.id, initiative_name: `${co.name} — Initiative B` },
  ]);

  const { data: rails, error: railErr } = await supabase
    .from('rails')
    .insert(railInserts)
    .select();
  if (railErr) throw railErr;
  console.log('Inserted rails:', rails?.length);

  // Insert a few rail items into the first rail
  const firstRail = rails![0];
  const { error: itemErr } = await supabase.from('rail_items').insert([
    {
      rail_id: firstRail.id,
      priority: 1,
      action: 'Review updated contract terms',
      owner: 'Aaron Lane',
      notes: 'See shared folder for draft',
      due_date: '2026-07-15',
      status: 'In Work',
    },
    {
      rail_id: firstRail.id,
      priority: 2,
      action: 'Schedule engineering review meeting',
      owner: 'Jane Smith',
      notes: '',
      due_date: '2026-07-01',
      status: 'New',
    },
    {
      rail_id: firstRail.id,
      priority: 3,
      action: 'Update part number cross-reference table',
      owner: 'Bob Johnson',
      notes: 'Low priority, can wait until Q3',
      due_date: null,
      status: 'On Hold',
    },
  ]);
  if (itemErr) throw itemErr;
  console.log('Inserted rail items into', firstRail.initiative_name);

  // Insert a sample invite token
  const { error: tokenErr } = await supabase.from('invite_tokens').insert({
    token: 'dev-token-x7f2k9mplaceholder',
    label: 'Development access',
  });
  if (tokenErr) throw tokenErr;
  console.log('Inserted invite token');

  console.log('✓ Seed complete');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
