// @ts-nocheck
/**
 * src/content/community.ts
 *
 * Owning agent: community-content-specialist (under acquisition-manager).
 *
 * Manages the bridge between this repo and the separate community
 * content repo (proposed: mathconcepts/project-vidhya-content).
 *
 * Three responsibilities:
 *   1. read content.pin to know which SHA this deployment targets
 *   2. expose the set of available community bundles (STUB for now —
 *      returns empty until the repo exists)
 *   3. manage per-user subscriptions to content bundles
 *
 * Subscriptions give us the "selected content can be routed to a
 * particular user" capability — users subscribe to e.g.
 * "bitsat-quality-2026" and the content-router will prefer that
 * bundle's explainers over the default.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const SUBSCRIPTIONS_PATH = '.data/content-subscriptions.json';
const PIN_PATH           = 'content.pin';
const COMMUNITY_DIR      = '.data/community-content';

// ─── Subscription model ──────────────────────────────────────────────

export interface UserSubscription {
  bundles: string[];                        // e.g. ["bitsat-quality-2026"]
  exclude_sources: string[];                // e.g. ["generated"] to opt out of LLM-gen
  subscribed_at: string;
  updated_at: string;
}

interface SubscriptionStore {
  users: Record<string, UserSubscription>;
}

// ─── content.pin ─────────────────────────────────────────────────────

export interface ContentPin {
  repo: string;               // "mathconcepts/project-vidhya-content"
  sha: string;                // pinned commit SHA
  pinned_at: string;          // ISO date the pin was bumped
  stub?: boolean;             // true if repo doesn't exist yet
}

/**
 * Read the content.pin file. If the file doesn't exist OR the SHA
 * points at a non-existent repo, return a stub so the router can
 * fall back to the shipped default bundle.
 */
export function readContentPin(): ContentPin {
  if (!existsSync(PIN_PATH)) {
    return {
      repo: 'mathconcepts/project-vidhya-content',
      sha: 'pending',
      pinned_at: new Date().toISOString().slice(0, 10),
      stub: true,
    };
  }
  try {
    const raw = readFileSync(PIN_PATH, 'utf-8');
    const lines = raw.split('\n');
    const fields: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...rest] = trimmed.split(':');
      if (k && rest.length) fields[k.trim()] = rest.join(':').trim();
    }
    return {
      repo: fields.repo ?? 'mathconcepts/project-vidhya-content',
      sha:  fields.sha  ?? 'pending',
      pinned_at: fields.pinned_at ?? new Date().toISOString().slice(0, 10),
      stub: fields.sha === 'pending' || !fields.sha,
    };
  } catch {
    return {
      repo: 'mathconcepts/project-vidhya-content',
      sha: 'pending',
      pinned_at: new Date().toISOString().slice(0, 10),
      stub: true,
    };
  }
}

// ─── Community bundles (stub) ────────────────────────────────────────

export interface Bundle {
  id:          string;            // e.g. "bitsat-quality-2026"
  name:        string;            // human-readable
  description: string;
  concept_count: number;
  verified:    boolean;           // whether verification-manager has signed off
}

/**
 * List all community bundles currently available. In stub mode
 * (content repo doesn't exist yet), returns an empty list + a note.
 *
 * When the repo exists, scripts/content-sync.ts will populate
 * COMMUNITY_DIR with bundle manifests that this function reads.
 */
export function listCommunityBundles(): { bundles: Bundle[]; mode: 'stub' | 'live'; pin: ContentPin } {
  const pin = readContentPin();
  if (pin.stub || !existsSync(COMMUNITY_DIR)) {
    return { bundles: [], mode: 'stub', pin };
  }
  // Live mode — read manifests from COMMUNITY_DIR
  try {
    const bundlesDir = path.join(COMMUNITY_DIR, 'bundles');
    if (!existsSync(bundlesDir)) return { bundles: [], mode: 'live', pin };
    const fs = require('fs') as typeof import('fs');
    const files = fs.readdirSync(bundlesDir);
    const bundles: Bundle[] = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try {
        const raw = JSON.parse(readFileSync(path.join(bundlesDir, f), 'utf-8'));
        bundles.push({
          id: raw.id ?? f.replace(/\.json$/, ''),
          name: raw.name ?? f,
          description: raw.description ?? '',
          concept_count: raw.concepts?.length ?? 0,
          verified: !!raw.verified,
        });
      } catch { /* skip malformed */ }
    }
    return { bundles, mode: 'live', pin };
  } catch {
    return { bundles: [], mode: 'live', pin };
  }
}

/**
 * Look up a community-contributed content record for a given
 * concept_id within a given bundle. Returns null if not present.
 */
export function findCommunityContent(bundle_id: string, concept_id: string): {
  body: string; source_ref: string; licence: string;
} | null {
  if (!existsSync(COMMUNITY_DIR)) return null;
  const contentPath = path.join(COMMUNITY_DIR, 'concepts', concept_id, 'explainer.md');
  if (!existsSync(contentPath)) return null;
  const bundleManifestPath = path.join(COMMUNITY_DIR, 'bundles', `${bundle_id}.json`);
  if (!existsSync(bundleManifestPath)) return null;

  try {
    const manifest = JSON.parse(readFileSync(bundleManifestPath, 'utf-8'));
    if (!(manifest.concepts ?? []).includes(concept_id)) return null;
    return {
      body: readFileSync(contentPath, 'utf-8'),
      source_ref: `community:${bundle_id}:${concept_id}`,
      licence: manifest.licence ?? 'community-unknown',
    };
  } catch {
    return null;
  }
}

// ─── User subscriptions ──────────────────────────────────────────────

function _loadStore(): SubscriptionStore {
  if (!existsSync(SUBSCRIPTIONS_PATH)) return { users: {} };
  try {
    return JSON.parse(readFileSync(SUBSCRIPTIONS_PATH, 'utf-8'));
  } catch {
    return { users: {} };
  }
}

function _saveStore(s: SubscriptionStore): void {
  mkdirSync(path.dirname(SUBSCRIPTIONS_PATH), { recursive: true });
  writeFileSync(SUBSCRIPTIONS_PATH, JSON.stringify(s, null, 2));
}

export function getUserSubscriptions(user_id: string): UserSubscription {
  const store = _loadStore();
  return store.users[user_id] ?? {
    bundles: [],
    exclude_sources: [],
    subscribed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function subscribeToBundle(user_id: string, bundle_id: string): UserSubscription {
  const store = _loadStore();
  const existing = store.users[user_id] ?? {
    bundles: [],
    exclude_sources: [],
    subscribed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!existing.bundles.includes(bundle_id)) {
    existing.bundles.push(bundle_id);
  }
  existing.updated_at = new Date().toISOString();
  store.users[user_id] = existing;
  _saveStore(store);
  return existing;
}

export function unsubscribeFromBundle(user_id: string, bundle_id: string): UserSubscription {
  const store = _loadStore();
  const existing = store.users[user_id];
  if (existing) {
    existing.bundles = existing.bundles.filter(b => b !== bundle_id);
    existing.updated_at = new Date().toISOString();
    store.users[user_id] = existing;
    _saveStore(store);
    return existing;
  }
  return {
    bundles: [],
    exclude_sources: [],
    subscribed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function setExcludeSources(user_id: string, sources: string[]): UserSubscription {
  const store = _loadStore();
  const existing = store.users[user_id] ?? {
    bundles: [],
    exclude_sources: [],
    subscribed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  existing.exclude_sources = [...new Set(sources)];
  existing.updated_at = new Date().toISOString();
  store.users[user_id] = existing;
  _saveStore(store);
  return existing;
}

/**
 * Called during hard-delete by data-rights-specialist. Drops the
 * user's subscription row. Safe to call even if user had none.
 */
export function dropUserSubscriptions(user_id: string): boolean {
  const store = _loadStore();
  if (!store.users[user_id]) return false;
  delete store.users[user_id];
  _saveStore(store);
  return true;
}
