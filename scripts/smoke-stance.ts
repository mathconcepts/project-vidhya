#!/usr/bin/env npx tsx
/**
 * Production smoke: does the deployed build actually SERVE stance-adapted
 * bodies, and does it still serve the base body when it has no signal?
 *
 * ## Why this exists
 *
 * v4.43.0 shipped 606 authored stance variants across all 101 concepts, and a
 * guard bug meant no real student could reach one of them. Every gate was
 * green throughout: `ci:variant-agreement` checked the files against each
 * other, `ci:content-integrity` checked their ids, the atom-render regression
 * mounted all 1,486 of them, and the readiness report counted them on disk and
 * truthfully said 101/101. Every one of those asks whether the content EXISTS.
 * None asks whether a student RECEIVES it.
 *
 * That is the gap this closes, and it can only be closed against a deployed
 * URL: the two failure modes it catches — content absent from the image, and
 * the composer no longer swapping bodies — both look perfect in a local
 * checkout.
 *
 * ## What it cannot check, stated so nobody assumes otherwise
 *
 * The stored-state path (`readStudentModel` → `deriveFraming`) needs a
 * `student_model` row, and CI has no write access to the production database
 * and should not have one. So this exercises the composer through an explicit
 * snapshot, which proves the machinery and the content are live, and leaves
 * the stored-state lookup covered by the unit tests in
 * `src/api/__tests__/lesson-stance-from-stored-model.test.ts`.
 *
 * Concretely: this would NOT have caught the v4.43.0 guard bug, because that
 * bug spared the explicit-snapshot path. It WOULD catch the variants going
 * missing from the image, or the composer silently ceasing to swap — and it
 * is the only check in the repo that looks at a real deployment at all.
 *
 * ## Usage
 *
 *   npx tsx scripts/smoke-stance.ts https://vidhya-demo.onrender.com
 */

/** One probe's outcome, in the shape the assertions read. */
export interface StanceProbe {
  label: string;
  http: number;
  atom_count: number;
  /** Distinct `served_stance` values across the returned atoms. */
  stances: string[];
}

export interface StanceVerdict {
  ok: boolean;
  failures: string[];
  notes: string[];
}

/**
 * The assertions, as a pure function over probe results.
 *
 * Pure so it is testable without a network, and because the repo already
 * learned this the hard way: `scripts/wait-for-http.sh` was four lines inline
 * in the workflow, was wrong in exactly the case it existed for, and went
 * green for weeks. Logic that decides pass/fail belongs somewhere a test can
 * reach it.
 */
export function evaluateStance(probes: {
  unconfident: StanceProbe;
  confident: StanceProbe;
  noSignal: StanceProbe;
}): StanceVerdict {
  const failures: string[] = [];
  const notes: string[] = [];

  for (const p of [probes.unconfident, probes.confident, probes.noSignal]) {
    // Matched against an allowlist rather than `!== 500`: a 000 from an
    // unreachable host is also "not a 500", and reporting a network failure
    // as a pass is the exact shape of false green this file is here to avoid.
    if (p.http !== 200) {
      failures.push(`${p.label}: expected HTTP 200, got ${p.http || 'no response'}`);
      continue;
    }
    if (p.atom_count === 0) {
      failures.push(`${p.label}: composed 0 atoms — the concept's content is not in this image`);
    }
  }
  if (failures.length > 0) return { ok: false, failures, notes };

  // An unconfident learner must read the authored unconfident body. If this
  // fails, either the *-shaken.md files are missing from the image or the
  // composer stopped swapping — both invisible to every local gate.
  if (!probes.unconfident.stances.includes('shaken')) {
    failures.push(
      `unconfident learner was served ${describe(probes.unconfident.stances)} — expected the authored "shaken" body`,
    );
  }
  if (!probes.confident.stances.includes('assured')) {
    failures.push(
      `confident learner was served ${describe(probes.confident.stances)} — expected the authored "assured" body`,
    );
  }

  // The safety direction, and the one worth failing loudly over: absent
  // signal must never be read as "this student is struggling". A student the
  // system knows nothing about reads the base text.
  if (probes.noSignal.stances.length > 0) {
    failures.push(
      `a learner with no signal was served ${describe(probes.noSignal.stances)} — absent signal must serve the base body`,
    );
  }

  if (failures.length === 0) {
    notes.push(
      `unconfident → ${describe(probes.unconfident.stances)}, ` +
        `confident → ${describe(probes.confident.stances)}, ` +
        `no signal → base body`,
    );
  }
  return { ok: failures.length === 0, failures, notes };
}

function describe(stances: string[]): string {
  return stances.length === 0 ? 'the base body' : stances.map((s) => `"${s}"`).join(' + ');
}

/** The concept probed. Linear Algebra is the topic with the deepest content. */
export const SMOKE_CONCEPT = 'eigenvalues';

async function probe(baseUrl: string, label: string, student: Record<string, unknown>): Promise<StanceProbe> {
  const body = JSON.stringify({
    concept_id: SMOKE_CONCEPT,
    session_id: student.session_id,
    student,
  });
  try {
    const res = await fetch(`${baseUrl}/api/lesson/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status !== 200) return { label, http: res.status, atom_count: 0, stances: [] };
    const json = (await res.json()) as { atoms?: Array<{ served_stance?: string }> };
    const atoms = json.atoms ?? [];
    const stances = [
      ...new Set(atoms.map((a) => a.served_stance).filter((s): s is string => typeof s === 'string')),
    ].sort();
    return { label, http: 200, atom_count: atoms.length, stances };
  } catch (err) {
    console.error(`[smoke-stance] ${label} request failed: ${(err as Error).message}`);
    return { label, http: 0, atom_count: 0, stances: [] };
  }
}

async function main(): Promise<void> {
  const baseUrl = (process.argv[2] || 'https://vidhya-demo.onrender.com').replace(/\/+$/, '');
  console.log(`[smoke-stance] ${baseUrl} — concept "${SMOKE_CONCEPT}"`);

  // Session ids are namespaced and disposable. Composition is a read path
  // (`readStudentModel`, never get-or-create), so these probes create no
  // `student_model` row — asserted directly in the unit tests.
  const probes = {
    unconfident: await probe(baseUrl, 'unconfident learner', {
      session_id: 'prod-smoke-stance-shaken',
      motivation_state: 'anxious',
      mastery_by_concept: { [SMOKE_CONCEPT]: 0.15 },
    }),
    confident: await probe(baseUrl, 'confident learner', {
      session_id: 'prod-smoke-stance-assured',
      motivation_state: 'driven',
      mastery_by_concept: { [SMOKE_CONCEPT]: 0.9 },
    }),
    noSignal: await probe(baseUrl, 'learner with no signal', {
      session_id: 'prod-smoke-stance-none',
    }),
  };

  for (const p of Object.values(probes)) {
    console.log(`  ${p.label}: HTTP ${p.http || 'none'}, ${p.atom_count} atoms, served ${describe(p.stances)}`);
  }

  const verdict = evaluateStance(probes);
  for (const n of verdict.notes) console.log(`[smoke-stance] ${n}`);
  for (const f of verdict.failures) console.log(`::error::${f}`);

  if (!verdict.ok) {
    console.error('[smoke-stance] FAILED — the deployed build is not serving stance-adapted content');
    process.exit(1);
  }
  console.log('[smoke-stance] OK — authored variants are in the image and the composer is swapping them');
}

// Only run when invoked directly, so the assertions can be imported by tests.
if (process.argv[1] && process.argv[1].endsWith('smoke-stance.ts')) {
  main().catch((err) => {
    console.error(`[smoke-stance] crashed: ${(err as Error).message}`);
    process.exit(1);
  });
}
