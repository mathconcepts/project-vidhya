// @ts-nocheck
/**
 * Scanner — reads every module's store and produces a unified
 * HealthReport with cross-module signals.
 *
 * This is the "monitor" side of the agent. It runs every time the
 * orchestrator is triggered (manually or scheduled), and its output
 * is what the strategy engine consumes.
 *
 * The scanner is READ-ONLY. It never mutates any store.
 */

import type {
  HealthReport, HealthSignal, FeedbackHealth, SampleCheckHealth,
  CourseHealth, AttentionHealth, MarketingHealth, ExamBuilderHealth,
} from './types';

// ============================================================================

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

function hoursSince(iso: string): number {
  const t = new Date(iso).getTime();
  return Math.max(0, (Date.now() - t) / (1000 * 60 * 60));
}

function daysSince(iso: string): number {
  return hoursSince(iso) / 24;
}

// ============================================================================
// Per-module scanners
// ============================================================================

async function scanFeedback(): Promise<FeedbackHealth> {
  let feedback: any;
  try { feedback = await import('../feedback/store'); } catch { feedback = null; }
  if (!feedback) {
    return {
      total_items: 0, by_status: {}, by_priority: {}, oldest_open_age_hours: 0,
      high_volume_topics: [], recent_application_count_7d: 0,
    };
  }

  const all = feedback.listFeedback();
  const by_status: Record<string, number> = {};
  const by_priority: Record<string, number> = {};
  let oldestOpenMs = Infinity;

  // States that count as "pending" (not yet resolved, not rejected/duplicate)
  const PENDING_STATES = new Set(['submitted', 'open', 'triaged', 'approved']);

  const itemSubmittedAt = (item: any): string =>
    item.submitted_at ?? item.submitted_by?.submitted_at ?? item.created_at ?? new Date().toISOString();

  for (const item of all) {
    by_status[item.status] = (by_status[item.status] ?? 0) + 1;
    if (item.priority) {
      by_priority[item.priority] = (by_priority[item.priority] ?? 0) + 1;
    }
    if (PENDING_STATES.has(item.status)) {
      const t = new Date(itemSubmittedAt(item)).getTime();
      if (t < oldestOpenMs) oldestOpenMs = t;
    }
  }

  // High-volume topics: ≥3 items on the same topic across ALL non-rejected
  // states. Applied items still count toward the topic signal — they
  // represent systemic issues that drove recent changes.
  const ACTIVE_STATES = new Set(['submitted', 'open', 'triaged', 'approved', 'applied']);
  const topicCounts: Record<string, number> = {};
  for (const item of all) {
    if (!ACTIVE_STATES.has(item.status)) continue;
    const tid = item.target?.topic_id;
    if (tid) topicCounts[tid] = (topicCounts[tid] ?? 0) + 1;
  }
  const high_volume_topics = Object.entries(topicCounts)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([topic_id, count]) => ({ topic_id, count }));

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent_application_count_7d = all.filter(
    i => i.applied_at && new Date(i.applied_at).getTime() > sevenDaysAgo,
  ).length;

  return {
    total_items: all.length,
    by_status,
    by_priority,
    oldest_open_age_hours: oldestOpenMs === Infinity ? 0 : Math.round((now - oldestOpenMs) / (1000 * 60 * 60)),
    high_volume_topics,
    recent_application_count_7d,
  };
}

async function scanSampleCheck(adapters: Array<{ exam_id: string }>): Promise<SampleCheckHealth> {
  let sc: any;
  try { sc = await import('../sample-check/store'); } catch { sc = null; }
  if (!sc) {
    return {
      open_samples_by_exam: [], total_open: 0,
      total_closed_resolved: 0, total_closed_superseded: 0,
      exams_with_no_sample: adapters.map(a => a.exam_id),
    };
  }

  const open_samples_by_exam: SampleCheckHealth['open_samples_by_exam'] = [];
  let total_open = 0, total_closed_resolved = 0, total_closed_superseded = 0;
  const exams_with_samples = new Set<string>();

  for (const adapter of adapters) {
    const samples = sc.listSamplesForExam(adapter.exam_id);
    if (samples.length > 0) exams_with_samples.add(adapter.exam_id);

    const openOnes = samples.filter((s: any) => s.status === 'open');
    if (openOnes.length > 0) {
      const oldestAge = Math.max(...openOnes.map((s: any) =>
        hoursSince(s.created_at ?? new Date().toISOString())));
      open_samples_by_exam.push({
        exam_id: adapter.exam_id, count: openOnes.length,
        oldest_age_hours: Math.round(oldestAge),
      });
      total_open += openOnes.length;
    }
    total_closed_resolved += samples.filter((s: any) => s.status === 'resolved').length;
    total_closed_superseded += samples.filter((s: any) => s.status === 'superseded').length;
  }

  const exams_with_no_sample = adapters
    .map(a => a.exam_id)
    .filter(eid => !exams_with_samples.has(eid));

  return {
    open_samples_by_exam, total_open,
    total_closed_resolved, total_closed_superseded,
    exams_with_no_sample,
  };
}

async function scanCourse(adapters: Array<{ exam_id: string }>): Promise<CourseHealth> {
  let course: any, feedback: any;
  try { course = await import('../course/promoter'); } catch { course = null; }
  try { feedback = await import('../feedback/store'); } catch { feedback = null; }

  if (!course) {
    return { live_courses: [], exams_without_course: adapters.map(a => a.exam_id), exams_with_pending_applied_feedback: [] };
  }

  const live_courses: CourseHealth['live_courses'] = [];
  const exams_with_course = new Set<string>();

  for (const adapter of adapters) {
    const c = course.getCourseByExam(adapter.exam_id);
    if (c) {
      exams_with_course.add(adapter.exam_id);
      const version = c.current_version?.value ?? 'unknown';
      const promotions = course.listPromotionRecords(adapter.exam_id);
      const latestPromo = promotions[promotions.length - 1];
      const last_promoted_at = latestPromo?.created_at ?? c.created_at ?? new Date().toISOString();
      live_courses.push({
        exam_id: adapter.exam_id,
        version,
        last_promoted_at,
        age_days_since_promotion: Math.round(daysSince(last_promoted_at) * 10) / 10,
      });
    }
  }

  const exams_without_course = adapters
    .map(a => a.exam_id)
    .filter(eid => !exams_with_course.has(eid));

  // Exams with applied feedback that hasn't been promoted into a newer
  // course version. Two scenarios:
  //   (a) There IS a live course, but applied_at > last_promoted_at
  //   (b) There's NO live course at all but applied feedback exists
  //       (content lives in sample-check stage, awaiting first promotion)
  const exams_with_pending_applied_feedback: CourseHealth['exams_with_pending_applied_feedback'] = [];
  if (feedback) {
    // Scenario (a)
    for (const lc of live_courses) {
      const applied = feedback.listFeedback({ exam_id: lc.exam_id, status: 'applied' });
      const promotedAt = new Date(lc.last_promoted_at).getTime();
      const pendingCount = applied.filter((f: any) =>
        new Date(f.applied_at ?? f.created_at ?? 0).getTime() > promotedAt,
      ).length;
      if (pendingCount > 0) {
        exams_with_pending_applied_feedback.push({ exam_id: lc.exam_id, pending_count: pendingCount });
      }
    }
    // Scenario (b)
    for (const eid of exams_without_course) {
      const applied = feedback.listFeedback({ exam_id: eid, status: 'applied' });
      if (applied.length > 0) {
        exams_with_pending_applied_feedback.push({ exam_id: eid, pending_count: applied.length });
      }
    }
  }

  return { live_courses, exams_without_course, exams_with_pending_applied_feedback };
}

async function scanAttention(): Promise<AttentionHealth> {
  let att: any;
  try { att = await import('../attention/store'); } catch { att = null; }

  // Attention store doesn't expose a list-all-users API; we report zeros
  // when no usage yet, and provide a best-effort summary otherwise.
  if (!att) {
    return { total_tracked_students: 0, trailing_7d_session_count: 0, top_deferred_topics: [], students_with_overdue_deferrals: 0 };
  }

  let users: any[] = [];
  try {
    // Try to read the underlying flat-file store if the module exposes it
    if (att._store?.read) users = att._store.read()?.coverages ?? [];
    else if (att.listAllCoverages) users = att.listAllCoverages();
  } catch { users = []; }

  const trailing_7d_session_count = users.reduce(
    (n, u) => n + (u.session_count_trailing_7d ?? 0), 0);

  const deferralMap: Record<string, { topic_id: string; difficulty: string; times_deferred: number; times_accumulated: number }> = {};
  let students_with_overdue_deferrals = 0;

  for (const u of users) {
    const defs = u.deferrals ?? [];
    if (defs.length > 0) students_with_overdue_deferrals++;
    for (const d of defs) {
      const key = `${d.topic_id}|${d.difficulty ?? 'medium'}`;
      if (!deferralMap[key]) {
        deferralMap[key] = { topic_id: d.topic_id, difficulty: d.difficulty ?? 'medium', times_deferred: 0, times_accumulated: 0 };
      }
      deferralMap[key].times_deferred += d.times_deferred ?? 1;
      deferralMap[key].times_accumulated++;
    }
  }
  const top_deferred_topics = Object.values(deferralMap)
    .sort((a, b) => b.times_deferred - a.times_deferred)
    .slice(0, 5);

  return {
    total_tracked_students: users.length,
    trailing_7d_session_count,
    top_deferred_topics,
    students_with_overdue_deferrals,
  };
}

async function scanMarketing(): Promise<MarketingHealth> {
  let blog: any, sync: any, campaign: any;
  try { blog = await import('../marketing/blog-store'); } catch { blog = null; }
  try { sync = await import('../marketing/sync-engine'); } catch { sync = null; }
  try { campaign = await import('../marketing/campaign-store'); } catch { campaign = null; }

  if (!blog) {
    return {
      article_totals: {}, stale_article_count: 0, stale_reasons_unique: [],
      published_without_campaign: 0, active_campaigns: 0,
      social_cards_total: 0, last_published_age_days: null,
    };
  }

  const all = blog.listArticles();
  const article_totals: Record<string, number> = {};
  for (const a of all) article_totals[a.status] = (article_totals[a.status] ?? 0) + 1;

  const published = all.filter((a: any) => a.status === 'published');
  const last_published = published
    .map((a: any) => a.published_at)
    .filter(Boolean)
    .sort()
    .pop();
  const last_published_age_days = last_published ? Math.round(daysSince(last_published)) : null;

  const dashboard = sync ? sync.getDashboardSummary() : null;
  const stale_article_count = article_totals['stale'] ?? 0;
  const stale_reasons_unique = dashboard?.sync_health?.stale_reasons_unique ?? [];

  let published_without_campaign = 0;
  let active_campaigns = 0;
  if (campaign) {
    const campaigns = campaign.listCampaigns();
    active_campaigns = campaigns.filter((c: any) => c.status === 'live').length;
    const articlesInCampaigns = new Set<string>();
    for (const c of campaigns) {
      if (c.status === 'live' || c.status === 'scheduled') {
        for (const aid of c.article_ids) articlesInCampaigns.add(aid);
      }
    }
    published_without_campaign = published.filter((a: any) => !articlesInCampaigns.has(a.id)).length;
  }

  return {
    article_totals,
    stale_article_count,
    stale_reasons_unique,
    published_without_campaign,
    active_campaigns,
    social_cards_total: dashboard?.asset_totals?.social_cards ?? 0,
    last_published_age_days,
  };
}

async function scanExamBuilder(): Promise<{ health: ExamBuilderHealth; adapters: any[] }> {
  let reg: any;
  try { reg = await import('../exam-builder/registry'); } catch { reg = null; }
  if (!reg) return { health: { registered_exams: [], total_adapters: 0 }, adapters: [] };

  const adapters = reg.listExamAdapters();
  const registered_exams = adapters.map((a: any) => ({
    exam_id: a.exam_id, exam_code: a.exam_code, exam_name: a.exam_name,
    topic_count: a.getSyllabusTopicIds?.()?.length ?? 0,
  }));
  return { health: { registered_exams, total_adapters: adapters.length }, adapters };
}

// ============================================================================
// Signal detection — pattern-matches health data
// ============================================================================

function detectSignals(modules: HealthReport['modules']): HealthSignal[] {
  const signals: HealthSignal[] = [];
  const now = new Date().toISOString();

  // Feedback: high-volume topic (3+ open items on same topic)
  for (const topic of modules.feedback.high_volume_topics) {
    signals.push({
      id: shortId('SIG'),
      severity: topic.count >= 5 ? 'critical' : 'warning',
      domain: 'feedback',
      code: 'feedback:high-volume-topic',
      headline: `${topic.count} open feedback items on topic '${topic.topic_id}'`,
      detail: `Topic '${topic.topic_id}' has ${topic.count} open or triaged feedback items. Consider content review on this topic.`,
      affected_entity_ids: [topic.topic_id],
      detected_at: now,
    });
  }

  // Feedback: aging open item
  if (modules.feedback.oldest_open_age_hours > 72) {
    signals.push({
      id: shortId('SIG'),
      severity: modules.feedback.oldest_open_age_hours > 168 ? 'critical' : 'warning',
      domain: 'feedback',
      code: 'feedback:stale-open-items',
      headline: `Oldest open feedback is ${Math.round(modules.feedback.oldest_open_age_hours)}h old`,
      detail: `Feedback items aging past 72 hours without triage indicate review backlog. Oldest item is ${Math.round(modules.feedback.oldest_open_age_hours / 24)} days old.`,
      detected_at: now,
    });
  }

  // Sample-check: aging open sample (>48h)
  for (const entry of modules.sample_check.open_samples_by_exam) {
    if (entry.oldest_age_hours > 48) {
      signals.push({
        id: shortId('SIG'),
        severity: entry.oldest_age_hours > 168 ? 'critical' : 'warning',
        domain: 'sample-check',
        code: 'sample-check:aging-sample',
        headline: `Sample check on ${entry.exam_id} is ${Math.round(entry.oldest_age_hours / 24)} days old`,
        detail: `Open sample check is aging — consider admin review/close.`,
        affected_entity_ids: [entry.exam_id],
        detected_at: now,
      });
    }
  }

  // Sample-check: exam has no sample at all
  for (const eid of modules.sample_check.exams_with_no_sample) {
    signals.push({
      id: shortId('SIG'),
      severity: 'warning',
      domain: 'sample-check',
      code: 'sample-check:exam-with-no-sample',
      headline: `Exam ${eid} has no sample-check ever created`,
      detail: `This exam adapter is registered but has never been through a build. Consider initializing.`,
      affected_entity_ids: [eid],
      detected_at: now,
    });
  }

  // Course: pending applied feedback
  for (const entry of modules.course.exams_with_pending_applied_feedback) {
    signals.push({
      id: shortId('SIG'),
      severity: entry.pending_count >= 3 ? 'warning' : 'info',
      domain: 'course',
      code: 'course:pending-feedback-not-promoted',
      headline: `${entry.pending_count} applied feedback items on ${entry.exam_id} not yet in a promoted course`,
      detail: `Applied feedback has accumulated but the course hasn't been iterate-promoted. Run an iterate build to ship the changes.`,
      affected_entity_ids: [entry.exam_id],
      detected_at: now,
    });
  }

  // Course: exam has no live course
  for (const eid of modules.course.exams_without_course) {
    signals.push({
      id: shortId('SIG'),
      severity: 'info',
      domain: 'course',
      code: 'course:exam-has-no-live-course',
      headline: `Exam ${eid} has no LiveCourse yet`,
      detail: `Adapter registered but no course shipped. Content corpus may be in sample-check stage only.`,
      affected_entity_ids: [eid],
      detected_at: now,
    });
  }

  // Course: stale promotion (>30 days without promotion and has applied feedback)
  for (const lc of modules.course.live_courses) {
    if (lc.age_days_since_promotion > 30) {
      signals.push({
        id: shortId('SIG'),
        severity: 'info',
        domain: 'course',
        code: 'course:aging-since-last-promotion',
        headline: `${lc.exam_id} course last promoted ${Math.round(lc.age_days_since_promotion)} days ago`,
        detail: `Consider reviewing whether recent feedback warrants an iterate-promote cycle.`,
        affected_entity_ids: [lc.exam_id],
        detected_at: now,
      });
    }
  }

  // Attention: deferred topics accumulating
  for (const topic of modules.attention.top_deferred_topics) {
    if (topic.times_deferred >= 5) {
      signals.push({
        id: shortId('SIG'),
        severity: 'warning',
        domain: 'attention',
        code: 'attention:rising-deferrals',
        headline: `Topic '${topic.topic_id}' deferred ${topic.times_deferred} times across students`,
        detail: `Students repeatedly deferring this topic suggests content is too heavy for short sessions OR the topic itself is avoided. Consider lighter-weight lessons or GBrain nudge adjustment.`,
        affected_entity_ids: [topic.topic_id],
        detected_at: now,
      });
    }
  }

  // Marketing: stale articles
  if (modules.marketing.stale_article_count > 0) {
    signals.push({
      id: shortId('SIG'),
      severity: modules.marketing.stale_article_count >= 3 ? 'warning' : 'info',
      domain: 'marketing',
      code: 'marketing:stale-articles',
      headline: `${modules.marketing.stale_article_count} articles marked stale by drift detection`,
      detail: `App feature changes triggered drift. Articles need re-review to update references, then re-publish.`,
      detected_at: now,
    });
  }

  // Marketing: published without campaign
  if (modules.marketing.published_without_campaign >= 2) {
    signals.push({
      id: shortId('SIG'),
      severity: 'info',
      domain: 'marketing',
      code: 'marketing:publish-gap-no-campaign',
      headline: `${modules.marketing.published_without_campaign} published articles have no active campaign`,
      detail: `Content exists but isn't being amplified. Opportunity to launch a multi-article campaign.`,
      detected_at: now,
    });
  }

  // Marketing: no publish in last 14 days
  if (modules.marketing.last_published_age_days !== null && modules.marketing.last_published_age_days > 14) {
    signals.push({
      id: shortId('SIG'),
      severity: 'info',
      domain: 'marketing',
      code: 'marketing:publishing-cadence-slow',
      headline: `Last published article was ${modules.marketing.last_published_age_days} days ago`,
      detail: `Content cadence has slowed. Consider whether new product/exam work justifies a fresh article.`,
      detected_at: now,
    });
  }

  return signals;
}

// ============================================================================
// Main entry point
// ============================================================================

export async function runScan(): Promise<HealthReport> {
  const t0 = Date.now();

  const { health: examHealth, adapters } = await scanExamBuilder();
  const feedbackH = await scanFeedback();
  const sampleH = await scanSampleCheck(adapters.map(a => ({ exam_id: a.exam_id })));
  const courseH = await scanCourse(adapters.map(a => ({ exam_id: a.exam_id })));
  const attentionH = await scanAttention();
  const marketingH = await scanMarketing();

  const modules = {
    feedback: feedbackH,
    sample_check: sampleH,
    course: courseH,
    attention: attentionH,
    marketing: marketingH,
    exam_builder: examHealth,
  };

  const signals = detectSignals(modules);

  const critical_count = signals.filter(s => s.severity === 'critical').length;
  const warning_count = signals.filter(s => s.severity === 'warning').length;
  const info_count = signals.filter(s => s.severity === 'info').length;

  let status: HealthReport['overall']['status'];
  let summary: string;
  if (critical_count > 0) {
    status = 'degraded';
    summary = `${critical_count} critical issues, ${warning_count} warnings`;
  } else if (warning_count > 0) {
    status = 'attention-needed';
    summary = `${warning_count} warnings, ${info_count} informational signals`;
  } else {
    status = 'healthy';
    summary = info_count > 0
      ? `System healthy. ${info_count} informational signals.`
      : 'System healthy. No signals detected.';
  }

  return {
    generated_at: new Date().toISOString(),
    generation_ms: Date.now() - t0,
    modules,
    signals,
    overall: { status, summary, critical_count, warning_count },
  };
}
