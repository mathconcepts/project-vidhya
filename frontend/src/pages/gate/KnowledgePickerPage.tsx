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
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { GraduationCap, BookOpen, Calendar, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

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

export default function KnowledgePickerPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state — cascades board → grade → subject
  const [selectedBoard, setSelectedBoard] = useState<BoardGroup | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeGroup | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SubjectTrack | null>(null);

  // Phase 2 — after a track is picked, fetch suggested exams
  const [suggestedExams, setSuggestedExams] = useState<SuggestedExam[]>([]);
  const [pickedExamIds, setPickedExamIds] = useState<Set<string>>(new Set());
  const [examDate, setExamDate] = useState<string>(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);

  // Load all knowledge tracks on mount
  useEffect(() => {
    authFetch('/api/knowledge/tracks')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { boards: BoardGroup[] }) => setBoards(data.boards))
      .catch(() => setError('Could not load curricula'))
      .finally(() => setLoading(false));
  }, []);

  // When a track is selected, fetch its suggested exams
  useEffect(() => {
    if (!selectedTrack) return;
    authFetch(`/api/knowledge/tracks/${selectedTrack.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { suggested_exams: SuggestedExam[] }) => {
        setSuggestedExams(data.suggested_exams);
        // Pre-select all by default — students rarely want fewer
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
      // Each picked exam becomes one ExamRegistration carrying the track id.
      const exams = [...pickedExamIds].map(exam_id => ({
        exam_id,
        exam_date: examDate,
        knowledge_track_id: selectedTrack.id,
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
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {selectedTrack ? 'Pick a different subject' :
          selectedGrade ? 'Pick a different grade' :
          selectedBoard ? 'Pick a different board' :
          'Back to planner'}
      </button>

      {/* Step 1 — Board */}
      {!selectedBoard && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="text-center space-y-1">
            <GraduationCap className="w-8 h-8 mx-auto text-emerald-400" />
            <h1 className="text-xl font-bold text-zinc-100">What's your school board?</h1>
            <p className="text-sm text-zinc-500">We'll match it to the right entrance exams</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {boards.map(b => (
              <button
                key={b.board}
                onClick={() => setSelectedBoard(b)}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors text-left"
              >
                <div className="font-semibold text-zinc-100">{b.board_name}</div>
                <div className="text-xs text-zinc-500 mt-1">
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
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="text-center space-y-1">
            <BookOpen className="w-8 h-8 mx-auto text-emerald-400" />
            <h1 className="text-xl font-bold text-zinc-100">Which grade are you in?</h1>
            <p className="text-sm text-zinc-500">{selectedBoard.board_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {selectedBoard.grades.map(g => (
              <button
                key={g.grade}
                onClick={() => setSelectedGrade(g)}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors text-center"
              >
                <div className="font-semibold text-zinc-100">{g.grade_name}</div>
                <div className="text-xs text-zinc-500 mt-1">{g.subjects.length} subjects</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 3 — Subject */}
      {selectedBoard && selectedGrade && !selectedTrack && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="text-center space-y-1">
            <BookOpen className="w-8 h-8 mx-auto text-emerald-400" />
            <h1 className="text-xl font-bold text-zinc-100">Pick your subject</h1>
            <p className="text-sm text-zinc-500">{selectedBoard.board_name} · {selectedGrade.grade_name}</p>
          </div>
          <div className="space-y-2">
            {selectedGrade.subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedTrack(s)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors text-left"
              >
                <div className="font-semibold text-zinc-100">{s.subject_name}</div>
                <div className="text-xs text-zinc-500 mt-1">{s.description}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 4 — Suggested exams */}
      {selectedTrack && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="text-center space-y-1">
            <Calendar className="w-8 h-8 mx-auto text-emerald-400" />
            <h1 className="text-xl font-bold text-zinc-100">Pick the exams you're preparing for</h1>
            <p className="text-sm text-zinc-500">{selectedTrack.display_name}</p>
          </div>
          <div className="space-y-2">
            {suggestedExams.map(e => {
              const picked = pickedExamIds.has(e.exam_id);
              return (
                <button
                  key={e.exam_id}
                  onClick={() => togglePickedExam(e.exam_id)}
                  className={clsx(
                    'w-full p-4 rounded-xl border transition-colors text-left flex items-center gap-3',
                    picked
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/30',
                  )}
                >
                  <div className={clsx(
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                    picked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700',
                  )}>
                    {picked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-zinc-100">{e.exam_name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{e.topic_count} topics</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">Exam date</label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>
          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}
          <button
            onClick={saveProfile}
            disabled={saving || pickedExamIds.size === 0}
            className={clsx(
              'w-full py-3 rounded-xl font-semibold text-white transition-all',
              pickedExamIds.size > 0 && !saving
                ? 'bg-gradient-to-r from-emerald-500 to-sky-500'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
              `Save ${pickedExamIds.size} exam${pickedExamIds.size === 1 ? '' : 's'} & continue`}
          </button>
        </motion.div>
      )}
    </div>
  );
}
