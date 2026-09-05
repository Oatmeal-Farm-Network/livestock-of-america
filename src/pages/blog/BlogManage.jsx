// src/pages/blog/BlogManage.jsx
// Ported from OatmealFarmNetwork's BlogManage.jsx. The blog API is identical on
// the Livestock of America backend, so only the imports and the API base
// differ. The Lavendir WebsiteAIAgent widget is not carried over.
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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


// ── Rich text editor (shared with website builder) ──────────────
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

function BlogRichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const htmlRef   = useRef(null);
  const [htmlMode, setHtmlMode] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || '';
    if (htmlRef.current)   htmlRef.current.value       = value || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (htmlMode) {
      if (htmlRef.current && editorRef.current)
        htmlRef.current.value = editorRef.current.innerHTML;
    } else {
      if (editorRef.current && htmlRef.current)
        editorRef.current.innerHTML = htmlRef.current.value;
    }
  }, [htmlMode]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const applyBlock = tag => { editorRef.current?.focus(); document.execCommand('formatBlock', false, tag); };

  const applyFont = fontFamily => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { document.execCommand('fontName', false, fontFamily); return; }
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    try { range.surroundContents(span); } catch { document.execCommand('fontName', false, fontFamily); }
  };

  const insertLink = () => {
    const input = window.prompt('Enter a URL:');
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
  const [imgCaption, setImgCaption] = useState('');
  const [imgRect, setImgRect] = useState(null);
  const resizingRef = useRef(null); // { startX, startWidth, dir: 'left'|'right' }

  const selectImg = (img) => {
    if (selectedImg) selectedImg.style.outline = '';
    img.style.outline = '2px solid #3b82f6';
    setSelectedImg(img);
    const fig = img.closest('figure');
    setImgCaption(fig ? (fig.querySelector('figcaption')?.textContent || '') : '');
    const r = img.getBoundingClientRect();
    setImgRect(r);
    setImgToolbarPos({ top: r.top - 72, left: r.left });
  };

  const clearSelectedImg = () => {
    if (selectedImg) selectedImg.style.outline = '';
    setSelectedImg(null);
    setImgRect(null);
  };

  const startResize = (e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImg) return;
    resizingRef.current = {
      dir,
      startX:     e.clientX,
      startWidth: selectedImg.getBoundingClientRect().width,
    };
    const onMove = (ev) => {
      const { startX, startWidth, dir } = resizingRef.current;
      const dx = dir === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const newWidth = Math.max(40, startWidth + dx);
      selectedImg.style.width    = newWidth + 'px';
      selectedImg.style.maxWidth = 'none';
      setImgRect(selectedImg.getBoundingClientRect());
    };
    const onUp = () => {
      onChange(editorRef.current?.innerHTML || '');
      resizingRef.current = null;
      setImgRect(selectedImg ? selectedImg.getBoundingClientRect() : null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',  onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',  onUp);
  };

  const applyCaption = (text) => {
    if (!selectedImg) return;
    const fig = selectedImg.closest('figure');
    if (!fig) {
      // Wrap bare img in a figure so we can add a caption
      const wrapper = document.createElement('figure');
      wrapper.style.cssText = selectedImg.style.cssText || 'text-align:center;margin:1em 0;clear:both;';
      selectedImg.style.cssText = 'max-width:100%;border-radius:4px;display:block;';
      selectedImg.parentElement.insertBefore(wrapper, selectedImg);
      wrapper.appendChild(selectedImg);
      const fc = document.createElement('figcaption');
      fc.style.cssText = 'font-size:0.82em;color:#6b7280;text-align:center;font-style:italic;margin-top:0.3em;';
      fc.textContent = text;
      wrapper.appendChild(fc);
    } else {
      let fc = fig.querySelector('figcaption');
      if (!fc) {
        fc = document.createElement('figcaption');
        fc.style.cssText = 'font-size:0.82em;color:#6b7280;text-align:center;font-style:italic;margin-top:0.3em;';
        fig.appendChild(fc);
      }
      fc.textContent = text;
    }
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName === 'IMG') { selectImg(e.target); }
    else clearSelectedImg();
  };

  // Find the root-level element (direct child of editor) for an img
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
      setImgRect(r);
      setImgToolbarPos({ top: r.top - 72, left: r.left });
    }, 0);
  };

  // Lift img to be a direct child of the editor div so float works across paragraphs
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
      // Unwrap from figure first if present
      if (parent.tagName === 'FIGURE') {
        parent.style.cssText = 'text-align:center;margin:1em 0;clear:both;';
        img.style.cssText = 'max-width:100%;border-radius:4px;float:none;';
      } else {
        // Lift to editor level, then wrap in figure
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
      // Lift to editor root so float affects sibling paragraphs
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
    // Place cursor at drop point
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
      // Center: block figure, no float — insertHTML is fine
      document.execCommand('insertHTML', false,
        `<figure style="text-align:center;margin:1em 0;clear:both;"><img src="${url}" style="max-width:100%;border-radius:4px;" /></figure>`);
    } else {
      // Float left/right: must be a direct child of the editor div so text wraps properly
      const cssText = imgAlign === 'left'
        ? 'float:left;margin:0 1em 0.5em 0;max-width:45%;border-radius:4px;'
        : 'float:right;margin:0 0 0.5em 1em;max-width:45%;border-radius:4px;';
      const img = document.createElement('img');
      img.src = url;
      img.style.cssText = cssText;

      // Find the block-level node (direct child of editor) at the cursor
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
        // Leave cursor in the sibling block so user types beside the float
        try {
          const r = document.createRange();
          r.setStart(refBlock, 0);
          r.collapse(true);
          sel.removeAllRanges();
          sel.addRange(r);
        } catch { /* ignore cursor placement errors */ }
      } else {
        editorRef.current.appendChild(img);
        // Ensure there's a paragraph after the image to type in
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
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', alignItems: 'center', position: 'sticky', top: 0, zIndex: 20, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        {!htmlMode && <>
          <select style={selStyle} defaultValue="" onChange={e => { applyBlock(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>Style</option>
            <option value="p">Body</option>
            <option value="h1">H1</option><option value="h2">H2</option>
            <option value="h3">H3</option><option value="h4">H4</option>
          </select>
          <select style={{ ...selStyle, maxWidth: 110 }} defaultValue="" onChange={e => { applyFont(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>Font</option>
            {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          {div}
          <button style={{ ...btn, fontWeight: 700 }} title="Bold" onMouseDown={e => { e.preventDefault(); exec('bold'); }}>B</button>
          <button style={{ ...btn, fontStyle: 'italic' }} title="Italic" onMouseDown={e => { e.preventDefault(); exec('italic'); }}>I</button>
          <button style={{ ...btn, textDecoration: 'underline' }} title="Underline" onMouseDown={e => { e.preventDefault(); exec('underline'); }}>U</button>
          <button style={{ ...btn, textDecoration: 'line-through' }} title="Strikethrough" onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }}>S</button>
          {div}
          <button style={btn} title="Align Left" onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="0" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="0" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title="Center" onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="2" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="2" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title="Align Right" onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="4" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="4" y="11.5" width="9" height="1.5"/></svg>
          </button>
          {div}
          <button style={btn} title="Bullet List" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="1.5" cy="2.5" r="1.2"/><rect x="4" y="1.8" width="9" height="1.4"/><circle cx="1.5" cy="6.5" r="1.2"/><rect x="4" y="5.8" width="9" height="1.4"/><circle cx="1.5" cy="10.5" r="1.2"/><rect x="4" y="9.8" width="9" height="1.4"/></svg>
          </button>
          <button style={btn} title="Numbered List" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><text x="0" y="4" fontSize="4.5" fontFamily="monospace">1.</text><rect x="4" y="1.8" width="9" height="1.4"/><text x="0" y="8" fontSize="4.5" fontFamily="monospace">2.</text><rect x="4" y="5.8" width="9" height="1.4"/><text x="0" y="12" fontSize="4.5" fontFamily="monospace">3.</text><rect x="4" y="9.8" width="9" height="1.4"/></svg>
          </button>
          {div}
          <button style={btn} title="Insert Link" onMouseDown={e => { e.preventDefault(); insertLink(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </button>
          <button style={{ ...btn, fontSize: 10 }} title="Remove Link" onMouseDown={e => { e.preventDefault(); exec('unlink'); }}>✕🔗</button>
          {div}
          <button style={{ ...btn, fontSize: 10, color: '#b91c1c' }} title="Clear all formatting" onMouseDown={e => { e.preventDefault(); clearFormatting(); }}>Tx</button>
          {div}
          <button style={{ ...btn, background: imgPanel ? '#e0f2fe' : '#fff', borderColor: imgPanel ? '#7dd3fc' : '#d1d5db' }} title="Insert Image" onMouseDown={e => { e.preventDefault(); openImgPanel(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          {div}
        </>}
        <button onClick={() => setHtmlMode(m => !m)}
          style={{ ...btn, fontFamily: 'monospace', fontSize: 11, background: htmlMode ? '#1e293b' : '#fff', color: htmlMode ? '#7dd3fc' : '#374151', border: `1px solid ${htmlMode ? '#334155' : '#d1d5db'}` }}
          title={htmlMode ? 'Back to rich text' : 'View/edit HTML'}>&lt;/&gt;</button>
      </div>
      {imgPanel && !htmlMode && (
        <div style={{ padding: '10px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* URL row + browse button */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              value={imgUrl} onChange={e => setImgUrl(e.target.value)}
              placeholder="Paste image URL…" autoFocus
              style={{ flex: 1, minWidth: 160, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 12 }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertImage(); } if (e.key === 'Escape') setImgPanel(false); }}
            />
            <button onClick={() => fileInputRef.current?.click()}
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: '#fff', color: '#374151', whiteSpace: 'nowrap' }}>
              Browse…
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) handlePanelFile(f); e.target.value = ''; }} />
          </div>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setPanelDragging(true); }}
            onDragLeave={() => setPanelDragging(false)}
            onDrop={e => { e.preventDefault(); setPanelDragging(false); handlePanelFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${panelDragging ? '#3b82f6' : '#bae6fd'}`, borderRadius: 6, padding: '10px 8px', textAlign: 'center', fontSize: 11, color: panelDragging ? '#2563eb' : '#0891b2', cursor: 'pointer', background: panelDragging ? '#eff6ff' : 'transparent', transition: 'all 0.15s' }}>
            {uploading ? 'Uploading…' : 'Drop image here or click to browse'}
          </div>
          {/* Alignment + actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['left', 'center', 'right'].map(a => (
                <button key={a} onClick={() => setImgAlign(a)}
                  style={{ padding: '3px 9px', borderRadius: 4, border: '1px solid', fontSize: 11, cursor: 'pointer',
                    background: imgAlign === a ? '#0891b2' : '#fff', color: imgAlign === a ? '#fff' : '#374151', borderColor: imgAlign === a ? '#0891b2' : '#d1d5db' }}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={insertImage} disabled={!imgUrl.trim() || uploading}
              style={{ padding: '3px 12px', borderRadius: 4, border: '1px solid #0891b2', background: imgUrl.trim() && !uploading ? '#0891b2' : '#94a3b8', color: '#fff', fontSize: 11, cursor: imgUrl.trim() && !uploading ? 'pointer' : 'default', fontWeight: 600 }}>
              Insert
            </button>
            <button onClick={() => setImgPanel(false)}
              style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', fontSize: 11, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {uploading && (
        <div style={{ padding: '8px 12px', background: '#fefce8', borderBottom: '1px solid #fde68a', fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".2"/><path d="M21 12a9 9 0 00-9-9"/></svg>
          Uploading image…
        </div>
      )}
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onBlur={handleBlur} onPaste={pasteAsPlainText} onClick={handleEditorClick}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        style={{ display: htmlMode ? 'none' : 'block', minHeight: 320, padding: '10px 12px', fontSize: 14, lineHeight: 1.75, color: '#111827', outline: 'none', background: draggingOver ? '#eff6ff' : '#fff', overflowY: 'auto', border: draggingOver ? '2px dashed #3b82f6' : 'none', transition: 'background 0.15s' }} />
      <textarea ref={htmlRef} onBlur={e => { onChange(e.target.value); }}
        style={{ display: htmlMode ? 'block' : 'none', width: '100%', minHeight: 320, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6, color: '#0f172a', background: '#f8fafc', border: 'none', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
      {selectedImg && imgRect && createPortal(
        <>
          {/* Blue outline overlay */}
          <div style={{ position: 'fixed', top: imgRect.top - 1, left: imgRect.left - 1, width: imgRect.width + 2, height: imgRect.height + 2, border: '2px solid #3b82f6', pointerEvents: 'none', zIndex: 9998 }} />

          {/* Resize handles — left edge, right edge, corners */}
          {[
            { cursor: 'ew-resize', dir: 'left',  top: imgRect.top  + imgRect.height / 2 - 6, left: imgRect.left  - 6 },
            { cursor: 'ew-resize', dir: 'right', top: imgRect.top  + imgRect.height / 2 - 6, left: imgRect.right - 6 },
            { cursor: 'nw-resize', dir: 'left',  top: imgRect.top  - 6, left: imgRect.left  - 6 },
            { cursor: 'ne-resize', dir: 'right', top: imgRect.top  - 6, left: imgRect.right - 6 },
            { cursor: 'sw-resize', dir: 'left',  top: imgRect.bottom - 6, left: imgRect.left  - 6 },
            { cursor: 'se-resize', dir: 'right', top: imgRect.bottom - 6, left: imgRect.right - 6 },
          ].map(({ cursor, dir, top, left }, i) => (
            <div key={i} onMouseDown={e => startResize(e, dir)}
              style={{ position: 'fixed', top, left, width: 12, height: 12, background: '#fff', border: '2px solid #3b82f6', borderRadius: 2, cursor, zIndex: 9999 }} />
          ))}

          {/* Size label */}
          <div style={{ position: 'fixed', top: imgRect.bottom + 4, left: imgRect.left, fontSize: 10, color: '#3b82f6', background: 'rgba(255,255,255,0.9)', padding: '1px 5px', borderRadius: 3, pointerEvents: 'none', zIndex: 9999 }}>
            {Math.round(imgRect.width)} × {Math.round(imgRect.height)}px
          </div>

          {/* Floating toolbar */}
          <div style={{ position: 'fixed', top: imgToolbarPos.top, left: imgRect.left, zIndex: 10000, background: '#1e293b', borderRadius: 6, padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>Position:</span>
              {[[-1,'↑'],[1,'↓']].map(([d, icon]) => (
                <button key={d} onMouseDown={e => { e.preventDefault(); moveImg(d); }}
                  style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer', background: '#334155', color: '#e2e8f0' }}>
                  {icon}
                </button>
              ))}
              <div style={{ width: 1, background: '#475569', alignSelf: 'stretch', margin: '0 3px' }} />
              <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>Align:</span>
              {[['left','←'],['center','↔'],['right','→']].map(([a, icon]) => (
                <button key={a} onMouseDown={e => { e.preventDefault(); applyImgAlign(a); }}
                  style={{ padding: '3px 9px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#e2e8f0', fontWeight: 500 }}>
                  {icon} {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
              <button onMouseDown={e => { e.preventDefault(); clearSelectedImg(); }}
                style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#94a3b8', marginLeft: 2 }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>Caption:</span>
              <input
                value={imgCaption}
                onChange={e => setImgCaption(e.target.value)}
                onBlur={() => applyCaption(imgCaption)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCaption(imgCaption); } }}
                placeholder="Add a caption…"
                style={{ flex: 1, minWidth: 180, padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 11, background: '#334155', color: '#e2e8f0', outline: 'none' }}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ── Content Block Editor ──────────────────────────────────────────
const parseContentBlocks = (v) => {
  if (!v) return [{ id: 1, type: 'text', content: '' }];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed) && parsed.length > 0)
      return parsed.map((b, i) => ({ ...b, id: b.id ?? Date.now() + i }));
  } catch {}
  // Legacy plain text / HTML → wrap in a single text block
  return [{ id: 1, type: 'text', content: v }];
};

let _blockId = 2000;
const nextId = () => ++_blockId;

function ContentBlockEditor({ value, onChange }) {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState(() => parseContentBlocks(value));

  const commit = (nb) => { setBlocks(nb); onChange(JSON.stringify(nb)); };

  const addBlock = (type) => {
    const base = type === 'image'
      ? { id: nextId(), type: 'image', url: '', caption: '', align: 'center', width: '100%' }
      : { id: nextId(), type: 'text', content: '' };
    commit([...blocks, base]);
  };

  const removeBlock = (id) => {
    const next = blocks.filter(b => b.id !== id);
    commit(next.length > 0 ? next : [{ id: nextId(), type: 'text', content: '' }]);
  };

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if ((dir < 0 && idx === 0) || (dir > 0 && idx === blocks.length - 1)) return;
    const n = [...blocks];
    [n[idx], n[idx + dir]] = [n[idx + dir], n[idx]];
    commit(n);
  };

  const updateBlock = (id, patch) => commit(blocks.map(b => b.id === id ? { ...b, ...patch } : b));

  const hdrStyle = { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const mbtn = { background: 'none', border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 7px', fontSize: 11, cursor: 'pointer', color: '#6b7280', lineHeight: 1.5 };
  const imgInp = { padding: '0.4rem 0.65rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' };

  return (
    <div>
      {blocks.map((block, idx) => (
        <div key={block.id} style={{ marginBottom: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div style={hdrStyle}>
            <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {block.type === 'image' ? t('blog_manage.block_image') : t('blog_manage.block_text')}
            </span>
            <button style={mbtn} onClick={() => moveBlock(block.id, -1)} disabled={idx === 0} title={t('blog_manage.move_up')}>↑</button>
            <button style={mbtn} onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1} title={t('blog_manage.move_down')}>↓</button>
            <button style={{ ...mbtn, color: '#C0382B', borderColor: '#fca5a5' }} onClick={() => removeBlock(block.id)} title={t('blog_manage.remove_block')}>✕</button>
          </div>

          {block.type === 'image' ? (
            <div style={{ padding: '0.75rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input style={imgInp} placeholder={t('blog_manage.img_url_placeholder')} value={block.url || ''}
                onChange={e => updateBlock(block.id, { url: e.target.value })} />
              {block.url && (
                <div style={{ textAlign: block.align || 'center' }}>
                  <img src={block.url} alt={block.caption || ''} onError={e => e.target.style.display = 'none'}
                    style={{ maxWidth: block.width || '100%', maxHeight: 220, borderRadius: 6, objectFit: 'contain', display: 'inline-block' }} />
                  {/* Caption sits directly under the image, styled like published output */}
                  <input
                    value={block.caption || ''}
                    onChange={e => updateBlock(block.id, { caption: e.target.value })}
                    placeholder={t('blog_manage.img_caption_placeholder')}
                    style={{
                      display: 'block', width: '100%', boxSizing: 'border-box',
                      border: 'none', borderBottom: '1px dashed #d1d5db',
                      background: 'transparent', outline: 'none',
                      textAlign: 'center', fontStyle: 'italic',
                      fontSize: '0.82rem', color: '#6b7280',
                      padding: '0.25rem 0.5rem', marginTop: '0.25rem',
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{t('blog_manage.align_label')}</span>
                {['left', 'center', 'right'].map(a => (
                  <button key={a} onClick={() => updateBlock(block.id, { align: a })}
                    style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid', fontSize: '0.78rem', cursor: 'pointer',
                      background: block.align === a ? '#819360' : '#f9fafb',
                      color: block.align === a ? '#fff' : '#374151',
                      borderColor: block.align === a ? '#819360' : '#d1d5db' }}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
                <span style={{ fontSize: '0.78rem', color: '#6b7280', marginLeft: 8 }}>{t('blog_manage.width_label')}</span>
                <select value={block.width || '100%'} onChange={e => updateBlock(block.id, { width: e.target.value })}
                  style={{ fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 5px', background: '#fff', cursor: 'pointer' }}>
                  {['25%', '33%', '50%', '66%', '75%', '100%'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <BlogRichTextEditor key={`txt-${block.id}`} value={block.content}
              onChange={v => updateBlock(block.id, { content: v })} />
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button onClick={() => addBlock('text')}
          style={{ padding: '5px 14px', border: '1px dashed #d1d5db', borderRadius: 6, background: '#f9fafb', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer', fontWeight: 500 }}>
          {t('blog_manage.btn_add_text')}
        </button>
        <button onClick={() => addBlock('image')}
          style={{ padding: '5px 14px', border: '1px dashed #d1d5db', borderRadius: 6, background: '#f9fafb', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer', fontWeight: 500 }}>
          {t('blog_manage.btn_add_image')}
        </button>
      </div>
    </div>
  );
}

function getExcerpt(content, wordLimit = 100) {
  if (!content) return '';
  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks))
      text = blocks.filter(b => b.type === 'text').map(b => b.content || '').join(' ');
  } catch {}
  const plain = text.replace(/<[^>]*>/g, '').trim();
  const words = plain.split(/\s+/);
  if (words.length <= wordLimit) return plain;
  return words.slice(0, wordLimit).join(' ') + '…';
}

const emptyForm = {
  title: '',
  content: '',
  cover_image: '',
  author: '',
  author_link: '',
  author_id: null,
  published_at: '',
  blog_cat_id: null,
  custom_cat_id: null,
  is_published: false,
  is_featured: false,
  show_on_directory: true,
  show_on_website: true,
};

// ── PostEditor ──────────────────────────────────────────────────
function PostEditor({ post, businessId, hasWebsite, globalCategories, customCategories,
                      onSave, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(post ? {
    title:             post.title || '',
    content:           post.content || '',
    cover_image:       post.cover_image || '',
    author:            post.author || '',
    author_link:       post.author_link || '',
    author_id:         post.author_id ?? null,
    published_at:      post.published_at ? post.published_at.slice(0, 10) : '',
    blog_cat_id:       post.blog_cat_id ?? null,
    custom_cat_id:     post.custom_cat_id ?? null,
    is_published:      post.is_published || false,
    is_featured:       post.is_featured || false,
    show_on_directory: post.show_on_directory !== false,
    show_on_website:   post.show_on_website !== false,
  } : { ...emptyForm });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAuthors, setSavedAuthors] = useState([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const autoSaveTimer = React.useRef(null);
  const isMount = React.useRef(true);
  const postIdRef = React.useRef(post?.blog_id ?? null);

  useEffect(() => {
    if (!businessId) return;
    authFetch(`${API_URL}/api/blog/authors?business_id=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setSavedAuthors(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [businessId]);

  // Autosave: debounce 1.5s after any form change, only for existing posts
  useEffect(() => {
    if (isMount.current) { isMount.current = false; return; }
    const blogId = postIdRef.current;
    if (!blogId || !form.title.trim()) return;
    clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('saving');
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const res = await authFetch(`${API_URL}/api/blog/manage/${blogId}?business_id=${businessId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        setAutoSaveStatus(res.ok ? 'saved' : 'error');
      } catch { setAutoSaveStatus('error'); }
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [form]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError(t('blog_manage.editor_error_title')); return; }
    setSaving(true);
    setError('');
    try {
      const isEdit = !!postIdRef.current;
      const url = isEdit
        ? `${API_URL}/api/blog/manage/${postIdRef.current}?business_id=${businessId}`
        : `${API_URL}/api/blog/manage?business_id=${businessId}`;
      const res = await authFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      if (!isEdit) {
        const data = await res.json();
        if (data?.blog_id) postIdRef.current = data.blog_id;
      }
      onSave();
    } catch {
      setError(t('blog_manage.editor_error_save'));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#374151', marginBottom: '0.25rem',
  };


  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
        {post ? t('blog_manage.editor_heading_edit') : t('blog_manage.editor_heading_new')}
      </h2>

      {error && <div style={{ background: '#fef2f2', color: '#C0382B', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '1rem' }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>{t('blog_manage.label_title')}</label>
          <input style={inputStyle} value={form.title}
            onChange={e => set('title', e.target.value)} placeholder={t('blog_manage.title_placeholder')} />
        </div>

        {/* Author row */}
        {savedAuthors.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>{t('blog_manage.label_saved_author')} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>{t('blog_manage.author_auto_fill')}</span></label>
              <select
                style={inputStyle}
                value={form.author_id ?? ''}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  const found = savedAuthors.find(a => a.author_id === id);
                  setForm(f => ({
                    ...f,
                    author_id: id,
                    author: found ? found.name : f.author,
                    author_link: found ? (found.author_link || '') : f.author_link,
                  }));
                }}
              >
                <option value="">{t('blog_manage.author_none_manual')}</option>
                {savedAuthors.map(a => (
                  <option key={a.author_id} value={a.author_id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div style={{ paddingTop: '1.25rem' }}>
              <Link to={`/blog/authors/manage?BusinessID=${businessId}`}
                style={{ fontSize: '0.8rem', color: '#7C5CBF', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {t('blog_manage.manage_authors')}
              </Link>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>{t('blog_manage.label_author')} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>{t('blog_manage.optional')}</span></label>
            <input style={inputStyle} value={form.author}
              onChange={e => { set('author', e.target.value); set('author_id', null); }} placeholder="Author name" />
          </div>
          <div>
            <label style={labelStyle}>{t('blog_manage.label_author_link')} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>{t('blog_manage.optional')}</span></label>
            <input style={inputStyle} value={form.author_link}
              onChange={e => set('author_link', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>{t('blog_manage.label_blog_date')} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>{t('blog_manage.optional')}</span></label>
            <input type="date" style={inputStyle} value={form.published_at}
              onChange={e => set('published_at', e.target.value)} />
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
              {t('blog_manage.blog_date_hint')}
            </p>
          </div>
        </div>

        {/* Categories + Cover Image — 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>

          {/* Public category */}
          <div>
            <label style={labelStyle}>{t('blog_manage.label_public_cat')}</label>
            <select
              style={inputStyle}
              value={form.blog_cat_id ?? ''}
              onChange={e => set('blog_cat_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('blog_manage.cat_select')}</option>
              {globalCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
              {t('blog_manage.public_cat_hint')}
            </p>
          </div>

          {/* Personal category */}
          <div>
            <label style={labelStyle}>{t('blog_manage.label_personal_cat')} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>{t('blog_manage.optional')}</span></label>

            {/* Dropdown of existing custom cats */}
            <select
              style={inputStyle}
              value={form.custom_cat_id ?? ''}
              onChange={e => set('custom_cat_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('blog_manage.cat_none')}</option>
              {customCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
              {t('blog_manage.personal_cat_hint')}
              <Link to={`/blog/manage?BusinessID=${businessId}&tab=categories`}
                style={{ color: '#7C5CBF', textDecoration: 'none', fontWeight: 600 }}>
                {t('blog_manage.manage_categories')}
              </Link>
            </p>
          </div>

          {/* Cover image */}
          <div>
            <label style={labelStyle}>{t('blog_manage.label_cover_image')} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>{t('blog_manage.optional')}</span></label>
            <input style={inputStyle} value={form.cover_image}
              onChange={e => set('cover_image', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {/* Content */}
        <div>
          <label style={labelStyle}>{t('blog_manage.label_content')} <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 400 }}>{t('blog_manage.optional')}</span></label>
          <ContentBlockEditor
            key={post?.blog_id ?? 'new'}
            value={form.content}
            onChange={v => set('content', v)}
          />
        </div>

        {/* Flags */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.9rem 1rem' }}>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('blog_manage.publishing_options')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_published}
                onChange={e => set('is_published', e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#819360' }} />
              <span><strong>{t('blog_manage.flag_published')}</strong> <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('blog_manage.flag_published_hint')}</span></span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_featured}
                onChange={e => set('is_featured', e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#819360' }} />
              <strong>{t('blog_manage.flag_featured')}</strong>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.show_on_directory}
                onChange={e => set('show_on_directory', e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#819360' }} />
              <span><strong>{t('blog_manage.flag_directory')}</strong> <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('blog_manage.flag_directory_hint')}</span></span>
            </label>
            {hasWebsite && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.show_on_website}
                  onChange={e => set('show_on_website', e.target.checked)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#819360' }} />
                <span><strong>{t('blog_manage.flag_website')}</strong> <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('blog_manage.flag_website_hint')}</span></span>
              </label>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
        <button onClick={onCancel}
          style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem 1.25rem', fontSize: '0.9rem', cursor: 'pointer' }}>
          {t('blog_manage.btn_cancel')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {autoSaveStatus === 'saving' && <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{t('blog_manage.autosave_saving')}</span>}
          {autoSaveStatus === 'saved'  && <span style={{ fontSize: '0.78rem', color: '#16a34a' }}>{t('blog_manage.autosave_saved')}</span>}
          {autoSaveStatus === 'error'  && <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{t('blog_manage.autosave_error')}</span>}
          <button onClick={handleSave} disabled={saving}
            style={{ background: '#819360', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? t('blog_manage.btn_saving') : t('blog_manage.btn_save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CategoriesTab ───────────────────────────────────────────────
function CategoriesTab({ businessId, globalCategories, customCategories, onCustomCategoriesChange }) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError('');
    try {
      const res = await authFetch(`${API_URL}/api/blog/categories/custom?business_id=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.status === 409) { setError(t('blog_manage.cat_error_exists')); return; }
      if (!res.ok) throw new Error();
      const created = await res.json();
      onCustomCategoriesChange([...customCategories, created]);
      setNewName('');
    } catch {
      setError(t('blog_manage.cat_error_add'));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(t('blog_manage.confirm_remove_cat', { name: cat.name }))) return;
    setDeleting(cat.id);
    try {
      await authFetch(`${API_URL}/api/blog/categories/custom/${cat.id}?business_id=${businessId}`,
        { method: 'DELETE' });
      onCustomCategoriesChange(customCategories.filter(c => c.id !== cat.id));
    } finally {
      setDeleting(null);
    }
  };

  const inputStyle = { padding: '0.45rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', flex: 1 };

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '700px' }}>
      {/* Global */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{t('blog_manage.cat_global_heading')}</h3>
        <p style={{ margin: '0 0 0.9rem', fontSize: '0.82rem', color: '#6b7280' }}>
          {t('blog_manage.cat_global_desc')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {globalCategories.map(c => (
            <span key={c.id} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 500 }}>
              {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* Custom */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{t('blog_manage.cat_custom_heading')}</h3>
        <p style={{ margin: '0 0 0.9rem', fontSize: '0.82rem', color: '#6b7280' }}>
          {t('blog_manage.cat_custom_desc')}
        </p>
        {error && <div style={{ background: '#fef2f2', color: '#C0382B', padding: '0.4rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.82rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input style={inputStyle} value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder={t('blog_manage.cat_new_placeholder')} />
          <button onClick={handleAdd} disabled={adding || !newName.trim()}
            style={{ background: '#819360', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.45rem 1rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', opacity: adding ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {t('blog_manage.btn_add_cat')}
          </button>
        </div>
        {customCategories.length === 0
          ? <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>{t('blog_manage.cat_none_yet')}</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {customCategories.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.88rem', color: '#374151' }}>{c.name}</span>
                  <button onClick={() => handleDelete(c)} disabled={deleting === c.id}
                    style={{ background: '#C0382B', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 9px', fontSize: '0.75rem', cursor: 'pointer', opacity: deleting === c.id ? 0.6 : 1 }}>
                    {t('blog_manage.btn_remove')}
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ── BlogManage (main) ───────────────────────────────────────────
export default function BlogManage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID = localStorage.getItem('people_id');
  const { Business, LoadBusiness } = useAccount();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => searchParams.get('view') === 'new' ? 'new' : 'list');
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'categories' ? 'categories' : 'posts');
  const [editPost, setEditPost] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [websiteId, setWebsiteId]   = useState(0);

  // Sort / filter state
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');   // '' | 'published' | 'draft'
  const [filterCat, setFilterCat] = useState('');         // category name
  const [sortBy, setSortBy] = useState('date_desc');       // date_desc | date_asc | title_asc | title_desc

  useEffect(() => { if (BusinessID) LoadBusiness(BusinessID); }, [BusinessID]);

  // Respond to URL param changes while the component is already mounted
  // (e.g. clicking sidebar links or "Manage categories" from the editor)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const viewParam = searchParams.get('view');
    if (tabParam === 'categories') {
      setActiveTab('categories');
      setView('list');
      setEditPost(null);
    } else if (viewParam === 'new') {
      setView('new');
      setEditPost(null);
      setActiveTab('posts');
    } else if (!tabParam && !viewParam) {
      setView('list');
      setActiveTab('posts');
    }
  }, [searchParams]);

  const loadCategories = async () => {
    const [g, c] = await Promise.all([
      authFetch(`${API_URL}/api/blog/categories/global`).then(r => r.json()).catch(() => []),
      authFetch(`${API_URL}/api/blog/categories/custom?business_id=${BusinessID}`).then(r => r.json()).catch(() => []),
    ]);
    setGlobalCategories(Array.isArray(g) ? g : []);
    setCustomCategories(Array.isArray(c) ? c : []);
  };

  const load = () => {
    setLoading(true);
    authFetch(`${API_URL}/api/blog/manage?business_id=${BusinessID}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (BusinessID) {
      load();
      loadCategories();
      // Check if this business has a website built, and grab its id for Lavendir
      fetch(`${API_URL}/api/website/site?business_id=${BusinessID}`)
        .then(async r => {
          setHasWebsite(r.ok);
          if (r.ok) {
            try {
              const data = await r.json();
              setWebsiteId(data?.website_id || data?.WebsiteID || 0);
            } catch { setWebsiteId(0); }
          } else {
            setWebsiteId(0);
          }
        })
        .catch(() => { setHasWebsite(false); setWebsiteId(0); });
    }
  }, [BusinessID]);

  const handleDelete = async (blogId) => {
    if (!window.confirm(t('blog_manage.confirm_delete'))) return;
    setDeleting(blogId);
    try {
      await authFetch(`${API_URL}/api/blog/manage/${blogId}?business_id=${BusinessID}`, { method: 'DELETE' });
      load();
    } finally { setDeleting(null); }
  };

  const handleSaved = () => { setView('list'); setEditPost(null); load(); };

  const [togglingPublish, setTogglingPublish] = useState(null);
  const [hoveredPublish, setHoveredPublish] = useState(null);
  const handleTogglePublish = async (post) => {
    setTogglingPublish(post.blog_id);
    try {
      const newVal = !post.is_published;
      const body = {
        title:             post.title || '',
        content:           post.content || null,
        cover_image:       post.cover_image || null,
        author:            post.author || null,
        author_link:       post.author_link || null,
        author_id:         post.author_id || null,
        blog_cat_id:       post.blog_cat_id || null,
        custom_cat_id:     post.custom_cat_id || null,
        is_published:      newVal,
        is_featured:       post.is_featured || false,
        show_on_directory: post.show_on_directory !== false,
        show_on_website:   post.show_on_website !== false,
        published_at:      newVal && !post.published_at
          ? new Date().toISOString().slice(0, 10)
          : (post.published_at || null),
      };
      const res = await authFetch(`${API_URL}/api/blog/manage/${post.blog_id}?business_id=${BusinessID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) console.error('Toggle publish failed:', res.status, await res.text());
      load();
    } finally { setTogglingPublish(null); }
  };

  const formatDate = (dt) => {
    if (!dt) return '';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const allCats = [...globalCategories, ...customCategories];

  // Derived: filtered + sorted posts
  const visiblePosts = posts
    .filter(p => {
      if (filterStatus === 'published' && !p.is_published) return false;
      if (filterStatus === 'draft' && p.is_published) return false;
      if (filterCat) {
        const [prefix, name] = filterCat.split(':');
        const match = prefix === 'g'
          ? (p.category_name || '') === name
          : (p.custom_category_name || '') === name;
        if (!match) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!(p.title || '').toLowerCase().includes(q) &&
            !(p.author || '').toLowerCase().includes(q) &&
            !getExcerpt(p.content).toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title_asc')  return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '');
      const da = new Date(a.published_at || a.created_at || 0);
      const db = new Date(b.published_at || b.created_at || 0);
      return sortBy === 'date_asc' ? da - db : db - da;
    });

  const globalCatNames = globalCategories.map(c => c.name).sort();
  const customCatNames = customCategories.map(c => c.name).sort();

  const tabStyle = (tab) => ({
    padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600,
    border: 'none', borderRadius: '7px', cursor: 'pointer',
    background: activeTab === tab ? '#819360' : '#f3f4f6',
    color: activeTab === tab ? '#fff' : '#374151',
  });

  const ctrlStyle = { fontSize: '0.82rem', border: '1px solid #d1d5db', borderRadius: 6, padding: '0.35rem 0.6rem', background: '#fff', color: '#374151', cursor: 'pointer' };

  if (view === 'new' || view === 'edit') {
    return (
      <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle={editPost ? t('blog_manage.page_title_edit') : t('blog_manage.page_title_new')} breadcrumbs={[{ label: t('nav.dashboard'), to: '/dashboard' }, { label: t('blog_manage.breadcrumb_blog') }, { label: t('blog_manage.breadcrumb_manage'), to: `/blog/manage?BusinessID=${BusinessID}` }, { label: editPost ? t('blog_manage.page_title_edit') : t('blog_manage.page_title_new') }]}>
        <div style={{ width: '100%' }}>
          <button onClick={() => { setView('list'); setEditPost(null); }}
            style={{ background: 'none', border: 'none', color: '#819360', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', padding: 0 }}>
            {t('blog_manage.back_to_posts')}
          </button>
          <PostEditor
            post={editPost}
            businessId={BusinessID}
            hasWebsite={hasWebsite}
            globalCategories={globalCategories}
            customCategories={customCategories}
            onSave={handleSaved}
            onCancel={() => { setView('list'); setEditPost(null); }}
          />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle={t('blog_manage.page_title_manage')} breadcrumbs={[{ label: t('nav.dashboard'), to: '/dashboard' }, { label: t('blog_manage.breadcrumb_blog') }, { label: t('blog_manage.breadcrumb_manage') }]}>
      <div style={{ width: '100%' }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}>{t('blog_manage.heading')}</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={tabStyle('posts')} onClick={() => setActiveTab('posts')}>{t('blog_manage.tab_posts')}</button>
            <button style={tabStyle('categories')} onClick={() => setActiveTab('categories')}>{t('blog_manage.tab_categories')}</button>
            {activeTab === 'posts' && (
              <button onClick={() => { setEditPost(null); setView('new'); }}
                style={{ background: '#819360', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                {t('blog_manage.btn_new_post')}
              </button>
            )}
          </div>
        </div>

        {activeTab === 'categories' && (
          <CategoriesTab
            businessId={BusinessID}
            globalCategories={globalCategories}
            customCategories={customCategories}
            onCustomCategoriesChange={setCustomCategories}
          />
        )}

        {activeTab === 'posts' && (
          <>
            {/* ── Filter / sort bar ── */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('blog_manage.search_placeholder')}
                style={{ ...ctrlStyle, flex: '1 1 160px', minWidth: '140px' }}
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={ctrlStyle}>
                <option value="">{t('blog_manage.filter_all_statuses')}</option>
                <option value="published">{t('blog_manage.filter_published')}</option>
                <option value="draft">{t('blog_manage.filter_draft')}</option>
              </select>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={ctrlStyle}>
                <option value="">{t('blog_manage.filter_all_cats')}</option>
                {globalCatNames.length > 0 && (
                  <optgroup label={t('blog_manage.optgroup_global')}>
                    {globalCatNames.map(n => <option key={`g:${n}`} value={`g:${n}`}>{n}</option>)}
                  </optgroup>
                )}
                {customCatNames.length > 0 && (
                  <optgroup label={t('blog_manage.optgroup_personal')}>
                    {customCatNames.map(n => <option key={`c:${n}`} value={`c:${n}`}>{n}</option>)}
                  </optgroup>
                )}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={ctrlStyle}>
                <option value="date_desc">{t('blog_manage.sort_newest')}</option>
                <option value="date_asc">{t('blog_manage.sort_oldest')}</option>
                <option value="title_asc">{t('blog_manage.sort_title_az')}</option>
                <option value="title_desc">{t('blog_manage.sort_title_za')}</option>
              </select>
              {(search || filterStatus || filterCat) && (
                <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterCat(''); }}
                  style={{ ...ctrlStyle, color: '#C0382B', borderColor: '#fca5a5' }}>
                  {t('blog_manage.btn_clear')}
                </button>
              )}
            </div>

            {loading && <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{t('blog_manage.loading_posts')}</p>}

            {!loading && posts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>{t('blog_manage.no_posts')}</p>
                <button onClick={() => { setEditPost(null); setView('new'); }}
                  style={{ background: '#819360', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                  {t('blog_manage.btn_write_first')}
                </button>
              </div>
            )}

            {!loading && posts.length > 0 && visiblePosts.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '0.88rem', padding: '1.5rem 0' }}>{t('blog_manage.no_match')}</p>
            )}

            {/* ── Post list ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {visiblePosts.map(post => {
                const cover = post.cover_image || (() => {
                  try {
                    const b = JSON.parse(post.content || '');
                    if (Array.isArray(b)) { const im = b.find(x => x.type === 'image' && x.url); return im?.url || null; }
                  } catch {} return null;
                })();
                return (
                  <div key={post.blog_id}
                    style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0.65rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>

                    {/* Thumbnail */}
                    {cover
                      ? <img src={cover} alt="" onError={e => e.target.style.display = 'none'}
                          style={{ width: 56, height: 44, objectFit: 'cover', borderRadius: 5, flexShrink: 0, marginTop: 2 }} />
                      : <div style={{ width: 56, height: 44, background: '#f3f4f6', borderRadius: 5, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                    }

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Row 1: title + date + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                          {post.title}
                        </span>
                        <span style={{ fontSize: '0.73rem', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                          {post.is_published && (
                            <Link to={`/blog/${post.blog_id}`} target="_blank"
                              style={{ fontSize: '0.75rem', color: '#819360', textDecoration: 'none', padding: '0.2rem 0.5rem', border: '1px solid #819360', borderRadius: '5px', whiteSpace: 'nowrap' }}>
                              {t('blog_manage.btn_view')}
                            </Link>
                          )}
                          <button onClick={() => { setEditPost(post); setView('edit'); }}
                            style={{ fontSize: '0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '5px', padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#374151' }}>
                            {t('blog_manage.btn_edit')}
                          </button>
                          <button onClick={() => handleDelete(post.blog_id)} disabled={deleting === post.blog_id}
                            style={{ fontSize: '0.75rem', background: '#C0382B', border: 'none', borderRadius: '5px', padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#fff', opacity: deleting === post.blog_id ? 0.6 : 1 }}>
                            {t('blog_manage.btn_delete')}
                          </button>
                        </div>
                      </div>

                      {/* Row 2: status badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>

                        {/* Published / Draft — clickable toggle */}
                        {(() => {
                          const busy = togglingPublish === post.blog_id;
                          const hov = hoveredPublish === post.blog_id;
                          return (
                            <button
                              title={post.is_published ? t('blog_manage.toggle_unpublish_title') : t('blog_manage.toggle_publish_title')}
                              onClick={() => handleTogglePublish(post)}
                              onMouseEnter={() => setHoveredPublish(post.blog_id)}
                              onMouseLeave={() => setHoveredPublish(null)}
                              disabled={busy}
                              style={{ fontSize: '0.67rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                                cursor: 'pointer', border: 'none', outline: 'none', transition: 'background 0.15s, color 0.15s',
                                background: post.is_published
                                  ? (hov ? '#fee2e2' : '#dcfce7')
                                  : (hov ? '#dcfce7' : '#f3f4f6'),
                                color: post.is_published
                                  ? (hov ? '#b91c1c' : '#15803d')
                                  : (hov ? '#15803d' : '#6b7280'),
                                boxShadow: `0 0 0 1px ${post.is_published ? (hov ? '#fca5a5' : '#86efac') : (hov ? '#86efac' : '#e5e7eb')}`,
                                opacity: busy ? 0.6 : 1,
                              }}>
                              {busy ? '…' : post.is_published ? (hov ? t('blog_manage.status_unpublish') : t('blog_manage.status_published')) : (hov ? t('blog_manage.status_publish') : t('blog_manage.status_draft'))}
                            </button>
                          );
                        })()}

                        {/* Featured */}
                        <span title="Featured post" style={{ fontSize: '0.67rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                          background: post.is_featured ? '#fef9c3' : '#f9fafb',
                          color: post.is_featured ? '#854d0e' : '#9ca3af',
                          border: `1px solid ${post.is_featured ? '#fde68a' : '#e5e7eb'}` }}>
                          {post.is_featured ? t('blog_manage.badge_featured') : t('blog_manage.badge_not_featured')}
                        </span>

                        {/* Show on Directory */}
                        <span title="Show on OFN network directory listing" style={{ fontSize: '0.67rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                          background: post.show_on_directory ? '#dbeafe' : '#f9fafb',
                          color: post.show_on_directory ? '#1d4ed8' : '#9ca3af',
                          border: `1px solid ${post.show_on_directory ? '#93c5fd' : '#e5e7eb'}` }}>
                          {post.show_on_directory ? t('blog_manage.badge_directory_on') : t('blog_manage.badge_directory_off')}
                        </span>

                        {/* Show on Website */}
                        <span title="Show on your custom website" style={{ fontSize: '0.67rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                          background: post.show_on_website ? '#f0fdf4' : '#f9fafb',
                          color: post.show_on_website ? '#166534' : '#9ca3af',
                          border: `1px solid ${post.show_on_website ? '#86efac' : '#e5e7eb'}` }}>
                          {post.show_on_website ? t('blog_manage.badge_website_on') : t('blog_manage.badge_website_off')}
                        </span>

                        {/* Divider */}
                        {(post.category_name || post.custom_category_name) && (
                          <span style={{ width: 1, height: 14, background: '#e5e7eb', display: 'inline-block', margin: '0 2px', flexShrink: 0 }} />
                        )}

                        {/* Network / global category */}
                        {post.category_name && (
                          <span title="Network category" style={{ fontSize: '0.67rem', padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                            background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                            🌐 {post.category_name}
                          </span>
                        )}

                        {/* Private / custom category */}
                        {post.custom_category_name && (
                          <span title="Your private category" style={{ fontSize: '0.67rem', padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                            background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe' }}>
                            🔒 {post.custom_category_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && visiblePosts.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
                {t(posts.length !== 1 ? 'blog_manage.showing_count_plural' : 'blog_manage.showing_count', { visible: visiblePosts.length, total: posts.length })}
              </p>
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}
