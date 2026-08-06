// src/pages/herd-health/HerdResourcePage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { endpoints } from '../../config/api';
import HerdHealthLayout from './HerdHealthLayout';
import { useHerdBusinessId } from './useHerdBusinessId';
import { HerdFormSections } from './HerdFormFields';
import { herdAuthHeaders } from './herdAuth';
import {
  blankForm,
  buildPayload,
  formatDisplayDate,
  flattenFields,
  rowToForm,
  validateForm,
} from './herdUtils';
import { notifyHerdHealthChanged } from './herdLive';

const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

function cellValue(row, col) {
  const v = row[col.key];
  if (v == null || v === '') return '—';
  if (col.format === 'bool') return v ? 'Yes' : 'No';
  if (col.format === 'date') return formatDisplayDate(v);
  if (col.format === 'money') {
    const n = Number(v);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(v);
  }
  return String(v);
}

export default function HerdResourcePage({ config }) {
  const { t } = useTranslation();
  const { businessId } = useHerdBusinessId();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const title = t(config.titleKey, config.title);
  const emptyLabel = t(
    config.emptyKey || 'herd_health.empty',
    config.emptyText || `No records yet — Add ${config.title.toLowerCase()}.`,
  );

  const load = useCallback(() => {
    if (!businessId) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    fetch(endpoints.herdHealthList(config.resource, businessId), {
      headers: herdAuthHeaders(),
      cache: 'no-store',
    })
      .then(async (r) => {
        if (r.status === 401) throw new Error('auth');
        if (r.status === 403) throw new Error('forbidden');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err.message === 'auth') {
          setError(t('herd_health.auth_error', 'Please sign in again to load herd health.'));
        } else if (err.message === 'forbidden') {
          setError(t('herd_health.forbidden', 'You do not have access to this business.'));
        } else {
          setError(t('herd_health.error', 'Could not load data. Please try again.'));
        }
      })
      .finally(() => setLoading(false));
  }, [businessId, config.resource, t]);

  useEffect(() => {
    setMode(null);
    setEditing(null);
    setQuery('');
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const keys = config.searchKeys || config.columns.map((c) => c.key);
    return rows.filter((row) =>
      keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
    );
  }, [rows, query, config]);

  const openCreate = () => {
    setForm(blankForm(config));
    setFieldErrors({});
    setEditing(null);
    setMode('create');
    setError('');
  };

  const openEdit = (row) => {
    setForm(rowToForm(config, row));
    setFieldErrors({});
    setEditing(row);
    setMode('edit');
    setError('');
  };

  const onChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const save = async () => {
    if (!businessId) return;
    const missing = validateForm(config, form);
    if (missing.length) {
      const errs = {};
      flattenFields(config).forEach((f) => {
        if (f.required && (form[f.name] == null || form[f.name] === '')) {
          errs[f.name] = 'Required';
        }
      });
      setFieldErrors(errs);
      setError(
        t('herd_health.validation_error', 'Please fill required fields: {{fields}}', {
          fields: missing.join(', '),
        }),
      );
      return;
    }

    setSaving(true);
    setError('');
    try {
      const body = buildPayload(config, form);
      let res;
      if (mode === 'create') {
        res = await fetch(endpoints.herdHealthCreate(config.resource, businessId), {
          method: 'POST',
          headers: herdAuthHeaders(true),
          body: JSON.stringify(body),
        });
      } else {
        const id = editing?.[config.idKey];
        res = await fetch(endpoints.herdHealthItem(config.resource, id), {
          method: 'PUT',
          headers: herdAuthHeaders(true),
          body: JSON.stringify(body),
        });
      }
      if (res.status === 401) throw new Error('auth');
      if (res.status === 403) throw new Error('forbidden');
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(detail || `HTTP ${res.status}`);
      }
      notifyHerdHealthChanged({ resource: config.resource, action: mode });
      setMode(null);
      setEditing(null);
      setFieldErrors({});
      load();
    } catch (err) {
      if (err.message === 'auth') {
        setError(t('herd_health.auth_error', 'Please sign in again to save.'));
      } else if (err.message === 'forbidden') {
        setError(t('herd_health.forbidden', 'You do not have access to this business.'));
      } else {
        setError(t('herd_health.save_error', 'Could not save. Please try again.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const label = row[config.labelKey] || `#${row[config.idKey]}`;
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
    try {
      const res = await fetch(endpoints.herdHealthItem(config.resource, row[config.idKey]), {
        method: 'DELETE',
        headers: herdAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notifyHerdHealthChanged({ resource: config.resource, action: 'delete' });
      load();
    } catch {
      setError(t('herd_health.delete_error', 'Could not delete. Please try again.'));
    }
  };

  return (
    <HerdHealthLayout businessId={businessId} title={title}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold m-0" style={{ fontFamily: LORA, color: INK }}>
            {title}
          </h1>
          {!mode && businessId && rows.length > 0 && (
            <p className="text-xs m-0 mt-1" style={{ color: MUTED }}>
              {filtered.length === rows.length
                ? `${rows.length} record${rows.length === 1 ? '' : 's'}`
                : `${filtered.length} of ${rows.length} records`}
            </p>
          )}
        </div>
        {businessId && !mode && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white border-0 cursor-pointer"
            style={{ background: OLIVE }}
          >
            {t('herd_health.add', 'Add')} {config.singular || config.title}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {mode ? (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 md:p-5">
          <h2 className="text-base font-bold mb-4" style={{ color: INK, fontFamily: LORA }}>
            {mode === 'create'
              ? `${t('herd_health.create', 'Add')} ${config.singular || config.title}`
              : `${t('herd_health.edit', 'Edit')} ${config.singular || config.title}`}
          </h2>
          <HerdFormSections
            sections={config.sections}
            fields={config.fields}
            values={form}
            onChange={onChange}
            businessId={businessId}
            fieldErrors={fieldErrors}
          />
          <div className="flex flex-wrap gap-2 mt-6 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white border-0 cursor-pointer disabled:opacity-60"
              style={{ background: OLIVE }}
            >
              {saving ? t('herd_health.saving', 'Saving…') : t('herd_health.save', 'Save')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setMode(null);
                setEditing(null);
                setFieldErrors({});
                setError('');
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-transparent cursor-pointer border"
              style={{ color: INK, borderColor: 'rgba(0,0,0,0.15)' }}
            >
              {t('herd_health.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      ) : loading ? (
        <p className="text-sm" style={{ color: MUTED }}>
          {t('herd_health.loading', 'Loading…')}
        </p>
      ) : !rows.length ? (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-8 text-center">
          <p className="text-sm mb-4" style={{ color: MUTED }}>
            {emptyLabel}
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white border-0 cursor-pointer"
            style={{ background: OLIVE }}
          >
            {t('herd_health.add', 'Add')} {config.singular || config.title}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('herd_health.search_placeholder', 'Search records…')}
              className="w-full md:w-80 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#3d6b34]"
              style={{ color: INK }}
            />
          </div>
          {!filtered.length ? (
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 text-center">
              <p className="text-sm m-0" style={{ color: MUTED }}>
                {t('herd_health.no_search_matches', 'No records match your search.')}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    {config.columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2.5 text-[11px] font-bold tracking-wide uppercase"
                        style={{ color: MUTED }}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th
                      className="px-3 py-2.5 text-[11px] font-bold tracking-wide uppercase"
                      style={{ color: MUTED }}
                    >
                      {t('herd_health.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row[config.idKey]} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      {config.columns.map((col) => (
                        <td key={col.key} className="px-3 py-2.5" style={{ color: INK }}>
                          {cellValue(row, col)}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="text-sm font-semibold bg-transparent border-0 cursor-pointer mr-3 p-0"
                          style={{ color: OLIVE }}
                        >
                          {t('herd_health.edit', 'Edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row)}
                          className="text-sm font-semibold bg-transparent border-0 cursor-pointer p-0"
                          style={{ color: RUST }}
                        >
                          {t('herd_health.delete', 'Delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </HerdHealthLayout>
  );
}
