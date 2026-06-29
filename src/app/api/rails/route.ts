import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { company_id, initiative_name } = await req.json();
  if (!company_id || !initiative_name?.trim()) {
    return NextResponse.json({ error: 'company_id and initiative_name required' }, { status: 400 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('rails')
    .insert({ company_id, initiative_name: initiative_name.trim() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
