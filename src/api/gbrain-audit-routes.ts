// @ts-nocheck
/**
 * GBrain Audit Route — machine-readable integration report
 *
 * GET /api/admin/gbrain-audit
 *
 * Returns the per-feature accounting of GBrain integration status.
 * This is the live, introspectable version of the static audit doc
 * (docs/GBRAIN-INTEGRATION-AUDIT.md).
 *
 * The report is built from a static table (FEATURE_REGISTRY) that
 * enumerates every feature + its integration status + why. The
 * endpoint does not auto-detect GBrain usage from code — that would
 * produce false positives (imports don't guarantee usage) and
 * mix admin-CRUD routes with student-facing ones.
 *
 * Each row is a deliberate claim about integration status. Adding a
 * new feature means adding a row here.
 */

import type { ServerResponse } from 'http';
import { sendJSON, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireRole } from '../auth/middleware';

// ============================================================================

type Status = 'integrated' | 'not_applicable' | 'gap';
type Surface = 'student' | 'admin' | 'teacher' | 'infra' | 'content';

interface FeatureRow {
  feature: string;
  surface: Surface;
  integration_points: string[];
  status: Status;
  signals_consumed?: string[];   // for integrated rows
  rationale?: string;             // for not_applicable / gap rows
  shipped_in: string;
}

const FEATURE_REGISTRY: FeatureRow[] = [
  // ── Student-facing core ──────────────────────────────────────────────────
  {
    feature: 'Smart Practice',
    surface: 'student',
    integration_points: ['/api/gbrain/attempt', '/api/gbrain/attempt-insight'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'recent_attempts', 'exam_context'],
    shipped_in: 'v2.9.0',
  },
  {
    feature: 'Compounding mastery insights',
    surface: 'student',
    integration_points: ['src/gbrain/after-each-attempt.ts'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'recent_attempts', 'exam_context.is_imminent'],
    shipped_in: 'v2.9.4',
  },
  {
    feature: 'Lessons',
    surface: 'student',
    integration_points: ['src/api/lesson-routes.ts'],
    status: 'integrated',
    signals_consumed: ['modelToLessonSnapshot'],
    shipped_in: 'v2.5',
  },
  {
    feature: 'Chat with AI tutor',
    surface: 'student',
    integration_points: ['src/api/chat-routes.ts'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'concept_hints'],
    shipped_in: 'v2.3',
  },
  {
    feature: 'Multimodal photo input',
    surface: 'student',
    integration_points: ['src/api/multimodal-routes.ts'],
    status: 'integrated',
    signals_consumed: ['mastery_vector'],
    shipped_in: 'v2.4',
  },
  {
    feature: 'Smart Notebook',
    surface: 'student',
    integration_points: ['/api/notebook/auto-log', '/api/notebook/export'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'syllabus_topic_ids'],
    shipped_in: 'v2.9.4',
  },
  {
    feature: 'Notebook insight engine',
    surface: 'student',
    integration_points: ['src/api/notebook-insight-routes.ts'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'exam_context', 'recent_attempts'],
    shipped_in: 'v2.9.4',
  },
  {
    feature: 'Exam countdown chip',
    surface: 'student',
    integration_points: ['/api/exam-context/mine'],
    status: 'integrated',
    signals_consumed: ['days_to_exam', 'exam_is_close', 'exam_is_imminent'],
    shipped_in: 'v2.9.8',
  },
  {
    feature: 'Giveaway banner',
    surface: 'student',
    integration_points: ['/api/my-giveaway'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'cross-exam-coverage'],
    shipped_in: 'v2.10.0',
  },
  {
    feature: 'Unified student summary',
    surface: 'student',
    integration_points: ['/api/me/gbrain-summary'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'exam_context', 'giveaway', 'focus_signal'],
    shipped_in: 'v2.10.0',
  },
  {
    feature: 'Interactive lesson rendering',
    surface: 'student',
    integration_points: ['/api/lesson/:id/rendered'],
    status: 'integrated',
    signals_consumed: [
      'exam_context.question_types',
      'exam_context.days_to_exam',
      'exam_context.negative_marks',
      'mastery_vector.score',
      'mastery_vector.last_error_type',
      'speed_profile.avg_ms',
      'cohort_median_ms',
    ],
    shipped_in: 'v2.11.0 / v2.12.0 / v2.13.0',
  },
  {
    feature: 'Content four-tier cascade',
    surface: 'content',
    integration_points: ['/api/content/resolve'],
    status: 'integrated',
    signals_consumed: ['mastery_vector.score'],
    rationale: 'v2.13.0: struggling students biased toward trusted tier-0/Wolfram; confident students get full tier-2 cascade',
    shipped_in: 'v2.13.0',
  },
  {
    feature: 'Syllabus view with mastery overlay',
    surface: 'student',
    integration_points: ['/api/syllabus/me'],
    status: 'integrated',
    signals_consumed: ['mastery_vector', 'exam_context.syllabus_topic_ids', 'exam_context.topic_weights'],
    shipped_in: 'v2.13.0',
  },
  {
    feature: 'Daily streak',
    surface: 'student',
    integration_points: ['src/api/streak-routes.ts'],
    status: 'not_applicable',
    rationale: 'Activity-tracked by design. Adding mastery to streaks would conflate two distinct concepts.',
    shipped_in: 'v2.1',
  },

  // ── Admin-facing ─────────────────────────────────────────────────────────
  {
    feature: 'Admin dashboard',
    surface: 'admin',
    integration_points: ['src/api/admin-dashboard-routes.ts'],
    status: 'integrated',
    signals_consumed: ['summarizeCohort over StudentModels'],
    shipped_in: 'v2.9.2',
  },
  {
    feature: 'Per-student view',
    surface: 'admin',
    integration_points: ['src/api/user-admin-routes.ts'],
    status: 'integrated',
    signals_consumed: ['full StudentModel'],
    shipped_in: 'v2.9.2',
  },
  {
    feature: 'Teacher roster',
    surface: 'teacher',
    integration_points: ['src/api/teaching-routes.ts'],
    status: 'integrated',
    signals_consumed: ['modelToTeacherRosterEntry per student'],
    shipped_in: 'v2.9.3',
  },
  {
    feature: 'Push-to-review',
    surface: 'teacher',
    integration_points: ['src/api/teaching-routes.ts'],
    status: 'integrated',
    signals_consumed: ['pushed_reviews elevates GBrain priority'],
    shipped_in: 'v2.9.3',
  },
  {
    feature: 'Exam setup',
    surface: 'admin',
    integration_points: ['src/api/exam-routes.ts'],
    status: 'integrated',
    signals_consumed: ['nearest-match uses StudentModel for fallback hydration'],
    shipped_in: 'v2.9.7',
  },
  {
    feature: 'Exam groups master list',
    surface: 'admin',
    integration_points: ['src/api/exam-group-routes.ts'],
    status: 'not_applicable',
    rationale: 'Admin CRUD is GBrain-agnostic by design. Student-facing /api/my-giveaway IS GBrain-aware.',
    shipped_in: 'v2.9.9',
  },

  // ── Content / curriculum ─────────────────────────────────────────────────
  {
    feature: 'Curriculum framework',
    surface: 'admin',
    integration_points: ['src/api/curriculum-routes.ts'],
    status: 'not_applicable',
    rationale: 'Admin metadata endpoints; student-facing curriculum flows through lesson-routes which is GBrain-integrated.',
    shipped_in: 'v2.6',
  },
  {
    feature: 'Syllabus generator (admin)',
    surface: 'admin',
    integration_points: ['/api/syllabus/generate'],
    status: 'not_applicable',
    rationale: 'Admin tooling generates listings from stateless inputs. Student mastery overlay is /api/syllabus/me (integrated).',
    shipped_in: 'v2.2',
  },
  {
    feature: 'Blog / CMS',
    surface: 'content',
    integration_points: ['src/api/blog-routes.ts'],
    status: 'not_applicable',
    rationale: 'CMS content is the same for all readers.',
    shipped_in: 'v2.3',
  },
  {
    feature: 'Topic SEO pages',
    surface: 'content',
    integration_points: ['src/api/topic-pages.ts'],
    status: 'not_applicable',
    rationale: 'Static generation for public pages.',
    shipped_in: 'v2.3',
  },

  // ── Infra ────────────────────────────────────────────────────────────────
  {
    feature: 'Aggregate (anon telemetry)',
    surface: 'infra',
    integration_points: ['src/api/aggregate.ts'],
    status: 'not_applicable',
    rationale: 'Anonymous opt-in telemetry; no per-user state.',
    shipped_in: 'v2.1',
  },
  {
    feature: 'Auth',
    surface: 'infra',
    integration_points: ['src/api/auth-routes.ts'],
    status: 'not_applicable',
    rationale: 'Identity only.',
    shipped_in: 'v2.0',
  },
  {
    feature: 'LLM config',
    surface: 'infra',
    integration_points: ['src/api/llm-config-routes.ts'],
    status: 'not_applicable',
    rationale: 'User settings.',
    shipped_in: 'v2.7',
  },
  {
    feature: 'Commander CLI',
    surface: 'infra',
    integration_points: ['src/api/commander-routes.ts'],
    status: 'not_applicable',
    rationale: 'Admin CLI tooling.',
    shipped_in: 'v2.2',
  },
  {
    feature: 'Notification subscriptions',
    surface: 'infra',
    integration_points: ['src/api/notification-routes.ts'],
    status: 'not_applicable',
    rationale: 'Channel subscription metadata; not a student-facing decision.',
    shipped_in: 'v2.4',
  },
  {
    feature: 'Social graph',
    surface: 'infra',
    integration_points: ['src/api/social-routes.ts'],
    status: 'not_applicable',
    rationale: 'Relationship metadata.',
    shipped_in: 'v2.8',
  },
  {
    feature: 'Funnel tracking',
    surface: 'infra',
    integration_points: ['src/api/funnel-routes.ts'],
    status: 'not_applicable',
    rationale: 'Conversion metrics.',
    shipped_in: 'v2.2',
  },
  {
    feature: 'Gate Math legacy proxy',
    surface: 'infra',
    integration_points: ['src/api/gate-routes.ts'],
    status: 'not_applicable',
    rationale: 'Legacy compatibility layer.',
    shipped_in: 'v2.0',
  },
  {
    feature: 'Gemini proxy',
    surface: 'infra',
    integration_points: ['src/api/gemini-proxy.ts'],
    status: 'not_applicable',
    rationale: 'LLM provider proxy.',
    shipped_in: 'v2.7',
  },
];

// ============================================================================

async function handleAudit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const bySurface = {
    student: FEATURE_REGISTRY.filter(f => f.surface === 'student'),
    admin: FEATURE_REGISTRY.filter(f => f.surface === 'admin'),
    teacher: FEATURE_REGISTRY.filter(f => f.surface === 'teacher'),
    content: FEATURE_REGISTRY.filter(f => f.surface === 'content'),
    infra: FEATURE_REGISTRY.filter(f => f.surface === 'infra'),
  };

  const byStatus = {
    integrated: FEATURE_REGISTRY.filter(f => f.status === 'integrated'),
    not_applicable: FEATURE_REGISTRY.filter(f => f.status === 'not_applicable'),
    gap: FEATURE_REGISTRY.filter(f => f.status === 'gap'),
  };

  const studentFacing = bySurface.student.length + bySurface.teacher.length;
  const studentFacingIntegrated = bySurface.student.filter(f => f.status === 'integrated').length
    + bySurface.teacher.filter(f => f.status === 'integrated').length;

  sendJSON(res, {
    summary: {
      total_features: FEATURE_REGISTRY.length,
      integrated: byStatus.integrated.length,
      not_applicable: byStatus.not_applicable.length,
      gaps: byStatus.gap.length,
      student_facing_total: studentFacing,
      student_facing_integrated: studentFacingIntegrated,
      student_facing_coverage_percent: Math.round((studentFacingIntegrated / studentFacing) * 100),
    },
    /**
     * The complete GBrain signal surface — every attribute consumed
     * by at least one integrated feature. Grouped by category.
     */
    signals_surface: {
      mastery: [
        'mastery_vector[concept_id].score',
        'mastery_vector[concept_id].attempts',
        'mastery_vector[concept_id].last_error_type',
        'recent_attempts (newest-last)',
        'struggling_count / mastered_count / in_progress_count',
      ],
      exam_identity: [
        'exam_id', 'exam_code', 'exam_name', 'exam_level',
      ],
      exam_content: [
        'syllabus_topic_ids',
        'topic_weights (per-topic exam weight)',
        'priority_concepts (top-5 by weight)',
      ],
      exam_structure: [
        'question_types mix (mcq/msq/numerical/descriptive)',
        'marking_scheme.negative_marks_per_wrong',
        'duration_minutes + total_marks (derives avg_seconds_per_question)',
      ],
      exam_schedule: [
        'days_to_exam',
        'exam_is_close (≤30d)',
        'exam_is_imminent (≤7d)',
        'typical_prep_weeks',
      ],
      speed: [
        'speed_profile[concept_id].avg_ms',
        'speed_profile[concept_id].by_difficulty',
        'cohort_median_ms (derived from student\'s other concepts)',
      ],
      giveaway: [
        'group_id + group_name',
        'primary_exam + bonus_exams',
        'per-bonus coverage_percent',
        'coverage_tier (unstarted/warming/progressing/strong/ready)',
      ],
      derived: [
        'focus_signal (what matters now — priority-ordered message)',
        'is_slow_for_cohort (recent_avg_ms > 1.5× cohort_median_ms)',
        'is_fallback (exam_context hydrated from nearest match)',
        'dominant_type (inferred from question_types mix)',
      ],
    },
    by_surface: bySurface,
    by_status: byStatus,
    full_registry: FEATURE_REGISTRY,
  });
}

// ============================================================================

export const gbrainAuditRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/admin/gbrain-audit', handler: handleAudit },
];
