// Floating Saige chat widget — OFN-compatible JWT auth + chat contract.
import React, { useEffect, useRef, useState } from 'react';
import { SAIGE_API_URL } from '../config/api';
import { useAccount } from '../lib/AccountContext';
import { getPeopleId, getToken, isLoggedIn } from '../lib/auth';

const GREEN = '#3d6b34';
const LIGHT = '#f0f7ee';
const BORDER = '#c7dfc2';
const FONT = "Montserrat, system-ui, sans-serif";
const OPEN_EVENT = 'loa:open-saige';

/** Open the floating Saige panel from anywhere (homepage CTA, etc.). */
export function openSaigeChat() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/**
 * Same base-URL rules as OFN SaigeWidget:
 * - Prefer VITE_SAIGE_API_URL
 * - Keep `/saige` prefix (unified backend mounts Saige there)
 * - Local fallback: http://localhost:8000/saige
 */
function normalizeSaigeApiBase(rawValue) {
  const value = (rawValue || '').trim();
  if (!value) {
    if (import.meta.env.DEV) return 'http://localhost:8000/saige';
    return '';
  }
  return value.replace(/\/+$/, '');
}

function resolveSaigeBase() {
  return normalizeSaigeApiBase(SAIGE_API_URL || import.meta.env.VITE_SAIGE_API_URL);
}

/** Same auth headers OFN uses for Saige (Bearer access_token from LOA/OFN login). */
function getAuthHeaders() {
  const token = getToken() || localStorage.getItem('AccessToken') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function resolveBusinessId(contextBusinessId) {
  if (contextBusinessId) return String(contextBusinessId);
  try {
    const stored = localStorage.getItem('selected_business_id');
    return stored && stored !== 'null' ? stored : null;
  } catch {
    return null;
  }
}

function threadStorageKey(peopleId, businessId) {
  const biz = businessId ? String(businessId) : 'nobiz';
  return `loa_saige_thread_${peopleId || 'anon'}_${biz}`;
}

function getOrCreateThreadId(peopleId, businessId) {
  const key = threadStorageKey(peopleId, businessId);
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
  } catch {
    /* ignore */
  }
  const bizPart = businessId ? `b${businessId}_` : '';
  const id = `loa_${bizPart}thread_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  try {
    localStorage.setItem(key, id);
  } catch {
    /* ignore */
  }
  return id;
}

async function readErrorMessage(res) {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      const detail = payload?.detail || payload?.message || payload?.error;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      if (detail) return JSON.stringify(detail);
    }
    const text = (await res.text()).trim();
    if (text) return text;
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Please sign in again to use Saige.';
  return `Server error (${res.status})`;
}

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div
        style={{
          maxWidth: '82%',
          padding: '8px 12px',
          borderRadius: 12,
          fontSize: 13.5,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: FONT,
          background: isUser ? GREEN : LIGHT,
          color: isUser ? '#fff' : '#111827',
          border: isUser ? 'none' : `1px solid ${BORDER}`,
        }}
      >
        {content}
      </div>
    </div>
  );
}

function ChatPanel({ businessId, onClose, apiBase, peopleId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [threadId] = useState(() => getOrCreateThreadId(peopleId, businessId));
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = async (text) => {
    const val = (text || input).trim();
    if (!val || sending) return;
    setError('');

    const token = getToken() || localStorage.getItem('AccessToken') || '';
    if (!token) {
      setError('Please sign in to chat with Saige.');
      return;
    }

    if (!apiBase) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: val },
        {
          role: 'assistant',
          content: 'Saige is not connected yet. Set VITE_SAIGE_API_URL (same as OFN) to enable live answers.',
        },
      ]);
      setInput('');
      return;
    }

    const nextMsgs = [...messages, { role: 'user', content: val }];
    setMessages(nextMsgs);
    setInput('');
    setSending(true);

    // LOA: product=loa → separate Firestore collection; business_id scopes history.
    // people_id comes from JWT (same auth as OFN).
    const body = JSON.stringify({
      user_input: val,
      thread_id: threadId,
      business_id: businessId ? String(businessId) : null,
      product: 'loa',
      language: 'en',
    });

    let streamed = false;
    try {
      const res = await fetch(`${apiBase}/chat/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body,
      });
      if (res.status === 401) {
        setError(await readErrorMessage(res));
        setMessages([
          ...nextMsgs,
          { role: 'assistant', content: 'Your session expired. Please sign in again to use Saige.' },
        ]);
        setSending(false);
        return;
      }
      if (res.ok && res.body) {
        streamed = true;
        setMessages([...nextMsgs, { role: 'assistant', content: '' }]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let partial = '';
        let reply = '';
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          partial += decoder.decode(value, { stream: true });
          const lines = partial.split('\n');
          partial = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            let evt;
            try {
              evt = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (evt.type === 'token') {
              reply += evt.content || '';
              setMessages((prev) => {
                const upd = [...prev];
                upd[upd.length - 1] = { role: 'assistant', content: reply };
                return upd;
              });
            } else if (evt.type === 'done') {
              const finalReply =
                reply || evt.diagnosis || evt.reply || evt.response || 'No response received.';
              setMessages((prev) => {
                const upd = [...prev];
                upd[upd.length - 1] = { role: 'assistant', content: finalReply };
                return upd;
              });
              break outer;
            } else if (evt.type === 'error') {
              const msg = evt.message || evt.detail || 'Saige error';
              setMessages((prev) => {
                const upd = [...prev];
                upd[upd.length - 1] = { role: 'assistant', content: msg };
                return upd;
              });
              break outer;
            }
          }
        }
      }
    } catch {
      streamed = false;
    }

    if (!streamed) {
      try {
        const res = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body,
        });
        if (!res.ok) throw new Error(await readErrorMessage(res));
        const data = await res.json().catch(() => ({}));
        const reply =
          data.reply || data.response || data.diagnosis || data.message || 'No response received.';
        setMessages([...nextMsgs, { role: 'assistant', content: reply }]);
      } catch (e) {
        const msg = e.message || 'Unable to reach Saige.';
        setError(msg);
        setMessages([...nextMsgs, { role: 'assistant', content: `Error: ${msg}` }]);
      }
    }

    setSending(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        right: 20,
        width: 'min(370px, 92vw)',
        height: 'min(520px, 78vh)',
        zIndex: 9999,
        borderRadius: 16,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 44px -8px rgba(0,0,0,0.32)',
        border: `1px solid ${BORDER}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ background: GREEN, color: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <img
          src="/images/AI-agent-logo-saige.svg"
          alt=""
          style={{ width: 28, height: 28, borderRadius: '50%' }}
          onError={(e) => { e.currentTarget.src = '/images/SaigeAIIcon.webp'; }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "Lora, serif" }}>Saige</div>
          <div style={{ fontSize: 10, opacity: 0.85, fontFamily: FONT }}>AI Livestock Assistant</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Saige"
          style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 14, cursor: 'pointer', fontWeight: 700 }}
        >
          ×
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, padding: '12px 12px 8px', overflowY: 'auto', background: '#fafdf9' }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 13, color: '#4b5563', padding: '8px 4px', lineHeight: 1.6, fontFamily: FONT }}>
            Hi, I&apos;m Saige! Ask me about your herd, listings, or livestock health.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {sending && (
          <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', fontFamily: FONT }}>Saige is thinking…</div>
        )}
        {error && <div style={{ fontSize: 11, color: '#991b1b', marginTop: 4 }}>{error}</div>}
      </div>

      <div style={{ padding: '8px 10px 10px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask Saige…"
            style={{ flex: 1, resize: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 13.5, fontFamily: FONT, outline: 'none', minHeight: 36, lineHeight: 1.4 }}
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!input.trim() || sending}
            aria-label="Send message"
            style={{
              padding: '8px 13px',
              background: GREEN,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !sending ? 1 : 0.5,
              fontFamily: FONT,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SaigeWidget() {
  const account = useAccount();
  const businessId = resolveBusinessId(account?.BusinessID);
  const peopleId = getPeopleId();
  const [open, setOpen] = useState(false);
  const apiBase = resolveSaigeBase();
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!loggedIn) {
      setOpen(false);
      return undefined;
    }
    const openPanel = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, openPanel);
    return () => window.removeEventListener(OPEN_EVENT, openPanel);
  }, [loggedIn]);

  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  if (!loggedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Saige AI assistant"
        title="Ask Saige"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9998,
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          background: GREEN,
          boxShadow: '0 6px 20px -4px rgba(0,0,0,0.35)',
        }}
      >
        <img
          src="/images/AI-agent-logo-saige.svg"
          alt="Saige"
          style={{ width: 60, height: 60, borderRadius: '50%', display: 'block' }}
          onError={(e) => { e.currentTarget.src = '/images/SaigeAIIcon.webp'; }}
        />
      </button>

      {open && (
        <ChatPanel
          key={`saige-${businessId || 'nobiz'}-${peopleId || 'anon'}`}
          businessId={businessId}
          peopleId={peopleId}
          apiBase={apiBase}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
