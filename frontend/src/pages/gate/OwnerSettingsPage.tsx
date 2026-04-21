import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, ArrowRightLeft, Smartphone, MessageCircle, AlertCircle,
  Check, X, RefreshCw, Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch, fetchAuthConfig, type Role, type AuthConfig } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export default function OwnerSettingsPage() {
  const { user, hasRole, refresh } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);

  const loadAdmins = useCallback(async () => {
    try {
      const r = await authFetch('/api/admin/users');
      if (!r.ok) return;
      const d = await r.json();
      setAdmins((d.users || []).filter((u: any) => u.role === 'admin'));
    } catch {}
  }, []);

  useEffect(() => {
    if (hasRole('owner')) { loadAdmins(); fetchAuthConfig().then(setAuthConfig); }
  }, [hasRole, loadAdmins]);

  const transferOwnership = async () => {
    if (!selectedNewOwner) return;
    const target = admins.find(a => a.id === selectedNewOwner);
    if (!target) return;
    if (!confirm(`Transfer ownership to ${target.name} (${target.email})? You will be demoted to admin. This cannot be undone from the UI.`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await authFetch('/api/owner/transfer-ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_owner_id: selectedNewOwner }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error || 'Failed' }); return; }
      setMsg({ type: 'ok', text: 'Ownership transferred. You are now an admin.' });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!hasRole('owner')) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-2">
        <AlertCircle size={24} className="text-amber-400 mx-auto" />
        <p className="text-sm text-surface-300">Owner role required.</p>
        <p className="text-xs text-surface-500">Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5 max-w-2xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div variants={fadeInUp}>
        <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
          <Crown size={20} className="text-amber-400" />
          Owner Settings
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          You are the owner of this Vidhya deployment. You have full control.
        </p>
      </motion.div>

      {/* Channel integration status */}
      {authConfig && (
        <motion.div variants={fadeInUp} className="space-y-2">
          <p className="text-[10px] text-surface-500 uppercase tracking-wide">Channel integrations</p>
          <div className="space-y-1.5">
            <ChannelStatusRow
              icon={Smartphone}
              name="Web app"
              enabled={authConfig.channels.web}
              hint=""
            />
            <ChannelStatusRow
              icon={Smartphone}
              name="Telegram bot"
              enabled={authConfig.channels.telegram}
              hint="Set TELEGRAM_BOT_TOKEN in .env to enable"
            />
            <ChannelStatusRow
              icon={MessageCircle}
              name="WhatsApp"
              enabled={authConfig.channels.whatsapp}
              hint="Set WHATSAPP_ACCESS_TOKEN in .env to enable"
            />
          </div>
          <p className="text-[10px] text-surface-600 mt-1">
            See <span className="font-mono">docs/MULTI-CHANNEL-SETUP.md</span> for setup instructions.
          </p>
        </motion.div>
      )}

      {/* Transfer ownership */}
      <motion.div variants={fadeInUp} className="space-y-2 pt-4 border-t border-surface-800">
        <p className="text-[10px] text-surface-500 uppercase tracking-wide flex items-center gap-1.5">
          <ArrowRightLeft size={11} />
          Transfer ownership
        </p>

        {admins.length === 0 ? (
          <p className="text-xs text-surface-500">
            No admins to transfer to. Promote a user to admin first on the <a href="/admin/users" className="text-sky-400 hover:text-sky-300">User Management</a> page.
          </p>
        ) : (
          <div className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-2">
            <select
              value={selectedNewOwner}
              onChange={e => setSelectedNewOwner(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-200"
            >
              <option value="">Choose an admin to become the new owner...</option>
              {admins.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.email}
                </option>
              ))}
            </select>
            <button
              onClick={transferOwnership}
              disabled={!selectedNewOwner || busy}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500/80 to-rose-500/80 text-white text-sm font-medium disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
              Transfer ownership
            </button>
            <p className="text-[10px] text-surface-500">
              You will be demoted to admin. The new owner gains full control.
            </p>
          </div>
        )}

        {msg && (
          <div className={
            msg.type === 'ok'
              ? 'p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300'
              : 'p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300'
          }>
            {msg.text}
          </div>
        )}
      </motion.div>

      {/* Owner CLI info */}
      <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-1.5">
        <p className="text-[10px] text-surface-500 uppercase tracking-wide">Escape hatch</p>
        <p className="text-xs text-surface-300">
          Lost access? Admins with shell access to the deployment can run:
        </p>
        <code className="block text-[11px] bg-surface-950 px-2 py-1.5 rounded text-amber-300 font-mono">
          npx tsx scripts/admin/assign-owner.ts --email new-owner@example.com
        </code>
        <p className="text-[10px] text-surface-500">
          Requires shell access to the server. This is intentional — filesystem control is the ultimate ownership proof.
        </p>
      </motion.div>
    </motion.div>
  );
}

function ChannelStatusRow({ icon: Icon, name, enabled, hint }: {
  icon: typeof Smartphone;
  name: string;
  enabled: boolean;
  hint: string;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-surface-900 border border-surface-800 flex items-center gap-3">
      <Icon size={14} className={enabled ? 'text-emerald-400' : 'text-surface-600'} />
      <div className="flex-1">
        <p className="text-xs text-surface-200">{name}</p>
        {!enabled && hint && <p className="text-[10px] text-surface-500">{hint}</p>}
      </div>
      {enabled
        ? <Check size={13} className="text-emerald-400" />
        : <X size={13} className="text-surface-600" />}
    </div>
  );
}
