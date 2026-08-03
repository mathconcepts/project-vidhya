/**
 * Setup Wizard API client — Mission Control Phase 1, "Setup wizard" panel
 * (SOTA-Facelift-CEO-Review.md §7.5). Wraps GET /api/admin/setup/status
 * (cheap, no live calls) and POST /api/admin/setup/test-providers
 * (operator-triggered, live LLM calls — spends a trivial amount of real
 * provider budget per click, so this is never auto-invoked).
 *
 * Auth: piggybacks on the Vidhya JWT in localStorage via authFetch (same
 * pattern as jobs.ts / platform-health.ts).
 */

import { authFetch } from '@/lib/auth/client';

class SetupApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'SetupApiError';
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* no JSON body — fall through to statusText */
  }
  if (!res.ok) {
    throw new SetupApiError(res.status, body?.message || body?.error || res.statusText || 'Request failed');
  }
  return body as T;
}

export interface ProviderStatus {
  provider: string;
  enabled: boolean;
  api_key_env: string | null;
  key_present: boolean;
  model_count: number;
  required: boolean;
}

export interface SyllabusStatus {
  id: string;
  name: string;
  concept_count: number;
  unresolved_count: number;
  is_default: boolean;
}

export interface SetupStatus {
  generated_at: string;
  providers: ProviderStatus[];
  registry_error: string | null;
  database: {
    configured: boolean;
    reachable: boolean;
    error: string | null;
    note?: string;
  };
  syllabi: SyllabusStatus[];
  hard_requirement_met: boolean;
  ready: boolean;
}

export interface ProviderTestResult {
  provider: string;
  ok: boolean;
  error?: string;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  return jsonOrThrow(await authFetch('/api/admin/setup/status'));
}

export async function testProviders(): Promise<{ tested_at: string; results: ProviderTestResult[] }> {
  return jsonOrThrow(await authFetch('/api/admin/setup/test-providers', { method: 'POST' }));
}

export { SetupApiError };
