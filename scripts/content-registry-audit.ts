#!/usr/bin/env npx tsx
/**
 * scripts/content-registry-audit.ts
 *
 * Zero-LLM-call readiness report for the prompt resource registry
 * (docs/designs/2026-09-02-wolfram-prompt-resource-registry.md). Answers,
 * for every one of the 116 GATE Engineering Mathematics atomic topics:
 * which Wolfram content family it classifies into, whether it maps to a
 * real concept_id, and which registered prompt resources (by category)
 * would actually fire when that concept is next generated for real.
 *
 * This is the artifact that makes "regenerate the corpus" concrete
 * without a live LLM call: it is exactly what changes the moment a
 * provider key exists and `generateConcept()` runs again — a pure data
 * join over what's already registered, not a simulation of generation.
 *
 * Not a CI gate — it never fails the build. An operator's readiness
 * report, run on demand (npm run content:registry-audit).
 */

import { classifyAllAtomicTopics } from '../src/content/wolfram-content-family';
import {
  ensureBuiltInPromptResourcesRegistered,
  listPromptResources,
  resolvePromptResources,
} from '../src/content/prompt-registry';

function main(): void {
  ensureBuiltInPromptResourcesRegistered();

  const allResources = listPromptResources();
  const byState = new Map<string, number>();
  for (const r of allResources) byState.set(r.approval_state, (byState.get(r.approval_state) ?? 0) + 1);

  console.log('=== Prompt resource registry ===');
  console.log(`${allResources.length} resources registered.`);
  for (const [state, count] of [...byState.entries()].sort()) {
    console.log(`  ${state}: ${count}`);
  }
  const draftResources = allResources.filter((r) => r.approval_state === 'draft');
  if (draftResources.length) {
    console.log(`\nNamed but unimplemented (never resolve into a live prompt):`);
    for (const r of draftResources) console.log(`  - ${r.resource_id}`);
  }

  const entries = classifyAllAtomicTopics();
  const familyCounts = new Map<string, number>();
  let mapped = 0;
  let unmapped = 0;

  console.log(`\n=== Per-topic coverage (${entries.length} atomic topics) ===`);
  for (const entry of entries.sort((a, b) => a.atomic_id.localeCompare(b.atomic_id))) {
    familyCounts.set(entry.family, (familyCounts.get(entry.family) ?? 0) + 1);
    if (entry.concept_id) mapped++; else unmapped++;

    const topics = [entry.spec.structure.template_family, entry.family];
    const teaching = resolvePromptResources('teaching_function', topics).length;
    const modifiers = resolvePromptResources('modifier', topics).length;

    const conceptLabel = entry.concept_id ?? '(unmapped — see atomic-concept-map.ts UNMAPPED_ATOMIC_IDS)';
    console.log(
      `  ${entry.atomic_id.padEnd(6)} family=${entry.family.padEnd(11)} concept=${conceptLabel.padEnd(40)} teaching_resources=${teaching} modifiers=${modifiers}`,
    );
  }

  console.log(`\n=== Summary ===`);
  console.log(`Concept mapping: ${mapped}/${entries.length} resolve to a real concept_id, ${unmapped} unmapped.`);
  console.log('By Wolfram content family:');
  for (const [family, count] of [...familyCounts.entries()].sort()) {
    console.log(`  ${family.padEnd(12)} ${count}`);
  }

  console.log(
    `\nThis report used ZERO LLM calls. When a provider key is configured, ` +
    `the SAME resources listed above are what generateConcept() will compose ` +
    `into buildPrompt() for each of the ${mapped} mapped concepts — this is ` +
    `the readiness state a real regeneration run would start from.`,
  );
}

main();
