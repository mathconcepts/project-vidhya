// @ts-nocheck
/**
 * GATE Math App — Standalone Server
 *
 * Lightweight entry point that boots only the GATE math API
 * without the full 8-agent orchestrator.
 *
 * Usage: npx tsx src/server.ts
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { gateRoutes, setOrchestrator } from './api/gate-routes';
import { notebookRoutes } from './api/notebook-routes';
import { dailyProblemRoutes } from './jobs/daily-problem';
import { telegramWebhookRoutes } from './jobs/telegram-webhook';
import { flywheelRoutes, setFlywheelOrchestrator } from './jobs/content-flywheel';
import { topicPageRoutes } from './api/topic-pages';
import { streakRoutes } from './api/streak-routes';
import { adminRoutes } from './api/admin-routes';
import { adminExperimentsRoutes } from './api/admin-experiments-routes';
import { adminRunsRoutes } from './api/admin-runs-routes';
import { adminLedgerRoutes } from './api/admin-ledger-routes';
import { adminExamPacksRoutes } from './api/admin-exam-packs-routes';
import { adminHoldoutRoutes } from './api/admin-holdout-routes';
import { adminConceptsRoutes } from './api/admin-concepts-routes';
import { chatRoutes, setChatVectorStore, setChatEmbedder } from './api/chat-routes';
import { socialRoutes } from './api/social-routes';
import { commanderRoutes } from './api/commander-routes';
import { blogRoutes } from './api/blog-routes';
import { funnelRoutes } from './api/funnel-routes';
import { notificationRoutes } from './api/notification-routes';
import { retentionRoutes } from './jobs/retention-engine';
import { trendCollectorRoutes } from './jobs/trend-collector';
import { contentPrioritizerRoutes } from './jobs/content-prioritizer';
import { feedbackScorerRoutes } from './jobs/feedback-scorer';
import { gbrainRoutes } from './gbrain/gbrain-routes';
import { geminiProxyRoutes } from './api/gemini-proxy';
import { aggregateRoutes } from './api/aggregate';
import { contentRoutes } from './api/content-routes';
import { syllabusRoutes } from './api/syllabus-routes';
import { multimodalRoutes } from './api/multimodal-routes';
import { lessonRoutes } from './api/lesson-routes';
import { verifyRoutes } from './api/verify-routes';
import { conceptOrchestratorRoutes } from './api/concept-orchestrator-routes';
import { mediaRoutes } from './api/media-routes';
import { curriculumRoutes } from './api/curriculum-routes';
import { llmConfigRoutes } from './api/llm-config-routes';
import { authRoutes } from './api/auth-routes';
import { userAdminRoutes } from './api/user-admin-routes';
import { adminDashboardRoutes } from './api/admin-dashboard-routes';
import { teachingRoutes } from './api/teaching-routes';
import { turnsRoutes } from './api/turns-routes';
import { contentLibraryRoutes } from './api/content-library-routes';
import { contentStudioRoutes } from './api/content-studio-routes';
import { operatorRoutes } from './api/operator-routes';
import { notebookRoutes as smartNotebookRoutes } from './api/notebook-insight-routes';
// neetPaperRoutes import removed in v4.0.2: introduced speculatively in
// f577c92 but the routes file was never created. // @ts-nocheck above hid
// the broken import from tsc; tsx caught it at runtime, blocking the
// v4.0 Render deploy. Reintroduce when src/api/neet-paper-routes.ts ships.
import { examRoutes } from './api/exam-routes';
import { examGroupRoutes } from './api/exam-group-routes';
import { meRoutes } from './api/me-routes';
import { renderingRoutes } from './api/rendering-routes';
import { gbrainAuditRoutes } from './api/gbrain-audit-routes';
import { bitsatSampleRoutes } from './api/bitsat-sample-routes';
import { feedbackRoutes } from './api/feedback-routes';
import { sampleCheckRoutes } from './api/sample-check-routes';
import { courseRoutes } from './api/course-routes';
import { examBuilderRoutes } from './api/exam-builder-routes';
import { attentionRoutes } from './api/attention-routes';
import { marketingRoutes } from './api/marketing-routes';
import { adminAgentRoutes } from './api/admin-agent-routes';
import { sessionPlannerRoutes } from './api/session-planner-routes';
import { studymateRoutes } from './api/studymate-routes';
import { knowledgeRoutes } from './api/knowledge-routes';
import { lifecycleRoutes } from './api/lifecycle-routes';
import { contentLifecycleRoutes } from './api/content-lifecycle-routes';
import { orchestratorRoutes } from './api/orchestrator-routes';
// Side-effect: registers all bundled exam adapters via the registry pattern.
// New adapters dropped into src/exams/adapters/ and imported from
// src/exams/adapters/index.ts are picked up automatically at startup.
import './exams/adapters/index';
import { telegramRoutes as botTelegramRoutes } from './channels/telegram-adapter';
import { whatsappRoutes } from './channels/whatsapp-adapter';
import { getAuth, migrateSession } from './api/auth-middleware';
import { TieredVerificationOrchestrator } from './verification/tiered-orchestrator';
import { InMemoryVectorStore, PgVectorStore } from './data/vector-store';
import { WolframVerifier } from './verification/verifiers/wolfram';
import { embedText, getLlmForRole } from './llm/runtime';
import { renderBlogPost } from './templates/blog-post';
import { renderBlogIndex } from './templates/blog-index';
import { renderExamLanding } from './templates/exam-landing';
import { renderSitemap, buildSitemapEntries } from './templates/sitemap';
import { renderRssFeed } from './templates/rss-feed';
import { computeFeatureFlags } from './api/feature-flags';
import { resolveDemoRole, buildDemoLoginHtml, type DemoTokens } from './api/demo-login';
import path from 'path';
import fs from 'fs';
import pg from 'pg';
import { autoMigrate } from './db/auto-migrate';

const ssrPool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL });

// ============================================================================
// Route matching (simplified from APIServer)
// ============================================================================

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: (req: ParsedRequest, res: ServerResponse) => Promise<void>;
}

interface ParsedRequest {
  pathname: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

const routes: Route[] = [];

function registerRoute(method: string, path: string, handler: Route['handler']): void {
  const paramNames: string[] = [];
  const pattern = path.replace(/:(\w+)/g, (_match, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  routes.push({
    method: method.toUpperCase(),
    pattern: new RegExp(`^${pattern}$`),
    paramNames,
    handler,
  });
}

// Register all routes
for (const route of gateRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of dailyProblemRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of telegramWebhookRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of flywheelRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of topicPageRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of streakRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminExperimentsRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminRunsRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminLedgerRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminExamPacksRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminHoldoutRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminConceptsRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of chatRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of socialRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of notebookRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of commanderRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of blogRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of funnelRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of notificationRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of retentionRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of trendCollectorRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of contentPrioritizerRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of feedbackScorerRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of gbrainRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of geminiProxyRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of aggregateRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of contentRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of syllabusRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of multimodalRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of lessonRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of verifyRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of conceptOrchestratorRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of mediaRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of curriculumRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of llmConfigRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of authRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of userAdminRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminDashboardRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of teachingRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of turnsRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of contentLibraryRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of contentStudioRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of operatorRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
// neetPaperRoutes registration removed in v4.0.2 (see import comment above).
for (const route of smartNotebookRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of examRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of examGroupRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of meRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of renderingRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of gbrainAuditRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of bitsatSampleRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of feedbackRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of sampleCheckRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of courseRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of examBuilderRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of attentionRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of marketingRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of adminAgentRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of sessionPlannerRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of studymateRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of knowledgeRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of lifecycleRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of contentLifecycleRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of orchestratorRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of botTelegramRoutes) {
  registerRoute(route.method, route.path, route.handler);
}
for (const route of whatsappRoutes) {
  registerRoute(route.method, route.path, route.handler);
}

// ── SSR Routes (server-rendered HTML for SEO) ─────────────────────────────────

registerRoute('GET', '/blog/:slug', async (req, res) => {
  try {
    const result = await ssrPool.query(
      `SELECT * FROM blog_posts WHERE slug = $1 AND status = 'published'`,
      [req.params.slug]
    );
    if (result.rows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Post not found</h1><a href="/blog">Back to blog</a></body></html>');
      return;
    }
    // Increment view count (fire-and-forget)
    ssrPool.query('UPDATE blog_posts SET views = views + 1 WHERE id = $1', [result.rows[0].id]).catch(() => {});
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderBlogPost(result.rows[0]));
  } catch (err) {
    console.error('[ssr] Blog post error:', err);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Server error</h1></body></html>');
  }
});

registerRoute('GET', '/blog', async (req, res) => {
  try {
    const page = parseInt(req.query.get('page') || '1', 10);
    const topic = req.query.get('topic');
    const sort = req.query.get('sort') || 'recent';
    const contentType = req.query.get('type');
    const limit = 20;
    const offset = (page - 1) * limit;

    let where = "WHERE status = 'published'";
    const params: unknown[] = [];
    let idx = 1;
    if (topic) { where += ` AND topic = $${idx++}`; params.push(topic); }
    if (contentType) { where += ` AND content_type = $${idx++}`; params.push(contentType); }

    // Check if content_score column exists (migration may not be applied yet)
    let hasContentScore = false;
    try {
      await ssrPool.query(`SELECT content_score FROM blog_posts LIMIT 0`);
      hasContentScore = true;
    } catch { /* column doesn't exist yet */ }

    // Sort options
    const orderMap: Record<string, string> = {
      recent: 'published_at DESC NULLS LAST',
      trending: hasContentScore
        ? 'content_score DESC NULLS LAST, published_at DESC NULLS LAST'
        : 'views DESC NULLS LAST, published_at DESC NULLS LAST',
      views: 'views DESC NULLS LAST',
    };
    const orderBy = orderMap[sort] || orderMap.recent;

    const countResult = await ssrPool.query(`SELECT COUNT(*) FROM blog_posts ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const scoreCol = hasContentScore ? ', content_score' : '';
    const result = await ssrPool.query(
      `SELECT id, slug, title, excerpt, content_type, topic, exam_tags, views, published_at${scoreCol}
       FROM blog_posts ${where}
       ORDER BY ${orderBy}
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderBlogIndex(result.rows, page, totalPages, topic || undefined, sort, contentType || undefined));
  } catch (err) {
    console.error('[ssr] Blog index error:', err);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Server error</h1></body></html>');
  }
});

registerRoute('GET', '/exams/:examId', async (req, res) => {
  try {
    const examId = req.params.examId;
    const topicName = examId.replace(/-/g, ' ');

    const problemsResult = await ssrPool.query(
      `SELECT id, question_text, topic, difficulty, options
       FROM pyq_questions WHERE LOWER(topic) = LOWER($1)
       ORDER BY RANDOM() LIMIT 5`,
      [topicName]
    );

    const blogsResult = await ssrPool.query(
      `SELECT slug, title, content_type, excerpt
       FROM blog_posts WHERE LOWER(topic) = LOWER($1) AND status = 'published'
       ORDER BY published_at DESC LIMIT 4`,
      [topicName]
    );

    const statsResult = await ssrPool.query(
      `SELECT topic, COUNT(*) as count, difficulty
       FROM pyq_questions WHERE LOWER(topic) = LOWER($1)
       GROUP BY topic, difficulty`,
      [topicName]
    );

    const totalProblems = statsResult.rows.reduce((acc, r) => acc + parseInt(r.count), 0);
    const diffDist: Record<string, number> = {};
    statsResult.rows.forEach(r => { diffDist[r.difficulty] = parseInt(r.count); });

    const allTopics = await ssrPool.query(`SELECT DISTINCT topic FROM pyq_questions WHERE topic IS NOT NULL`);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderExamLanding({
      examId,
      title: `GATE ${topicName.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')} — Practice & Study Guide`,
      description: `Master ${topicName} for GATE Engineering Mathematics. ${totalProblems} verified problems with step-by-step solutions, AI tutor, and personalized study plans.`,
      problems: problemsResult.rows,
      blogs: blogsResult.rows,
      stats: {
        totalProblems,
        topics: allTopics.rows.map(r => r.topic).slice(0, 10),
        difficultyDistribution: diffDist,
      },
    }));
  } catch (err) {
    console.error('[ssr] Exam landing error:', err);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Server error</h1></body></html>');
  }
});

registerRoute('GET', '/sitemap.xml', async (_req, res) => {
  try {
    const blogs = await ssrPool.query(`SELECT slug, updated_at FROM blog_posts WHERE status = 'published'`);
    const topics = await ssrPool.query(`SELECT DISTINCT topic FROM pyq_questions WHERE topic IS NOT NULL`);
    const entries = buildSitemapEntries(blogs.rows, topics.rows.map(r => r.topic));
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(renderSitemap(entries));
  } catch (err) {
    console.error('[ssr] Sitemap error:', err);
    res.writeHead(500, { 'Content-Type': 'application/xml' });
    res.end('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

registerRoute('GET', '/rss.xml', async (_req, res) => {
  try {
    const result = await ssrPool.query(
      `SELECT title, slug, excerpt, topic, published_at
       FROM blog_posts WHERE status = 'published'
       ORDER BY published_at DESC LIMIT 50`
    );
    res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
    res.end(renderRssFeed(result.rows));
  } catch (err) {
    console.error('[ssr] RSS error:', err);
    res.writeHead(500, { 'Content-Type': 'application/xml' });
    res.end('<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>');
  }
});

// Auth session migration
registerRoute('POST', '/api/auth/migrate-session', async (req, res) => {
  const auth = await getAuth(req);
  if (!auth) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authentication required' }));
    return;
  }
  const { sessionId } = req.body as any || {};
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'sessionId required' }));
    return;
  }
  try {
    await migrateSession(auth.userId, sessionId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('[auth] Migration error:', (err as Error).message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Migration failed' }));
  }
});

// Health check
registerRoute('GET', '/health', async (_req, res) => {
  const info: Record<string, unknown> = { status: 'ok', service: 'gate-math-api' };

  info.features = computeFeatureFlags();

  // Content cascade health: tier-miss rate over the last 24h.
  // Surfaces the content router's primary failure mode (no tier produced
  // content) without needing the admin telemetry dashboard.
  try {
    const { getTierMissRate24h } = await import('./content/telemetry');
    info.content = getTierMissRate24h();
  } catch { /* telemetry unavailable; non-fatal */ }

  // DB ping (only if configured)
  if (process.env.DATABASE_URL) {
    try {
      const pg = await import('pg');
      const client = new pg.default.Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      const r = await client.query('SELECT 1 as ok');
      info.database_status = r.rows[0]?.ok === 1 ? 'connected' : 'unexpected';
      await client.end();
    } catch (e: any) {
      info.database_status = `error: ${e.message}`;
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(info));
});

// /demo-login?role=student|teacher|admin — sets localStorage token and redirects to /
// Reads demo/demo-tokens.json written by npm run demo:seed (runs on every Render boot).
// In local-dev mode (no GOOGLE_OAUTH_CLIENT_ID), auto-seeds on first hit so the
// admin's first three minutes work without a separate `npm run demo:seed` step.
let _demoSeedPromise: Promise<void> | null = null;
async function ensureDemoSeeded(): Promise<void> {
  if (_demoSeedPromise) return _demoSeedPromise;
  if (fs.existsSync('demo/demo-tokens.json')) return;

  _demoSeedPromise = (async () => {
    console.log('[demo-login] demo/demo-tokens.json missing — auto-seeding…');
    const { execFile } = await import('child_process');
    await new Promise<void>((resolve, reject) => {
      execFile('npx', ['tsx', 'demo/seed.ts'], { cwd: process.cwd() }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('[demo-login] demo seed complete.');
  })().catch((err) => {
    _demoSeedPromise = null; // allow retry
    throw err;
  });
  return _demoSeedPromise;
}

registerRoute('GET', '/demo-login', async (req, res) => {
  // req.query is URLSearchParams (parsed by handleRequest), not a plain
  // object. Pre-fix this used `req.query?.role` which is always undefined,
  // causing every demo login to fall back to 'student-active' (Priya)
  // regardless of the requested role.
  const role = req.query?.get('role') ?? 'student-active';

  // Auto-seed in local-dev mode if tokens haven't been generated yet.
  if (!fs.existsSync('demo/demo-tokens.json')) {
    try {
      await ensureDemoSeeded();
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Demo seed failed: ${e?.message ?? 'unknown'}\n\nRun manually: npm run demo:seed`);
      return;
    }
  }

  let tokens: DemoTokens = {};
  try {
    const raw = fs.readFileSync('demo/demo-tokens.json', 'utf8');
    tokens = JSON.parse(raw);
  } catch {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Demo not seeded. The server seeds on boot — please wait 30 seconds and try again.');
    return;
  }

  const key = resolveDemoRole(role);
  const entry = tokens[key];
  if (!entry) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(`Unknown role: ${role}. Valid roles: student, teacher, admin, owner.`);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(buildDemoLoginHtml(entry));
});

// ============================================================================
// Request handling
// ============================================================================

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB (supports base64 images)

async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_SIZE) {
        req.destroy();
        return reject(new Error('Request body too large'));
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
    });
    req.on('error', () => resolve(undefined));
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = (req.method || 'GET').toUpperCase();

  // Try to serve static frontend files in production. Accept GET *and* HEAD —
  // HEAD probes from monitors / `curl -I` should also see the SPA index for
  // any client-side route, otherwise they spuriously report 404 on /admin/*.
  if ((method === 'GET' || method === 'HEAD') && !pathname.startsWith('/api') && !pathname.startsWith('/telegram') && !pathname.startsWith('/health') && !pathname.startsWith('/solutions') && !pathname.startsWith('/topics') && !pathname.startsWith('/blog') && !pathname.startsWith('/exams') && pathname !== '/sitemap.xml' && pathname !== '/rss.xml' && pathname !== '/demo-login') {
    const frontendDist = path.join(process.cwd(), 'frontend', 'dist');
    if (fs.existsSync(frontendDist)) {
      const filePath = path.join(frontendDist, pathname === '/' ? 'index.html' : pathname);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        // 1) Direct file match
        if (stat.isFile()) {
          const ext = path.extname(filePath);
          const contentTypes: Record<string, string> = {
            '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
            '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
            '.map': 'application/json',
          };
          res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        // 2) Directory with index.html — serves e.g. /admin/agent/dashboard/ → .../dashboard/index.html
        if (stat.isDirectory()) {
          const dirIndex = path.join(filePath, 'index.html');
          if (fs.existsSync(dirIndex) && fs.statSync(dirIndex).isFile()) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(dirIndex).pipe(res);
            return;
          }
        }
      }
      // SPA fallback — serve index.html for unknown paths
      const indexPath = path.join(frontendDist, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
        return;
      }
    }
  }

  // Match API routes. HEAD requests fall back to GET routes — Node's http
  // module automatically suppresses the response body for HEAD, so the same
  // handler can serve both. Lets `curl -I`, monitors, and other HEAD-based
  // health probes work against any GET endpoint.
  const matchMethod = method === 'HEAD' ? 'GET' : method;
  for (const route of routes) {
    if (route.method !== matchMethod) continue;
    const match = pathname.match(route.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    route.paramNames.forEach((name, i) => {
      params[name] = match[i + 1];
    });

    const body = await parseBody(req);

    const parsedReq: ParsedRequest = {
      pathname,
      query: url.searchParams,
      params,
      body,
      headers: req.headers as Record<string, string | string[] | undefined>,
    };

    try {
      await route.handler(parsedReq, res);
    } catch (err) {
      console.error(`[server] Error handling ${method} ${pathname}:`, err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// ============================================================================
// Bootstrap
// ============================================================================

async function main() {
  const port = parseInt(process.env.PORT || '8080', 10);

  // ── Auto-migrate database ─────────────────────────────────────────────
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const migratePool = new pg.Pool({ connectionString: dbUrl, max: 2 });
    try {
      await autoMigrate(migratePool);
    } catch (err) {
      console.error('[server] Auto-migrate error (non-fatal):', (err as Error).message);
    }
    await migratePool.end();
  }

  // ── Embedder (provider-agnostic — Gemini default, OpenAI fallback) ─────
  // Boot-time wrapper around the runtime helper. The runtime helper picks
  // the best embedding provider from the resolved config; this closure
  // adapts it to the existing `(text) => number[]` shape that callers
  // expect. Returns zero-vectors when no provider is configured.
  const embedder = async (text: string): Promise<number[]> => {
    const result = await embedText(text);
    if (!result) {
      console.warn('[server] No embedding provider configured — using zero embeddings');
      return new Array(3072).fill(0);   // Gemini-shape default; pgvector tolerates dim mismatch by failing on insert
    }
    return result.embedding;
  };

  // ── LLM dual-solve (provider-agnostic) ──────────────────────────────────
  // Was previously two Gemini Flash calls; now resolves the 'chat' role
  // per-call so the operator's /gate/llm-config choice flows through.
  // Both solvers use the same role today (real dual-solve diversity needs
  // separate role overrides — a separate config decision).
  const makeLLMSolver = (label: string) => ({
    solve: async (problem: string, context?: any) => {
      const llm = await getLlmForRole('chat');
      if (!llm) {
        return {
          answer: 'LLM not configured (no provider available)',
          confidence: 0.5,
        };
      }
      const prompt = `You are a GATE Engineering Mathematics expert. Solve the following problem step by step.
Give ONLY the final answer value on the last line, prefixed with "ANSWER: ".
If it's multiple choice, state the letter and value.

Problem: ${problem}
${context?.expectedAnswer ? `Student's answer: ${context.expectedAnswer}` : ''}

Solve carefully:`;
      const text = await llm.generate(prompt);
      if (!text) {
        return { answer: '', confidence: 0 };
      }
      // Extract answer from last line
      const answerMatch = text.match(/ANSWER:\s*(.+)/i);
      const answer = answerMatch ? answerMatch[1].trim() : text.trim().split('\n').pop()?.trim() || '';
      return { answer, confidence: 0.8 };
    },
  });

  // Two solver instances (different labels for diagnostic logging; they
  // resolve to the same provider/model unless the operator sets
  // different per-role overrides in /gate/llm-config).
  const llmA = makeLLMSolver('solver-A');
  const llmB = makeLLMSolver('solver-B');

  // ── Wolfram Alpha ───────────────────────────────────────────────────────
  const wolframAppId = process.env.WOLFRAM_APP_ID;
  let wolfram: any = null;
  if (wolframAppId) {
    wolfram = new WolframVerifier();
    await wolfram.initialize({
      config: { appId: wolframAppId },
      timeoutMs: 15_000,
    });
    const healthy = await wolfram.checkHealth();
    console.log(`[server] Wolfram Alpha: ${healthy ? 'connected' : 'FAILED health check'}`);
  } else {
    console.warn('[server] WOLFRAM_APP_ID not set — Tier 3 disabled');
  }

  // ── Vector store (pgvector-backed for persistence across cold starts) ──
  let vectorStore;
  if (dbUrl) {
    const pg = await import('pg');
    const pool = new pg.default.Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30_000 });
    const pgStore = new PgVectorStore(pool);
    await pgStore.initialize();
    vectorStore = pgStore;
  } else {
    console.warn('[server] DATABASE_URL not set — using in-memory vector store (no persistence)');
    vectorStore = new InMemoryVectorStore();
  }

  // ── Orchestrator ────────────────────────────────────────────────────────
  const orchestrator = new TieredVerificationOrchestrator(
    vectorStore,
    embedder,
    llmA,
    llmB,
    wolfram,
    {
      ragThreshold: 0.85,
      wolframDailyLimit: 50,
      llmTimeoutMs: 10_000,
      wolframTimeoutMs: 15_000,
    },
  );

  setOrchestrator(orchestrator);
  setFlywheelOrchestrator(orchestrator);

  // Note: setGeminiModel() injection was removed — verify-any now uses
  // src/llm/runtime directly so the operator's per-request LLM config
  // flows through to image OCR. setGeminiModel is kept as a no-op for
  // back-compat with any external caller.

  // ── Content Pipeline: inject vector store + embedder into chat routes ──
  setChatVectorStore(vectorStore);
  setChatEmbedder(embedder);
  console.log(`[server] Content pipeline: chat grounding enabled`);

  // Probe whether any LLM provider is reachable at boot time, for the
  // diagnostic banner. Does not block startup; just informational.
  const bootLlm = await getLlmForRole('chat');
  console.log(
    `[server] Verification tiers: RAG` +
    `${bootLlm ? ` + LLM (${bootLlm.provider_id}/${bootLlm.model_id})` : ''}` +
    `${wolfram ? ' + Wolfram' : ''}`
  );

  const server = createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error('[server] Unhandled request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  // Surface common silent misconfigurations at startup (per ER-D-P2B).
  try {
    const { warnIfLlmClassifierStubActive } = await import('./content/intent-classifier');
    warnIfLlmClassifierStubActive();
  } catch { /* non-fatal */ }

  server.listen(port, '0.0.0.0', () => {
    console.log(`
┌──────────────────────────────────────────────┐
│  GATE Math API                               │
│  http://localhost:${port}                         │
│                                              │
│  Core:                                       │
│    GET  /health                 Health        │
│    GET  /demo-login             Demo Login    │
│    GET  /api/topics             Topics        │
│    GET  /api/problems/:topic    Problems      │
│    POST /api/verify             Verify        │
│    POST /api/verify-any         Verify Any    │
│    GET  /api/sr/:id             SR State      │
│    POST /api/sr/:id             SR Update     │
│    GET  /api/progress/:id       Progress      │
│  SEO:                                        │
│    GET  /solutions/:slug        Solution Page │
│    GET  /topics/:slug           Topic Page    │
│    GET  /sitemap.xml            Sitemap       │
│  AI Tutor:                                   │
│    POST /api/chat               Stream Chat   │
│    GET  /api/chat/:id           History       │
│  Study Commander:                            │
│    POST /api/onboard             Onboard     │
│    GET  /api/onboard/:id         Profile     │
│    GET  /api/diagnostic/:id      Questions   │
│    POST /api/diagnostic/:id      Save Diag   │
│    GET  /api/today/:id           Daily Plan  │
│    POST /api/today/:id/:i/rate   Rate Task   │
│    GET  /api/priority/:id        Priorities  │
│  Auth:                                       │
│    POST /api/auth/migrate-session Migrate    │
│  Social:                                     │
│    GET  /api/admin/social       List Content  │
│    PUT  /api/admin/social/:id   Update        │
│  Automation:                                 │
│    POST /api/flywheel/generate  Content Gen   │
│    POST /telegram/daily-problem Daily Post    │
└──────────────────────────────────────────────┘
`);

    // Start in-process periodic jobs (deletion cleanup, health scan)
    // — see src/jobs/scheduler.ts. Disable with VIDHYA_DISABLE_SCHEDULER=1.
    // Dynamic import: ESM-safe, defers heavy job-module init until after listen.
    void (async () => {
      try {
        const { startScheduler } = await import('./jobs/scheduler.js');
        startScheduler();
      } catch (e: any) {
        console.error(`[server] scheduler start failed: ${e?.message}`);
      }
    })();
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[server] Shutting down...');
    void (async () => {
      try {
        const { stopScheduler } = await import('./jobs/scheduler.js');
        stopScheduler();
      } catch { /* noop */ }
      server.close(() => process.exit(0));
    })();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(console.error);
