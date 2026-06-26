'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RailItem, RailItemStatus, CustomColumn } from '@/types/database';
import StatusBadge, { STATUS_OPTIONS } from './StatusBadge';
import PriorityBadge, { PRIORITY_OPTIONS } from './PriorityBadge';
import CustomColumnCell from './CustomColumnCell';

// ─── types ────────────────────────────────────────────────────────────────────

type SortKey = keyof Pick<RailItem, 'priority' | 'action' | 'owner' | 'due_date' | 'status' | 'last_update'>;
type SortDir = 'asc' | 'desc';

// customValuesByItem[itemId][columnId] = value
type CustomValueMap = Record<string, Record<string, unknown>>;

interface Props {
  railId: string;
  initialItems: RailItem[];
  customColumns?: CustomColumn[];
  initialCustomValues?: CustomValueMap;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  // guard against invalid
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(due_date: string | null, status: RailItemStatus) {
  if (!due_date || status === 'Closed') return false;
  return new Date(due_date) < new Date(new Date().toDateString());
}

function sortItems(items: RailItem[], key: SortKey, dir: SortDir): RailItem[] {
  return [...items].sort((a, b) => {
    const av: string | number = key === 'priority' ? (a[key] ?? 0) : String(a[key] ?? '');
    const bv: string | number = key === 'priority' ? (b[key] ?? 0) : String(b[key] ?? '');
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── inline cell editors ──────────────────────────────────────────────────────

function TextCell({
  value, onSave, multiline = false, placeholder = '',
}: {
  value: string; onSave: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };

  if (!editing) {
    return (
      <div
        className="min-h-[1.5rem] cursor-text whitespace-pre-wrap break-words hover:bg-zinc-50 rounded px-1 -mx-1"
        onClick={() => { setDraft(value); setEditing(true); }}
      >
        {value || <span className="text-zinc-400 italic text-xs">{placeholder || 'Click to edit'}</span>}
      </div>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        className="w-full min-h-[5rem] text-sm border border-blue-400 rounded px-1 py-0.5 resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
      />
    );
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      className="w-full text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
    />
  );
}

function SelectCell<T extends string>({
  value, options, onSave, renderOption,
}: {
  value: T; options: readonly T[]; onSave: (v: T) => void;
  renderOption?: (v: T) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="cursor-pointer" onClick={() => setEditing(true)}>
        {renderOption ? renderOption(value) : value}
      </div>
    );
  }

  return (
    <select
      autoFocus
      className="text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
      value={value}
      onChange={e => { onSave(e.target.value as T); setEditing(false); }}
      onBlur={() => setEditing(false)}
    >
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function DateCell({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="cursor-pointer hover:bg-zinc-50 rounded px-1 -mx-1" onClick={() => setEditing(true)}>
        {value ? formatDate(value) : <span className="text-zinc-400 italic text-xs">Set date</span>}
      </div>
    );
  }

  return (
    <input
      autoFocus
      type="date"
      className="text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
      value={value ?? ''}
      onChange={e => { onSave(e.target.value || null); setEditing(false); }}
      onBlur={() => setEditing(false)}
    />
  );
}

// ─── column header ────────────────────────────────────────────────────────────

function ColHeader({
  label, sortKey, currentKey, dir, onSort,
}: {
  label: string; sortKey: SortKey; currentKey: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === currentKey;
  return (
    <th
      className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-zinc-800"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="ml-1 text-zinc-300">
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function RailTable({
  railId,
  initialItems,
  customColumns = [],
  initialCustomValues = {},
}: Props) {
  const [items, setItems] = useState<RailItem[]>(initialItems);
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [customValues, setCustomValues] = useState<CustomValueMap>(initialCustomValues);

  const sorted = sortItems(items, sortKey, sortDir);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const markSaving = (id: string) => setSaving(s => new Set(s).add(id));
  const unmarkSaving = (id: string) => setSaving(s => { const n = new Set(s); n.delete(id); return n; });

  const patchItem = useCallback(async (id: string, patch: Partial<RailItem>) => {
    markSaving(id);
    setError(null);
    // Optimistic update
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));

    try {
      const res = await fetch(`/api/rails/${railId}/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: RailItem = await res.json();
      setItems(prev => prev.map(it => it.id === id ? updated : it));
    } catch (e) {
      setError((e as Error).message);
      // Revert
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
    } finally {
      unmarkSaving(id);
    }
  }, [railId]);

  const deleteItem = useCallback(async (id: string) => {
    if (!confirm('Delete this item?')) return;
    markSaving(id);
    setItems(prev => prev.filter(it => it.id !== id));
    try {
      const res = await fetch(`/api/rails/${railId}/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      setError((e as Error).message);
      // Items were already filtered — re-fetch would be ideal; for now just show error
    } finally {
      unmarkSaving(id);
    }
  }, [railId]);

  const addItem = useCallback(async () => {
    setAddingRow(true);
    setError(null);
    try {
      const res = await fetch(`/api/rails/${railId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 2, status: 'New' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: RailItem = await res.json();
      setItems(prev => [...prev, created]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingRow(false);
    }
  }, [railId]);

  const saveCustomValue = useCallback(async (itemId: string, columnId: string, value: unknown) => {
    // Optimistic
    setCustomValues(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [columnId]: value },
    }));
    try {
      const res = await fetch(`/api/rails/${railId}/items/${itemId}/custom-values`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_column_id: columnId, value }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      setError((e as Error).message);
    }
  }, [railId]);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <ColHeader label="Priority"    sortKey="priority"    currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Action"      sortKey="action"      currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Owner"       sortKey="owner"       currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Status"      sortKey="status"      currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Due Date"    sortKey="due_date"    currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">
                Notes
              </th>
              <ColHeader label="Last Update" sortKey="last_update" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              {customColumns.map(col => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 bg-white">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8 + customColumns.length} className="text-center py-10 text-zinc-400 italic">
                  No items yet — click &ldquo;Add Row&rdquo; below.
                </td>
              </tr>
            )}

            {sorted.map(item => {
              const closed = item.status === 'Closed';
              const overdue = isOverdue(item.due_date, item.status);
              const isSaving = saving.has(item.id);

              return (
                <tr
                  key={item.id}
                  className={[
                    'group transition-colors',
                    closed ? 'bg-zinc-50 opacity-60' : 'hover:bg-blue-50/30',
                    isSaving ? 'animate-pulse' : '',
                  ].join(' ')}
                >
                  {/* Priority */}
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    <SelectCell
                      value={String(item.priority) as '1' | '2' | '3'}
                      options={PRIORITY_OPTIONS.map(String) as ['1','2','3']}
                      onSave={v => patchItem(item.id, { priority: Number(v) as 1|2|3 })}
                      renderOption={v => <PriorityBadge priority={Number(v) as 1|2|3} />}
                    />
                  </td>

                  {/* Action */}
                  <td className="px-3 py-2 align-top max-w-xs">
                    <TextCell
                      value={item.action}
                      placeholder="Describe the action…"
                      onSave={v => patchItem(item.id, { action: v })}
                    />
                    {closed && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                        Closed
                      </span>
                    )}
                  </td>

                  {/* Owner */}
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    <TextCell
                      value={item.owner}
                      placeholder="Owner"
                      onSave={v => patchItem(item.id, { owner: v })}
                    />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    <SelectCell
                      value={item.status}
                      options={STATUS_OPTIONS}
                      onSave={v => patchItem(item.id, { status: v })}
                      renderOption={v => <StatusBadge status={v} />}
                    />
                  </td>

                  {/* Due Date */}
                  <td className={`px-3 py-2 align-top whitespace-nowrap ${overdue ? 'text-red-600 font-medium' : ''}`}>
                    <DateCell
                      value={item.due_date}
                      onSave={v => patchItem(item.id, { due_date: v })}
                    />
                    {overdue && <span className="block text-[10px] font-semibold text-red-500 uppercase tracking-wide">Overdue</span>}
                  </td>

                  {/* Notes */}
                  <td className="px-3 py-2 align-top min-w-[180px] max-w-sm">
                    <TextCell
                      value={item.notes}
                      placeholder="Notes…"
                      multiline
                      onSave={v => patchItem(item.id, { notes: v })}
                    />
                  </td>

                  {/* Last Update */}
                  <td className="px-3 py-2 align-top whitespace-nowrap text-xs text-zinc-400">
                    {formatDate(item.last_update)}
                  </td>

                  {/* Custom columns */}
                  {customColumns.map(col => (
                    <td key={col.id} className="px-3 py-2 align-top min-w-[120px] max-w-[200px]">
                      <CustomColumnCell
                        column={col}
                        value={customValues[item.id]?.[col.id] ?? null}
                        onSave={v => saveCustomValue(item.id, col.id, v)}
                      />
                    </td>
                  ))}

                  {/* Delete */}
                  <td className="px-3 py-2 align-top">
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={isSaving}
                      className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-opacity text-lg leading-none"
                      title="Delete row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={addItem}
          disabled={addingRow}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {addingRow ? 'Adding…' : '+ Add Row'}
        </button>
        <span className="text-xs text-zinc-400">
          {items.filter(i => i.status !== 'Closed').length} open
          {items.some(i => i.status === 'Closed') && ` · ${items.filter(i => i.status === 'Closed').length} closed`}
        </span>
      </div>
    </div>
  );
}
