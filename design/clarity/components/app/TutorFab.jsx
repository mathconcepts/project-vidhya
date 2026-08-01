import React from 'react';

export function TutorFab({ label = 'Ask the tutor', onClick, children }) {
  const [down, setDown] = React.useState(false);
  return (
    <button type="button" aria-label={label} onClick={onClick}
      onPointerDown={() => setDown(true)} onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}
      style={{
        width: 56, height: 56, borderRadius: 'var(--radius-capsule)', border: 'none', cursor: 'pointer',
        background: 'var(--indigo)', color: '#fff', boxShadow: 'var(--shadow-fab)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        transform: down ? 'scale(var(--press-scale))' : 'scale(1)',
        transition: 'transform var(--dur-fast) var(--ease-standard)',
      }}>{children || '􀌪'}</button>
  );
}
