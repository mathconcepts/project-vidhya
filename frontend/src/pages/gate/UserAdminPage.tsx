import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Crown, Shield, GraduationCap, UserCircle, Heart, Building2,
  Search, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch, type Role } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

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
  owner:       { icon: Crown,         color: 'text-amber-400',   label: 'Owner' },
  admin:       { icon: Shield,        color: 'text-sky-400',     label: 'Admin' },
  teacher:     { icon: GraduationCap, color: 'text-emerald-400', label: 'Teacher' },
  student:     { icon: UserCircle,    color: 'text-surface-400', label: 'Student' },
  parent:      { icon: Heart,         color: 'text-rose-400',    label: 'Parent' },
  institution: { icon: Building2,     color: 'text-violet-400',  label: 'Institution' },
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
      <div className="max-w-md mx-auto p-6 text-center space-y-2">
        <AlertCircle size={24} className="text-amber-400 mx-auto" />
        <p className="text-sm text-surface-300">Admin role required to view this page.</p>
        <p className="text-xs text-surface-500">
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
    <motion.div className="space-y-5 max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <Users size={20} className="text-sky-400" />
            User Management
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            {counts.total || 0} users — {counts.owner || 0} owner · {counts.admin || 0} admin · {counts.teacher || 0} teacher · {counts.student || 0} student
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeInUp} className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-sky-500/50"
        />
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
          {error}
        </motion.div>
      )}

      {/* User cards */}
      {loading && !users ? (
        <div className="text-center py-8 text-surface-500 text-sm">
          <Loader2 size={14} className="inline animate-spin mr-2" />
          Loading users...
        </div>
      ) : (
        <motion.div variants={fadeInUp} className="space-y-2">
          {filtered.map(u => {
            const RoleIcon = ROLE_META[u.role].icon;
            const isMe = u.id === currentUser?.id;
            const canChangeRole = !isMe && (
              currentUser?.role === 'owner' ||
              (currentUser?.role === 'admin' && u.role !== 'owner' && u.role !== 'admin')
            );
            const teacherName = u.taught_by ? (users?.find(x => x.id === u.taught_by)?.name || u.taught_by) : null;

            return (
              <div key={u.id} className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-2">
                {/* Top row: avatar, name, role */}
                <div className="flex items-center gap-3">
                  {u.picture ? (
                    <img src={u.picture} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center">
                      <UserCircle size={18} className="text-surface-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-100 truncate">
                      {u.name} {isMe && <span className="text-[10px] text-sky-400">(you)</span>}
                    </p>
                    <p className="text-[11px] text-surface-500 truncate">{u.email}</p>
                  </div>
                  <div className={clsx('inline-flex items-center gap-1 text-xs', ROLE_META[u.role].color)}>
                    <RoleIcon size={12} />
                    {ROLE_META[u.role].label}
                  </div>
                </div>

                {/* Details row */}
                <div className="flex items-center gap-3 text-[10px] text-surface-500">
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
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {canChangeRole && (
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value as Role)}
                      disabled={busyId === u.id}
                      className="px-2 py-1 rounded-lg bg-surface-950 border border-surface-800 text-[11px] text-surface-200"
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
                      className="px-2 py-1 rounded-lg bg-surface-950 border border-surface-800 text-[11px] text-surface-200"
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
            <div className="text-center py-8 text-xs text-surface-500">
              {search ? 'No users match your search.' : 'No users yet — first sign-in will create the owner.'}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
