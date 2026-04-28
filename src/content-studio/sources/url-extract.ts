// @ts-nocheck
/**
 * src/content-studio/sources/url-extract.ts
 *
 * Source adapter: URL fetch + main-content extraction.
 *
 * SCOPE: bounded by design. Admin pastes a single URL. We fetch it,
 * strip script/style/nav, prefer <main>/<article> body if present,
 * fall back to <body>. No crawling. No allowlist (admin is trusted).
 *
 * NOT a web scraper. The user explicitly accepted this scope —
 * full crawling was the alternative and was deliberately not chosen.
 *
 * The extraction is intentionally simple regex-based, not jsdom or
 * @mozilla/readability. Two reasons:
 *   1. Zero new deps — keeps the install footprint small
 *   2. The admin reviews the result before approving — brittleness
 *      of regex extraction is acceptable because bad extractions
 *      get rejected
 *
 * Limits:
 *   - 10 second fetch timeout
 *   - 5 MB max response size — hard cap, refuse beyond
 *   - 100k chars max extracted text — truncate, append a note
 *   - Only http(s) — refuse file://, ftp://, etc.
 *   - No following redirects beyond the standard fetch behaviour
 *     (Node fetch follows redirects by default, fine for trusted URL)
 */

import type { GenerationRequest } from '../types';
import type { AdapterResult } from './uploads';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_EXTRACTED_CHARS = 100_000;

export async function tryUrlExtractSource(
  req: GenerationRequest,
): Promise<AdapterResult | null> {
  const url = (req.source_url ?? '').trim();
  if (!url) return null;

  // Basic protocol check
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  // Fetch with timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let html: string;
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      // A polite UA — most sites accept it; tells admins what they're seeing
      // in their server logs if they look.
      headers: { 'User-Agent': 'ProjectVidhya-ContentStudio/1.0' },
    });
    if (!resp.ok) return null;
    // Cheap size guard — read as text but check Content-Length first
    const len_header = resp.headers.get('content-length');
    if (len_header && Number(len_header) > MAX_RESPONSE_BYTES) {
      return null;
    }
    html = await resp.text();
    if (html.length > MAX_RESPONSE_BYTES) {
      // No content-length but it's still too big after the fact
      return null;
    }
  } catch (e: any) {
    return null;
  } finally {
    clearTimeout(timer);
  }

  // Extract main content
  const extracted = extractMainText(html);
  if (!extracted || extracted.trim().length < 100) {
    // Less than 100 chars of extracted text isn't worth a draft
    return null;
  }

  // Truncate if huge
  let body_text = extracted;
  let truncated = false;
  if (body_text.length > MAX_EXTRACTED_CHARS) {
    body_text = body_text.slice(0, MAX_EXTRACTED_CHARS);
    truncated = true;
  }

  // Compose the draft body. Include the source URL so the admin (and
  // later, anyone reading the library) sees provenance.
  const lines: string[] = [];
  lines.push(`# ${req.title}`);
  lines.push('');
  lines.push(`> Source: [${parsed.hostname}](${url})`);
  lines.push('');
  lines.push(body_text);
  if (truncated) {
    lines.push('');
    lines.push(
      `*(Source content was truncated at ${MAX_EXTRACTED_CHARS} characters. ` +
      'Visit the source URL above for the full text.)*',
    );
  }
  lines.push('');
  lines.push('## Notes for reviewer');
  lines.push('');
  lines.push(
    'This draft was extracted from an external URL. Verify the licence ' +
    'allows redistribution before approving for the library. The extraction ' +
    'is heuristic — script/style tags are stripped but layout artefacts may ' +
    'remain. Edit liberally before approval.',
  );

  return {
    body: lines.join('\n'),
    detail: `extracted ${extracted.length} chars from ${parsed.hostname}` +
            (truncated ? ' (truncated)' : ''),
  };
}

/**
 * Strip script / style / nav / head, prefer <main> or <article>
 * if present, else fall back to <body>. Then strip remaining tags
 * to leave plain text.
 *
 * Hand-rolled regex is intentionally simple — readability + jsdom
 * would be the production choice, but the admin reviews each draft
 * so brittleness is acceptable.
 */
function extractMainText(html: string): string {
  let text = html;

  // Drop everything we don't want, in order
  text = text.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '');
  text = text.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, '');
  text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
  // Strip HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Prefer <article> or <main> if either is present
  const article_m = text.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const main_m = text.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let candidate = article_m?.[1] ?? main_m?.[1] ?? text;

  // Convert common block tags to newlines so paragraphs survive
  candidate = candidate.replace(/<\/(p|div|section|li|h[1-6]|br)\s*>/gi, '\n');
  candidate = candidate.replace(/<br\s*\/?>/gi, '\n');
  // Convert headings to markdown-ish
  candidate = candidate.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  candidate = candidate.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  candidate = candidate.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');

  // Now strip all remaining tags
  candidate = candidate.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  candidate = candidate
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '...');

  // Collapse whitespace
  candidate = candidate.replace(/[ \t]+/g, ' ');
  candidate = candidate.replace(/\n[ \t]+/g, '\n');
  candidate = candidate.replace(/[ \t]+\n/g, '\n');
  candidate = candidate.replace(/\n{3,}/g, '\n\n');

  return candidate.trim();
}
