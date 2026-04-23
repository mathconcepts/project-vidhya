// @ts-nocheck
/**
 * Campaign Store — coordinated multi-article, multi-channel marketing pushes.
 *
 * A campaign bundles:
 *   - a set of articles targeting a specific objective (awareness,
 *     acquisition, activation, retention, education)
 *   - a channel plan (which platforms, when, which social cards)
 *   - landing variants with campaign-level UTM tags
 *
 * Campaigns are the connective tissue between content (articles),
 * distribution (social cards + landing variants), and goals
 * (acquisition funnel events).
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import { getArticle } from './blog-store';
import { generateSocialCards, createLandingVariant } from './sync-engine';
import type { Campaign, SocialPlatform } from './types';

// ============================================================================

interface StoreShape {
  campaigns: Campaign[];
}

const STORE_PATH = '.data/marketing-campaigns.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ campaigns: [] }),
});

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

// ============================================================================

export interface CreateCampaignInput {
  name: string;
  objective: Campaign['objective'];
  exam_scope: string[];
  article_ids: string[];
  channel_plan: Array<{
    platform: SocialPlatform;
    scheduled_start: string;
    scheduled_end?: string;
    /** If omitted, sync engine generates social cards automatically on launch */
    social_card_ids?: string[];
  }>;
}

export function createCampaign(input: CreateCampaignInput): Campaign {
  // Validate article existence
  for (const aid of input.article_ids) {
    const a = getArticle(aid);
    if (!a) throw new Error(`Article ${aid} referenced by campaign does not exist`);
  }

  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: shortId('CMP'),
    name: input.name,
    objective: input.objective,
    exam_scope: [...input.exam_scope],
    article_ids: [...input.article_ids],
    channel_plan: input.channel_plan.map(cp => ({
      platform: cp.platform,
      scheduled_start: cp.scheduled_start,
      scheduled_end: cp.scheduled_end,
      social_card_ids: cp.social_card_ids ?? [],
    })),
    landing_variant_ids: [],
    status: 'draft',
    created_at: now,
  };

  const store = _store.read();
  store.campaigns.push(campaign);
  _store.write(store);
  return campaign;
}

/**
 * Launch a campaign — generates social cards for each article × platform
 * pair in the channel plan (if not already specified), creates landing
 * variants per channel, and flips status to 'live'. Idempotent for
 * social-card generation.
 */
export function launchCampaign(campaign_id: string): Campaign {
  const store = _store.read();
  const campaign = store.campaigns.find(c => c.id === campaign_id);
  if (!campaign) throw new Error(`Campaign ${campaign_id} not found`);
  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    throw new Error(`Cannot launch campaign in status '${campaign.status}'`);
  }

  // Generate social cards for every article × platform combination
  for (const plan of campaign.channel_plan) {
    if (plan.social_card_ids && plan.social_card_ids.length > 0) continue; // Pre-specified
    const allCardIds: string[] = [];
    for (const article_id of campaign.article_ids) {
      const cards = generateSocialCards(article_id, [plan.platform]);
      allCardIds.push(...cards.map(c => c.id));
    }
    plan.social_card_ids = allCardIds;
  }

  // Create landing variants — one per (article × channel inferred from platforms)
  const channels = inferChannelsFromPlatforms(campaign.channel_plan.map(p => p.platform));
  const variantIds: string[] = [];
  for (const article_id of campaign.article_ids) {
    for (const channel of channels) {
      const v = createLandingVariant({
        article_id,
        campaign_name: campaign.name,
        channel,
        utm_content: `campaign-${campaign.id}`,
      });
      variantIds.push(v.id);
    }
  }
  campaign.landing_variant_ids = variantIds;

  campaign.status = 'live';
  campaign.launched_at = new Date().toISOString();
  _store.write(store);
  return campaign;
}

export function concludeCampaign(campaign_id: string): Campaign {
  const store = _store.read();
  const campaign = store.campaigns.find(c => c.id === campaign_id);
  if (!campaign) throw new Error(`Campaign ${campaign_id} not found`);
  campaign.status = 'concluded';
  campaign.concluded_at = new Date().toISOString();
  _store.write(store);
  return campaign;
}

export function getCampaign(id: string): Campaign | null {
  return _store.read().campaigns.find(c => c.id === id) ?? null;
}

export function listCampaigns(filter?: { status?: Campaign['status']; objective?: Campaign['objective']; exam_id?: string }): Campaign[] {
  let items = _store.read().campaigns;
  if (filter?.status) items = items.filter(c => c.status === filter.status);
  if (filter?.objective) items = items.filter(c => c.objective === filter.objective);
  if (filter?.exam_id) items = items.filter(c => c.exam_scope.includes(filter.exam_id!));
  return items;
}

// ============================================================================

function inferChannelsFromPlatforms(platforms: SocialPlatform[]): Array<'social-twitter' | 'social-linkedin' | 'social-instagram' | 'email' | 'organic'> {
  const channels = new Set<any>();
  for (const p of platforms) {
    if (p === 'twitter') channels.add('social-twitter');
    else if (p === 'linkedin') channels.add('social-linkedin');
    else if (p === 'instagram') channels.add('social-instagram');
    // whatsapp_status + telegram_channel map to organic since they're push channels
    else channels.add('organic');
  }
  return Array.from(channels);
}
