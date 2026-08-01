import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, ArrowRightLeft, Smartphone, MessageCircle, AlertCircle,
  Check, X, RefreshCw, Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch, fetchAuthConfig, type Role, type AuthConfig } from '@/lib/auth/client';

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
      setAdmins((d.users || []).filter((u: { role: string }) => u.role === 'admin'));
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
      <div style={{ maxWidth: 448, margin: '0 auto', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <AlertCircle size={24} style={{ color: 'var(--orange)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>Owner role required.</p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Crown size={20} style={{ color: 'var(--orange)' }} />
          Owner Settings
        </h1>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
          You are the owner of this Vidhya deployment. You have full control.
        </p>
      </motion.div>

      {/* Channel integration status */}
      {authConfig && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Channel integrations</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ChannelStatusRow icon={Smartphone} name="Web app" enabled={authConfig.channels.web} hint="" />
            <ChannelStatusRow icon={Smartphone} name="Telegram bot" enabled={authConfig.channels.telegram} hint="Set TELEGRAM_BOT_TOKEN in .env to enable" />
            <ChannelStatusRow icon={MessageCircle} name="WhatsApp" enabled={authConfig.channels.whatsapp} hint="Set WHATSAPP_ACCESS_TOKEN in .env to enable" />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-tertiary)' }}>
            See <span style={{ fontFamily: 'var(--font-mono)' }}>docs/MULTI-CHANNEL-SETUP.md</span> for setup instructions.
          </p>
        </motion.div>
      )}

      {/* Transfer ownership */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ paddingTop: 16, borderTop: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowRightLeft size={11} />
          Transfer ownership
        </p>

        {admins.length === 0 ? (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            No admins to transfer to. Promote a user to admin first on the{' '}
            <a href="/admin/users" style={{ color: 'var(--indigo-ink)' }}>User Management</a> page.
          </p>
        ) : (
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select
              value={selectedNewOwner}
              onChange={e => setSelectedNewOwner(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-caption)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
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
              style={{ width: '100%', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: !selectedNewOwner || busy ? 'var(--surface-fill)' : 'var(--orange)', color: !selectedNewOwner || busy ? 'var(--text-tertiary)' : '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', border: 'none', cursor: !selectedNewOwner || busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
              Transfer ownership
            </button>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>
              You will be demoted to admin. The new owner gains full control.
            </p>
          </div>
        )}

        {msg && (
          <div style={{
            padding: 12,
            borderRadius: 'var(--radius-sm)',
            background: msg.type === 'ok' ? 'rgba(52,199,89,.06)' : 'rgba(255,59,48,.06)',
            border: msg.type === 'ok' ? '1px solid rgba(52,199,89,.22)' : '1px solid rgba(255,59,48,.22)',
            fontSize: 11,
            color: msg.type === 'ok' ? 'var(--green-ink)' : 'var(--red)',
          }}>
            {msg.text}
          </div>
        )}
      </motion.div>

      {/* Escape hatch */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Escape hatch</p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
          Lost access? Admins with shell access to the deployment can run:
        </p>
        <code style={{ display: 'block', fontSize: 11, background: 'var(--surface-fill)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>
          npx tsx scripts/admin/assign-owner.ts --email new-owner@example.com
        </code>
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>
          Requires shell access to the server. This is intentional — filesystem control is the ultimate ownership proof.
        </p>
      </motion.div>
    </div>
  );
}

function ChannelStatusRow({ icon: Icon, name, enabled, hint }: {
  icon: typeof Smartphone;
  name: string;
  enabled: boolean;
  hint: string;
}) {
  return (
    <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon size={14} style={{ color: enabled ? 'var(--green-ink)' : 'var(--text-tertiary)' }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>{name}</p>
        {!enabled && hint && <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>{hint}</p>}
      </div>
      {enabled
        ? <Check size={13} style={{ color: 'var(--green-ink)' }} />
        : <X size={13} style={{ color: 'var(--text-tertiary)' }} />}
    </div>
  );
}
