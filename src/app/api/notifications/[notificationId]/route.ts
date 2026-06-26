import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ notificationId: string }> };

// PATCH /api/notifications/:id — mark single notification as read
export async function PATCH(_req: NextRequest, { params }: Params) {
  const { notificationId } = await params;
  const db = createServerClient();

  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
