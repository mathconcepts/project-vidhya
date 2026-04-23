// @ts-nocheck
/**
 * Student-facing Swagger UI page — renders /api/student/openapi.json
 * interactively at /student/docs.
 *
 * Mirrors src/admin-orchestrator/docs-html.ts (the admin-agent Swagger
 * page shipped in v2.29) with two differences:
 *
 *   - Title + header branding reflect the student surface, not
 *     admin-agent
 *   - Spec URL points at /api/student/openapi.json
 *
 * Same pinned Swagger UI version (5.17.14) for consistency across
 * the two docs pages.
 */

const SWAGGER_UI_VERSION = '5.17.14';

export function getStudentDocsHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>Vidhya Student API — Docs</title>

  <link rel="stylesheet"
    href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css">

  <style>
    :root {
      --bg: #0a0a0b;
      --bg-panel: #111113;
      --bg-inset: #16161a;
      --border: #1f1f24;
      --border-hi: #2a2a31;
      --text: #e4e4e7;
      --text-dim: #9ca0a8;
      --accent: #a78bfa;
      --ok: #34d399;
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      --sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
    }
    .page-header {
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border);
      padding: 18px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .page-header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .page-header .breadcrumb {
      font-size: 12px;
      color: var(--text-dim);
      font-family: var(--mono);
    }
    .page-header .breadcrumb a {
      color: var(--accent);
      text-decoration: none;
    }
    .page-header .breadcrumb a:hover { text-decoration: underline; }
    .page-header .meta {
      margin-left: auto;
      display: flex;
      gap: 14px;
      font-size: 11px;
      color: var(--text-dim);
      font-family: var(--mono);
    }
    .page-header .meta .badge {
      background: var(--bg-inset);
      border: 1px solid var(--border-hi);
      padding: 3px 8px;
      border-radius: 2px;
    }
    .page-header .meta .badge strong { color: var(--accent); }

    /* Swagger UI dark overrides — kept identical to admin/agent/docs */
    #swagger-ui { background: var(--bg); }
    .swagger-ui, .swagger-ui .info .title,
    .swagger-ui .opblock-tag, .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-description,
    .swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4, .swagger-ui h5,
    .swagger-ui .markdown p, .swagger-ui .markdown li,
    .swagger-ui label, .swagger-ui .response-col_status,
    .swagger-ui .parameter__name, .swagger-ui .parameter__type,
    .swagger-ui .parameter__in, .swagger-ui .tab li, .swagger-ui table {
      color: var(--text) !important;
    }
    .swagger-ui .scheme-container {
      background: var(--bg-panel);
      box-shadow: none;
      border-bottom: 1px solid var(--border);
    }
    .swagger-ui .info { margin: 24px 0; }
    .swagger-ui .opblock-tag {
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border);
    }
    .swagger-ui .opblock {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      box-shadow: none;
      margin-bottom: 10px;
    }
    .swagger-ui .opblock.opblock-post { border-left: 3px solid var(--accent); }
    .swagger-ui .opblock.opblock-get  { border-left: 3px solid #7dd3fc; }
    .swagger-ui .opblock.opblock-put  { border-left: 3px solid #f59e0b; }
    .swagger-ui .opblock.opblock-delete { border-left: 3px solid #f87171; }
    .swagger-ui .opblock .opblock-summary { border: none; padding: 10px 20px; }
    .swagger-ui .opblock-description-wrapper,
    .swagger-ui .opblock-external-docs-wrapper,
    .swagger-ui .opblock-title_normal,
    .swagger-ui .opblock-section-header {
      background: var(--bg-inset) !important;
      color: var(--text) !important;
    }
    .swagger-ui .opblock-section-header h4 { color: var(--text); }
    .swagger-ui .btn {
      background: var(--bg-inset);
      color: var(--text);
      border: 1px solid var(--border-hi);
    }
    .swagger-ui .btn.authorize {
      border-color: var(--accent);
      color: var(--accent);
    }
    .swagger-ui .btn.execute {
      background: var(--accent);
      color: #140228;
      border-color: var(--accent);
      font-weight: 600;
    }
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui textarea,
    .swagger-ui select {
      background: var(--bg-inset);
      color: var(--text);
      border: 1px solid var(--border-hi);
    }
    .swagger-ui .highlight-code > .microlight,
    .swagger-ui pre, .swagger-ui code {
      background: #06060a !important;
      color: #d4d4d8 !important;
    }
    .swagger-ui .tab li button { color: var(--text-dim); }
    .swagger-ui .tab li button.tablinks.active { color: var(--accent); }
    .swagger-ui table tbody tr td { border-color: var(--border); }
    .swagger-ui .parameter__type { color: var(--accent); }
    .swagger-ui .model-title, .swagger-ui .model { color: var(--text); }
    .swagger-ui .response-col_description__inner div { color: var(--text); }

    .boot-note {
      max-width: 720px;
      margin: 32px auto;
      padding: 28px;
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 3px;
      text-align: center;
      color: var(--text-dim);
    }
    .boot-note.hidden { display: none; }
    .boot-note .spinner {
      width: 14px; height: 14px;
      border: 2px solid var(--border-hi);
      border-top-color: var(--accent);
      border-radius: 50%;
      display: inline-block;
      vertical-align: middle;
      margin-right: 10px;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 700px) {
      .page-header { padding: 14px 16px; gap: 8px; }
      .page-header .meta { margin-left: 0; }
    }
  </style>
</head>
<body>

  <header class="page-header">
    <h1>Vidhya Student API — Docs</h1>
    <span class="breadcrumb">
      <a href="/gate">← app</a>
      &nbsp;·&nbsp;
      <a href="/api/student/openapi.json">raw openapi.json</a>
      &nbsp;·&nbsp;
      <a href="/admin/agent/docs">admin API docs</a>
    </span>
    <div class="meta">
      <span class="badge">spec <strong>OpenAPI 3.1</strong></span>
      <span class="badge">scope <strong>student</strong></span>
    </div>
  </header>

  <div id="boot-note" class="boot-note">
    <span class="spinner"></span>
    Loading Swagger UI from unpkg…
    <div style="margin-top:10px;font-size:12px;">
      If this message persists, the CDN may be blocked. Fetch
      <code>/api/student/openapi.json</code> directly for the raw spec.
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.addEventListener('load', function () {
      var boot = document.getElementById('boot-note');
      if (typeof SwaggerUIBundle !== 'function') {
        boot.innerHTML = '<strong>Swagger UI failed to load.</strong><br><br>' +
          'CDN blocked or offline. You can still fetch the raw spec at ' +
          '<a href="/api/student/openapi.json">/api/student/openapi.json</a>.';
        return;
      }
      try {
        window.ui = SwaggerUIBundle({
          url: '/api/student/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: 'BaseLayout',
          docExpansion: 'list',
          defaultModelsExpandDepth: 1,
          tryItOutEnabled: true,
          persistAuthorization: true,
          onComplete: function () { boot.classList.add('hidden'); },
          onFailure: function (err) {
            boot.innerHTML = '<strong>Swagger UI initialisation failed.</strong><br>' +
              'Raw spec: <a href="/api/student/openapi.json">/api/student/openapi.json</a>';
            console.error('Swagger UI init failure:', err);
          },
        });
      } catch (err) {
        boot.innerHTML = '<strong>Swagger UI construction threw.</strong><br><br>' +
          '<code>' + (err && err.message ? err.message : String(err)) + '</code>';
      }
    });
  </script>
</body>
</html>
`;
}
