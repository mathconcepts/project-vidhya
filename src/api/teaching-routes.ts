// @ts-nocheck
/**
 * Teaching Routes — endpoints that help teachers teach
 *
 * New in v2.9.3. Implements the teacher-as-end-user model from
 * docs/TEACHER-JOURNEY.md. All endpoints require `teacher` role or higher.
 *
 * Endpoints:
 *   GET  /api/teaching/next-class          — next-class recommendation
 *   GET  /api/teaching/brief/:concept_id   — full teaching brief
 *   POST /api/teaching/push-to-review      — add concept to students' queues
 *   POST /api/teaching/announcement        — post cohort announcement
 *   GET  /api/teaching/announcement        — student endpoint: read teacher's announcement
 *   GET  /api/student/my-teacher           — student endpoint: who is my teacher?
 *
 * Teaching briefs are composed from the existing content bundle + cohort
 * mastery data. No LLM calls at render time. No new content authoring.
 * Just a different view of existing data targeted at teacher workflow.
 */

import fs from 'fs';
import path from 'path';
import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireRole, requireAuth } from '../auth/middleware';
import {
  listUsers,
  getUserById,
  pushReviewToStudent,
  dismissPushedReview,
  listPushedReviews,
} from '../auth/user-store';
import { createFlatFileStore } from '../lib/flat-file-store';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import {
  summarizeCohort,
  modelToTeacherRosterEntry,
  prioritizeConceptsByMastery,
} from '../gbrain/integration';

// ============================================================================
// Announcement store — one active per teacher
// ============================================================================

interface AnnouncementRecord {
  text: string;
  posted_at: string;
}

interface AnnouncementStore {
  version: 1;
  by_teacher: Record<string, AnnouncementRecord>;
}

const announcementStore = createFlatFileStore<AnnouncementStore>({
  path: '.data/teaching-announcements.json',
  defaultShape: () => ({ version: 1, by_teacher: {} }),
});

// ============================================================================
// Bundle loader — reads explainers once (cached in module)
// ============================================================================

let _explainersCache: any = null;
function loadExplainers(): Record<string, any> {
  if (_explainersCache) return _explainersCache;
  try {
    const p = path.resolve(process.cwd(), 'frontend/public/data/explainers.json');
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
      _explainersCache = parsed.by_concept || {};
      return _explainersCache;
    }
  } catch (err) {
    console.error('[teaching] explainers load failed:', (err as Error).message);
  }
  _explainersCache = {};
  return _explainersCache;
}

let _pyqCache: any = null;
function loadPYQBank(): any[] {
  if (_pyqCache) return _pyqCache;
  try {
    const p = path.resolve(process.cwd(), 'frontend/public/data/pyq-bank.json');
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
      _pyqCache = Array.isArray(parsed) ? parsed : (parsed.problems || []);
      return _pyqCache;
    }
  } catch {}
  _pyqCache = [];
  return _pyqCache;
}

// ============================================================================
// Cohort helpers
// ============================================================================

async function loadCohortForTeacher(teacher_id: string) {
  const teacher = getUserById(teacher_id);
  if (!teacher) return { teacher: null, models: [], students: [] };
  const students = teacher.teacher_of
    .map(id => getUserById(id))
    .filter(Boolean);
  const models: any[] = [];
  for (const s of students) {
    try {
      const m = await getOrCreateStudentModel(s.id, s.id);
      models.push(m);
    } catch {
      models.push(null);
    }
  }
  return { teacher, models, students };
}

// ============================================================================
// P7: Weekly brief snapshot store
// ============================================================================
//
// Snapshots cohort mastery weekly so the brief can show week-over-week
// delta. Keyed by teacher_id + ISO week + sha256(sorted teacher_of[]) so
// a cohort change creates a fresh snapshot rather than miscomputing delta
// against a different roster.
//
// Persistence caveat: .data/ is ephemeral on Render free tier (resets on
// restart/sleep). Acceptable: a missed snapshot just means the first brief
// after deploy shows 0 delta. Operators on paid plans get persistent disk
// at /app/.data automatically.
// ============================================================================

import crypto from 'crypto';

interface BriefSnapshot {
  teacher_id: string;
  iso_week: string;
  cohort_fingerprint: string; // sha256 of sorted teacher_of[]
  cohort_avg_mastery: number; // 0..1
  recorded_at: string;
}

interface BriefSnapshotStore {
  version: 1;
  snapshots: BriefSnapshot[]; // capped append-only, drop oldest after 50
}

const briefSnapshotStore = createFlatFileStore<BriefSnapshotStore>({
  path: '.data/teacher-brief-snapshots.json',
  defaultShape: () => ({ version: 1, snapshots: [] }),
});

function isoWeekOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function cohortFingerprint(teacher_of: string[]): string {
  const sorted = [...teacher_of].sort();
  return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 16);
}

function avgMastery(models: any[]): number {
  let sum = 0;
  let count = 0;
  for (const m of models) {
    if (!m?.mastery_vector) continue;
    const entries = Object.values(m.mastery_vector) as Array<{ score?: number; attempts?: number }>;
    for (const e of entries) {
      if (typeof e.score === 'number' && (e.attempts ?? 0) > 0) {
        sum += e.score;
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

// ============================================================================
// Handler: weekly brief
// ============================================================================

async function handleWeeklyBrief(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;

  const teacher = getUserById(auth.user.id);
  if (!teacher || teacher.teacher_of.length === 0) {
    return sendJSON(res, {
      should_show: false,
      reason: 'no_cohort',
      message: 'No cohort yet — invite students to start seeing weekly insights.',
    });
  }

  // Pf1: parallel student-model fetch — cohort of 30 students completes
  // in ~50ms vs ~1.5s sequential.
  const studentResults = await Promise.all(
    teacher.teacher_of.map(async id => {
      const student = getUserById(id);
      if (!student) return null;
      try {
        const model = await getOrCreateStudentModel(student.id, student.id);
        return { student, model };
      } catch {
        return null;
      }
    })
  );

  const cohort = studentResults.filter((r): r is NonNullable<typeof r> => r !== null);
  const models = cohort.map(c => c.model);

  // Current week's avg mastery
  const currentMastery = avgMastery(models);

  // A2: snapshot key includes cohort fingerprint so roster changes don't
  // miscompute delta.
  const week = isoWeekOf(new Date());
  const fingerprint = cohortFingerprint(teacher.teacher_of);
  const lastWeek = isoWeekOf(new Date(Date.now() - 7 * 24 * 3600 * 1000));

  // Find prior snapshot — must match teacher AND fingerprint
  const store = briefSnapshotStore.read();
  const priorSnapshot = store.snapshots.find(
    s =>
      s.teacher_id === teacher.id &&
      s.iso_week === lastWeek &&
      s.cohort_fingerprint === fingerprint
  );
  const priorMastery = priorSnapshot?.cohort_avg_mastery ?? 0;
  const delta = currentMastery - priorMastery;
  const hasPrior = !!priorSnapshot;

  // Top performer: highest avg mastery
  const ranked = cohort
    .map(c => ({
      student: c.student,
      mastery: avgMastery([c.model]),
    }))
    .filter(r => r.mastery > 0)
    .sort((a, b) => b.mastery - a.mastery);
  const topPerformer = ranked[0]
    ? {
        id: ranked[0].student.id,
        name: ranked[0].student.name || ranked[0].student.email,
        mastery: ranked[0].mastery,
      }
    : null;

  // Struggling: students with avg mastery < 0.4 or recent inactivity
  const struggling = cohort
    .filter(c => {
      const m = avgMastery([c.model]);
      const recent = (c.model as any)?.recent_attempts ?? [];
      const lastAttempt = recent[recent.length - 1];
      const lastTs = lastAttempt?.timestamp ?? lastAttempt?.attempted_at;
      const daysSince = lastTs
        ? (Date.now() - Date.parse(lastTs)) / (24 * 3600 * 1000)
        : 999;
      return m < 0.4 || daysSince > 3;
    })
    .map(c => ({
      id: c.student.id,
      name: c.student.name || c.student.email,
      reason: avgMastery([c.model]) < 0.4 ? 'low_mastery' : 'inactive',
    }))
    .slice(0, 5);

  // Save current week's snapshot for next week's delta. Cap at 50.
  briefSnapshotStore.write(prev => {
    const next = [...prev.snapshots];
    const existingIdx = next.findIndex(
      s =>
        s.teacher_id === teacher.id &&
        s.iso_week === week &&
        s.cohort_fingerprint === fingerprint
    );
    const snap: BriefSnapshot = {
      teacher_id: teacher.id,
      iso_week: week,
      cohort_fingerprint: fingerprint,
      cohort_avg_mastery: currentMastery,
      recorded_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) next[existingIdx] = snap;
    else next.push(snap);
    return { ...prev, snapshots: next.slice(-50) };
  });

  // Compose the one-line opening
  const deltaPct = Math.round(delta * 100);
  const currentPct = Math.round(currentMastery * 100);
  let opening = `Cohort mastery: ${currentPct}% across ${cohort.length} student${cohort.length === 1 ? '' : 's'}.`;
  if (hasPrior && Math.abs(deltaPct) >= 1) {
    opening += deltaPct > 0
      ? ` Up ${deltaPct} point${deltaPct === 1 ? '' : 's'} from last week.`
      : ` Down ${Math.abs(deltaPct)} point${Math.abs(deltaPct) === 1 ? '' : 's'} from last week.`;
  }

  const oneAction = struggling.length > 0
    ? `Reach out to ${struggling[0].name} — ${struggling[0].reason === 'inactive' ? 'inactive 3+ days' : 'mastery below 40%'}.`
    : topPerformer
      ? `Highlight ${topPerformer.name}'s progress to the cohort. Strong work compounds when others see it.`
      : 'Keep the cadence steady. Compounding does the work.';

  return sendJSON(res, {
    should_show: true,
    opening,
    cohort_size: cohort.length,
    cohort_avg_mastery: currentMastery,
    cohort_delta_pct: hasPrior ? deltaPct : null,
    top_performer: topPerformer,
    struggling_students: struggling,
    one_action: oneAction,
    week,
  });
}

// ============================================================================
// Handler: next-class recommendation
// ============================================================================

async function handleNextClass(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;

  const { teacher, models, students } = await loadCohortForTeacher(auth.user.id);
  if (!teacher) return sendError(res, 404, 'teacher not found');

  if (students.length === 0) {
    return sendJSON(res, {
      cohort_size: 0,
      recommendation: null,
      message: "You don't have any students assigned yet. Ask your admin to assign students to you.",
    });
  }

  const summary = summarizeCohort(models);

  if (summary.struggling_concepts.length === 0) {
    return sendJSON(res, {
      cohort_size: students.length,
      recommendation: null,
      message: 'Your cohort is doing well — no concepts are currently struggling. Consider advancing to harder material.',
      cohort_avg_mastery: summary.avg_mastery,
    });
  }

  const top = summary.struggling_concepts[0];
  const explainers = loadExplainers();
  const explainer = explainers[top.concept_id];

  sendJSON(res, {
    cohort_size: students.length,
    cohort_avg_mastery: summary.avg_mastery,
    recommendation: {
      concept_id: top.concept_id,
      concept_label: explainer?.label || top.concept_id.replace(/-/g, ' '),
      topic: explainer?.topic,
      students_below_threshold: top.students_affected,
      cohort_avg_mastery: top.avg_mastery,
      reason: `${top.students_affected} of ${students.length} students are below 45% mastery on ${explainer?.label || top.concept_id}.`,
    },
    other_struggling: summary.struggling_concepts.slice(1, 5).map(c => ({
      concept_id: c.concept_id,
      concept_label: explainers[c.concept_id]?.label || c.concept_id.replace(/-/g, ' '),
      cohort_avg_mastery: c.avg_mastery,
      students_affected: c.students_affected,
    })),
    flagged_students: summary.flagged_for_teacher_attention,
  });
}

// ============================================================================
// Handler: teaching brief for a concept
// ============================================================================

async function handleBrief(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;

  const concept_id = req.params.concept_id;
  if (!concept_id) return sendError(res, 400, 'concept_id required');

  const explainers = loadExplainers();
  const explainer = explainers[concept_id];
  if (!explainer) return sendError(res, 404, 'concept not found in bundle');

  const { models, students } = await loadCohortForTeacher(auth.user.id);

  // Cohort-specific stats for this concept
  const masteryScores: number[] = [];
  let algebraicCount = 0, geometricCount = 0, numericalCount = 0;
  let representationSamples = 0;
  const errorCounts: Record<string, number> = {};

  for (const m of models) {
    if (!m) continue;
    const entry = m.mastery_vector?.[concept_id];
    if (entry) masteryScores.push(entry.score);
    if (m.representation_mode && m.representation_mode !== 'balanced') {
      representationSamples++;
      if (m.representation_mode === 'algebraic') algebraicCount++;
      else if (m.representation_mode === 'geometric') geometricCount++;
      else if (m.representation_mode === 'numerical') numericalCount++;
    }
    // Count error types from prerequisite alerts on this concept
    const alerts = (m.prerequisite_alerts || []).filter((a: any) => a.concept === concept_id);
    for (const alert of alerts) {
      const key = alert.severity || 'unknown';
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }
  }

  const cohortAvg = masteryScores.length > 0
    ? masteryScores.reduce((s, x) => s + x, 0) / masteryScores.length
    : null;

  // Difficulty filter based on cohort level
  const level: 'foundational' | 'standard' | 'advanced' =
    cohortAvg === null ? 'standard'
    : cohortAvg < 0.4 ? 'foundational'
    : cohortAvg < 0.7 ? 'standard'
    : 'advanced';

  // Find related problems from PYQ bank
  const pyqBank = loadPYQBank();
  const relatedProblems = pyqBank
    .filter((p: any) => p.concept_id === concept_id || (p.tags && p.tags.includes(concept_id)))
    .slice(0, 3)
    .map((p: any) => ({
      id: p.id,
      statement: (p.statement || p.question || '').slice(0, 200),
      year: p.year,
      difficulty: p.difficulty,
    }));

  // Talking points — derived from cohort preferences
  const talkingPoints: string[] = [];
  if (representationSamples > 0) {
    const algFrac = algebraicCount / representationSamples;
    const geoFrac = geometricCount / representationSamples;
    if (algFrac > 0.5) {
      talkingPoints.push('Your cohort leans algebraic — start with a visual/geometric anchor before the algebraic derivation to build intuition.');
    } else if (geoFrac > 0.5) {
      talkingPoints.push('Your cohort leans geometric — explicit step-by-step algebraic worked examples will reinforce rigor.');
    }
  }
  if (cohortAvg !== null && cohortAvg < 0.4) {
    talkingPoints.push('Cohort mastery is low — prioritize the intuition and a single clean worked example over breadth.');
  }
  if (level === 'advanced') {
    talkingPoints.push('Cohort mastery is strong — use this class to push into harder problems and edge cases.');
  }
  if (Object.keys(errorCounts).length > 0) {
    const topError = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0];
    talkingPoints.push(`Frequent error pattern in your cohort: ${topError[0]} (${topError[1]} occurrences). Address this explicitly.`);
  }

  sendJSON(res, {
    concept: {
      id: concept_id,
      label: explainer.label,
      topic: explainer.topic,
      canonical_definition: explainer.canonical_definition,
      deep_explanation: explainer.deep_explanation,
      exam_tip: explainer.exam_tip,
    },
    cohort: {
      size: students.length,
      avg_mastery: cohortAvg,
      level,
      students_below_mastery: masteryScores.filter(s => s < 0.5).length,
      error_pattern_counts: errorCounts,
    },
    teaching_brief: {
      common_misconceptions: (explainer.common_misconceptions || []).slice(0, 3),
      prerequisite_reminders: explainer.prerequisite_reminders || [],
      worked_examples: (explainer.worked_examples || []).slice(0, 3),
      suggested_problems: relatedProblems,
      talking_points: talkingPoints,
    },
  });
}

// ============================================================================
// Handler: push concept to all students' review queues
// ============================================================================

async function handlePushToReview(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;

  const body = (req.body as any) || {};
  const { concept_id } = body;
  if (!concept_id || typeof concept_id !== 'string') {
    return sendError(res, 400, 'concept_id required');
  }

  const teacher = getUserById(auth.user.id);
  if (!teacher) return sendError(res, 404, 'teacher not found');

  let pushedCount = 0;
  for (const student_id of teacher.teacher_of) {
    const result = pushReviewToStudent({
      student_id,
      concept_id,
      teacher_id: auth.user.id,
    });
    if (result.ok) pushedCount++;
  }

  sendJSON(res, {
    ok: true,
    pushed_to: pushedCount,
    total_students: teacher.teacher_of.length,
  });
}

// ============================================================================
// Handler: post / get class announcement
// ============================================================================

async function handlePostAnnouncement(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;

  const body = (req.body as any) || {};
  const text: string = (body.text || '').trim();
  if (!text) return sendError(res, 400, 'text required');
  if (text.length > 280) return sendError(res, 400, 'text must be 280 chars or fewer');

  const state = announcementStore.read();
  state.by_teacher[auth.user.id] = {
    text,
    posted_at: new Date().toISOString(),
  };
  announcementStore.write(state);

  sendJSON(res, { ok: true });
}

async function handleGetAnnouncement(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const user = getUserById(auth.user.id);
  if (!user || !user.taught_by) {
    return sendJSON(res, { announcement: null, reason: 'no assigned teacher' });
  }

  const state = announcementStore.read();
  const rec = state.by_teacher[user.taught_by];
  if (!rec) return sendJSON(res, { announcement: null });

  const teacher = getUserById(user.taught_by);
  sendJSON(res, {
    announcement: {
      text: rec.text,
      posted_at: rec.posted_at,
      teacher_name: teacher?.name || 'Your teacher',
      teacher_id: user.taught_by,
    },
  });
}

// ============================================================================
// Handler: "who is my teacher?" for students
// ============================================================================

async function handleMyTeacher(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const user = getUserById(auth.user.id);
  if (!user || !user.taught_by) {
    return sendJSON(res, { teacher: null });
  }
  const teacher = getUserById(user.taught_by);
  if (!teacher) return sendJSON(res, { teacher: null });

  sendJSON(res, {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      picture: teacher.picture,
    },
    // Transparency preview — what this teacher sees about the student
    teacher_can_see: {
      overall_mastery: 'yes (aggregate percentage)',
      concept_counts: 'yes (mastered / in progress / struggling counts)',
      attention_flags: 'yes (if 5+ consecutive failures or frustrated state)',
      raw_answers: 'no',
      emotional_state_detail: 'no',
      chat_transcripts: 'no',
    },
    pushed_reviews: listPushedReviews(auth.user.id),
  });
}

// ============================================================================
// Handler: dismiss a pushed review (student-side)
// ============================================================================

async function handleDismissPushedReview(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body as any) || {};
  const { concept_id } = body;
  if (!concept_id) return sendError(res, 400, 'concept_id required');
  dismissPushedReview({ student_id: auth.user.id, concept_id });
  sendJSON(res, { ok: true });
}

// ============================================================================

export const teachingRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/teaching/weekly-brief',      handler: handleWeeklyBrief },
  { method: 'GET',  path: '/api/teaching/next-class',        handler: handleNextClass },
  { method: 'GET',  path: '/api/teaching/brief/:concept_id', handler: handleBrief },
  { method: 'POST', path: '/api/teaching/push-to-review',    handler: handlePushToReview },
  { method: 'POST', path: '/api/teaching/announcement',      handler: handlePostAnnouncement },
  { method: 'GET',  path: '/api/teaching/announcement',      handler: handleGetAnnouncement },
  { method: 'GET',  path: '/api/student/my-teacher',         handler: handleMyTeacher },
  { method: 'POST', path: '/api/student/dismiss-review',     handler: handleDismissPushedReview },
];
