/**
 * Auth Client — browser-side
 *
 * - Stores JWT in localStorage (same pattern as LLM config)
 * - Injects Authorization: Bearer header on outbound requests
 * - Integrates with the LLM config fetcher via a small composable helper
 * - Wraps Google Identity Services client-side script loading
 */

const TOKEN_KEY = 'vidhya.auth.token.v1';

export type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'parent' | 'institution';

export interface ClientUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: Role;
  teacher_of?: string[];
  taught_by?: string | null;
  channels?: string[];
  created_at?: string;
}

const ROLE_RANK: Record<Role, number> = { parent: 0, student: 1, teacher: 2, admin: 3, owner: 4, institution: 5 };

export function roleGte(actual: Role | null | undefined, min: Role): boolean {
  if (!actual) return false;
  return ROLE_RANK[actual] >= ROLE_RANK[min];
}

// ============================================================================
// Token storage
// ============================================================================

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, newValue: token }));
  } catch {}
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, newValue: null }));
  } catch {}
}

// ============================================================================
// Auth-aware fetch — adds Authorization header when we have a token
// ============================================================================

export function buildAuthHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * authFetch — Bearer-injecting fetch with stale-token recovery.
 *
 * v4.0.4: When the server returns 401 and we currently hold a token, we
 * clear the local token before returning the response. This unblocks the
 * "ghost JWT" state where a user has a token in localStorage that points
 * at a deleted user record (Render free tier ephemeral .data resets,
 * JWT_SECRET rotation, force-deleted user, etc.). Without this clear,
 * the dead JWT keeps trying on every request and the user is wedged in
 * a "session expired" loop.
 *
 * Pages can pass `noClearOn401: true` for endpoints where 401 is the way
 * you check "am I signed in?" (e.g. /api/auth/me).
 */
export interface AuthFetchInit extends RequestInit {
  noClearOn401?: boolean;
}

export async function authFetch(input: RequestInfo, init: AuthFetchInit = {}): Promise<Response> {
  const { noClearOn401, ...rest } = init;
  const headers = { ...buildAuthHeaders(), ...(rest.headers || {}) };
  const res = await fetch(input, { ...rest, headers });
  if (res.status === 401 && !noClearOn401 && getToken()) {
    clearToken();
  }
  return res;
}

// ============================================================================
// Server endpoints
// ============================================================================

export interface AuthConfig {
  google_client_id: string | null;
  /** True when GOOGLE_OAUTH_CLIENT_ID is unset on the server. Surfaces
   *  demo-login quick-start buttons in the UI. */
  local_dev?: boolean;
  channels: { web: boolean; telegram: boolean; whatsapp: boolean };
}

export async function fetchAuthConfig(): Promise<AuthConfig> {
  const r = await fetch('/api/auth/config');
  return r.json();
}

export async function fetchMe(): Promise<ClientUser | null> {
  const r = await authFetch('/api/auth/me');
  if (!r.ok) return null;
  const d = await r.json();
  return d.user || null;
}

export async function completeGoogleSignIn(id_token: string, link_token?: string | null): Promise<ClientUser | null> {
  const r = await fetch('/api/auth/google-callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token, link_token: link_token || undefined }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (d.token) setToken(d.token);
  return d.user || null;
}

export async function signOut(): Promise<void> {
  try { await authFetch('/api/auth/sign-out', { method: 'POST' }); } catch {}
  clearToken();
}

// ============================================================================
// Google Identity Services loader (idempotent)
// ============================================================================

let googleLoadPromise: Promise<any> | null = null;

export function loadGoogleIdentityServices(): Promise<any> {
  if (googleLoadPromise) return googleLoadPromise;
  googleLoadPromise = new Promise((resolve, reject) => {
    // @ts-ignore
    if ((window as any).google?.accounts?.id) { resolve((window as any).google); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-ignore
      if ((window as any).google?.accounts?.id) resolve((window as any).google);
      else reject(new Error('Google Identity Services loaded but not available'));
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return googleLoadPromise;
}
