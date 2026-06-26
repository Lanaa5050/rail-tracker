'use client';

import { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import type { CustomColumn, CustomColumnDataType } from '@/types/database';

const DATA_TYPE_LABELS: Record<CustomColumnDataType, string> = {
  text: 'Text',
  date: 'Date',
  dropdown: 'Dropdown',
  person: 'Person',
  number: 'Number',
  yes_no: 'Yes / No',
  link: 'Link',
};

interface Props {
  companyId: string;
  allColumns: CustomColumn[];
  hiddenColumnIds: Set<string>;
  onColumnAdded: (col: CustomColumn) => void;
  onVisibilityChanged: (columnId: string, hidden: boolean) => void;
}

// ─── PIN gate ─────────────────────────────────────────────────────────────────

function PinGate({ onUnlocked }: { onUnlocked: () => void }) {
  const { unlock } = useAdmin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (unlock(pin)) {
      onUnlocked();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-6">
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
      <button
        onClick={submit}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
      >
        Unlock
      </button>
    </div>
  );
}

// ─── Add column form ──────────────────────────────────────────────────────────

function AddColumnForm({ onAdded }: { onAdded: (col: CustomColumn) => void }) {
  const [label, setLabel] = useState('');
  const [dataType, setDataType] = useState<CustomColumnDataType>('text');
  const [dropdownRaw, setDropdownRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!label.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const dropdownOptions =
        dataType === 'dropdown'
          ? dropdownRaw.split(',').map(s => s.trim()).filter(Boolean)
          : null;

      const res = await fetch('/api/custom-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), data_type: dataType, dropdown_options: dropdownOptions }),
      });
      if (!res.ok) throw new Error(await res.text());
      const col: CustomColumn = await res.json();
      onAdded(col);
      setLabel('');
      setDataType('text');
      setDropdownRaw('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">Add Global Column</p>
      <div className="flex flex-col gap-2">
        <input
          className="text-sm border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="Column label"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <select
          className="text-sm border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={dataType}
          onChange={e => setDataType(e.target.value as CustomColumnDataType)}
        >
          {(Object.entries(DATA_TYPE_LABELS) as [CustomColumnDataType, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {dataType === 'dropdown' && (
          <input
            className="text-sm border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Options: Option A, Option B, …"
            value={dropdownRaw}
            onChange={e => setDropdownRaw(e.target.value)}
          />
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={submit}
          disabled={saving || !label.trim()}
          className="self-start px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add Column'}
        </button>
      </div>
    </div>
  );
}

// ─── Visibility row ───────────────────────────────────────────────────────────

function VisibilityRow({
  column, hidden, companyId, onChange,
}: {
  column: CustomColumn; hidden: boolean; companyId: string;
  onChange: (hidden: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/column-visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_column_id: column.id, hidden: !hidden }),
      });
      if (!res.ok) throw new Error(await res.text());
      onChange(!hidden);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-zinc-700">
        {column.label}
        <span className="ml-1.5 text-xs text-zinc-400">{DATA_TYPE_LABELS[column.data_type]}</span>
      </span>
      <button
        onClick={toggle}
        disabled={saving}
        className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
          hidden
            ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        } disabled:opacity-50`}
      >
        {hidden ? 'Hidden' : 'Visible'}
      </button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminPanel({
  companyId, allColumns, hiddenColumnIds, onColumnAdded, onVisibilityChanged,
}: Props) {
  const { isAdmin, lock } = useAdmin();
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(isAdmin);

  const handleToggle = () => setOpen(o => !o);

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
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
              <AddColumnForm onAdded={col => { onColumnAdded(col); }} />

              {allColumns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                    Column Visibility — This Company
                  </p>
                  <div className="divide-y divide-zinc-100">
                    {allColumns.map(col => (
                      <VisibilityRow
                        key={col.id}
                        column={col}
                        hidden={hiddenColumnIds.has(col.id)}
                        companyId={companyId}
                        onChange={hidden => onVisibilityChanged(col.id, hidden)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
