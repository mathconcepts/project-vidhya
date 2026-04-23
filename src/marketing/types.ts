// @ts-nocheck
/**
 * Marketing + Acquisition Module — types.
 *
 * The single source of truth is the Article. Everything downstream
 * (landing page layout, social media cards, acquisition funnel variants,
 * UTM tags) is DERIVED from the article corpus. When an article is
 * published, layout and social assets regenerate. When an app feature
 * referenced by an article changes, the article is marked stale.
 *
 * Design invariants:
 *
 *   1. ARTICLES ARE CONTENT-ADDRESSED. A SHA-256 hash of the
 *      normalized body content is the idempotency key. Updating an
 *      article with identical content is a no-op.
 *
 *   2. MANUAL REVIEW GATE. No article goes from draft to published
 *      without admin approval. The intermediate 'in_review' state
 *      parallels the sample-check workflow (v2.16.0).
 *
 *   3. LAYOUT IS DERIVED, NOT AUTHORED. Adding or removing an
 *      article triggers a layout recomputation. The layout engine
 *      is a pure function: (articles, config) → LandingPageLayout.
 *      Same inputs always produce same output.
 *
 *   4. SYNC IS EXPLICIT. Every article declares which app features
 *      it references. When features change, the sync engine flags
 *      affected articles as stale. No silent drift.
 *
 *   5. APPEND-ONLY LINEAGE. Every article carries a lineage[] of
 *      (version, content_hash, published_at) records. Never
 *      overwrite history.
 */

// ============================================================================
// ARTICLE — core content unit
// ============================================================================

export type ArticleStatus =
  /** Author still writing */
  | 'draft'
  /** Submitted for admin review */
  | 'in_review'
  /** Approved but not yet published (ready to deploy) */
  | 'approved'
  /** Live on the blog */
  | 'published'
  /** Referenced app feature changed; needs re-review */
  | 'stale'
  /** Retired (kept for lineage, not rendered) */
  | 'archived';

export type ArticleCategory =
  | 'exam-strategy'
  | 'concept-explainer'
  | 'product-announcement'
  | 'topper-interview'
  | 'parent-guide'
  | 'industry-opinion';

export interface Article {
  id: string;
  slug: string;                       // URL-safe; unique
  title: string;
  subtitle?: string;
  body_md: string;                    // Markdown content
  author: string;
  author_bio?: string;

  category: ArticleCategory;

  /** Which exams this article is relevant to */
  exam_scope: string[];               // exam_id list (e.g. ['EXM-UGEE-MATH-SAMPLE'])
  topic_ids: string[];                // e.g. ['calculus', 'algebra']

  /**
   * App feature identifiers referenced in the article body.
   * Used by the sync engine to detect drift when features change.
   * Format: 'feature:<domain>:<slug>' (e.g. 'feature:gbrain:mastery-fingerprint')
   */
  referenced_app_features: string[];

  status: ArticleStatus;
  content_hash: string;               // SHA-256 of normalized body
  version: string;                    // semver; bumps on content change

  /**
   * Append-only history. Every version promotion adds a record here.
   * Never mutated after write.
   */
  lineage: ArticleLineageEntry[];

  /**
   * Promotional metadata carried alongside the article.
   * Used by sync-engine to produce social cards and landing copy.
   */
  marketing_meta: ArticleMarketingMeta;

  /**
   * Review state — who reviewed, when, with what note.
   */
  review_history: ArticleReviewEntry[];

  /** Timestamps */
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
}

export interface ArticleLineageEntry {
  version: string;
  content_hash: string;
  published_at: string;
  changed_by: string;
  change_summary: string;
}

export interface ArticleReviewEntry {
  reviewed_at: string;
  reviewer: string;
  action: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'marked_stale';
  note?: string;
}

export interface ArticleMarketingMeta {
  /** A short, tweet-length hook (under 240 chars) for social amplification. */
  hook_copy: string;
  /** A paragraph-length body for LinkedIn / long-form social. */
  body_copy: string;
  /** Hashtags (without #), e.g. ['UGEE2026', 'IIITHyderabad']. */
  hashtags: string[];
  /** Image spec — structured description a designer/LLM can render. */
  image_spec?: {
    theme: string;
    primary_text: string;
    secondary_text?: string;
    suggested_palette: 'calm' | 'high-contrast' | 'warm' | 'monochrome';
  };
  /** Primary call-to-action link (UTM tags added by sync-engine). */
  cta_base_url: string;
  cta_label: string;
}

// ============================================================================
// LANDING PAGE LAYOUT — derived from the article corpus
// ============================================================================

export interface LandingPageLayout {
  id: string;                          // Content-hash of the layout itself
  computed_at: string;
  article_count: number;

  hero: LayoutHero;
  sections: LayoutSection[];
  cta_footer: LayoutCTA;

  /**
   * A running ticker showing what was added/changed recently. Useful
   * for proving the blog is alive without the visitor needing to scan
   * dates. Pulled from the last N published/updated articles.
   */
  whats_live_ticker: Array<{
    article_id: string;
    headline: string;
    relative_time: string;             // e.g. "yesterday", "3 days ago"
  }>;

  meta: {
    /** Exam scopes represented in the layout */
    exam_scopes_covered: string[];
    /** Categories represented */
    categories_covered: ArticleCategory[];
    /** The article IDs this layout renders */
    included_article_ids: string[];
  };
}

export interface LayoutHero {
  article_id: string;
  headline: string;
  subheadline?: string;
  cta_label: string;
  cta_href: string;                    // With UTM tags applied
}

export interface LayoutSection {
  kind: 'category' | 'exam-specific' | 'featured' | 'evergreen';
  title: string;
  subtitle?: string;
  article_ids: string[];
  /** When kind = 'exam-specific', which exam */
  exam_id?: string;
  /** When kind = 'category', which category */
  category?: ArticleCategory;
}

export interface LayoutCTA {
  headline: string;
  body: string;
  primary_label: string;
  primary_href: string;                // With UTM tags applied
  secondary_label?: string;
  secondary_href?: string;
}

// ============================================================================
// SOCIAL CARDS — generated per article, per platform
// ============================================================================

export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'whatsapp_status' | 'telegram_channel';

export interface SocialCard {
  id: string;
  article_id: string;
  article_version: string;             // Which version of the article this card represents
  platform: SocialPlatform;

  /** Final copy tuned to the platform's constraints */
  copy: {
    primary_text: string;               // The main message
    secondary_text?: string;            // Optional context line
    hook_opener: string;                // First line — has to stop the scroll
  };

  hashtags: string[];                   // Platform-specific subset of article hashtags
  cta_link: string;                     // Article URL with platform-specific UTM

  image_spec?: {
    theme: string;
    primary_text: string;
    palette: 'calm' | 'high-contrast' | 'warm' | 'monochrome';
    /** Platform-specific dimensions (e.g. 1200x675 for Twitter) */
    dimensions_hint: string;
  };

  /** Character counts for debugging / validation */
  _char_counts: {
    primary: number;
    limit: number;
    within_limit: boolean;
  };

  created_at: string;
  last_regenerated_at?: string;
}

// ============================================================================
// LANDING PAGE VARIANTS — acquisition funnel entries
// ============================================================================

export interface LandingVariant {
  id: string;
  article_id: string;                   // Which article this variant is for
  campaign_name: string;                // e.g. 'ugee-2026-q1-organic'
  channel: 'organic' | 'social-twitter' | 'social-linkedin' | 'social-instagram' | 'email' | 'referral' | 'paid-search';
  audience_segment?: string;            // e.g. 'dropper-students', 'parents', 'coaching-switchers'

  /** UTM tags applied to the article URL */
  utm: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  };

  /** Fully-assembled URL ready to distribute */
  full_url: string;

  /** Optional override copy for this specific variant */
  override_headline?: string;
  override_cta_label?: string;

  created_at: string;
  active: boolean;
}

// ============================================================================
// SYNC RECORD — ties article to its derived assets + tracks drift
// ============================================================================

export interface SyncRecord {
  id: string;
  article_id: string;
  article_version: string;

  /** IDs of derived assets for this article+version */
  social_card_ids: string[];
  landing_variant_ids: string[];

  /**
   * What this article depends on. If any of these change upstream,
   * the sync engine marks the article stale.
   */
  dependencies: {
    app_features: string[];             // Referenced app feature ids
    topic_ids: string[];                // Referenced topic ids
    exam_scope: string[];               // Referenced exam ids
  };

  /** Last drift check + result */
  last_drift_check_at: string;
  drift_status: 'in_sync' | 'stale' | 'unknown';
  drift_reasons: string[];              // Human-readable list when stale

  created_at: string;
  updated_at: string;
}

// ============================================================================
// SYNC BUS — event payloads for cross-module drift detection
// ============================================================================

export type SyncBusEvent =
  | { kind: 'article_published'; article_id: string; version: string }
  | { kind: 'article_updated'; article_id: string; version: string }
  | { kind: 'article_archived'; article_id: string }
  | { kind: 'app_feature_changed'; feature_id: string; change_summary: string; changed_at: string }
  | { kind: 'exam_content_promoted'; exam_id: string; course_version: string }
  | { kind: 'layout_recomputed'; layout_id: string; article_count: number };

export interface SyncBusSubscription {
  id: string;
  event_kind: SyncBusEvent['kind'] | '*';
  subscriber_module: string;            // e.g. 'marketing:sync-engine'
  handler_name: string;
  created_at: string;
}

// ============================================================================
// CAMPAIGN — coordinated multi-article / multi-channel push
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  objective: 'awareness' | 'acquisition' | 'activation' | 'retention' | 'education';
  exam_scope: string[];                 // Which exams this campaign targets

  /** Articles included in the campaign */
  article_ids: string[];

  /** Channel plan — which platforms get which social cards, when */
  channel_plan: Array<{
    platform: SocialPlatform;
    scheduled_start: string;            // ISO timestamp
    scheduled_end?: string;
    social_card_ids: string[];
  }>;

  /** Linked landing variants (auto-generated when campaign launched) */
  landing_variant_ids: string[];

  status: 'draft' | 'scheduled' | 'live' | 'concluded' | 'cancelled';
  created_at: string;
  launched_at?: string;
  concluded_at?: string;
}
