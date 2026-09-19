/**
 * scripts/check-topic-namespace.ts — the `ci:topic-namespace` runner.
 *
 * Run:  npx tsx scripts/check-topic-namespace.ts
 * Exit: 0 when clean, 1 on any violation.
 *
 * The logic, and the full rationale for why this gate exists, live in
 * src/curriculum/topic-namespace.ts (same split as ci:variant-agreement).
 */

import { CONCEPT_GRAPH_SOURCES } from '../src/constants/concept-graph';
import {
  collectTopicClaims,
  findTopicCollisions,
} from '../src/curriculum/topic-namespace';

function main(): void {
  const claims = collectTopicClaims();
  const collisions = findTopicCollisions(claims);
  const distinctTopics = new Set(claims.map((c) => c.topic));
  const packs = CONCEPT_GRAPH_SOURCES.filter((s) => s.concept_count > 0);

  console.log(
    `[topic-namespace] ${distinctTopics.size} topic string(s) across ${packs.length} declaring pack(s): ` +
      packs.map((p) => `${p.exam_id}(${p.concept_count})`).join(', '),
  );

  if (collisions.length === 0) {
    console.log('[topic-namespace] OK - every topic string is claimed by exactly one exam pack.');
    process.exit(0);
  }

  console.error('');
  console.error(`[topic-namespace] FAIL - ${collisions.length} topic string(s) claimed by more than one pack.`);
  console.error('');
  for (const [topic, cs] of collisions) {
    console.error(`  topic "${topic}" is claimed by:`);
    for (const c of cs) {
      const sample = c.concept_ids.slice(0, 4).join(', ');
      const more = c.concept_ids.length > 4 ? `, +${c.concept_ids.length - 4} more` : '';
      console.error(`    - ${c.exam_id}  (${c.concept_ids.length} concept(s): ${sample}${more})`);
    }
    console.error('');
  }
  console.error('  Fix: give the NEWER pack a namespaced topic string, e.g. "jee-calculus"');
  console.error('  rather than "calculus". Concept IDS stay global and shared by design -');
  console.error('  only the topic STRING has to be unique per pack.');
  console.error('  Rationale: src/curriculum/topic-namespace.ts');
  console.error('');
  process.exit(1);
}

main();
