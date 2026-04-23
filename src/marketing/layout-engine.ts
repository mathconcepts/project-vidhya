// @ts-nocheck
/**
 * Layout Engine — pure function from articles → landing-page layout.
 *
 * Invariants:
 *
 *   1. PURE. Given the same input articles and config, always returns
 *      the same layout. No randomness, no time-of-day dependence
 *      beyond the explicit "now" parameter.
 *
 *   2. ONLY PUBLISHED ARTICLES CONTRIBUTE. Drafts, in-review, stale,
 *      archived — all excluded from the rendered layout. Stale
 *      articles remain visible in the admin ticker as "needs attention".
 *
 *   3. HERO SELECTION IS DETERMINISTIC. Newest high-priority article
 *      in this order: product-announcement > topper-interview > others.
 *      Ties broken by published_at (most recent wins).
 *
 *   4. SECTIONS AUTO-GENERATE. The engine groups articles by exam_scope
 *      (when scope is narrow) or by category (when scope is broad).
 *      Empty sections are omitted — no "Coming Soon" placeholders.
 *
 *   5. LAYOUT HAS A CONTENT HASH. The layout itself is content-addressed
 *      so the sync engine can tell when the layout actually changed vs.
 *      when it recomputed to the same result.
 */

import crypto from 'crypto';
import type {
  Article, ArticleCategory, LandingPageLayout, LayoutSection, LayoutHero, LayoutCTA,
} from './types';

// ============================================================================

export interface LayoutConfig {
  /** Max articles per section */
  max_per_section?: number;
  /** How many articles to include in the whats_live_ticker */
  ticker_size?: number;
  /** Footer CTA override (if omitted, a default is generated) */
  cta_footer?: LayoutCTA;
  /** Base URL for CTAs (UTM tags are added by sync-engine, not here) */
  app_base_url?: string;
}

const DEFAULTS: Required<Pick<LayoutConfig, 'max_per_section' | 'ticker_size' | 'app_base_url'>> = {
  max_per_section: 6,
  ticker_size: 5,
  app_base_url: 'https://vidhya.app',
};

// ============================================================================

export function computeLayout(
  articles: Article[],
  config: LayoutConfig = {},
  now: string = new Date().toISOString(),
): LandingPageLayout {
  const cfg = { ...DEFAULTS, ...config };
  const published = articles.filter(a => a.status === 'published');

  // Defensive: layout still needs to be well-formed if corpus is empty
  if (published.length === 0) {
    return emptyLayout(now, cfg);
  }

  // Sort by published_at desc for newest-first ordering
  const sorted = [...published].sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));

  const hero = selectHero(sorted, cfg);
  const sections = buildSections(sorted, cfg, hero.article_id);
  const ticker = buildTicker(sorted, cfg.ticker_size!, now);
  const cta_footer = cfg.cta_footer ?? defaultCTA(cfg.app_base_url!);

  const exam_scopes_covered = Array.from(new Set(sorted.flatMap(a => a.exam_scope)));
  const categories_covered = Array.from(new Set(sorted.map(a => a.category)));

  const layoutBody = {
    computed_at: now,
    article_count: published.length,
    hero,
    sections,
    cta_footer,
    whats_live_ticker: ticker,
    meta: {
      exam_scopes_covered,
      categories_covered,
      included_article_ids: sorted.map(a => a.id),
    },
  };

  const id = computeLayoutHash(layoutBody);

  return { id, ...layoutBody };
}

// ============================================================================
// Hero selection — priority: announcement > interview > newest
// ============================================================================

const HERO_CATEGORY_RANK: Record<ArticleCategory, number> = {
  'product-announcement': 1,
  'topper-interview': 2,
  'exam-strategy': 3,
  'concept-explainer': 4,
  'parent-guide': 5,
  'industry-opinion': 6,
};

function selectHero(sorted: Article[], cfg: Required<Pick<LayoutConfig, 'app_base_url'>>): LayoutHero {
  // Copy + sort by (category rank asc, published_at desc)
  const byPriority = [...sorted].sort((a, b) => {
    const rA = HERO_CATEGORY_RANK[a.category] ?? 99;
    const rB = HERO_CATEGORY_RANK[b.category] ?? 99;
    if (rA !== rB) return rA - rB;
    return (b.published_at ?? '').localeCompare(a.published_at ?? '');
  });
  const best = byPriority[0];
  return {
    article_id: best.id,
    headline: best.title,
    subheadline: best.subtitle,
    cta_label: best.marketing_meta.cta_label,
    cta_href: `${cfg.app_base_url}/blog/${best.slug}`,   // UTM added by sync-engine
  };
}

// ============================================================================
// Section construction — exam-specific first, then category
// ============================================================================

function buildSections(
  sorted: Article[],
  cfg: Required<Pick<LayoutConfig, 'max_per_section'>>,
  heroId: string,
): LayoutSection[] {
  const sections: LayoutSection[] = [];
  const usedIds = new Set<string>([heroId]);

  // Exam-specific sections (one per exam scope that has ≥2 articles)
  const byExam = new Map<string, Article[]>();
  for (const a of sorted) {
    for (const e of a.exam_scope) {
      if (!byExam.has(e)) byExam.set(e, []);
      byExam.get(e)!.push(a);
    }
  }
  for (const [exam_id, articles] of byExam) {
    if (articles.length < 2) continue;
    const picked = articles.filter(a => !usedIds.has(a.id)).slice(0, cfg.max_per_section);
    if (picked.length === 0) continue;
    sections.push({
      kind: 'exam-specific',
      title: labelForExam(exam_id),
      subtitle: `Articles for ${labelForExam(exam_id)}`,
      article_ids: picked.map(a => a.id),
      exam_id,
    });
    picked.forEach(a => usedIds.add(a.id));
  }

  // Category sections — group remaining articles
  const byCategory = new Map<ArticleCategory, Article[]>();
  for (const a of sorted) {
    if (usedIds.has(a.id)) continue;
    if (!byCategory.has(a.category)) byCategory.set(a.category, []);
    byCategory.get(a.category)!.push(a);
  }
  // Emit category sections in stable order
  const catOrder: ArticleCategory[] = [
    'exam-strategy', 'concept-explainer', 'topper-interview',
    'parent-guide', 'industry-opinion', 'product-announcement',
  ];
  for (const cat of catOrder) {
    const list = byCategory.get(cat) ?? [];
    if (list.length === 0) continue;
    sections.push({
      kind: 'category',
      title: labelForCategory(cat),
      article_ids: list.slice(0, cfg.max_per_section).map(a => a.id),
      category: cat,
    });
    list.slice(0, cfg.max_per_section).forEach(a => usedIds.add(a.id));
  }

  return sections;
}

// ============================================================================
// Ticker — what's live, newest-first
// ============================================================================

function buildTicker(
  sorted: Article[],
  size: number,
  now: string,
): LandingPageLayout['whats_live_ticker'] {
  return sorted.slice(0, size).map(a => ({
    article_id: a.id,
    headline: a.title,
    relative_time: formatRelative(a.published_at ?? a.created_at, now),
  }));
}

function formatRelative(whenISO: string, nowISO: string): string {
  const when = new Date(whenISO).getTime();
  const now = new Date(nowISO).getTime();
  const hours = Math.floor((now - when) / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

// ============================================================================
// Default CTA footer
// ============================================================================

function defaultCTA(baseUrl: string): LayoutCTA {
  return {
    headline: 'Ready to prep smarter?',
    body: 'World-class prep. Without the world-class stress. Every five minutes of practice compounds into real competence.',
    primary_label: 'Start free',
    primary_href: `${baseUrl}/signup`,
    secondary_label: 'See the product',
    secondary_href: `${baseUrl}/product`,
  };
}

// ============================================================================
// Empty layout — valid shape when no articles published yet
// ============================================================================

function emptyLayout(now: string, cfg: Required<Pick<LayoutConfig, 'app_base_url'>>): LandingPageLayout {
  const hero: LayoutHero = {
    article_id: '',
    headline: 'World-class prep. Without the world-class stress.',
    subheadline: 'Every five minutes of practice compounds into real competence.',
    cta_label: 'Start free',
    cta_href: `${cfg.app_base_url}/signup`,
  };
  const body = {
    computed_at: now,
    article_count: 0,
    hero,
    sections: [],
    cta_footer: defaultCTA(cfg.app_base_url),
    whats_live_ticker: [],
    meta: { exam_scopes_covered: [], categories_covered: [], included_article_ids: [] },
  };
  return { id: computeLayoutHash(body), ...body };
}

// ============================================================================
// Labels
// ============================================================================

function labelForExam(exam_id: string): string {
  const table: Record<string, string> = {
    'EXM-BITSAT-MATH-SAMPLE': 'BITSAT Mathematics',
    'EXM-UGEE-MATH-SAMPLE': 'UGEE IIIT Hyderabad',
  };
  return table[exam_id] ?? exam_id;
}

function labelForCategory(c: ArticleCategory): string {
  const table: Record<ArticleCategory, string> = {
    'exam-strategy': 'Exam Strategy',
    'concept-explainer': 'Concept Explainers',
    'product-announcement': 'What\'s New',
    'topper-interview': 'Topper Interviews',
    'parent-guide': 'For Parents',
    'industry-opinion': 'Opinion',
  };
  return table[c];
}

// ============================================================================
// Layout content-hash
// ============================================================================

function computeLayoutHash(body: any): string {
  // Canonical stringify — keys sorted for stable hashing
  const stable = JSON.stringify(body, Object.keys(body).sort());
  return 'LO-' + crypto.createHash('sha256').update(stable).digest('hex').slice(0, 12);
}
