// @ts-nocheck
/**
 * GATE Engineering Mathematics — exam adapter.
 *
 * Follows the EXAMS.md recipe: 2 files (this + the sample), 1 line
 * in src/exams/adapters/index.ts. Zero core code changes.
 *
 * GATE is the system's first POSTGRADUATE-level exam — the four
 * existing adapters (BITSAT, JEE Main, UGEE, NEET) are all
 * undergraduate entrance exams. The level field exercises the
 * postgraduate branch of the Exam.level union for the first time.
 *
 * GATE-specific shape worth flagging:
 *   - 3 question formats not 2 (MCQ + MSQ + NAT vs JEE Main's MCQ + NAT).
 *     MSQ (multiple-select) is genuinely distinct: must select EXACTLY
 *     all correct options; partial credit is NOT given. The sample's
 *     mock questions exercise all three formats.
 *   - The GenerationSection contract has `kind: 'mock_question'` only,
 *     so for LLM-driven generation the adapter requests `mock_question`
 *     and the snapshot's question objects carry the kind/format
 *     internally. Adapter doesn't need to teach the LLM generator
 *     about MSQ specifically — the generator emits standard mock
 *     questions, and the operator's content-ops team massages MSQ-
 *     format ones in via the content-studio path.
 *   - Linear algebra carries 25-30% of GATE EM weight (vs ~15% in
 *     JEE Main), so priority_concepts leads with linear-algebra.
 *   - No exam-day-notes injection (unlike NEET's negative-marking
 *     emphasis or BITSAT's calculator notes); GATE's quirks are
 *     captured in the strategies layer.
 */

import { registerExamAdapter, type ExamAdapter } from '../../exam-builder/registry';
import {
  GATE_MATH_EXAM, GATE_MATH_MOCK_EXAM, GATE_MATH_STRATEGIES,
} from '../../samples/gate-mathematics';

const adapter: ExamAdapter = {
  exam_id: GATE_MATH_EXAM.id,
  exam_code: GATE_MATH_EXAM.code,
  exam_name: GATE_MATH_EXAM.name,
  level: GATE_MATH_EXAM.level,
  description: GATE_MATH_EXAM.description,
  adapter_version: '1.0.0',

  loadBaseContent() {
    return {
      exam: GATE_MATH_EXAM,
      mocks: [GATE_MATH_MOCK_EXAM],
      // GATE relies on the shared lesson bank — no exam-specific
      // lessons. The strategies layer carries the GATE-distinctive
      // content (MSQ scoring, calculator triage, linear-algebra weight).
      lessons: [],
      strategies: GATE_MATH_STRATEGIES.strategies.map(s => ({
        title: s.title, content: s.content, evidence: s.evidence,
      })),
    };
  },

  getSyllabusTopicIds() {
    return GATE_MATH_EXAM.syllabus_topic_ids;
  },

  defaultGenerationSections(opts) {
    // GATE EM has 13 questions split ~5 MCQ + 5 MSQ + 3 NAT. For LLM
    // generation we focus on the priority concepts (linear algebra,
    // calculus, DE, numerical methods, transforms) and emit all three
    // difficulties — GATE prep needs both easy confidence-builders and
    // hard discriminator questions.
    const topics = opts?.topic_ids ?? GATE_MATH_EXAM.priority_concepts;
    const count = opts?.count_per_topic ?? 3;
    const sections: Array<{ kind: 'mock_question'; topic_id: string; difficulty: string }> = [];
    for (const topic_id of topics) {
      for (let i = 0; i < count; i++) {
        sections.push({
          kind: 'mock_question',
          topic_id,
          difficulty: i === 0 ? 'easy' : i === 1 ? 'medium' : 'hard',
        });
      }
    }
    return sections;
  },

  postProcessSnapshot(snapshot) {
    // Dedupe questions by id. GATE-specific: also surface a brief
    // marking-scheme reminder in snapshot metadata so the UI can show
    // "MSQ: must select ALL correct, no partial credit" as a tooltip
    // when the candidate first encounters an MSQ.
    const seen = new Set<string>();
    for (const mock of snapshot.mocks ?? []) {
      mock.questions = (mock.questions ?? []).filter((q: any) => {
        if (!q.id) return true;
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
    }
    snapshot._exam_day_notes = {
      calculator: 'Virtual on-screen scientific calculator (no programmable, no graphing)',
      negative_marking:
        'MCQ: −1/3 per wrong on 1-mark, −2/3 on 2-mark. MSQ + NAT: zero negative marking.',
      msq_rule:
        'MSQ scoring is all-or-nothing — select EXACTLY all correct options, no partial credit',
      pacing_target:
        'Full paper 65 Q in 180 min ≈ 2.7 min/Q. EM section ~13 Q ≈ 35 min target.',
    };
    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
