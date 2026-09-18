#!/usr/bin/env npx tsx
/**
 * frontend/scripts/generate-concept-anchors.ts
 *
 * Codegen for Concept Anchors — the one plain sentence per concept that
 * says what the maths is FOR, rendered at the top of the first lesson card.
 *
 * Reads:
 *   data/registry/concept-anchors/<topic>.yml   (one file per topic)
 *
 * Emits:
 *   frontend/src/generated/concept-anchors.gen.ts
 *
 * The emitted module is deliberately import-free so it never drags a backend
 * module into the Vite bundle — same discipline as intent-slices.gen.ts. It
 * carries authored prose only: no per-student data, no question text.
 *
 * Only concepts with a real sentence are emitted. An honest absence
 * (`anchor: null` + `reason:`) is a decision recorded in the YAML for a
 * human reader and a deliberate no-op for the client — the renderer draws
 * nothing, which is exactly what "we have nothing honest to say here"
 * should look like on screen.
 *
 * Determinism: concepts are emitted in sorted-key order, so running this
 * twice against unchanged input produces a byte-identical file. A drift test
 * re-runs `buildConceptAnchorsModule()` in-memory and fails the build if the
 * checked-in file is stale.
 *
 * Regenerate after editing any anchor file:
 *
 *     npx tsx frontend/scripts/generate-concept-anchors.ts
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { loadConceptAnchors, validateAnchor } from '../../src/registry/concept-anchors';

const OUT_PATH = path.resolve(process.cwd(), 'frontend/src/generated/concept-anchors.gen.ts');

/**
 * Pure builder — returns the exact file text. Kept separate from the write
 * so the drift test can compare against the checked-in file without
 * touching disk.
 */
export function buildConceptAnchorsModule(): string {
  const all = loadConceptAnchors();
  const withAnchor = [...all.values()]
    .filter((a): a is typeof a & { anchor: string } => typeof a.anchor === 'string' && a.anchor.length > 0)
    .sort((a, b) => a.concept_id.localeCompare(b.concept_id));

  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * frontend/src/generated/concept-anchors.gen.ts');
  lines.push(' *');
  lines.push(' * GENERATED FILE — DO NOT EDIT BY HAND.');
  lines.push(' *');
  lines.push(' * Source of truth:');
  lines.push(' *   data/registry/concept-anchors/<topic>.yml');
  lines.push(' *');
  lines.push(' * Regenerate:');
  lines.push(' *   npx tsx frontend/scripts/generate-concept-anchors.ts');
  lines.push(' *');
  lines.push(' * Edit the YAML, then regenerate — never edit this file directly. A CI');
  lines.push(' * drift test re-runs the codegen builder in-memory and fails the build');
  lines.push(' * if this file is out of sync.');
  lines.push(' *');
  lines.push(' * Deliberately self-contained (no imports): this ships into the client');
  lines.push(' * bundle, so it carries authored prose only — no per-student data.');
  lines.push(' *');
  lines.push(' * Concepts whose anchor is an honest null are absent from this map by');
  lines.push(' * design; the renderer draws nothing for them.');
  lines.push(' */');
  lines.push('');
  lines.push('/** One plain sentence per concept: what this maths is FOR. */');
  lines.push('export const CONCEPT_ANCHORS: Readonly<Record<string, string>> = {');
  for (const a of withAnchor) {
    lines.push(`  ${JSON.stringify(a.concept_id)}: ${JSON.stringify(a.anchor)},`);
  }
  lines.push('};');
  lines.push('');
  lines.push('/** The sentence for a concept, or null when none is authored. */');
  lines.push('export function conceptAnchor(conceptId: string | undefined): string | null {');
  lines.push('  if (!conceptId) return null;');
  lines.push('  return CONCEPT_ANCHORS[conceptId] ?? null;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  const all = loadConceptAnchors();

  // Refuse to emit a contract-violating anchor into the client bundle. The
  // CI gate reports every violation across the corpus; this is the
  // narrower "never ship a bad one" backstop at the build seam.
  const bad: string[] = [];
  for (const a of all.values()) {
    if (typeof a.anchor !== 'string') continue;
    const problems = validateAnchor(a.anchor);
    if (problems.length) bad.push(`  ${a.concept_id}: ${problems.join('; ')}`);
  }
  if (bad.length) {
    console.error('[concept-anchors] refusing to generate — contract violations:');
    console.error(bad.join('\n'));
    process.exit(1);
  }

  const text = buildConceptAnchorsModule();
  const existing = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : null;
  if (existing === text) {
    console.log(`[concept-anchors] already up to date (${all.size} entries)`);
    return;
  }
  writeFileSync(OUT_PATH, text, 'utf8');
  const emitted = [...all.values()].filter((a) => typeof a.anchor === 'string').length;
  console.log(`[concept-anchors] wrote ${OUT_PATH}`);
  console.log(`[concept-anchors] ${emitted} anchors emitted, ${all.size - emitted} honest nulls skipped`);
}

// This package is `"type": "module"`, so `require.main === module` is a
// ReferenceError here, not a false-y no-op — the same ESM trap that took a
// production boot down in PR #134. The filename check is the idiom the
// sibling generator (generate-intent-slices.ts) already uses, and it keeps
// `buildConceptAnchorsModule` importable by the drift test without the
// import itself running the generator.
if (process.argv[1]?.endsWith('generate-concept-anchors.ts')) {
  main();
}
