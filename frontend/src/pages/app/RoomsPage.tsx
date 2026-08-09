/**
 * RoomsPage — conscious room entry for the three-room UX superstrategy.
 *
 * Three rooms:
 *   exam  — Exam prep: timed practice, score maximisation, session planning
 *   learn — Concept learning: curriculum track, deep understanding, no deadline
 *   teach — Teaching hub: class roster, cohort insight, teaching briefs
 *
 * Persists choice as vidhya.room in localStorage so AppLayout reads it
 * on every page load as the first-priority persona override.
 */

import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export type RoomId = 'exam' | 'learn' | 'teach';

export const ROOM_KEY = 'vidhya.room';

export function getActiveRoom(): RoomId | null {
  try {
    const v = localStorage.getItem(ROOM_KEY);
    if (v === 'exam' || v === 'learn' || v === 'teach') return v;
  } catch { /* ignore */ }
  return null;
}

export function setActiveRoom(room: RoomId): void {
  try { localStorage.setItem(ROOM_KEY, room); } catch { /* ignore */ }
}

const ROOMS: Array<{
  id: RoomId;
  label: string;
  tagline: string;
  detail: string;
  icon: React.ReactNode;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  home: string;
  roles?: string[];
}> = [
  {
    id: 'exam',
    label: 'Exam prep',
    tagline: 'Crack your competitive exam',
    detail: 'Timed sessions calibrated to your weak spots. Practice problems, readiness meter, full mock exams.',
    icon: <Target size={22} />,
    accentBg: 'rgba(52, 199, 89, 0.08)',
    accentBorder: 'rgba(52, 199, 89, 0.25)',
    accentText: 'var(--green-ink)',
    home: '/planned',
  },
  {
    id: 'learn',
    label: 'Concept learning',
    tagline: 'Build deep understanding',
    detail: 'Follow a concept curriculum at your pace. Visualisations, worked examples, and an AI tutor on every topic.',
    icon: <BookOpen size={22} />,
    accentBg: 'rgba(88, 86, 214, 0.08)',
    accentBorder: 'rgba(88, 86, 214, 0.25)',
    accentText: 'var(--indigo-ink)',
    home: '/knowledge-home',
  },
  {
    id: 'teach',
    label: 'Teaching',
    tagline: 'Support your class',
    detail: 'See cohort-level patterns, flag struggling students, and share concept briefs tailored to your class.',
    icon: <GraduationCap size={22} />,
    accentBg: 'rgba(120, 120, 128, 0.08)',
    accentBorder: 'var(--separator)',
    accentText: 'var(--text-secondary)',
    home: '/teaching',
    roles: ['teacher', 'admin', 'owner'],
  },
];

export default function RoomsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const visibleRooms = ROOMS.filter(r => {
    if (!r.roles) return true;
    if (!user) return false;
    return r.roles.includes(user.role);
  });

  const enter = (room: typeof ROOMS[number]) => {
    setActiveRoom(room.id);
    navigate(room.home, { replace: true });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 448,
        margin: '0 auto',
        paddingTop: 24,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--text-title2)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Choose your room
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 'var(--text-subhead)',
            color: 'var(--text-secondary)',
          }}
        >
          You can switch rooms anytime from the header.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleRooms.map(room => (
          <button
            key={room.id}
            onClick={() => enter(room)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 16px',
              borderRadius: 'var(--radius-lg)',
              background: room.accentBg,
              border: `1px solid ${room.accentBorder}`,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
              width: '100%',
              transition: `opacity var(--dur-fast) var(--ease-standard)`,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                background: room.accentBg,
                border: `1px solid ${room.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: room.accentText,
              }}
            >
              {room.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-body)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {room.label}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-footnote)',
                  color: room.accentText,
                  fontWeight: 'var(--weight-medium)',
                  marginTop: 1,
                }}
              >
                {room.tagline}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginTop: 4,
                }}
              >
                {room.detail}
              </div>
            </div>

            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
