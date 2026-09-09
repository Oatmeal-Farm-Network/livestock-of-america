// Ported from Oatmeal Farm Network (src/AgentBadge.jsx). Mechanical adaptations only:
// router package, i18n hook, component paths and API base env var.
import { useState, useLayoutEffect } from 'react';

// Shared slot registry so multiple floating AI-agent launcher badges never overlap.
// Each rendered badge claims the lowest free horizontal slot and shifts left by
// slot * STEP, so when several agents appear on the same page they sit side by side
// instead of stacking in the bottom-right corner. A badge only claims a slot while
// it is actually mounted/visible (this wrapper only renders with the launcher), and
// releases it on unmount.
const activeSlots = new Set();
const STEP = 76; // px between badges (badges are ~58–64px wide + a small gap)

function claimSlot() {
  let i = 0;
  while (activeSlots.has(i)) i += 1;
  activeSlots.add(i);
  return i;
}

export default function AgentBadge({ children, bottom = 20, baseRight = 20, zIndex = 9999 }) {
  const [slot, setSlot] = useState(0);
  useLayoutEffect(() => {
    const s = claimSlot();
    setSlot(s);
    return () => { activeSlots.delete(s); };
  }, []);
  return (
    <div
      style={{
        position: 'fixed',
        bottom,
        right: baseRight + slot * STEP,
        zIndex,
        transition: 'right 0.18s ease',
      }}
    >
      {children}
    </div>
  );
}
