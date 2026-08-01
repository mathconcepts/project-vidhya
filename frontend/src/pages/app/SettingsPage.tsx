/**
 * SettingsPage — Theme toggle + session info.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/hooks/useSession';
import { useStorageMode, type StorageMode } from '@/hooks/useStorageMode';
import { isOptedIn as getAggregateOptIn, setOptIn as persistAggregateOptIn } from '@/lib/gbrain/aggregate';
import { Moon, Sun, Copy, Check, Trash2, Bell, Mail, Zap, Database, HardDrive, Cpu } from 'lucide-react';

const sectionStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface-card)',
  border: 'var(--hairline) solid var(--separator)',
  boxShadow: 'var(--shadow-raise)',
};

export default function SettingsPage() {
  const sessionId = useSession();
  const { mode: storageMode, effectiveMode, setMode: setStorageMode, groundingCount } = useStorageMode();
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  const [notifPrefs, setNotifPrefs] = useState({
    email_digest: true,
    streak_reminders: true,
    push_enabled: true,
  });
  const [aggregateOptIn, setAggregateOptIn] = useState(() => getAggregateOptIn());

  const toggleAggregateOptIn = () => {
    const next = !aggregateOptIn;
    persistAggregateOptIn(next);
    setAggregateOptIn(next);
  };

  useEffect(() => {
    fetch(`/api/notifications/preferences?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => setNotifPrefs(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, [sessionId]);

  const updateNotifPref = (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, ...updated }),
    }).catch(() => {});
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gate_theme', next);
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearProgress = () => {
    if (confirm('Clear all progress? This cannot be undone.')) {
      localStorage.removeItem('gate_session_id');
      document.cookie = 'gate_sid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
        Settings
      </h1>

      {/* Theme */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Theme</p>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
          </div>
          <button
            onClick={toggleTheme}
            style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', cursor: 'pointer' }}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark'
                ? <Sun size={18} style={{ color: 'var(--orange)' }} />
                : <Moon size={18} style={{ color: 'var(--indigo-ink)' }} />
              }
            </motion.div>
          </button>
        </div>
      </div>

      {/* Content settings */}
      <a
        href="/content-settings"
        style={{ ...sectionStyle, display: 'block', textDecoration: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Content settings</p>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Manage bundle subscriptions and excluded sources</p>
          </div>
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
        </div>
      </a>

      {/* Uploads */}
      <a
        href="/uploads"
        style={{ ...sectionStyle, display: 'block', textDecoration: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Your uploads</p>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Upload class notes, problem photos, PDFs — private to you</p>
          </div>
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
        </div>
      </a>

      {/* Session */}
      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Session</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{ flex: 1, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', background: 'var(--surface-fill)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
            {sessionId}
          </code>
          <button
            onClick={copySessionId}
            style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', cursor: 'pointer', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              key={copied ? 'check' : 'copy'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {copied
                ? <Check size={16} style={{ color: 'var(--green-ink)' }} />
                : <Copy size={16} style={{ color: 'var(--text-secondary)' }} />
              }
            </motion.div>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Your progress is tied to this session ID. Save it to restore progress on another device.
        </p>
      </div>

      {/* Storage Mode */}
      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={14} style={{ color: 'var(--indigo-ink)' }} />
          <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Storage Mode</p>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          Where your student state (mastery, errors, attempts) is saved. IndexedDB
          keeps everything on your device — required for material grounding.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {([
            { id: 'auto' as StorageMode, label: 'Auto', icon: Cpu, desc: 'Best of both' },
            { id: 'indexeddb' as StorageMode, label: 'Local', icon: HardDrive, desc: 'On-device' },
            { id: 'postgres' as StorageMode, label: 'Cloud', icon: Database, desc: 'Sync across' },
          ]).map(opt => {
            const active = storageMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setStorageMode(opt.id)}
                style={{
                  padding: 8,
                  borderRadius: 'var(--radius-sm)',
                  border: active ? '1px solid rgba(88,86,214,.35)' : 'var(--hairline) solid var(--separator)',
                  background: active ? 'rgba(88,86,214,.06)' : 'var(--surface-fill)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <opt.icon size={12} style={{ color: active ? 'var(--indigo-ink)' : 'var(--text-tertiary)', marginBottom: 4 }} />
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: active ? 'var(--indigo-ink)' : 'var(--text-secondary)' }}>{opt.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>{opt.desc}</p>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
          Currently active: <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{effectiveMode}</span>
          {groundingCount > 0 && <span> · {groundingCount} material chunks</span>}
        </div>
      </div>

      {/* Notifications */}
      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Notifications</p>
        {([
          { key: 'email_digest' as const, label: 'Weekly Email Digest', desc: 'Problems solved, accuracy, weak topics', icon: Mail },
          { key: 'streak_reminders' as const, label: 'Streak Reminders', desc: 'Get notified when your streak is at risk', icon: Zap },
          { key: 'push_enabled' as const, label: 'Push Notifications', desc: 'Daily practice reminders in your browser', icon: Bell },
        ]).map(({ key, label, desc, icon: Icon }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon size={16} style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{desc}</p>
              </div>
            </div>
            <button
              onClick={() => updateNotifPref(key)}
              style={{ width: 40, height: 24, borderRadius: 12, background: notifPrefs[key] ? 'var(--green)' : 'var(--surface-fill)', border: notifPrefs[key] ? 'none' : 'var(--hairline) solid var(--separator)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            >
              <motion.div
                style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', position: 'absolute', top: 4 }}
                animate={{ x: notifPrefs[key] ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Community Data Sharing */}
      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Help improve GBrain</h2>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Send anonymized stats (concept, error type, misconception — never your name, text, or answers)
            to help the population-level misconception library grow. Off by default.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Zap size={16} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>Anonymous aggregation</p>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Batched every 5 min · cancelable anytime</p>
            </div>
          </div>
          <button
            onClick={toggleAggregateOptIn}
            style={{ width: 40, height: 24, borderRadius: 12, background: aggregateOptIn ? 'var(--green)' : 'var(--surface-fill)', border: aggregateOptIn ? 'none' : 'var(--hairline) solid var(--separator)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
          >
            <motion.div
              style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', position: 'absolute', top: 4 }}
              animate={{ x: aggregateOptIn ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...sectionStyle, border: '1px solid rgba(255,59,48,.2)' }}>
        <button
          onClick={clearProgress}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-body)', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Trash2 size={16} />
          <span>Clear all progress and start fresh</span>
        </button>
      </div>

      {/* About */}
      <div style={{ textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', paddingTop: 16, paddingBottom: 8 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Vidhya — built for India's toughest exams</p>
        <p style={{ margin: 0 }}>AI-powered planning · Practice · Smart review</p>
      </div>
    </div>
  );
}
