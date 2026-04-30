/**
 * Marketing samples (v4.0) — static MCQs surfaced on MarketingLanding for
 * the anonymous try-one-problem moment.
 *
 * Architecturally these are the frontend mirror of `marketing_samples` on
 * each exam adapter. Routing through the adapter is the long-term path
 * (one source of truth across email, social, marketing). For v4.0 launch
 * we ship hardcoded GATE Engineering Mathematics samples here; subsequent
 * exams will populate from /api/exams/:id/marketing-samples (TODO).
 *
 * Constraints:
 *   - Static: no API call, no auth, no DB. Visible to anonymous visitors.
 *   - 3 problems per exam (easy / medium / hard).
 *   - All math hand-verified at write time.
 */

export interface MarketingSample {
  id: string;
  exam_id: string;
  exam_name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  statement: string;
  /** KaTeX-renderable LaTeX. Optional — plain text problems set this to undefined. */
  latex?: string;
  options: Array<{ key: string; text: string }>;
  correct_option: string;
  /** One-line explanation shown after answer. Keep under 240 chars. */
  explanation: string;
}

export const MARKETING_SAMPLES: MarketingSample[] = [
  {
    id: 'gate-ma-eigen-easy',
    exam_id: 'gate-ma',
    exam_name: 'GATE Engineering Mathematics',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    statement: 'The eigenvalues of the matrix [[2, 0], [0, 3]] are:',
    options: [
      { key: 'A', text: '2 and 3' },
      { key: 'B', text: '0 and 5' },
      { key: 'C', text: '1 and 6' },
      { key: 'D', text: '2 and 5' },
    ],
    correct_option: 'A',
    explanation:
      'For a diagonal matrix, the eigenvalues are simply the diagonal entries: 2 and 3.',
  },
  {
    id: 'gate-ma-prob-medium',
    exam_id: 'gate-ma',
    exam_name: 'GATE Engineering Mathematics',
    difficulty: 'medium',
    topic: 'Probability',
    statement:
      'A fair coin is tossed 3 times. The probability of getting at least 2 heads is:',
    options: [
      { key: 'A', text: '1/4' },
      { key: 'B', text: '3/8' },
      { key: 'C', text: '1/2' },
      { key: 'D', text: '5/8' },
    ],
    correct_option: 'C',
    explanation:
      'Outcomes with ≥2 heads: HHH, HHT, HTH, THH = 4 out of 8 total. P = 4/8 = 1/2.',
  },
  {
    id: 'gate-ma-calc-hard',
    exam_id: 'gate-ma',
    exam_name: 'GATE Engineering Mathematics',
    difficulty: 'hard',
    topic: 'Calculus',
    statement:
      'The value of the integral ∫₀^π sin²(x) dx is:',
    options: [
      { key: 'A', text: '0' },
      { key: 'B', text: 'π/4' },
      { key: 'C', text: 'π/2' },
      { key: 'D', text: 'π' },
    ],
    correct_option: 'C',
    explanation:
      'Using sin²(x) = (1 − cos 2x)/2: ∫₀^π (1 − cos 2x)/2 dx = [x/2 − sin(2x)/4]₀^π = π/2.',
  },
];

/**
 * Return a sample for the given exam. v4.0 launch: GATE only. Future
 * exams will return their adapter-defined `marketing_samples` array.
 */
export function getMarketingSamples(examId = 'gate-ma'): MarketingSample[] {
  return MARKETING_SAMPLES.filter(s => s.exam_id === examId);
}
