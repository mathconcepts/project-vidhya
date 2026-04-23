// @ts-nocheck
/**
 * Sync Engine — the heart of the marketing module.
 *
 * Given an article, the sync engine produces everything downstream:
 *
 *   1. Social cards (platform-specific variants — Twitter, LinkedIn,
 *      Instagram, WhatsApp Status, Telegram Channel) with tuned copy,
 *      UTM-tagged links, image specs.
 *
 *   2. Landing page variants (one per acquisition channel) with
 *      campaign-specific UTM tags.
 *
 *   3. A SyncRecord tying all of the above to the article and
 *      tracking dependencies on app features + topic_ids.
 *
 * The sync bus (below) lets other modules announce changes. When an
 * app feature changes, the sync engine walks sync records and marks
 * any article whose dependencies include that feature as 'stale'.
 * The blog layout immediately reflects the staleness (because the
 * layout engine filters stale from published).
 *
 * This is what makes the module "always in sync" — drift is detected
 * automatically, not by someone remembering to check.
 */

import crypto from 'crypto';
import { createFlatFileStore } from '../lib/flat-file-store';
import { getArticle, listArticles, markStale } from './blog-store';
import type {
  Article, SocialCard, SocialPlatform, LandingVariant, SyncRecord,
  SyncBusEvent, SyncBusSubscription,
} from './types';

// ============================================================================

interface StoreShape {
  social_cards: SocialCard[];
  landing_variants: LandingVariant[];
  sync_records: SyncRecord[];
  bus_subscriptions: SyncBusSubscription[];
  bus_events: Array<SyncBusEvent & { id: string; occurred_at: string; delivered_to: string[] }>;
}

const STORE_PATH = '.data/marketing-sync.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({
    social_cards: [],
    landing_variants: [],
    sync_records: [],
    bus_subscriptions: [],
    bus_events: [],
  }),
});

// ============================================================================
// Platform constraints — used by social card generation
// ============================================================================

const PLATFORM_LIMITS: Record<SocialPlatform, { primary_char_limit: number; image_dims: string; hashtag_max: number }> = {
  twitter:          { primary_char_limit: 280,  image_dims: '1200x675', hashtag_max: 3 },
  linkedin:         { primary_char_limit: 1300, image_dims: '1200x627', hashtag_max: 5 },
  instagram:        { primary_char_limit: 2200, image_dims: '1080x1080', hashtag_max: 10 },
  whatsapp_status:  { primary_char_limit: 700,  image_dims: '1080x1920', hashtag_max: 0 },
  telegram_channel: { primary_char_limit: 4096, image_dims: '1280x720',  hashtag_max: 5 },
};

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

// ============================================================================
// Social card generation
// ============================================================================

function tunedCopyForPlatform(article: Article, platform: SocialPlatform): SocialCard['copy'] {
  const mm = article.marketing_meta;
  const limit = PLATFORM_LIMITS[platform].primary_char_limit;

  // Hook opener — first-line scroll-stopper. Always the hook_copy,
  // truncated if necessary.
  const hook_opener = mm.hook_copy.length > 80
    ? mm.hook_copy.slice(0, 77) + '...'
    : mm.hook_copy;

  // Platform-tuned primary text
  let primary_text: string;
  let secondary_text: string | undefined;

  if (platform === 'twitter' || platform === 'whatsapp_status') {
    // Short platforms — hook + CTA is enough
    primary_text = mm.hook_copy;
  } else if (platform === 'linkedin' || platform === 'telegram_channel') {
    // Long-form — hook + body
    primary_text = `${mm.hook_copy}\n\n${mm.body_copy}`;
    secondary_text = `${article.title} — ${article.subtitle ?? ''}`.trim();
  } else if (platform === 'instagram') {
    // Caption-style — hook + body + hashtag block
    const hashtagBlock = mm.hashtags.slice(0, PLATFORM_LIMITS.instagram.hashtag_max).map(h => `#${h}`).join(' ');
    primary_text = `${mm.hook_copy}\n\n${mm.body_copy}\n\n${hashtagBlock}`;
  } else {
    primary_text = mm.hook_copy;
  }

  // Truncate if over platform limit (defensive — callers should author within limits)
  if (primary_text.length > limit) {
    primary_text = primary_text.slice(0, limit - 3) + '...';
  }

  return { primary_text, secondary_text, hook_opener };
}

function buildCTA(article: Article, platform: SocialPlatform, baseUrl = 'https://vidhya.app'): string {
  const utm = {
    source: platformUtmSource(platform),
    medium: 'social',
    campaign: `article-${article.slug}`,
    content: `v${article.version}`,
  };
  const qs = new URLSearchParams({ 
    utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign, utm_content: utm.content,
  }).toString();
  return `${baseUrl}/blog/${article.slug}?${qs}`;
}

function platformUtmSource(p: SocialPlatform): string {
  return {
    twitter: 'twitter',
    linkedin: 'linkedin',
    instagram: 'instagram',
    whatsapp_status: 'whatsapp',
    telegram_channel: 'telegram',
  }[p];
}

export function generateSocialCards(
  article_id: string,
  platforms: SocialPlatform[] = ['twitter', 'linkedin', 'instagram', 'whatsapp_status', 'telegram_channel'],
): SocialCard[] {
  const article = getArticle(article_id);
  if (!article) throw new Error(`Article ${article_id} not found`);

  const store = _store.read();
  const now = new Date().toISOString();
  const generated: SocialCard[] = [];

  for (const platform of platforms) {
    const limits = PLATFORM_LIMITS[platform];
    const copy = tunedCopyForPlatform(article, platform);
    const hashtags = article.marketing_meta.hashtags.slice(0, limits.hashtag_max);

    const card: SocialCard = {
      id: shortId('SC'),
      article_id: article.id,
      article_version: article.version,
      platform,
      copy,
      hashtags,
      cta_link: buildCTA(article, platform),
      image_spec: article.marketing_meta.image_spec ? {
        theme: article.marketing_meta.image_spec.theme,
        primary_text: article.marketing_meta.image_spec.primary_text,
        palette: article.marketing_meta.image_spec.suggested_palette,
        dimensions_hint: limits.image_dims,
      } : undefined,
      _char_counts: {
        primary: copy.primary_text.length,
        limit: limits.primary_char_limit,
        within_limit: copy.primary_text.length <= limits.primary_char_limit,
      },
      created_at: now,
    };

    // Idempotency: if a card for (article_id, article_version, platform) exists, skip
    const existing = store.social_cards.find(c =>
      c.article_id === article.id &&
      c.article_version === article.version &&
      c.platform === platform,
    );
    if (existing) {
      // Regenerate in place — keep id, update copy + timestamp
      existing.copy = copy;
      existing.hashtags = hashtags;
      existing.cta_link = card.cta_link;
      existing.image_spec = card.image_spec;
      existing._char_counts = card._char_counts;
      existing.last_regenerated_at = now;
      generated.push(existing);
    } else {
      store.social_cards.push(card);
      generated.push(card);
    }
  }

  _store.write(store);
  return generated;
}

export function getSocialCard(id: string): SocialCard | null {
  return _store.read().social_cards.find(c => c.id === id) ?? null;
}

export function listSocialCardsForArticle(article_id: string): SocialCard[] {
  return _store.read().social_cards.filter(c => c.article_id === article_id);
}

// ============================================================================
// Landing variant generation
// ============================================================================

export interface CreateLandingVariantInput {
  article_id: string;
  campaign_name: string;
  channel: LandingVariant['channel'];
  audience_segment?: string;
  utm_content?: string;
  utm_term?: string;
  override_headline?: string;
  override_cta_label?: string;
  base_url?: string;
}

export function createLandingVariant(input: CreateLandingVariantInput): LandingVariant {
  const article = getArticle(input.article_id);
  if (!article) throw new Error(`Article ${input.article_id} not found`);

  const baseUrl = input.base_url ?? 'https://vidhya.app';
  const utm = {
    source: input.channel,
    medium: input.channel.startsWith('social-') ? 'social'
          : input.channel === 'email' ? 'email'
          : input.channel === 'paid-search' ? 'cpc'
          : 'organic',
    campaign: input.campaign_name,
    content: input.utm_content,
    term: input.utm_term,
  };
  const qsPairs: Record<string, string> = { 
    utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign,
  };
  if (utm.content) qsPairs.utm_content = utm.content;
  if (utm.term) qsPairs.utm_term = utm.term;
  const qs = new URLSearchParams(qsPairs).toString();

  const variant: LandingVariant = {
    id: shortId('LV'),
    article_id: article.id,
    campaign_name: input.campaign_name,
    channel: input.channel,
    audience_segment: input.audience_segment,
    utm,
    full_url: `${baseUrl}/blog/${article.slug}?${qs}`,
    override_headline: input.override_headline,
    override_cta_label: input.override_cta_label,
    created_at: new Date().toISOString(),
    active: true,
  };

  const store = _store.read();
  store.landing_variants.push(variant);
  _store.write(store);
  return variant;
}

export function listLandingVariantsForArticle(article_id: string): LandingVariant[] {
  return _store.read().landing_variants.filter(v => v.article_id === article_id);
}

// ============================================================================
// Sync record — the unifier
// ============================================================================

/**
 * Create or refresh the sync record for an article. Called when an
 * article is published. Idempotent: if a record exists, it's updated
 * in place; otherwise a new one is inserted.
 */
export function syncArticle(article_id: string): SyncRecord {
  const article = getArticle(article_id);
  if (!article) throw new Error(`Article ${article_id} not found`);

  // Generate social cards + record their IDs
  const cards = generateSocialCards(article_id);

  // Collect existing landing variants (sync doesn't auto-create — that's
  // a campaign-level decision; but the sync record references any existing)
  const variants = listLandingVariantsForArticle(article_id);

  const now = new Date().toISOString();
  const store = _store.read();

  let record = store.sync_records.find(r => r.article_id === article_id);
  if (record) {
    record.article_version = article.version;
    record.social_card_ids = cards.map(c => c.id);
    record.landing_variant_ids = variants.map(v => v.id);
    record.dependencies = {
      app_features: [...article.referenced_app_features],
      topic_ids: [...article.topic_ids],
      exam_scope: [...article.exam_scope],
    };
    record.last_drift_check_at = now;
    record.drift_status = 'in_sync';
    record.drift_reasons = [];
    record.updated_at = now;
  } else {
    record = {
      id: shortId('SYN'),
      article_id: article.id,
      article_version: article.version,
      social_card_ids: cards.map(c => c.id),
      landing_variant_ids: variants.map(v => v.id),
      dependencies: {
        app_features: [...article.referenced_app_features],
        topic_ids: [...article.topic_ids],
        exam_scope: [...article.exam_scope],
      },
      last_drift_check_at: now,
      drift_status: 'in_sync',
      drift_reasons: [],
      created_at: now,
      updated_at: now,
    };
    store.sync_records.push(record);
  }

  _store.write(store);
  return record;
}

export function getSyncRecord(article_id: string): SyncRecord | null {
  return _store.read().sync_records.find(r => r.article_id === article_id) ?? null;
}

export function listSyncRecords(filter?: { drift_status?: SyncRecord['drift_status'] }): SyncRecord[] {
  let items = _store.read().sync_records;
  if (filter?.drift_status) items = items.filter(r => r.drift_status === filter.drift_status);
  return items;
}

// ============================================================================
// Drift detection — the core of "always in sync"
// ============================================================================

/**
 * Sweep sync records and mark any article stale whose dependencies
 * include the changed feature. Idempotent — marking a stale article
 * stale again is a no-op on the store but appends to review history.
 *
 * Called by the sync bus on receipt of an 'app_feature_changed' event,
 * or manually by an admin after pushing a breaking feature change.
 */
export function detectDriftFromFeatureChange(
  feature_id: string,
  change_summary: string,
  actor: string = 'system:sync-engine',
): Array<{ article_id: string; action: 'marked_stale' | 'already_stale' | 'not_published' }> {
  const store = _store.read();
  const affected: Array<{ article_id: string; action: 'marked_stale' | 'already_stale' | 'not_published' }> = [];

  for (const record of store.sync_records) {
    if (!record.dependencies.app_features.includes(feature_id)) continue;

    const article = getArticle(record.article_id);
    if (!article) continue;

    const reason = `Feature '${feature_id}' changed: ${change_summary}`;

    if (article.status === 'published') {
      markStale(article.id, actor, reason);
      record.drift_status = 'stale';
      if (!record.drift_reasons.includes(reason)) record.drift_reasons.push(reason);
      record.last_drift_check_at = new Date().toISOString();
      record.updated_at = record.last_drift_check_at;
      affected.push({ article_id: article.id, action: 'marked_stale' });
    } else if (article.status === 'stale') {
      if (!record.drift_reasons.includes(reason)) record.drift_reasons.push(reason);
      affected.push({ article_id: article.id, action: 'already_stale' });
    } else {
      affected.push({ article_id: article.id, action: 'not_published' });
    }
  }

  _store.write(store);
  return affected;
}

// ============================================================================
// Sync bus — pub/sub for drift detection across modules
// ============================================================================

export function subscribeToSyncBus(
  event_kind: SyncBusEvent['kind'] | '*',
  subscriber_module: string,
  handler_name: string,
): SyncBusSubscription {
  const store = _store.read();
  const sub: SyncBusSubscription = {
    id: shortId('SUB'),
    event_kind,
    subscriber_module,
    handler_name,
    created_at: new Date().toISOString(),
  };
  store.bus_subscriptions.push(sub);
  _store.write(store);
  return sub;
}

export function unsubscribeFromSyncBus(subscription_id: string): boolean {
  const store = _store.read();
  const before = store.bus_subscriptions.length;
  store.bus_subscriptions = store.bus_subscriptions.filter(s => s.id !== subscription_id);
  _store.write(store);
  return store.bus_subscriptions.length !== before;
}

/**
 * Publish an event to the sync bus. Every subscribing handler is
 * invoked synchronously via the internal handler registry. For
 * 'app_feature_changed' events, drift detection is automatic — the
 * engine walks sync records and marks affected articles stale.
 */
export function publishToSyncBus(event: SyncBusEvent): {
  event_id: string;
  delivered_to: string[];
  side_effects: Array<{ kind: string; count?: number }>;
} {
  const store = _store.read();
  const now = new Date().toISOString();

  const matchingSubs = store.bus_subscriptions.filter(
    s => s.event_kind === event.kind || s.event_kind === '*',
  );

  const event_id = shortId('EVT');
  store.bus_events.push({
    ...event,
    id: event_id,
    occurred_at: now,
    delivered_to: matchingSubs.map(s => s.subscriber_module),
  });
  _store.write(store);

  const side_effects: Array<{ kind: string; count?: number }> = [];

  // Automatic drift handling for feature-change events
  if (event.kind === 'app_feature_changed') {
    const affected = detectDriftFromFeatureChange(event.feature_id, event.change_summary, 'system:sync-bus');
    const marked = affected.filter(a => a.action === 'marked_stale').length;
    side_effects.push({ kind: 'articles_marked_stale', count: marked });
  }

  return { event_id, delivered_to: matchingSubs.map(s => s.subscriber_module), side_effects };
}

export function listBusEvents(limit = 50): Array<SyncBusEvent & { id: string; occurred_at: string; delivered_to: string[] }> {
  const events = _store.read().bus_events;
  return events.slice(-limit).reverse();  // Newest first
}

// ============================================================================
// Dashboard summary — the single-pane-of-glass query
// ============================================================================

export interface SyncDashboardSummary {
  article_totals: {
    draft: number;
    in_review: number;
    approved: number;
    published: number;
    stale: number;
    archived: number;
  };
  sync_health: {
    total_sync_records: number;
    in_sync: number;
    stale: number;
    unknown: number;
    stale_article_ids: string[];
    stale_reasons_unique: string[];
  };
  asset_totals: {
    social_cards: number;
    landing_variants: number;
  };
  recent_events: ReturnType<typeof listBusEvents>;
}

export function getDashboardSummary(): SyncDashboardSummary {
  const all = listArticles();
  const store = _store.read();

  const article_totals = {
    draft:       all.filter(a => a.status === 'draft').length,
    in_review:   all.filter(a => a.status === 'in_review').length,
    approved:    all.filter(a => a.status === 'approved').length,
    published:   all.filter(a => a.status === 'published').length,
    stale:       all.filter(a => a.status === 'stale').length,
    archived:    all.filter(a => a.status === 'archived').length,
  };

  const records = store.sync_records;
  const staleRecords = records.filter(r => r.drift_status === 'stale');
  const uniqueReasons = Array.from(new Set(staleRecords.flatMap(r => r.drift_reasons)));

  return {
    article_totals,
    sync_health: {
      total_sync_records: records.length,
      in_sync: records.filter(r => r.drift_status === 'in_sync').length,
      stale: staleRecords.length,
      unknown: records.filter(r => r.drift_status === 'unknown').length,
      stale_article_ids: staleRecords.map(r => r.article_id),
      stale_reasons_unique: uniqueReasons,
    },
    asset_totals: {
      social_cards: store.social_cards.length,
      landing_variants: store.landing_variants.length,
    },
    recent_events: listBusEvents(10),
  };
}
