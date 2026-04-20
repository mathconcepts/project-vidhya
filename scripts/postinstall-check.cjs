#!/usr/bin/env node
/**
 * Post-install environment check for Project Vidhya.
 *
 * Runs automatically after `npm install`. Reports which features are
 * unlocked based on environment variables and installed tools. Never
 * fails the install — exits 0 even when things are missing.
 */

const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

function log(msg) { process.stdout.write(msg + '\n'); }

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  const raw = fs.readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return { ...env, ...process.env };
}

function checkBundle() {
  const bundlePath = path.join(process.cwd(), 'frontend/public/data/content-bundle.json');
  if (!fs.existsSync(bundlePath)) return { built: false };
  try {
    const b = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'));
    return {
      built: true,
      problems: b.stats?.total_problems || b.problems?.length || 0,
      explainers: b.stats?.total_explainers || Object.keys(b.explainers || {}).length,
      verified: b.stats?.wolfram_verified || 0,
    };
  } catch {
    return { built: false };
  }
}

function checkFrontendBuild() {
  return fs.existsSync(path.join(process.cwd(), 'frontend/dist/index.html'));
}

function checkFrontendDeps() {
  return fs.existsSync(path.join(process.cwd(), 'frontend/node_modules'));
}

function tier(name, color, lines) {
  log('');
  log(`${BOLD}${color}${name}${RESET}`);
  for (const [sym, text] of lines) log(`  ${sym}  ${text}`);
}

function main() {
  const env = loadEnv();
  const bundle = checkBundle();
  const frontendBuilt = checkFrontendBuild();
  const frontendDeps = checkFrontendDeps();

  const hasJwt = !!env.JWT_SECRET && env.JWT_SECRET !== 'your_jwt_secret_here';
  const hasGemini = !!env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your_gemini_api_key_here' && env.GEMINI_API_KEY !== '';
  const hasWolfram = !!env.WOLFRAM_APP_ID && env.WOLFRAM_APP_ID !== '';
  const hasDb = !!env.DATABASE_URL && env.DATABASE_URL !== '';
  const hasClaude = !!env.ANTHROPIC_API_KEY;

  log('');
  log(`${BOLD}${CYAN}━━━ Project Vidhya — install check ━━━${RESET}`);

  // Required
  tier('Required', hasJwt && frontendDeps ? GREEN : YELLOW, [
    [hasJwt ? `${GREEN}✓${RESET}` : `${YELLOW}⚠${RESET}`, hasJwt ? 'JWT_SECRET set' : 'JWT_SECRET missing — run: echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env'],
    [frontendDeps ? `${GREEN}✓${RESET}` : `${YELLOW}⚠${RESET}`, frontendDeps ? 'Frontend deps installed' : 'Frontend deps missing — run: cd frontend && npm ci'],
    [bundle.built ? `${GREEN}✓${RESET}` : `${YELLOW}⚠${RESET}`, bundle.built ? `Content bundle present: ${bundle.problems} problems, ${bundle.explainers} explainers` : 'Content bundle missing — run: npx tsx scripts/build-bundle.ts'],
  ]);

  // Recommended
  tier('Recommended (Tier 2 — LLM generation)', hasGemini ? GREEN : GRAY, [
    [hasGemini ? `${GREEN}✓${RESET}` : `${GRAY}○${RESET}`, hasGemini ? 'GEMINI_API_KEY set — problem generation and error classification enabled' : 'GEMINI_API_KEY not set — get one at https://aistudio.google.com'],
    [frontendBuilt ? `${GREEN}✓${RESET}` : `${GRAY}○${RESET}`, frontendBuilt ? 'Frontend build present at frontend/dist' : 'Frontend not built — run: cd frontend && npm run build'],
  ]);

  // Production
  tier('Production (Tier 3 — Wolfram verification)', hasWolfram ? GREEN : GRAY, [
    [hasWolfram ? `${GREEN}✓${RESET}` : `${GRAY}○${RESET}`, hasWolfram ? `WOLFRAM_APP_ID set — Wolfram-verified badges enabled (${bundle.verified || 0} problems verified)` : 'WOLFRAM_APP_ID not set — get one at https://developer.wolframalpha.com/access'],
  ]);

  // Optional
  tier('Optional extras', GRAY, [
    [hasDb ? `${GREEN}✓${RESET}` : `${GRAY}○${RESET}`, hasDb ? 'DATABASE_URL set — persistent auth enabled' : 'DATABASE_URL not set — DB-less mode (this is fine)'],
    [hasClaude ? `${GREEN}✓${RESET}` : `${GRAY}○${RESET}`, hasClaude ? 'ANTHROPIC_API_KEY set — Claude fallback enabled' : 'ANTHROPIC_API_KEY not set — single-provider mode'],
  ]);

  log('');
  if (!hasJwt || !frontendDeps) {
    log(`${YELLOW}⚠  Required items missing. See INSTALL.md for full setup.${RESET}`);
  } else if (!hasGemini) {
    log(`${CYAN}→  Minimum install complete. App runs with bundled content only.${RESET}`);
    log(`${GRAY}   Add GEMINI_API_KEY to .env to unlock Tier 2 (LLM generation).${RESET}`);
    log(`${GRAY}   Start the server: npm run dev:server${RESET}`);
  } else if (!hasWolfram) {
    log(`${CYAN}→  Recommended install complete. Tier 2 enabled.${RESET}`);
    log(`${GRAY}   Add WOLFRAM_APP_ID to .env to enable computational verification.${RESET}`);
    log(`${GRAY}   Start the server: npm run dev:server${RESET}`);
  } else {
    log(`${GREEN}✓  Full install complete. All tiers enabled.${RESET}`);
    log(`${GRAY}   Start the server: npm run dev:server${RESET}`);
  }
  log('');
}

try { main(); } catch (err) {
  // Never fail the install
  log(`${DIM}[postinstall-check] skipped: ${err.message}${RESET}`);
}
