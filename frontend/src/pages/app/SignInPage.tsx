import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, Smartphone, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAuthConfig, loadGoogleIdentityServices, completeGoogleSignIn,
  type AuthConfig,
} from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

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
    <motion.div
      className="max-w-md mx-auto space-y-6 py-6"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      <motion.div variants={fadeInUp} className="text-center space-y-2">
        <div className="inline-flex w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-emerald-500/20 items-center justify-center border border-violet-500/30">
          <Key size={28} className="text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-surface-100">Sign in to Vidhya</h1>
        <p className="text-sm text-surface-400">
          {link_token
            ? 'Complete sign-in to link your chat app.'
            : 'Use Google to access your progress, materials, and personalized plan.'}
        </p>
      </motion.div>

      {link_token && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 flex items-start gap-2.5">
          <MessageCircle size={14} className="shrink-0 mt-0.5 text-violet-400" />
          <div className="text-xs text-violet-200/90 leading-relaxed">
            <span className="font-medium text-violet-300">Linking a chat app.</span>{' '}
            Once you sign in, your Telegram or WhatsApp chat will be bound to this account.
          </div>
        </motion.div>
      )}

      {/* Google button container */}
      <motion.div variants={fadeInUp} className="flex flex-col items-center gap-3">
        {config === null ? (
          <div className="text-xs text-surface-500 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            Loading...
          </div>
        ) : !config.google_client_id ? (
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/25 text-xs text-amber-200 text-center">
            <p className="font-medium text-amber-300 mb-1">Sign-in not configured</p>
            <p>
              The server administrator needs to set <span className="font-mono">GOOGLE_OAUTH_CLIENT_ID</span> in the environment.
              See <span className="font-mono">docs/ROLES-AND-ACCESS.md</span> for setup.
            </p>
          </div>
        ) : pending ? (
          <div className="text-xs text-surface-400 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            Signing in...
          </div>
        ) : (
          <div ref={buttonRef} />
        )}

        {error && (
          <div className="text-xs text-rose-400 text-center">
            {error}
          </div>
        )}
      </motion.div>

      {/* Privacy note */}
      <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5">
        <Shield size={14} className="shrink-0 mt-0.5 text-emerald-400" />
        <div className="text-xs text-emerald-200/90 leading-relaxed space-y-1">
          <p><span className="font-medium text-emerald-300">Lean identity.</span> We use Google to verify who you are. We only receive your email, name, and avatar.</p>
          <p>Your study materials stay on your device. Your chat history and progress stay in your browser's storage unless you explicitly sync.</p>
        </div>
      </motion.div>

      {/* Channel hints */}
      {config?.channels && (config.channels.telegram || config.channels.whatsapp) && !link_token && (
        <motion.div variants={fadeInUp} className="space-y-2 pt-2">
          <p className="text-[10px] text-surface-500 uppercase tracking-wide">
            Access from elsewhere
          </p>
          <div className="space-y-1.5">
            {config.channels.telegram && (
              <div className="p-2.5 rounded-lg bg-surface-900 border border-surface-800 flex items-center gap-2">
                <Smartphone size={13} className="text-violet-400" />
                <p className="text-xs text-surface-300 flex-1">
                  Telegram bot available — send <span className="font-mono">/start</span> to the Vidhya bot
                </p>
              </div>
            )}
            {config.channels.whatsapp && (
              <div className="p-2.5 rounded-lg bg-surface-900 border border-surface-800 flex items-center gap-2">
                <MessageCircle size={13} className="text-emerald-400" />
                <p className="text-xs text-surface-300 flex-1">
                  WhatsApp Business — send "start" to the configured number
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
