// Ported from Oatmeal Farm Network (src/RichTextEditor.jsx). Supporting component for
// the events admin pages; mechanical adaptations only.
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../lib/i18n';

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

export default function RichTextEditor({ value, onChange, minHeight = 180 }) {
  const { t } = useTranslation();
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
    const input = window.prompt(t('rich_text_editor.prompt_url'));
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

  const btn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 7px', borderRadius: 4, fontSize: 12, cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', color: '#374151', lineHeight: 1 };
  const selStyle = { fontSize: 11, border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 5px', background: '#fff', cursor: 'pointer', color: '#374151' };
  const divider = <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />;

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
        {!htmlMode && <>
          <select style={selStyle} defaultValue="" onChange={e => { applyBlock(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>{t('rich_text_editor.style')}</option>
            <option value="p">{t('rich_text_editor.style_body')}</option>
            <option value="h1">H1</option><option value="h2">H2</option>
            <option value="h3">H3</option><option value="h4">H4</option>
          </select>
          <select style={{ ...selStyle, maxWidth: 110 }} defaultValue="" onChange={e => { applyFont(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>{t('rich_text_editor.font')}</option>
            {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          {divider}
          <button style={{ ...btn, fontWeight: 700 }} title={t('rich_text_editor.title_bold')} onMouseDown={e => { e.preventDefault(); exec('bold'); }}>B</button>
          <button style={{ ...btn, fontStyle: 'italic' }} title={t('rich_text_editor.title_italic')} onMouseDown={e => { e.preventDefault(); exec('italic'); }}>I</button>
          <button style={{ ...btn, textDecoration: 'underline' }} title={t('rich_text_editor.title_underline')} onMouseDown={e => { e.preventDefault(); exec('underline'); }}>U</button>
          <button style={{ ...btn, textDecoration: 'line-through' }} title={t('rich_text_editor.title_strikethrough')} onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }}>S</button>
          {divider}
          <button style={btn} title={t('rich_text_editor.title_align_left')} onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="0" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="0" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title={t('rich_text_editor.title_align_center')} onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="2" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="2" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title={t('rich_text_editor.title_align_right')} onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="4" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="4" y="11.5" width="9" height="1.5"/></svg>
          </button>
          {divider}
          <button style={btn} title={t('rich_text_editor.title_bullet_list')} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="1.5" cy="2.5" r="1.2"/><rect x="4" y="1.8" width="9" height="1.4"/><circle cx="1.5" cy="6.5" r="1.2"/><rect x="4" y="5.8" width="9" height="1.4"/><circle cx="1.5" cy="10.5" r="1.2"/><rect x="4" y="9.8" width="9" height="1.4"/></svg>
          </button>
          <button style={btn} title={t('rich_text_editor.title_numbered_list')} onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><text x="0" y="4" fontSize="4.5" fontFamily="monospace">1.</text><rect x="4" y="1.8" width="9" height="1.4"/><text x="0" y="8" fontSize="4.5" fontFamily="monospace">2.</text><rect x="4" y="5.8" width="9" height="1.4"/><text x="0" y="12" fontSize="4.5" fontFamily="monospace">3.</text><rect x="4" y="9.8" width="9" height="1.4"/></svg>
          </button>
          {divider}
          <button style={btn} title={t('rich_text_editor.title_insert_link')} onMouseDown={e => { e.preventDefault(); insertLink(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </button>
          <button style={{ ...btn, fontSize: 10 }} title={t('rich_text_editor.title_remove_link')} onMouseDown={e => { e.preventDefault(); exec('unlink'); }}>✕🔗</button>
          {divider}
          <button style={{ ...btn, fontSize: 10, color: '#b91c1c' }} title={t('rich_text_editor.title_clear_formatting')} onMouseDown={e => { e.preventDefault(); clearFormatting(); }}>Tx</button>
          {divider}
        </>}
        <button onClick={() => setHtmlMode(m => !m)}
          style={{ ...btn, fontFamily: 'monospace', fontSize: 11, background: htmlMode ? '#1e293b' : '#fff', color: htmlMode ? '#7dd3fc' : '#374151', border: `1px solid ${htmlMode ? '#334155' : '#d1d5db'}` }}
          title={htmlMode ? t('rich_text_editor.title_back_to_rich') : t('rich_text_editor.title_view_html')}>&lt;/&gt;</button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onBlur={handleBlur} onPaste={pasteAsPlainText}
        style={{ display: htmlMode ? 'none' : 'block', minHeight, padding: '10px 12px', fontSize: 14, lineHeight: 1.75, color: '#111827', outline: 'none', background: '#fff', overflowY: 'auto' }} />
      <textarea ref={htmlRef} onBlur={e => { onChange(e.target.value); }}
        style={{ display: htmlMode ? 'block' : 'none', width: '100%', minHeight, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6, color: '#0f172a', background: '#f8fafc', border: 'none', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
    </div>
  );
}
