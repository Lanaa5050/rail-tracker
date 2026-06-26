'use client';

import { useState } from 'react';
import type { CustomColumn } from '@/types/database';

interface Props {
  column: CustomColumn;
  value: unknown;
  onSave: (value: unknown) => void;
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  return String(v);
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomColumnCell({ column, value, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(asString(value));

  const commit = (newVal: unknown) => {
    setEditing(false);
    if (newVal !== value) onSave(newVal);
  };

  const placeholder = <span className="text-zinc-400 italic text-xs">—</span>;

  // ── yes/no toggle ────────────────────────────────────────────────────────────
  if (column.data_type === 'yes_no') {
    const checked = value === true || value === 'true' || value === 'yes';
    return (
      <button
        className={`w-8 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-zinc-200'}`}
        onClick={() => onSave(!checked)}
        title={checked ? 'Yes' : 'No'}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white shadow mx-0.5 transition-transform ${checked ? 'translate-x-3' : ''}`}
        />
      </button>
    );
  }

  // ── dropdown ─────────────────────────────────────────────────────────────────
  if (column.data_type === 'dropdown') {
    const options: string[] = column.dropdown_options ?? [];
    if (editing) {
      return (
        <select
          autoFocus
          className="text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
          value={asString(value)}
          onChange={e => commit(e.target.value)}
          onBlur={() => setEditing(false)}
        >
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <div className="cursor-pointer hover:bg-zinc-50 rounded px-1 -mx-1" onClick={() => setEditing(true)}>
        {asString(value) || placeholder}
      </div>
    );
  }

  // ── date ─────────────────────────────────────────────────────────────────────
  if (column.data_type === 'date') {
    if (editing) {
      return (
        <input
          autoFocus
          type="date"
          className="text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
          value={asString(value)}
          onChange={e => commit(e.target.value || null)}
          onBlur={() => setEditing(false)}
        />
      );
    }
    return (
      <div className="cursor-pointer hover:bg-zinc-50 rounded px-1 -mx-1" onClick={() => setEditing(true)}>
        {asString(value) ? formatDate(asString(value)) : placeholder}
      </div>
    );
  }

  // ── number ───────────────────────────────────────────────────────────────────
  if (column.data_type === 'number') {
    if (editing) {
      return (
        <input
          autoFocus
          type="number"
          className="w-24 text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => commit(draft === '' ? null : Number(draft))}
          onKeyDown={e => {
            if (e.key === 'Enter') commit(draft === '' ? null : Number(draft));
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      );
    }
    return (
      <div className="cursor-pointer hover:bg-zinc-50 rounded px-1 -mx-1" onClick={() => { setDraft(asString(value)); setEditing(true); }}>
        {value !== null && value !== undefined && value !== '' ? asString(value) : placeholder}
      </div>
    );
  }

  // ── link ─────────────────────────────────────────────────────────────────────
  if (column.data_type === 'link') {
    if (editing) {
      return (
        <input
          autoFocus
          type="url"
          placeholder="https://…"
          className="w-full text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { commit(draft || null); }}
          onKeyDown={e => {
            if (e.key === 'Enter') commit(draft || null);
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      );
    }
    const url = asString(value);
    return url
      ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs truncate max-w-[140px] block">{url}</a>
      : <div className="cursor-pointer hover:bg-zinc-50 rounded px-1 -mx-1" onClick={() => { setDraft(''); setEditing(true); }}>{placeholder}</div>;
  }

  // ── text / person (default) ───────────────────────────────────────────────────
  if (editing) {
    return (
      <input
        autoFocus
        className="w-full text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => commit(draft || null)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(draft || null);
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-[1.5rem] cursor-text hover:bg-zinc-50 rounded px-1 -mx-1"
      onClick={() => { setDraft(asString(value)); setEditing(true); }}
    >
      {asString(value) || placeholder}
    </div>
  );
}
