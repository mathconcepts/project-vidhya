// @ts-nocheck
/**
 * Smart Notebook — single source of truth for a student's learning history
 *
 * Every interaction the student has with Vidhya — a chat question, a
 * photo snap, a lesson viewed, a problem attempted — is logged as a
 * notebook entry. Entries are auto-clustered by concept using the
 * existing concept graph. The notebook exposes:
 *
 *   - A chronological log
 *   - A concept-clustered view (all entries grouped by topic)
 *   - A gap analysis (which syllabus concepts have no entries)
 *   - An exportable Markdown file (GitHub-flavored, human-readable)
 *
 * The notebook is THE student's record. Everything they've thought
 * about, asked about, or practiced is here. It's designed to be a
 * study reference — not just a log.
 *
 * Architectural choices:
 *   - Flat-file storage (.data/notebooks/{user_id}.json) via shared
 *     createFlatFileStore
 *   - Append-only — entries are never modified after creation
 *   - Concept-tagging is automatic (from context) but user can correct
 *   - Anonymous students get a session-scoped notebook in IndexedDB
 *     (client-side); signed-in students get a server-backed one
 *   - Gap analysis uses the GATE MA syllabus from constants/concept-graph
 *
 * This is a write-heavy endpoint — called on every user input across
 * /chat, /snap, /lesson, /smart-practice. Kept lean to minimize
 * overhead.
 */

import path from 'path';
import fs from 'fs';
import { createFlatFileStore } from '../lib/flat-file-store';
import { CONCEPT_MAP, ALL_CONCEPTS } from '../constants/concept-graph';

// ============================================================================
// Entry types
// ============================================================================

export type NotebookEntryKind =
  | 'chat_question'       // student typed a question in /chat
  | 'snap'                // student took a photo in /snap
  | 'lesson_viewed'       // student opened a lesson
  | 'problem_attempted'   // student attempted a problem (correct or not)
  | 'material_uploaded'   // student uploaded class notes
  | 'diagnostic_taken'    // student uploaded a mock test for diagnostic
  | 'note';               // student-authored note

export interface NotebookEntry {
  id: string;              // nb_<random>
  user_id: string;
  kind: NotebookEntryKind;
  /** The content — varies by kind */
  content: {
    text?: string;         // user's question, transcribed problem, etc.
    concept_id?: string;   // primary concept tag (auto or manual)
    topic?: string;        // coarser topic (linear-algebra, calculus, ...)
    correct?: boolean;     // for problem_attempted
    difficulty?: string;
    source_url?: string;   // link back to the original interaction
  };
  created_at: string;
  /** Short auto-generated title for the UI */
  title: string;
}

export interface Notebook {
  version: 1;
  user_id: string;
  created_at: string;
  entries: NotebookEntry[];
  /** Student-authored overrides for concept tags */
  manual_tags: Record<string, string>; // entry_id → concept_id
}

// ============================================================================
// Storage
// ============================================================================

function notebookPathFor(user_id: string): string {
  // Sanitize — user_id is already validated upstream but be defensive
  const safe = user_id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join('.data', 'notebooks', `${safe}.json`);
}

function createStoreFor(user_id: string) {
  return createFlatFileStore<Notebook>({
    path: notebookPathFor(user_id),
    defaultShape: () => ({
      version: 1,
      user_id,
      created_at: new Date().toISOString(),
      entries: [],
      manual_tags: {},
    }),
  });
}

// ============================================================================
// Concept tagger — automatic clustering
// ============================================================================

/**
 * Tag a piece of text with a concept_id using a lightweight keyword match.
 * No LLM, no embedding call — fast enough for every user input.
 *
 * Strategy:
 *   1. If an explicit concept_id is passed in, use it
 *   2. Otherwise, search the text for concept labels and aliases
 *   3. Fallback: return null (untagged — falls into 'uncategorized' cluster)
 */
export function autoTagConcept(params: {
  text: string;
  hint_concept_id?: string | null;
}): { concept_id: string | null; topic: string | null; confidence: number } {
  if (params.hint_concept_id && CONCEPT_MAP[params.hint_concept_id]) {
    const meta = CONCEPT_MAP[params.hint_concept_id];
    return {
      concept_id: params.hint_concept_id,
      topic: meta?.topic || null,
      confidence: 1.0,
    };
  }

  const text = (params.text || '').toLowerCase();
  if (!text) return { concept_id: null, topic: null, confidence: 0 };

  // Score each concept by label-match + keyword overlap
  let bestConcept: string | null = null;
  let bestScore = 0;

  for (const [concept_id, meta] of Object.entries(CONCEPT_MAP)) {
    let score = 0;
    const label = (meta as any).label?.toLowerCase();
    const aliases = ((meta as any).aliases || []).map((a: string) => a.toLowerCase());
    const keywords = ((meta as any).keywords || []).map((k: string) => k.toLowerCase());

    // Direct label match
    if (label && text.includes(label)) score += 2;

    // Alias matches
    for (const alias of aliases) {
      if (alias.length > 3 && text.includes(alias)) score += 1.5;
    }

    // Keyword matches
    for (const kw of keywords) {
      if (kw.length > 3 && text.includes(kw)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestConcept = concept_id;
    }
  }

  if (bestConcept && bestScore >= 1.5) {
    return {
      concept_id: bestConcept,
      topic: (CONCEPT_MAP[bestConcept] as any)?.topic || null,
      confidence: Math.min(1, bestScore / 4),
    };
  }

  return { concept_id: null, topic: null, confidence: 0 };
}

// ============================================================================
// Public API: add, read, cluster, gap-analyze, export
// ============================================================================

export function addEntry(params: {
  user_id: string;
  kind: NotebookEntryKind;
  text?: string;
  concept_id?: string | null;
  title?: string;
  correct?: boolean;
  difficulty?: string;
  source_url?: string;
}): NotebookEntry {
  const store = createStoreFor(params.user_id);

  const tagged = autoTagConcept({
    text: params.text || '',
    hint_concept_id: params.concept_id,
  });

  const id = 'nb_' + Math.random().toString(36).slice(2, 11);
  const entry: NotebookEntry = {
    id,
    user_id: params.user_id,
    kind: params.kind,
    content: {
      text: params.text,
      concept_id: tagged.concept_id || undefined,
      topic: tagged.topic || undefined,
      correct: params.correct,
      difficulty: params.difficulty,
      source_url: params.source_url,
    },
    created_at: new Date().toISOString(),
    title: params.title || autoTitle(params.kind, params.text || ''),
  };

  store.update(state => {
    state.entries.push(entry);
    // Keep bounded — at 2000+ entries a student should be exporting anyway
    if (state.entries.length > 5000) {
      state.entries = state.entries.slice(-5000);
    }
  });

  return entry;
}

export function getNotebook(user_id: string): Notebook {
  return createStoreFor(user_id).read();
}

export function overrideConceptTag(params: {
  user_id: string;
  entry_id: string;
  concept_id: string;
}): { ok: boolean } {
  const store = createStoreFor(params.user_id);
  store.update(state => {
    const entry = state.entries.find(e => e.id === params.entry_id);
    if (!entry) return;
    entry.content.concept_id = params.concept_id;
    entry.content.topic = (CONCEPT_MAP[params.concept_id] as any)?.topic;
    state.manual_tags[params.entry_id] = params.concept_id;
  });
  return { ok: true };
}

export function deleteEntry(user_id: string, entry_id: string): { ok: boolean } {
  createStoreFor(user_id).update(state => {
    state.entries = state.entries.filter(e => e.id !== entry_id);
    delete state.manual_tags[entry_id];
  });
  return { ok: true };
}

// ============================================================================
// Cluster by concept
// ============================================================================

export interface ConceptCluster {
  concept_id: string | null; // null for uncategorized
  concept_label: string;
  topic: string | null;
  entry_count: number;
  entries: NotebookEntry[];
  last_touched: string | null;
}

export function clusterByConcept(notebook: Notebook): {
  clusters: ConceptCluster[];
  total_entries: number;
} {
  const byKey: Record<string, ConceptCluster> = {};

  for (const entry of notebook.entries) {
    const key = entry.content.concept_id || '__uncategorized__';
    if (!byKey[key]) {
      byKey[key] = {
        concept_id: entry.content.concept_id || null,
        concept_label: entry.content.concept_id
          ? (CONCEPT_MAP[entry.content.concept_id] as any)?.label || entry.content.concept_id
          : 'Uncategorized',
        topic: entry.content.topic || null,
        entry_count: 0,
        entries: [],
        last_touched: null,
      };
    }
    byKey[key].entries.push(entry);
    byKey[key].entry_count++;
    if (!byKey[key].last_touched || entry.created_at > (byKey[key].last_touched as string)) {
      byKey[key].last_touched = entry.created_at;
    }
  }

  const clusters = Object.values(byKey).sort((a, b) => {
    // Uncategorized last
    if (a.concept_id === null) return 1;
    if (b.concept_id === null) return -1;
    return b.entry_count - a.entry_count;
  });

  return { clusters, total_entries: notebook.entries.length };
}

// ============================================================================
// Gap analysis — which concepts have no notebook entries yet
// ============================================================================

export interface SyllabusGap {
  topic: string;
  total_concepts: number;
  covered_concepts: number;
  uncovered_concepts: string[]; // concept_ids
  coverage_pct: number;
}

export function analyzeGaps(notebook: Notebook): {
  topics: SyllabusGap[];
  overall_coverage_pct: number;
  total_syllabus_concepts: number;
  total_covered: number;
} {
  const covered = new Set<string>();
  for (const entry of notebook.entries) {
    if (entry.content.concept_id) covered.add(entry.content.concept_id);
  }

  const byTopic: Record<string, { all: string[]; covered: string[] }> = {};
  for (const concept_id of ALL_CONCEPTS) {
    const topic = (CONCEPT_MAP[concept_id] as any)?.topic || 'other';
    if (!byTopic[topic]) byTopic[topic] = { all: [], covered: [] };
    byTopic[topic].all.push(concept_id);
    if (covered.has(concept_id)) byTopic[topic].covered.push(concept_id);
  }

  const topics: SyllabusGap[] = Object.entries(byTopic).map(([topic, data]) => ({
    topic,
    total_concepts: data.all.length,
    covered_concepts: data.covered.length,
    uncovered_concepts: data.all.filter(c => !data.covered.includes(c)),
    coverage_pct: data.all.length > 0
      ? Math.round((data.covered.length / data.all.length) * 100)
      : 0,
  }));

  topics.sort((a, b) => a.coverage_pct - b.coverage_pct); // worst-covered first

  return {
    topics,
    overall_coverage_pct: ALL_CONCEPTS.length > 0
      ? Math.round((covered.size / ALL_CONCEPTS.length) * 100)
      : 0,
    total_syllabus_concepts: ALL_CONCEPTS.length,
    total_covered: covered.size,
  };
}

// ============================================================================
// Markdown export — the "downloadable single source of truth"
// ============================================================================

export function exportAsMarkdown(user_id: string, userName?: string): string {
  const notebook = getNotebook(user_id);
  const { clusters, total_entries } = clusterByConcept(notebook);
  const gaps = analyzeGaps(notebook);

  const now = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];

  // Header
  lines.push(`# Study Notebook — ${userName || 'Student'}`);
  lines.push('');
  lines.push(`*Exported from Project Vidhya on ${now}*`);
  lines.push('');
  lines.push(`**Total entries:** ${total_entries}  `);
  lines.push(`**Syllabus coverage:** ${gaps.overall_coverage_pct}% (${gaps.total_covered} of ${gaps.total_syllabus_concepts} concepts touched)  `);
  lines.push(`**First entry:** ${notebook.entries[0]?.created_at.slice(0, 10) || 'none'}  `);
  lines.push(`**Latest entry:** ${notebook.entries[notebook.entries.length - 1]?.created_at.slice(0, 10) || 'none'}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of contents
  lines.push('## Table of contents');
  lines.push('');
  lines.push('1. [Syllabus coverage](#syllabus-coverage) — what\'s covered and what\'s not yet');
  lines.push('2. [Concepts by topic](#concepts-by-topic) — clustered view of what you\'ve studied');
  lines.push('3. [Chronological log](#chronological-log) — every entry, most recent first');
  lines.push('');

  // Syllabus gaps — MOST VALUABLE section, put first
  lines.push('## Syllabus coverage');
  lines.push('');
  lines.push(`You've touched **${gaps.total_covered}** of **${gaps.total_syllabus_concepts}** concepts in the syllabus (**${gaps.overall_coverage_pct}%**).`);
  lines.push('');
  lines.push('| Topic | Coverage | Concepts touched | Gaps |');
  lines.push('|-------|:--------:|:----------------:|------|');
  for (const topic of gaps.topics) {
    const emoji = topic.coverage_pct >= 80 ? '🟢' : topic.coverage_pct >= 50 ? '🟡' : '🔴';
    const gapsShort = topic.uncovered_concepts.slice(0, 3).map(c => (CONCEPT_MAP[c] as any)?.label || c).join(', ');
    const moreGaps = topic.uncovered_concepts.length > 3 ? ` *(+${topic.uncovered_concepts.length - 3} more)*` : '';
    lines.push(`| ${topic.topic} | ${emoji} ${topic.coverage_pct}% | ${topic.covered_concepts}/${topic.total_concepts} | ${gapsShort || '_none_'}${moreGaps} |`);
  }
  lines.push('');

  // Detailed gaps (top 3 uncovered topics)
  const worstTopics = gaps.topics.filter(t => t.coverage_pct < 100).slice(0, 5);
  if (worstTopics.length > 0) {
    lines.push('### Concepts to study next');
    lines.push('');
    for (const t of worstTopics) {
      lines.push(`**${t.topic}** — ${t.uncovered_concepts.length} uncovered:`);
      for (const c of t.uncovered_concepts.slice(0, 8)) {
        const label = (CONCEPT_MAP[c] as any)?.label || c;
        lines.push(`- ${label}`);
      }
      if (t.uncovered_concepts.length > 8) {
        lines.push(`- *(${t.uncovered_concepts.length - 8} more...)*`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');

  // Concepts by topic — clustered view
  lines.push('## Concepts by topic');
  lines.push('');
  for (const cluster of clusters) {
    if (cluster.entry_count === 0) continue;
    lines.push(`### ${cluster.concept_label}${cluster.topic ? ` *(${cluster.topic})*` : ''}`);
    lines.push('');
    lines.push(`*${cluster.entry_count} entries · last touched ${cluster.last_touched?.slice(0, 10)}*`);
    lines.push('');
    for (const entry of cluster.entries.slice(0, 20)) {
      lines.push(`- **[${entry.kind}]** ${entry.title}`);
      if (entry.content.text && entry.content.text.length < 500) {
        const snippet = entry.content.text.replace(/\n/g, ' ').slice(0, 300);
        lines.push(`  > ${snippet}${entry.content.text.length > 300 ? '...' : ''}`);
      }
      lines.push(`  *${entry.created_at.slice(0, 10)}*`);
    }
    if (cluster.entries.length > 20) {
      lines.push(`- *(${cluster.entries.length - 20} more entries in this concept)*`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Chronological log
  lines.push('## Chronological log');
  lines.push('');
  const reverseChron = [...notebook.entries].reverse();
  let currentDate = '';
  for (const entry of reverseChron.slice(0, 200)) {
    const entryDate = entry.created_at.slice(0, 10);
    if (entryDate !== currentDate) {
      lines.push(`### ${entryDate}`);
      lines.push('');
      currentDate = entryDate;
    }
    const conceptLabel = entry.content.concept_id
      ? (CONCEPT_MAP[entry.content.concept_id] as any)?.label || entry.content.concept_id
      : 'uncategorized';
    lines.push(`- **${entry.created_at.slice(11, 16)}** [${entry.kind}] ${entry.title} · _${conceptLabel}_`);
  }
  if (reverseChron.length > 200) {
    lines.push('');
    lines.push(`*Log truncated — showing most recent 200 of ${reverseChron.length} entries.*`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Project Vidhya Smart Notebook.*');

  return lines.join('\n');
}

// ============================================================================
// Helpers
// ============================================================================

function autoTitle(kind: NotebookEntryKind, text: string): string {
  const prefix = {
    chat_question: 'Asked: ',
    snap: 'Snapped: ',
    lesson_viewed: 'Studied: ',
    problem_attempted: 'Problem: ',
    material_uploaded: 'Uploaded: ',
    diagnostic_taken: 'Diagnostic: ',
    note: 'Note: ',
  }[kind] || '';

  const cleaned = text.replace(/\s+/g, ' ').trim();
  const snippet = cleaned.length > 60 ? cleaned.slice(0, 60) + '...' : cleaned;
  return prefix + (snippet || 'untitled');
}
