const TOKEN_KEY = 'vidhya.auth.token.v1';

export type DemoTokenEntry = { token: string; name: string; email: string; role: string };
export type DemoTokens = Record<string, DemoTokenEntry>;

export function resolveDemoRole(role: string): string {
  return role === 'student' ? 'student-active' : role;
}

/**
 * Pick where to land after demo-login based on role. Admin gets dropped
 * straight onto /admin/content-rd because the local-dev's primary intent
 * is to develop + generate content. Other roles land on / (their persona
 * home routes from there).
 */
export function postLoginPath(role: string): string {
  if (role === 'admin' || role === 'owner') return '/admin/content-rd';
  return '/';
}

/**
 * Where to land after demo-login, honouring a caller-supplied `next`.
 *
 * The demo deck needs the visitor to arrive at the rail they tapped, not the
 * generic home. `next` is attacker-controllable in principle — this route has
 * no auth of its own — so only same-origin absolute paths are accepted: it must
 * start with a single "/" and must not begin "//" or "/\\", both of which
 * browsers treat as protocol-relative and would turn this into an open redirect
 * that hands a real auth token to another origin.
 */
export function resolveTarget(entry: DemoTokenEntry, next?: string | null): string {
  if (typeof next === 'string' && /^\/(?![/\\])/.test(next)) return next;
  return postLoginPath(entry.role);
}

export function buildDemoLoginHtml(entry: DemoTokenEntry, next?: string | null): string {
  const target = resolveTarget(entry, next);
  return `<!doctype html>
<html><head><title>Loading demo…</title></head>
<body>
<script>
  localStorage.setItem(${JSON.stringify(TOKEN_KEY)}, ${JSON.stringify(entry.token)});
  window.location.replace(${JSON.stringify(target)});
</script>
<p>Logging you in as ${entry.name} (${entry.role})…</p>
</body></html>`;
}

/**
 * Whether this instance may hand out demo tokens at all.
 *
 * `/demo-login` mints a REAL auth token for a seeded account with no
 * credential check — anyone who guesses the URL gets a session. Until now it
 * was hidden by omission: the sign-in page stops advertising it once Google
 * OAuth is configured, but the route itself kept answering, which undercuts the
 * plan's "no publicly reachable demo on production" decision.
 *
 * The gate has to be permissive enough not to break the two places this is
 * legitimately used — a local dev machine with no OAuth configured, and the
 * venue instance — so it refuses exactly one configuration: an instance with
 * real Google OAuth set up and no demo flag of any kind. That is the shape of a
 * production deployment, and the only one where a guessable login is a hole
 * rather than a convenience.
 *
 * Deliberately accepts the older VIDHYA_DEMO_MODE alongside the newer
 * DEMO_MODE_ENABLED: existing demo deployments set the former, and silently
 * locking them out to tidy up flag naming would be a worse outcome than
 * honouring both.
 */
export function demoLoginAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.DEMO_MODE_ENABLED === 'true') return true;
  if (env.VIDHYA_DEMO_MODE) return true;
  // No OAuth configured means there is no real sign-in to protect — this is a
  // local dev box, where the quick-start buttons are the intended path in.
  return !env.GOOGLE_OAUTH_CLIENT_ID;
}
