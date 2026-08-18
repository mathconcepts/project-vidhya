#!/usr/bin/env npx tsx
/**
 * check-content-integrity — CI gate over the authored content module.
 *
 * Two failure classes, both found in shipped content on 2026-08-15 and both
 * invisible to every existing check because they are *prose* problems, not
 * schema problems:
 *
 *  1. LEAKED SCAFFOLDING. The generator emits several atoms in one response;
 *     the next file's header bleeds into the tail of the previous one. Atoms
 *     shipped ending in `## FILE 2: visual-analogy.md` / `**Path:**`, which a
 *     student reads as garbage at the bottom of the lesson. 43 files were
 *     affected.
 *
 *  2. SHIFTED ATOMS. The same mis-split can push whole atoms into the wrong
 *     file. z-transform's intuition.md contained the visual-analogy atom and
 *     visual-analogy.md contained a worked example, so the concept had no
 *     intuition atom at all and nothing noticed.
 *
 * A third leak class joined the gate later, found in rank-nullity's
 * worked-example.md: the AUTHORING TOOL'S OWN error report — "**Error
 * encountered:** The Write tool permission handler is misconfigured on this
 * system..." — rendered at the bottom of a worked example, in the lesson, to
 * a student. Distinct from both above: not scaffolding bleeding across atoms,
 * not a sign-off addressed to the operator, but the tool talking about
 * itself. See check 1c.
 *
 * A sweep for that phrasing turned up FOUR more worked-example.md files
 * (taylor-laurent, integration-substitution, discrete-distributions,
 * counting-principles, conformal-mapping — five, not four) carrying
 * near-miss variants neither check 1b nor 1c caught: "ready to be written to
 * the file paths" / "...the concept directory" / "...their respective file
 * paths" (1b only knew "...to disk" and "...to their respective paths", not
 * "file paths"), "Fix the permission handler configuration..." and "Due to
 * permission handler configuration issues with the Write tool..." (1c only
 * knew "permission handler IS MISCONFIGURED", and required "Write tool"
 * *before* the failure word — these have "permission handler" first), and
 * "I am unable to directly create these files on disk" (a negated-failure
 * construction 1c had no pattern for at all). Both checks are now anchored
 * on the shorter, order-independent phrases actually shared across all these
 * variants — "ready to be written to", bare "permission handler", "unable to
 * ... create these files" — rather than the longer literal sentences that
 * only matched the first file found.
 *
 * Check 2 compares each atom's declared `id` against its filename. The variant
 * form is legal and must stay legal: `worked-example-product-rule.md` declaring
 * `derivatives-basic.worked-example.product-rule` is correct — dots in the id
 * correspond to hyphens in the filename. Underscore/hyphen drift in the
 * atom-type word (`visual_analogy` vs `visual-analogy`) is tolerated too; it is
 * cosmetic and pervasive, and failing on it would block the build on 147
 * harmless files rather than the 2 real bugs.
 *
 * Usage: npx tsx scripts/check-content-integrity.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
/**
 * The corpus to check. Overridable by argument so the gate can be pointed at a
 * mutated copy — a gate nobody has watched fail is a gate nobody knows works,
 * and the only honest way to know is to break something on purpose and confirm
 * it exits non-zero. See src/__tests__/gate-mutation.test.ts.
 */
const CONCEPTS = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'modules/project-vidhya-content/concepts');

/**
 * Headers the generator leaves behind. Deliberately anchored to line start and
 * requiring the colon/period so ordinary prose ("see File 2 of the appendix")
 * cannot trip it.
 */
const SCAFFOLD_RE =
  /^\s*(?:#{1,3}\s*)?(?:\*\*)?(?:FILE|File|Atom|PATH|Path)\s*\d*\s*[:.]/;

interface Problem {
  file: string;
  line: number | null;
  message: string;
}

const problems: Problem[] = [];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const norm = (s: string) => s.replace(/_/g, '-').trim().toLowerCase();

function checkFile(file: string): void {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // ---- 1. leaked scaffolding -------------------------------------------
  lines.forEach((line, i) => {
    if (SCAFFOLD_RE.test(line)) {
      problems.push({
        file: rel,
        line: i + 1,
        message: `leaked authoring scaffolding: ${JSON.stringify(line.trim().slice(0, 60))}`,
      });
    }
  });

  // ---- 1b. leaked generation artifacts ---------------------------------
  //
  // The generator's own bookkeeping was reaching students. 29 atoms carried a
  // trailing `DONE:<concept>` marker, and three carried a sentence addressed
  // to whoever ran the job — "Copy these three files to their respective
  // paths. The content is ready for Vidhya's curriculum system." — rendered at
  // the bottom of a worked example, in the lesson, to a student revising for
  // an exam.
  //
  // Distinct from check 1: scaffolding leaks are authoring placeholders inside
  // the body, these are the model talking to the operator after it. Both are
  // "text that was never meant to be read by a student", which is why they
  // live in the same gate.
  lines.forEach((line, i) => {
    const t = line.trim();
    if (/^\*{0,2}DONE:[a-z0-9-]+\*{0,2}$/.test(t)) {
      problems.push({
        file: rel,
        line: i + 1,
        message: `leaked generation marker: ${JSON.stringify(t)} — the generator's bookkeeping, not lesson content`,
      });
    }
    if (
      /(copy these .{0,30}files to their respective paths|written to their respective paths|ready to be written to\b|content is ready for)/i.test(
        t,
      )
    ) {
      problems.push({
        file: rel,
        line: i + 1,
        message: `generation sign-off addressed to the operator, not the student: ${JSON.stringify(t.slice(0, 60))}`,
      });
    }
  });

  // ---- 1c. leaked tool/agent error messages -----------------------------
  //
  // A third flavor, distinct from both above: not scaffolding left inside
  // the body, not a sign-off addressed to the operator, but the AUTHORING
  // TOOL'S OWN error report about itself. Found in rank-nullity's
  // worked-example.md: "**Error encountered:** The Write tool permission
  // handler is misconfigured on this system. The atoms above are ready to
  // be written to the file paths specified. To complete this task, you'll
  // need to create these three markdown files...", rendered in a worked
  // example, in the lesson, to a student.
  //
  // Anchored to the specific vocabulary of a tool/agent failure report
  // (bare "permission handler", the capitalised "Write tool" paired loosely
  // with a failure word in EITHER order, an explicit "error encountered"
  // label, a self-reported inability to create files) rather than bare
  // words like "error" or "write" alone, which appear constantly in
  // legitimate math prose ("round-off error", "standard error", "we write
  // the matrix as..."). A false positive here would refuse real content; a
  // loose word match would refuse it on every stats atom in the corpus.
  //
  // "permission handler" alone is deliberately the broadest anchor here: a
  // sweep found it phrased as "...is misconfigured", "Fix the permission
  // handler configuration...", and "Due to permission handler configuration
  // issues with the Write tool..." — three different sentence shapes, only
  // the first of which named "misconfigured" or put "Write tool" first. The
  // two-word phrase itself is unambiguous authoring-tool jargon; no GATE
  // topic (including probability/combinatorics, which is the nearest
  // adjacent vocabulary — "permutation", not "permission") has a legitimate
  // reason to use it.
  lines.forEach((line, i) => {
    const t = line.trim();
    if (
      /(\*{0,2}error encountered\*{0,2}\s*:|\bpermission handler\b|\bwrite tool\b[^.]{0,60}\b(misconfigured|permission|handler)\b|\b(misconfigured|permission|handler)\b[^.]{0,60}\bwrite tool\b|\bunable to (directly )?create (these|the) (files|atoms)\b|you'll need to create these .{0,30}(markdown )?files|these files should be created at)/i.test(
        t,
      )
    ) {
      problems.push({
        file: rel,
        line: i + 1,
        message: `leaked tool/agent error message: ${JSON.stringify(t.slice(0, 60))} — the authoring tool's own failure report, not lesson content`,
      });
    }
  });

  // ---- 2. unbalanced code fences ---------------------------------------
  const fences = lines.filter((l) => l.trim().startsWith('```')).length;
  if (fences % 2 !== 0) {
    problems.push({
      file: rel,
      line: null,
      message: `unbalanced code fences (${fences}) — an unclosed block swallows the rest of the atom`,
    });
  }

  // ---- 3. declared id must match filename -------------------------------
  const idMatch = text.match(/^id:\s*(\S+)/m);
  if (!idMatch) return; // not every markdown file under concepts/ is an atom
  const declared = norm(idMatch[1]).replace(/["']/g, '');
  const concept = norm(path.basename(path.dirname(path.dirname(file))));
  const filename = norm(path.basename(file, '.md'));

  const rest = declared.startsWith(`${concept}.`)
    ? declared.slice(concept.length + 1)
    : declared;
  // Dots in the id are hyphens in the filename (the variant-file convention).
  if (rest.replace(/\./g, '-') !== filename) {
    const typeMatch = text.match(/^atom_type:\s*(\S+)/m);
    const atomType = typeMatch ? norm(typeMatch[1]) : null;
    // Tolerate pure atom-type word drift, fail on a genuinely different atom.
    if (atomType !== filename) {
      problems.push({
        file: rel,
        line: null,
        message:
          `declared id "${idMatch[1]}" does not match its filename ` +
          `(expected "${concept}.${filename}") — this is how a whole atom ends up in the wrong file`,
      });
    }
  }
}

function main(): void {
  const files = walk(CONCEPTS);
  if (files.length === 0) {
    console.error(`check-content-integrity: no content found at ${CONCEPTS}`);
    process.exit(1);
  }
  for (const f of files) checkFile(f);

  if (problems.length > 0) {
    console.error(`\n✗ content integrity: ${problems.length} problem(s)\n`);
    for (const p of problems) {
      console.error(`  ${p.file}${p.line ? `:${p.line}` : ''}\n      ${p.message}`);
    }
    console.error('');
    process.exit(1);
  }
  console.log(`✓ content integrity: ${files.length} atom file(s) clean`);
}

main();
