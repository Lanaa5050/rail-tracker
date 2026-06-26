'use client';

import { useState } from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';

export interface SidebarRail {
  id: string;
  initiative_name: string;
}

export interface SidebarCompany {
  id: string;
  name: string;
  rails: SidebarRail[];
}

interface Props {
  companies: SidebarCompany[];
  currentRailId: string;
}

export default function RailSidebar({ companies, currentRailId }: Props) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 py-2">
      {/* Global views */}
      <div className="px-1 pb-1 flex flex-col gap-0.5">
        {[
          { href: '/', label: 'All RAILs' },
          { href: '/priority-board', label: 'Priority Board' },
          { href: '/my-actions', label: 'My Actions' },
          { href: '/rollup', label: 'Team Rollup' },
          { href: '/calendar', label: 'Calendar' },
          { href: '/reports', label: 'Reports' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="block px-3 py-1.5 text-sm rounded-md text-zinc-600 hover:bg-zinc-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="mx-3 border-t border-zinc-100 my-1" />

      {companies.map(company => (
        <div key={company.id}>
          <p className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 truncate">
            {company.name}
          </p>
          {company.rails.map(rail => {
            const active = rail.id === currentRailId;
            return (
              <Link
                key={rail.id}
                href={`/rail/${rail.id}`}
                className={[
                  'block px-3 py-1.5 text-sm rounded-md mx-1 truncate transition-colors',
                  active
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-zinc-700 hover:bg-zinc-100',
                ].join(' ')}
                onClick={() => setOpen(false)}
              >
                {rail.initiative_name}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center gap-3 bg-white border-b border-zinc-200 px-4 py-2.5">
        <button
          onClick={() => setOpen(o => !o)}
          className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100"
          aria-label="Toggle navigation"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <span className="text-sm font-semibold text-zinc-700">RAIL Tracker</span>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={[
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 overflow-y-auto transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <span className="text-sm font-bold text-zinc-800">RAIL Tracker</span>
          <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
        </div>
        {nav}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-200 bg-white overflow-y-auto">
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-zinc-800 hover:text-blue-700">
            RAIL Tracker
          </Link>
          <NotificationBell />
        </div>
        {nav}
      </aside>
    </>
  );
}
