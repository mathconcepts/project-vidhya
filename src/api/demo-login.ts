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

export function buildDemoLoginHtml(entry: DemoTokenEntry): string {
  const target = postLoginPath(entry.role);
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
