#!/usr/bin/env npx tsx
/**
 * scripts/seed-demo-personalisation.ts
 *
 * Seeds the two personalisation surfaces that only ever fill from student
 * behaviour: `thinking_gap_cache` (a framed explanation of a specific wrong
 * answer) and `student_atom_overrides` (a lesson body rewritten for one
 * student who kept failing the same atom).
 *
 * ## Why this script exists, stated plainly
 *
 * `/api/admin/content-maturity` reports both surfaces as empty on the demo
 * deploy, which is TRUE and is not a fault — the report itself says zero is
 * expected before real traffic. They cannot be filled by writing code or
 * content, only by students getting things wrong.
 *
 * On a demo instance there are no students, so the demo can never show what
 * personalisation looks like when it is working. This seeds a small,
 * hand-authored set attributed to the repo's existing fixture personas so the
 * demo has something real to show.
 *
 * ## What is honest about it, and what is not
 *
 * Honest: every row goes in through the same schema, the same cache key
 * (concept × error_type × misconception_hash × framing), the same framing
 * vocabulary (`src/sessions/learner-framing.ts`) and the same uniqueness
 * constraint the runtime uses. The student ids are the deterministic persona
 * UUIDs from `personaUserId()`, which all begin `0aded0a0-`, so a fixture row
 * is distinguishable from a real one by inspection and by
 * `isPersonaUserId()`.
 *
 * NOT honest to claim, and so stated here: this text was written by hand for
 * the demo. It is not output of the deployed runtime's own generator. So the
 * rows show the SHAPE of the feature, never the quality of what the generator
 * writes, and reading the report's green light as "generation is producing
 * text this good" would be wrong.
 *
 * Whether the generator can run at all is a separate question, and a
 * checkable one — do not assume it either way. The runtime path
 * (`thinking-gap-service.ts` → `getLlmForRole('chat')`,
 * `personalized-regen.ts` → `generateConcept`) resolves a provider through
 * `loadConfigFromEnv`, and the server's boot banner is emitted from that same
 * `getLlmForRole('chat')` call. So the log line
 * `[server] Verification tiers: RAG + LLM (<provider>/<model>) + Wolfram` is
 * proof a provider IS configured; the same line without an LLM segment is
 * proof it is not. Check the banner for the deploy you actually care about.
 *
 * Because the gap text is served verbatim to whoever hits that cache key, it
 * is written to the same standard as the rest of the content: 1–2 sentences,
 * addressed as "you", concrete about the specific wrong answer, no praise, no
 * full solution — the contract in `buildGapPrompt`.
 *
 * ## Usage
 *
 *   DATABASE_URL=postgres://… npx tsx scripts/seed-demo-personalisation.ts
 *   …                                                          --dry-run
 *   …                                                          --purge
 *
 * Idempotent. `--purge` removes only rows this script created (persona-owned
 * overrides, and gap rows whose key matches a seeded entry).
 */

import crypto from 'crypto';
import { getSharedPool } from '../src/storage/pool';
import { personaUserId } from '../src/scenarios/persona-seeder';
import { framingSignature } from '../src/sessions/learner-framing';

/** Mirrors buildMisconceptionHash() in thinking-gap-service.ts, which is
 *  module-private. Same rule: top 3, sorted, joined, sha1, first 16 chars.
 *  If that rule ever changes, this seeder's keys stop matching the runtime's
 *  lookups — which shows up as a cache miss, not as corruption. */
function misconceptionHash(misconceptions: string[]): string {
  const top3 = misconceptions.slice(0, 3).sort().join('|');
  return crypto.createHash('sha1').update(top3).digest('hex').slice(0, 16);
}

interface GapSeed {
  concept_id: string;
  error_type: string;
  misconceptions: string[];
  framing: { band: 'cold' | 'building' | 'solid'; stance: 'shaken' | 'steady' | 'assured'; mode: 'geometric' | 'algebraic' | 'balanced' };
  gap_text: string;
}

/**
 * Nine rows: three concepts a GATE candidate actually loses marks on, each
 * seen through three different learner cohorts. Spread across bands, stances
 * and modes on purpose — the report counts DISTINCT framings, and a set that
 * only covered one cohort would prove nothing about the axis.
 */
const GAPS: GapSeed[] = [
  {
    concept_id: 'eigenvalues',
    error_type: 'wrong_formula',
    misconceptions: ['solves det(A) = 0 instead of det(A - lambda I) = 0'],
    framing: { band: 'cold', stance: 'shaken', mode: 'geometric' },
    gap_text:
      'You set $\\det(A)=0$, but that asks whether the matrix squashes space flat — a question about $A$ alone. The eigenvalue question is $\\det(A-\\lambda I)=0$: subtract $\\lambda$ down the diagonal first, then take the determinant.',
  },
  {
    concept_id: 'eigenvalues',
    error_type: 'wrong_formula',
    misconceptions: ['reports only one root of the characteristic polynomial'],
    framing: { band: 'building', stance: 'steady', mode: 'algebraic' },
    gap_text:
      'You stopped at one root, but a $2\\times2$ characteristic polynomial is quadratic and carries two eigenvalues counted with multiplicity. Check your answer against the trace: the eigenvalues must sum to the diagonal sum.',
  },
  {
    concept_id: 'eigenvalues',
    error_type: 'sign_error',
    misconceptions: ['expands det(A - lambda I) with the sign of lambda flipped'],
    framing: { band: 'solid', stance: 'assured', mode: 'balanced' },
    gap_text:
      'Your roots are the negatives of the right ones, which places the slip in the expansion of $\\det(A-\\lambda I)$ rather than in the method. The $\\lambda^{n-1}$ coefficient is $-\\operatorname{tr}(A)$, so a sign flip there inverts every root.',
  },
  {
    concept_id: 'determinants',
    error_type: 'sign_error',
    misconceptions: ['does not flip the sign after a row swap'],
    framing: { band: 'cold', stance: 'shaken', mode: 'algebraic' },
    gap_text:
      'Your value is right in size and wrong in sign, which points at the row swap: swapping two rows multiplies the determinant by $-1$. Count your swaps, and multiply by $-1$ once for each.',
  },
  {
    concept_id: 'determinants',
    error_type: 'factor_error',
    misconceptions: ['scales a row and forgets the determinant scales with it'],
    framing: { band: 'building', stance: 'shaken', mode: 'balanced' },
    gap_text:
      'You are out by exactly the factor you divided a row by while reducing. Scaling one row by $k$ scales the determinant by $k$ too, so that step has to be undone at the end rather than treated as free.',
  },
  {
    concept_id: 'determinants',
    error_type: 'wrong_formula',
    misconceptions: ['assumes det(A + B) equals det(A) + det(B)'],
    framing: { band: 'solid', stance: 'assured', mode: 'algebraic' },
    gap_text:
      'You added the determinants of the two matrices. The determinant is multiplicative, not additive: $\\det(AB)=\\det(A)\\det(B)$ holds, $\\det(A+B)=\\det(A)+\\det(B)$ does not, and almost any pair of $2\\times2$ matrices is a counterexample.',
  },
  {
    concept_id: 'matrix-inverse',
    error_type: 'wrong_formula',
    misconceptions: ['inverts a matrix whose determinant is zero'],
    framing: { band: 'cold', stance: 'shaken', mode: 'balanced' },
    gap_text:
      'The matrix you inverted has $\\det=0$, so no inverse exists to find — it collapses space onto a line, and nothing can un-collapse it. Check the determinant before you start; a zero there ends the question.',
  },
  {
    concept_id: 'matrix-inverse',
    error_type: 'wrong_formula',
    misconceptions: ['writes (AB) inverse as A inverse times B inverse'],
    framing: { band: 'building', stance: 'assured', mode: 'algebraic' },
    gap_text:
      'You kept the order: $(AB)^{-1}=A^{-1}B^{-1}$. Undoing a composition reverses it, so $(AB)^{-1}=B^{-1}A^{-1}$ — the same reversal the transpose obeys, and it only looks harmless because it is invisible whenever the two commute.',
  },
  {
    concept_id: 'matrix-inverse',
    error_type: 'factor_error',
    misconceptions: ['omits the 1/det factor in the 2x2 inverse formula'],
    framing: { band: 'solid', stance: 'steady', mode: 'geometric' },
    gap_text:
      'Your entries are the adjugate but not the inverse: you left off the $1/\\det(A)$ out front, which is why every entry is out by the same factor. Multiplying your answer by $A$ returns $\\det(A)I$ rather than $I$, which is the fastest way to catch this.',
  },
];

interface OverrideSeed {
  persona: string;
  atom_id: string;
  trigger_reason: string;
  override_content: string;
}

/**
 * Rewritten lesson bodies for two fixture personas who, in their seeded
 * history, kept missing the same atom. `trigger_reason` records what the real
 * regen path would have recorded, so the row reads the same way one produced
 * by `maybeQueueRegenForStudent()` would.
 */
const OVERRIDES: OverrideSeed[] = [
  {
    persona: 'meera-gate-la-anxious',
    atom_id: 'eigenvalues.intuition',
    trigger_reason: 'demo fixture: 3 failures on eigenvalues.intuition within 7 days',
    override_content:
      'Take $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$ and the vector $(1,1)$.\n\n' +
      'Multiply: $A\\begin{pmatrix}1\\\\1\\end{pmatrix}=\\begin{pmatrix}3\\\\3\\end{pmatrix}$. ' +
      'Same direction, three times as long. That is the whole definition — the direction survived, only the length changed.\n\n' +
      'Now try $(1,-1)$: $A\\begin{pmatrix}1\\\\-1\\end{pmatrix}=\\begin{pmatrix}1\\\\-1\\end{pmatrix}$. ' +
      'Direction survived again, length unchanged, so its eigenvalue is $1$.\n\n' +
      'Every other direction gets tilted. Those two do not, and that is what makes them eigenvectors of this matrix. ' +
      'The numbers $3$ and $1$ are their eigenvalues, and they sum to $4$ — the diagonal sum, which is the check worth doing every time.',
  },
  {
    persona: 'priya-cbse-12-anxious',
    atom_id: 'determinants.intuition',
    trigger_reason: 'demo fixture: 3 failures on determinants.intuition within 7 days',
    override_content:
      'Start with the unit square: corners $(0,0)$, $(1,0)$, $(0,1)$, $(1,1)$. Its area is $1$.\n\n' +
      'Apply $A=\\begin{pmatrix}3&0\\\\0&2\\end{pmatrix}$. The square becomes a $3$-by-$2$ rectangle, so the area is now $6$.\n\n' +
      'That $6$ is $\\det(A)$. The determinant is not a length or an entry — it is the factor the area was multiplied by.\n\n' +
      'Two consequences worth holding onto. A negative determinant means the shape was flipped over as well as scaled. ' +
      'And a determinant of $0$ means the area became $0$: the square was squashed onto a line, which is exactly why such a matrix has no inverse.',
  },
];

function has(flag: string): boolean {
  return process.argv.includes(`--${flag}`);
}

async function main(): Promise<void> {
  const dryRun = has('dry-run');
  const pool = getSharedPool();
  if (!pool && !has('print-sql')) {
    console.error('[seed-demo-personalisation] DATABASE_URL is not set — nothing to seed.');
    process.exit(1);
  }

  if (has('purge') && pool) {
    if (dryRun) {
      console.log('[seed-demo-personalisation] --dry-run: would purge seeded rows.');
      return;
    }
    const ids = OVERRIDES.map((o) => personaUserId(o.persona));
    const { rowCount: o } = await pool.query(
      `DELETE FROM student_atom_overrides WHERE student_id = ANY($1)`,
      [ids],
    );
    let g = 0;
    for (const gap of GAPS) {
      const { rowCount } = await pool.query(
        `DELETE FROM thinking_gap_cache
         WHERE concept_id = $1 AND error_type = $2 AND misconception_hash = $3 AND framing = $4`,
        [gap.concept_id, gap.error_type, misconceptionHash(gap.misconceptions), framingSignature(gap.framing)],
      );
      g += rowCount ?? 0;
    }
    console.log(`[seed-demo-personalisation] purged ${g} gap row(s), ${o} override(s).`);
    return;
  }

  // An operator with psql but no app environment (or an agent working through
  // a Postgres console) needs the same statements this script would run,
  // rather than a second hand-written copy that can drift from it.
  if (has('print-sql')) {
    const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
    for (const gap of GAPS) {
      console.log(
        `INSERT INTO thinking_gap_cache (concept_id, error_type, misconception_hash, framing, gap_text)\n` +
          `VALUES (${q(gap.concept_id)}, ${q(gap.error_type)}, ${q(misconceptionHash(gap.misconceptions))}, ` +
          `${q(framingSignature(gap.framing))}, ${q(gap.gap_text)})\n` +
          `ON CONFLICT ON CONSTRAINT uq_thinking_gap_framed DO NOTHING;\n`,
      );
    }
    for (const ov of OVERRIDES) {
      console.log(
        `INSERT INTO student_atom_overrides (student_id, atom_id, override_content, expires_at, trigger_reason)\n` +
          `VALUES (${q(personaUserId(ov.persona))}, ${q(ov.atom_id)}, ${q(ov.override_content)}, ` +
          `NOW() + INTERVAL '14 days', ${q(ov.trigger_reason)})\n` +
          `ON CONFLICT (student_id, atom_id) DO UPDATE SET override_content = EXCLUDED.override_content, ` +
          `expires_at = EXCLUDED.expires_at, trigger_reason = EXCLUDED.trigger_reason, generated_at = NOW();\n`,
      );
    }
    return;
  }

  let gapsWritten = 0;
  for (const gap of GAPS) {
    const framing = framingSignature(gap.framing);
    const hash = misconceptionHash(gap.misconceptions);
    if (dryRun) {
      console.log(`  would seed gap ${gap.concept_id}/${gap.error_type}/${framing}`);
      continue;
    }
    // Same statement and same conflict target as writeCache().
    const { rowCount } = await pool!.query(
      `INSERT INTO thinking_gap_cache (concept_id, error_type, misconception_hash, framing, gap_text)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ON CONSTRAINT uq_thinking_gap_framed DO NOTHING`,
      [gap.concept_id, gap.error_type, hash, framing, gap.gap_text],
    );
    gapsWritten += rowCount ?? 0;
  }

  let overridesWritten = 0;
  for (const ov of OVERRIDES) {
    const studentId = personaUserId(ov.persona);
    if (dryRun) {
      console.log(`  would seed override ${ov.atom_id} for ${studentId}`);
      continue;
    }
    const { rowCount } = await pool!.query(
      `INSERT INTO student_atom_overrides (student_id, atom_id, override_content, expires_at, trigger_reason)
       VALUES ($1, $2, $3, NOW() + INTERVAL '14 days', $4)
       ON CONFLICT (student_id, atom_id) DO UPDATE
         SET override_content = EXCLUDED.override_content,
             expires_at       = EXCLUDED.expires_at,
             trigger_reason   = EXCLUDED.trigger_reason,
             generated_at     = NOW()`,
      [studentId, ov.atom_id, ov.override_content, ov.trigger_reason],
    );
    overridesWritten += rowCount ?? 0;
  }

  if (dryRun) return;
  console.log(
    `[seed-demo-personalisation] ${gapsWritten} gap row(s) and ${overridesWritten} override(s) written.\n` +
      `Distinct framings seeded: ${new Set(GAPS.map((g) => framingSignature(g.framing))).size} of 27.\n` +
      `Note: this content is hand-authored for the demo, not runtime-generated — the\n` +
      `deployed service still has no LLM provider configured, so it cannot produce more.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`[seed-demo-personalisation] failed: ${(err as Error).message}`);
    process.exit(1);
  });
