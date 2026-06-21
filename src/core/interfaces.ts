/**
 * src/core/interfaces.ts — The 100x Blueprint seams.
 *
 * Single barrel of stable TypeScript interfaces for every architectural
 * layer named in the blueprint (§5). Every caller in the codebase that
 * needs to reach for a "Student Model" or a "Scorer" or a "Teaching
 * Policy" depends on these interfaces, never on a concrete class. That's
 * what makes "add / modify / delete any capability" structural rather
 * than convention.
 *
 * Conventions:
 *   - [seam]   marker in the blueprint: one implementation today, cheap
 *              insurance for a known-future swap. We still ship the
 *              interface so the swap is a swap, not a rewrite.
 *   - [plugin] marker: genuinely multi-implementation from day 1
 *              (e.g. multiple `Scorer`s for MCQ vs descriptive).
 *
 * Implementations live next to the domain code they belong to:
 *   - StudentModel  → src/gbrain/  (Elo + FSRS in this PR)
 *   - Scorer        → src/scoring/
 *   - ItemSelector  → src/scoring/
 *   - CurriculumRepo→ src/curriculum/
 *   - TeachingPolicy→ src/teaching/
 *   - ReadinessEngine → src/readiness/
 *   - LLMGateway    → src/llm/        (already exists; this is the seam)
 *   - VerificationGate → src/verification/
 */

// ────────────────────────────────────────────────────────────────────
// Shared shapes (illustrative — see Appendix A of the blueprint)
// ────────────────────────────────────────────────────────────────────

export type SkillId = string;
export type ConceptId = string;
export type ObjectId = string;
export type StudentId = string;

export type MasteryState =
  | 'not-started'
  | 'learning'
  | 'practicing'
  | 'mastered'
  | 'at-risk';

export type ErrorTag = 'sign' | 'unit' | 'misread' | 'transcription' | 'method' | 'careless';

export interface Ability {
  /** Elo-scale rating. 1500 = average. Updates online from attempts. */
  rating: number;
  /** Confidence in the rating: low until ~30+ attempts on this skill. */
  confidence: number;
  /** Number of graded attempts that fed this rating. */
  n: number;
}

export interface ErrorTypeWeights {
  /** Per-error-type rate over the recent window (0..1). */
  weights: Partial<Record<ErrorTag, number>>;
  /** The student's personal top error mode, if one is clearly dominant. */
  dominant?: ErrorTag;
  /** Number of attempts that produced these weights. */
  n: number;
}

export interface Attempt {
  studentId: StudentId;
  objectId: ObjectId;
  skillId: SkillId;
  correct: boolean;
  partialMarks?: {
    earned: number;
    max: number;
    perCriterion: Record<string, number>;
  };
  errorTags?: ErrorTag[];
  latencyMs: number;
  ts: number;
}

export interface GradeResult {
  earned: number;
  max: number;
  perCriterion: Record<string, number>;
  feedback: string;
  /** 0..1. Below threshold routes to the teacher-review queue. */
  confidence: number;
  /** CAS-deterministic verdict on the final answer (never decided by the LLM). */
  casFinalAnswerCorrect: boolean;
}

export type ObjectType =
  | 'story'
  | 'manim'
  | 'interactive'
  | 'worked_example'
  | 'practice';

export interface LearningObject {
  id: ObjectId;
  nodeId: ConceptId;
  type: ObjectType;
  difficulty: number;          // Elo scale
  estMinutes: number;
  prereqs: ConceptId[];
  verification: 'cas_passed' | 'human_verified' | 'quarantined';
  payload: unknown;            // type-specific
}

export interface CurriculumNode {
  id: ConceptId;
  course: string;
  kind: 'concept' | 'skill' | 'exam_topic';
  title: string;
  prereqs: ConceptId[];
  examRelevance: number;       // 0..1
  gapClass?: 'aligned' | 'depth-gap' | 'breadth-gap' | 'foundation';
}

export type ActionKind = 'diagnose' | 'teach' | 'practice' | 'retain';

export interface Action {
  kind: ActionKind;
  objectId?: ObjectId;
  nodeId?: ConceptId;
  estMinutes: number;
  /** "Why this, why now" — used for the student-facing rationale chip. */
  rationale: string;
  /** Predicted marginal expected-score gain in arbitrary units; for ranking. */
  expectedGain: number;
}

// ────────────────────────────────────────────────────────────────────
// L3 — Student Model        [plugin]   Elo+FSRS now, AKT later
// ────────────────────────────────────────────────────────────────────

export interface StudentModel {
  /** Best estimate of student's ability on this skill. */
  abilityFor(studentId: StudentId, skillId: SkillId): Promise<Ability>;

  /** Coarse interpretable state shown to the student ("Calculus: practising"). */
  masteryState(studentId: StudentId, skillId: SkillId): Promise<MasteryState>;

  /** Probability the student recalls this object right now (FSRS). 0..1. */
  retrievability(studentId: StudentId, objectId: ObjectId): Promise<number>;

  /** Distribution of careless-error types from recent attempts. */
  errorProfile(studentId: StudentId): Promise<ErrorTypeWeights>;

  /**
   * Online update. Fire-and-forget OK. MUST be idempotent on (studentId,
   * objectId, ts) — re-delivery of the same event should not double-count.
   */
  update(attempt: Attempt): Promise<void>;
}

// ────────────────────────────────────────────────────────────────────
// L4 — Assessment   [plugin]   MCQ deterministic vs descriptive rubric
// ────────────────────────────────────────────────────────────────────

export interface ItemContext {
  /** The official solution / mark scheme, used for RAG grounding. */
  officialSolution?: string;
  /** Per-criterion rubric. Each entry max marks. */
  rubric?: Array<{ id: string; description: string; maxMarks: number }>;
  /** Expected final answer for CAS check. */
  expectedAnswer?: string;
  /** Item max marks (sum of rubric or MCQ marks). */
  maxMarks: number;
}

export interface Scorer {
  /** What kinds of items this scorer handles. */
  readonly kinds: ReadonlyArray<'mcq' | 'numeric' | 'descriptive'>;

  grade(
    studentResponse: string,
    item: ItemContext,
    opts?: { studentId?: StudentId }
  ): Promise<GradeResult>;
}

export interface SelectionConstraints {
  /** Target success probability band — the desirable-difficulty zone. */
  successBand?: [number, number];   // default [0.7, 0.85]
  /** Restrict to objects whose node is in this set (curriculum coverage). */
  allowedNodes?: ReadonlyArray<ConceptId>;
  /** Time budget for the next action, in minutes. */
  timeBudgetMin?: number;
  /** Light exposure control — top-k informative items sampled, k≥1. */
  exposureK?: number;
}

export interface ItemSelector {
  /** Pick the next practice item for this student. Proto-CAT in Phase 1; true CAT later. */
  selectNext(
    studentId: StudentId,
    constraints?: SelectionConstraints
  ): Promise<LearningObject | null>;
}

// ────────────────────────────────────────────────────────────────────
// L2 — Curriculum & Content     [plugin]   per-course graph
// ────────────────────────────────────────────────────────────────────

export interface CurriculumRepo {
  getNode(nodeId: ConceptId): Promise<CurriculumNode | null>;
  prereqsOf(nodeId: ConceptId): Promise<CurriculumNode[]>;

  /** Objects attached to a node, filterable by type / difficulty band. */
  objectsForNode(
    nodeId: ConceptId,
    filter?: { type?: ObjectType; diffMin?: number; diffMax?: number }
  ): Promise<LearningObject[]>;
}

// ────────────────────────────────────────────────────────────────────
// L5 — Teaching Policy       [plugin]   what to show, in which modality
// ────────────────────────────────────────────────────────────────────

export interface TeachingPolicyContext {
  /** From `derivePrepIntent()` — board / bridge / entrance. */
  prepIntent?: 'board' | 'bridge' | 'entrance';
  /** Has the student seen worked examples on this node already? */
  hasSeenWorkedExample?: boolean;
  /** Available time. */
  timeBudgetMin: number;
}

export interface TeachingPolicy {
  /**
   * Pick a learning object for THIS moment from the candidates the
   * curriculum repo offers. Encodes: worked-example fading by mastery,
   * desirable difficulty, interleaving once basics are in, and
   * exam-relevance weighting.
   */
  selectObject(
    studentId: StudentId,
    node: CurriculumNode,
    candidates: LearningObject[],
    ctx: TeachingPolicyContext
  ): Promise<LearningObject | null>;
}

// ────────────────────────────────────────────────────────────────────
// L6 — Readiness Engine (GBrain core)    [plugin: policies]
// ────────────────────────────────────────────────────────────────────

export interface ReadinessEngineDeps {
  studentModel: StudentModel;
  curriculum: CurriculumRepo;
  selector: ItemSelector;
  policy: TeachingPolicy;
}

export interface ReadinessEngine {
  /**
   * The single function the whole app orbits. Returns the highest-yield
   * Action for this student given the available time. Honors the
   * Extraction (don't lose marks you have) vs Acquisition (build new
   * mastery) split — see blueprint §1.1.
   */
  nextBestAction(
    studentId: StudentId,
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] }
  ): Promise<Action>;

  /**
   * Expected exam-score estimate right now. The honest north-star;
   * surfaced in the cockpit and on the student dashboard.
   *
   * `allowedNodes` scopes the assessment to a subset (e.g. just the
   * skills tested on a specific exam pack). Without it, the impl
   * returns {0, 0} — the caller is responsible for naming what
   * "current expected score" means.
   */
  expectedScore(
    studentId: StudentId,
    opts?: { allowedNodes?: ConceptId[]; course?: string },
  ): Promise<{ realized: number; potential: number }>;
}

// ────────────────────────────────────────────────────────────────────
// L1.5 — Eval & Guardrails        [seam]
// ────────────────────────────────────────────────────────────────────

export interface VerificationOutcome {
  pass: boolean;
  reason?: string;
  /** Per-gate verdict; useful in the cockpit. */
  gates: Record<string, { pass: boolean; detail?: string }>;
}

export interface VerificationGate {
  /** Run every gate (schema, CAS, judge, golden-set) on a candidate object. */
  verify(object: LearningObject): Promise<VerificationOutcome>;
}

// ────────────────────────────────────────────────────────────────────
// L1 — Platform: LLM Gateway       [seam]
// ────────────────────────────────────────────────────────────────────
// NOTE: src/llm/index.ts already implements most of this. The interface
// here is the contract a future provider swap must honor.

export interface LLMRequest {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Stable cache key for context caching (syllabus, rubric, fewshots). */
  cacheKey?: string;
  /** Telemetry / cost-attribution. */
  agentId?: string;
  taskType?: string;
}

export interface LLMResponse {
  text: string;
  model: string;
  provider: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  costUsd?: number;
  cached?: boolean;
}

export interface LLMGateway {
  /** cache → route → cascade. The frugal core. */
  generate(req: LLMRequest): Promise<LLMResponse>;
}
