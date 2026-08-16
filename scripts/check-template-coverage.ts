/**
 * scripts/check-template-coverage.ts
 *
 * Every concept's topic must resolve to an authoring template.
 *
 * ── Why this exists ─────────────────────────────────────────────────────
 *
 * `getTemplate(topicFamily, atomType)` (template-loader.ts:114-122) returns
 * `null` when no template declares that `topic_family`. Generation then falls
 * back to un-guided output. Nothing logs, nothing fails, and the atoms still
 * appear — just written to no cadence at all.
 *
 * That is exactly how it went unnoticed: of 97 concepts, only 45 resolved.
 * Three templates declared a `topic_family` that was one rename away from the
 * real topic (`probability` vs `probability-statistics`, `complex-numbers` vs
 * `complex-variables`, `discrete-math` vs `discrete-mathematics`), and five
 * topics had no template at all. The plan that depended on templates carrying
 * the stance cadence would have silently skipped 52 concepts.
 *
 * The lookup key is the `topic_family:` FIELD inside the YAML, not the
 * filename. Renaming a file fixes nothing. This check reads the field.
 *
 * ── What it checks ──────────────────────────────────────────────────────
 *
 *   1. Every topic in the concept graph has a template declaring it.  (FAIL)
 *   2. Every template's `topic_family` matches some concept's topic.  (WARN)
 *
 * The second is a warning, not a failure: an unused template is dead weight
 * rather than a broken build, and saying so is more useful than deleting
 * someone's work on a script's say-so.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CONCEPT_MAP } from '../src/constants/concept-graph';

const TEMPLATE_DIR = path.join(
  process.cwd(),
  'modules/project-vidhya-content/templates',
);

export interface CoverageReport {
  /** topic → number of concepts, for topics with no template. */
  missing: Array<{ topic: string; concepts: number; examples: string[] }>;
  /** `topic_family` values declared by a template but claimed by no concept. */
  orphanTemplates: string[];
  coveredConcepts: number;
  totalConcepts: number;
}

/** `topic_family:` as declared inside each template file. */
export function declaredTopicFamilies(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    // Deliberately a line match rather than a YAML parse: this gate must keep
    // working when a template is malformed elsewhere in the file, because a
    // malformed template is precisely when you want to be told about it.
    const m = raw.match(/^topic_family:\s*(\S+)\s*$/m);
    if (m) out.set(m[1], file);
  }
  return out;
}

/** Pure — the caller supplies both sides so this is testable without fixtures. */
export function reconcile(
  conceptTopics: Map<string, string>,
  declared: Map<string, string>,
): CoverageReport {
  const byTopic = new Map<string, string[]>();
  for (const [conceptId, topic] of conceptTopics) {
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(conceptId);
  }

  const missing: CoverageReport['missing'] = [];
  let covered = 0;
  for (const [topic, concepts] of byTopic) {
    if (declared.has(topic)) {
      covered += concepts.length;
    } else {
      missing.push({
        topic,
        concepts: concepts.length,
        examples: concepts.slice(0, 3),
      });
    }
  }
  missing.sort((a, b) => b.concepts - a.concepts);

  const orphanTemplates = [...declared.keys()]
    .filter((t) => !byTopic.has(t))
    .sort();

  return {
    missing,
    orphanTemplates,
    coveredConcepts: covered,
    totalConcepts: conceptTopics.size,
  };
}

/** Topics of every concept that actually has authored atoms on disk. */
export function conceptTopicsWithAtoms(conceptsDir: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!fs.existsSync(conceptsDir)) return out;
  for (const dir of fs.readdirSync(conceptsDir)) {
    if (!fs.existsSync(path.join(conceptsDir, dir, 'atoms'))) continue;
    const node = CONCEPT_MAP.get(dir) as { topic?: string } | undefined;
    // A concept directory with no graph node cannot resolve a template either;
    // surface it under a name an operator can search for rather than skipping.
    out.set(dir, node?.topic ?? `__not-in-concept-graph__`);
  }
  return out;
}

function main(): void {
  const conceptTopics = conceptTopicsWithAtoms(
    path.join(process.cwd(), 'modules/project-vidhya-content/concepts'),
  );
  const declared = declaredTopicFamilies(TEMPLATE_DIR);
  const r = reconcile(conceptTopics, declared);

  console.log(
    `[template-coverage] ${r.coveredConcepts}/${r.totalConcepts} concepts resolve to a template`,
  );

  for (const o of r.orphanTemplates) {
    console.warn(
      `[template-coverage] warning: template declares topic_family "${o}" which no concept uses — dead template`,
    );
  }

  if (r.missing.length === 0) {
    console.log('[template-coverage] OK');
    return;
  }

  console.error('\n[template-coverage] FAIL — topics with no authoring template:\n');
  for (const m of r.missing) {
    console.error(
      `  ${m.topic.padEnd(26)} ${String(m.concepts).padStart(3)} concepts   e.g. ${m.examples.join(', ')}`,
    );
  }
  console.error(
    '\nAdd a template under modules/project-vidhya-content/templates/ whose\n' +
      '`topic_family:` field equals the topic above. The FIELD is the lookup key,\n' +
      'not the filename. Without it, generation for these concepts falls back to\n' +
      'un-guided output and no cadence is applied.\n',
  );
  process.exit(1);
}

// Only run when invoked directly, so the tests can import the pure functions.
if (process.argv[1] && process.argv[1].endsWith('check-template-coverage.ts')) {
  main();
}
