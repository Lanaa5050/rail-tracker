'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

type NotifType = 'due_soon_7' | 'due_soon_2' | 'overdue' | 'assigned' | 'status_changed';

interface RailItem {
  id: string;
  action: string;
  due_date: string | null;
  rail_id: string;
  rails: {
    initiative_name: string;
    companies: { name: string } | { name: string }[] | null;
  } | null;
}

interface Notification {
  id: string;
  type: NotifType;
  owner: string | null;
  read: boolean;
  created_at: string;
  rail_items: RailItem | null;
}

const TYPE_LABEL: Record<NotifType, string> = {
  due_soon_7: 'Due in 7 days',
  due_soon_2: 'Due in 2 days',
  overdue: 'Overdue',
  assigned: 'Assigned to you',
  status_changed: 'Status changed',
};

const TYPE_COLOR: Record<NotifType, string> = {
  due_soon_7: 'text-orange-600',
  due_soon_2: 'text-orange-700',
  overdue: 'text-red-600',
  assigned: 'text-blue-600',
  status_changed: 'text-zinc-600',
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=30');
      if (res.ok) setNotifs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { load(); }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getRailId = (n: Notification) => n.rail_items?.rail_id ?? '';
  const getCompany = (n: Notification) => {
    const c = n.rail_items?.rails?.companies;
    if (!c) return '';
    return Array.isArray(c) ? (c[0]?.name ?? '') : c.name;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 transition-colors"
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-96 max-h-[80vh] flex flex-col bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
            <span className="text-sm font-semibold text-zinc-800">
              Notifications {unread > 0 && <span className="text-red-500">({unread} unread)</span>}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading && notifs.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">Loading…</p>
            ) : notifs.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8 italic">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {notifs.map(n => {
                  const railId = getRailId(n);
                  const company = getCompany(n);
                  const railName = n.rail_items?.rails?.initiative_name ?? '';
                  const action = n.rail_items?.action ?? '';
                  return (
                    <li
                      key={n.id}
                      className={`px-4 py-3 hover:bg-zinc-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            <span className={`text-xs font-semibold uppercase tracking-wide ${TYPE_COLOR[n.type]}`}>
                              {TYPE_LABEL[n.type]}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-800 truncate">{action || '(no action text)'}</p>
                          {n.owner && <p className="text-xs text-zinc-500 mt-0.5">{n.owner}</p>}
                          {railId && (
                            <Link
                              href={`/rail/${railId}`}
                              className="text-xs text-blue-600 hover:underline mt-0.5 block truncate"
                              onClick={() => { markRead(n.id); setOpen(false); }}
                            >
                              {railName}{company ? ` · ${company}` : ''}
                            </Link>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-zinc-400 whitespace-nowrap">{formatRelative(n.created_at)}</span>
                          {!n.read && (
                            <button
                              onClick={() => markRead(n.id)}
                              className="text-[10px] text-zinc-400 hover:text-zinc-700"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 px-4 py-2 bg-zinc-50">
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
