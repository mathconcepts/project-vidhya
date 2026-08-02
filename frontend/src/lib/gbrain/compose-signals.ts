/**
 * Compose-time signal gathering (content-pipeline realignment items 6 + 7).
 *
 * Before POSTing /api/lesson/compose, the client gathers:
 *   - mastery_by_topic / mastery_by_concept from the local StudentModel
 *     (IndexedDB 'student' store)
 *   - recent_errors (last 10, most-recent-first) from the 'errors' store
 *   - user_material_chunks relevant to the concept via the existing
 *     IndexedDB RAG search (searchMaterials), capped at 5 chunks
 *
 * Everything here is best-effort and NEVER throws: any failure (no model
 * downloaded yet, empty stores, embedder timeout) degrades to the empty
 * signal set, which the server treats as the generic path — byte-identical
 * to a signal-less request (spec-locked generic-first ladder).
 *
 * Privacy: signals come from the student's OWN local stores and feed
 * deterministic local composition on the server. Nothing here grants
 * LLM/Wolfram consent — those remain per-request opt-in flags on the
 * content router.
 */

import { getStudentModel, getErrors, searchMaterials, getChunk, getMaterial, getAllMaterials } from './db';
import { getConcept, getAllConcepts } from './concept-loader';
import { embed } from './embedder';

export interface UserMaterialChunkPayload {
  material_id: string;
  material_title: string;
  chunk_text: string;
  similarity: number;
}

export interface RecentErrorPayload {
  concept_id: string;
  error_type: string;
  created_at: string;
}

export interface ComposeSignals {
  mastery_by_topic?: Record<string, number>;
  mastery_by_concept?: Record<string, number>;
  recent_errors?: RecentErrorPayload[];
  user_material_chunks?: UserMaterialChunkPayload[];
}

/** Server-side cap (source-resolver slices to 5) — mirror it here. */
const MAX_CHUNKS = 5;
/** Server-side similarity floor (source-resolver filters < 0.55). */
const MIN_SIMILARITY = 0.55;
/** Last N errors transmitted (server caps at 10 too). */
const MAX_RECENT_ERRORS = 10;
/**
 * Embedder budget: the MiniLM model is a ~22MB one-time download. If it
 * is not warm within this window, skip materials for THIS compose rather
 * than blocking the lesson. Next visit will have the cached model.
 */
const EMBED_TIMEOUT_MS = 4000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/** Mastery + recent-error signals from the local GBrain stores. */
async function gatherStudentSignals(sessionId: string): Promise<Pick<ComposeSignals, 'mastery_by_topic' | 'mastery_by_concept' | 'recent_errors'>> {
  const out: Pick<ComposeSignals, 'mastery_by_topic' | 'mastery_by_concept' | 'recent_errors'> = {};

  try {
    const model = await getStudentModel(sessionId);
    const vector: Record<string, { score?: number }> = model?.mastery_vector ?? {};
    const conceptEntries = Object.entries(vector).filter(
      ([, v]) => typeof v?.score === 'number',
    );
    if (conceptEntries.length > 0) {
      out.mastery_by_concept = Object.fromEntries(
        conceptEntries.map(([cid, v]) => [cid, v.score as number]),
      );
      // Roll concept mastery up to topics via the concept graph.
      const concepts = await getAllConcepts();
      const topicOf = new Map(concepts.map((c) => [c.id, c.topic]));
      const sums = new Map<string, { total: number; n: number }>();
      for (const [cid, v] of conceptEntries) {
        const topic = topicOf.get(cid);
        if (!topic) continue;
        const s = sums.get(topic) ?? { total: 0, n: 0 };
        s.total += v.score as number;
        s.n += 1;
        sums.set(topic, s);
      }
      if (sums.size > 0) {
        out.mastery_by_topic = Object.fromEntries(
          [...sums.entries()].map(([topic, s]) => [topic, s.total / s.n]),
        );
      }
    }
  } catch { /* no model yet — generic path */ }

  try {
    const errors = await getErrors(sessionId, 30);
    if (errors.length > 0) {
      const recent = [...errors]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, MAX_RECENT_ERRORS)
        .map((e) => ({ concept_id: e.concept_id, error_type: e.error_type, created_at: e.created_at }));
      out.recent_errors = recent;
    }
  } catch { /* no errors logged — generic path */ }

  return out;
}

/**
 * Concept-relevant chunks from the student's uploaded materials, via the
 * existing IndexedDB vector search. Skipped entirely (cheaply) when the
 * student has no materials.
 */
async function gatherMaterialChunks(conceptId: string): Promise<UserMaterialChunkPayload[]> {
  try {
    const materials = await getAllMaterials();
    if (!materials || materials.length === 0) return [];

    const concept = await getConcept(conceptId).catch(() => undefined);
    const queryText = concept
      ? `${concept.label}. ${concept.description}`
      : conceptId.replace(/-/g, ' ');

    const vector = await withTimeout(embed(queryText), EMBED_TIMEOUT_MS);
    const hits = await searchMaterials(vector, MAX_CHUNKS);

    const out: UserMaterialChunkPayload[] = [];
    for (const hit of hits) {
      if (hit.score < MIN_SIMILARITY) continue;
      const chunk = await getChunk(hit.chunk_id);
      if (!chunk) continue;
      const material = await getMaterial(chunk.material_id);
      out.push({
        material_id: chunk.material_id,
        material_title: material?.filename ?? 'your uploaded material',
        chunk_text: chunk.text,
        similarity: hit.score,
      });
    }
    return out.slice(0, MAX_CHUNKS);
  } catch {
    // Embedder cold / stores unavailable — compose generically this time.
    return [];
  }
}

/**
 * Gather everything the compose endpoint can personalize on. Never throws;
 * empty stores produce an empty object (server generic path).
 */
export async function gatherComposeSignals(
  sessionId: string,
  conceptId: string,
): Promise<ComposeSignals> {
  const [student, chunks] = await Promise.all([
    gatherStudentSignals(sessionId),
    gatherMaterialChunks(conceptId),
  ]);
  const signals: ComposeSignals = { ...student };
  if (chunks.length > 0) signals.user_material_chunks = chunks;
  return signals;
}
