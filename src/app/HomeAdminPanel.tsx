'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

interface Company { id: string; name: string; }

function PinGate({ onUnlocked }: { onUnlocked: () => void }) {
  const { unlock } = useAdmin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (unlock(pin)) { onUnlocked(); }
    else { setError(true); setPin(''); }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm text-zinc-600 font-medium">Enter Admin PIN</p>
      <input
        type="password"
        inputMode="numeric"
        maxLength={8}
        placeholder="••••"
        className={`w-28 text-center text-lg border rounded px-3 py-2 tracking-widest focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-300' : 'border-zinc-300 focus:ring-blue-300'}`}
        value={pin}
        onChange={e => { setPin(e.target.value); setError(false); }}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus
      />
      {error && <p className="text-xs text-red-500">Incorrect PIN</p>}
      <button onClick={submit} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
        Unlock
      </button>
    </div>
  );
}

export default function HomeAdminPanel({ companies: initialCompanies }: { companies: Company[] }) {
  const { isAdmin, lock } = useAdmin();
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(isAdmin);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const router = useRouter();

  // Company form
  const [companyName, setCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // RAIL form
  const [railName, setRailName] = useState('');
  const [railCompanyId, setRailCompanyId] = useState(initialCompanies[0]?.id ?? '');
  const [addingRail, setAddingRail] = useState(false);
  const [railError, setRailError] = useState<string | null>(null);

  const addCompany = async () => {
    if (!companyName.trim()) return;
    setAddingCompany(true);
    setCompanyError(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? res.statusText);
      }
      const newCompany: Company = await res.json();
      setCompanies(prev => [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name)));
      if (!railCompanyId) setRailCompanyId(newCompany.id);
      setCompanyName('');
      router.refresh();
    } catch (e) {
      setCompanyError((e as Error).message);
    } finally {
      setAddingCompany(false);
    }
  };

  const deleteCompany = async (id: string) => {
    if (!confirm('Delete this company and all its RAILs and items? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? res.statusText);
      }
      setCompanies(prev => prev.filter(c => c.id !== id));
      if (railCompanyId === id) setRailCompanyId(companies.find(c => c.id !== id)?.id ?? '');
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const addRail = async () => {
    if (!railName.trim() || !railCompanyId) return;
    setAddingRail(true);
    setRailError(null);
    try {
      const res = await fetch('/api/rails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: railCompanyId, initiative_name: railName.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? res.statusText);
      }
      setRailName('');
      router.refresh();
    } catch (e) {
      setRailError((e as Error).message);
    } finally {
      setAddingRail(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors"
      >
        <span>⚙</span> Admin
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white rounded-xl border border-zinc-200 shadow-lg p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-800">Admin Panel</span>
            <div className="flex items-center gap-2">
              {unlocked && (
                <button onClick={() => { lock(); setUnlocked(false); }} className="text-xs text-zinc-400 hover:text-zinc-600">
                  Lock
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
            </div>
          </div>

          {!unlocked ? (
            <PinGate onUnlocked={() => setUnlocked(true)} />
          ) : (
            <>
              {/* Add Company */}
              <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Add Company</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="Company name"
                    value={companyName}
                    onChange={e => { setCompanyName(e.target.value); setCompanyError(null); }}
                    onKeyDown={e => e.key === 'Enter' && addCompany()}
                  />
                  <button
                    onClick={addCompany}
                    disabled={addingCompany || !companyName.trim()}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 shrink-0"
                  >
                    {addingCompany ? '…' : 'Add'}
                  </button>
                </div>
                {companyError && <p className="text-xs text-red-500">{companyError}</p>}

                {/* Company list with delete */}
                {companies.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {companies.map(c => (
                      <div key={c.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-100 group">
                        <span className="text-sm text-zinc-700 truncate">{c.name}</span>
                        <button
                          onClick={() => deleteCompany(c.id)}
                          disabled={deletingId === c.id}
                          className="text-zinc-300 hover:text-red-500 group-hover:text-zinc-400 text-xs ml-2 shrink-0 disabled:opacity-50"
                          title="Delete company"
                        >
                          {deletingId === c.id ? '…' : '✕'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add RAIL */}
              <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Add RAIL</p>
                <select
                  className="text-sm border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={railCompanyId}
                  onChange={e => setRailCompanyId(e.target.value)}
                >
                  {companies.length === 0 && <option value="">— add a company first —</option>}
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  className="text-sm border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Initiative name"
                  value={railName}
                  onChange={e => { setRailName(e.target.value); setRailError(null); }}
                  onKeyDown={e => e.key === 'Enter' && addRail()}
                />
                {railError && <p className="text-xs text-red-500">{railError}</p>}
                <button
                  onClick={addRail}
                  disabled={addingRail || !railName.trim() || !railCompanyId}
                  className="self-start px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingRail ? 'Adding…' : 'Add RAIL'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
