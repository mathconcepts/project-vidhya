import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Plus, CheckCircle, Loader2, RefreshCw, ChevronRight, X,
  AlertCircle, Gift, Archive as ArchiveIcon, Hash, XCircle, Eye,
  Trash2, ListPlus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

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
      <div className="max-w-md mx-auto p-6 text-center space-y-2">
        <AlertCircle size={24} className="text-amber-400 mx-auto" />
        <p className="text-sm text-surface-300">Admin role required.</p>
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
    <motion.div className="space-y-4 max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div variants={fadeInUp} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <Layers size={20} className="text-violet-400" />
            Exam Groups
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Master list of bundled exams. Approved groups trigger the student giveaway banner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 h-9 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus size={13} />
            New group
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 flex items-start gap-2.5">
        <Gift size={13} className="shrink-0 mt-0.5 text-violet-400" />
        <div className="text-[11px] text-violet-200/80 leading-relaxed">
          <span className="font-medium text-violet-300">How groups work.</span>{' '}
          A group bundles related exams. When a student is assigned to any exam in an approved group, they see a "giveaway" banner listing the other exams included — positioning the bundle as one subscription, multiple exams. Drafts are admin-only; approval gates student visibility.
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
          {error}
        </motion.div>
      )}

      {loading && groups.length === 0 ? (
        <div className="text-center py-12 text-surface-500 text-sm">
          <Loader2 size={14} className="inline animate-spin mr-2" />Loading...
        </div>
      ) : groups.length === 0 ? (
        <motion.div variants={fadeInUp} className="p-8 rounded-xl bg-surface-900 border border-surface-800 text-center space-y-3">
          <Layers size={28} className="text-surface-600 mx-auto" />
          <p className="text-sm text-surface-300">No exam groups yet.</p>
          <p className="text-xs text-surface-500 max-w-sm mx-auto">
            Create a group to bundle related exams. Approved groups trigger the giveaway banner for students.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 h-9 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus size={13} />
            Create first group
          </button>
        </motion.div>
      ) : (
        <motion.div variants={fadeInUp} className="space-y-2">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className="w-full p-3 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-700 flex items-center gap-3 text-left transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-surface-200 truncate">{g.name}</p>
                  {g.is_approved ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium uppercase tracking-wide inline-flex items-center gap-1">
                      <CheckCircle size={8} />
                      Approved
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium uppercase tracking-wide">
                      Draft
                    </span>
                  )}
                </div>
                {g.tagline && <p className="text-[11px] text-violet-300/80">{g.tagline}</p>}
                <p className="text-[10px] text-surface-500 mt-0.5">
                  <code className="text-violet-400">{g.code}</code>
                  {' · '}{g.member_count} exam{g.member_count !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={14} className="text-surface-600 group-hover:text-surface-400 shrink-0" />
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
    return <div className="text-center py-12 text-surface-500 text-sm"><Loader2 size={14} className="inline animate-spin mr-2" />Loading...</div>;
  }
  if (!group) {
    return <div className="text-center py-12 text-sm text-surface-500">Group not found.</div>;
  }

  const totalMembers = (members?.dynamic.length || 0) + (members?.static.length || 0);

  return (
    <motion.div className="space-y-4 max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div variants={fadeInUp}>
        <button onClick={onBack} className="text-[11px] text-violet-400 hover:text-violet-300 mb-1">
          ← All groups
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-surface-100 flex items-center gap-2 flex-wrap">
              <Layers size={18} className="text-violet-400 shrink-0" />
              {group.name}
              {group.is_approved ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium uppercase tracking-wide inline-flex items-center gap-1">
                  <CheckCircle size={8} />Approved
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium uppercase tracking-wide">
                  Draft
                </span>
              )}
            </h1>
            <p className="text-[11px] text-surface-500 mt-0.5 font-mono flex items-center gap-1.5">
              <Hash size={10} />{group.id}
            </p>
            {group.tagline && <p className="text-xs text-violet-300/80 mt-1">{group.tagline}</p>}
          </div>
        </div>
      </motion.div>

      {/* Admin actions */}
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-2">
        {!group.is_approved ? (
          <button
            onClick={approve}
            disabled={working || totalMembers < 2}
            className="px-3 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
            title={totalMembers < 2 ? 'Need at least 2 exams to approve' : ''}
          >
            {working ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            Approve for students
          </button>
        ) : (
          <button
            onClick={unapprove}
            disabled={working}
            className="px-3 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <XCircle size={12} />
            Unapprove
          </button>
        )}
        <button
          onClick={() => setShowAddMember(true)}
          className="px-3 h-9 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-medium inline-flex items-center gap-1.5"
        >
          <ListPlus size={12} />
          Add exam
        </button>
        <button
          onClick={archive}
          className="px-3 h-9 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200 text-xs inline-flex items-center gap-1.5"
        >
          <ArchiveIcon size={12} />
          Archive
        </button>
      </motion.div>

      {totalMembers < 2 && !group.is_approved && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="text-[11px] text-amber-200/80 leading-relaxed">
            <span className="font-medium text-amber-300">Add at least 2 exams to approve.</span>{' '}
            A group of one exam doesn't make sense as a giveaway.
          </div>
        </motion.div>
      )}

      {group.description && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-surface-900 border border-surface-800">
          <p className="text-[10px] text-surface-500 uppercase tracking-wide font-medium mb-1">Description</p>
          <p className="text-xs text-surface-300 leading-relaxed">{group.description}</p>
        </motion.div>
      )}

      {group.benefits && group.benefits.length > 0 && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-surface-900 border border-surface-800">
          <p className="text-[10px] text-surface-500 uppercase tracking-wide font-medium mb-1">Benefits (shown on giveaway banner)</p>
          <ul className="space-y-0.5">
            {group.benefits.map((b, i) => (
              <li key={i} className="text-xs text-surface-300">• {b}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Members */}
      <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
        <p className="text-[10px] text-surface-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
          <Layers size={10} />
          Member exams ({totalMembers})
        </p>
        {totalMembers === 0 ? (
          <p className="text-xs text-surface-500">No exams added yet.</p>
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
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-950/60 border border-surface-800">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-surface-200 truncate">{entry.name}</p>
          <span className={clsx(
            'text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide',
            isStatic ? 'bg-violet-500/15 text-violet-300' : 'bg-emerald-500/15 text-emerald-300',
          )}>
            {isStatic ? 'static' : 'dynamic'}
          </span>
        </div>
        <p className="text-[10px] text-surface-500 font-mono mt-0.5">{entry.id}</p>
        {typeof entry.completeness === 'number' && (
          <p className="text-[10px] text-surface-500">
            {Math.round(entry.completeness * 100)}% complete
            {entry.is_draft && ' · draft'}
          </p>
        )}
        {isStatic && entry.authority && (
          <p className="text-[10px] text-surface-500">{entry.authority}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        disabled={working}
        className="p-1.5 rounded text-surface-500 hover:text-rose-400 disabled:opacity-50"
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface-950 border border-surface-800 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-950 border-b border-surface-800 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-surface-100">New exam group</p>
          <button onClick={onClose} className="p-1 rounded text-surface-500 hover:text-surface-200"><X size={14} /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-surface-500 leading-relaxed">
            Create the group as a draft first. Add member exams on the next screen. Approve when ready — only approved groups are visible to students.
          </p>
          <div>
            <label className="text-[11px] text-surface-400">Short code *</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. ENG-ENTRANCE-2027"
              className="w-full h-9 mt-1 px-3 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-200 focus:outline-none focus:border-violet-500/50 font-mono" />
          </div>
          <div>
            <label className="text-[11px] text-surface-400">Display name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering Entrance Exams 2027"
              className="w-full h-9 mt-1 px-3 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-200 focus:outline-none focus:border-violet-500/50" />
          </div>
          <div>
            <label className="text-[11px] text-surface-400">Tagline (shown on student banner)</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. One subscription, 4 exams"
              className="w-full h-9 mt-1 px-3 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-200 focus:outline-none focus:border-violet-500/50" />
          </div>
          <div>
            <label className="text-[11px] text-surface-400">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="What makes these exams belong together."
              className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-200 focus:outline-none focus:border-violet-500/50 resize-none" />
          </div>
          {error && <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-300">{error}</div>}
          <button onClick={submit} disabled={!code.trim() || !name.trim() || creating}
            className="w-full h-10 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface-950 border border-surface-800 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-950 border-b border-surface-800 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-surface-100">Add exam to group</p>
          <button onClick={onClose} className="p-1 rounded text-surface-500 hover:text-surface-200"><X size={14} /></button>
        </div>
        <div className="p-4 space-y-3">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exams..."
            className="w-full h-9 px-3 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-200 focus:outline-none focus:border-violet-500/50" />
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-surface-500 text-center py-6">
                {available.length === 0 ? 'No exams in registry yet.' : 'No exams match your search or all are already in this group.'}
              </p>
            ) : filtered.map(e => (
              <button key={e.id} onClick={() => add(e.id, false)} disabled={working !== null}
                className="w-full p-2.5 rounded-lg bg-surface-900 border border-surface-800 hover:border-surface-700 flex items-center gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 truncate">{e.name}</p>
                  <p className="text-[10px] text-surface-500 font-mono">{e.code}</p>
                </div>
                {working === e.id ? <Loader2 size={12} className="animate-spin text-surface-400" /> : <Plus size={12} className="text-surface-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
