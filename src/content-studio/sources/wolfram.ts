// @ts-nocheck
/**
 * src/content-studio/sources/wolfram.ts
 *
 * Source adapter: Wolfram Alpha.
 *
 * Useful for problem statements with verified numerical answers, or
 * symbolic results (derivatives, integrals, eigenvalues, etc.). Less
 * useful for prose explainers — Wolfram returns concise output, not
 * teaching narrative.
 *
 * Returns null when:
 *   - No Wolfram key configured (the wolframSolve service handles
 *     this internally and resolves to a result with no answer)
 *   - The query returns no answer
 *   - The service times out (we set 8s)
 *
 * The body wraps Wolfram's answer in a minimal markdown structure
 * so the admin gets a coherent draft to review. The `wolfram_query`
 * is recorded in the body so the admin can audit what was asked.
 */

import { wolframSolve } from '../../services/wolfram-service';
import type { GenerationRequest } from '../types';
import type { AdapterResult } from './uploads';

export async function tryWolframSource(
  req: GenerationRequest,
): Promise<AdapterResult | null> {
  const query = (req.wolfram_query ?? `explain ${req.title}`).trim();
  if (!query) return null;

  let result;
  try {
    result = await wolframSolve(query, { timeout_ms: 8000 });
  } catch (e: any) {
    return null;
  }
  if (!result || !result.answer) return null;

  // Compose the draft body
  const lines: string[] = [];
  lines.push(`# ${req.title}`);
  lines.push('');
  lines.push(`> Wolfram Alpha query: \`${query}\``);
  lines.push('');
  lines.push('## Result');
  lines.push('');
  lines.push(result.answer);
  if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
    lines.push('');
    lines.push('## Steps');
    lines.push('');
    for (const step of result.steps) {
      lines.push(`- ${step}`);
    }
  }
  lines.push('');
  lines.push('## Notes for reviewer');
  lines.push('');
  lines.push(
    'This draft is a Wolfram-verified result. The admin should add ' +
    'pedagogical context (intuition, prerequisites, common pitfalls) ' +
    'before approving for the library.',
  );

  return {
    body: lines.join('\n'),
    detail: `wolfram answer for "${query.slice(0, 60)}"`,
  };
}
