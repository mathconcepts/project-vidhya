const TOKEN_KEY = 'vidhya.auth.token.v1';

export type DemoTokenEntry = { token: string; name: string; email: string; role: string };
export type DemoTokens = Record<string, DemoTokenEntry>;

export function resolveDemoRole(role: string): string {
  return role === 'student' ? 'student-active' : role;
}

export function buildDemoLoginHtml(entry: DemoTokenEntry): string {
  return `<!doctype html>
<html><head><title>Loading demo…</title></head>
<body>
<script>
  localStorage.setItem(${JSON.stringify(TOKEN_KEY)}, ${JSON.stringify(entry.token)});
  window.location.replace('/');
</script>
<p>Logging you in as ${entry.name} (${entry.role})…</p>
</body></html>`;
}
