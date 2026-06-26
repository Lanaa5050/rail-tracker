import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ companyId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { companyId } = await params;
  const db = createServerClient();

  const { data, error } = await db
    .from('company_column_visibility')
    .select('*')
    .eq('company_id', companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH body: { custom_column_id: string, hidden: boolean }
export async function PATCH(req: NextRequest, { params }: Params) {
  const { companyId } = await params;
  const { custom_column_id, hidden } = await req.json();
  const db = createServerClient();

  const { data, error } = await db
    .from('company_column_visibility')
    .upsert(
      { company_id: companyId, custom_column_id, hidden },
      { onConflict: 'company_id,custom_column_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
