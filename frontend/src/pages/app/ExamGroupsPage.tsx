import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Layers, Plus, CheckCircle, Loader2, RefreshCw, ChevronRight, X,
  AlertCircle, Gift, Archive as ArchiveIcon, Hash, XCircle, Eye,
  Trash2, ListPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';

interface GroupSummary {
  id: string;
  code: string;
  name: string;
  description?: string;
  tagline?: string;
  member_count: number;
  is_approved: boolean;
  is_archived: boolean;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

interface GroupDetail extends GroupSummary {
  exam_ids: string[];
  static_exam_ids?: string[];
  benefits?: string[];
}

interface MemberEntry {
  id: string;
  code?: string;
  name: string;
  completeness?: number;
  is_draft?: boolean;
  authority?: string;
  topics_count?: number;
}

interface AvailableExam {
  id: string;
  code: string;
  name: string;
  completeness: number;
  is_draft: boolean;
}

export default function ExamGroupsPage() {
  const { hasRole } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/exam-groups');
      if (r.status === 403) { setError('Admin role required.'); return; }
      if (!r.ok) { setError(`HTTP ${r.status}`); return; }
      const data = await r.json();
      setGroups(data.groups || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (hasRole('admin')) refresh(); else setLoading(false); }, [hasRole, refresh]);

  if (!hasRole('admin')) {
    return (
      <div style={{ maxWidth: 448, margin: '0 auto', padding: '1.5rem', textAlign: 'center' }}>
        <AlertCircle size={24} style={{ color: 'var(--orange)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Admin role required.</p>
      </div>
    );
  }

  if (selectedId) {
    return (
      <GroupDetailView
        groupId={selectedId}
        onBack={() => { setSelectedId(null); refresh(); }}
      />
    );
  }

  return (
    <motion.div
      style={{ maxWidth: 896, margin: '0 auto' }}
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }} className="flex items-center gap-2">
            <Layers size={20} style={{ color: 'var(--indigo-ink)' }} />
            Exam Groups
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
            Master list of bundled exams. Approved groups trigger the student giveaway banner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: 'var(--indigo)', color: 'var(--text-on-fill)', height: 36, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={13} />
            New group
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            style={{ padding: 8, borderRadius: 8, background: 'var(--surface-card)', border: '1px solid var(--separator)', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 12, borderRadius: 12, background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
      >
        <Gift size={13} className="shrink-0" style={{ marginTop: 2, color: 'var(--indigo-ink)' }} />
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 500, color: 'var(--indigo-ink)' }}>How groups work.</span>{' '}
          A group bundles related exams. When a student is assigned to any exam in an approved group, they see a "giveaway" banner listing the other exams included — positioning the bundle as one subscription, multiple exams. Drafts are admin-only; approval gates student visibility.
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 12, borderRadius: 12, background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 12, color: 'var(--red)' }}
        >
          {error}
        </motion.div>
      )}

      {loading && groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
          <Loader2 size={14} className="inline animate-spin" style={{ marginRight: 8 }} />Loading...
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 32, borderRadius: 12, background: 'var(--surface-card)', border: '1px solid var(--separator)', textAlign: 'center' }}
        >
          <Layers size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>No exam groups yet.</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 320, margin: '0 auto 16px' }}>
            Create a group to bundle related exams. Approved groups trigger the giveaway banner for students.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: 'var(--indigo)', color: 'var(--text-on-fill)', height: 36, padding: '0 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={13} />
            Create first group
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              style={{ width: '100%', padding: 12, borderRadius: 12, background: 'var(--surface-card)', border: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  <p className="truncate" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{g.name}</p>
                  {g.is_approved ? (
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle size={8} />
                      Approved
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)', color: 'var(--orange)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Draft
                    </span>
                  )}
                </div>
                {g.tagline && <p style={{ fontSize: 11, color: 'var(--indigo-ink)' }}>{g.tagline}</p>}
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  <code style={{ color: 'var(--indigo-ink)' }}>{g.code}</code>
                  {' · '}{g.member_count} exam{g.member_count !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={14} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          ))}
        </motion.div>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); refresh(); setSelectedId(id); }}
        />
      )}
    </motion.div>
  );
}

// ============================================================================
// Detail view
// ============================================================================

function GroupDetailView({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<{ dynamic: MemberEntry[]; static: MemberEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`/api/exam-groups/${groupId}`);
      if (r.ok) {
        const data = await r.json();
        setGroup(data.group);
        setMembers(data.members);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = async () => {
    setWorking(true);
    try {
      const r = await authFetch(`/api/exam-groups/${groupId}/approve`, { method: 'POST' });
      if (!r.ok) {
        const t = await r.text();
        alert(`Cannot approve: ${t}`);
      }
      refresh();
    } finally { setWorking(false); }
  };

  const unapprove = async () => {
    if (!confirm('Unapprove this group? Students will stop seeing the giveaway banner.')) return;
    setWorking(true);
    try {
      await authFetch(`/api/exam-groups/${groupId}/unapprove`, { method: 'POST' });
      refresh();
    } finally { setWorking(false); }
  };

  const archive = async () => {
    if (!confirm('Archive this group?')) return;
    setWorking(true);
    try {
      await authFetch(`/api/exam-groups/${groupId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
      onBack();
    } finally { setWorking(false); }
  };

  const removeMember = async (eid: string) => {
    setWorking(true);
    try {
      await authFetch(`/api/exam-groups/${groupId}/members/${encodeURIComponent(eid)}`, { method: 'DELETE' });
      refresh();
    } finally { setWorking(false); }
  };

  if (loading && !group) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
        <Loader2 size={14} className="inline animate-spin" style={{ marginRight: 8 }} />Loading...
      </div>
    );
  }
  if (!group) {
    return <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 14, color: 'var(--text-tertiary)' }}>Group not found.</div>;
  }

  const totalMembers = (members?.dynamic.length || 0) + (members?.static.length || 0);

  return (
    <motion.div
      style={{ maxWidth: 896, margin: '0 auto' }}
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={onBack} style={{ fontSize: 11, color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 4 }}>
          ← All groups
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Layers size={18} className="shrink-0" style={{ color: 'var(--indigo-ink)' }} />
              {group.name}
              {group.is_approved ? (
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle size={8} />Approved
                </span>
              ) : (
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)', color: 'var(--orange)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Draft
                </span>
              )}
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Hash size={10} />{group.id}
            </p>
            {group.tagline && <p style={{ fontSize: 12, color: 'var(--indigo-ink)', marginTop: 4 }}>{group.tagline}</p>}
          </div>
        </div>
      </motion.div>

      {/* Admin actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
        {!group.is_approved ? (
          <button
            onClick={approve}
            disabled={working || totalMembers < 2}
            title={totalMembers < 2 ? 'Need at least 2 exams to approve' : ''}
            style={{ background: 'var(--green)', color: 'var(--text-on-fill)', height: 36, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: (working || totalMembers < 2) ? 0.5 : 1 }}
          >
            {working ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            Approve for students
          </button>
        ) : (
          <button
            onClick={unapprove}
            disabled={working}
            style={{ background: 'var(--orange)', color: 'var(--text-on-fill)', height: 36, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: working ? 0.5 : 1 }}
          >
            <XCircle size={12} />
            Unapprove
          </button>
        )}
        <button
          onClick={() => setShowAddMember(true)}
          style={{ background: 'var(--indigo)', color: 'var(--text-on-fill)', height: 36, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ListPlus size={12} />
          Add exam
        </button>
        <button
          onClick={archive}
          style={{ height: 36, padding: '0 12px', borderRadius: 8, background: 'var(--surface-card)', border: '1px solid var(--separator)', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArchiveIcon size={12} />
          Archive
        </button>
      </motion.div>

      {totalMembers < 2 && !group.is_approved && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 12, borderRadius: 12, background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
        >
          <AlertCircle size={13} className="shrink-0" style={{ marginTop: 2, color: 'var(--orange)' }} />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 500, color: 'var(--orange)' }}>Add at least 2 exams to approve.</span>{' '}
            A group of one exam doesn't make sense as a giveaway.
          </div>
        </motion.div>
      )}

      {group.description && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 12, borderRadius: 12, background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
        >
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 4 }}>Description</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{group.description}</p>
        </motion.div>
      )}

      {group.benefits && group.benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 12, borderRadius: 12, background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
        >
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 4 }}>Benefits (shown on giveaway banner)</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {group.benefits.map((b, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>• {b}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Members */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 16, borderRadius: 12, background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
        className="space-y-3"
      >
        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={10} />
          Member exams ({totalMembers})
        </p>
        {totalMembers === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No exams added yet.</p>
        ) : (
          <div className="space-y-1.5">
            {members?.dynamic.map(e => (
              <MemberRow key={e.id} entry={e} isStatic={false} onRemove={() => removeMember(e.id)} working={working} />
            ))}
            {members?.static.map(e => (
              <MemberRow key={e.id} entry={e} isStatic={true} onRemove={() => removeMember(e.id)} working={working} />
            ))}
          </div>
        )}
      </motion.div>

      {showAddMember && (
        <AddMemberModal
          groupId={groupId}
          existingIds={[...(group.exam_ids || []), ...(group.static_exam_ids || [])]}
          onClose={() => setShowAddMember(false)}
          onAdded={() => { setShowAddMember(false); refresh(); }}
        />
      )}
    </motion.div>
  );
}

function MemberRow({ entry, isStatic, onRemove, working }: {
  entry: MemberEntry; isStatic: boolean; onRemove: () => void; working: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, background: 'var(--surface-fill)', border: '1px solid var(--separator)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{entry.name}</p>
          <span style={{
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 500,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            ...(isStatic
              ? { background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)', color: 'var(--indigo-ink)' }
              : { background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)' }),
          }}>
            {isStatic ? 'static' : 'dynamic'}
          </span>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: 2 }}>{entry.id}</p>
        {typeof entry.completeness === 'number' && (
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {Math.round(entry.completeness * 100)}% complete
            {entry.is_draft && ' · draft'}
          </p>
        )}
        {isStatic && entry.authority && (
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{entry.authority}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        disabled={working}
        style={{ padding: 6, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', opacity: working ? 0.5 : 1 }}
        aria-label="remove"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ============================================================================

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!code.trim() || !name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const r = await authFetch('/api/exam-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          tagline: tagline.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        setError(`Failed: ${r.status} ${t}`);
        return;
      }
      const data = await r.json();
      onCreated(data.group.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    marginTop: 4,
    padding: '0 12px',
    borderRadius: 8,
    background: 'var(--surface-fill)',
    border: '1px solid var(--separator)',
    fontSize: 14,
    color: 'var(--text-secondary)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface-fill)', border: '1px solid var(--separator)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 448, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ position: 'sticky', top: 0, background: 'var(--surface-fill)', borderBottom: '1px solid var(--separator)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>New exam group</p>
          <button onClick={onClose} style={{ padding: 4, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={14} /></button>
        </div>
        <div style={{ padding: 16 }} className="space-y-3">
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Create the group as a draft first. Add member exams on the next screen. Approve when ready — only approved groups are visible to students.
          </p>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Short code *</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. ENG-ENTRANCE-2027"
              style={{ ...inputStyle, fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Display name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering Entrance Exams 2027"
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tagline (shown on student banner)</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. One subscription, 4 exams"
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="What makes these exams belong together."
              style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'none' }} />
          </div>
          {error && (
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 11, color: 'var(--red)' }}>
              {error}
            </div>
          )}
          <button
            onClick={submit}
            disabled={!code.trim() || !name.trim() || creating}
            style={{ width: '100%', height: 40, borderRadius: 8, background: 'var(--indigo)', color: 'var(--text-on-fill)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!code.trim() || !name.trim() || creating) ? 0.5 : 1 }}
          >
            {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Create draft group
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================

function AddMemberModal({ groupId, existingIds, onClose, onAdded }: {
  groupId: string; existingIds: string[]; onClose: () => void; onAdded: () => void;
}) {
  const [available, setAvailable] = useState<AvailableExam[]>([]);
  const [query, setQuery] = useState('');
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/api/exams');
        if (r.ok) {
          const data = await r.json();
          setAvailable(data.exams || []);
        }
      } catch {}
    })();
  }, []);

  const add = async (examId: string, isStatic: boolean) => {
    setWorking(examId);
    try {
      await authFetch(`/api/exam-groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: examId, is_static: isStatic }),
      });
      onAdded();
    } finally {
      setWorking(null);
    }
  };

  const filtered = available.filter(e =>
    !existingIds.includes(e.id) &&
    (e.name.toLowerCase().includes(query.toLowerCase()) || e.code.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface-fill)', border: '1px solid var(--separator)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 448, maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div style={{ position: 'sticky', top: 0, background: 'var(--surface-fill)', borderBottom: '1px solid var(--separator)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Add exam to group</p>
          <button onClick={onClose} style={{ padding: 4, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={14} /></button>
        </div>
        <div style={{ padding: 16 }} className="space-y-3">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exams..."
            style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, background: 'var(--surface-fill)', border: '1px solid var(--separator)', fontSize: 14, color: 'var(--text-secondary)', outline: 'none', boxSizing: 'border-box' }} />
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
                {available.length === 0 ? 'No exams in registry yet.' : 'No exams match your search or all are already in this group.'}
              </p>
            ) : filtered.map(e => (
              <button key={e.id} onClick={() => add(e.id, false)} disabled={working !== null}
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--surface-card)', border: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{e.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{e.code}</p>
                </div>
                {working === e.id
                  ? <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                  : <Plus size={12} style={{ color: 'var(--text-tertiary)' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
