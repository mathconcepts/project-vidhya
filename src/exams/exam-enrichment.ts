// @ts-nocheck
/**
 * Exam Enrichment — progressive filling of exam details
 *
 * Given a minimal exam seed (name + level + optional hints), this module
 * tries to fill in the rest by consulting:
 *   1. The exam's own local_data (admin-uploaded text/URLs/file extracts)
 *   2. An LLM (Gemini Flash by default) grounded in any local_data
 *      and instructed to produce structured JSON
 *
 * Design choices:
 *   - LLM-optional: if no GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY
 *     is set, enrichment returns a clear "manual-only" response. The UI
 *     still works — the admin just fills fields themselves.
 *   - Local-data-first: if the admin has uploaded the official syllabus PDF
 *     or a prep guide, that text is included in the LLM prompt as
 *     authoritative context. LLM is explicitly told to prefer it over
 *     general knowledge.
 *   - Conservative merging: the admin's manually-entered fields are NEVER
 *     overwritten. Enrichment only fills fields whose current provenance
 *     is 'none' or 'web_research'.
 *   - Every field gets a confidence score so the UI can indicate
 *     "auto-filled, please verify."
 */

import type {
  Exam,
  EnrichmentProposal,
  LocalDataEntry,
  ProvenanceMap,
} from './types';

// ============================================================================
// Low-level LLM call — direct fetch, no dependency on the existing router
// ============================================================================

/**
 * Detect which LLM provider has an API key set in the environment.
 * Returns null if none is configured.
 */
function detectAvailableProvider(): 'gemini' | 'anthropic' | 'openai' | null {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2500,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey as string,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
  const j = await res.json();
  return j?.content?.[0]?.text || '';
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2500,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const j = await res.json();
  return j?.choices?.[0]?.message?.content || '';
}

async function callLLM(prompt: string): Promise<string> {
  const provider = detectAvailableProvider();
  if (provider === 'gemini') return callGemini(prompt);
  if (provider === 'anthropic') return callAnthropic(prompt);
  if (provider === 'openai') return callOpenAI(prompt);
  throw new Error('no LLM provider configured (set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY)');
}

// ============================================================================
// Prompt builder — structured JSON extraction
// ============================================================================

const ENRICHMENT_SYSTEM_PROMPT = `You are an exam-catalog research assistant for Project Vidhya, an educational platform.

An admin is setting up a new exam in the system. They have given you the exam's basic identity. Your job is to produce a structured JSON document describing the exam's details: duration, marking scheme, syllabus, question types, schedule, eligibility, and so on.

Rules:
1. Return ONLY a valid JSON object. No prose, no markdown fences, no commentary.
2. Every field you fill in must be either DIRECTLY SUPPORTED by the local_data the admin provided, OR based on your own general knowledge of well-known public exams.
3. If a field is uncertain, OMIT it rather than guess. Missing is better than wrong.
4. For each filled field, assign a confidence from 0.0 to 1.0. Use 0.9+ only when local_data explicitly states it, 0.6-0.8 for well-known facts, 0.3-0.5 for educated guesses.
5. The admin will review and edit. Your job is to give them the best starting point, not a final answer.

Return schema:
{
  "field_proposals": {
    "issuing_body": "string | null",
    "country": "string | null",
    "official_url": "string | null",
    "description": "string | null",
    "duration_minutes": "number | null",
    "total_marks": "number | null",
    "sections": [ { "name": "string", "marks": number, "question_count": number, "notes": "string" } ] | null,
    "marking_scheme": { "marks_per_correct": number, "negative_marks_per_wrong": number, "partial_credit": boolean } | null,
    "question_types": { "mcq": 0.6, "numerical": 0.3, "descriptive": 0.1 } | null,
    "syllabus": [ { "topic_id": "string", "name": "string", "subtopics": ["..."], "weight": 0.15 } ] | null,
    "frequency": "annual | biannual | quarterly | monthly | rolling | one-off | null",
    "typical_prep_weeks": "number | null",
    "eligibility": "string | null",
    "next_attempt_date": "YYYY-MM-DD | null"
  },
  "confidence_per_field": {
    "issuing_body": 0.95,
    "syllabus": 0.7,
    "...": "..."
  },
  "confidence_overall": 0.75,
  "notes": "Short summary of what you found vs what you couldn't determine. Mention specifically what the admin should verify."
}

If you truly know nothing about this exam and the admin provided no local_data, return empty field_proposals and overall confidence 0.0.`;

function buildEnrichmentPrompt(exam: Exam): string {
  const localDataSection = exam.local_data.length > 0
    ? `The admin has uploaded the following context. Treat this as authoritative:\n\n${exam.local_data
        .map(d => `--- ${d.title} (${d.kind}) ---\n${d.content.slice(0, 4000)}`)
        .join('\n\n')}\n\n`
    : 'No local_data uploaded. Rely on your general knowledge.\n\n';

  const existing = {
    code: exam.code,
    name: exam.name,
    level: exam.level,
    country: exam.country,
    issuing_body: exam.issuing_body,
    description: exam.description,
    official_url: exam.official_url,
  };

  return `${ENRICHMENT_SYSTEM_PROMPT}

---

Exam to research:
${JSON.stringify(existing, null, 2)}

${localDataSection}Produce the JSON now. Remember: OMIT uncertain fields rather than guess.`;
}

// ============================================================================
// Response parser — lenient, handles common LLM JSON quirks
// ============================================================================

function parseLLMResponse(text: string): any {
  let cleaned = text.trim();
  // Strip markdown fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // Find first { and last }
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error('LLM returned invalid JSON: ' + (err as Error).message);
  }
}

// ============================================================================
// Public enrichment API
// ============================================================================

/**
 * Enrich an exam's details. Returns a proposal of fields to fill — the
 * caller decides whether to accept. Field provenance is tracked per-field
 * so the admin can override anything.
 *
 * Graceful degradation:
 *   - If no LLM configured → returns empty proposal with a clear note
 *   - If LLM call fails → returns proposal with error note, no fields
 *   - If LLM returns garbage JSON → returns proposal with parse error note
 *
 * The caller should check `confidence_overall` and `notes` before
 * applying the proposal.
 */
export async function enrichExam(exam: Exam): Promise<EnrichmentProposal> {
  const provider = detectAvailableProvider();

  if (!provider) {
    return {
      field_proposals: {},
      provenance: {},
      sources_consulted: [],
      notes: 'No LLM provider is configured on this Vidhya instance. Enrichment is disabled — you can still add exam details manually. To enable automatic enrichment, set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in the server environment.',
      confidence_overall: 0,
    };
  }

  const prompt = buildEnrichmentPrompt(exam);
  let rawResponse: string;

  try {
    rawResponse = await callLLM(prompt);
  } catch (err) {
    return {
      field_proposals: {},
      provenance: {},
      sources_consulted: [provider],
      notes: `Enrichment failed: ${(err as Error).message}. You can still add details manually.`,
      confidence_overall: 0,
    };
  }

  let parsed: any;
  try {
    parsed = parseLLMResponse(rawResponse);
  } catch (err) {
    return {
      field_proposals: {},
      provenance: {},
      sources_consulted: [provider],
      notes: `Enrichment ran but returned invalid JSON. Try again or add details manually. Error: ${(err as Error).message}`,
      confidence_overall: 0,
    };
  }

  // Build provenance map from per-field confidence
  const nowIso = new Date().toISOString();
  const proposals = parsed.field_proposals || {};
  const confPerField = parsed.confidence_per_field || {};
  const provenance: ProvenanceMap = {};

  for (const key of Object.keys(proposals)) {
    if (proposals[key] === null || proposals[key] === undefined) continue;
    provenance[key] = {
      source: 'web_research',
      filled_at: nowIso,
      confidence: typeof confPerField[key] === 'number' ? confPerField[key] : parsed.confidence_overall || 0.5,
      notes: exam.local_data.length > 0
        ? `Filled from LLM research; grounded in ${exam.local_data.length} uploaded local document(s)`
        : 'Filled from LLM general-knowledge research',
    };
  }

  // Derive topic_weights from syllabus if syllabus was filled
  if (proposals.syllabus && Array.isArray(proposals.syllabus)) {
    const weights: Record<string, number> = {};
    for (const topic of proposals.syllabus) {
      if (topic.topic_id && typeof topic.weight === 'number') {
        weights[topic.topic_id] = topic.weight;
      }
    }
    if (Object.keys(weights).length > 0) {
      proposals.topic_weights = weights;
      provenance.topic_weights = {
        source: 'web_research',
        filled_at: nowIso,
        confidence: parsed.confidence_overall || 0.5,
        notes: 'Derived from syllabus topic weights',
      };
    }
  }

  return {
    field_proposals: proposals,
    provenance,
    sources_consulted: [provider, ...(exam.local_data.map(d => `local:${d.title}`))],
    notes: parsed.notes || 'Enrichment completed. Please review each field before marking the exam ready.',
    confidence_overall: typeof parsed.confidence_overall === 'number' ? parsed.confidence_overall : 0.5,
  };
}

// ============================================================================
// Conservative merger — never overwrites admin manual entries
// ============================================================================

/**
 * Apply an enrichment proposal to an exam, respecting existing provenance.
 * Fields whose current source is 'admin_manual' or 'user_upload' are NEVER
 * overwritten.
 */
export function mergeProposal(
  currentExam: Exam,
  proposal: EnrichmentProposal,
): { updates: Partial<Exam>; new_provenance: ProvenanceMap; skipped_fields: string[] } {
  const updates: Partial<Exam> = {};
  const newProvenance: ProvenanceMap = {};
  const skipped: string[] = [];

  for (const key of Object.keys(proposal.field_proposals)) {
    const existingSource = currentExam.provenance[key]?.source;
    if (existingSource === 'admin_manual' || existingSource === 'user_upload') {
      skipped.push(key);
      continue;
    }
    (updates as any)[key] = (proposal.field_proposals as any)[key];
    if (proposal.provenance[key]) {
      newProvenance[key] = proposal.provenance[key];
    }
  }

  return { updates, new_provenance: newProvenance, skipped_fields: skipped };
}

// ============================================================================
// Simple suggestion helper — what should the admin fill next?
// ============================================================================

/**
 * Given an exam, returns the top 3 fields that would most increase its
 * usefulness if filled. Used by the UI to show "to do next" prompts.
 */
export function suggestNextFields(exam: Exam): Array<{ field: string; label: string; reason: string }> {
  const suggestions: Array<{ field: string; label: string; reason: string; priority: number }> = [];

  if (!exam.syllabus || exam.syllabus.length === 0) {
    suggestions.push({
      field: 'syllabus',
      label: 'Add syllabus',
      reason: "Syllabus is the backbone — it tells the system which concepts to prepare students on.",
      priority: 10,
    });
  }
  if (!exam.duration_minutes) {
    suggestions.push({
      field: 'duration_minutes',
      label: 'Set exam duration',
      reason: 'Duration drives the mock-exam pacing and per-question time budget.',
      priority: 7,
    });
  }
  if (!exam.marking_scheme) {
    suggestions.push({
      field: 'marking_scheme',
      label: 'Define marking scheme',
      reason: 'Needed to calibrate practice-problem feedback (especially negative marking).',
      priority: 8,
    });
  }
  if (!exam.next_attempt_date) {
    suggestions.push({
      field: 'next_attempt_date',
      label: 'Set next exam date',
      reason: 'Enables countdown-to-exam prompts and readiness pacing.',
      priority: 5,
    });
  }
  if (!exam.question_types) {
    suggestions.push({
      field: 'question_types',
      label: 'Specify question types',
      reason: 'Tells the problem generator which question shapes to produce.',
      priority: 6,
    });
  }
  if (!exam.issuing_body) {
    suggestions.push({
      field: 'issuing_body',
      label: 'Add issuing body',
      reason: 'Useful for students who want to verify official info.',
      priority: 3,
    });
  }

  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(({ field, label, reason }) => ({ field, label, reason }));
}

/**
 * Returns true if this Vidhya instance has any LLM configured
 * (drives UI affordances — show/hide the "auto-enrich" button).
 */
export function isEnrichmentAvailable(): boolean {
  return detectAvailableProvider() !== null;
}
