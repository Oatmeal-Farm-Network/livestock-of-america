// Ported from Oatmeal Farm Network (src/AccountProfile.jsx). Logic is unchanged;
// only the router package, i18n hook, component paths and API base differ.
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from '../lib/i18n';
import AccountLayout from '../components/AccountLayout';
import { useAccount } from '../lib/AccountContext';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

// ── Rich Text Editor (same as BlogManage) ─────────────────────────────────────

const WEB_FONTS = [
  { label: 'Arial',            value: 'Arial, sans-serif' },
  { label: 'Georgia',          value: 'Georgia, serif' },
  { label: 'Inter',            value: 'Inter, sans-serif' },
  { label: 'Lato',             value: 'Lato, sans-serif' },
  { label: 'Montserrat',       value: 'Montserrat, sans-serif' },
  { label: 'Open Sans',        value: 'Open Sans, sans-serif' },
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
  const editorRef = useRef(null);
  const htmlRef   = useRef(null);
  const fileInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const resizingRef = useRef(null);

  const [htmlMode,      setHtmlMode]      = useState(false);
  const [imgPanel,      setImgPanel]      = useState(false);
  const [imgUrl,        setImgUrl]        = useState('');
  const [imgAlign,      setImgAlign]      = useState('center');
  const [draggingOver,  setDraggingOver]  = useState(false);
  const [panelDragging, setPanelDragging] = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [selectedImg,   setSelectedImg]   = useState(null);
  const [imgToolbarPos, setImgToolbarPos] = useState({ top: 0, left: 0 });
  const [imgCaption,    setImgCaption]    = useState('');
  const [imgRect,       setImgRect]       = useState(null);

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
  const applyFont  = font => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { document.execCommand('fontName', false, font); return; }
    const range = sel.getRangeAt(0);
    const span  = document.createElement('span');
    span.style.fontFamily = font;
    try { range.surroundContents(span); } catch { document.execCommand('fontName', false, font); }
  };
  const insertLink = () => {
    const input = window.prompt('Enter a URL:');
    if (!input) return;
    const val  = input.trim();
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
    setSelectedImg(null); setImgRect(null);
  };
  const startResize = (e, dir) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedImg) return;
    resizingRef.current = { dir, startX: e.clientX, startWidth: selectedImg.getBoundingClientRect().width };
    const onMove = (ev) => {
      const { startX, startWidth, dir } = resizingRef.current;
      const dx = dir === 'right' ? ev.clientX - startX : startX - ev.clientX;
      selectedImg.style.width    = Math.max(40, startWidth + dx) + 'px';
      selectedImg.style.maxWidth = 'none';
      setImgRect(selectedImg.getBoundingClientRect());
    };
    const onUp = () => {
      onChange(editorRef.current?.innerHTML || '');
      resizingRef.current = null;
      setImgRect(selectedImg ? selectedImg.getBoundingClientRect() : null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  const applyCaption = (text) => {
    if (!selectedImg) return;
    const fig = selectedImg.closest('figure');
    if (!fig) {
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
      if (!fc) { fc = document.createElement('figcaption'); fc.style.cssText = 'font-size:0.82em;color:#6b7280;text-align:center;font-style:italic;margin-top:0.3em;'; fig.appendChild(fc); }
      fc.textContent = text;
    }
    onChange(editorRef.current?.innerHTML || '');
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
    if (dir < 0) { const prev = root.previousElementSibling; if (prev) editorRef.current.insertBefore(root, prev); }
    else { const next = root.nextElementSibling; if (next) editorRef.current.insertBefore(next, root); }
    onChange(editorRef.current?.innerHTML || '');
    setTimeout(() => { const r = selectedImg.getBoundingClientRect(); setImgRect(r); setImgToolbarPos({ top: r.top - 72, left: r.left }); }, 0);
  };
  const _liftToEditor = (img) => {
    let node = img;
    while (node.parentElement && node.parentElement !== editorRef.current) node = node.parentElement;
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
      if (parent.tagName === 'FIGURE') { parent.style.cssText = 'text-align:center;margin:1em 0;clear:both;'; img.style.cssText = 'max-width:100%;border-radius:4px;float:none;'; }
      else { _liftToEditor(img); const fig = document.createElement('figure'); fig.style.cssText = 'text-align:center;margin:1em 0;clear:both;'; editorRef.current.insertBefore(fig, img); fig.appendChild(img); img.style.cssText = 'max-width:100%;border-radius:4px;float:none;'; }
    } else {
      const cssText = align === 'left' ? 'float:left;margin:0 1em 0.5em 0;max-width:45%;border-radius:4px;' : 'float:right;margin:0 0 0.5em 1em;max-width:45%;border-radius:4px;';
      if (parent.tagName === 'FIGURE') { parent.parentElement.insertBefore(img, parent); parent.remove(); }
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
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`${API_URL}/api/blog/upload-image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setImgUrl(url);
    } catch {} finally { setUploading(false); }
  };

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    editorRef.current?.focus();
    const x = e.clientX, y = e.clientY;
    let range;
    if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) { const pos = document.caretPositionFromPoint(x, y); if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); } }
    if (range) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`${API_URL}/api/blog/upload-image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      document.execCommand('insertHTML', false, `<figure style="text-align:center;margin:1em 0;"><img src="${url}" style="max-width:100%;border-radius:4px;" /></figure>`);
      onChange(editorRef.current?.innerHTML || '');
    } catch {} finally { setUploading(false); }
  };

  const openImgPanel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    setImgUrl(''); setImgAlign('center'); setImgPanel(p => !p);
  };

  const insertImage = () => {
    if (!imgUrl.trim()) return;
    const url = imgUrl.trim();
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
    if (imgAlign === 'center') {
      document.execCommand('insertHTML', false, `<figure style="text-align:center;margin:1em 0;clear:both;"><img src="${url}" style="max-width:100%;border-radius:4px;" /></figure>`);
    } else {
      const cssText = imgAlign === 'left' ? 'float:left;margin:0 1em 0.5em 0;max-width:45%;border-radius:4px;' : 'float:right;margin:0 0 0.5em 1em;max-width:45%;border-radius:4px;';
      const img = document.createElement('img'); img.src = url; img.style.cssText = cssText;
      const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      let refBlock = null;
      if (range) { let node = range.commonAncestorContainer; if (node.nodeType === Node.TEXT_NODE) node = node.parentElement; if (node === editorRef.current) refBlock = editorRef.current.children[range.startOffset] || null; else { while (node && node.parentElement !== editorRef.current) node = node.parentElement; if (node && node !== editorRef.current) refBlock = node; } }
      if (refBlock) editorRef.current.insertBefore(img, refBlock);
      else { editorRef.current.appendChild(img); const p = document.createElement('p'); p.innerHTML = '<br>'; editorRef.current.appendChild(p); }
    }
    onChange(editorRef.current?.innerHTML || '');
    setImgPanel(false);
  };

  const btn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 7px', borderRadius: 4, fontSize: 12, cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', color: '#374151', lineHeight: 1 };
  const selStyle = { fontSize: 11, border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 5px', background: '#fff', cursor: 'pointer', color: '#374151' };
  const divider  = <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />;

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
        {!htmlMode && <>
          <select style={selStyle} defaultValue="" onChange={e => { applyBlock(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>Style</option>
            <option value="p">Body</option><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option>
          </select>
          <select style={{ ...selStyle, maxWidth: 110 }} defaultValue="" onChange={e => { applyFont(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>Font</option>
            {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          {divider}
          <button style={{ ...btn, fontWeight: 700 }} title="Bold"          onMouseDown={e => { e.preventDefault(); exec('bold'); }}>B</button>
          <button style={{ ...btn, fontStyle: 'italic' }} title="Italic"    onMouseDown={e => { e.preventDefault(); exec('italic'); }}>I</button>
          <button style={{ ...btn, textDecoration: 'underline' }} title="Underline" onMouseDown={e => { e.preventDefault(); exec('underline'); }}>U</button>
          <button style={{ ...btn, textDecoration: 'line-through' }} title="Strikethrough" onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }}>S</button>
          {divider}
          <button style={btn} title="Align Left"   onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="0" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="0" y="11.5" width="9" height="1.5"/></svg></button>
          <button style={btn} title="Center"        onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="2" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="2" y="11.5" width="9" height="1.5"/></svg></button>
          <button style={btn} title="Align Right"   onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="4" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="4" y="11.5" width="9" height="1.5"/></svg></button>
          {divider}
          <button style={btn} title="Bullet List"   onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="1.5" cy="2.5" r="1.2"/><rect x="4" y="1.8" width="9" height="1.4"/><circle cx="1.5" cy="6.5" r="1.2"/><rect x="4" y="5.8" width="9" height="1.4"/><circle cx="1.5" cy="10.5" r="1.2"/><rect x="4" y="9.8" width="9" height="1.4"/></svg></button>
          <button style={btn} title="Numbered List" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><text x="0" y="4" fontSize="4.5" fontFamily="monospace">1.</text><rect x="4" y="1.8" width="9" height="1.4"/><text x="0" y="8" fontSize="4.5" fontFamily="monospace">2.</text><rect x="4" y="5.8" width="9" height="1.4"/><text x="0" y="12" fontSize="4.5" fontFamily="monospace">3.</text><rect x="4" y="9.8" width="9" height="1.4"/></svg></button>
          {divider}
          <button style={btn} title="Insert Link"   onMouseDown={e => { e.preventDefault(); insertLink(); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></button>
          <button style={{ ...btn, fontSize: 10 }} title="Remove Link" onMouseDown={e => { e.preventDefault(); exec('unlink'); }}>✕🔗</button>
          {divider}
          <button style={{ ...btn, fontSize: 10, color: '#b91c1c' }} title="Clear formatting" onMouseDown={e => { e.preventDefault(); clearFormatting(); }}>Tx</button>
          {divider}
          <button style={{ ...btn, background: imgPanel ? '#e0f2fe' : '#fff', borderColor: imgPanel ? '#7dd3fc' : '#d1d5db' }} title="Insert Image" onMouseDown={e => { e.preventDefault(); openImgPanel(); }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>
          {divider}
        </>}
        <button onClick={() => setHtmlMode(m => !m)} style={{ ...btn, fontFamily: 'monospace', fontSize: 11, background: htmlMode ? '#1e293b' : '#fff', color: htmlMode ? '#7dd3fc' : '#374151', border: `1px solid ${htmlMode ? '#334155' : '#d1d5db'}` }}>&lt;/&gt;</button>
      </div>

      {imgPanel && !htmlMode && (
        <div style={{ padding: '10px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="Paste image URL…" autoFocus
              style={{ flex: 1, minWidth: 160, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 12 }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertImage(); } if (e.key === 'Escape') setImgPanel(false); }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: '#fff', color: '#374151', whiteSpace: 'nowrap' }}>Browse…</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handlePanelFile(f); e.target.value = ''; }} />
          </div>
          <div onDragOver={e => { e.preventDefault(); setPanelDragging(true); }} onDragLeave={() => setPanelDragging(false)}
            onDrop={e => { e.preventDefault(); setPanelDragging(false); handlePanelFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${panelDragging ? '#3b82f6' : '#bae6fd'}`, borderRadius: 6, padding: '10px 8px', textAlign: 'center', fontSize: 11, color: panelDragging ? '#2563eb' : '#0891b2', cursor: 'pointer', background: panelDragging ? '#eff6ff' : 'transparent', transition: 'all 0.15s' }}>
            {uploading ? 'Uploading…' : 'Drop image here or click to browse'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['left', 'center', 'right'].map(a => (
                <button key={a} onClick={() => setImgAlign(a)} style={{ padding: '3px 9px', borderRadius: 4, border: '1px solid', fontSize: 11, cursor: 'pointer', background: imgAlign === a ? '#0891b2' : '#fff', color: imgAlign === a ? '#fff' : '#374151', borderColor: imgAlign === a ? '#0891b2' : '#d1d5db' }}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={insertImage} disabled={!imgUrl.trim() || uploading} style={{ padding: '3px 12px', borderRadius: 4, border: '1px solid #0891b2', background: imgUrl.trim() && !uploading ? '#0891b2' : '#94a3b8', color: '#fff', fontSize: 11, cursor: imgUrl.trim() && !uploading ? 'pointer' : 'default', fontWeight: 600 }}>Insert</button>
            <button onClick={() => setImgPanel(false)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {uploading && (
        <div style={{ padding: '8px 12px', background: '#fefce8', borderBottom: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>Uploading image…</div>
      )}

      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onBlur={handleBlur} onPaste={pasteAsPlainText}
        onClick={e => { if (e.target.tagName === 'IMG') selectImg(e.target); else clearSelectedImg(); }}
        onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        style={{ display: htmlMode ? 'none' : 'block', minHeight: 200, padding: '10px 12px', fontSize: 14, lineHeight: 1.75, color: '#111827', outline: 'none', background: draggingOver ? '#eff6ff' : '#fff', overflowY: 'auto', border: draggingOver ? '2px dashed #3b82f6' : 'none', transition: 'background 0.15s' }} />
      <textarea ref={htmlRef} onBlur={e => onChange(e.target.value)}
        style={{ display: htmlMode ? 'block' : 'none', width: '100%', minHeight: 200, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6, color: '#0f172a', background: '#f8fafc', border: 'none', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />

      {selectedImg && imgRect && createPortal(
        <>
          <div style={{ position: 'fixed', top: imgRect.top - 1, left: imgRect.left - 1, width: imgRect.width + 2, height: imgRect.height + 2, border: '2px solid #3b82f6', pointerEvents: 'none', zIndex: 9998 }} />
          {[{ cursor: 'ew-resize', dir: 'left', top: imgRect.top + imgRect.height / 2 - 6, left: imgRect.left - 6 },
            { cursor: 'ew-resize', dir: 'right', top: imgRect.top + imgRect.height / 2 - 6, left: imgRect.right - 6 },
            { cursor: 'nw-resize', dir: 'left', top: imgRect.top - 6, left: imgRect.left - 6 },
            { cursor: 'ne-resize', dir: 'right', top: imgRect.top - 6, left: imgRect.right - 6 },
            { cursor: 'sw-resize', dir: 'left', top: imgRect.bottom - 6, left: imgRect.left - 6 },
            { cursor: 'se-resize', dir: 'right', top: imgRect.bottom - 6, left: imgRect.right - 6 },
          ].map(({ cursor, dir, top, left }, i) => (
            <div key={i} onMouseDown={e => startResize(e, dir)} style={{ position: 'fixed', top, left, width: 12, height: 12, background: '#fff', border: '2px solid #3b82f6', borderRadius: 2, cursor, zIndex: 9999 }} />
          ))}
          <div style={{ position: 'fixed', top: imgRect.bottom + 4, left: imgRect.left, fontSize: 10, color: '#3b82f6', background: 'rgba(255,255,255,0.9)', padding: '1px 5px', borderRadius: 3, pointerEvents: 'none', zIndex: 9999 }}>
            {Math.round(imgRect.width)} × {Math.round(imgRect.height)}px
          </div>
          <div style={{ position: 'fixed', top: imgToolbarPos.top, left: imgRect.left, zIndex: 10000, background: '#1e293b', borderRadius: 6, padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>Position:</span>
              {[[-1,'↑'],[1,'↓']].map(([d, icon]) => (
                <button key={d} onMouseDown={e => { e.preventDefault(); moveImg(d); }} style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer', background: '#334155', color: '#e2e8f0' }}>{icon}</button>
              ))}
              <div style={{ width: 1, background: '#475569', alignSelf: 'stretch', margin: '0 3px' }} />
              <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>Align:</span>
              {[['left','← Left'],['center','↔ Center'],['right','→ Right']].map(([a, label]) => (
                <button key={a} onMouseDown={e => { e.preventDefault(); applyImgAlign(a); }} style={{ padding: '3px 9px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#e2e8f0', fontWeight: 500 }}>{label}</button>
              ))}
              <button onMouseDown={e => { e.preventDefault(); clearSelectedImg(); }} style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#94a3b8', marginLeft: 2 }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>Caption:</span>
              <input value={imgCaption} onChange={e => setImgCaption(e.target.value)} onBlur={() => applyCaption(imgCaption)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCaption(imgCaption); } }}
                placeholder="Add a caption…"
                style={{ flex: 1, minWidth: 180, padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 11, background: '#334155', color: '#e2e8f0', outline: 'none' }} />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ── Logo upload with drag & drop ──────────────────────────────────────────────

function LogoUpload({ businessId, currentLogo, onUploaded }) {
  const { t } = useTranslation();
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(currentLogo || null);
  const inputRef = useRef(null);

  useEffect(() => { setPreview(currentLogo || null); }, [currentLogo]);

  const upload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/businesses/upload-logo/${businessId}`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setPreview(url);
      onUploaded(url);
    } catch (e) {
      alert(t('account_profile.logo_upload_error', { message: e.message }));
      setPreview(currentLogo || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: 12,
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#eff6ff' : '#fafafa',
          transition: 'all 0.15s',
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {preview ? (
          <img src={preview} alt={t('account_profile.logo_alt')} style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }} />
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 36 }}>🖼</div>
        )}
        <p style={{ margin: 0, fontSize: 12, color: uploading ? '#3b82f6' : '#6b7280' }}>
          {uploading ? t('account_profile.logo_uploading') : dragging ? t('account_profile.logo_drop') : preview ? t('account_profile.logo_replace') : t('account_profile.logo_add')}
        </p>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files[0]; if (f) upload(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const SOCIAL_FIELDS = [
  { key: 'BusinessFacebook',    label: 'Facebook',     placeholder: 'https://facebook.com/yourpage' },
  { key: 'BusinessInstagram',   label: 'Instagram',    placeholder: 'https://instagram.com/yourhandle' },
  { key: 'BusinessX',           label: 'Twitter / X',  placeholder: 'https://x.com/yourhandle' },
  { key: 'BusinessLinkedIn',    label: 'LinkedIn',     placeholder: 'https://linkedin.com/company/yourco' },
  { key: 'BusinessPinterest',   label: 'Pinterest',    placeholder: 'https://pinterest.com/yourprofile' },
  { key: 'BusinessYouTube',     label: 'YouTube',      placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'BusinessTruthSocial', label: 'Truth Social', placeholder: 'https://truthsocial.com/@yourhandle' },
  { key: 'BusinessBlog',        label: 'Blog',         placeholder: 'https://yourblog.com' },
  { key: 'BusinessOtherSocial1',label: 'Other Social 1', placeholder: 'https://...' },
  { key: 'BusinessOtherSocial2',label: 'Other Social 2', placeholder: 'https://...' },
];

export default function AccountProfile() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('BusinessID');
  const navigate   = useNavigate();
  const { Business, LoadBusiness, businesses } = useAccount();
  const isRestaurantBusiness = Array.isArray(businesses)
    && businesses.some(b => parseInt(b.BusinessID) === parseInt(businessId)
                          && (b.BusinessType || '').toLowerCase() === 'restaurant');

  const [form,    setForm]    = useState(null);
  const [states,  setStates]  = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors,  setErrors]  = useState({});

  const peopleId = localStorage.getItem('people_id');

  const loadProfile = () =>
    fetch(`${API_URL}/api/businesses/profile/${businessId}`)
      .then(r => r.json())
      .then(data => {
        setForm(data);
        const country = data.country_name || 'USA';
        return fetch(`${API_URL}/api/businesses/states?country=${encodeURIComponent(country)}`);
      })
      .then(r => r.json())
      .then(data => setStates(Array.isArray(data) ? data : []))
      .catch(() => {});

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    if (!businessId) { navigate('/dashboard'); return; }
    LoadBusiness(businessId);
    loadProfile();
  }, [businessId]);

  const update = (field, value) => { setForm(f => ({ ...f, [field]: value })); setSuccess(false); };

  const handleCountryChange = (country) => {
    update('country_name', country);
    update('StateIndex', '');
    fetch(`${API_URL}/api/businesses/states?country=${encodeURIComponent(country)}`)
      .then(r => r.json())
      .then(data => setStates(Array.isArray(data) ? data : []))
      .catch(() => setStates([]));
  };

  const validate = () => {
    const e = {};
    if (!form.BusinessName?.trim()) e.BusinessName = t('account_profile.error_name_required');
    if (!form.ContactEmail?.trim()) e.ContactEmail = t('account_profile.error_email_required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/businesses/profile/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        LoadBusiness(businessId, true);
        loadProfile();
        window.scrollTo(0, 0);
      } else {
        const data = await res.json();
        setErrors({ submit: data.detail || t('account_profile.error_generic') });
      }
    } catch {
      setErrors({ submit: t('account_profile.error_retry') });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#819360]';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';
  const errorClass = 'text-red-500 text-xs mt-1';
  const sectionCard = 'bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4';

  if (!form || !Business) return (
    <AccountLayout Business={Business} BusinessID={businessId} PeopleID={peopleId} pageTitle={t('account_profile.page_title')} breadcrumbs={[{ label: t('account_profile.breadcrumb_dashboard'), to: '/dashboard' }, { label: t('account_profile.breadcrumb_settings') }, { label: t('account_profile.breadcrumb_profile') }]}>
      <div className="text-center py-20 text-gray-400">{t('account_profile.loading')}</div>
    </AccountLayout>
  );

  return (
    <AccountLayout Business={Business} BusinessID={businessId} PeopleID={peopleId} pageTitle={t('account_profile.page_title')} breadcrumbs={[{ label: t('account_profile.breadcrumb_dashboard'), to: '/dashboard' }, { label: t('account_profile.breadcrumb_settings') }, { label: t('account_profile.breadcrumb_profile') }]}>
      <div className="space-y-6 w-full">

        <h1 className="text-2xl font-bold text-gray-800">{t('account_profile.page_title')}</h1>

        {success && <div className="bg-green-50 border border-green-300 text-green-700 rounded px-4 py-3 text-sm">{t('account_profile.success')}</div>}
        {errors.submit && <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">{errors.submit}</div>}

        {/* ── Business Logo ── */}
        <div className={sectionCard}>
          <h2 className="text-base font-semibold text-gray-700">{t('account_profile.sec_logo')}</h2>
          <LogoUpload businessId={businessId} currentLogo={form.Logo} onUploaded={url => update('Logo', url)} />
        </div>

        {/* ── Contact info ── */}
        <div className={sectionCard}>
          <h2 className="text-base font-semibold text-gray-700">{t('account_profile.sec_contact')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>{t('account_profile.label_first_name')} <span className="text-gray-400 font-normal">{t('account_profile.optional')}</span></label>
              <input type="text" value={form.ContactFirstName || ''} onChange={e => update('ContactFirstName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_last_name')} <span className="text-gray-400 font-normal">{t('account_profile.optional')}</span></label>
              <input type="text" value={form.ContactLastName || ''} onChange={e => update('ContactLastName', e.target.value)} className={inputClass} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>{t('account_profile.label_business_name')}</label>
              <input type="text" value={form.BusinessName || ''} onChange={e => update('BusinessName', e.target.value)} className={inputClass} maxLength={100} />
              {errors.BusinessName && <p className={errorClass}>{errors.BusinessName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('account_profile.label_email')}</label>
              <input type="email" value={form.ContactEmail || ''} onChange={e => update('ContactEmail', e.target.value)} className={inputClass} />
              {errors.ContactEmail && <p className={errorClass}>{errors.ContactEmail}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_website')} <span className="text-gray-400 font-normal">{t('account_profile.optional')}</span></label>
              <input type="text" value={form.BusinessWebsite || ''} onChange={e => update('BusinessWebsite', e.target.value)} className={inputClass} placeholder="https://yourwebsite.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('account_profile.label_phone')} <span className="text-gray-400 font-normal">{t('account_profile.optional')}</span></label>
              <input type="tel" value={form.BusinessPhone || ''} onChange={e => update('BusinessPhone', e.target.value.replace(/[^0-9().\-\s+]/g, ''))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_cell')} <span className="text-gray-400 font-normal">{t('account_profile.optional')}</span></label>
              <input type="tel" value={form.BusinessCell || ''} onChange={e => update('BusinessCell', e.target.value.replace(/[^0-9().\-\s+]/g, ''))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_fax')} <span className="text-gray-400 font-normal">{t('account_profile.optional')}</span></label>
              <input type="tel" value={form.BusinessFax || ''} onChange={e => update('BusinessFax', e.target.value.replace(/[^0-9().\-\s+]/g, ''))} className={inputClass} />
            </div>
          </div>
        </div>

        {/* ── Address ── */}
        <div className={sectionCard}>
          <h2 className="text-base font-semibold text-gray-700">{t('account_profile.sec_address')} <span className="text-gray-400 font-normal text-sm">{t('account_profile.optional')}</span></h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>{t('account_profile.label_address')}</label>
              <input type="text" value={form.AddressStreet || ''} onChange={e => update('AddressStreet', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_apt')}</label>
              <input type="text" value={form.AddressApt || ''} onChange={e => update('AddressApt', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>{t('account_profile.label_city')}</label>
              <input type="text" value={form.AddressCity || ''} onChange={e => update('AddressCity', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_zip')}</label>
              <input type="text" value={form.AddressZip || ''} onChange={e => update('AddressZip', e.target.value)} className={inputClass} maxLength={10} />
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_state')}</label>
              <select value={form.StateIndex || ''} onChange={e => update('StateIndex', e.target.value)} className={inputClass}>
                <option value="">{t('account_profile.state_select')}</option>
                {states.map(s => <option key={s.StateIndex} value={s.StateIndex}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('account_profile.label_country')}</label>
              <select value={form.country_name || 'USA'} onChange={e => handleCountryChange(e.target.value)} className={inputClass}>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Business Description ── */}
        <div className={sectionCard}>
          <h2 className="text-base font-semibold text-gray-700">{t('account_profile.sec_description')} <span className="text-gray-400 font-normal text-sm">{t('account_profile.optional')}</span></h2>
          <p className="text-xs text-gray-400">{t('account_profile.description_hint')}</p>
          <RichTextEditor
            value={form.BusinessDescription || ''}
            onChange={val => update('BusinessDescription', val)}
          />
        </div>

        {/* ── Restaurant Profile ── shown only when this business is a Restaurant */}
        {isRestaurantBusiness && (
          <div className={sectionCard}>
            <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#3D6B34]"><line x1="5" y1="2" x2="5" y2="14"/><path d="M3 2v4a2 2 0 0 0 4 0V2"/><line x1="11" y1="2" x2="11" y2="14"/><path d="M9 2h3a0 0 0 0 1 0 4v0"/></svg>
              {t('account_profile.sec_restaurant')} <span className="text-gray-400 font-normal text-sm">{t('account_profile.optional')}</span>
            </h2>
            <p className="text-xs text-gray-400">{t('account_profile.restaurant_hint')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('account_profile.label_cuisine')}</label>
                <input type="text" value={form.Cuisine || ''} onChange={e => update('Cuisine', e.target.value)}
                  placeholder="e.g. Pacific Northwest, Italian, Farm-to-Table"
                  className={inputClass} maxLength={200} />
              </div>
              <div>
                <label className={labelClass}>{t('account_profile.label_head_chef')}</label>
                <input type="text" value={form.HeadChef || ''} onChange={e => update('HeadChef', e.target.value)}
                  placeholder="Chef's name"
                  className={inputClass} maxLength={200} />
              </div>
              <div>
                <label className={labelClass}>{t('account_profile.label_seating')}</label>
                <input type="number" min="0" value={form.SeatingCapacity || ''} onChange={e => update('SeatingCapacity', e.target.value)}
                  placeholder="e.g. 80"
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('account_profile.label_year_opened')}</label>
                <input type="number" min="1900" max="2100" value={form.YearOpened || ''} onChange={e => update('YearOpened', e.target.value)}
                  placeholder="e.g. 2014"
                  className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('account_profile.label_hours')}</label>
                <input type="text" value={form.RestaurantHours || ''} onChange={e => update('RestaurantHours', e.target.value)}
                  placeholder="e.g. Tue–Sun 5pm–10pm; closed Mon"
                  className={inputClass} maxLength={500} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('account_profile.label_sourcing')}</label>
                <textarea value={form.SourcingPhilosophy || ''} onChange={e => update('SourcingPhilosophy', e.target.value)}
                  placeholder="What do you look for in farm partners? Tell their story."
                  rows={3} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* ── Social Media ── */}
        <div className={sectionCard}>
          <h2 className="text-base font-semibold text-gray-700">{t('account_profile.sec_social')} <span className="text-gray-400 font-normal text-sm">{t('account_profile.optional')}</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input type="url" value={form[key] || ''} onChange={e => update(key, e.target.value)} className={inputClass} placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Save ── */}
        <div className="flex justify-end pb-8">
          <button onClick={handleSave} disabled={saving} className="regsubmit2 px-6 py-2 disabled:opacity-60">
            {saving ? t('account_profile.btn_saving') : t('account_profile.btn_update')}
          </button>
        </div>

      </div>
    </AccountLayout>
  );
}
