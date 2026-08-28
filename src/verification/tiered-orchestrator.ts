/**
 * TieredVerificationOrchestrator
 *
 * Sequential verification cascade for GATE math problems:
 *   Tier 1:   RAG lookup (pgvector cosine similarity) — $0, <500ms
 *   Tier 2:   LLM dual-solve (2 models in parallel) — $0 (free tier), <8s
 *   Tier 2.5: SymPy stage (B1b/B1c) — OPTIONAL, constructor-injected,
 *             nullable. Absent = skipped (DB-less/CI-less honest — the
 *             live production cascade never wires this in; see B1d).
 *             When present, runs after an LLM disagreement and BEFORE the
 *             metered Wolfram call, short-circuiting Tier 3 whenever SymPy
 *             reaches a decisive verdict, so Wolfram arbitrates only what
 *             SymPy can't parse or disagrees on (plan premise 3).
 *   Tier 3:   Wolfram Alpha arbitration — free tier (2000/mo), <15s
 *   Tier 4+:  registered `AnswerVerifier`s (registerVerifier()) — advisory
 *             cross-checks that run AFTER the cascade has already picked a
 *             tierUsed/status/confidence, appending evidence to `checks`
 *             without overriding the built-in verdict (B1b).
 *
 * Short-circuits at first confident result. Every verification gets a
 * trace ID for end-to-end observability.
 *
 *   INPUT ─▶ Tier 1 (RAG) ─▶ Tier 2 (LLM×2) ─▶ Tier 2.5 (SymPy?) ─▶ Tier 3 (Wolfram) ─▶ Tier 4+ (extras)
 *     │        │ hit?            │ agree?           │ decisive?           │ arbitrate         │ advisory
 *     │        ▼ YES → return    ▼ YES → return     ▼ YES → return       ▼ return            ▼ append to checks
 *     │                          │ NO → continue     │ NO → continue      │                    │
 *     │                                                                                        │
 *     └────────────────────── trace ID threaded through every tier ──────────────────────────┘
 */

import { randomUUID } from 'crypto';
import type {
  VerificationCheck,
  VerificationContext,
  VerificationResult,
  VerificationStatus,
  ContentType,
} from './types.js';
import type { VectorStore, VectorSearchResult } from '../data/vector-store.js';
import type { WolframVerifier } from './verifiers/wolfram.js';
import type { AnswerVerifier, AnswerVerifierResult } from './verifiers/types.js';

// ============================================================================
// Types
// ============================================================================

export interface TieredOrchestratorConfig {
  /** Cosine similarity threshold for RAG hit (0-1). Default 0.85 */
  ragThreshold: number;
  /** Max Wolfram calls per day. Default 50 (self-imposed cap within 2000/mo free) */
  wolframDailyLimit: number;
  /** Timeout per LLM call in ms. Default 10_000 */
  llmTimeoutMs: number;
  /** Timeout for Wolfram call in ms. Default 15_000 */
  wolframTimeoutMs: number;
}

export const DEFAULT_CONFIG: TieredOrchestratorConfig = {
  ragThreshold: 0.85,
  wolframDailyLimit: 50,
  llmTimeoutMs: 10_000,
  wolframTimeoutMs: 15_000,
};

// Additive value for the optional Tier 2.5 SymPy stage. This is a closed
// union with real consumers — before adding another value, grep
// `tier_used`/`tierUsed` across the repo (B1b's lockstep enumeration):
// migration 003's verification_log.tier_used is free TEXT (no CHECK
// constraint to extend); src/api/gate-routes.ts writes/returns it as-is;
// src/api/admin-routes.ts's tier-breakdown query is GROUP BY tier_used
// (no hardcoded enumeration to update); src/jobs/content-flywheel.ts logs
// it generically; frontend/src/lib/receipt.ts and
// frontend/src/pages/app/{PracticePage,VerifyPage}.tsx treat it as an
// opaque string — VerifyPage.tsx's display formatter got an explicit
// 'tier25_sympy' → 'Tier 2.5 (SymPy): ' case so the UI doesn't show the
// raw enum value.
export type TierUsed = 'tier1_rag' | 'tier2_llm' | 'tier25_sympy' | 'tier3_wolfram';

export interface TieredVerificationResult extends VerificationResult {
  traceId: string;
  tierUsed: TierUsed;
  tierTimings: {
    tier1Ms?: number;
    tier2Ms?: number;
    tier25Ms?: number;
    tier3Ms?: number;
  };
  ragScore?: number;
  llmAgreement?: boolean;
}

/** Minimal interface for LLM dual-solve — keeps orchestrator testable without full LLMClient */
export interface DualSolveLLM {
  solve(problem: string, context?: VerificationContext): Promise<{ answer: string; confidence: number }>;
}

export interface TierSignalEmitter {
  emit(signal: string, data: Record<string, unknown>): void;
}

// ============================================================================
// Orchestrator
// ============================================================================

export class TieredVerificationOrchestrator {
  private wolframCallsToday = 0;
  private wolframResetDate: string = new Date().toISOString().slice(0, 10);
  /** Tier 4+ verifiers registered via registerVerifier(). Run after Wolfram, in tier order. */
  private extraVerifiers: AnswerVerifier[] = [];

  constructor(
    private vectorStore: VectorStore,
    private embedder: (text: string) => Promise<number[]>,
    private llmA: DualSolveLLM,
    private llmB: DualSolveLLM,
    private wolfram: WolframVerifier,
    private config: TieredOrchestratorConfig = DEFAULT_CONFIG,
    private signals?: TierSignalEmitter,
    extraVerifiers: AnswerVerifier[] = [],
    /**
     * Tier 2.5 SymPy stage (B1b) — nullable, constructor-injected like the
     * `wolfram` slot but optional where wolfram is not. `null`/omitted =
     * the stage is skipped entirely (no signal, no timing entry). The one
     * production call site (src/server.ts) never passes this — see B1d.
     */
    private sympy: AnswerVerifier | null = null,
  ) {
    for (const v of extraVerifiers) this.registerVerifier(v);
  }

  /**
   * Register a Tier 4+ AnswerVerifier. Actually executes now (B1b): `verify()`
   * runs every registered verifier after the built-in cascade has already
   * settled on a tierUsed/status/confidence, and appends each one's result
   * to `checks` as advisory evidence — it never overrides the cascade's
   * verdict. Designed for cross-checks/domain-specific verifiers that should
   * run AFTER Wolfram. SymPy is NOT such a verifier — the plan places it
   * BEFORE the metered Wolfram call, so it is wired via the constructor's
   * dedicated `sympy` slot (a hardcoded Tier 2.5 stage) instead, bypassing
   * this registry entirely. Tier 1-3 (and 2.5) remain hardcoded because
   * their behaviors (RAG writeback, LLM agreement, Wolfram rate-limit
   * fallback, SymPy short-circuit) don't fit the simple verifiers[]
   * iteration pattern used here.
   *
   * Throws if a verifier with the same name is already registered.
   */
  registerVerifier(verifier: AnswerVerifier): void {
    if (verifier.tier < 4) {
      throw new Error(
        `registerVerifier rejected '${verifier.name}': tier ${verifier.tier} reserved for built-in cascade. ` +
          `Tier 4+ only. Use the constructor's named verifier slots for tier 1-3 (and the ` +
          `optional Tier 2.5 SymPy slot).`,
      );
    }
    if (this.extraVerifiers.some(v => v.name === verifier.name)) {
      throw new Error(`Verifier '${verifier.name}' already registered`);
    }
    this.extraVerifiers.push(verifier);
    // Keep the array sorted so iteration runs in tier order regardless of registration order.
    this.extraVerifiers.sort((a, b) => a.tier - b.tier);
  }

  /** Names of all registered Tier 4+ verifiers; useful for telemetry and tests. */
  listExtraVerifiers(): string[] {
    return this.extraVerifiers.map(v => v.name);
  }

  /**
   * Verify a student's answer to a math problem.
   *
   * Runs the built-in tiered cascade (`verifyCore`) to a verdict, then —
   * B1b, "make Tier-4+ verifiers actually execute" — runs every registered
   * Tier 4+ `AnswerVerifier` and folds its evidence into `checks`. The
   * registry existed as populate-only before this; nothing ever iterated
   * it. Extra verifiers are advisory cross-checks: they append evidence,
   * they never override the cascade's own tierUsed/status/confidence (a
   * Tier 4+ verifier that should be able to override belongs in the
   * cascade itself, not the registry — see registerVerifier()'s doc
   * comment on what the registry is FOR).
   *
   * @param problem  - The problem statement
   * @param answer   - The student's answer
   * @param context  - Optional verification context (topic, subject, etc.)
   */
  async verify(
    problem: string,
    answer: string,
    context?: VerificationContext,
  ): Promise<TieredVerificationResult> {
    const result = await this.verifyCore(problem, answer, context);
    if (this.extraVerifiers.length > 0) {
      const extraChecks = await this.runExtraVerifiers(problem, answer, {
        ...context,
        traceId: result.traceId,
      });
      result.checks.push(...extraChecks);
    }
    return result;
  }

  /** The built-in Tier 1 → 2 → 2.5 → 3 cascade, unchanged in shape from before B1b. */
  private async verifyCore(
    problem: string,
    answer: string,
    context?: VerificationContext,
  ): Promise<TieredVerificationResult> {
    const traceId = randomUUID();
    const requestedAt = new Date();
    const checks: VerificationCheck[] = [];
    const tierTimings: TieredVerificationResult['tierTimings'] = {};

    const baseResult = {
      contentId: traceId,
      contentType: 'math_solution' as ContentType,
      originalContent: `${problem} → ${answer}`,
      traceId,
      tierTimings,
    };

    // ── Tier 1: RAG Lookup ───────────────────────────────────────────────
    const t1Start = Date.now();
    const ragResult = await this.tier1RAG(problem, answer);
    tierTimings.tier1Ms = Date.now() - t1Start;

    if (ragResult) {
      checks.push(ragResult.check);
      this.emitSignal('tier_1_hit', { traceId, score: ragResult.score });

      return this.buildResult({
        ...baseResult,
        checks,
        requestedAt,
        tierUsed: 'tier1_rag',
        status: ragResult.check.status,
        confidence: ragResult.check.confidence,
        ragScore: ragResult.score,
      });
    }

    // ── Tier 2: LLM Dual-Solve ──────────────────────────────────────────
    const t2Start = Date.now();
    const llmResult = await this.tier2LLMDualSolve(problem, answer, context);
    tierTimings.tier2Ms = Date.now() - t2Start;

    if (llmResult.agreed) {
      checks.push(...llmResult.checks);
      this.emitSignal('tier_2_agree', { traceId, matchesStudent: llmResult.matchesStudent });

      // Write back to RAG cache for future lookups
      await this.writeToRAGCache(problem, answer, llmResult.checks[0]);

      return this.buildResult({
        ...baseResult,
        checks,
        requestedAt,
        tierUsed: 'tier2_llm',
        status: llmResult.matchesStudent ? 'verified' : 'failed',
        confidence: llmResult.avgConfidence,
        llmAgreement: true,
      });
    }

    checks.push(...llmResult.checks);
    this.emitSignal('tier_2_disagree', { traceId });

    // ── Tier 2.5: SymPy (optional; absent = skipped) ────────────────────
    // Runs BEFORE the metered Wolfram call so SymPy carries the bulk of
    // verification and Wolfram arbitrates only the residue (premise 3).
    if (this.sympy) {
      const t25Start = Date.now();
      const sympyCheck = await this.tier25Sympy(problem, answer, context);
      tierTimings.tier25Ms = Date.now() - t25Start;
      checks.push(sympyCheck);
      this.emitSignal('tier_25_sympy', {
        traceId,
        status: sympyCheck.status,
        confidence: sympyCheck.confidence,
      });

      // A decisive verdict (real agreement OR real disagreement — never a
      // refusal, which always carries confidence 0) short-circuits Wolfram.
      if (sympyCheck.confidence > 0) {
        if (sympyCheck.status === 'verified' || sympyCheck.status === 'failed') {
          await this.writeToRAGCache(problem, answer, sympyCheck);
        }
        return this.buildResult({
          ...baseResult,
          checks,
          requestedAt,
          tierUsed: 'tier25_sympy',
          status: sympyCheck.status,
          confidence: sympyCheck.confidence,
          llmAgreement: false,
        });
      }
      this.emitSignal('tier_25_sympy_refused', { traceId, details: sympyCheck.details });
    }

    // ── Tier 3: Wolfram Arbitration ──────────────────────────────────────
    if (!this.canCallWolfram()) {
      this.emitSignal('wolfram.rate_limited', { traceId, callsToday: this.wolframCallsToday });

      // Fallback: use the more confident LLM answer
      const bestCheck = llmResult.checks.reduce((a, b) => a.confidence > b.confidence ? a : b);
      return this.buildResult({
        ...baseResult,
        checks,
        requestedAt,
        tierUsed: 'tier2_llm',
        status: bestCheck.status,
        confidence: bestCheck.confidence * 0.8, // Penalize confidence when LLMs disagreed
        llmAgreement: false,
      });
    }

    const t3Start = Date.now();
    const wolframCheck = await this.tier3Wolfram(problem, answer, context);
    tierTimings.tier3Ms = Date.now() - t3Start;
    checks.push(wolframCheck);

    this.emitSignal('wolfram.called', { traceId, durationMs: tierTimings.tier3Ms });

    // Write Wolfram-verified result to RAG cache
    if (wolframCheck.status === 'verified' || wolframCheck.status === 'failed') {
      await this.writeToRAGCache(problem, answer, wolframCheck);
    }

    return this.buildResult({
      ...baseResult,
      checks,
      requestedAt,
      tierUsed: 'tier3_wolfram',
      status: wolframCheck.status,
      confidence: wolframCheck.confidence,
      llmAgreement: false,
    });
  }

  /** Reset the daily Wolfram counter. Called by cron at midnight. */
  resetWolframCounter(): void {
    this.wolframCallsToday = 0;
    this.wolframResetDate = new Date().toISOString().slice(0, 10);
  }

  /** Current Wolfram usage stats for observability */
  getWolframUsage(): { callsToday: number; limit: number; resetDate: string } {
    return {
      callsToday: this.wolframCallsToday,
      limit: this.config.wolframDailyLimit,
      resetDate: this.wolframResetDate,
    };
  }

  // ============================================================================
  // Tier Implementations
  // ============================================================================

  private async tier1RAG(
    problem: string,
    answer: string,
  ): Promise<{ check: VerificationCheck; score: number } | null> {
    try {
      const queryText = `${problem} answer: ${answer}`;
      const embedding = await this.embedder(queryText);

      const results = await this.vectorStore.search({
        vector: embedding,
        limit: 1,
        threshold: this.config.ragThreshold,
        filter: { type: 'question' },
      });

      if (results.length === 0) return null;

      const match = results[0];
      const cachedStatus = this.extractCachedStatus(match);
      if (!cachedStatus) return null;

      return {
        score: match.score,
        check: {
          verifier: 'database',
          status: cachedStatus.status,
          confidence: match.score * cachedStatus.confidence,
          details: `RAG cache hit (score: ${match.score.toFixed(3)}). Cached verdict: ${cachedStatus.status}`,
          timestamp: new Date(),
          durationMs: 0, // Set by caller
        },
      };
    } catch (error) {
      // RAG failure is non-fatal — fall through to Tier 2
      this.emitSignal('tier_1_error', {
        error: error instanceof Error ? error.message : 'Unknown RAG error',
      });
      return null;
    }
  }

  private async tier2LLMDualSolve(
    problem: string,
    answer: string,
    context?: VerificationContext,
  ): Promise<{
    agreed: boolean;
    matchesStudent: boolean;
    checks: VerificationCheck[];
    avgConfidence: number;
  }> {
    const solveContext: VerificationContext = {
      ...context,
      expectedAnswer: answer,
      sourceContent: problem,
    };

    // Run both LLMs in parallel with timeout
    const [resultA, resultB] = await Promise.all([
      this.safeSolve(this.llmA, problem, solveContext, 'LLM-A'),
      this.safeSolve(this.llmB, problem, solveContext, 'LLM-B'),
    ]);

    const checks: VerificationCheck[] = [
      this.llmSolveToCheck(resultA, 'LLM-A'),
      this.llmSolveToCheck(resultB, 'LLM-B'),
    ];

    // Compare: do both LLMs agree on the answer?
    const aMatchesStudent = this.answersMatch(resultA.answer, answer);
    const bMatchesStudent = this.answersMatch(resultB.answer, answer);
    const llmsAgree = this.answersMatch(resultA.answer, resultB.answer);

    const avgConfidence = (resultA.confidence + resultB.confidence) / 2;

    return {
      agreed: llmsAgree,
      matchesStudent: llmsAgree && aMatchesStudent,
      checks,
      avgConfidence,
    };
  }

  /** Maps the injected AnswerVerifier's result onto a VerificationCheck. Never throws. */
  private async tier25Sympy(
    problem: string,
    answer: string,
    context?: VerificationContext,
  ): Promise<VerificationCheck> {
    const start = Date.now();
    try {
      // AnswerVerifierContext is a narrower shape than VerificationContext —
      // thread only what it declares.
      const result: AnswerVerifierResult = await this.sympy!.verify(problem, answer, {
        topic: context?.topic,
        subject: context?.subject,
      });
      const decisive = result.confidence > 0;
      return {
        verifier: 'sympy',
        status: decisive ? (result.agrees ? 'verified' : 'failed') : 'inconclusive',
        confidence: result.confidence,
        details:
          result.reason ??
          (result.agrees
            ? `SymPy confirms${result.canonicalAnswer ? `: ${result.canonicalAnswer}` : ''}`
            : 'SymPy disagrees'),
        timestamp: new Date(),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      // AnswerVerifier.verify() must never throw per its own contract, but
      // the orchestrator stays defensive here the same way tier3Wolfram
      // already is against a misbehaving implementation.
      return {
        verifier: 'sympy',
        status: 'inconclusive',
        confidence: 0,
        details: `sympy error: ${error instanceof Error ? error.message : 'Unknown'}`,
        timestamp: new Date(),
        durationMs: Date.now() - start,
      };
    }
  }

  /**
   * Runs every registered Tier 4+ verifier and maps each result onto a
   * VerificationCheck. Advisory only — never throws, never influences
   * tierUsed/status/confidence (see verify()'s doc comment).
   */
  private async runExtraVerifiers(
    problem: string,
    answer: string,
    context?: VerificationContext & { traceId?: string },
  ): Promise<VerificationCheck[]> {
    const out: VerificationCheck[] = [];
    for (const v of this.extraVerifiers) {
      const start = Date.now();
      try {
        const result = await v.verify(problem, answer, {
          topic: context?.topic,
          subject: context?.subject,
          traceId: context?.traceId,
        });
        const decisive = result.confidence > 0;
        out.push({
          verifier: 'custom',
          status: decisive ? (result.agrees ? 'verified' : 'failed') : 'inconclusive',
          confidence: result.confidence,
          details: `${v.name}: ${result.reason ?? (result.agrees ? 'agrees' : 'disagrees')}`,
          timestamp: new Date(),
          durationMs: Date.now() - start,
        });
        this.emitSignal('extra_verifier_ran', {
          name: v.name,
          agrees: result.agrees,
          confidence: result.confidence,
        });
      } catch (error) {
        out.push({
          verifier: 'custom',
          status: 'inconclusive',
          confidence: 0,
          details: `${v.name} error: ${error instanceof Error ? error.message : 'Unknown'}`,
          timestamp: new Date(),
          durationMs: Date.now() - start,
        });
      }
    }
    return out;
  }

  private async tier3Wolfram(
    problem: string,
    answer: string,
    context?: VerificationContext,
  ): Promise<VerificationCheck> {
    this.wolframCallsToday++;

    // Auto-reset if the date has changed
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.wolframResetDate) {
      this.wolframCallsToday = 1;
      this.wolframResetDate = today;
    }

    try {
      const check = await this.wolfram.verify(
        problem,
        'math_solution',
        { ...context, expectedAnswer: answer, sourceContent: problem },
      );
      return check;
    } catch (error) {
      return {
        verifier: 'wolfram',
        status: 'inconclusive',
        confidence: 0,
        details: `Wolfram error: ${error instanceof Error ? error.message : 'Unknown'}`,
        timestamp: new Date(),
        durationMs: 0,
      };
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private async safeSolve(
    llm: DualSolveLLM,
    problem: string,
    context: VerificationContext,
    label: string,
  ): Promise<{ answer: string; confidence: number }> {
    try {
      const result = await Promise.race([
        llm.solve(problem, context),
        this.timeout(this.config.llmTimeoutMs, label),
      ]);
      return result;
    } catch (error) {
      this.emitSignal('tier_2_error', {
        label,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return { answer: '', confidence: 0 };
    }
  }

  private timeout(ms: number, label: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    );
  }

  private llmSolveToCheck(
    result: { answer: string; confidence: number },
    label: string,
  ): VerificationCheck {
    const hasAnswer = result.answer.length > 0;
    return {
      verifier: 'llm_consensus',
      status: hasAnswer ? (result.confidence >= 0.7 ? 'verified' : 'partial') : 'inconclusive',
      confidence: result.confidence,
      details: hasAnswer ? `${label} solved: ${result.answer}` : `${label} failed to solve`,
      timestamp: new Date(),
      durationMs: 0,
    };
  }

  private answersMatch(a: string, b: string): boolean {
    if (!a || !b) return false;

    const normalize = (s: string) =>
      s.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[()[\]{}]/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-');

    const normA = normalize(a);
    const normB = normalize(b);

    if (normA === normB) return true;

    // Numeric comparison with tolerance
    const numA = parseFloat(normA);
    const numB = parseFloat(normB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return Math.abs(numA - numB) < 0.0001;
    }

    // Substring containment for complex expressions
    return normA.includes(normB) || normB.includes(normA);
  }

  private extractCachedStatus(
    match: VectorSearchResult,
  ): { status: VerificationStatus; confidence: number } | null {
    const meta = match.metadata as Record<string, unknown>;
    const status = meta['verificationStatus'] as VerificationStatus | undefined;
    const confidence = meta['verificationConfidence'] as number | undefined;

    if (!status || confidence === undefined) return null;
    return { status, confidence };
  }

  private async writeToRAGCache(
    problem: string,
    answer: string,
    check: VerificationCheck,
  ): Promise<void> {
    try {
      const text = `${problem} answer: ${answer}`;
      const embedding = await this.embedder(text);
      const id = randomUUID();

      await this.vectorStore.upsert([
        {
          id,
          embedding,
          metadata: {
            type: 'question',
            entityId: id,
            subject: 'mathematics',
            exam: 'GATE',
            createdAt: Date.now(),
            verificationStatus: check.status,
            verificationConfidence: check.confidence,
            verifier: check.verifier,
            answer,
          },
          content: text,
        },
      ]);
    } catch (error) {
      // Cache write failure is non-fatal
      this.emitSignal('rag_cache_write_error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  private canCallWolfram(): boolean {
    // Auto-reset if date changed
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.wolframResetDate) {
      this.wolframCallsToday = 0;
      this.wolframResetDate = today;
    }
    return this.wolframCallsToday < this.config.wolframDailyLimit;
  }

  private emitSignal(signal: string, data: Record<string, unknown>): void {
    this.signals?.emit(signal, data);
  }

  private buildResult(params: {
    contentId: string;
    contentType: ContentType;
    originalContent: string;
    traceId: string;
    tierTimings: TieredVerificationResult['tierTimings'];
    checks: VerificationCheck[];
    requestedAt: Date;
    tierUsed: TierUsed;
    status: VerificationStatus;
    confidence: number;
    ragScore?: number;
    llmAgreement?: boolean;
  }): TieredVerificationResult {
    const completedAt = new Date();
    return {
      contentId: params.contentId,
      contentType: params.contentType,
      originalContent: params.originalContent,
      overallStatus: params.status,
      overallConfidence: params.confidence,
      checks: params.checks,
      metadata: {
        requestedAt: params.requestedAt,
        completedAt,
        totalDurationMs: completedAt.getTime() - params.requestedAt.getTime(),
        verifiersUsed: params.checks.map(c => c.verifier),
      },
      traceId: params.traceId,
      tierUsed: params.tierUsed,
      tierTimings: params.tierTimings,
      ragScore: params.ragScore,
      llmAgreement: params.llmAgreement,
    };
  }
}
