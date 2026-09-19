/**
 * ExamSwitcher — which exam this viewer is looking at.
 *
 * ── Why it exists ────────────────────────────────────────────────────────
 *
 * The active exam was a deployment constant (`DEFAULT_EXAM_ID`). A build
 * could carry two curriculum packs and still only ever show one of them,
 * with the second unreachable from every student-facing surface. This is
 * the control that makes a second pack real to a visitor.
 *
 * ── Design ───────────────────────────────────────────────────────────────
 *
 * Deliberately the SAME capsule the room badge next to it already uses —
 * hairline border, `--surface-fill`, trailing ChevronDown. The shell
 * already had a visual language for "here is the current context, tap to
 * change it", and a second, differently-styled switcher sitting beside the
 * first would read as two unrelated controls rather than one idea.
 *
 * No accent colour anywhere. Vidhya Clarity reserves green for mastery and
 * indigo for AI/tutor; which exam you are browsing is neither, so the chip,
 * the menu and the current-selection check are all ink and grey. The check
 * in particular is ink ON PURPOSE — a green tick would read as "you have
 * achieved this exam", which means nothing.
 *
 * Renders NOTHING when fewer than two packs are loaded. A switcher offering
 * one option is noise, and every single-exam deployment gets its header
 * back exactly as it was.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useActiveExam, setActiveExam } from '@/hooks/useActiveExam';

/**
 * Exam names are long ("GATE Engineering Mathematics", "JEE Main (PCM)")
 * and the header is narrow. The chip shows a short form; the menu always
 * shows the full name, so nothing is only ever seen abbreviated.
 */
export function shortExamName(name: string): string {
  const trimmed = name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const words = trimmed.split(/\s+/);
  return words.length <= 2 ? trimmed : words.slice(0, 2).join(' ');
}

export function ExamSwitcher() {
  const { exam } = useActiveExam();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const options = exam?.available_exams ?? [];
  // Fewer than two packs: nothing to switch between.
  if (!exam || options.length < 2) return null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current exam: ${exam.name}. Tap to switch exam.`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          // 8px vertical padding on a 28px capsule gives a real 44px tap
          // target while matching the room badge's visual height.
          padding: '8px 10px',
          minHeight: 44,
          borderRadius: 'var(--radius-capsule)',
          border: 'var(--hairline) solid var(--separator)',
          background: 'var(--surface-fill)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-caption)',
          fontWeight: 'var(--weight-medium)',
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          transition: 'opacity var(--dur-fast) var(--ease-standard)',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span>{shortExamName(exam.name)}</span>
        <ChevronDown size={10} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose exam"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 232,
            background: 'var(--surface-card)',
            border: 'var(--hairline) solid var(--separator)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-menu, 0 8px 24px rgba(0,0,0,0.10))',
            overflow: 'hidden',
            zIndex: 60,
          }}
        >
          {options.map((o, i) => {
            const current = o.id === exam.exam_id;
            return (
              <button
                key={o.id}
                role="option"
                aria-selected={current}
                onClick={() => { setOpen(false); if (!current) setActiveExam(o.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  minHeight: 44,
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: i === 0 ? 'none' : 'var(--hairline) solid var(--separator)',
                  textAlign: 'left',
                  cursor: current ? 'default' : 'pointer',
                  // 15px: supporting text, above the 13px metadata floor.
                  fontSize: 'var(--text-subhead)',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                  fontWeight: current ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                }}
              >
                <span style={{ width: 16, display: 'flex', flexShrink: 0 }}>
                  {current && <Check size={16} style={{ color: 'var(--text-primary)' }} />}
                </span>
                <span>{o.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
