import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../lib/auth';
import { useSavedItems } from '../lib/savedItems';

const OLIVE = '#3d6b34';

/**
 * Bookmark control for marketplace animals, studs, and ranches.
 * Saves into My Animals (LivestockSavedItems).
 *
 * itemType: 'animal' | 'stud' | 'ranch'
 * itemId: animal_id or business_id
 */
export default function SaveButton({
  itemType,
  itemId,
  className = '',
  size = 22,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSaved, toggle } = useSavedItems();
  const [busy, setBusy] = useState(false);
  const saved = isSaved(itemType, itemId);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn()) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (busy) return;
    setBusy(true);
    await toggle(itemType, itemId);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={saved ? 'Remove from My Animals' : 'Save to My Animals'}
      aria-label={saved ? 'Remove from My Animals' : 'Save to My Animals'}
      aria-pressed={saved}
      className={`inline-flex items-center justify-center rounded-full border bg-white/95 shadow-sm cursor-pointer transition-colors hover:bg-white ${className}`}
      style={{
        width: size + 10,
        height: size + 10,
        borderColor: saved ? OLIVE : '#e5e0d6',
        color: saved ? OLIVE : '#6b6b6b',
        opacity: busy ? 0.7 : 1,
      }}
    >
      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 24 24"
        fill={saved ? OLIVE : 'none'}
        stroke={saved ? OLIVE : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
