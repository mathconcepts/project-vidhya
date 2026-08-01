/**
 * AdminPage — Dashboard for teachers/admins.
 * Shows stats, content management, and social media queue.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Zap, Globe, CheckCircle, XCircle, Clock, Loader2, Twitter, Instagram, Linkedin } from 'lucide-react';
import { apiFetch } from '@/hooks/useApi';

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  status: string;
  topic?: string;
  question_text?: string;
  created_at: string;
}

interface Stats {
  total_problems: number;
  total_sessions: number;
  total_verifications: number;
  total_streaks: number;
}

const PLATFORM_ICONS: Record<string, typeof Twitter> = {
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
};

const PLATFORM_COLOR: Record<string, string> = {
  twitter:   'var(--indigo-ink)',
  instagram: 'var(--orange)',
  linkedin:  'var(--indigo-ink)',
};

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  pending:   { background: 'rgba(255,149,0,.10)',    color: 'var(--orange)' },
  approved:  { background: 'rgba(52,199,89,.08)',    color: 'var(--green-ink)' },
  rejected:  { background: 'rgba(255,59,48,.08)',    color: 'var(--red)' },
  published: { background: 'rgba(88,86,214,.08)',    color: 'var(--indigo-ink)' },
};

const STAT_COLORS = [
  'var(--green)',
  'var(--indigo)',
  'var(--indigo)',
  'var(--orange)',
];

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'social'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ topics: { problem_count?: number }[] }>('/api/topics')
      .then(data => {
        const total = (data.topics || []).reduce((acc, t) => acc + (t.problem_count || 0), 0);
        setStats({
          total_problems: total,
          total_sessions: 0,
          total_verifications: 0,
          total_streaks: 0,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'social') {
      setSocialLoading(true);
      apiFetch<{ content: SocialPost[] }>('/api/admin/social')
        .then(data => setSocialPosts(data.content || []))
        .catch(() => setSocialPosts([]))
        .finally(() => setSocialLoading(false));
    }
  }, [tab]);

  const updatePostStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/admin/social/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setSocialPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Manage content and monitor performance</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['overview', 'social'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-caption)',
              fontWeight: 'var(--weight-medium)',
              border: 'none',
              cursor: 'pointer',
              background: tab === t ? 'var(--indigo)' : 'var(--surface-fill)',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t === 'overview' ? 'Overview' : 'Social Media'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          {[
            { label: 'Problems', value: stats?.total_problems || 0, icon: Zap },
            { label: 'Active Sessions', value: stats?.total_sessions || '-', icon: Users },
            { label: 'Verifications', value: stats?.total_verifications || '-', icon: BarChart3 },
            { label: 'SEO Pages', value: '-', icon: Globe },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: STAT_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <stat.icon size={16} style={{ color: '#fff' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {tab === 'social' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {socialLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 className="animate-spin" style={{ color: 'var(--indigo-ink)' }} size={24} />
            </div>
          ) : socialPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Globe size={32} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
              <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>No social content yet.</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Content is auto-generated when the flywheel runs.</p>
            </div>
          ) : (
            socialPosts.map((post, i) => {
              const PlatformIcon = PLATFORM_ICONS[post.platform] || Globe;
              const statusStyle = STATUS_STYLE[post.status] || { background: 'var(--surface-fill)', color: 'var(--text-tertiary)' };
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PlatformIcon size={16} style={{ color: PLATFORM_COLOR[post.platform] || 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: 11, fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{post.platform}</span>
                      {post.topic && (
                        <span style={{ fontSize: 11, background: 'var(--surface-fill)', color: 'var(--text-tertiary)', padding: '2px 8px', borderRadius: 999 }}>{post.topic}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 'var(--weight-medium)', ...statusStyle }}>
                      {post.status}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                    {post.content}
                  </p>

                  {post.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => updatePostStatus(post.id, 'approved')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.08)', color: 'var(--green-ink)', fontSize: 11, fontWeight: 'var(--weight-medium)', border: '1px solid rgba(52,199,89,.22)', cursor: 'pointer' }}
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => updatePostStatus(post.id, 'rejected')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,59,48,.06)', color: 'var(--red)', fontSize: 11, fontWeight: 'var(--weight-medium)', border: '1px solid rgba(255,59,48,.22)', cursor: 'pointer' }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => updatePostStatus(post.id, 'scheduled')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)', fontSize: 11, fontWeight: 'var(--weight-medium)', border: '1px solid rgba(88,86,214,.22)', cursor: 'pointer' }}
                      >
                        <Clock size={14} /> Schedule
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
