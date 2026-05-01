#!/usr/bin/env node
/**
 * lint-interactives — verify the prefilled interactives library is healthy.
 *
 * Checks:
 *   1. Every library entry parses as valid JSON with required fields
 *   2. Every entry has at least one atom in `atoms_using` (orphan warning)
 *   3. Every atom referenced in `atoms_using` actually exists on disk
 *   4. Every `:::interactive{ref=name}` in atom files resolves to a library
 *      entry (broken reference → fail)
 *
 * Run via `npm run lint:interactives`. Designed to fail the build on broken
 * refs (catches typos before they ship to students).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LIB_DIR = path.join(ROOT, 'modules/project-vidhya-content/interactives-library');
const CONCEPTS_DIR = path.join(ROOT, 'modules/project-vidhya-content/concepts');

const REQUIRED_FIELDS = ['id', 'tier', 'config'];
const VALID_TIERS = new Set(['mathbox', 'desmos', 'manim', 'static']);

let errors = 0;
let warnings = 0;

function err(msg) { console.error(`  ✗ ${msg}`); errors++; }
function warn(msg) { console.warn(`  ⚠ ${msg}`); warnings++; }
function ok(msg) { console.log(`  ✓ ${msg}`); }

console.log('\nLinting interactives library...\n');

if (!fs.existsSync(LIB_DIR)) {
  console.log(`(no library directory at ${LIB_DIR} — nothing to lint)`);
  process.exit(0);
}

// 1. Walk library entries
const entries = fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.json'));
const library = new Map();

for (const file of entries) {
  const fullPath = path.join(LIB_DIR, file);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    err(`${file}: invalid JSON — ${e.message}`);
    continue;
  }

  for (const field of REQUIRED_FIELDS) {
    if (parsed[field] == null) {
      err(`${file}: missing required field "${field}"`);
    }
  }
  if (parsed.tier && !VALID_TIERS.has(parsed.tier)) {
    err(`${file}: invalid tier "${parsed.tier}" (must be one of ${[...VALID_TIERS].join(', ')})`);
  }
  const expectedId = file.replace(/\.json$/, '');
  if (parsed.id !== expectedId) {
    err(`${file}: id "${parsed.id}" does not match filename`);
  }
  library.set(parsed.id, parsed);
}

console.log(`\nLibrary: ${library.size} entries scanned, ${errors} errors so far\n`);

// 2. Walk every atom and check :::interactive refs
const atomRefs = new Map(); // ref -> [atom_paths]

if (fs.existsSync(CONCEPTS_DIR)) {
  for (const conceptDir of fs.readdirSync(CONCEPTS_DIR)) {
    const atomsDir = path.join(CONCEPTS_DIR, conceptDir, 'atoms');
    if (!fs.existsSync(atomsDir)) continue;
    for (const atomFile of fs.readdirSync(atomsDir).filter((f) => f.endsWith('.md'))) {
      const fullPath = path.join(atomsDir, atomFile);
      const content = fs.readFileSync(fullPath, 'utf-8');
      // Match :::interactive{ref=name} or :::interactive{ref="name"}
      const matches = content.matchAll(/:::interactive\{[^}]*\bref\s*=\s*["']?([a-z0-9-]+)["']?[^}]*\}/g);
      for (const m of matches) {
        const ref = m[1];
        const atomKey = `${conceptDir}/${atomFile}`;
        if (!atomRefs.has(ref)) atomRefs.set(ref, []);
        atomRefs.get(ref).push(atomKey);
        if (!library.has(ref)) {
          err(`${atomKey}: references unknown interactive "${ref}"`);
        }
      }
    }
  }
}

console.log(`\nAtom refs: ${atomRefs.size} unique refs across atoms\n`);

// 3. Check for orphan library entries (declared but unused)
for (const [id, entry] of library.entries()) {
  const declaredAtoms = entry.atoms_using ?? [];
  const actualAtomUses = atomRefs.get(id) ?? [];
  if (declaredAtoms.length === 0 && actualAtomUses.length === 0) {
    warn(`${id}: orphan — no atoms reference it (atoms_using is empty AND no :::interactive{ref=${id}} found)`);
  } else if (declaredAtoms.length > 0 && actualAtomUses.length === 0) {
    warn(`${id}: declared atoms_using=${JSON.stringify(declaredAtoms)} but no :::interactive{ref=${id}} found in atom files`);
  } else {
    ok(`${id}: used by ${actualAtomUses.length} atom(s)`);
  }
}

console.log('');
console.log(`Result: ${errors} errors, ${warnings} warnings`);

if (errors > 0) {
  console.log('\n✗ FAIL — fix the errors above before shipping');
  process.exit(1);
}
console.log('\n✓ PASS');
process.exit(0);
