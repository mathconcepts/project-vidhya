#!/usr/bin/env node
/**
 * fork-test-lint — enforce Fork Test v2 (U1-14): "no exam-name literals in
 * engine modules."
 *
 * The Multi-Exam Expansion Design's architecture law: "An exam is a pack.
 * A pack selects capabilities from the engine's enumerated capability set;
 * it never defines new ones." This script is the CI-enforced version of
 * that law: it fails when the ENGINE (src/core/, src/gbrain/, src/readiness/,
 * src/scoring/ — as opposed to src/exams/ or src/syllabus/, which are
 * legitimately exam-aware by design) hardcodes a literal exam identifier
 * (GATE, BITSAT, JEE, NEET, CSIR, UGEE, or their kebab-case exam-catalog
 * ids) outside of a comment.
 *
 * A parameter/variable NAMED `examId` is fine — that's the whole point of
 * a capability-selecting pack. A literal `if (examId === 'gate-ma')` (or a
 * prompt string that hardcodes "You are a GATE tutor") inside an engine
 * module is the violation this catches.
 *
 * Matching is case-sensitive on purpose: `GATE` (all caps) is a real exam
 * identifier, but lowercase `gate` is a common English word (logic gate,
 * gateway) and would false-positive constantly if matched case-insensitively.
 *
 * ── Ratchet, not a hard stop ────────────────────────────────────────────
 * Running this against the current codebase finds real, pre-existing
 * violations (mostly GATE-specific LLM prompt strings and an
 * exam-config object in src/gbrain/ — see the U1-14 report). Hard-failing
 * CI on ALL of them today would block unrelated work with debt this task
 * didn't introduce and shouldn't silently "fix" with a large sweep.
 * Instead: `fork-test-lint-baseline.json` freezes today's known violations.
 * CI fails only on a NEW violation not already in the baseline — a ratchet
 * that stops the problem from growing while the existing debt gets tracked
 * and paid down deliberately (see the capability register).
 *
 * Usage:
 *   node scripts/fork-test-lint.mjs                 # fail on NEW violations only
 *   node scripts/fork-test-lint.mjs --strict         # fail on ANY violation (baseline included)
 *   node scripts/fork-test-lint.mjs --update-baseline  # rewrite the baseline to match current findings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINE_PATH = path.join(__dirname, 'fork-test-lint-baseline.json');

const ENGINE_DIRS = ['src/core', 'src/gbrain', 'src/readiness', 'src/scoring'];

// Real exam identifiers as they actually appear in this codebase (exam
// names + the kebab-case ids used in src/syllabus/exam-catalog.ts,
// src/exams/adapters/, and src/samples/). Case-sensitive — see header.
const IDENTIFIER_PATTERNS = [
  /\bGATE\b/,
  /\bBITSAT\b/,
  /\bJEE\b/,
  /\bNEET\b/,
  /\bCSIR\b/,
  /\bUGEE\b/,
  /\bgate-ma\b/,
  /\bgate-mathematics\b/,
  /\bgate-engineering-maths\b/,
  /\bjee-main\b/,
  /\bjee-advanced(-math)?\b/,
  /\bbitsat-math(ematics)?\b/,
  /\bcsir-net(-math)?\b/,
  /\bneet-physics\b/,
  /\bugee-mathematics\b/,
];

let errors = 0;
function err(msg) { console.error(`  ✗ ${msg}`); errors++; }
function warn(msg) { console.warn(`  ⚠ ${msg}`); }
function ok(msg) { console.log(`  ✓ ${msg}`); }

// ────────────────────────────────────────────────────────────────────
// File discovery
// ────────────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, out);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────
// Comment stripping — best-effort (matches the strip-then-scan convention
// already used by src/personalization/__tests__/surveillance-invariants.test.ts),
// improved with a quote-aware line scanner so a `//` inside a string
// (e.g. `https://gate.iitk.ac.in/`) doesn't truncate a code line.
// ────────────────────────────────────────────────────────────────────

function stripBlockComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripLineComment(line) {
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '\\') { i++; continue; }
    if (!inDouble && !inTemplate && c === "'") { inSingle = !inSingle; continue; }
    if (!inSingle && !inTemplate && c === '"') { inDouble = !inDouble; continue; }
    if (!inSingle && !inDouble && c === '`') { inTemplate = !inTemplate; continue; }
    if (!inSingle && !inDouble && !inTemplate && c === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }
  return line;
}

// ────────────────────────────────────────────────────────────────────
// Scan
// ────────────────────────────────────────────────────────────────────

function findViolations() {
  const violations = [];
  for (const dir of ENGINE_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const relPath = path.relative(ROOT, file);
      const raw = fs.readFileSync(file, 'utf8');
      const withoutBlockComments = stripBlockComments(raw);
      const lines = withoutBlockComments.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const code = stripLineComment(lines[i]);
        for (const re of IDENTIFIER_PATTERNS) {
          if (re.test(code)) {
            violations.push({
              file: relPath,
              line: i + 1,
              text: code.trim(),
            });
            break; // one hit per line is enough to report
          }
        }
      }
    }
  }
  return violations;
}

function violationKey(v) {
  return `${v.file}::${v.text}`;
}

// Baseline is a MULTISET (by (file, text) key), not a set: a duplicate line
// containing the same violating text is a genuinely NEW violation (another
// exam-name literal landed somewhere), not the same one twice. Storing plain
// counts — rather than deduping keys — is what makes the ratchet un-gameable:
// copy-pasting an already-baselined line elsewhere in the same file only
// stays "known" up to however many times it appeared when the baseline was
// captured; every occurrence past that count is flagged as new.
function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return new Map();
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    const arr = Array.isArray(parsed) ? parsed : [];
    const counts = new Map();
    for (const k of arr) counts.set(k, (counts.get(k) ?? 0) + 1);
    return counts;
  } catch {
    return new Map();
  }
}

function writeBaseline(violationList) {
  const keys = violationList.map(violationKey).sort();
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(keys, null, 2) + '\n');
}

// Classify each violation as known/fresh against the baseline multiset,
// consuming one baseline "credit" per matched occurrence so a repeated key
// can only absorb as many hits as the baseline actually recorded.
function classify(violations, baselineCounts) {
  const consumed = new Map();
  const known = [];
  const fresh = [];
  for (const v of violations) {
    const k = violationKey(v);
    const allowed = baselineCounts.get(k) ?? 0;
    const used = consumed.get(k) ?? 0;
    if (used < allowed) {
      known.push(v);
      consumed.set(k, used + 1);
    } else {
      fresh.push(v);
    }
  }
  return { known, fresh };
}

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const updateBaseline = args.includes('--update-baseline');

console.log('\nFork-test lint (U1-14) — no exam-name literals in engine modules...\n');

const violations = findViolations();

if (updateBaseline) {
  writeBaseline(violations);
  ok(`Baseline updated: ${violations.length} known violation(s) recorded at ${path.relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

const baselineCounts = loadBaseline();
const { known, fresh } = classify(violations, baselineCounts);

if (known.length > 0) {
  warn(`${known.length} pre-existing violation(s) in the baseline (tracked, not blocking):`);
  for (const v of known) {
    console.warn(`      ${v.file}:${v.line}  ${v.text}`);
  }
}

if (strict) {
  for (const v of known) err(`[strict] ${v.file}:${v.line}  ${v.text}`);
}

if (fresh.length > 0) {
  for (const v of fresh) {
    err(`NEW violation (not in baseline): ${v.file}:${v.line}  ${v.text}`);
  }
  console.error(
    '\nA new exam-name literal landed in an engine module (src/core, src/gbrain, ' +
    'src/readiness, src/scoring). Either parameterize it (pack selects capabilities; ' +
    'engine never hardcodes an exam id/name) or, if it is genuinely pre-existing debt ' +
    'you are just moving/renaming, run `node scripts/fork-test-lint.mjs --update-baseline`.\n',
  );
}

console.log(`\n${violations.length} total violation(s) found (${known.length} baseline, ${fresh.length} new).\n`);

process.exit(errors > 0 ? 1 : 0);
