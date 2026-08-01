import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, Smartphone, MessageCircle, Loader2, Crown, GraduationCap, BookOpen, FlaskConical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAuthConfig, loadGoogleIdentityServices, completeGoogleSignIn,
  type AuthConfig,
} from '@/lib/auth/client';

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refresh } = useAuth();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const link_token = searchParams.get('link_token');

  // Fetch auth config (client_id, enabled channels) on mount
  useEffect(() => {
    fetchAuthConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  // If already signed in, redirect unless we need to bind a link token
  useEffect(() => {
    if (user && !link_token) navigate('/');
  }, [user, link_token, navigate]);

  // Render the Google button once config + script are ready
  useEffect(() => {
    if (!config?.google_client_id || !buttonRef.current) return;

    let cancelled = false;
    loadGoogleIdentityServices().then((google) => {
      if (cancelled) return;
      google.accounts.id.initialize({
        client_id: config.google_client_id,
        callback: async (resp: any) => {
          setPending(true);
          setError(null);
          try {
            const u = await completeGoogleSignIn(resp.credential, link_token);
            if (!u) {
              setError('Sign-in failed. Please try again.');
              setPending(false);
              return;
            }
            await refresh();
            if (link_token) {
              navigate('/link-complete');
            } else {
              navigate('/');
            }
          } catch (err) {
            setError((err as Error).message);
            setPending(false);
          }
        },
      });
      google.accounts.id.renderButton(buttonRef.current!, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: '280',
      });
    }).catch((err) => setError(err.message));

    return () => { cancelled = true; };
  }, [config?.google_client_id, link_token, navigate, refresh]);

  return (
    <div style={{ maxWidth: 448, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 24 }}>
      {/* Logo + headline */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Key size={28} style={{ color: 'var(--indigo-ink)' }} />
        </div>
        <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Sign in to Vidhya
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
          {link_token
            ? 'Complete sign-in to link your chat app.'
            : 'Use Google to access your progress, materials, and personalized plan.'}
        </p>
      </motion.div>

      {link_token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
        >
          <MessageCircle size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--indigo-ink)' }} />
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--indigo-ink)' }}>Linking a chat app.</span>{' '}
            Once you sign in, your Telegram or WhatsApp chat will be bound to this account.
          </div>
        </motion.div>
      )}

      {/* Google button container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        {config === null ? (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={12} className="animate-spin" />
            Loading...
          </div>
        ) : !config.google_client_id ? (
          <LocalDevQuickStart />
        ) : pending ? (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={12} className="animate-spin" />
            Signing in...
          </div>
        ) : (
          <div ref={buttonRef} />
        )}

        {error && (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--red)', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </motion.div>

      {/* Privacy note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.05)', border: '1px solid rgba(52,199,89,.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
      >
        <Shield size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--green-ink)' }} />
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ margin: 0 }}><span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--green-ink)' }}>Lean identity.</span> We use Google to verify who you are. We only receive your email, name, and avatar.</p>
          <p style={{ margin: 0 }}>Your study materials stay on your device. Your chat history and progress stay in your browser's storage unless you explicitly sync.</p>
        </div>
      </motion.div>

      {/* Channel hints */}
      {config?.channels && (config.channels.telegram || config.channels.whatsapp) && !link_token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Access from elsewhere
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {config.channels.telegram && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={13} style={{ color: 'var(--indigo-ink)' }} />
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', flex: 1 }}>
                  Telegram bot available — send <span style={{ fontFamily: 'var(--font-mono)' }}>/start</span> to the Vidhya bot
                </p>
              </div>
            )}
            {config.channels.whatsapp && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={13} style={{ color: 'var(--green-ink)' }} />
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', flex: 1 }}>
                  WhatsApp Business — send "start" to the configured number
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Local dev quick start
// ============================================================================
//
// Rendered when GOOGLE_OAUTH_CLIENT_ID is unset on the server (i.e. fresh
// `docker compose up` without a real OAuth client). Provides one-click
// sign-in as admin / teacher / student via the `/demo-login` route, which
// auto-seeds demo tokens on first hit. Hidden in production deploys
// (where local_dev is false).
//
// The admin button is the primary action because the local dev's main
// intent is to develop + generate content, which requires admin access
// to /admin/content-rd.
// ============================================================================

function LocalDevQuickStart() {
  return (
    <div style={{ width: '100%', padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <FlaskConical size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--indigo-ink)' }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--indigo-ink)' }}>Local dev quick start</p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption2)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Google OAuth isn&apos;t configured. Sign in with a pre-seeded demo account to start
            generating content immediately.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a
          href="/demo-login?role=admin"
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--indigo)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', textDecoration: 'none' }}
        >
          <Crown size={14} />
          <span style={{ flex: 1 }}>Sign in as Admin</span>
          <span style={{ fontSize: 'var(--text-caption2)', opacity: 0.75 }}>recommended for dev</span>
        </a>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <a
            href="/demo-login?role=teacher"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            <GraduationCap size={12} style={{ color: 'var(--green-ink)' }} />
            <span>Teacher</span>
          </a>
          <a
            href="/demo-login?role=student"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            <BookOpen size={12} style={{ color: 'var(--green-ink)' }} />
            <span>Student</span>
          </a>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
        These accounts are seeded automatically on first click. To enable real Google sign-in,
        set <span style={{ fontFamily: 'var(--font-mono)' }}>GOOGLE_OAUTH_CLIENT_ID</span> in your <span style={{ fontFamily: 'var(--font-mono)' }}>.env</span>.
      </p>
    </div>
  );
}
