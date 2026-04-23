// @ts-nocheck
/**
 * Strategy Engine — converts HealthSignals into actionable Strategies.
 *
 * Each recognized pattern produces a Strategy with:
 *   - Rationale (WHY the agent is proposing it)
 *   - Evidence (which signals triggered it)
 *   - Priority (P0 critical / P1 important / P2 recommended / P3 opportunistic)
 *   - Proposed tasks (role-assigned work items with suggested tools)
 *   - Expected outcome
 *
 * Pure function: proposeStrategies(healthReport) -> Strategy[].
 * Same input always produces same output in same order.
 */

import type {
  HealthReport, HealthSignal, Strategy, ProposedTask, StrategyKind,
} from './types';
import { defaultRoleForStrategyKind } from './role-registry';

// ============================================================================

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

// ============================================================================
// Strategy builders — one per recognized pattern
// ============================================================================

function triageBacklogStrategy(
  signals: HealthSignal[], run_id: string,
): Strategy | null {
  const highVolume = signals.filter(s => s.code === 'feedback:high-volume-topic');
  const aging = signals.filter(s => s.code === 'feedback:stale-open-items');
  if (highVolume.length === 0 && aging.length === 0) return null;

  const affected_topics = highVolume
    .flatMap(s => s.affected_entity_ids ?? []);
  const priority = signals.some(s => s.severity === 'critical') ? 'P0' : 'P1';

  const proposed_tasks: ProposedTask[] = [
    {
      title: 'Triage open feedback items',
      description:
        `Review all feedback items in status=open or status=triaged. Assign P0/P1/P2/P3 based on severity. ` +
        `Focus on high-volume topics: ${affected_topics.join(', ') || 'none detected'}.`,
      assigned_role: 'qa-reviewer',
      suggested_tool_ids: ['feedback:list-pending-triage', 'feedback:triage'],
      estimated_effort_minutes: 45,
    },
  ];

  if (highVolume.length > 0) {
    proposed_tasks.push({
      title: 'Approve and apply feedback on high-volume topics',
      description:
        `After triage, approve the P0/P1 items on topics with 3+ feedback items and apply them ` +
        `with a release_tag to capture the audit trail.`,
      assigned_role: 'admin',
      suggested_tool_ids: ['feedback:approve', 'feedback:apply'],
      estimated_effort_minutes: 60,
      depends_on_indices: [0],
    });
  }

  return {
    id: shortId('STR'),
    kind: 'triage-feedback-backlog',
    headline: highVolume.length > 0
      ? `Triage ${highVolume.length} topic${highVolume.length > 1 ? 's' : ''} with high-volume feedback`
      : `Review aging feedback backlog`,
    rationale:
      `Open feedback items are piling up. High-volume topics indicate systemic content issues that ` +
      `need admin attention before they compound into poor student experience.`,
    evidence: [...highVolume, ...aging].map(s => s.id),
    priority,
    affected_exams: [],
    affected_topic_ids: affected_topics,
    proposed_tasks,
    expected_outcome:
      `All open/triaged feedback sorted by priority; P0/P1 items approved and applied; ` +
      `topic trends visible in admin dashboard.`,
    generated_at: new Date().toISOString(),
    generation_run_id: run_id,
  };
}

function nudgeAgingSamplesStrategy(
  signals: HealthSignal[], run_id: string,
): Strategy | null {
  const aging = signals.filter(s => s.code === 'sample-check:aging-sample');
  if (aging.length === 0) return null;

  const affected_exams = Array.from(new Set(aging.flatMap(s => s.affected_entity_ids ?? [])));
  const priority = aging.some(s => s.severity === 'critical') ? 'P0' : 'P1';

  const proposed_tasks: ProposedTask[] = [];
  for (const eid of affected_exams) {
    proposed_tasks.push({
      title: `Review and close aging sample-check for ${eid}`,
      description:
        `The latest open sample-check for ${eid} is aging. Review its status: either close as resolved ` +
        `(if no open/approved-pending items remain) or close as superseded and start a fresh build.`,
      assigned_role: 'exam-ops',
      suggested_tool_ids: ['sample-check:get-latest-for-exam', 'sample-check:close-resolved'],
      inputs_hint: { exam_id: eid },
      estimated_effort_minutes: 20,
    });
  }

  return {
    id: shortId('STR'),
    kind: 'nudge-aging-sample-checks',
    headline: `${affected_exams.length} aging sample-check${affected_exams.length > 1 ? 's' : ''} need admin attention`,
    rationale:
      `Sample-checks pending beyond 48h risk admin-feedback-cycle breakdown. Close them ` +
      `(resolved or superseded) so content iteration can progress.`,
    evidence: aging.map(s => s.id),
    priority,
    affected_exams,
    affected_topic_ids: [],
    proposed_tasks,
    expected_outcome: `All aging sample-checks resolved or superseded; next build cycle unblocked.`,
    generated_at: new Date().toISOString(),
    generation_run_id: run_id,
  };
}

function iterateAndPromoteStrategy(
  signals: HealthSignal[], run_id: string,
): Strategy | null {
  const pending = signals.filter(s => s.code === 'course:pending-feedback-not-promoted');
  if (pending.length === 0) return null;

  const affected_exams = Array.from(new Set(pending.flatMap(s => s.affected_entity_ids ?? [])));
  const priority = pending.some(s => s.severity === 'warning') ? 'P1' : 'P2';

  const proposed_tasks: ProposedTask[] = [];
  for (const eid of affected_exams) {
    proposed_tasks.push({
      title: `Iterate-promote course for ${eid}`,
      description:
        `Applied feedback has accumulated for ${eid} but the course hasn't been promoted to a new version. ` +
        `Run an iterate build with the latest sample as source to capture the feedback in a new LiveCourse version.`,
      assigned_role: 'content-ops',
      suggested_tool_ids: ['exam-builder:build-or-update', 'course:list-promotions'],
      inputs_hint: { exam_id: eid, build_kind: 'iterate' },
      estimated_effort_minutes: 30,
    });
  }

  return {
    id: shortId('STR'),
    kind: 'iterate-and-promote-course',
    headline: `Promote ${affected_exams.length} course${affected_exams.length > 1 ? 's' : ''} with pending applied feedback`,
    rationale:
      `Students aren't seeing the improvements admins have already approved and applied. Running an iterate ` +
      `build ships the audit trail and updates the LiveCourse version.`,
    evidence: pending.map(s => s.id),
    priority,
    affected_exams,
    affected_topic_ids: [],
    proposed_tasks,
    expected_outcome: `LiveCourse version bumped to reflect applied feedback; lineage records created.`,
    generated_at: new Date().toISOString(),
    generation_run_id: run_id,
  };
}

function rereviewStaleArticlesStrategy(
  signals: HealthSignal[], run_id: string,
): Strategy | null {
  const stale = signals.filter(s => s.code === 'marketing:stale-articles');
  if (stale.length === 0) return null;

  const priority = stale.some(s => s.severity === 'warning') ? 'P1' : 'P2';

  const proposed_tasks: ProposedTask[] = [
    {
      title: 'List and review stale articles',
      description:
        `Drift detection flagged articles as stale. Get the list, read each drift reason, and queue ` +
        `author re-write tasks for each.`,
      assigned_role: 'marketing-lead',
      suggested_tool_ids: ['marketing:list-stale-articles'],
      estimated_effort_minutes: 15,
    },
    {
      title: 'Re-write stale article bodies',
      description:
        `For each stale article, update the body_md to reflect the current feature behavior. Submit for ` +
        `admin review; on approval, re-publish.`,
      assigned_role: 'author',
      suggested_tool_ids: [],
      estimated_effort_minutes: 90,
      depends_on_indices: [0],
    },
  ];

  return {
    id: shortId('STR'),
    kind: 'rereview-stale-articles',
    headline: `Re-review and re-publish stale articles flagged by drift detection`,
    rationale:
      `App feature changes drifted articles out of sync. Stale content on the public blog mispresents ` +
      `product behavior and erodes trust.`,
    evidence: stale.map(s => s.id),
    priority,
    affected_exams: [],
    affected_topic_ids: [],
    proposed_tasks,
    expected_outcome: `Stale articles re-written, re-approved, and re-published. Sync records back to in_sync.`,
    generated_at: new Date().toISOString(),
    generation_run_id: run_id,
  };
}

function launchCampaignStrategy(
  signals: HealthSignal[], run_id: string,
): Strategy | null {
  const gap = signals.filter(s => s.code === 'marketing:publish-gap-no-campaign');
  if (gap.length === 0) return null;

  const proposed_tasks: ProposedTask[] = [
    {
      title: 'Design campaign bundling published articles',
      description:
        `Identify 2-4 published articles that share an exam_scope or thematic objective. Draft a campaign ` +
        `with channel_plan covering Twitter + LinkedIn + Instagram.`,
      assigned_role: 'marketing-lead',
      suggested_tool_ids: ['marketing:list-articles-for-exam', 'marketing:get-dashboard'],
      estimated_effort_minutes: 60,
    },
    {
      title: 'Launch the campaign',
      description: `After campaign draft is approved, launch it to auto-generate social cards and landing variants.`,
      assigned_role: 'marketing-lead',
      suggested_tool_ids: ['marketing:launch-campaign'],
      estimated_effort_minutes: 10,
      depends_on_indices: [0],
    },
  ];

  return {
    id: shortId('STR'),
    kind: 'launch-marketing-campaign',
    headline: `Launch campaign to amplify ${gap.length > 0 ? 'unactivated' : 'published'} articles`,
    rationale:
      `Published content isn't getting distribution. Opportunity cost: every day without campaign activity ` +
      `means less visibility, lower acquisition.`,
    evidence: gap.map(s => s.id),
    priority: 'P2',
    affected_exams: [],
    affected_topic_ids: [],
    proposed_tasks,
    expected_outcome: `Active campaign with social cards + landing variants; UTM-tagged links in distribution.`,
    generated_at: new Date().toISOString(),
    generation_run_id: run_id,
  };
}

function addressAttentionDeferralsStrategy(
  signals: HealthSignal[], run_id: string,
): Strategy | null {
  const deferrals = signals.filter(s => s.code === 'attention:rising-deferrals');
  if (deferrals.length === 0) return null;

  const affected_topic_ids = Array.from(new Set(deferrals.flatMap(s => s.affected_entity_ids ?? [])));

  const proposed_tasks: ProposedTask[] = [
    {
      title: `Review deferred topics: ${affected_topic_ids.join(', ')}`,
      description:
        `Students are repeatedly deferring these topics. Investigate: are the lessons too long for short ` +
        `sessions? Is GBrain suggesting them at the wrong moments? Is the topic genuinely avoided?`,
      assigned_role: 'content-ops',
      suggested_tool_ids: ['attention:coverage-for-user'],
      estimated_effort_minutes: 45,
    },
    {
      title: `Produce lighter-weight variant lessons for deferred topics`,
      description:
        `Create short-session-friendly variants (nano/short strategy-compatible) for each deferred topic ` +
        `so students can progress in 5-10 minute windows without deferring.`,
      assigned_role: 'content-ops',
      suggested_tool_ids: [],
      estimated_effort_minutes: 120,
      depends_on_indices: [0],
    },
  ];

  return {
    id: shortId('STR'),
    kind: 'address-attention-deferrals',
    headline: `Investigate rising deferrals on ${affected_topic_ids.length} topic${affected_topic_ids.length > 1 ? 's' : ''}`,
    rationale:
      `Repeated deferrals signal content-student-session mismatch. The attention primitive keeps engagement ` +
      `alive but ongoing avoidance leads to compounding gaps.`,
    evidence: deferrals.map(s => s.id),
    priority: 'P1',
    affected_exams: [],
    affected_topic_ids,
    proposed_tasks,
    expected_outcome: `Lighter-weight variants exist for deferred topics; deferral rate drops in next scan.`,
    generated_at: new Date().toISOString(),
    generation_run_id: run_id,
  };
}

function expandCorpusStrategy(
  signals: HealthSignal[], run_id: string,
): Strategy | null {
  const noCourse = signals.filter(s => s.code === 'course:exam-has-no-live-course');
  const noSample = signals.filter(s => s.code === 'sample-check:exam-with-no-sample');
  if (noCourse.length === 0 && noSample.length === 0) return null;

  const affected_exams = Array.from(new Set([
    ...noCourse.flatMap(s => s.affected_entity_ids ?? []),
    ...noSample.flatMap(s => s.affected_entity_ids ?? []),
  ]));

  const proposed_tasks: ProposedTask[] = [];
  for (const eid of affected_exams) {
    proposed_tasks.push({
      title: `Build initial content corpus for ${eid}`,
      description:
        `No LiveCourse exists for ${eid} yet. Run a 'new' build to produce the first sample-check with ` +
        `baseline content from the adapter's loadBaseContent().`,
      assigned_role: 'exam-ops',
      suggested_tool_ids: ['exam-builder:build-or-update'],
      inputs_hint: { exam_id: eid, build_kind: 'new' },
      estimated_effort_minutes: 45,
    });
  }

  return {
    id: shortId('STR'),
    kind: 'expand-content-corpus',
    headline: `Initialize content for ${affected_exams.length} exam${affected_exams.length > 1 ? 's' : ''} with no course`,
    rationale:
      `Registered adapters without a shipped LiveCourse represent stalled onboarding. Either ship the ` +
      `first version or remove the adapter.`,
    evidence: [...noCourse, ...noSample].map(s => s.id),
    priority: 'P2',
    affected_exams,
    affected_topic_ids: [],
    proposed_tasks,
    expected_outcome: `First LiveCourse shipped for each stalled exam; onboarding funnel unblocked.`,
    generated_at: new Date().toISOString(),
    generation_run_id: run_id,
  };
}

// ============================================================================
// Main entry
// ============================================================================

const STRATEGY_BUILDERS = [
  triageBacklogStrategy,
  nudgeAgingSamplesStrategy,
  iterateAndPromoteStrategy,
  rereviewStaleArticlesStrategy,
  launchCampaignStrategy,
  addressAttentionDeferralsStrategy,
  expandCorpusStrategy,
];

const PRIORITY_ORDER: Record<Strategy['priority'], number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function proposeStrategies(report: HealthReport, run_id: string): Strategy[] {
  const strategies: Strategy[] = [];
  for (const builder of STRATEGY_BUILDERS) {
    const s = builder(report.signals, run_id);
    if (s) strategies.push(s);
  }
  // Sort by priority (P0 first), then by count of proposed tasks desc
  strategies.sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.proposed_tasks.length - a.proposed_tasks.length;
  });
  return strategies;
}
