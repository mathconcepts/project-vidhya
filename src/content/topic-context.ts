/**
 * Topic Context importer
 *
 * Deterministic parser over the authored per-topic study guides at
 * data/courses/gate-em/topics/NN-<topic>/teaching-tips.md (10 files;
 * the NN- prefix strips to a concept-graph topic id, e.g.
 * `01-linear-algebra` → `linear-algebra`).
 *
 * Each file is split into sections by `##` heading. A section whose
 * heading matches a concept label (for a concept in that topic) attaches
 * to that concept; every other section attaches at topic level. Within
 * the topic-level content, the "Mental Model" and "Study Strategy"
 * subsections are surfaced directly — the lesson composer uses them as
 * honest intuition/strategy content for concepts that don't yet have a
 * real explainer.
 *
 * No LLM involved. Lazy, cached per process. Missing files, missing
 * sections, and malformed headings all degrade to nulls — never a crash.
 */

import fs from 'fs';
import path from 'path';
import { ALL_CONCEPTS } from '../constants/concept-graph';

// ============================================================================
// Types
// ============================================================================

export interface TopicSubsection {
  heading: string;
  content: string;
}

export interface TopicSection {
  heading: string;
  /** Full section body (subsection headings included), trimmed. */
  content: string;
  subsections: TopicSubsection[];
}

export interface TopicTeachingContext {
  topic_id: string;
  /** Topic-level `##` sections (heading matched no concept label). */
  sections: TopicSection[];
  /** `##` sections whose heading matched a concept label in this topic. */
  concept_sections: Record<string, TopicSection>;
  /** Prose of the "Mental Model" subsection, when present. */
  mental_model: string | null;
  /** Prose of the "Study Strategy" subsection, when present. */
  study_strategy: string | null;
}

// ============================================================================
// Parsing (pure)
// ============================================================================

/**
 * Normalize a heading or label for matching: strip emoji/punctuation,
 * lowercase, collapse whitespace.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitByHeading(markdown: string, level: number): Array<{ heading: string; body: string }> {
  const marker = '#'.repeat(level);
  // [ \t] (not \s) — \s would let a bare "##" line swallow the next line
  // as its heading text.
  const rx = new RegExp(`^${marker}[ \\t]+(.*)$`, 'gm');
  const out: Array<{ heading: string; body: string }> = [];
  const matches = [...markdown.matchAll(rx)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const heading = (m[1] ?? '').trim();
    if (!heading) continue; // malformed heading (e.g. bare "##") — skip, never crash
    const start = (m.index ?? 0) + m[0].length;
    // Body runs to the next heading of the SAME OR HIGHER level.
    const rest = markdown.slice(start);
    const nextRx = new RegExp(`^#{1,${level}}[ \\t]`, 'm');
    const next = rest.search(nextRx);
    const body = (next >= 0 ? rest.slice(0, next) : rest).trim();
    out.push({ heading, body });
  }
  return out;
}

/** Subsection prose only — body up to the first nested heading. */
function proseOf(body: string): string {
  const next = body.search(/^#{1,6}[ \t]/m);
  return (next >= 0 ? body.slice(0, next) : body).trim();
}

/**
 * Parse one teaching-tips.md into a TopicTeachingContext. Pure function.
 */
export function parseTeachingTips(topic_id: string, markdown: string): TopicTeachingContext {
  const ctx: TopicTeachingContext = {
    topic_id,
    sections: [],
    concept_sections: {},
    mental_model: null,
    study_strategy: null,
  };
  if (!markdown || typeof markdown !== 'string') return ctx;

  // Concept label lookup for this topic (normalized label → concept_id)
  const labelToConcept = new Map<string, string>();
  for (const c of ALL_CONCEPTS) {
    if (c.topic === topic_id) labelToConcept.set(normalize(c.label), c.id);
  }

  for (const { heading, body } of splitByHeading(markdown, 2)) {
    const subsections: TopicSubsection[] = splitByHeading(body, 3).map(s => ({
      heading: s.heading,
      content: proseOf(s.body),
    }));
    const section: TopicSection = { heading, content: body, subsections };

    const conceptId = labelToConcept.get(normalize(heading));
    if (conceptId) {
      ctx.concept_sections[conceptId] = section;
      continue;
    }
    ctx.sections.push(section);

    // Surface the two composer-facing subsections from topic-level content.
    for (const sub of subsections) {
      const n = normalize(sub.heading);
      if (ctx.mental_model === null && n.includes('mental model') && sub.content) {
        ctx.mental_model = sub.content;
      }
      if (ctx.study_strategy === null && n.includes('study strategy') && sub.content) {
        ctx.study_strategy = sub.content;
      }
    }
  }

  return ctx;
}

// ============================================================================
// Loading (lazy, cached)
// ============================================================================

const DEFAULT_TOPICS_DIR = 'data/courses/gate-em/topics';

function topicsDir(): string {
  return path.resolve(process.cwd(), process.env.VIDHYA_TOPICS_DIR || DEFAULT_TOPICS_DIR);
}

/** `01-linear-algebra` → `linear-algebra`; non-matching names → null. */
export function topicIdFromDirName(dirName: string): string | null {
  const m = /^\d+-(.+)$/.exec(dirName);
  return m ? m[1] : null;
}

let _dirIndex: Map<string, string> | null = null; // topic_id → absolute dir
const _contextCache = new Map<string, TopicTeachingContext | null>();

function dirIndex(): Map<string, string> {
  if (_dirIndex) return _dirIndex;
  const index = new Map<string, string>();
  try {
    const root = topicsDir();
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const topic_id = topicIdFromDirName(entry.name);
      if (topic_id) index.set(topic_id, path.join(root, entry.name));
    }
  } catch {
    // Missing topics dir — empty index; every lookup returns null.
  }
  _dirIndex = index;
  return index;
}

/**
 * Load (and cache) the teaching context for one concept-graph topic id.
 * Returns null when the topic dir or teaching-tips.md is missing or
 * unreadable — callers omit the corresponding cards, never crash.
 */
export function getTopicContext(topic_id: string): TopicTeachingContext | null {
  if (_contextCache.has(topic_id)) return _contextCache.get(topic_id) ?? null;
  let ctx: TopicTeachingContext | null = null;
  try {
    const dir = dirIndex().get(topic_id);
    if (dir) {
      const file = path.join(dir, 'teaching-tips.md');
      if (fs.existsSync(file)) {
        ctx = parseTeachingTips(topic_id, fs.readFileSync(file, 'utf-8'));
      }
    }
  } catch {
    ctx = null;
  }
  _contextCache.set(topic_id, ctx);
  return ctx;
}

export interface ConceptTopicContext {
  topic_id: string;
  /** Concept-level section content when a heading matched this concept's label. */
  concept_section: string | null;
  mental_model: string | null;
  study_strategy: string | null;
}

/**
 * Resolve the teaching context for a concept: its own section when one
 * exists, plus the topic-level mental model / study strategy.
 */
export function getConceptTopicContext(concept_id: string): ConceptTopicContext | null {
  const concept = ALL_CONCEPTS.find(c => c.id === concept_id);
  if (!concept) return null;
  const ctx = getTopicContext(concept.topic);
  if (!ctx) return null;
  return {
    topic_id: ctx.topic_id,
    concept_section: ctx.concept_sections[concept_id]?.content ?? null,
    mental_model: ctx.mental_model,
    study_strategy: ctx.study_strategy,
  };
}

/** Test hook — clears the lazy caches (and re-reads VIDHYA_TOPICS_DIR). */
export function resetTopicContextCache(): void {
  _dirIndex = null;
  _contextCache.clear();
}
