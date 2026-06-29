import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const db = createServerClient();

  // Duplicate check (case-insensitive)
  const { data: existing } = await db
    .from('companies')
    .select('id')
    .ilike('name', name.trim())
    .maybeSingle();
  if (existing) return NextResponse.json({ error: `"${name.trim()}" already exists` }, { status: 409 });

  const { data, error } = await db.from('companies').insert({ name: name.trim() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db.from('companies').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
