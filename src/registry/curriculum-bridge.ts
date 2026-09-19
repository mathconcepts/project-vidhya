/**
 * src/registry/curriculum-bridge.ts
 *
 * "Have I seen this before, or is this new?" — per school curriculum, per
 * entrance-exam concept.
 *
 * Every framing registry that came before this one is EXAM-framed:
 * `pain-points.ts`, the atomic catalogue's `gate_examination_intent`, the
 * attention-design hypothesis, and `intent-profiles.yml` all describe what
 * the exam wants. `concept-anchors.ts` added the real-world "what is this
 * maths FOR". None of them answer the question a state-board student
 * actually arrives with.
 *
 * That question is not cosmetic for the audience this shipped for. A Tamil
 * Nadu HSE student sitting JEE Main has their board theory papers running
 * through the whole of March and JEE Session 2 starting six days after they
 * end. Time spent re-teaching integration, which their board teaches well,
 * is time not spent on skew lines, which it does not teach at all. Getting
 * the "revision or new?" call wrong in either direction is expensive, and
 * until this registry existed the platform had no way to make the call.
 *
 * WHAT THIS IS NOT. It holds no per-student data and never will. A bridge
 * entry is a statement about a PUBLISHED STATE SYLLABUS — the same claim for
 * every student on that track, checkable against the board's own chapter
 * list. The only per-student input is which track they picked, which
 * `exam-profile-store` has stored as `knowledge_track_id` since long before
 * this file. That keeps it on the right side of the surveillance
 * invariants: no new column, no behavioural signal, nothing inferred.
 *
 * Adding a board: one YAML file under data/registry/curriculum-bridges/,
 * named for its `track_id`, covering every concept its `target_exam`
 * declares. `npm run ci:curriculum-bridge` refuses a partial one.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { CONCEPT_MAP, conceptsDeclaredByExam } from '../constants/concept-graph';
import { KNOWLEDGE_TRACKS } from '../knowledge/tracks';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const BRIDGES_DIR = path.resolve(HERE, '../../data/registry/curriculum-bridges');

/**
 * How a board's coverage of one exam concept stands. Closed set: a fifth
 * value would be a new editorial judgement, not a new string.
 */
export type BridgeCoverage =
  /** Board teaches it at roughly the depth the exam wants. */
  | 'aligned'
  /** Board teaches it; the exam wants more depth, or a second representation. */
  | 'partial'
  /** Board does not teach it in the relevant school years at all. */
  | 'gap'
  /** Board teaches it; the exam does not ask for it. */
  | 'surplus';

export const BRIDGE_COVERAGES: readonly BridgeCoverage[] = [
  'aligned', 'partial', 'gap', 'surplus',
];

/**
 * How well-established the coverage claim is.
 *
 * `confirmed` means the board's own published chapter or exercise list
 * settles it. `probable` means it could not be confirmed either way from the
 * published structure and the claim is a reasoned read of it. Recording the
 * difference is the point: a bridge line is shown to a student as fact, and
 * a topic wrongly called "new" wastes their scarcest resource.
 */
export type BridgeConfidence = 'confirmed' | 'probable';
export const BRIDGE_CONFIDENCES: readonly BridgeConfidence[] = ['confirmed', 'probable'];

/** A bridge line is read on a phone beside the concept anchor. Keep it short. */
export const MAX_BRIDGE_CHARS = 160;

export interface ConceptBridge {
  concept_id: string;
  coverage: BridgeCoverage;
  confidence: BridgeConfidence;
  /** The board chapter this claim rests on, named so it can be checked. */
  board_source: string;
  /** One sentence shown to the student. */
  bridge: string;
}

export interface SurplusBoardTopic {
  label: string;
  detail: string;
}

export interface CurriculumBridgeFile {
  version: 1;
  track_id: string;
  board_label: string;
  target_exam: string;
  concepts: Record<string, ConceptBridge>;
  surplus_board_topics: SurplusBoardTopic[];
  /** Where it was read from — for error messages, never rendered. */
  source_file: string;
}

/**
 * Contract for ONE bridge line. Returns human-readable problems; [] is a
 * pass. Exported so the gate and any future authoring tool check the same
 * rules rather than two drifting copies.
 */
export function validateBridge(entry: {
  coverage?: unknown;
  confidence?: unknown;
  board_source?: unknown;
  bridge?: unknown;
}): string[] {
  const problems: string[] = [];

  if (!BRIDGE_COVERAGES.includes(entry.coverage as BridgeCoverage)) {
    problems.push(`coverage must be one of ${BRIDGE_COVERAGES.join(' | ')}, got ${JSON.stringify(entry.coverage)}`);
  }
  if (!BRIDGE_CONFIDENCES.includes(entry.confidence as BridgeConfidence)) {
    problems.push(`confidence must be one of ${BRIDGE_CONFIDENCES.join(' | ')}, got ${JSON.stringify(entry.confidence)}`);
  }

  const source = typeof entry.board_source === 'string' ? entry.board_source.trim() : '';
  if (source.length === 0) {
    problems.push('board_source is required — an unsourced coverage claim is a guess');
  }

  const text = typeof entry.bridge === 'string' ? entry.bridge.trim() : '';
  if (text.length === 0) {
    problems.push('bridge sentence is empty');
  } else {
    if (text.length > MAX_BRIDGE_CHARS) {
      problems.push(`${text.length} characters, cap is ${MAX_BRIDGE_CHARS}`);
    }
    // No notation. This sits beside the anchor above the first card, before
    // any mathematics has been introduced — same rule, same reason.
    if (/[$\\]/.test(text)) {
      problems.push('no mathematical notation in a bridge line');
    }
    // A gap is information, not a warning. This registry exists to let a
    // student spend their time well, and alarm language spends it worse:
    // the audience it was written for is already sitting board exams and an
    // entrance exam in the same eight weeks.
    const alarm = text.match(/\b(danger|warning|fail|failing|behind|disadvantage|weak|weakness|struggle|worry|panic|risk)\b/i);
    if (alarm) problems.push(`alarm framing: "${alarm[0]}" — state the gap, do not dramatise it`);
  }

  return problems;
}

function coerceEntry(concept_id: string, raw: unknown): ConceptBridge {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    concept_id,
    coverage: r.coverage as BridgeCoverage,
    confidence: r.confidence as BridgeConfidence,
    board_source: String(r.board_source ?? ''),
    bridge: String(r.bridge ?? ''),
  };
}

/** Parse one bridge file. Throws with the file named on a structural problem. */
export function loadBridgeFile(filePath: string): CurriculumBridgeFile {
  const raw = parseYaml(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  const rel = path.basename(filePath);

  if (raw?.version !== 1) {
    throw new Error(`${rel}: unsupported version ${JSON.stringify(raw?.version)} (expected 1)`);
  }
  for (const key of ['track_id', 'board_label', 'target_exam'] as const) {
    if (typeof raw[key] !== 'string' || !(raw[key] as string).trim()) {
      throw new Error(`${rel}: ${key} is required`);
    }
  }

  const concepts: Record<string, ConceptBridge> = {};
  for (const [cid, value] of Object.entries((raw.concepts ?? {}) as Record<string, unknown>)) {
    concepts[cid] = coerceEntry(cid, value);
  }

  const surplus = Array.isArray(raw.surplus_board_topics)
    ? (raw.surplus_board_topics as Array<Record<string, unknown>>).map((t) => ({
        label: String(t?.label ?? ''),
        detail: String(t?.detail ?? ''),
      }))
    : [];

  return {
    version: 1,
    track_id: raw.track_id as string,
    board_label: raw.board_label as string,
    target_exam: raw.target_exam as string,
    concepts,
    surplus_board_topics: surplus,
    source_file: rel,
  };
}

let _cache: CurriculumBridgeFile[] | null = null;

/** Every bridge file on disk. Cached; pass true to re-read (tests). */
export function loadAllBridges(forceReload = false): CurriculumBridgeFile[] {
  if (_cache && !forceReload) return _cache;
  let files: string[] = [];
  try {
    files = fs.readdirSync(BRIDGES_DIR).filter((f) => /\.ya?ml$/.test(f)).sort();
  } catch {
    files = [];
  }
  _cache = files.map((f) => loadBridgeFile(path.join(BRIDGES_DIR, f)));
  return _cache;
}

/** The bridge file for a knowledge track, or null when none is authored. */
export function bridgeForTrack(track_id: string | null | undefined): CurriculumBridgeFile | null {
  if (!track_id) return null;
  return loadAllBridges().find((b) => b.track_id === track_id) ?? null;
}

/**
 * The one bridge line for (track, concept), or null.
 *
 * Null is the normal case, not an error: most students are on a track with
 * no authored bridge, and a lesson page renders nothing rather than guessing
 * what their board taught them.
 */
export function bridgeFor(
  track_id: string | null | undefined,
  concept_id: string,
): ConceptBridge | null {
  return bridgeForTrack(track_id)?.concepts[concept_id] ?? null;
}

export interface BridgeAuditProblem {
  file: string;
  concept_id: string | null;
  message: string;
}

/**
 * Full audit, shared by the CI gate and its tests.
 *
 * Checks, in order: the track resolves to a real KnowledgeTrack; the target
 * exam declares concepts at all; every concept the exam declares has an
 * entry (COVERAGE — a partial bridge is worse than none, because the
 * concepts it silently omits are exactly the ones nobody thought about);
 * no entry names a concept outside that exam; and every entry passes
 * `validateBridge`.
 */
export function auditBridges(bridges = loadAllBridges(true)): BridgeAuditProblem[] {
  const problems: BridgeAuditProblem[] = [];
  const trackIds = new Set(KNOWLEDGE_TRACKS.map((t) => t.id));

  for (const file of bridges) {
    const where = file.source_file;

    if (!trackIds.has(file.track_id)) {
      problems.push({
        file: where,
        concept_id: null,
        message: `track_id "${file.track_id}" is not a registered knowledge track (src/knowledge/tracks.ts)`,
      });
    }

    const examConcepts = conceptsDeclaredByExam(file.target_exam);
    if (examConcepts.length === 0) {
      problems.push({
        file: where,
        concept_id: null,
        message: `target_exam "${file.target_exam}" declares no concepts — nothing to bridge to`,
      });
      continue;
    }

    const examIds = new Set(examConcepts.map((c) => c.id));
    for (const cid of examIds) {
      if (!file.concepts[cid]) {
        problems.push({
          file: where,
          concept_id: cid,
          message: `no bridge entry — every concept ${file.target_exam} declares needs one`,
        });
      }
    }

    for (const [cid, entry] of Object.entries(file.concepts)) {
      if (!CONCEPT_MAP.has(cid)) {
        problems.push({ file: where, concept_id: cid, message: 'not a concept in the graph' });
        continue;
      }
      if (!examIds.has(cid)) {
        problems.push({
          file: where,
          concept_id: cid,
          message: `belongs to another exam pack, not ${file.target_exam}`,
        });
        continue;
      }
      for (const p of validateBridge(entry)) {
        problems.push({ file: where, concept_id: cid, message: p });
      }
    }
  }

  return problems;
}
