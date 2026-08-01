import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Crown, Shield, GraduationCap, UserCircle, Heart, Building2,
  Search, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch, type Role } from '@/lib/auth/client';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: Role;
  teacher_of: string[];
  taught_by: string | null;
  channels: string[];
  created_at: string;
  last_seen_at: string;
}

const ROLE_META: Record<Role, { icon: typeof Crown; color: string; label: string }> = {
  owner:       { icon: Crown,         color: 'var(--orange)',     label: 'Owner' },
  admin:       { icon: Shield,        color: 'var(--indigo-ink)', label: 'Admin' },
  teacher:     { icon: GraduationCap, color: 'var(--green-ink)',  label: 'Teacher' },
  student:     { icon: UserCircle,    color: 'var(--text-tertiary)', label: 'Student' },
  parent:      { icon: Heart,         color: 'var(--red)',        label: 'Parent' },
  institution: { icon: Building2,     color: 'var(--indigo-ink)', label: 'Institution' },
};

export default function UserAdminPage() {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/admin/users');
      if (r.status === 403) { setError('Admin role required to view this page.'); setUsers(null); return; }
      if (!r.ok) { setError(`Failed to load users: HTTP ${r.status}`); setUsers(null); return; }
      const d = await r.json();
      setUsers(d.users || []);
      setCounts(d.counts || {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (hasRole('admin')) refresh(); else setLoading(false); }, [hasRole, refresh]);

  const changeRole = async (userId: string, newRole: Role) => {
    if (!confirm(`Change role to ${newRole}?`)) return;
    setBusyId(userId);
    try {
      const r = await authFetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_role: newRole }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || 'Failed'); return; }
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const assignTeacher = async (studentId: string, teacherId: string | null) => {
    setBusyId(studentId);
    try {
      const r = await authFetch(`/api/admin/users/${studentId}/teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || 'Failed'); return; }
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (!hasRole('admin')) {
    return (
      <div style={{ maxWidth: 448, margin: '0 auto', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <AlertCircle size={24} style={{ color: 'var(--orange)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>Admin role required to view this page.</p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
          Your current role: {currentUser?.role || 'not signed in'}
        </p>
      </div>
    );
  }

  const filtered = (users || []).filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  const teachers = (users || []).filter(u => u.role === 'teacher');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 896, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: 'var(--indigo-ink)' }} />
            User Management
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            {counts.total || 0} users — {counts.owner || 0} owner · {counts.admin || 0} admin · {counts.teacher || 0} teacher · {counts.student || 0} student
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email"
          style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-caption)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 11, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* User cards */}
      {loading && !users ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>
          <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: 8 }} />
          Loading users...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(u => {
            const RoleIcon = ROLE_META[u.role].icon;
            const isMe = u.id === currentUser?.id;
            const canChangeRole = !isMe && (
              currentUser?.role === 'owner' ||
              (currentUser?.role === 'admin' && u.role !== 'owner' && u.role !== 'admin')
            );
            const teacherName = u.taught_by ? (users?.find(x => x.id === u.taught_by)?.name || u.taught_by) : null;

            return (
              <div key={u.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Top row: avatar, name, role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {u.picture ? (
                    <img src={u.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCircle size={18} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name} {isMe && <span style={{ fontSize: 10, color: 'var(--indigo-ink)' }}>(you)</span>}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: ROLE_META[u.role].color }}>
                    <RoleIcon size={12} />
                    {ROLE_META[u.role].label}
                  </div>
                </div>

                {/* Details row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {u.role === 'teacher' && (
                    <span>{u.teacher_of.length} students</span>
                  )}
                  {u.role === 'student' && teacherName && (
                    <span>taught by {teacherName}</span>
                  )}
                  {u.channels.length > 1 && (
                    <span>{u.channels.length} channels</span>
                  )}
                  <span>last seen {u.last_seen_at.slice(0, 10)}</span>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {canChangeRole && (
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value as Role)}
                      disabled={busyId === u.id}
                      style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 11, color: 'var(--text-primary)' }}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      {currentUser?.role === 'owner' && <option value="admin">Admin</option>}
                    </select>
                  )}
                  {u.role === 'student' && (
                    <select
                      value={u.taught_by || ''}
                      onChange={e => assignTeacher(u.id, e.target.value || null)}
                      disabled={busyId === u.id}
                      style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 11, color: 'var(--text-primary)' }}
                    >
                      <option value="">No teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
              {search ? 'No users match your search.' : 'No users yet — first sign-in will create the owner.'}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
