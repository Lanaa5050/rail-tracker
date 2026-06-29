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

export default function HomeAdminPanel({ companies }: { companies: Company[] }) {
  const { isAdmin, lock } = useAdmin();
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(isAdmin);
  const router = useRouter();

  // Company form
  const [companyName, setCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // RAIL form
  const [railName, setRailName] = useState('');
  const [railCompanyId, setRailCompanyId] = useState(companies[0]?.id ?? '');
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
      if (!res.ok) throw new Error(await res.text());
      setCompanyName('');
      router.refresh();
    } catch (e) {
      setCompanyError((e as Error).message);
    } finally {
      setAddingCompany(false);
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
      if (!res.ok) throw new Error(await res.text());
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
        <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white rounded-xl border border-zinc-200 shadow-lg p-4 flex flex-col gap-4">
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
                <input
                  className="text-sm border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Company name"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCompany()}
                />
                {companyError && <p className="text-xs text-red-500">{companyError}</p>}
                <button
                  onClick={addCompany}
                  disabled={addingCompany || !companyName.trim()}
                  className="self-start px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingCompany ? 'Adding…' : 'Add Company'}
                </button>
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
                  onChange={e => setRailName(e.target.value)}
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
