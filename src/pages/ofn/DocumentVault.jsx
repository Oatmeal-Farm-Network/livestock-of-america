// Ported from Oatmeal Farm Network (src/DocumentVault.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.

const API = import.meta.env.VITE_LIVESTOCK_API_URL || 'http://localhost:8000';
function tok() { return localStorage.getItem('access_token'); }
function auth() { return { Authorization: `Bearer ${tok()}` }; }

const CATEGORIES = ['All', 'Certifications', 'Contracts', 'Insurance', 'Compliance', 'Farm Plans', 'Financials', 'Other'];

const MIME_LABELS = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
};

const COLOR = {
  'application/pdf': 'bg-red-100 text-red-700',
  'application/msword': 'bg-blue-100 text-blue-700',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bg-blue-100 text-blue-700',
  'application/vnd.ms-excel': 'bg-green-100 text-green-700',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'bg-green-100 text-green-700',
  'image/png': 'bg-purple-100 text-purple-700',
  'image/jpeg': 'bg-purple-100 text-purple-700',
  'image/webp': 'bg-purple-100 text-purple-700',
  'text/plain': 'bg-gray-100 text-gray-700',
  'text/csv': 'bg-yellow-100 text-yellow-700',
};

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(s) {
  if (!s) return null;
  const diff = Math.ceil((new Date(s) - new Date()) / 86400000);
  return diff;
}

function ExpiryBadge({ date }) {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days < 0)   return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>;
  if (days <= 30)  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Expires in {days}d</span>;
  if (days <= 90)  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Expires {fmtDate(date)}</span>;
  return <span className="text-xs text-gray-400">{fmtDate(date)}</span>;
}

function UploadModal({ bid, onClose, onUploaded }) {
  const [file, setFile]         = useState(null);
  const [name, setName]         = useState('');
  const [category, setCategory] = useState('Other');
  const [expiry, setExpiry]     = useState('');
  const [notes, setNotes]       = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('File exceeds 10 MB limit.'); return; }
    setFile(f);
    setError('');
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      const ev = { target: { files: [f] } };
      handleFile(ev);
    }
  };

  const submit = async () => {
    if (!file) { setError('Please select a file.'); return; }
    if (!name.trim()) { setError('Document name is required.'); return; }
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('business_id', bid);
    fd.append('document_name', name.trim());
    fd.append('category', category);
    if (expiry) fd.append('expiry_date', expiry);
    if (notes.trim()) fd.append('notes', notes.trim());
    try {
      const r = await fetch(`${API}/api/documents/upload`, { method: 'POST', headers: auth(), body: fd });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.detail || 'Upload failed.'); }
      else { onUploaded(); onClose(); }
    } catch { setError('Network error.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Upload Document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()} onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.csv" />
            {file ? (
              <div className="text-sm text-gray-700">
                <span className="font-medium">{file.name}</span>
                <span className="text-gray-400 ml-2">({fmtSize(file.size)})</span>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                <div className="text-3xl mb-2">📄</div>
                <p>Drop a file here or <span className="text-blue-600">browse</span></p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT, CSV — max 10 MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. USDA Organic Certificate 2025"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Optional notes about this document…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button onClick={submit} disabled={uploading}
            className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentVault() {
  const [params] = useSearchParams();
  const bid = params.get('BusinessID');
  const [docs, setDocs]           = useState([]);
  const [category, setCategory]   = useState('All');
  const [loading, setLoading]     = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [expiringOnly, setExpiringOnly] = useState(false);

  const load = () => {
    if (!bid) return;
    setLoading(true);
    const qs = `?business_id=${bid}${category !== 'All' ? `&category=${encodeURIComponent(category)}` : ''}`;
    fetch(`${API}/api/documents/list${qs}`, { headers: auth() })
      .then(r => r.ok ? r.json() : [])
      .then(rows => setDocs(Array.isArray(rows) ? rows : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [bid, category]);

  const download = (doc) => {
    fetch(`${API}/api/documents/${doc.document_id}/download`, { headers: auth() })
      .then(r => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name || doc.document_name;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Download failed.'));
  };

  const deleteDoc = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    setDeletingId(id);
    await fetch(`${API}/api/documents/${id}`, { method: 'DELETE', headers: auth() });
    setDeletingId(null);
    load();
  };

  const displayed = expiringOnly
    ? docs.filter(d => { const n = daysUntil(d.expiry_date); return n !== null && n <= 90; })
    : docs;

  const expiringCount = docs.filter(d => { const n = daysUntil(d.expiry_date); return n !== null && n <= 30; }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-sm text-gray-500 mt-0.5">Certifications, contracts, compliance docs, and farm records</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
          + Upload
        </button>
      </div>

      {/* Expiry alert banner */}
      {expiringCount > 0 && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <span className="text-orange-500 text-lg">⚠</span>
          <p className="text-sm text-orange-800 flex-1">
            <span className="font-semibold">{expiringCount} document{expiringCount > 1 ? 's' : ''}</span> expire within 30 days.
          </p>
          <button onClick={() => setExpiringOnly(v => !v)}
            className="text-xs font-medium text-orange-700 hover:underline">
            {expiringOnly ? 'Show all' : 'View expiring'}
          </button>
        </div>
      )}

      {/* Category filter pills */}
      <div className="px-6 pt-4 pb-2 flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => { setCategory(c); setExpiringOnly(false); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              category === c
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Document grid */}
      <div className="p-6">
        {loading && <p className="text-gray-400 text-sm">Loading…</p>}

        {!loading && displayed.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🗂</div>
            <p className="text-sm">
              {expiringOnly ? 'No documents expiring soon.' : `No documents in ${category === 'All' ? 'this vault' : category}.`}
            </p>
            {!expiringOnly && (
              <button onClick={() => setShowUpload(true)}
                className="mt-3 text-sm text-blue-600 hover:underline">
                Upload your first document →
              </button>
            )}
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map(doc => {
              const mimeLabel = MIME_LABELS[doc.mime_type] || doc.mime_type?.split('/')[1]?.toUpperCase() || 'FILE';
              const mimeColor = COLOR[doc.mime_type] || 'bg-gray-100 text-gray-600';
              const days = daysUntil(doc.expiry_date);
              const expired = days !== null && days < 0;
              return (
                <div key={doc.document_id}
                  className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 ${expired ? 'border-red-200' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${mimeColor}`}>
                      {mimeLabel}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm leading-tight truncate">{doc.document_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.category} · {fmtSize(doc.file_size_bytes)}</p>
                    </div>
                  </div>

                  {doc.notes && (
                    <p className="text-xs text-gray-500 leading-snug line-clamp-2">{doc.notes}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col gap-1">
                      <ExpiryBadge date={doc.expiry_date} />
                      <span className="text-xs text-gray-400">Added {fmtDate(doc.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => download(doc)}
                        className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        ↓ Download
                      </button>
                      <button onClick={() => deleteDoc(doc.document_id)}
                        disabled={deletingId === doc.document_id}
                        className="text-xs px-2 py-1.5 text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors">
                        {deletingId === doc.document_id ? '…' : '✕'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick links */}
        {!loading && (
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {[
              ['/certifications', 'Certifications Tracker'],
              ['/export-compliance', 'Export Compliance'],
              ['/reports', 'Report Center'],
            ].map(([to, label]) => (
              <Link key={to} to={`${to}?BusinessID=${bid}`}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50">
                {label} →
              </Link>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal bid={bid} onClose={() => setShowUpload(false)} onUploaded={load} />
      )}</div>
  );
}
