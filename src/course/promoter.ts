// @ts-nocheck
/**
 * Course Promoter — takes N closed SampleCheck iterations + their applied
 * feedback history and produces a versioned LiveCourse release.
 *
 * Key properties:
 *
 *   1. CONTENT-ADDRESSED IDEMPOTENCY. Running promotePromote() twice
 *      with the same source_sample_ids + applied_feedback_ids returns
 *      the existing PromotionRecord and does not create a new version.
 *      Uses a deterministic content_hash.
 *
 *   2. AUTO BUMP LEVEL. Diffs candidate content against current_version
 *      to propose major/minor/patch. Admin can override.
 *
 *   3. ROLLBACK = new promotion. Archiving a bad version means
 *      promoting an earlier snapshot again. The append-only log
 *      shows both moves.
 *
 *   4. FULL LINEAGE. Every LiveCourse version's PromotionRecord stores
 *      source_sample_ids + applied_feedback_ids, so lineage view can
 *      reconstruct the exact path from student voice to shipped content.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { LiveCourse, CourseVersion, PromotionRecord, PromotionBumpLevel, CourseStatus, LineageView } from './types';
import type { SampleCheck, SampleSnapshot } from '../sample-check/types';
import { getSampleCheck, listCrossLinksFromFeedback } from '../sample-check/store';
import { getFeedback, listFeedback } from '../feedback/store';
import { applyPatch, proposePatch, type ExamContent } from '../feedback/scope-applicator';
import { createHash } from 'crypto';

// ============================================================================
// Persistence
// ============================================================================

interface StoreShape {
  courses: LiveCourse[];
  promotion_records: PromotionRecord[];
}

const STORE_PATH = '.data/courses.json';

const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ courses: [], promotion_records: [] }),
});

function nano(n = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ============================================================================
// Version arithmetic
// ============================================================================

export function parseVersion(v: string): CourseVersion {
  const [maj, min, pat] = v.split('.').map(Number);
  return { value: v, major: maj, minor: min, patch: pat };
}

export function versionToString(v: CourseVersion): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

export function bumpVersion(cur: CourseVersion, level: PromotionBumpLevel): CourseVersion {
  if (level === 'major') return parseVersion(`${cur.major + 1}.0.0`);
  if (level === 'minor') return parseVersion(`${cur.major}.${cur.minor + 1}.0`);
  return parseVersion(`${cur.major}.${cur.minor}.${cur.patch + 1}`);
}

// ============================================================================
// Content-addressed hashing — for idempotency
// ============================================================================

export function contentHash(
  source_sample_ids: string[],
  applied_feedback_ids: string[],
): string {
  const payload = JSON.stringify({
    samples: [...source_sample_ids].sort(),
    feedback: [...applied_feedback_ids].sort(),
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

// ============================================================================
// Diff + auto bump-level detection
// ============================================================================

export function diffSnapshots(
  before: SampleSnapshot | null,
  after: SampleSnapshot,
) {
  const diff = {
    added_topics: [] as string[],
    removed_topics: [] as string[],
    topic_weight_changes: [] as Array<{ topic_id: string; from: number; to: number }>,
    added_lessons: [] as string[],
    modified_lessons: [] as string[],
    added_mocks: [] as string[],
    modified_mock_questions: [] as Array<{ mock_id: string; question_id: string }>,
    added_strategies: [] as string[],
    edited_strategies: [] as string[],
    metadata_changes: [] as Array<{ field: string; from: any; to: any }>,
  };

  if (!before) {
    // First version — everything is new
    diff.added_topics = Object.keys(after.exam?.topic_weights ?? {});
    diff.added_lessons = after.lessons?.map((l: any) => l.id) ?? [];
    diff.added_mocks = after.mocks?.map((m: any) => m.id) ?? [];
    diff.added_strategies = after.strategies?.map((s: any) => s.title) ?? [];
    return diff;
  }

  // Topics
  const beforeTopics = new Set(Object.keys(before.exam?.topic_weights ?? {}));
  const afterTopics = new Set(Object.keys(after.exam?.topic_weights ?? {}));
  for (const t of afterTopics) if (!beforeTopics.has(t)) diff.added_topics.push(t);
  for (const t of beforeTopics) if (!afterTopics.has(t)) diff.removed_topics.push(t);
  for (const t of afterTopics) {
    if (!beforeTopics.has(t)) continue;
    const fromW = before.exam.topic_weights[t];
    const toW = after.exam.topic_weights[t];
    if (fromW !== toW) diff.topic_weight_changes.push({ topic_id: t, from: fromW, to: toW });
  }

  // Lessons
  const beforeLessonIds = new Set((before.lessons ?? []).map((l: any) => l.id));
  for (const l of after.lessons ?? []) {
    if (!beforeLessonIds.has(l.id)) diff.added_lessons.push(l.id);
    else {
      const bl = (before.lessons ?? []).find((x: any) => x.id === l.id);
      if (JSON.stringify(bl?.components) !== JSON.stringify(l.components)) {
        diff.modified_lessons.push(l.id);
      }
    }
  }

  // Mocks + questions
  const beforeMockIds = new Set((before.mocks ?? []).map((m: any) => m.id));
  for (const m of after.mocks ?? []) {
    if (!beforeMockIds.has(m.id)) {
      diff.added_mocks.push(m.id);
    } else {
      const bm = (before.mocks ?? []).find((x: any) => x.id === m.id);
      for (const q of m.questions ?? []) {
        const bq = (bm?.questions ?? []).find((x: any) => x.id === q.id);
        if (!bq || JSON.stringify(bq) !== JSON.stringify(q)) {
          diff.modified_mock_questions.push({ mock_id: m.id, question_id: q.id });
        }
      }
    }
  }

  // Strategies
  const beforeStratTitles = new Set((before.strategies ?? []).map((s: any) => s.title));
  for (const s of after.strategies ?? []) {
    if (!beforeStratTitles.has(s.title)) diff.added_strategies.push(s.title);
    else {
      const bs = (before.strategies ?? []).find((x: any) => x.title === s.title);
      if (bs?.content !== s.content) diff.edited_strategies.push(s.title);
    }
  }

  // Metadata
  const metaFields = ['duration_minutes', 'total_marks', 'marking_scheme', 'question_types'];
  for (const f of metaFields) {
    const b = (before.exam as any)?.[f];
    const a = (after.exam as any)?.[f];
    if (JSON.stringify(b) !== JSON.stringify(a)) diff.metadata_changes.push({ field: f, from: b, to: a });
  }

  return diff;
}

/**
 * Auto-detect the appropriate semver bump level based on the diff.
 *
 *   major — any metadata_changes that touch marking_scheme or
 *           question_types or duration_minutes
 *   minor — added_topics, added_lessons, added_mocks, added_strategies
 *   patch — everything else (fixes to existing content)
 */
export function detectBumpLevel(diff: ReturnType<typeof diffSnapshots>): PromotionBumpLevel {
  const majorFields = new Set(['marking_scheme', 'question_types', 'duration_minutes', 'total_marks']);
  if (diff.metadata_changes.some(c => majorFields.has(c.field))) return 'major';
  if (
    diff.added_topics.length > 0 ||
    diff.added_lessons.length > 0 ||
    diff.added_mocks.length > 0 ||
    diff.added_strategies.length > 0 ||
    diff.removed_topics.length > 0
  ) return 'minor';
  return 'patch';
}

// ============================================================================
// Promotion — the core operation
// ============================================================================

export interface PromoteInput {
  exam_id: string;
  exam_code: string;
  exam_name: string;
  source_sample_ids: string[];
  /** Which applied feedback items contributed to this promotion */
  applied_feedback_ids: string[];
  /**
   * The candidate merged content. Typically produced by the workflow
   * code calling applyPatch() over the base exam content with all
   * approved patches.
   */
  candidate_content: SampleSnapshot;
  /** Admin override of auto-detected bump level */
  override_bump?: PromotionBumpLevel;
  /** Release tag this promotion ships in */
  release_tag?: string;
  promoted_by: string;
  /** Optional aggregate LLM provenance */
  generation_provenance_aggregate?: PromotionRecord['generation_provenance_aggregate'];
}

export interface PromoteResult {
  course: LiveCourse;
  record: PromotionRecord;
  /** True if this was a new promotion; false if it was an idempotent hit */
  created_new_version: boolean;
}

/**
 * Promote a batch of samples + applied feedback into a LiveCourse version.
 *
 * Validates:
 *   - source_sample_ids exist and belong to exam_id
 *   - applied_feedback_ids exist and have status='applied'
 *   - content_hash isn't already present (idempotency)
 *
 * On success, persists both the new LiveCourse version and a new
 * PromotionRecord.
 */
export function promoteToCourse(input: PromoteInput): PromoteResult {
  const store = _store.read();

  // Validate sample ids
  for (const sid of input.source_sample_ids) {
    const sc = getSampleCheck(sid);
    if (!sc) throw new Error(`Source sample not found: ${sid}`);
    if (sc.exam_id !== input.exam_id) {
      throw new Error(`Sample ${sid} belongs to exam ${sc.exam_id}, not ${input.exam_id}`);
    }
    if (sc.status === 'closed_superseded') {
      // Allowed — superseded samples can still contribute content
    } else if (sc.status === 'closed_resolved') {
      // Allowed — the ideal source
    } else {
      throw new Error(
        `Sample ${sid} is ${sc.status}. Only closed_resolved or closed_superseded samples can be promoted.`,
      );
    }
  }

  // Validate feedback ids
  for (const fid of input.applied_feedback_ids) {
    const fb = getFeedback(fid);
    if (!fb) throw new Error(`Applied feedback not found: ${fid}`);
    if (fb.status !== 'applied') {
      throw new Error(`Feedback ${fid} has status ${fb.status}, must be 'applied' to promote`);
    }
  }

  const hash = contentHash(input.source_sample_ids, input.applied_feedback_ids);

  // Idempotency check — if a prior PromotionRecord has this exact hash,
  // return it + the course as-is.
  const prior = store.promotion_records.find(r => r.content_hash === hash && r.exam_id === input.exam_id);
  if (prior && prior.status === 'success') {
    const course = store.courses.find(c => c.id === prior.course_id);
    if (course) {
      return { course, record: prior, created_new_version: false };
    }
  }

  // Locate or create the course
  const courseId = `LC-${input.exam_code}`;
  let course = store.courses.find(c => c.id === courseId);
  let versionBefore: CourseVersion | undefined;
  let priorSnapshot: SampleSnapshot | null = null;

  if (course) {
    versionBefore = course.current_version;
    priorSnapshot = course.current_version_content;
  } else {
    course = {
      id: courseId,
      exam_id: input.exam_id,
      exam_name: input.exam_name,
      exam_code: input.exam_code,
      current_version: parseVersion('0.0.0'),   // will be bumped immediately
      current_version_content: {} as any,        // will be filled below
      version_history: [],
      created_at: new Date().toISOString(),
      created_by: input.promoted_by,
      last_promoted_at: new Date().toISOString(),
      last_promoted_by: input.promoted_by,
    };
    store.courses.push(course);
  }

  // Compute diff + auto bump-level
  const diff = diffSnapshots(priorSnapshot, input.candidate_content);
  const autoBump = detectBumpLevel(diff);
  const bump = input.override_bump ?? autoBump;

  // Start from 0.0.0 on the very first promotion, otherwise bump from current
  const startingVersion = priorSnapshot ? course.current_version : parseVersion('0.0.0');
  const newVersion = priorSnapshot
    ? bumpVersion(startingVersion, bump)
    : parseVersion('1.0.0');   // First live version is 1.0.0

  const recordId = `PR-${nano()}`;

  const record: PromotionRecord = {
    id: recordId,
    course_id: courseId,
    exam_id: input.exam_id,
    content_hash: hash,
    version_before: versionBefore,
    version_after: newVersion,
    bump_level: bump,
    bump_auto_detected: autoBump,
    bump_overridden_by_admin: bump !== autoBump,
    source_sample_ids: [...input.source_sample_ids].sort(),
    applied_feedback_ids: [...input.applied_feedback_ids].sort(),
    summary: buildSummary(diff, bump, input.source_sample_ids.length, input.applied_feedback_ids.length),
    diff,
    generation_provenance_aggregate: input.generation_provenance_aggregate,
    status: 'success',
    promoted_at: new Date().toISOString(),
    promoted_by: input.promoted_by,
    release_tag: input.release_tag,
  };

  // Archive the prior version; publish the new one
  if (priorSnapshot) {
    const prevHistoryEntry = course.version_history.find(h =>
      versionToString(h.version) === versionToString(course.current_version),
    );
    if (prevHistoryEntry) prevHistoryEntry.status = 'archived';
  }

  course.current_version = newVersion;
  course.current_version_content = input.candidate_content;
  course.version_history.push({
    version: newVersion,
    status: 'published',
    published_at: record.promoted_at,
    snapshot: input.candidate_content,
    promotion_record_id: recordId,
  });
  course.last_promoted_at = record.promoted_at;
  course.last_promoted_by = input.promoted_by;

  store.promotion_records.push(record);
  _store.write(store);

  return { course, record, created_new_version: true };
}

function buildSummary(
  diff: ReturnType<typeof diffSnapshots>,
  bump: PromotionBumpLevel,
  sampleCount: number,
  fbCount: number,
): string {
  const parts: string[] = [];
  if (diff.added_topics.length) parts.push(`+${diff.added_topics.length} topic(s)`);
  if (diff.removed_topics.length) parts.push(`-${diff.removed_topics.length} topic(s)`);
  if (diff.topic_weight_changes.length) parts.push(`${diff.topic_weight_changes.length} weight recalibration(s)`);
  if (diff.added_lessons.length) parts.push(`+${diff.added_lessons.length} lesson(s)`);
  if (diff.modified_lessons.length) parts.push(`${diff.modified_lessons.length} lesson edit(s)`);
  if (diff.added_mocks.length) parts.push(`+${diff.added_mocks.length} mock(s)`);
  if (diff.modified_mock_questions.length) parts.push(`${diff.modified_mock_questions.length} question fix(es)`);
  if (diff.added_strategies.length) parts.push(`+${diff.added_strategies.length} strateg(ies)`);
  if (diff.edited_strategies.length) parts.push(`${diff.edited_strategies.length} strategy edit(s)`);
  if (diff.metadata_changes.length) parts.push(`${diff.metadata_changes.length} metadata change(s)`);
  const body = parts.length ? parts.join('; ') : 'no content changes';
  return `[${bump} bump] ${body}. Merged from ${sampleCount} sample(s) with ${fbCount} applied feedback item(s).`;
}

// ============================================================================
// Query + lineage
// ============================================================================

export function getCourse(id: string): LiveCourse | null {
  return _store.read().courses.find(c => c.id === id) ?? null;
}

export function getCourseByExam(exam_id: string): LiveCourse | null {
  return _store.read().courses.find(c => c.exam_id === exam_id) ?? null;
}

export function listCourses(): LiveCourse[] {
  return _store.read().courses;
}

export function getPromotionRecord(id: string): PromotionRecord | null {
  return _store.read().promotion_records.find(r => r.id === id) ?? null;
}

export function listPromotionRecords(exam_id?: string): PromotionRecord[] {
  const all = _store.read().promotion_records;
  const filtered = exam_id ? all.filter(r => r.exam_id === exam_id) : all;
  return filtered.sort((a, b) => b.promoted_at.localeCompare(a.promoted_at));
}

/**
 * Build a human-readable lineage view for any LiveCourse version.
 * Traces every applied feedback back to which sample + student +
 * release tag contributed.
 */
export function buildLineage(course_id: string, version_string: string): LineageView | null {
  const course = getCourse(course_id);
  if (!course) return null;
  const historyEntry = course.version_history.find(h => versionToString(h.version) === version_string);
  if (!historyEntry) return null;
  const record = getPromotionRecord(historyEntry.promotion_record_id);
  if (!record) return null;

  const source_samples = record.source_sample_ids.map(sid => {
    const sc = getSampleCheck(sid);
    return {
      sample_check_id: sid,
      iteration: sc?.iteration ?? 0,
      status: sc?.status ?? 'unknown',
      feedback_count: sc?.feedback_stats.total ?? 0,
    };
  });

  const applied_feedback_items = record.applied_feedback_ids.map(fid => {
    const fb = getFeedback(fid);
    return {
      feedback_id: fid,
      kind: fb?.kind ?? 'unknown',
      submitted_by: {
        user_id: fb?.submitted_by.user_id ?? '',
        display_name: fb?.submitted_by.display_name,
      },
      summary: (fb?.description ?? '').slice(0, 140),
      applied_in_release: fb?.applied_in_release,
    };
  });

  // Cross-exam contributions: any cross-links from feedback that flowed
  // into this course via applied status
  const cross_exam_contributions = record.applied_feedback_ids
    .flatMap(fid => listCrossLinksFromFeedback(fid).map(cx => ({
      cross_link_id: cx.id,
      source_exam_id: cx.source_exam_id,
      source_feedback_id: cx.source_feedback_id,
      rationale: cx.rationale,
    })))
    .filter(cx => cx !== null);

  return {
    course_id,
    version: historyEntry.version,
    promotion_record_id: record.id,
    source_samples,
    applied_feedback_items,
    cross_exam_contributions,
  };
}

/**
 * Rollback — effectively a fresh promotion of an earlier version's
 * content. The earlier version must exist in the course's history.
 */
export function rollbackCourse(
  course_id: string,
  target_version: string,
  rolled_back_by: string,
  reason: string,
): PromoteResult | null {
  const store = _store.read();
  const course = store.courses.find(c => c.id === course_id);
  if (!course) return null;
  const target = course.version_history.find(h => versionToString(h.version) === target_version);
  if (!target) throw new Error(`Target version ${target_version} not found in history`);

  const targetRecord = store.promotion_records.find(r => r.id === target.promotion_record_id);
  if (!targetRecord) throw new Error(`Promotion record for target version missing`);

  // Mark the current version's record as rolled_back
  const currentRecord = store.promotion_records.find(r =>
    r.version_after.value === course.current_version.value && r.course_id === course_id,
  );
  if (currentRecord) {
    currentRecord.status = 'rolled_back';
    currentRecord.rolled_back_at = new Date().toISOString();
    currentRecord.rolled_back_reason = reason;
  }
  _store.write(store);

  // Promote the target content forward as a new patch-level version
  return promoteToCourse({
    exam_id: course.exam_id,
    exam_code: course.exam_code,
    exam_name: course.exam_name,
    source_sample_ids: targetRecord.source_sample_ids,
    applied_feedback_ids: targetRecord.applied_feedback_ids,
    candidate_content: target.snapshot,
    override_bump: 'patch',
    promoted_by: rolled_back_by,
    release_tag: `rollback-to-${target_version}`,
  });
}
