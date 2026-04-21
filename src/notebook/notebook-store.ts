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
  if (params.hint_concept_id && CONCEPT_MAP.get(params.hint_concept_id)) {
    const meta = CONCEPT_MAP.get(params.hint_concept_id);
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

  for (const [concept_id, meta] of Array.from(CONCEPT_MAP.entries())) {
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
      topic: (CONCEPT_MAP.get(bestConcept) as any)?.topic || null,
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
    entry.content.topic = (CONCEPT_MAP.get(params.concept_id) as any)?.topic;
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
          ? (CONCEPT_MAP.get(entry.content.concept_id) as any)?.label || entry.content.concept_id
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
  for (const node of ALL_CONCEPTS) {
    const topic = node.topic || 'other';
    if (!byTopic[topic]) byTopic[topic] = { all: [], covered: [] };
    byTopic[topic].all.push(node.id);
    if (covered.has(node.id)) byTopic[topic].covered.push(node.id);
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
  const gaps = analyzeGaps(notebook);

  // Build a fast lookup: concept_id → entries, sorted chronologically
  const entriesByConcept: Record<string, NotebookEntry[]> = {};
  for (const entry of notebook.entries) {
    const cid = entry.content.concept_id;
    if (!cid) continue;
    if (!entriesByConcept[cid]) entriesByConcept[cid] = [];
    entriesByConcept[cid].push(entry);
  }
  for (const cid of Object.keys(entriesByConcept)) {
    entriesByConcept[cid].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  // Build topic → concepts map from ALL_CONCEPTS, preserving syllabus order
  const topicOrder: string[] = [];
  const conceptsByTopic: Record<string, string[]> = {};
  for (const node of ALL_CONCEPTS) {
    const topic = node.topic || 'other';
    if (!conceptsByTopic[topic]) {
      conceptsByTopic[topic] = [];
      topicOrder.push(topic);
    }
    conceptsByTopic[topic].push(node.id);
  }

  const exportedAt = new Date();
  const exportedAtIso = exportedAt.toISOString();
  const now = exportedAtIso.slice(0, 10);

  const firstEntry = notebook.entries[0];
  const lastEntry = notebook.entries[notebook.entries.length - 1];

  // A short unique export identifier for reference + watermarking.
  // Not a cryptographic signature — just helps identify a particular
  // export if the student prints multiple copies over time.
  const exportId = 'VDH-' + exportedAt.getTime().toString(36).toUpperCase() + '-' +
    Math.random().toString(36).slice(2, 6).toUpperCase();

  const lines: string[] = [];

  // ───────────────────────────────────────────────────────────────────────
  // Watermark banner — visible on every page if printed, always at top
  // ───────────────────────────────────────────────────────────────────────
  lines.push('```');
  lines.push('┌──────────────────────────────────────────────────────────────────┐');
  lines.push('│  PROJECT VIDHYA · SMART NOTEBOOK EXPORT                          │');
  lines.push('│  This document is a LOG OF ATTEMPTED ACTIVITY — not a progress,  │');
  lines.push('│  proficiency, or academic assessment. See disclaimer on page 1.  │');
  lines.push(`│  Export ID: ${exportId.padEnd(54)}│`);
  lines.push('└──────────────────────────────────────────────────────────────────┘');
  lines.push('```');
  lines.push('');

  // ───────────────────────────────────────────────────────────────────────
  // Header
  // ───────────────────────────────────────────────────────────────────────
  lines.push(`# Study Notebook — ${userName || 'Student'}`);
  lines.push('');
  lines.push(`*Exported from Project Vidhya on ${now} (${exportedAtIso})*  `);
  lines.push(`*Export ID: \`${exportId}\`*`);
  lines.push('');
  lines.push(`**Total entries:** ${notebook.entries.length}  `);
  lines.push(`**Syllabus coverage:** ${gaps.overall_coverage_pct}% — ${gaps.total_covered} of ${gaps.total_syllabus_concepts} concepts practiced  `);
  if (firstEntry) lines.push(`**First activity:** ${formatTimestamp(firstEntry.created_at)}  `);
  if (lastEntry) lines.push(`**Latest activity:** ${formatTimestamp(lastEntry.created_at)}`);
  lines.push('');

  // Legend
  lines.push('**Legend:**  🟢 Practiced · ⚪ Not yet practiced · 🟡 Touched once · 🔵 Multiple attempts');
  lines.push('');
  lines.push('---');
  lines.push('');

  // ───────────────────────────────────────────────────────────────────────
  // Disclaimer — friendly but legally clear
  // ───────────────────────────────────────────────────────────────────────
  lines.push('## About this document');
  lines.push('');
  lines.push('> **Please read before sharing or citing this notebook.**');
  lines.push('>');
  lines.push('> This notebook is a **log of your activity in Project Vidhya** — the');
  lines.push('> questions you asked, the problems you attempted, the lessons you');
  lines.push('> opened. It is a **study journal**, not an assessment.');
  lines.push('>');
  lines.push('> **What this notebook IS:**');
  lines.push('> - A timestamped record of what you engaged with, in your own words');
  lines.push('> - A personal study reference, organized against your syllabus');
  lines.push('> - A gap map showing what you have and have not yet touched');
  lines.push('> - Your property — exported from your device, on your request');
  lines.push('>');
  lines.push('> **What this notebook is NOT:**');
  lines.push('> - It is **not a certificate, qualification, transcript, or credential**.');
  lines.push('> - It is **not an indication of mastery, proficiency, or competency**.');
  lines.push('>   Opening a lesson is not the same as learning it. Attempting a problem');
  lines.push('>   is not the same as solving it. Being listed here means you engaged —');
  lines.push('>   not that you excelled.');
  lines.push('> - It is **not an evaluation** issued by any examining authority, board,');
  lines.push('>   coaching institute, or educational institution. Project Vidhya does');
  lines.push('>   not accredit, grade, or certify learning outcomes.');
  lines.push('> - It **cannot be used** as evidence of skill, preparation, or');
  lines.push('>   readiness for any exam, role, or program — nor as a substitute');
  lines.push('>   for any formal qualification, academic record, or examination result.');
  lines.push('>');
  lines.push('> **About the timestamps.** Every entry is timestamped based on your');
  lines.push('> device clock at the moment of the interaction. This document is not');
  lines.push('> cryptographically signed; its authenticity cannot be independently');
  lines.push('> verified after export. Treat it as a good-faith personal log, not as');
  lines.push('> a forensically audited record.');
  lines.push('>');
  lines.push('> **A friendly note.** The progress you are actually making lives inside');
  lines.push('> you, in the problems you can now solve, the intuitions you have built,');
  lines.push('> the patterns you have begun to recognize. This document is just a');
  lines.push('> scaffolding to help you study — your real growth is measured by how');
  lines.push('> confidently you can walk into your exam, not by how many rows are');
  lines.push('> listed below.');
  lines.push('>');
  lines.push('> *Project Vidhya is an open-source learning companion distributed under');
  lines.push('> the MIT License. No warranty, express or implied, is made regarding');
  lines.push('> the accuracy, completeness, or fitness of this document for any');
  lines.push('> particular purpose.*');
  lines.push('');
  lines.push('---');
  lines.push('');

  // ───────────────────────────────────────────────────────────────────────
  // Table of contents
  // ───────────────────────────────────────────────────────────────────────
  lines.push('## Table of contents');
  lines.push('');
  lines.push('1. [About this document](#about-this-document) — what this notebook is and is not');
  lines.push('2. [Coverage summary](#coverage-summary) — at-a-glance topic breakdown');
  lines.push('3. [Full syllabus dump](#full-syllabus-dump) — every concept, practiced or not, with timestamps');
  lines.push('4. [Chronological log](#chronological-log) — every entry, most recent first');
  lines.push('');
  lines.push('---');
  lines.push('');

  // ───────────────────────────────────────────────────────────────────────
  // Coverage summary (at-a-glance)
  // ───────────────────────────────────────────────────────────────────────
  lines.push('## Coverage summary');
  lines.push('');
  lines.push(`You've practiced **${gaps.total_covered}** of **${gaps.total_syllabus_concepts}** concepts in the syllabus (**${gaps.overall_coverage_pct}%**).`);
  lines.push('');
  lines.push('| Topic | Coverage | Practiced | Not yet |');
  lines.push('|-------|:--------:|:---------:|:-------:|');
  for (const topic of gaps.topics) {
    const emoji = topic.coverage_pct >= 80 ? '🟢' : topic.coverage_pct >= 50 ? '🟡' : '🔴';
    const topicLabel = prettyTopic(topic.topic);
    lines.push(`| ${topicLabel} | ${emoji} ${topic.coverage_pct}% | ${topic.covered_concepts} / ${topic.total_concepts} | ${topic.uncovered_concepts.length} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ───────────────────────────────────────────────────────────────────────
  // Full syllabus dump — THE main section
  // Every concept, whether practiced or not, with clear markers + timestamps
  // ───────────────────────────────────────────────────────────────────────
  lines.push('## Full syllabus dump');
  lines.push('');
  lines.push('Every concept in the official syllabus is listed below, organized by topic. Concepts you have practiced show their first/last activity and attempt count. Concepts you have not yet practiced are explicitly marked.');
  lines.push('');

  for (const topic of topicOrder) {
    const concepts = conceptsByTopic[topic];
    const topicLabel = prettyTopic(topic);
    const topicTouched = concepts.filter(c => entriesByConcept[c]?.length).length;
    const topicTotal = concepts.length;
    const topicPct = topicTotal > 0 ? Math.round((topicTouched / topicTotal) * 100) : 0;
    const topicEmoji = topicPct >= 80 ? '🟢' : topicPct >= 50 ? '🟡' : '🔴';

    lines.push(`### ${topicEmoji} ${topicLabel} — ${topicTouched}/${topicTotal} practiced (${topicPct}%)`);
    lines.push('');

    for (const cid of concepts) {
      const meta = CONCEPT_MAP.get(cid) as any;
      const label = meta?.label || cid.replace(/-/g, ' ');
      const entries = entriesByConcept[cid] || [];
      const practiced = entries.length > 0;

      // Status header — crystal clear practiced vs not
      if (!practiced) {
        // Not yet practiced — explicit, unmistakable
        lines.push(`#### ⚪ ${label}`);
        lines.push('');
        lines.push('> **Not yet practiced.** No entries recorded for this concept.');
        lines.push('');
        if (meta?.canonical_definition) {
          lines.push(`*${meta.canonical_definition}*`);
          lines.push('');
        }
      } else {
        // Practiced — show timestamps + activity marker
        const firstAt = entries[0].created_at;
        const lastAt = entries[entries.length - 1].created_at;
        const attempts = entries.filter(e => e.kind === 'problem_attempted').length;
        const correct = entries.filter(e => e.kind === 'problem_attempted' && e.content.correct === true).length;
        const marker = entries.length >= 5 ? '🔵' : entries.length >= 2 ? '🟢' : '🟡';

        lines.push(`#### ${marker} ${label}`);
        lines.push('');

        // Metadata line — the timestamped summary
        const metaParts: string[] = [];
        metaParts.push(`**${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}**`);
        if (attempts > 0) {
          metaParts.push(`${correct}/${attempts} correct`);
        }
        lines.push(metaParts.join(' · '));
        lines.push('');
        lines.push(`- **First practiced:** ${formatTimestamp(firstAt)}`);
        lines.push(`- **Last practiced:** ${formatTimestamp(lastAt)}`);
        if (entries.length >= 2) {
          const spanDays = daysBetween(firstAt, lastAt);
          lines.push(`- **Active span:** ${spanDays} day${spanDays !== 1 ? 's' : ''}`);
        }
        lines.push('');

        // Entry list with per-entry timestamps
        lines.push('**Entries:**');
        lines.push('');
        const show = entries.slice(-20).reverse(); // most recent 20, newest first
        for (const entry of show) {
          const line = `- \`${formatTimestamp(entry.created_at)}\` **[${entry.kind}]** ${entry.title}`;
          lines.push(line);
          if (entry.content.correct !== undefined) {
            lines.push(`  · Result: ${entry.content.correct ? '✓ correct' : '✗ incorrect'}`);
          }
          if (entry.content.difficulty) {
            lines.push(`  · Difficulty: ${entry.content.difficulty}`);
          }
          if (entry.content.text && entry.content.text.length > 0 && entry.content.text.length < 400) {
            const snippet = entry.content.text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
            if (snippet.length > 0 && snippet !== entry.title.replace(/^[^:]+:\s*/, '').trim()) {
              lines.push(`  > ${snippet}${entry.content.text.length > 200 ? '...' : ''}`);
            }
          }
        }
        if (entries.length > 20) {
          lines.push(`- *(${entries.length - 20} earlier entries not shown)*`);
        }
        lines.push('');
      }
    }
  }

  // Uncategorized section — entries that didn't match any concept
  const uncategorized = notebook.entries.filter(e => !e.content.concept_id);
  if (uncategorized.length > 0) {
    lines.push(`### ⚪ Uncategorized — ${uncategorized.length} entries`);
    lines.push('');
    lines.push('*These entries could not be auto-matched to a syllabus concept. You can retag them from the Smart Notebook page.*');
    lines.push('');
    for (const entry of uncategorized.slice(-30).reverse()) {
      lines.push(`- \`${formatTimestamp(entry.created_at)}\` **[${entry.kind}]** ${entry.title}`);
    }
    if (uncategorized.length > 30) {
      lines.push(`- *(${uncategorized.length - 30} earlier uncategorized entries not shown)*`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ───────────────────────────────────────────────────────────────────────
  // Chronological log
  // ───────────────────────────────────────────────────────────────────────
  lines.push('## Chronological log');
  lines.push('');
  lines.push('*Every entry in reverse chronological order, with full timestamps.*');
  lines.push('');
  const reverseChron = [...notebook.entries].reverse();
  let currentDate = '';
  for (const entry of reverseChron.slice(0, 500)) {
    const entryDate = entry.created_at.slice(0, 10);
    if (entryDate !== currentDate) {
      lines.push(`### ${entryDate}`);
      lines.push('');
      currentDate = entryDate;
    }
    const conceptLabel = entry.content.concept_id
      ? (CONCEPT_MAP.get(entry.content.concept_id) as any)?.label || entry.content.concept_id
      : 'uncategorized';
    const verdictMarker = entry.content.correct === true ? ' ✓'
      : entry.content.correct === false ? ' ✗' : '';
    lines.push(`- \`${entry.created_at.slice(11, 19)}\` **[${entry.kind}]**${verdictMarker} ${entry.title} · _${conceptLabel}_`);
  }
  if (reverseChron.length > 500) {
    lines.push('');
    lines.push(`*Log truncated — showing most recent 500 of ${reverseChron.length} entries.*`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ───────────────────────────────────────────────────────────────────────
  // Footer watermark — mirrors the top banner so every printed page and
  // every pasted excerpt carries the same provenance + disclaimer reminder
  // ───────────────────────────────────────────────────────────────────────
  lines.push('```');
  lines.push('┌──────────────────────────────────────────────────────────────────┐');
  lines.push('│  PROJECT VIDHYA · SMART NOTEBOOK EXPORT                          │');
  lines.push('│  LOG OF ATTEMPTED ACTIVITY — not a progress, proficiency, or    │');
  lines.push('│  academic assessment. Not a certificate. Not a credential.       │');
  lines.push('│  Cannot be used as evidence of skill or qualification.           │');
  lines.push(`│  Export ID: ${exportId.padEnd(54)}│`);
  lines.push(`│  Generated: ${exportedAtIso.padEnd(54)}│`);
  lines.push('└──────────────────────────────────────────────────────────────────┘');
  lines.push('```');
  lines.push('');
  lines.push(`*Generated by Project Vidhya Smart Notebook on ${exportedAtIso}.*  `);
  lines.push(`*Syllabus: ${gaps.total_syllabus_concepts} concepts across ${topicOrder.length} topics.*  `);
  lines.push(`*Export ID: \`${exportId}\` — quote this if referencing a specific export.*  `);
  lines.push('*Distributed under the MIT License. No warranty of accuracy or fitness for any particular purpose.*');

  return lines.join('\n');
}

// ============================================================================
// Formatting helpers — for the syllabus-driven export
// ============================================================================

function formatTimestamp(iso: string): string {
  // Human-readable with date + time, preserves ISO precision
  // Example: "2026-04-21 14:22 UTC"
  try {
    const d = new Date(iso);
    const date = d.toISOString().slice(0, 10);
    const time = d.toISOString().slice(11, 16);
    return `${date} ${time} UTC`;
  } catch {
    return iso.slice(0, 16);
  }
}

function daysBetween(fromIso: string, toIso: string): number {
  try {
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    const ms = Math.max(0, to - from);
    return Math.round(ms / (24 * 60 * 60 * 1000));
  } catch {
    return 0;
  }
}

function prettyTopic(topic: string): string {
  // Turn 'linear-algebra' into 'Linear Algebra'
  return topic
    .replace(/-/g, ' ')
    .replace(/\b\w/g, ch => ch.toUpperCase());
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
