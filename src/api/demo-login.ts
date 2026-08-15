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
