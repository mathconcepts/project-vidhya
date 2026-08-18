import { describe, it, expect, vi } from 'vitest';
import { dispatchPracticeItemJob, practiceItemSpecFromAtomSpec } from '../batch-dispatch';
import type { AtomSpec } from '../../batch/types';

function mcqAtomSpec(overrides: Partial<AtomSpec['prompt_vars']> = {}): AtomSpec {
  return {
    concept_id: 'eigenvalues',
    atom_type: 'practice_item',
    difficulty: 'medium',
    prompt_template_id: 'practice-item-v1',
    prompt_vars: { format: 'mcq', topic: 'linear-algebra', difficulty_frac: 0.35, ...overrides },
  };
}

function natAtomSpec(overrides: Partial<AtomSpec['prompt_vars']> = {}): AtomSpec {
  return {
    concept_id: 'determinants',
    atom_type: 'practice_item',
    difficulty: 'easy',
    prompt_template_id: 'practice-item-v1',
    prompt_vars: { format: 'nat', topic: 'linear-algebra', difficulty_frac: 0.25, ...overrides },
  };
}

function msqAtomSpec(overrides: Partial<AtomSpec['prompt_vars']> = {}): AtomSpec {
  return {
    concept_id: 'eigenvalues',
    atom_type: 'practice_item',
    difficulty: 'medium',
    prompt_template_id: 'practice-item-v1',
    prompt_vars: { format: 'msq', topic: 'linear-algebra', difficulty_frac: 0.5, ...overrides },
  };
}

const validMcqJson = JSON.stringify({
  question_text: 'Eigenvalues of A = [[4,1],[2,3]]?',
  correct_answer: '5 and 2',
  distractors: ['4 and 3', '7 and 10'],
  solution_steps: ['trace=7, det=10', 'factor'],
  difficulty: 0.4,
});

const validNatJson = JSON.stringify({
  question_text: 'det([[3,0],[0,2]])?',
  correct_answer: '6',
  distractors: [],
  solution_steps: ['3*2=6'],
  difficulty: 0.25,
});

const validMsqJson = JSON.stringify({
  question_text: 'Which are eigenvectors?',
  correct_answers: ['(1,1)', '(1,-1)'],
  distractors: ['(0,1)'],
  solution_steps: ['check'],
  difficulty: 0.5,
});

describe('practiceItemSpecFromAtomSpec', () => {
  it('reconstructs a spec from prompt_vars', () => {
    const spec = practiceItemSpecFromAtomSpec(mcqAtomSpec());
    expect(spec).toEqual({ concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.35, topic: 'linear-algebra' });
  });

  it('returns null when format is missing or invalid', () => {
    expect(practiceItemSpecFromAtomSpec(mcqAtomSpec({ format: 'essay' as never }))).toBeNull();
    const noFormat = mcqAtomSpec();
    delete (noFormat.prompt_vars as Record<string, unknown>).format;
    expect(practiceItemSpecFromAtomSpec(noFormat)).toBeNull();
  });

  it('returns null when difficulty_frac is missing or not a number', () => {
    expect(practiceItemSpecFromAtomSpec(mcqAtomSpec({ difficulty_frac: 'high' as never }))).toBeNull();
  });

  it('returns null when topic is missing', () => {
    const noTopic = mcqAtomSpec();
    delete (noTopic.prompt_vars as Record<string, unknown>).topic;
    expect(practiceItemSpecFromAtomSpec(noTopic)).toBeNull();
  });
});

describe('dispatchPracticeItemJob — refuses cleanly when the spec cannot be reconstructed', () => {
  it('refuses (not parse_failed) for an atom_spec with no practice-item shape', async () => {
    const plainAtom: AtomSpec = {
      concept_id: 'eigenvalues',
      atom_type: 'worked_example',
      difficulty: 'medium',
      prompt_template_id: 'x',
      prompt_vars: {},
    };
    const result = await dispatchPracticeItemJob(plainAtom, 'anything');
    expect(result.outcome).toBe('refused');
    expect(result.reason).toMatch(/does not carry a valid practice-item spec/);
  });
});

describe('dispatchPracticeItemJob — parse failures', () => {
  it('reports parse_failed on malformed JSON, without touching verification', async () => {
    const solveSecondary = vi.fn();
    const result = await dispatchPracticeItemJob(mcqAtomSpec(), '{ not json', { solveSecondary });
    expect(result.outcome).toBe('parse_failed');
    expect(solveSecondary).not.toHaveBeenCalled();
  });

  it('stringifies a non-string rawResult before parsing', async () => {
    // Malformed non-string input still gets a defined parse outcome, never a throw.
    const result = await dispatchPracticeItemJob(mcqAtomSpec(), { some: 'object' });
    expect(result.outcome).toBe('parse_failed');
  });
});

describe('dispatchPracticeItemJob — mcq/msq dual-model consensus', () => {
  it('refuses when deriveMarking cannot back the material, before any second-leg call', async () => {
    const thin = JSON.stringify({
      question_text: 'q', correct_answer: 'a', distractors: ['a'], solution_steps: ['s'], difficulty: 0.3,
    }); // distractor equals correct answer → deriveMarking refuses
    const solveSecondary = vi.fn();
    const result = await dispatchPracticeItemJob(mcqAtomSpec(), thin, { solveSecondary });
    expect(result.outcome).toBe('refused');
    expect(result.reason).toMatch(/deriveMarking refused/);
    expect(solveSecondary).not.toHaveBeenCalled();
  });

  it('refuses (fail-closed) when no solveSecondary is wired', async () => {
    const result = await dispatchPracticeItemJob(mcqAtomSpec(), validMcqJson, {});
    expect(result.outcome).toBe('refused');
    expect(result.reason).toMatch(/no second distinct-provider leg/);
  });

  it('writes when the second leg agrees', async () => {
    const solveSecondary = vi.fn().mockResolvedValue('5 and 2');
    const result = await dispatchPracticeItemJob(mcqAtomSpec(), validMcqJson, { solveSecondary });
    expect(result.outcome).toBe('written');
    expect(result.item!.question_type).toBe('mcq');
    expect(result.item!.verification_method).toBe('dual_model_consensus');
    // spec's difficulty, not the LLM's self-reported 0.4
    expect(result.item!.difficulty).toBe(0.35);
  });

  it('refuses when the second leg disagrees', async () => {
    const solveSecondary = vi.fn().mockResolvedValue('4 and 3');
    const result = await dispatchPracticeItemJob(mcqAtomSpec(), validMcqJson, { solveSecondary });
    expect(result.outcome).toBe('refused');
  });

  it('msq writes via set-comparison agreement', async () => {
    const solveSecondary = vi.fn().mockResolvedValue('(1,1) and (1,-1)');
    const result = await dispatchPracticeItemJob(msqAtomSpec(), validMsqJson, { solveSecondary });
    expect(result.outcome).toBe('written');
    expect(result.item!.question_type).toBe('msq');
    expect(result.item!.verification_method).toBe('dual_model_consensus');
  });
});

describe('dispatchPracticeItemJob — nat / wolfram', () => {
  // Adversarial-review fix: a STRUCTURAL absence of wolframCheck (nothing
  // wired a verifier for this run at all — today's reality, since
  // poller.ts never threads a third deps arg) must refuse TERMINALLY, not
  // pending_retry. pending_retry means "the orchestrator will not stamp
  // processed_at, try again next pass" — but no future pass ever populates
  // deps.wolframCheck on its own, so the old behavior polled a nat spec
  // forever and blocked the whole run from ever reaching 'complete'.
  it('refuses TERMINALLY (not pending_retry) when no wolframCheck is wired at all — naming the unwired dep', async () => {
    const result = await dispatchPracticeItemJob(natAtomSpec(), validNatJson, {});
    expect(result.outcome).toBe('refused');
    expect(result.reason).toMatch(/wolframCheck/);
  });

  it('holds for later on a wolfram-inconclusive result (dep IS wired, this ONE check was transient) — the T7 tri-state policy', async () => {
    const wolframCheck = vi.fn().mockResolvedValue({ status: 'inconclusive', wolfram_answer: null });
    const result = await dispatchPracticeItemJob(natAtomSpec(), validNatJson, { wolframCheck });
    expect(result.outcome).toBe('pending_retry');
    expect(result.reason).toMatch(/inconclusive/);
  });

  it('refuses on a genuine wolfram disagreement', async () => {
    const wolframCheck = vi.fn().mockResolvedValue({ status: 'failed', wolfram_answer: '7' });
    const result = await dispatchPracticeItemJob(natAtomSpec(), validNatJson, { wolframCheck });
    expect(result.outcome).toBe('refused');
    expect(result.reason).toMatch(/wolfram disagrees/);
  });

  it('writes with wolfram_verified when wolfram agrees', async () => {
    const wolframCheck = vi.fn().mockResolvedValue({ status: 'verified', wolfram_answer: '6' });
    const result = await dispatchPracticeItemJob(natAtomSpec(), validNatJson, { wolframCheck });
    expect(result.outcome).toBe('written');
    expect(result.item!.question_type).toBe('nat');
    expect(result.item!.verification_method).toBe('wolfram_verified');
  });

  it('passes the question text and the assembled correct_answer to wolframCheck', async () => {
    const wolframCheck = vi.fn().mockResolvedValue({ status: 'verified', wolfram_answer: '6' });
    await dispatchPracticeItemJob(natAtomSpec(), validNatJson, { wolframCheck });
    expect(wolframCheck).toHaveBeenCalledWith('det([[3,0],[0,2]])?', '6');
  });
});
