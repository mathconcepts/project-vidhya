/**
 * Exam Types — dynamic exam registry
 *
 * Unlike the static src/syllabus/exam-catalog.ts (which holds the built-in
 * exams shipped with Vidhya), this registry allows admins to define new
 * exams at runtime with progressive enrichment.
 *
 * Every field is OPTIONAL except the unique identifier and the minimal
 * seed (name, code, country, level). Partial data is the expected state.
 * Fields get filled incrementally from:
 *   1. Admin manual entry (highest trust)
 *   2. User-uploaded local data (high trust)
 *   3. LLM-backed web research (medium trust)
 *   4. Defaults / inference (lowest trust)
 *
 * Every enriched field carries its `source` so admins can verify and
 * override. The same exam can be reused across many students via its
 * unique `id`.
 */

/** Trust level for a single field's value */
export type ExamFieldSource =
  | 'admin_manual'     // admin typed it directly
  | 'user_upload'      // extracted from a document/file admin uploaded
  | 'web_research'     // filled by the LLM-backed web enrichment
  | 'default'          // inferred/placeholder
  | 'none';            // not yet filled

/** Metadata attached to any field value */
export interface FieldProvenance {
  source: ExamFieldSource;
  filled_at?: string;          // ISO timestamp
  confidence?: number;         // 0..1 for web_research fields
  notes?: string;              // free-text context (e.g. "from admin's uploaded PDF")
}

/** Map of field paths to their provenance */
export type ProvenanceMap = Record<string, FieldProvenance>;

// ============================================================================
// Core Exam shape — every field except `id` + `code` + `name` is optional
// ============================================================================

export interface ExamSection {
  name: string;                // e.g. "Section A: General Aptitude"
  marks?: number;
  duration_minutes?: number;
  question_count?: number;
  topics?: string[];           // topic_ids if they map to our concept graph
  weight?: number;             // 0..1 fraction of total marks
  notes?: string;
}

export interface MarkingScheme {
  marks_per_correct?: number;
  negative_marks_per_wrong?: number;  // e.g. -0.33 for 1-mark MCQs in GATE
  partial_credit?: boolean;
  special_rules?: string;              // free text for edge cases
}

export interface QuestionTypeMix {
  mcq?: number;                        // fraction 0..1
  msq?: number;                        // multi-select
  numerical?: number;
  descriptive?: number;
  other?: number;
  notes?: string;
}

export interface SyllabusTopic {
  topic_id: string;                    // maps to concept-graph topic where possible
  name: string;
  subtopics?: string[];                // free-text or concept_ids
  weight?: number;                     // 0..1 within the syllabus
  notes?: string;
}

/** Extra free-form knowledge an admin uploaded */
export interface LocalDataEntry {
  id: string;
  kind: 'text' | 'url' | 'file_extract';
  title: string;
  content: string;                     // the actual text (for files, the extracted text)
  uploaded_at: string;
  uploaded_by: string;                 // admin user_id
}

export interface Exam {
  /** Unique identifier: EXM-<code-safe>-<base36-timestamp>, stable across re-enrichment */
  id: string;

  /** MINIMAL SEED — the three things an admin must provide on creation */
  code: string;                        // e.g. "GATE-CS-2027" (short, URL-safe)
  name: string;                        // e.g. "GATE Computer Science 2027"
  level: 'undergraduate' | 'postgraduate' | 'professional' | 'competitive' | 'entrance' | 'certification' | 'other';

  /** OPTIONAL — fill progressively */
  country?: string;
  issuing_body?: string;               // e.g. "IIT Madras"
  official_url?: string;
  description?: string;

  /** Structural */
  duration_minutes?: number;
  total_marks?: number;
  sections?: ExamSection[];
  marking_scheme?: MarkingScheme;
  question_types?: QuestionTypeMix;

  /** Content */
  syllabus?: SyllabusTopic[];
  topic_weights?: Record<string, number>;  // derived from syllabus

  /** Scheduling */
  next_attempt_date?: string;           // ISO date
  registration_deadline?: string;
  frequency?: 'annual' | 'biannual' | 'quarterly' | 'monthly' | 'rolling' | 'one-off';
  typical_prep_weeks?: number;

  /** Eligibility */
  eligibility?: string;                 // free text
  age_limit?: string;
  attempts_allowed?: number;

  /** Admin-facing metadata */
  admin_notes?: string;
  local_data: LocalDataEntry[];         // anything admin has uploaded
  provenance: ProvenanceMap;            // source of every filled field
  completeness: number;                 // 0..1, auto-computed

  /** Lifecycle */
  created_by: string;                   // admin user_id
  created_at: string;
  updated_at: string;
  last_enriched_at?: string;

  /** Status flags */
  is_draft: boolean;                    // true until admin marks it "ready"
  is_archived: boolean;
}

// ============================================================================
// Fields used by completeness scoring — grouped by category for readable UI
// ============================================================================

export const COMPLETENESS_FIELDS: Array<{
  category: string;
  fields: Array<{
    path: keyof Exam | `sections[${number}]`;
    label: string;
    weight: number;
  }>;
}> = [
  {
    category: 'Basics',
    fields: [
      { path: 'issuing_body', label: 'Issuing body', weight: 2 },
      { path: 'country', label: 'Country', weight: 1 },
      { path: 'official_url', label: 'Official URL', weight: 1 },
      { path: 'description', label: 'Description', weight: 1 },
    ],
  },
  {
    category: 'Structure',
    fields: [
      { path: 'duration_minutes', label: 'Duration', weight: 2 },
      { path: 'total_marks', label: 'Total marks', weight: 2 },
      { path: 'sections', label: 'Sections', weight: 2 },
      { path: 'marking_scheme', label: 'Marking scheme', weight: 2 },
      { path: 'question_types', label: 'Question types', weight: 1 },
    ],
  },
  {
    category: 'Content',
    fields: [
      { path: 'syllabus', label: 'Syllabus', weight: 3 },
      { path: 'topic_weights', label: 'Topic weights', weight: 2 },
    ],
  },
  {
    category: 'Schedule',
    fields: [
      { path: 'next_attempt_date', label: 'Next exam date', weight: 2 },
      { path: 'frequency', label: 'Frequency', weight: 1 },
      { path: 'typical_prep_weeks', label: 'Typical prep duration', weight: 1 },
    ],
  },
  {
    category: 'Eligibility',
    fields: [
      { path: 'eligibility', label: 'Eligibility', weight: 1 },
    ],
  },
];

/** Total max weight — used to normalize completeness to 0..1 */
export const TOTAL_COMPLETENESS_WEIGHT = COMPLETENESS_FIELDS.reduce(
  (sum, cat) => sum + cat.fields.reduce((s, f) => s + f.weight, 0),
  0,
); // = 24 with current field set

// ============================================================================
// Enrichment request/response shapes
// ============================================================================

/** What the admin provides when creating a new exam */
export interface ExamCreateSeed {
  code: string;
  name: string;
  level: Exam['level'];
  // Optional hints that help enrichment:
  country?: string;
  issuing_body?: string;
  description?: string;
  official_url?: string;
  // Optional — any text the admin already has about the exam
  seed_text?: string;
}

/** LLM-backed enrichment response */
export interface EnrichmentProposal {
  field_proposals: Partial<Exam>;
  provenance: ProvenanceMap;
  sources_consulted: string[];
  notes: string;                       // LLM's summary of what it found/couldn't find
  confidence_overall: number;          // 0..1
}

/** Assistant conversation turn */
export interface ExamAssistantTurn {
  role: 'admin' | 'assistant';
  content: string;
  suggestions?: string[];              // tappable quick-replies
  field_updates?: Partial<Exam>;       // changes the assistant proposes
  timestamp: string;
}
