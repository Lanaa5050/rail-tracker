import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/notifications?unread_only=true&owner=Aaron+Lane&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const unreadOnly = searchParams.get('unread_only') === 'true';
  const owner = searchParams.get('owner') ?? '';
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200);

  const db = createServerClient();

  let query = db
    .from('notifications')
    .select(`
      id,
      type,
      owner,
      read,
      created_at,
      rail_items (
        id,
        action,
        due_date,
        rail_id,
        rails ( initiative_name, companies ( name ) )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('read', false);
  if (owner) query = query.eq('owner', owner);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/notifications  — mark all as read (optionally filtered by owner)
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const db = createServerClient();

  let query = db.from('notifications').update({ read: true }).eq('read', false);
  if (body.owner) query = query.eq('owner', body.owner);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
