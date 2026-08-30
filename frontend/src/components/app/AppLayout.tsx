/**
 * AppLayout — Mobile-first layout with bottom nav, header, auth.
 * Persona-aware shell detection. Reads user.role + student profile to serve
 * the right nav and home route for Knowledge / Exam / Teacher / Admin shells.
 *
 * Three-room UX superstrategy (2026-08-09):
 *   vidhya.room localStorage key overrides profile-based persona detection.
 *   A room badge in the header shows the active room; tapping it opens /rooms.
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Settings, MessageCircle, User, LogOut, Shield, PlayCircle, BookOpen, GraduationCap, Users, Eye, EyeOff, Target, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useCalmMode } from '@/hooks/useCalmMode';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { getDemoPersona } from '@/lib/demoPersona';
import { isDemoMode } from '@/lib/demoMode';
import { DemoRoleSwitcher } from '@/components/app/DemoRoleSwitcher';
import { DemoRailNav } from '@/components/app/DemoRailNav';
import { WalkthroughBar } from '@/components/app/WalkthroughBar';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/hooks/useSession';
import { authFetch } from '@/lib/auth/client';
import { TabBar } from '@/components/ui/TabBar';
import { TutorFab } from '@/components/ui/TutorFab';
import { getActiveRoom, type RoomId } from '@/pages/app/RoomsPage';

type Persona = 'knowledge' | 'exam' | 'teacher' | 'loading';

const ROOM_TO_PERSONA: Record<RoomId, Exclude<Persona, 'loading'>> = {
  exam: 'exam',
  learn: 'knowledge',
  teach: 'teacher',
};

const ROOM_META: Record<RoomId, { label: string; icon: React.ReactNode; color: string }> = {
  exam:  { label: 'Exam prep',         icon: <Target   size={12} />, color: 'var(--green-ink)' },
  learn: { label: 'Concept learning',  icon: <BookOpen size={12} />, color: 'var(--indigo-ink)' },
  teach: { label: 'Teaching',          icon: <GraduationCap size={12} />, color: 'var(--text-secondary)' },
};

const NAV_BY_PERSONA: Record<Exclude<Persona, 'loading'>, Array<{ value: string; label: string; icon?: React.ReactNode }>> = {
  knowledge: [
    { value: '/knowledge-home', label: 'Learn',    icon: <BookOpen size={20} /> },
    { value: '/planned',        label: 'Practice', icon: <PlayCircle size={20} /> },
    { value: '/progress',       label: 'Progress', icon: <BarChart3 size={20} /> },
  ],
  exam: [
    { value: '/planned',        label: 'Home',     icon: <Home size={20} /> },
    { value: '/smart-practice', label: 'Practice', icon: <BookOpen size={20} /> },
    { value: '/progress',       label: 'Progress', icon: <BarChart3 size={20} /> },
  ],
  teacher: [
    { value: '/teaching',       label: 'Teach',    icon: <GraduationCap size={20} /> },
    { value: '/progress',       label: 'Students', icon: <Users size={20} /> },
  ],
};

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const sessionId = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [persona, setPersona] = useState<Persona>('loading');
  const [calmMode, , toggleCalm] = useCalmMode();
  // Lets the tutor FAB yield the content column while the student reads.
  const { scrollingDown } = useScrollDirection();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // `/demo` is exempt because it IS a landing screen, and its visitor is by
    // definition first-time — so without this the one-shot welcome redirect
    // fires on exactly the person the deck exists for, and the first tap at a
    // venue lands on a generic welcome page instead of the journeys.
    const exempt = ['/welcome', '/sign-in', '/rooms', '/demo', '/demo/doubt'];
    if (exempt.includes(location.pathname)) return;
    // A visitor mid-journey is likewise exempt, wherever the rail took them.
    // Exempting the deck alone was not enough: the redirect then fired on the
    // lesson the first card opens, so the journey still ended on the welcome
    // page one tap in. Keyed on the active persona rather than on a widening
    // route list, so the real first-visit flow for actual students is
    // untouched. Both failures were found by walking the rail in a browser —
    // unit tests and every CI gate were green through both of them.
    if (getDemoPersona()) return;
    let welcomed = false;
    try { welcomed = localStorage.getItem('vidhya.demo_welcomed') === '1'; } catch { /* ignore */ }
    if (!welcomed) navigate('/welcome', { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => setShowMenu(false), [location]);

  useEffect(() => {
    // Three-room superstrategy: vidhya.room overrides all automatic detection.
    const storedRoom = getActiveRoom();
    if (storedRoom) {
      setPersona(ROOM_TO_PERSONA[storedRoom]);
      return;
    }
    if (!user) { setPersona('exam'); return; }
    if (user.role === 'teacher' || user.role === 'admin' || user.role === 'owner') {
      setPersona('teacher');
      return;
    }
    authFetch('/api/student/profile')
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        const knowledgeTrackId = data?.exams?.[0]?.knowledge_track_id ?? null;
        if (knowledgeTrackId) { setPersona('knowledge'); return; }
        setPersona('exam');
      })
      .catch(() => setPersona('exam'));
  }, [user]);

  const navItems = persona !== 'loading' ? NAV_BY_PERSONA[persona] : [];
  const activeTab = navItems.find(it => location.pathname.startsWith(it.value))?.value ?? '';

  const onTabChange = (value: string) => navigate(value);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--surface-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Calm Mode toggle — standalone fixed button ONLY when header is hidden (calm mode active).
          When calm mode is off, the toggle lives inside the header to prevent top-right overlap. */}
      {calmMode && (
        <button
          onClick={toggleCalm}
          aria-label="Show chrome (exit calm mode)"
          style={{
            position: 'fixed',
            top: 8,
            right: 8,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-capsule)',
            border: 'var(--hairline) solid var(--separator)',
            background: 'var(--material-regular)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Eye size={15} />
        </button>
      )}

      {isDemoMode() && <DemoRoleSwitcher />}
      {/* Renders only on a step of an active surfaces rail; inert otherwise. */}
      <DemoRailNav />
      {/* Renders nothing unless an admin walkthrough is running. */}
      <WalkthroughBar />

      {/* Header */}
      {!calmMode && (
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px 0 20px',
            height: 50,
            background: scrolled ? 'var(--material-thick)' : 'var(--surface-canvas)',
            backdropFilter: scrolled ? 'var(--blur-nav)' : undefined,
            WebkitBackdropFilter: scrolled ? 'var(--blur-nav)' : undefined,
            borderBottom: scrolled ? 'var(--hairline) solid var(--separator)' : 'none',
            transition: 'background var(--dur-fast) var(--ease-standard)',
          }}
        >
          {/* Wordmark */}
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 44,
              minHeight: 44,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: 'var(--ink)',
                color: 'var(--surface-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-sans)',
              }}
            >
              V
            </div>
          </a>

          {/* Room badge — shows active room, tapping opens /rooms */}
          {persona !== 'loading' && (() => {
            const activeRoom = getActiveRoom();
            if (!activeRoom) return null;
            const meta = ROOM_META[activeRoom];
            return (
              <button
                onClick={() => navigate('/rooms')}
                aria-label={`Current room: ${meta.label}. Tap to switch.`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-capsule)',
                  border: 'var(--hairline) solid var(--separator)',
                  background: 'var(--surface-fill)',
                  color: meta.color,
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-medium)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                  minHeight: 28,
                  transition: `opacity var(--dur-fast) var(--ease-standard)`,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {meta.icon}
                <span style={{ color: 'var(--text-secondary)' }}>{meta.label}</span>
                <ChevronDown size={10} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            );
          })()}

          {/* Right side — calm toggle always first so it's never crowded */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Calm mode toggle — inside header so it doesn't overlap the avatar */}
            <button
              onClick={toggleCalm}
              aria-label="Hide chrome (enter calm mode)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-capsule)',
                border: 'var(--hairline) solid var(--separator)',
                background: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <EyeOff size={14} />
            </button>
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 'var(--radius-capsule)',
                    border: 'none',
                    background: 'var(--surface-fill)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Account menu"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="" style={{ width: 30, height: 30 }} />
                  ) : (
                    <span>{(user.name || user.email)?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </button>
                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: 8,
                      width: 200,
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-card)',
                      boxShadow: 'var(--shadow-card)',
                      border: 'var(--hairline) solid var(--separator)',
                      overflow: 'hidden',
                      zIndex: 50,
                    }}
                  >
                    <div style={{ padding: '10px 14px', borderBottom: 'var(--hairline) solid var(--separator)' }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user.role}</p>
                    </div>
                    {[
                      { label: 'Settings', icon: <Settings size={14} />, action: () => navigate('/settings') },
                      ...(user.role === 'teacher' ? [{ label: 'Teaching Hub', icon: <Shield size={14} />, action: () => navigate('/teaching') }] : []),
                      ...((user.role === 'admin' || user.role === 'owner') ? [{ label: 'Admin', icon: <Shield size={14} />, action: () => navigate('/admin/dashboard') }] : []),
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 14px',
                          border: 'none',
                          background: 'none',
                          fontSize: 'var(--text-footnote)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          textAlign: 'left',
                        }}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                    <button
                      onClick={() => { signOut(); setShowMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        border: 'none',
                        borderTop: 'var(--hairline) solid var(--separator)',
                        background: 'none',
                        fontSize: 'var(--text-footnote)',
                        color: 'var(--red)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        textAlign: 'left',
                      }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/settings')}
                  style={{ padding: 6, borderRadius: 'var(--radius-xs)', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => navigate('/sign-in')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'var(--hairline) solid var(--separator)',
                    background: 'var(--surface-fill)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-footnote)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <User size={14} /> Sign In
                </button>
              </>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main
        style={{
          minHeight: '100dvh',
          paddingTop: calmMode ? 8 : 50,
          paddingBottom: calmMode ? 8 : isDemoMode() ? 'calc(220px + env(safe-area-inset-bottom, 0px))' : 'calc(64px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          style={{
            padding: calmMode ? '10px 20px 20px' : '8px 20px 20px',
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* Tutor FAB — hidden on /chat and in Calm Mode.
          z:45 keeps it above the header (z:40) but below page modals (z:50).
          In demo mode, pushed higher so it clears the DemoRoleSwitcher bar (~148px).

          It slides off the right edge while the student is scrolling down,
          because it is fixed over the content column with no reserved
          gutter — live QA caught the 56px disc sitting on top of two of the
          four options on a micro_exercise card. Reading posture hides it;
          scrolling up or coming to rest brings it straight back (see
          useScrollDirection). `--dur-base` collapses to 1ms under
          prefers-reduced-motion, so the control simply snaps rather than
          animating, and `visibility` keeps it out of the tab order while
          parked off-screen. */}
      {location.pathname !== '/chat' && !calmMode && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: isDemoMode()
              ? 'calc(148px + env(safe-area-inset-bottom, 0px) + 72px)'
              : 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)',
            zIndex: 45,
            transform: scrollingDown ? 'translateX(calc(100% + 20px))' : 'translateX(0)',
            opacity: scrollingDown ? 0 : 1,
            visibility: scrollingDown ? 'hidden' : 'visible',
            transition:
              'transform var(--dur-base) var(--ease-standard), opacity var(--dur-base) var(--ease-standard), visibility var(--dur-base)',
          }}
        >
          <TutorFab onClick={() => navigate('/chat')}>
            <MessageCircle size={20} />
          </TutorFab>
        </div>
      )}

      {/* Bottom Tab Bar */}
      {!calmMode && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40 }}>
          {persona === 'loading' ? (
            <nav
              style={{
                display: 'flex',
                alignItems: 'stretch',
                background: 'var(--material-thick)',
                backdropFilter: 'var(--blur-nav)',
                WebkitBackdropFilter: 'var(--blur-nav)',
                borderTop: 'var(--hairline) solid var(--separator)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {[1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0 10px', gap: 4 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--surface-fill)' }} />
                  <div style={{ width: 28, height: 8, borderRadius: 4, background: 'var(--surface-fill)' }} />
                </div>
              ))}
            </nav>
          ) : (
            <TabBar items={navItems} value={activeTab} onChange={onTabChange} />
          )}
        </div>
      )}

      {/* Click-away for menu — z:39 sits below the header (z:40) so the header
          itself stays interactive; tab-bar navigation already triggers the
          useEffect that closes showMenu via location change. */}
      {showMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}
