/**
 * AppLayout — Mobile-first layout with bottom nav, header, auth.
 * Persona-aware shell detection. Reads user.role + student profile to serve
 * the right nav and home route for Knowledge / Exam / Teacher / Admin shells.
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Settings, MessageCircle, User, LogOut, Shield, PlayCircle, BookOpen, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useCalmMode } from '@/hooks/useCalmMode';
import { isDemoMode } from '@/lib/demoMode';
import { DemoRoleSwitcher } from '@/components/app/DemoRoleSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/hooks/useSession';
import { authFetch } from '@/lib/auth/client';
import { TabBar } from '@/components/ui/TabBar';
import { TutorFab } from '@/components/ui/TutorFab';

type Persona = 'knowledge' | 'exam' | 'teacher' | 'loading';

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const exempt = ['/welcome', '/sign-in'];
    if (exempt.includes(location.pathname)) return;
    let welcomed = false;
    try { welcomed = localStorage.getItem('vidhya.demo_welcomed') === '1'; } catch { /* ignore */ }
    if (!welcomed) navigate('/welcome', { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => setShowMenu(false), [location]);

  useEffect(() => {
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
      {/* Calm Mode toggle */}
      <button
        onClick={toggleCalm}
        aria-label={calmMode ? 'Show chrome (exit calm mode)' : 'Hide chrome (enter calm mode)'}
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
        {calmMode ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>

      {isDemoMode() && <DemoRoleSwitcher />}

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
            padding: '0 20px',
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

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

      {/* Tutor FAB — hidden on /chat and in Calm Mode */}
      {location.pathname !== '/chat' && !calmMode && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)',
            zIndex: 50,
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

      {/* Click-away for menu */}
      {showMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}
