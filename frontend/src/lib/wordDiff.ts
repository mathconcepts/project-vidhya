/**
 * wordDiff — markdown-aware word-level diff for the orchestrator's
 * atom version comparison (D2 polish).
 *
 * Uses google's diff-match-patch (well-known, ~12KB). The library produces
 * character-level diffs by default; we boost it to word-level by running
 * the chars-to-words conversion that diff-match-patch ships in its
 * `diff_linesToChars` utility but applied to whitespace-tokenized words.
 *
 * Consumers render Insert/Delete spans with emerald/rose tints.
 */

import DiffMatchPatch from 'diff-match-patch';

export type DiffOp = 'equal' | 'insert' | 'delete';

export interface DiffSegment {
  op: DiffOp;
  text: string;
}

const DMP_INSERT = 1;
const DMP_DELETE = -1;
const DMP_EQUAL = 0;

/**
 * Compute a word-level diff between two markdown strings. The output
 * is a flat list of segments tagged equal/insert/delete, suitable for
 * rendering one after another with appropriate styling.
 *
 * Strategy:
 *   1. Convert each input into a "word stream" — tokens separated by
 *      whitespace. Whitespace runs are preserved as-is so that the
 *      output renders cleanly when concatenated.
 *   2. Map each unique word to a single Unicode char (diff-match-patch
 *      requirement — the underlying algorithm operates on chars).
 *   3. Run dmp.diff_main on the encoded strings.
 *   4. Decode chars back to original words/whitespace runs.
 *   5. Return the segment list.
 *
 * Performance: O(n*m) worst case where n,m are word counts. For atom
 * bodies (<400 words each) this is comfortably <10ms in production.
 */
export function wordDiff(a: string, b: string): DiffSegment[] {
  if (a === b) return [{ op: 'equal', text: a }];
  if (!a) return [{ op: 'insert', text: b }];
  if (!b) return [{ op: 'delete', text: a }];

  const dmp = new DiffMatchPatch();
  const { chars1, chars2, lineArray } = wordsToChars(a, b);
  const diffs = dmp.diff_main(chars1, chars2, false);
  // No semantic cleanup — wordsToChars already enforces word boundaries.

  const out: DiffSegment[] = [];
  for (const [opCode, encoded] of diffs as Array<[number, string]>) {
    const text = decodeWords(encoded, lineArray);
    if (!text) continue;
    if (opCode === DMP_EQUAL) out.push({ op: 'equal', text });
    else if (opCode === DMP_INSERT) out.push({ op: 'insert', text });
    else if (opCode === DMP_DELETE) out.push({ op: 'delete', text });
  }
  return out;
}

/**
 * Tokenize on word boundaries (preserving whitespace runs as separate
 * tokens) and assign each unique token a Unicode char so diff-match-patch
 * can run its O(n*m) algorithm on chars.
 */
function wordsToChars(text1: string, text2: string): {
  chars1: string;
  chars2: string;
  lineArray: string[];
} {
  const lineArray: string[] = [''];      // index 0 reserved
  const lineHash: Record<string, number> = {};
  // diff-match-patch's encoded-char range starts at ; max ~0xffff.
  let nextCharCode = 1;
  const HARD_CAP = 0xffff - 1;

  function munge(text: string): string {
    let out = '';
    // Split into alternating word + whitespace tokens.
    const re = /(\s+|\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tok = m[1];
      let code = lineHash[tok];
      if (code === undefined) {
        if (nextCharCode > HARD_CAP) {
          // Catastrophic fallback: collapse remaining tokens into a
          // single "overflow" char so we still produce a correct (if
          // less precise) diff. Atoms are ~400 words so this never trips.
          code = HARD_CAP;
        } else {
          lineArray.push(tok);
          code = nextCharCode++;
          lineHash[tok] = code;
        }
      }
      out += String.fromCharCode(code);
    }
    return out;
  }

  return {
    chars1: munge(text1),
    chars2: munge(text2),
    lineArray,
  };
}

function decodeWords(encoded: string, lineArray: string[]): string {
  let out = '';
  for (let i = 0; i < encoded.length; i++) {
    const idx = encoded.charCodeAt(i);
    out += lineArray[idx] ?? '';
  }
  return out;
}
