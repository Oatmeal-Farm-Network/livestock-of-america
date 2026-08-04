// src/pages/herd-health/HerdFormFields.jsx
import React, { useEffect, useState } from 'react';
import { endpoints } from '../../config/api';
import { herdAuthHeaders } from './herdAuth';

const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';

const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#3d6b34]';

export function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-bold tracking-wide uppercase mb-1" style={{ color: MUTED }}>
      {children}
      {required ? <span style={{ color: RUST }}> *</span> : null}
    </label>
  );
}

export function TextField({ field, value, onChange, businessId, error }) {
  const common = {
    id: field.name,
    name: field.name,
    className: `${inputClass}${error ? ' border-red-400' : ''}`,
    style: { color: INK },
    value: value ?? (field.type === 'checkbox' ? false : ''),
    required: !!field.required,
    placeholder: field.placeholder || '',
    onChange: (e) => {
      if (field.type === 'checkbox') onChange(field.name, e.target.checked);
      else if (field.type === 'number') {
        const v = e.target.value;
        onChange(field.name, v === '' ? null : Number(v));
      } else onChange(field.name, e.target.value);
    },
  };

  let control = null;

  if (field.type === 'animal') {
    control = (
      <AnimalPicker
        businessId={businessId}
        value={value}
        onChange={(animalId, tag) => {
          onChange(field.name, animalId);
          if (field.tagField) onChange(field.tagField, tag || '');
        }}
        label={field.label}
        required={field.required}
        error={error}
        hint={field.hint}
      />
    );
  } else if (field.type === 'textarea') {
    control = (
      <div>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <textarea {...common} rows={field.rows || 3} value={value ?? ''} />
        {field.hint && !error && (
          <p className="text-xs mt-1 m-0" style={{ color: MUTED }}>{field.hint}</p>
        )}
      </div>
    );
  } else if (field.type === 'select') {
    control = (
      <div>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <select {...common} value={value ?? ''}>
          <option value="">{field.placeholder || '—'}</option>
          {(field.options || []).map((opt) => {
            const v = typeof opt === 'string' ? opt : opt.value;
            const lab = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={v} value={v}>
                {lab}
              </option>
            );
          })}
        </select>
      </div>
    );
  } else if (field.type === 'checkbox') {
    control = (
      <label className="flex items-center gap-2 text-sm pt-6" style={{ color: INK }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.name, e.target.checked)}
          style={{ accentColor: OLIVE }}
        />
        {field.label}
      </label>
    );
  } else {
    control = (
      <div>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <input
          {...common}
          type={field.type || 'text'}
          step={field.type === 'number' ? field.step || 'any' : undefined}
          min={field.min}
          max={field.max}
          value={value ?? ''}
        />
        {field.hint && !error && (
          <p className="text-xs mt-1 m-0" style={{ color: MUTED }}>{field.hint}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {control}
      {error ? (
        <p className="text-xs mt-1 m-0" style={{ color: RUST }}>{error}</p>
      ) : null}
    </div>
  );
}

function AnimalPicker({ businessId, value, onChange, label, required, error, hint }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setLoading(true);
    fetch(endpoints.herdHealthAnimals(businessId), { headers: herdAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!cancelled) setAnimals(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setAnimals([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return (
    <div>
      <FieldLabel required={required}>{label || 'Animal from herd'}</FieldLabel>
      <select
        className={`${inputClass}${error ? ' border-red-400' : ''}`}
        style={{ color: INK }}
        value={value ?? ''}
        disabled={loading || !businessId}
        onChange={(e) => {
          const id = e.target.value ? Number(e.target.value) : null;
          const a = animals.find((x) => Number(x.AnimalID) === id);
          onChange(id, a?.FullName || '');
        }}
      >
        <option value="">
          {loading
            ? 'Loading animals…'
            : animals.length
              ? '— Select animal —'
              : '— No animals in herd (use tag below) —'}
        </option>
        {animals.map((a) => (
          <option key={a.AnimalID} value={a.AnimalID}>
            {a.FullName}
            {a.SpeciesName ? ` (${a.SpeciesName})` : ''}
          </option>
        ))}
      </select>
      <p className="text-xs mt-1 m-0" style={{ color: MUTED }}>
        {hint || 'Optional — pick a herd animal, or type a tag/name in the next field.'}
      </p>
    </div>
  );
}

export function HerdFormSections({ sections, fields, values, onChange, businessId, fieldErrors }) {
  const blocks =
    Array.isArray(sections) && sections.length
      ? sections
      : [{ title: null, fields: fields || [] }];

  return (
    <div className="space-y-5">
      {blocks.map((section, idx) => (
        <div key={section.title || idx}>
          {section.title ? (
            <h3
              className="text-[11px] font-bold tracking-[0.14em] uppercase mb-3 pb-1"
              style={{ color: OLIVE, borderBottom: '1px solid rgba(61,107,52,0.2)' }}
            >
              {section.title}
            </h3>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(section.fields || []).map((field) => (
              <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <TextField
                  field={field}
                  value={values[field.name]}
                  onChange={onChange}
                  businessId={businessId}
                  error={fieldErrors?.[field.name]}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** @deprecated use HerdFormSections */
export function HerdFormGrid(props) {
  return <HerdFormSections {...props} />;
}
