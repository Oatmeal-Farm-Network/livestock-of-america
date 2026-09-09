// Ported from Oatmeal Farm Network (src/WebsiteAIAgent.jsx). Mechanical adaptations only:
// router package, i18n hook, component paths and API base env var.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AgentBadge from './AgentBadge';
import { useLocation } from 'react-router';
import { useTranslation } from '../lib/i18n';
import { useAccount } from '../lib/AccountContext';
import { useLanguage } from '../lib/LanguageContext';

const API = import.meta.env.VITE_LIVESTOCK_API_URL;
const AGENT_NAME = 'Lavendir';
const AVATAR_COLOR = '#7C5CBF';
const HEADER_H = 72; // px — matches AccountLayout header height

// ── Lavendir branch icon ──────────────────────────────────────────
function LavenderBranchIcon({ size = 24 }) {
  return (
    <img
      src="/images/LavendirAIIcon.webp"
      alt="Lavendir"
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0 }}
    />
  );
}

function shortHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url || ''; }
}

function relativeAge(storedAtSec, t) {
  if (!storedAtSec) return '';
  const diff = Math.max(0, Math.floor(Date.now() / 1000 - storedAtSec));
  if (diff < 60)   return t('website_ai_agent.just_now');
  if (diff < 3600) return t('website_ai_agent.minutes_ago', { n: Math.floor(diff / 60) });
  return t('website_ai_agent.hours_ago', { n: Math.floor(diff / 3600) });
}

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// When a confirmation banner is showing, intercept common yes/no replies the user
// typed into the chat input instead of clicking the button, so Gemini doesn't
// re-interpret "yes please" and drift off-task.
const YES_RE = /^\s*(yes|yeah|yep|yup|ya|sure|ok(ay)?|do it|go ahead|go|confirm|confirmed|proceed|please do|sounds good|looks good|great|perfect)([\s,.!?]+(please|thanks?|do it|go ahead))*[\s,.!?]*$/i;
const NO_RE  = /^\s*(no|nope|nah|cancel|never ?mind|stop|don'?t|wait|hold on|not (yet|now)|no thanks?|forget it)[\s,.!?]*$/i;
function classifyConfirmReply(text) {
  if (!text) return null;
  if (YES_RE.test(text)) return 'yes';
  if (NO_RE.test(text))  return 'no';
  return null;
}

const STORAGE_MIC = 'lavendir_mic_device_id';
const STORAGE_TTS = 'lavendir_tts_voice';
const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

// ── Speech-to-text hook ───────────────────────────────────────────
// start(continuous=false) — false: stops after natural pause (conversation mode)
//                         — true:  keeps listening until stop() called (manual mode)
function useSpeechRecognition(onResult, onError) {
  const { t } = useTranslation();
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const shouldRestartRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef  = useRef(onError);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current  = onError;  }, [onError]);

  const warmUp = useCallback(async () => {
    const deviceId = localStorage.getItem(STORAGE_MIC);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        { audio: deviceId ? { deviceId: { exact: deviceId } } : true }
      );
      stream.getTracks().forEach(trk => trk.stop());
      return true;
    } catch (e) {
      const msg = e.name === 'NotAllowedError'
        ? t('website_ai_agent.mic_denied_settings')
        : t('website_ai_agent.mic_error', { msg: e.message });
      onErrorRef.current?.(msg);
      return false;
    }
  }, [t]);

  const startRec = useCallback((continuous) => {
    if (!SpeechRecognitionAPI) {
      onErrorRef.current?.(t('website_ai_agent.stt_not_supported'));
      return;
    }
    const rec = new SpeechRecognitionAPI();
    rec.continuous     = continuous;
    rec.interimResults = false;
    rec.lang           = 'en-US';

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .filter(r => r.isFinal)
        .map(r => r[0].transcript)
        .join(' ')
        .trim();
      if (transcript) onResultRef.current?.(transcript);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        onErrorRef.current?.(t('website_ai_agent.mic_denied'));
      } else if (e.error !== 'no-speech') {
        onErrorRef.current?.(t('website_ai_agent.stt_error', { error: e.error }));
      }
      shouldRestartRef.current = false;
      setListening(false);
    };
    rec.onend = () => {
      // Auto-restart only in continuous (manual) mode; conversation mode restarts via TTS onEnd
      if (shouldRestartRef.current && recRef.current) {
        try { recRef.current.start(); }
        catch { setListening(false); shouldRestartRef.current = false; }
      } else {
        recRef.current = null;
        setListening(false);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      onErrorRef.current?.(t('website_ai_agent.stt_start_error'));
    }
  }, [t]);

  const start = useCallback(async (continuous = false) => {
    if (listening) return;
    const ok = await warmUp();
    if (!ok) return;
    shouldRestartRef.current = continuous;
    startRec(continuous);
  }, [listening, warmUp, startRec]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const toggle = useCallback(async () => {
    if (listening) stop();
    else await start(true); // manual mode = continuous
  }, [listening, start, stop]);

  return { listening, start, stop, toggle, supported: !!SpeechRecognitionAPI };
}

// ── TTS helpers ───────────────────────────────────────────────────
const PREFERRED_VOICES = [
  'Google US English',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Zira - English (United States)',
  'Samantha',
];

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const saved = localStorage.getItem(STORAGE_TTS);
  if (saved) {
    const pref = voices.find(v => v.name === saved);
    if (pref) return pref;
  }
  for (const name of PREFERRED_VOICES) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  const googleUS = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en-US'));
  if (googleUS) return googleUS;
  return voices.find(v => v.lang === 'en-US') || null;
}

function speak(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();

  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`/g, '')
    .replace(/\bLavendir\b/gi, 'Lavender');

  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(clean);
    const voice = pickVoice();
    if (voice) utt.voice = voice;
    utt.lang  = 'en-US';
    utt.rate  = 1.0;
    utt.pitch = 1.0;
    utt.onend  = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utt);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
  }
}

// ── Markdown renderer ─────────────────────────────────────────────
// Escapes HTML first so stray tags from the model (e.g. an unclosed <h1>)
// can't inflate the rest of the panel, then applies a lightweight markdown
// pass. The whole message is pinned to 12pt Verdana so every Lavendir reply
// renders uniformly regardless of what markdown/HTML the LLM emits.
function MessageContent({ text }) {
  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#39;');

  const html = escapeHtml(text)
    // Turn markdown headings into bold so they don't become giant <h1>-style text
    .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#f5f3ff;color:#6d28d9;padding:0 3px;border-radius:3px;">$1</code>')
    .split('\n').join('<br />');

  return (
    <span
      style={{
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12pt',
        lineHeight: 1.45,
        display: 'block',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Chat persistence ──────────────────────────────────────────────
// Keyed by the signed-in person + business so switching users/accounts
// shows a fresh chat instead of leaking someone else's history.
function _chatStorageKey(businessId) {
  const pid = (typeof window !== 'undefined' && localStorage.getItem('people_id')) || 'anon';
  return `lavendir:msgs:${pid}:${businessId || 0}`;
}

function _loadStoredChat(businessId) {
  try {
    const raw = localStorage.getItem(_chatStorageKey(businessId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function _saveStoredChat(businessId, messages) {
  try {
    // Cap persisted history so localStorage doesn't balloon on long sessions.
    const tail = Array.isArray(messages) ? messages.slice(-100) : [];
    localStorage.setItem(_chatStorageKey(businessId), JSON.stringify(tail));
  } catch {}
}

// ── Main component ────────────────────────────────────────────────
export default function WebsiteAIAgent({ websiteId, businessId, currentView, autoOpen = false }) {
  const { t } = useTranslation();
  const { Expanded: sidebarExpanded } = useAccount();
  const { language } = useLanguage();
  const sidebarWidth = sidebarExpanded ? 208 : 64;
  const location = useLocation();

  const [open, setOpen]                   = useState(autoOpen);
  const [panelExpanded, setPanelExpanded] = useState(autoOpen);
  const _isMounted = useRef(false);

  // Collapse full-page mode on route change so Lavendir doesn't sit on top
  // of the page the user just navigated to. Watch the query string too —
  // /blog/manage?view=new and /website/builder?view=design are separate
  // screens under the same pathname.
  // Skip the very first render so autoOpen isn't immediately cancelled.
  useEffect(() => {
    if (!_isMounted.current) { _isMounted.current = true; return; }
    if (panelExpanded) setPanelExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);
  // Hydrate synchronously so the restored chat paints on first render.
  const [messages, setMessages]           = useState(() => _loadStoredChat(businessId));
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [ttsEnabled, setTtsEnabled]       = useState(false);
  const [suggestions, setSuggestions]     = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [previewUrl, setPreviewUrl]       = useState('');       // iframe src for design mockups
  const [previewImageUrl, setPreviewImageUrl] = useState('');   // generated hero image
  const [confirming, setConfirming]       = useState(false);
  const [sttError, setSttError]           = useState('');
  const [conversationMode, setConversationMode] = useState(false);
  const [lastScrape, setLastScrape]       = useState(null);     // {url, platform_name, stored_at, ttl_sec}

  const conversationModeRef = useRef(false);
  const sendMessageRef      = useRef(null);
  const startRef            = useRef(null);
  const bottomRef           = useRef(null);
  const hasGreetedRef       = useRef(false);

  // STT result handler — uses refs to avoid stale closure
  const onSttResult = useCallback((transcript) => {
    if (conversationModeRef.current) {
      sendMessageRef.current?.(transcript);
    } else {
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    }
  }, []);

  const onSttError = useCallback((err) => setSttError(err), []);

  const { listening, start, stop, toggle: toggleListening, supported: sttSupported } =
    useSpeechRecognition(onSttResult, onSttError);

  // Keep start ref current so TTS onEnd can restart listening
  useEffect(() => { startRef.current = start; }, [start]);

  // ── Greeting ──────────────────────────────────────────────────
  useEffect(() => {
    if (open && messages.length === 0 && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting = {
        role: 'assistant',
        content: t('website_ai_agent.greeting', { name: AGENT_NAME }),
      };
      setMessages([greeting]);
      if (ttsEnabled) speak(greeting.content);
    }
  }, [open]);

  // ── Persist chat to localStorage so it survives navigation/reloads ──
  useEffect(() => {
    _saveStoredChat(businessId, messages);
  }, [messages, businessId]);

  // If the user switches businesses, load that business's chat history.
  useEffect(() => {
    setMessages(_loadStoredChat(businessId));
    hasGreetedRef.current = false;
  }, [businessId]);

  // ── Suggestions ───────────────────────────────────────────────
  useEffect(() => {
    if (!open || !websiteId) return;
    fetch(`${API}/api/lavendir/suggestions/${websiteId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [open, websiteId]);

  // ── Last-scrape chip ──────────────────────────────────────────
  useEffect(() => {
    if (!open || !websiteId) return;
    fetch(`${API}/api/lavendir/last-scrape/${websiteId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setLastScrape(data?.last_scrape || null))
      .catch(() => {});
  }, [open, websiteId]);

  const clearLastScrape = async () => {
    setLastScrape(null);
    try {
      await fetch(`${API}/api/lavendir/last-scrape/${websiteId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {}
  };

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Send message ──────────────────────────────────────────────
  // NOTE: reassigned every render so sendMessageRef always has the latest closure
  const sendMessage = async (text) => {
    const userText = (typeof text === 'string' ? text : input).trim();
    if (!userText || loading) return;

    // If Lavendir is waiting on a yes/no confirmation and the user typed one
    // into the chat input instead of clicking, route through /confirm so
    // Gemini doesn't reinterpret the reply as a fresh request.
    if (pendingAction && !confirming) {
      const verdict = classifyConfirmReply(userText);
      if (verdict) {
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        confirmAction(verdict === 'yes');
        return;
      }
    }

    setInput('');
    setPendingAction(null);
    setPreviewUrl('');
    setPreviewImageUrl('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const isConv = conversationModeRef.current;

    try {
      const res = await fetch(`${API}/api/lavendir/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          website_id: websiteId,
          business_id: businessId,
          messages: newMessages,
          current_page: currentView,
          language: language || 'en',
        }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      const responseText = data.content;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      if (data.pending_action) setPendingAction(data.pending_action);
      if (data.preview_url) {
        const abs = data.preview_url.startsWith('http') ? data.preview_url : `${API}${data.preview_url}`;
        setPreviewUrl(abs);
      }
      if (data.preview_image_url) setPreviewImageUrl(data.preview_image_url);
      if (data.last_scrape !== undefined) setLastScrape(data.last_scrape);

      if (isConv) {
        // Conversation mode: speak → then restart listening
        speak(responseText, () => {
          if (conversationModeRef.current) startRef.current?.(false);
        });
      } else if (ttsEnabled) {
        speak(responseText);
      }
    } catch {
      const errMsg = t('website_ai_agent.chat_error');
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      if (isConv) {
        speak(errMsg, () => {
          if (conversationModeRef.current) startRef.current?.(false);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Keep ref up-to-date on every render
  sendMessageRef.current = sendMessage;

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([]);
    setPendingAction(null);
    setPreviewUrl('');
    setPreviewImageUrl('');
    try { localStorage.removeItem(_chatStorageKey(businessId)); } catch {}
    hasGreetedRef.current = false;
  };

  // ── Conversation mode toggle ──────────────────────────────────
  const handleMicClick = async () => {
    if (conversationMode) {
      // Exit conversation mode
      setConversationMode(false);
      conversationModeRef.current = false;
      stop();
      window.speechSynthesis?.cancel();
    } else {
      // Enter conversation mode — continuous=false so browser stops after natural pause
      setSttError('');
      setConversationMode(true);
      conversationModeRef.current = true;
      await start(false);
    }
  };

  // ── Confirm action ────────────────────────────────────────────
  const confirmAction = async (confirmed) => {
    if (!pendingAction) return;
    setConfirming(true);
    const action = pendingAction;
    setPendingAction(null);
    setPreviewUrl('');
    setPreviewImageUrl('');
    const isConv = conversationModeRef.current;
    try {
      const res = await fetch(`${API}/api/lavendir/confirm`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          website_id: websiteId,
          business_id: businessId,
          action: action.action,
          params: action.params,
          confirmed,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      if (isConv) {
        speak(data.content, () => {
          if (conversationModeRef.current) startRef.current?.(false);
        });
      } else if (ttsEnabled) {
        speak(data.content);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('website_ai_agent.confirm_error') }]);
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPanelExpanded(false);
    setConversationMode(false);
    conversationModeRef.current = false;
    stop();
    window.speechSynthesis?.cancel();
  };

  // ── Floating button ───────────────────────────────────────────
  // Portal to body so the shell's `.app-shell-wrapper > *` layout rule
  // (min-height: 100vh, display: flex) doesn't inflate this button.
  if (!open) {
    return createPortal(
      <AgentBadge bottom={24} baseRight={24} zIndex={50}>
      <button
        onClick={() => setOpen(true)}
        title={t('website_ai_agent.title_chat', { name: AGENT_NAME })}
        className="flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      >
        <LavenderBranchIcon size={64} />
      </button>
      </AgentBadge>,
      document.body,
    );
  }

  // Panel geometry: small (default) vs full-page
  // Expanded mode uses explicit height + top-left anchoring so a transform or
  // sticky footer in AccountLayout can't push the input bar below the viewport.
  const panelStyle = panelExpanded
    ? { top: HEADER_H, left: sidebarWidth, width: `calc(100vw - ${sidebarWidth}px)`,
        height: `calc(100vh - ${HEADER_H}px)`, zIndex: 9999, borderRadius: 0 }
    : { width: 360, height: 540, bottom: 24, right: 24, zIndex: 50, borderRadius: '1rem' };

  // ── Chat panel ────────────────────────────────────────────────
  // Portal so the shell's layout rule doesn't inflate this panel either.
  return createPortal(
    <div
      className="fixed flex flex-col shadow-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #e5e7eb', ...panelStyle }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: AVATAR_COLOR }}>
        <LavenderBranchIcon size={28} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-none">{AGENT_NAME}</p>
          <p className="text-purple-200 text-xs mt-0.5">
            {conversationMode
              ? <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block animate-pulse" />
                  {t('website_ai_agent.conversation_mode_active')}
                </span>
              : t('website_ai_agent.subtitle')
            }
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* TTS toggle — hidden in conversation mode (always on) */}
          {!conversationMode && (
            <button
              onClick={() => { setTtsEnabled(v => !v); if (ttsEnabled) window.speechSynthesis?.cancel(); }}
              title={ttsEnabled ? t('website_ai_agent.title_mute') : t('website_ai_agent.title_enable_voice')}
              className={`p-1.5 rounded-lg transition-colors ${ttsEnabled ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white hover:bg-white/20'}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {ttsEnabled
                  ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>
                  : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                }
              </svg>
            </button>
          )}
          {/* Expand / collapse */}
          <button
            onClick={() => setPanelExpanded(v => !v)}
            title={panelExpanded ? t('website_ai_agent.title_collapse') : t('website_ai_agent.title_expand')}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {panelExpanded
                ? <><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></>
                : <><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>
              }
            </svg>
          </button>
          {/* Clear chat */}
          <button onClick={clearChat} title={t('website_ai_agent.title_clear_chat')} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
          {/* Close */}
          <button onClick={handleClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors text-lg leading-none">×</button>
        </div>
      </div>

      {/* Last-scrape memory chip */}
      {lastScrape?.url && (
        <div className="px-3 py-1.5 border-b border-purple-100 bg-purple-50/60 shrink-0 flex items-center gap-2 text-[11px]">
          <span className="text-purple-500">📎</span>
          <span className="text-purple-700">{t('website_ai_agent.scrape_remembering')}</span>
          <a
            href={lastScrape.url}
            target="_blank"
            rel="noreferrer"
            title={lastScrape.url}
            className="text-purple-800 font-medium hover:underline truncate max-w-[180px]"
          >
            {shortHost(lastScrape.url)}
          </a>
          {lastScrape.platform_name && (
            <span className="text-purple-400">· {lastScrape.platform_name}</span>
          )}
          <span className="text-purple-400">· {relativeAge(lastScrape.stored_at, t)}</span>
          <button
            onClick={clearLastScrape}
            title={t('website_ai_agent.title_forget_site')}
            className="ml-auto text-purple-400 hover:text-purple-700 px-1.5 py-0.5 rounded hover:bg-purple-100 transition-colors"
          >
            {t('website_ai_agent.btn_clear_scrape')}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: '#faf9ff' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <LavenderBranchIcon size={22} />
            )}
            <div
              className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${panelExpanded ? 'max-w-[55%]' : 'max-w-[80%]'} ${
                msg.role === 'user'
                  ? 'bg-gray-800 text-white rounded-br-sm'
                  : 'bg-white border border-purple-100 text-gray-800 rounded-bl-sm shadow-sm'
              }`}
            >
              <MessageContent text={msg.content} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <LavenderBranchIcon size={22} />
            <div className="bg-white border border-purple-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: AVATAR_COLOR, animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: AVATAR_COLOR, animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: AVATAR_COLOR, animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {messages.length === 1 && suggestions.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <p className="text-xs text-purple-400 pl-8">{t('website_ai_agent.quick_suggestions')}</p>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s.text)}
                className="ml-8 text-left text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 hover:bg-purple-100 transition-colors">
                {s.text}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Design / hero preview — shows above the confirm banner when Lavendir has something visual to propose */}
      {(previewImageUrl || previewUrl) && !confirming && (
        <div className="border-t border-purple-100 bg-white shrink-0">
          {previewImageUrl && (
            <div className="p-2">
              <p className="text-[11px] uppercase tracking-wide text-purple-500 mb-1">{t('website_ai_agent.preview_hero_label')}</p>
              <img
                src={previewImageUrl}
                alt={t('website_ai_agent.preview_hero_alt')}
                className="w-full rounded-lg border border-purple-100"
                style={{ maxHeight: panelExpanded ? 420 : 180, objectFit: 'cover' }}
              />
            </div>
          )}
          {previewUrl && (
            <div className="p-2">
              <p className="text-[11px] uppercase tracking-wide text-purple-500 mb-1">{t('website_ai_agent.preview_design_label')}</p>
              <iframe
                src={previewUrl}
                title="Lavendir design preview"
                className="w-full rounded-lg border border-purple-100 bg-white"
                style={{ height: panelExpanded ? 460 : 220 }}
              />
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-600 hover:underline mt-1 inline-block"
              >
                {t('website_ai_agent.preview_open_tab')}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Confirmation banner */}
      {(pendingAction || confirming) && (
        <div className="border-t border-purple-100 px-3 py-3 bg-purple-50 shrink-0">
          {confirming ? (
            <p className="text-xs text-purple-500 text-center animate-pulse">{t('website_ai_agent.applying_changes')}</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-purple-800 mb-2">{t('website_ai_agent.confirm_heading')}</p>
              <p className="text-xs text-purple-700 mb-3 leading-relaxed">{pendingAction.description}</p>
              <div className="flex gap-2">
                <button onClick={() => confirmAction(true)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                  style={{ background: AVATAR_COLOR }}>
                  {t('website_ai_agent.btn_confirm_yes')}
                </button>
                <button onClick={() => confirmAction(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                  {t('website_ai_agent.btn_confirm_no')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-gray-100 px-3 py-2.5 flex items-end gap-2 bg-white shrink-0 relative">
        {sttError && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 z-10">
            {sttError}
            <button onClick={() => setSttError('')} className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {sttSupported && (
          <button
            onClick={handleMicClick}
            title={conversationMode ? t('website_ai_agent.title_end_conversation') : t('website_ai_agent.title_start_conversation')}
            className={`p-2 rounded-xl transition-all shrink-0 relative ${
              conversationMode || listening
                ? 'text-white shadow-lg'
                : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
            }`}
            style={(conversationMode || listening) ? { background: AVATAR_COLOR } : {}}
          >
            {(conversationMode || listening) && (
              <span className="absolute inset-0 rounded-xl animate-ping opacity-40" style={{ background: AVATAR_COLOR }} />
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        )}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            conversationMode && listening ? t('website_ai_agent.placeholder_listening_conv')
            : conversationMode && loading  ? t('website_ai_agent.placeholder_processing')
            : conversationMode             ? t('website_ai_agent.placeholder_conv_stop')
            : listening                    ? t('website_ai_agent.placeholder_listening')
            : t('website_ai_agent.placeholder_default', { name: AGENT_NAME })
          }
          rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-purple-300"
          style={{ maxHeight: 96, '--tw-ring-color': '#C4AAFF' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl transition-colors shrink-0 disabled:opacity-40"
          style={{ background: AVATAR_COLOR, color: '#fff' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
