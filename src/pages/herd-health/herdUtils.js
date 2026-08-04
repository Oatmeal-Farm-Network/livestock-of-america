// src/pages/herd-health/herdUtils.js
/** Normalize API date/datetime values for <input type="date"> (YYYY-MM-DD). */
export function toDateInput(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Display date for tables. */
export function formatDisplayDate(value) {
  const iso = toDateInput(value);
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

export function flattenFields(config) {
  if (Array.isArray(config.sections) && config.sections.length) {
    return config.sections.flatMap((s) => s.fields || []);
  }
  return config.fields || [];
}

export function blankForm(config) {
  const blank = {};
  flattenFields(config).forEach((f) => {
    blank[f.name] = f.type === 'checkbox' ? !!f.default : f.default ?? '';
  });
  return blank;
}

export function rowToForm(config, row) {
  const next = {};
  flattenFields(config).forEach((f) => {
    let v = row[f.name];
    if (f.type === 'checkbox') v = !!v;
    else if (f.type === 'date') v = toDateInput(v);
    else if (v == null) v = '';
    next[f.name] = v;
  });
  return next;
}

export function buildPayload(config, form) {
  const body = {};
  flattenFields(config).forEach((f) => {
    let v = form[f.name];
    if (f.type === 'number' && (v === '' || v === undefined)) v = null;
    if (['text', 'textarea', 'date', 'select'].includes(f.type) && v === '') v = null;
    if (f.type === 'animal' && (v === '' || v === undefined)) v = null;
    if (f.type === 'checkbox') v = !!v;
    body[f.name] = v;
  });
  return body;
}

export function validateForm(config, form) {
  const missing = [];
  flattenFields(config).forEach((f) => {
    if (!f.required) return;
    const v = form[f.name];
    if (f.type === 'checkbox') return;
    if (v == null || v === '') missing.push(f.label || f.name);
  });
  return missing;
}
