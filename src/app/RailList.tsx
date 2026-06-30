'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface RailEntry {
  id: string;
  initiative_name: string;
  closed_at: string | null;
}

export interface CompanyEntry {
  id: string;
  name: string;
  rails: RailEntry[];
}

export default function RailList({ companies }: { companies: CompanyEntry[] }) {
  const [showArchived, setShowArchived] = useState(false);

  const hasArchived = companies.some(c => c.rails.some(r => r.closed_at));

  return (
    <>
      {hasArchived && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowArchived(s => !s)}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {showArchived ? 'Hide archived RAILs' : 'Show archived RAILs'}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {companies.map(({ id: companyId, name, rails }) => {
          const visibleRails = showArchived ? rails : rails.filter(r => !r.closed_at);
          if (visibleRails.length === 0) return null;
          return (
            <div key={companyId} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-700">{name}</h2>
                {rails.filter(r => r.closed_at).length > 0 && !showArchived && (
                  <span className="text-xs text-zinc-400">
                    {rails.filter(r => r.closed_at).length} archived
                  </span>
                )}
              </div>
              <ul className="divide-y divide-zinc-100">
                {visibleRails.map(rail => (
                  <li key={rail.id}>
                    <Link
                      href={`/rail/${rail.id}`}
                      className={[
                        'flex items-center justify-between px-4 py-3 transition-colors group',
                        rail.closed_at
                          ? 'opacity-50 hover:bg-zinc-50'
                          : 'hover:bg-blue-50',
                      ].join(' ')}
                    >
                      <span className={[
                        'text-sm font-medium flex items-center gap-2',
                        rail.closed_at ? 'text-zinc-500' : 'text-zinc-800 group-hover:text-blue-700',
                      ].join(' ')}>
                        {rail.initiative_name}
                        {rail.closed_at && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">Archived</span>
                        )}
                      </span>
                      <span className="text-zinc-300 group-hover:text-blue-400 text-lg">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
