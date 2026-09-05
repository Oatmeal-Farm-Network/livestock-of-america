// src/pages/blog/BlogAuthors.jsx
// Ported from OatmealFarmNetwork's BlogAuthors.jsx. The blog API is identical on
// the Livestock of America backend, so only the imports and the API base
// differ. The Lavendir WebsiteAIAgent widget is not carried over.
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { getToken } from '../../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

// Blog management calls carry the caller's token; the API checks it against
// BusinessAccess for the business_id in the query string.
const authFetch = (url, opts = {}) => {
  const token = getToken();
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};


// ── Rich text editor ─────────────────────────────────────────────
const WEB_FONTS = [
  { label: 'Arial',            value: 'Arial, sans-serif' },
  { label: 'Georgia',          value: 'Georgia, serif' },
  { label: 'Inter',            value: 'Inter, sans-serif' },
  { label: 'Lato',             value: 'Lato, sans-serif' },
  { label: 'Lora',             value: 'Lora, serif' },
  { label: 'Merriweather',     value: 'Merriweather, serif' },
  { label: 'Montserrat',       value: 'Montserrat, sans-serif' },
  { label: 'Open Sans',        value: 'Open Sans, sans-serif' },
  { label: 'Playfair Display', value: 'Playfair Display, serif' },
  { label: 'Poppins',          value: 'Poppins, sans-serif' },
  { label: 'Roboto',           value: 'Roboto, sans-serif' },
  { label: 'Tempus Sans ITC',  value: '"Tempus Sans ITC", sans-serif' },
  { label: 'Times New Roman',  value: 'Times New Roman, serif' },
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pasteAsPlainText = e => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  if (!text) return;
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return;
  if (lines.length === 1) {
    document.execCommand('formatBlock', false, 'p');
    document.execCommand('insertText', false, lines[0]);
  } else {
    document.execCommand('insertHTML', false, lines.map(l => `<p>${esc(l)}</p>`).join(''));
  }
};

function RichTextEditor({ value, onChange }) {
  const { t } = useTranslation();
  const editorRef = useRef(null);
  const htmlRef   = useRef(null);
  const [htmlMode, setHtmlMode] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || '';
    if (htmlRef.current)   htmlRef.current.value       = value || '';
  }, []); // eslint-disable-line

  useEffect(() => {
    if (htmlMode) {
      if (htmlRef.current && editorRef.current) htmlRef.current.value = editorRef.current.innerHTML;
    } else {
      if (editorRef.current && htmlRef.current) editorRef.current.innerHTML = htmlRef.current.value;
    }
  }, [htmlMode]);

  const exec = (cmd, val = null) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); };
  const applyBlock = tag => { editorRef.current?.focus(); document.execCommand('formatBlock', false, tag); };
  const applyFont = ff => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { document.execCommand('fontName', false, ff); return; }
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontFamily = ff;
    try { range.surroundContents(span); } catch { document.execCommand('fontName', false, ff); }
  };
  const insertLink = () => {
    const input = window.prompt(t('blog_authors.prompt_url'));
    if (!input) return;
    const val = input.trim();
    const href = /^https?:\/\//i.test(val) ? val : /^mailto:/i.test(val) ? val : `https://${val}`;
    exec('createLink', href);
    editorRef.current?.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  };
  const clearFormatting = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('removeFormat', false, null);
    editorRef.current.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    onChange(editorRef.current.innerHTML);
  };
  const handleBlur = () => { if (!htmlMode) onChange(editorRef.current?.innerHTML || ''); };

  const savedRangeRef = useRef(null);
  const fileInputRef  = useRef(null);
  const [imgPanel, setImgPanel]       = useState(false);
  const [imgUrl, setImgUrl]           = useState('');
  const [imgAlign, setImgAlign]       = useState('center');
  const [draggingOver, setDraggingOver]   = useState(false);
  const [panelDragging, setPanelDragging] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [imgToolbarPos, setImgToolbarPos] = useState({ top: 0, left: 0 });

  const selectImg = (img) => {
    if (selectedImg) selectedImg.style.outline = '';
    img.style.outline = '2px solid #3b82f6';
    setSelectedImg(img);
    const r = img.getBoundingClientRect();
    setImgToolbarPos({ top: r.top - 38, left: r.left });
  };

  const clearSelectedImg = () => {
    if (selectedImg) selectedImg.style.outline = '';
    setSelectedImg(null);
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName === 'IMG') { selectImg(e.target); }
    else clearSelectedImg();
  };

  const _rootEl = (img) => {
    if (!img) return null;
    if (img.parentElement === editorRef.current) return img;
    if (img.parentElement?.tagName === 'FIGURE' && img.parentElement?.parentElement === editorRef.current) return img.parentElement;
    return null;
  };

  const moveImg = (dir) => {
    if (!selectedImg) return;
    const root = _rootEl(selectedImg);
    if (!root) return;
    if (dir < 0) {
      const prev = root.previousElementSibling;
      if (prev) editorRef.current.insertBefore(root, prev);
    } else {
      const next = root.nextElementSibling;
      if (next) editorRef.current.insertBefore(next, root);
    }
    onChange(editorRef.current?.innerHTML || '');
    setTimeout(() => {
      const r = selectedImg.getBoundingClientRect();
      setImgToolbarPos({ top: r.top - 38, left: r.left });
    }, 0);
  };

  const _liftToEditor = (img) => {
    let node = img;
    while (node.parentElement && node.parentElement !== editorRef.current) {
      node = node.parentElement;
    }
    if (node !== img && node.parentElement === editorRef.current) {
      editorRef.current.insertBefore(img, node);
      if (!node.textContent.trim() && node.children.length === 0) node.remove();
    }
  };

  const applyImgAlign = (align) => {
    if (!selectedImg) return;
    const img = selectedImg;
    const parent = img.parentElement;
    if (align === 'center') {
      if (parent.tagName === 'FIGURE') {
        parent.style.cssText = 'text-align:center;margin:1em 0;clear:both;';
        img.style.cssText = 'max-width:100%;border-radius:4px;float:none;';
      } else {
        _liftToEditor(img);
        const fig = document.createElement('figure');
        fig.style.cssText = 'text-align:center;margin:1em 0;clear:both;';
        editorRef.current.insertBefore(fig, img);
        fig.appendChild(img);
        img.style.cssText = 'max-width:100%;border-radius:4px;float:none;';
      }
    } else {
      const cssText = align === 'left'
        ? 'float:left;margin:0 1em 0.5em 0;max-width:45%;border-radius:4px;'
        : 'float:right;margin:0 0 0.5em 1em;max-width:45%;border-radius:4px;';
      if (parent.tagName === 'FIGURE') {
        parent.parentElement.insertBefore(img, parent);
        parent.remove();
      }
      _liftToEditor(img);
      img.style.cssText = cssText;
    }
    onChange(editorRef.current?.innerHTML || '');
    setSelectedImg(null);
  };

  useEffect(() => {
    if (!selectedImg) return;
    const hide = () => clearSelectedImg();
    const onKey = (e) => { if (e.key === 'Escape') clearSelectedImg(); };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('scroll', hide, true); window.removeEventListener('keydown', onKey); };
  }, [selectedImg]);

  const handlePanelFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch(`${API_URL}/api/blog/upload-image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setImgUrl(url);
    } catch { /* silent */ } finally { setUploading(false); }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDraggingOver(true); };
  const handleDragLeave = () => setDraggingOver(false);

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    editorRef.current?.focus();
    const x = e.clientX, y = e.clientY;
    let range;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); }
    }
    if (range) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch(`${API_URL}/api/blog/upload-image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      const html = `<figure style="text-align:center;margin:1em 0;"><img src="${url}" style="max-width:100%;border-radius:4px;" /></figure>`;
      document.execCommand('insertHTML', false, html);
      onChange(editorRef.current?.innerHTML || '');
    } catch {
      // silent – user can retry via URL panel
    } finally {
      setUploading(false);
    }
  };

  const openImgPanel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    setImgUrl('');
    setImgAlign('center');
    setImgPanel(p => !p);
  };

  const insertImage = () => {
    if (!imgUrl.trim()) return;
    const url = imgUrl.trim();
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }

    if (imgAlign === 'center') {
      document.execCommand('insertHTML', false,
        `<figure style="text-align:center;margin:1em 0;clear:both;"><img src="${url}" style="max-width:100%;border-radius:4px;" /></figure>`);
    } else {
      const cssText = imgAlign === 'left'
        ? 'float:left;margin:0 1em 0.5em 0;max-width:45%;border-radius:4px;'
        : 'float:right;margin:0 0 0.5em 1em;max-width:45%;border-radius:4px;';
      const img = document.createElement('img');
      img.src = url;
      img.style.cssText = cssText;

      const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      let refBlock = null;
      if (range) {
        let node = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        if (node === editorRef.current) {
          refBlock = editorRef.current.children[range.startOffset] || null;
        } else {
          while (node && node.parentElement !== editorRef.current) node = node.parentElement;
          if (node && node !== editorRef.current) refBlock = node;
        }
      }

      if (refBlock) {
        editorRef.current.insertBefore(img, refBlock);
        try {
          const r = document.createRange();
          r.setStart(refBlock, 0);
          r.collapse(true);
          sel.removeAllRanges();
          sel.addRange(r);
        } catch { /* ignore */ }
      } else {
        editorRef.current.appendChild(img);
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        editorRef.current.appendChild(p);
        try {
          const r = document.createRange();
          r.setStart(p, 0);
          r.collapse(true);
          sel.removeAllRanges();
          sel.addRange(r);
        } catch { /* ignore */ }
      }
    }
    onChange(editorRef.current?.innerHTML || '');
    setImgPanel(false);
  };

  const btn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 7px', borderRadius: 4, fontSize: 12, cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', color: '#374151', lineHeight: 1 };
  const selStyle = { fontSize: 11, border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 5px', background: '#fff', cursor: 'pointer', color: '#374151' };
  const div = <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />;

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
        {!htmlMode && <>
          <select style={selStyle} defaultValue="" onChange={e => { applyBlock(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>{t('blog_authors.toolbar_style')}</option>
            <option value="p">{t('blog_authors.toolbar_body')}</option>
            <option value="h1">H1</option><option value="h2">H2</option>
            <option value="h3">H3</option><option value="h4">H4</option>
          </select>
          <select style={{ ...selStyle, maxWidth: 110 }} defaultValue="" onChange={e => { applyFont(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>{t('blog_authors.toolbar_font')}</option>
            {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          {div}
          <button style={{ ...btn, fontWeight: 700 }} title={t('blog_authors.toolbar_bold')} onMouseDown={e => { e.preventDefault(); exec('bold'); }}>B</button>
          <button style={{ ...btn, fontStyle: 'italic' }} title={t('blog_authors.toolbar_italic')} onMouseDown={e => { e.preventDefault(); exec('italic'); }}>I</button>
          <button style={{ ...btn, textDecoration: 'underline' }} title={t('blog_authors.toolbar_underline')} onMouseDown={e => { e.preventDefault(); exec('underline'); }}>U</button>
          <button style={{ ...btn, textDecoration: 'line-through' }} title={t('blog_authors.toolbar_strike')} onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }}>S</button>
          {div}
          <button style={btn} title={t('blog_authors.toolbar_align_left')} onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="0" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="0" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title={t('blog_authors.toolbar_center')} onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="2" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="2" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title={t('blog_authors.toolbar_align_right')} onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="4" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="4" y="11.5" width="9" height="1.5"/></svg>
          </button>
          {div}
          <button style={btn} title={t('blog_authors.toolbar_bullet')} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="1.5" cy="2.5" r="1.2"/><rect x="4" y="1.8" width="9" height="1.4"/><circle cx="1.5" cy="6.5" r="1.2"/><rect x="4" y="5.8" width="9" height="1.4"/><circle cx="1.5" cy="10.5" r="1.2"/><rect x="4" y="9.8" width="9" height="1.4"/></svg>
          </button>
          <button style={btn} title={t('blog_authors.toolbar_numbered')} onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><text x="0" y="4" fontSize="4.5" fontFamily="monospace">1.</text><rect x="4" y="1.8" width="9" height="1.4"/><text x="0" y="8" fontSize="4.5" fontFamily="monospace">2.</text><rect x="4" y="5.8" width="9" height="1.4"/><text x="0" y="12" fontSize="4.5" fontFamily="monospace">3.</text><rect x="4" y="9.8" width="9" height="1.4"/></svg>
          </button>
          {div}
          <button style={btn} title={t('blog_authors.toolbar_link')} onMouseDown={e => { e.preventDefault(); insertLink(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </button>
          <button style={{ ...btn, fontSize: 10 }} title={t('blog_authors.toolbar_unlink')} onMouseDown={e => { e.preventDefault(); exec('unlink'); }}>✕🔗</button>
          {div}
          <button style={{ ...btn, fontSize: 10, color: '#b91c1c' }} title={t('blog_authors.toolbar_clear')} onMouseDown={e => { e.preventDefault(); clearFormatting(); }}>Tx</button>
          {div}
          <button style={{ ...btn, background: imgPanel ? '#e0f2fe' : '#fff', borderColor: imgPanel ? '#7dd3fc' : '#d1d5db' }} title={t('blog_authors.toolbar_image')} onMouseDown={e => { e.preventDefault(); openImgPanel(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          {div}
        </>}
        <button onClick={() => setHtmlMode(m => !m)}
          style={{ ...btn, fontFamily: 'monospace', fontSize: 11, background: htmlMode ? '#1e293b' : '#fff', color: htmlMode ? '#7dd3fc' : '#374151', border: `1px solid ${htmlMode ? '#334155' : '#d1d5db'}` }}>&lt;/&gt;</button>
      </div>
      {imgPanel && !htmlMode && (
        <div style={{ padding: '10px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              value={imgUrl} onChange={e => setImgUrl(e.target.value)}
              placeholder={t('blog_authors.img_paste_url')} autoFocus
              style={{ flex: 1, minWidth: 160, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 12 }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertImage(); } if (e.key === 'Escape') setImgPanel(false); }}
            />
            <button onClick={() => fileInputRef.current?.click()}
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: '#fff', color: '#374151', whiteSpace: 'nowrap' }}>
              {t('blog_authors.img_browse')}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) handlePanelFile(f); e.target.value = ''; }} />
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setPanelDragging(true); }}
            onDragLeave={() => setPanelDragging(false)}
            onDrop={e => { e.preventDefault(); setPanelDragging(false); handlePanelFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${panelDragging ? '#3b82f6' : '#bae6fd'}`, borderRadius: 6, padding: '10px 8px', textAlign: 'center', fontSize: 11, color: panelDragging ? '#2563eb' : '#0891b2', cursor: 'pointer', background: panelDragging ? '#eff6ff' : 'transparent', transition: 'all 0.15s' }}>
            {uploading ? t('blog_authors.img_uploading') : t('blog_authors.img_drop_zone')}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['left', 'center', 'right'].map(a => (
                <button key={a} onClick={() => setImgAlign(a)}
                  style={{ padding: '3px 9px', borderRadius: 4, border: '1px solid', fontSize: 11, cursor: 'pointer',
                    background: imgAlign === a ? '#0891b2' : '#fff', color: imgAlign === a ? '#fff' : '#374151', borderColor: imgAlign === a ? '#0891b2' : '#d1d5db' }}>
                  {t(`blog_authors.img_align_${a}`)}
                </button>
              ))}
            </div>
            <button onClick={insertImage} disabled={!imgUrl.trim() || uploading}
              style={{ padding: '3px 12px', borderRadius: 4, border: '1px solid #0891b2', background: imgUrl.trim() && !uploading ? '#0891b2' : '#94a3b8', color: '#fff', fontSize: 11, cursor: imgUrl.trim() && !uploading ? 'pointer' : 'default', fontWeight: 600 }}>
              {t('blog_authors.img_insert')}
            </button>
            <button onClick={() => setImgPanel(false)}
              style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', fontSize: 11, cursor: 'pointer' }}>
              {t('blog_authors.img_cancel')}
            </button>
          </div>
        </div>
      )}
      {uploading && (
        <div style={{ padding: '8px 12px', background: '#fefce8', borderBottom: '1px solid #fde68a', fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".2"/><path d="M21 12a9 9 0 00-9-9"/></svg>
          {t('blog_authors.img_uploading')}
        </div>
      )}
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onBlur={handleBlur} onPaste={pasteAsPlainText} onClick={handleEditorClick}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        style={{ display: htmlMode ? 'none' : 'block', minHeight: 200, padding: '10px 12px', fontSize: 14, lineHeight: 1.75, color: '#111827', outline: 'none', background: draggingOver ? '#eff6ff' : '#fff', border: draggingOver ? '2px dashed #3b82f6' : 'none', transition: 'background 0.15s' }} />
      <textarea ref={htmlRef} onBlur={e => onChange(e.target.value)}
        style={{ display: htmlMode ? 'block' : 'none', width: '100%', minHeight: 200, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6, color: '#0f172a', background: '#f8fafc', border: 'none', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
      {selectedImg && (
        <div style={{ position: 'fixed', top: imgToolbarPos.top, left: imgToolbarPos.left, zIndex: 1000, background: '#1e293b', borderRadius: 6, padding: '4px 6px', display: 'flex', gap: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.25)', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>{t('blog_authors.img_position')}</span>
          {[[-1,'↑'],[1,'↓']].map(([d, icon]) => (
            <button key={d} onMouseDown={e => { e.preventDefault(); moveImg(d); }}
              style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer', background: '#334155', color: '#e2e8f0' }}>
              {icon}
            </button>
          ))}
          <div style={{ width: 1, background: '#475569', alignSelf: 'stretch', margin: '0 3px' }} />
          <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>{t('blog_authors.img_align_label')}</span>
          {[['left','←'],['center','↔'],['right','→']].map(([a, icon]) => (
            <button key={a} onMouseDown={e => { e.preventDefault(); applyImgAlign(a); }}
              style={{ padding: '3px 9px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#e2e8f0', fontWeight: 500 }}>
              {icon} {t(`blog_authors.img_align_${a}`)}
            </button>
          ))}
          <button onMouseDown={e => { e.preventDefault(); clearSelectedImg(); }}
            style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#94a3b8', marginLeft: 2 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Content Block Editor ─────────────────────────────────────────
const parseBlocks = (v) => {
  if (!v) return [{ id: 1, type: 'text', content: '' }];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed) && parsed.length > 0)
      return parsed.map((b, i) => ({ ...b, id: b.id ?? Date.now() + i }));
  } catch {}
  return [{ id: 1, type: 'text', content: v }];
};
let _bid = 3000;
const nid = () => ++_bid;

function ContentBlockEditor({ value, onChange }) {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState(() => parseBlocks(value));
  const commit = nb => { setBlocks(nb); onChange(JSON.stringify(nb)); };
  const addBlock = type => commit([...blocks, type === 'image'
    ? { id: nid(), type: 'image', url: '', caption: '', align: 'center', width: '100%' }
    : { id: nid(), type: 'text', content: '' }]);
  const removeBlock = id => { const n = blocks.filter(b => b.id !== id); commit(n.length ? n : [{ id: nid(), type: 'text', content: '' }]); };
  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if ((dir < 0 && idx === 0) || (dir > 0 && idx === blocks.length - 1)) return;
    const n = [...blocks]; [n[idx], n[idx + dir]] = [n[idx + dir], n[idx]]; commit(n);
  };
  const updateBlock = (id, patch) => commit(blocks.map(b => b.id === id ? { ...b, ...patch } : b));

  const hdr = { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const mb = { background: 'none', border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 7px', fontSize: 11, cursor: 'pointer', color: '#6b7280', lineHeight: 1.5 };
  const ii = { padding: '0.4rem 0.65rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' };

  return (
    <div>
      {blocks.map((block, idx) => (
        <div key={block.id} style={{ marginBottom: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div style={hdr}>
            <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {block.type === 'image' ? t('blog_authors.block_image') : t('blog_authors.block_text')}
            </span>
            <button style={mb} onClick={() => moveBlock(block.id, -1)} disabled={idx === 0}>↑</button>
            <button style={mb} onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1}>↓</button>
            <button style={{ ...mb, color: '#C0382B', borderColor: '#fca5a5' }} onClick={() => removeBlock(block.id)}>✕</button>
          </div>
          {block.type === 'image' ? (
            <div style={{ padding: '0.75rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input style={ii} placeholder={t('blog_authors.img_url_placeholder')} value={block.url} onChange={e => updateBlock(block.id, { url: e.target.value })} />
              {block.url && (
                <div style={{ textAlign: block.align || 'center' }}>
                  <img src={block.url} alt={block.caption || ''} onError={e => e.target.style.display = 'none'}
                    style={{ maxWidth: block.width || '100%', maxHeight: 220, borderRadius: 6, objectFit: 'contain', display: 'inline-block' }} />
                </div>
              )}
              <input style={ii} placeholder={t('blog_authors.img_caption_placeholder')} value={block.caption} onChange={e => updateBlock(block.id, { caption: e.target.value })} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{t('blog_authors.img_align_label')}:</span>
                {['left', 'center', 'right'].map(a => (
                  <button key={a} onClick={() => updateBlock(block.id, { align: a })}
                    style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid', fontSize: '0.78rem', cursor: 'pointer',
                      background: block.align === a ? '#819360' : '#f9fafb', color: block.align === a ? '#fff' : '#374151',
                      borderColor: block.align === a ? '#819360' : '#d1d5db' }}>
                    {t(`blog_authors.img_align_${a}`)}
                  </button>
                ))}
                <span style={{ fontSize: '0.78rem', color: '#6b7280', marginLeft: 8 }}>{t('blog_authors.img_width_label')}:</span>
                <select value={block.width || '100%'} onChange={e => updateBlock(block.id, { width: e.target.value })}
                  style={{ fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 5px', background: '#fff', cursor: 'pointer' }}>
                  {['25%', '33%', '50%', '66%', '75%', '100%'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <RichTextEditor key={`txt-${block.id}`} value={block.content} onChange={v => updateBlock(block.id, { content: v })} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button onClick={() => addBlock('text')} style={{ padding: '5px 14px', border: '1px dashed #d1d5db', borderRadius: 6, background: '#f9fafb', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer', fontWeight: 500 }}>{t('blog_authors.btn_add_text_block')}</button>
        <button onClick={() => addBlock('image')} style={{ padding: '5px 14px', border: '1px dashed #d1d5db', borderRadius: 6, background: '#f9fafb', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer', fontWeight: 500 }}>{t('blog_authors.btn_add_image_block')}</button>
      </div>
    </div>
  );
}

// ── Author Editor form ────────────────────────────────────────────
const emptyAuthor = { name: '', bio: '', avatar_url: '', author_link: '' };

function AuthorEditor({ author, businessId, onSave, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(author ? {
    name:        author.name || '',
    bio:         author.bio || '',
    avatar_url:  author.avatar_url || '',
    author_link: author.author_link || '',
  } : { ...emptyAuthor });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError(t('blog_authors.err_name_required')); return; }
    setSaving(true); setError('');
    try {
      const isEdit = !!author;
      const url = isEdit
        ? `${API_URL}/api/blog/authors/${author.author_id}?business_id=${businessId}`
        : `${API_URL}/api/blog/authors?business_id=${businessId}`;
      const res = await authFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onSave();
    } catch {
      setError(t('blog_authors.err_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const inp = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' };
  const opt = { fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 };

  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
        {author ? t('blog_authors.edit_title') : t('blog_authors.new_title')}
      </h2>

      {error && <div style={{ background: '#fef2f2', color: '#C0382B', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={lbl}>{t('blog_authors.lbl_name')}</label>
            <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('blog_authors.placeholder_name')} />
          </div>
          <div>
            <label style={lbl}>{t('blog_authors.lbl_avatar')} <span style={opt}>{t('blog_authors.lbl_optional')}</span></label>
            <input style={inp} value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label style={lbl}>{t('blog_authors.lbl_link')} <span style={opt}>{t('blog_authors.lbl_optional')}</span></label>
            <input style={inp} value={form.author_link} onChange={e => set('author_link', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {form.avatar_url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={form.avatar_url} alt={t('blog_authors.avatar_preview')} onError={e => e.target.style.display = 'none'}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('blog_authors.avatar_preview')}</span>
          </div>
        )}

        <div>
          <label style={lbl}>{t('blog_authors.lbl_bio')} <span style={opt}>{t('blog_authors.lbl_optional')}</span></label>
          <ContentBlockEditor
            key={author?.author_id ?? 'new'}
            value={form.bio}
            onChange={v => set('bio', v)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
        <button onClick={onCancel}
          style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem 1.25rem', fontSize: '0.9rem', cursor: 'pointer' }}>
          {t('blog_authors.btn_cancel')}
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ background: '#819360', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? t('blog_authors.btn_saving') : t('blog_authors.btn_save_author')}
        </button>
      </div>
    </div>
  );
}

// ── BlogAuthors main ─────────────────────────────────────────────
export default function BlogAuthors() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID   = localStorage.getItem('people_id');
  const { Business, LoadBusiness } = useAccount();

  const [authors, setAuthors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('list'); // list | new | edit
  const [editAuthor, setEditAuthor] = useState(null);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => { if (BusinessID) LoadBusiness(BusinessID); }, [BusinessID]);

  const load = () => {
    setLoading(true);
    authFetch(`${API_URL}/api/blog/authors?business_id=${BusinessID}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAuthors(Array.isArray(data) ? data : []))
      .catch(() => setAuthors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (BusinessID) load(); }, [BusinessID]);

  const handleDelete = async (authorId, name) => {
    if (!window.confirm(t('blog_authors.confirm_delete', { name }))) return;
    setDeleting(authorId);
    try {
      await authFetch(`${API_URL}/api/blog/authors/${authorId}?business_id=${BusinessID}`, { method: 'DELETE' });
      load();
    } finally { setDeleting(null); }
  };

  const handleSaved = () => { setView('list'); setEditAuthor(null); load(); };

  if (view === 'new' || view === 'edit') {
    return (
      <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID}
        pageTitle={editAuthor ? t('blog_authors.page_title_edit') : t('blog_authors.page_title_new')}
        breadcrumbs={[
          { label: t('blog_authors.crumb_dashboard'), to: '/dashboard' },
          { label: t('blog_authors.crumb_blog') },
          { label: t('blog_authors.crumb_authors'), to: `/blog/authors?BusinessID=${BusinessID}` },
          { label: editAuthor ? t('blog_authors.crumb_edit') : t('blog_authors.crumb_new') },
        ]}>
        <div style={{ maxWidth: '800px' }}>
          <button onClick={() => { setView('list'); setEditAuthor(null); }}
            style={{ background: 'none', border: 'none', color: '#819360', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', padding: 0 }}>
            {t('blog_authors.back_to_authors')}
          </button>
          <AuthorEditor
            author={editAuthor}
            businessId={BusinessID}
            onSave={handleSaved}
            onCancel={() => { setView('list'); setEditAuthor(null); }}
          />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID}
      pageTitle={t('blog_authors.page_title_list')}
      breadcrumbs={[
        { label: t('blog_authors.crumb_dashboard'), to: '/dashboard' },
        { label: t('blog_authors.crumb_blog') },
        { label: t('blog_authors.crumb_authors') },
      ]}>
      <div style={{ maxWidth: '800px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '0.75rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}>{t('blog_authors.heading')}</h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
              {t('blog_authors.subheading')}{' '}
              <Link to={`/blog/manage?BusinessID=${BusinessID}`} style={{ color: '#7C5CBF', textDecoration: 'none', fontWeight: 600 }}>{t('blog_authors.back_to_blog')}</Link>
            </p>
          </div>
          <button onClick={() => { setEditAuthor(null); setView('new'); }}
            style={{ background: '#819360', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t('blog_authors.btn_new_author')}
          </button>
        </div>

        {loading && <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{t('blog_authors.loading')}</p>}

        {!loading && authors.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>{t('blog_authors.empty_text')}</p>
            <button onClick={() => setView('new')}
              style={{ background: '#819360', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
              {t('blog_authors.btn_add_author')}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {authors.map(author => (
            <div key={author.author_id}
              style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {author.avatar_url
                ? <img src={author.avatar_url} alt={author.name} onError={e => e.target.style.display = 'none'}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#111827' }}>{author.name}</div>
                {author.author_link && (
                  <a href={author.author_link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: '#7C5CBF', textDecoration: 'none' }}>
                    {author.author_link}
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <Link to={`/blog/authors/${author.author_id}`} target="_blank"
                  style={{ fontSize: '0.78rem', color: '#819360', textDecoration: 'none', padding: '0.25rem 0.55rem', border: '1px solid #819360', borderRadius: '5px', whiteSpace: 'nowrap' }}>
                  {t('blog_authors.btn_view')}
                </Link>
                <button onClick={() => { setEditAuthor(author); setView('edit'); }}
                  style={{ fontSize: '0.78rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '5px', padding: '0.25rem 0.55rem', cursor: 'pointer', color: '#374151' }}>
                  {t('blog_authors.btn_edit')}
                </button>
                <button onClick={() => handleDelete(author.author_id, author.name)} disabled={deleting === author.author_id}
                  style={{ fontSize: '0.78rem', background: '#C0382B', border: 'none', borderRadius: '5px', padding: '0.25rem 0.55rem', cursor: 'pointer', color: '#fff', opacity: deleting === author.author_id ? 0.6 : 1 }}>
                  {t('blog_authors.btn_delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AccountLayout>
  );
}
