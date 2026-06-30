'use client';

import { useState, useMemo } from 'react';
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
  const [search, setSearch] = useState('');
  const [sortAZ, setSortAZ] = useState(true);

  const hasArchived = companies.some(c => c.rails.some(r => r.closed_at));
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = companies.map(company => {
      let rails = showArchived ? company.rails : company.rails.filter(r => !r.closed_at);
      if (query) rails = rails.filter(r => r.initiative_name.toLowerCase().includes(query));
      return { ...company, rails };
    }).filter(c => c.rails.length > 0);

    list = [...list].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAZ ? cmp : -cmp;
    });

    return list;
  }, [companies, showArchived, query, sortAZ]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search initiatives…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
          )}
        </div>

        <button
          onClick={() => setSortAZ(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 text-zinc-600 whitespace-nowrap transition-colors"
          title="Sort companies"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {sortAZ ? 'A → Z' : 'Z → A'}
        </button>

        {hasArchived && (
          <button
            onClick={() => setShowArchived(s => !s)}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 text-zinc-500 whitespace-nowrap transition-colors"
          >
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 px-6 py-10 text-center text-zinc-400">
          {query ? `No initiatives matching "${search}"` : 'No RAILs to show.'}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.map(({ id: companyId, name, rails }) => {
            const archivedCount = companies.find(c => c.id === companyId)?.rails.filter(r => r.closed_at).length ?? 0;
            return (
              <div key={companyId} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <div className="px-4 pt-2 pb-0 bg-zinc-50 border-b border-zinc-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Company</p>
                  <div className="flex items-center justify-between pb-2">
                    <h2 className="text-sm font-semibold text-zinc-700">{name}</h2>
                    {archivedCount > 0 && !showArchived && (
                      <span className="text-xs text-zinc-400">{archivedCount} archived</span>
                    )}
                  </div>
                  <div className="px-0 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Initiative</p>
                  </div>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {rails.map(rail => (
                    <li key={rail.id}>
                      <Link
                        href={`/rail/${rail.id}`}
                        className={[
                          'flex items-center justify-between px-4 py-3 transition-colors group',
                          rail.closed_at ? 'opacity-50 hover:bg-zinc-50' : 'hover:bg-blue-50',
                        ].join(' ')}
                      >
                        <span className={[
                          'text-sm font-medium flex items-center gap-2',
                          rail.closed_at ? 'text-zinc-500' : 'text-zinc-800 group-hover:text-blue-700',
                        ].join(' ')}>
                          {query ? (
                            <HighlightMatch text={rail.initiative_name} query={query} />
                          ) : (
                            rail.initiative_name
                          )}
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
      )}
    </>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-zinc-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
