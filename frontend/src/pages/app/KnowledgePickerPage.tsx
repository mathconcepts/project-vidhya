/**
 * KnowledgePickerPage — students pick their school curriculum (board + class +
 * subject), then we show them the exams that knowledge track typically leads
 * to. The student picks one or more exams and the page registers them with
 * the knowledge_track_id attached so GBrain and the planner can personalise.
 *
 * Two phases on screen:
 *   1. Pick a track — board → grade → subject (3 cascading lists)
 *   2. Pick exam(s) from the suggested list, set exam_date, save profile
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { GraduationCap, BookOpen, Calendar, ChevronLeft, Check, Loader2, AlertCircle } from 'lucide-react';

interface SubjectTrack {
  id: string;
  subject: string;
  subject_name: string;
  display_name: string;
  suggested_exam_ids: string[];
  description: string;
}

interface GradeGroup {
  grade: string;
  grade_name: string;
  subjects: SubjectTrack[];
}

interface BoardGroup {
  board: string;
  board_name: string;
  grades: GradeGroup[];
}

interface SuggestedExam {
  exam_id: string;
  exam_name: string;
  topic_count: number;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-fill)',
  border: 'var(--hairline) solid var(--separator)',
  fontSize: 'var(--text-caption)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-mono)',
};

export default function KnowledgePickerPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBoard, setSelectedBoard] = useState<BoardGroup | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeGroup | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SubjectTrack | null>(null);

  const [suggestedExams, setSuggestedExams] = useState<SuggestedExam[]>([]);
  const [pickedExamIds, setPickedExamIds] = useState<Set<string>>(new Set());
  const [examDate, setExamDate] = useState<string>(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [prepIntent, setPrepIntent] = useState<'board-focused' | 'bridge' | 'entrance-focused'>('bridge');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch('/api/knowledge/tracks')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { boards: BoardGroup[] }) => setBoards(data.boards))
      .catch(() => setError('Could not load curricula'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTrack) return;
    authFetch(`/api/knowledge/tracks/${selectedTrack.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { suggested_exams: SuggestedExam[] }) => {
        setSuggestedExams(data.suggested_exams);
        setPickedExamIds(new Set(data.suggested_exams.map(e => e.exam_id)));
      })
      .catch(() => setError('Could not load suggested exams'));
  }, [selectedTrack]);

  const togglePickedExam = (exam_id: string) => {
    setPickedExamIds(prev => {
      const next = new Set(prev);
      if (next.has(exam_id)) next.delete(exam_id); else next.add(exam_id);
      return next;
    });
  };

  const goBack = () => {
    if (selectedTrack) { setSelectedTrack(null); setSuggestedExams([]); return; }
    if (selectedGrade) { setSelectedGrade(null); return; }
    if (selectedBoard) { setSelectedBoard(null); return; }
    navigate('/planned');
  };

  const saveProfile = async () => {
    if (!selectedTrack) return;
    if (pickedExamIds.size === 0) {
      setError('Pick at least one exam to prepare for');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const exams = [...pickedExamIds].map(exam_id => ({
        exam_id,
        exam_date: examDate,
        knowledge_track_id: selectedTrack.id,
        prep_intent: prepIntent,
        added_at: new Date().toISOString(),
      }));
      const res = await authFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed: ${res.status}`);
      }
      navigate('/planned');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--green-ink)' }} />
      </div>
    );
  }

  const cardButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: 16,
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-card)',
    border: 'var(--hairline) solid var(--separator)',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <div style={{ maxWidth: 608, margin: '0 auto', paddingBottom: 64 }}>
      <button
        onClick={goBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16 }}
      >
        <ChevronLeft size={14} />
        {selectedTrack ? 'Pick a different subject' :
          selectedGrade ? 'Pick a different grade' :
          selectedBoard ? 'Pick a different board' :
          'Back to planner'}
      </button>

      {/* Step 1 — Board */}
      {!selectedBoard && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <GraduationCap size={32} style={{ color: 'var(--green-ink)' }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>What's your school board?</h1>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>We'll match it to the right entrance exams</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {boards.map(b => (
              <button key={b.board} onClick={() => setSelectedBoard(b)} style={cardButtonStyle}>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>{b.board_name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {b.grades.length} grade{b.grades.length === 1 ? '' : 's'},{' '}
                  {b.grades.flatMap(g => g.subjects).length} subjects
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 2 — Grade */}
      {selectedBoard && !selectedGrade && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <BookOpen size={32} style={{ color: 'var(--green-ink)' }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Which grade are you in?</h1>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{selectedBoard.board_name}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {selectedBoard.grades.map(g => (
              <button key={g.grade} onClick={() => setSelectedGrade(g)} style={{ ...cardButtonStyle, textAlign: 'center' }}>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>{g.grade_name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{g.subjects.length} subjects</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 3 — Subject */}
      {selectedBoard && selectedGrade && !selectedTrack && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <BookOpen size={32} style={{ color: 'var(--green-ink)' }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Pick your subject</h1>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{selectedBoard.board_name} · {selectedGrade.grade_name}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedGrade.subjects.map(s => (
              <button key={s.id} onClick={() => setSelectedTrack(s)} style={cardButtonStyle}>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>{s.subject_name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{s.description}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 4 — Suggested exams */}
      {selectedTrack && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Calendar size={32} style={{ color: 'var(--green-ink)' }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Pick the exams you're preparing for</h1>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{selectedTrack.display_name}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestedExams.map(e => {
              const picked = pickedExamIds.has(e.exam_id);
              return (
                <button
                  key={e.exam_id}
                  onClick={() => togglePickedExam(e.exam_id)}
                  style={{
                    width: '100%',
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    border: picked ? '1px solid rgba(52,199,89,.3)' : 'var(--hairline) solid var(--separator)',
                    background: picked ? 'rgba(52,199,89,.06)' : 'var(--surface-card)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 20, height: 20,
                    borderRadius: 4,
                    border: picked ? 'none' : '1px solid var(--separator)',
                    background: picked ? 'var(--green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {picked && <Check size={12} style={{ color: 'var(--text-on-accent)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{e.exam_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{e.topic_count} topics</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>What's your goal?</label>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-tertiary)' }}>
              Shapes how content is written for you. You can switch any time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { v: 'board-focused' as const, t: 'Board exam first', d: 'School board exam is the priority. No entrance-exam references unless I ask.' },
                { v: 'bridge'         as const, t: 'Both — bridge me', d: "I'm preparing for both. Show me how each board concept extends to the entrance exam." },
                { v: 'entrance-focused' as const, t: 'Entrance exam first', d: 'I have school down. Push me straight to entrance-exam depth and tricks.' },
              ].map(opt => (
                <label key={opt.v} style={{
                  display: 'block',
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  border: prepIntent === opt.v ? '2px solid rgba(88,86,214,.3)' : '2px solid var(--separator)',
                  background: prepIntent === opt.v ? 'rgba(88,86,214,.05)' : 'var(--surface-card)',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name="prep-intent"
                      checked={prepIntent === opt.v}
                      onChange={() => setPrepIntent(opt.v)}
                      style={{ accentColor: 'var(--indigo)' }}
                    />
                    <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{opt.t}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, marginLeft: 24 }}>{opt.d}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>Exam date</label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={saving || pickedExamIds.size === 0}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: pickedExamIds.size > 0 && !saving ? 'var(--green)' : 'var(--surface-fill)',
              color: pickedExamIds.size > 0 && !saving ? '#fff' : 'var(--text-tertiary)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-body)',
              cursor: pickedExamIds.size === 0 || saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {saving
              ? <Loader2 size={16} className="animate-spin" />
              : `Save ${pickedExamIds.size} exam${pickedExamIds.size === 1 ? '' : 's'} & continue`}
          </button>
        </motion.div>
      )}
    </div>
  );
}
