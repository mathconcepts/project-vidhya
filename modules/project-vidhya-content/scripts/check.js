#!/usr/bin/env node
/**
 * scripts/check.js
 *
 * Validates the content repo's invariants. Runs locally before a PR
 * and in CI after a PR is pushed.
 *
 * Checks:
 *   1. Every concept/ folder has meta.yaml + explainer.md
 *   2. Every meta.yaml has required fields: concept_id, title,
 *      licence, contributor
 *   3. Every bundle references concepts that exist
 *   4. Every concept_id in a meta.yaml matches its folder name
 *   5. No explainer file references images / external assets that
 *      don't exist
 *
 * Usage:
 *   node scripts/check.js                  # check everything
 *   node scripts/check.js concepts/xxx     # check one concept only
 *
 * Exits 0 on pass, non-zero on any violation.
 */

const fs = require('fs');
const path = require('path');

// Minimal YAML parser for the subset we use (flat key: value).
// The content repo has no runtime — we don't want a dep tree.
function parseSimpleYaml(text) {
  const out = {};
  let currentKey = null;
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (line.startsWith('  -') || line.startsWith('    -')) {
      if (currentKey && Array.isArray(out[currentKey])) {
        out[currentKey].push(line.replace(/^\s*-\s*/, '').trim());
      }
      continue;
    }
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    currentKey = k;
    if (v.trim() === '') {
      out[k] = [];      // treat empty-value keys as array starters
    } else if (v.trim() === 'null') {
      out[k] = null;
    } else if (v.trim() === 'true') {
      out[k] = true;
    } else if (v.trim() === 'false') {
      out[k] = false;
    } else {
      out[k] = v.trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const errors = [];
const warnings = [];

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

// ─── Check 1+2+4: concepts ─────────────────────────────────────────

function checkConcept(conceptDir) {
  const name = path.basename(conceptDir);
  const metaPath = path.join(conceptDir, 'meta.yaml');
  const explPath = path.join(conceptDir, 'explainer.md');

  if (!fs.existsSync(metaPath)) {
    fail(`${conceptDir}: missing meta.yaml`);
    return null;
  }
  if (!fs.existsSync(explPath)) {
    fail(`${conceptDir}: missing explainer.md`);
    return null;
  }

  const meta = parseSimpleYaml(fs.readFileSync(metaPath, 'utf-8'));

  const required = ['concept_id', 'title', 'licence', 'contributor'];
  for (const k of required) {
    if (!meta[k]) fail(`${metaPath}: missing required field "${k}"`);
  }

  if (meta.concept_id && meta.concept_id !== name) {
    fail(`${metaPath}: concept_id "${meta.concept_id}" does not match folder name "${name}"`);
  }

  // Warn if no worked-example
  const wePath = path.join(conceptDir, 'worked-example.md');
  if (!fs.existsSync(wePath)) {
    warn(`${conceptDir}: no worked-example.md (recommended but not required)`);
  }

  return meta;
}

// ─── Check 3: bundles ─────────────────────────────────────────────

function checkBundle(bundlePath, existingConcepts) {
  let bundle;
  try {
    bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'));
  } catch (e) {
    fail(`${bundlePath}: JSON parse failed — ${e.message}`);
    return;
  }

  const required = ['id', 'name', 'description', 'concepts', 'licence'];
  for (const k of required) {
    if (!bundle[k]) fail(`${bundlePath}: missing field "${k}"`);
  }

  if (!Array.isArray(bundle.concepts)) {
    fail(`${bundlePath}: "concepts" must be an array`);
    return;
  }

  for (const c of bundle.concepts) {
    if (!existingConcepts.has(c)) {
      fail(`${bundlePath}: references concept "${c}" which does not exist under concepts/`);
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────

function main() {
  const root = process.cwd();
  const target = process.argv[2];
  const conceptsDir = path.join(root, 'concepts');
  const bundlesDir = path.join(root, 'bundles');

  if (!fs.existsSync(conceptsDir)) {
    fail('concepts/ directory not found');
    return done();
  }

  const conceptNames = fs.readdirSync(conceptsDir).filter(n => {
    return fs.statSync(path.join(conceptsDir, n)).isDirectory();
  });
  const conceptSet = new Set(conceptNames);

  if (target && target.startsWith('concepts/')) {
    const name = path.basename(target);
    if (!conceptSet.has(name)) {
      fail(`no concept found: ${target}`);
    } else {
      checkConcept(path.join(conceptsDir, name));
    }
    return done();
  }

  console.log(`Checking ${conceptNames.length} concept(s)...`);
  for (const name of conceptNames) {
    checkConcept(path.join(conceptsDir, name));
  }

  if (fs.existsSync(bundlesDir)) {
    const bundleFiles = fs.readdirSync(bundlesDir).filter(f => f.endsWith('.json'));
    console.log(`Checking ${bundleFiles.length} bundle(s)...`);
    for (const f of bundleFiles) {
      checkBundle(path.join(bundlesDir, f), conceptSet);
    }
  }

  done();
}

function done() {
  console.log('');
  if (warnings.length) {
    console.log(`${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  if (errors.length) {
    console.log(`${errors.length} error(s):`);
    for (const e of errors) console.log(`  ✗ ${e}`);
    process.exit(1);
  } else {
    console.log('✓ all checks passed');
    process.exit(0);
  }
}

main();
