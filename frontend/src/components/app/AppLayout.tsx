/**
 * AppLayout — Mobile-first layout with animated bottom nav, scroll-aware header, auth.
 * v5.0: persona-aware shell detection. Reads user.role + student profile to serve
 * the right nav and home route for Knowledge / Exam / Teacher / Admin shells.
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart3, Settings, MessageCircle, User, LogOut, Shield, PlayCircle, BookOpen, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useCalmMode } from '@/hooks/useCalmMode';
// v2.5: migrated from @/hooks/useAuth (Supabase Auth) to @/contexts/AuthContext
// (Vidhya JWT). Backend only validates Vidhya JWTs — the Supabase hook was
// frontend-only state that never matched what the API would accept.
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/hooks/useSession';
import { StreakBadge } from '@/components/app/StreakBadge';
import { authFetch } from '@/lib/auth/client';

type Persona = 'knowledge' | 'exam' | 'teacher' | 'loading';

// Per-persona nav configurations aligned with the shell spec.
// Teacher/admin shell surfaces teaching tools; knowledge shell leads with Learn.
const NAV_BY_PERSONA: Record<Exclude<Persona, 'loading'>, Array<{ to: string; icon: typeof Home; label: string; end?: boolean }>> = {
  knowledge: [
    { to: '/knowledge-home', icon: BookOpen,     label: 'Learn',    end: true },
    { to: '/planned',        icon: PlayCircle,   label: 'Practice' },
    { to: '/progress',       icon: BarChart3,    label: 'Progress' },
  ],
  exam: [
    { to: '/planned',        icon: Home,         label: 'Home',     end: true },
    { to: '/smart-practice', icon: BookOpen,     label: 'Practice' },
    { to: '/progress',       icon: BarChart3,    label: 'Progress' },
  ],
  teacher: [
    { to: '/teaching',       icon: GraduationCap, label: 'Teach',   end: true },
    { to: '/progress',       icon: Users,         label: 'Students' },
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

  // First-visit demo welcome redirect. New visitors land at /welcome which
  // sets exam expectations explicitly ("This demo runs on GATE Engineering
  // Mathematics") so they're not surprised by the silent default. After
  // dismissal, vidhya.demo_welcomed is set in localStorage and we never
  // redirect again. /welcome and /sign-in are exempt from the redirect.
  useEffect(() => {
    const exempt = ['/welcome', '/sign-in'];
    if (exempt.includes(location.pathname)) return;
    let welcomed = false;
    try { welcomed = localStorage.getItem('vidhya.demo_welcomed') === '1'; } catch { /* ignore */ }
    if (!welcomed) navigate('/welcome', { replace: true });
  }, [location.pathname, navigate]);

  // Close menu on route change
  useEffect(() => setShowMenu(false), [location]);

  // Persona detection: teacher/admin from JWT role; knowledge vs exam from profile.
  // Resolves on mount so nav is stable before first paint. Falls back to 'exam'
  // (default) for new users or when profile fetch fails.
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

  return (
    <div className="min-h-dvh bg-surface-950 text-white">
      {/* Calm Mode floating toggle — always reachable, even when chrome is hidden.
          Uses Eye / EyeOff iconography (NOT Sun/Moon) to avoid being mistaken
          for a light/dark theme toggle. The project is dark-mode-only by
          design (DESIGN-SYSTEM.md). Calm mode = "hide chrome, focus on content". */}
      <button
        onClick={toggleCalm}
        aria-label={calmMode ? 'Show chrome (exit calm mode)' : 'Hide chrome (enter calm mode)'}
        title={calmMode ? 'Show chrome' : 'Calm mode — hides nav + header'}
        className="fixed top-2 right-2 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-surface-900/70 border border-surface-800 text-surface-400 hover:text-emerald-300 hover:border-emerald-500/50 backdrop-blur-md transition-colors"
      >
        {calmMode ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>

      {/* Header — shadow on scroll. Hidden in Calm Mode. */}
      <header className={clsx(
        'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 bg-surface-950/95 border-b backdrop-blur-md transition-all duration-200',
        scrolled ? 'border-surface-800/80 shadow-lg shadow-black/20' : 'border-transparent',
        calmMode && 'hidden',
      )}>
        <a href="/" className="flex items-center gap-2.5 min-w-[44px] min-h-[44px]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <span className="text-white font-black text-sm">V</span>
          </div>
          <span className="font-bold text-white text-base tracking-tight sr-only">Vidhya</span>
        </a>
        <div className="flex items-center gap-2">
          <StreakBadge sessionId={sessionId} />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-800 transition-colors"
              >
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-xs font-bold">
                    {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-surface-900 border border-surface-700 shadow-xl py-1 z-50"
                >
                  <div className="px-3 py-2 border-b border-surface-800">
                    <p className="text-xs font-medium text-white truncate">{user.name || user.email}</p>
                    <p className="text-xs text-surface-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-800 transition-colors"
                  >
                    <Settings size={14} /> Settings
                  </button>
                  {user.role === 'teacher' && (
                    <button
                      onClick={() => navigate('/teaching')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-800 transition-colors"
                    >
                      <Shield size={14} /> Teaching Hub
                    </button>
                  )}
                  {(user.role === 'admin' || user.role === 'owner') && (
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-800 transition-colors"
                    >
                      <Shield size={14} /> Admin
                    </button>
                  )}
                  <button
                    onClick={() => { signOut(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-800 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 rounded-lg hover:bg-surface-800 transition-colors"
              >
                <Settings size={16} className="text-surface-400" />
              </button>
              <button
                onClick={() => navigate('/sign-in')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors"
              >
                <User size={14} />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Content — full-bleed in Calm Mode, otherwise padded for chrome */}
      <main className={clsx(
        'min-h-dvh',
        calmMode ? 'pt-2 pb-2' : 'pt-12 pb-[calc(64px+env(safe-area-inset-bottom,0px))]',
      )}>
        <div className={clsx('px-4 pb-4 max-w-3xl mx-auto', calmMode ? 'pt-10' : 'pt-2')}>
          <Outlet />
        </div>
      </main>

      {/* Floating Tutor FAB — hidden on /chat and in Calm Mode */}
      {location.pathname !== '/chat' && !calmMode && (
        <motion.button
          onClick={() => navigate('/chat')}
          className="fixed z-50 right-4 w-14 h-14 rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/25 flex items-center justify-center hover:bg-violet-400 transition-colors cursor-pointer touch-manipulation"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)' }}
          whileTap={{ scale: 0.9 }}
          aria-label="Ask the tutor"
        >
          <MessageCircle size={20} />
        </motion.button>
      )}

      {/* Bottom Nav — persona-aware tabs with animated active indicator. Hidden in Calm Mode. */}
      <nav
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-surface-950/95 border-t border-surface-800/80 backdrop-blur-md',
          calmMode && 'hidden',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {persona === 'loading' ? (
          // Skeleton while persona resolves — prevents flash of wrong nav
          [1, 2, 3].map(i => (
            <div key={i} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1.5">
              <div className="w-5 h-5 rounded bg-surface-800 animate-pulse" />
              <div className="w-8 h-2 rounded bg-surface-800 animate-pulse" />
            </div>
          ))
        ) : (
          NAV_BY_PERSONA[persona].map(item => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={clsx(
                  'relative flex-1 flex flex-col items-center justify-center py-2.5 gap-1',
                  'touch-manipulation transition-colors duration-150',
                  isActive ? 'text-violet-400' : 'text-surface-500',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-violet-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })
        )}
      </nav>

      {/* Click-away for menu */}
      {showMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}
