import React from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from '../lib/i18n';
import { isLoggedIn } from '../lib/auth';

const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const LORA = "'Lora', 'Times New Roman', serif";

/** Plain-text teaser from HTML description. */
export function plainTextPreview(html, maxChars = 280) {
  if (!html) return '';
  const text = String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trim()}…`;
}

/**
 * Sign-in CTA for guests on limited detail/list sections.
 * Returns null when logged in.
 */
export default function GuestAccessPrompt({
  title,
  message,
  className = '',
  compact = false,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  if (isLoggedIn()) return null;

  const from = { pathname: location.pathname, search: location.search };

  return (
    <div
      className={`rounded-xl border ${compact ? 'px-4 py-3' : 'px-5 py-5'} ${className}`}
      style={{ backgroundColor: '#ece8df', borderColor: '#d8d2c6', color: INK }}
      role="region"
      aria-label={t('guest_access.region', 'Sign in for full access')}
    >
      <p
        className={`m-0 font-bold ${compact ? 'text-sm mb-1' : 'text-base mb-2'}`}
        style={{ fontFamily: LORA, color: INK }}
      >
        {title || t('guest_access.title', 'Sign in for more details')}
      </p>
      <p className={`m-0 leading-relaxed ${compact ? 'text-xs mb-3' : 'text-sm mb-4'}`} style={{ color: '#5c5c5c' }}>
        {message
          || t(
            'guest_access.message',
            'Guests can browse a limited preview. Sign in or create a free account to unlock full details.',
          )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/login"
          state={{ from }}
          className="rounded-md px-4 py-2 text-sm font-semibold no-underline border bg-white"
          style={{ color: INK, borderColor: '#ccc' }}
        >
          {t('nav.login', 'Login')}
        </Link>
        <Link
          to="/signup"
          state={{ from }}
          className="rounded-md px-4 py-2 text-sm font-semibold text-white no-underline"
          style={{ backgroundColor: OLIVE, color: '#ffffff' }}
        >
          {t('guest_access.join', 'Join')}
        </Link>
      </div>
    </div>
  );
}

/** How many items guests may preview on list pages. */
export const GUEST_LIST_PREVIEW = 6;
export const GUEST_DESC_CHARS = 280;
