// @ts-nocheck
/**
 * src/orchestrator/health.ts
 *
 * Per-module health-check aggregation. Each module declares a
 * health_check path in modules.yaml; this file resolves and runs
 * them, aggregating into an org-level health response.
 *
 * For this first cut, health checks are declarative rather than
 * invoked-function — every module has a lightweight probe defined
 * in health-checks.ts. The aggregation runs them and returns:
 *
 *   { ok, modules: [{ name, status, detail, latency_ms }], errors }
 */

import { loadRegistry } from './registry';
import { existsSync, statSync } from 'fs';

export interface ModuleHealth {
  name:        string;
  status:      'healthy' | 'degraded' | 'unavailable';
  detail:      string;
  latency_ms:  number;
  // for modules that have pin-file / subrepo:
  pin?:        { sha: string; stub: boolean } | null;
}

export interface OrgHealth {
  ok:          boolean;
  computed_at: string;
  modules:     ModuleHealth[];
  summary: {
    healthy:      number;
    degraded:     number;
    unavailable:  number;
  };
}

// ─── per-module probes (declarative) ─────────────────────────────────

const PROBES: Record<string, () => Promise<Omit<ModuleHealth, 'name' | 'latency_ms'>>> = {
  core: async () => {
    // core is the shared library layer — present if the response helpers
    // are loadable. Auth specifically is now its own module (see auth probe).
    if (existsSync('src/lib') && existsSync('src/utils')) {
      return { status: 'healthy', detail: 'core libs present' };
    }
    return { status: 'unavailable', detail: 'core libs missing' };
  },

  auth: async () => {
    if (!existsSync('src/auth/middleware.ts')) {
      return { status: 'unavailable', detail: 'auth middleware missing' };
    }
    if (!existsSync('src/modules/auth/index.ts')) {
      return { status: 'degraded', detail: 'auth barrel missing — module boundary not declared' };
    }
    // Check the Google OIDC flag is consistent with available config
    try {
      const { isAuthFeatureEnabled } = await import('../modules/auth/feature-flags');
      const oidcOn = isAuthFeatureEnabled('auth.google_oidc');
      const hasClientId = !!process.env.GOOGLE_OAUTH_CLIENT_ID;
      if (oidcOn && !hasClientId) {
        return {
          status: 'degraded',
          detail: 'auth.google_oidc=on but GOOGLE_OAUTH_CLIENT_ID not set',
        };
      }
      const flagSummary = oidcOn ? 'google_oidc=on' : 'google_oidc=off (no auth path active!)';
      return {
        status: oidcOn ? 'healthy' : 'degraded',
        detail: `auth module loaded; ${flagSummary}`,
      };
    } catch (e: any) {
      return { status: 'degraded', detail: `flags unreadable: ${e?.message}` };
    }
  },

  teaching: async () => {
    if (!existsSync('src/teaching/turn-store.ts')) {
      return { status: 'unavailable', detail: 'teaching turn-store missing' };
    }
    if (!existsSync('src/modules/teaching/index.ts')) {
      return { status: 'degraded', detail: 'teaching barrel missing' };
    }
    try {
      const { listAllTurns } = await import('../modules/teaching');
      const recent = listAllTurns(5);
      return {
        status: 'healthy',
        detail: recent.length > 0
          ? `${recent.length} recent turn(s) tracked`
          : 'no turns recorded yet (expected for fresh deployment)',
      };
    } catch (e: any) {
      return { status: 'degraded', detail: `turn-store read failed: ${e?.message}` };
    }
  },

  content: async () => {
    if (!existsSync('src/content/router.ts')) {
      return { status: 'unavailable', detail: 'content-router missing' };
    }
    // Check subrepo pin status
    try {
      const { readContentPin } = await import('../content/community');
      const pin = readContentPin();
      return {
        status: pin.stub ? 'degraded' : 'healthy',
        detail: pin.stub
          ? `community content in stub mode (pin=${pin.sha})`
          : `community content live at ${pin.sha.slice(0, 8)}`,
        pin: { sha: pin.sha, stub: !!pin.stub },
      };
    } catch {
      return { status: 'degraded', detail: 'community module load failed' };
    }
  },

  rendering: async () => {
    if (existsSync('frontend/dist/index.html')) {
      return { status: 'healthy', detail: 'frontend bundle built' };
    }
    if (existsSync('frontend/src')) {
      return { status: 'degraded', detail: 'frontend source present, dist not built' };
    }
    return { status: 'unavailable', detail: 'frontend missing' };
  },

  channels: async () => {
    const tg = !!process.env.TELEGRAM_BOT_TOKEN;
    const wa = !!process.env.WHATSAPP_ACCESS_TOKEN;
    if (tg && wa) return { status: 'healthy', detail: 'Telegram + WhatsApp configured' };
    if (tg || wa) return { status: 'degraded', detail: tg ? 'Telegram configured, WhatsApp missing' : 'WhatsApp configured, Telegram missing' };
    return { status: 'degraded', detail: 'no channel tokens set (module present but no channels active)' };
  },

  learning: async () => {
    const required = [
      'src/session-planner',
      'src/gbrain',
      'src/onboarding/funnel.ts',
      'src/retention/cohort-queries.ts',
    ];
    const missing = required.filter(p => !existsSync(p));
    if (missing.length === 0) return { status: 'healthy', detail: 'all learning submodules present' };
    return { status: 'degraded', detail: `missing: ${missing.join(', ')}` };
  },

  exams: async () => {
    const adapters = ['bitsat-mathematics', 'jee-main-mathematics', 'ugee-mathematics'];
    const missing = adapters.filter(a => !existsSync(`src/exams/adapters/${a}.ts`));
    if (missing.length === 0) return { status: 'healthy', detail: `${adapters.length} adapters present` };
    return { status: 'degraded', detail: `missing adapters: ${missing.join(', ')}` };
  },

  lifecycle: async () => {
    const required = [
      'src/conversion/migrate-demo-to-real.ts',
      'src/data-rights/delete.ts',
    ];
    const missing = required.filter(p => !existsSync(p));
    if (missing.length === 0) return { status: 'healthy', detail: 'conversion + data-rights present' };
    return { status: 'degraded', detail: `missing: ${missing.join(', ')}` };
  },

  orchestrator: async () => {
    if (existsSync('modules.yaml')) {
      try {
        loadRegistry();
        return { status: 'healthy', detail: 'modules.yaml loads cleanly' };
      } catch (e: any) {
        return { status: 'unavailable', detail: `registry load failed: ${e?.message}` };
      }
    }
    return { status: 'unavailable', detail: 'modules.yaml missing' };
  },
};

// ─── aggregation ─────────────────────────────────────────────────────

export async function computeOrgHealth(): Promise<OrgHealth> {
  const reg = loadRegistry();
  const results: ModuleHealth[] = [];

  for (const m of Object.values(reg.modules)) {
    const t0 = Date.now();
    try {
      const probe = PROBES[m.name] ?? (async () => ({
        status: 'degraded' as const,
        detail: 'no probe defined for this module',
      }));
      const r = await probe();
      results.push({
        name: m.name,
        ...r,
        latency_ms: Date.now() - t0,
      });
    } catch (e: any) {
      results.push({
        name: m.name,
        status: 'unavailable',
        detail: `probe threw: ${e?.message ?? 'unknown'}`,
        latency_ms: Date.now() - t0,
      });
    }
  }

  const summary = {
    healthy:     results.filter(r => r.status === 'healthy').length,
    degraded:    results.filter(r => r.status === 'degraded').length,
    unavailable: results.filter(r => r.status === 'unavailable').length,
  };

  return {
    ok: summary.unavailable === 0,
    computed_at: new Date().toISOString(),
    modules: results,
    summary,
  };
}
