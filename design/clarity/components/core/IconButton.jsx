import React from 'react';

export function IconButton({ label, size = 44, tone = 'neutral', filled = false, onClick, children }) {
  const [down, setDown] = React.useState(false);
  const color = tone === 'tutor' ? 'var(--indigo-ink)' : tone === 'mastery' ? 'var(--green-ink)' : 'var(--text-secondary)';
  return (
    <button
      type="button" aria-label={label} onClick={onClick}
      onPointerDown={() => setDown(true)} onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}
      style={{
        width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-capsule)', border: 'none', cursor: 'pointer', color,
        background: filled ? 'var(--surface-fill)' : 'transparent',
        transform: down ? 'scale(var(--press-scale))' : 'scale(1)',
        transition: 'transform var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)',
      }}
    >
      {children}
    </button>
  );
}
