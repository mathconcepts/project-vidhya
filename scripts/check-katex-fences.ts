#!/usr/bin/env npx tsx
/**
 * check-katex-fences — CI gate: every atom's math renders through the real
 * pipeline (remark-math + rehype-katex, identical config to
 * frontend/src/components/lesson/MarkdownAtomRenderer.tsx) without a KaTeX
 * parse error.
 *
 * Found and fixed on 2026-08-29: 26 atom files across 15 concepts had a
 * `$$...$$` display-math block whose opening or closing `$$` was glued to
 * adjacent content on the same line (`$$\begin{align}` or `...= 10$$`)
 * instead of alone on its own line. remark-math's block-math tokenizer
 * requires the fence characters to stand alone, the same rule fenced code
 * blocks follow — violate it and the tokenizer doesn't recognize the block
 * at all, so it keeps scanning for the *next* `$$` it can find, however far
 * away, and swallows every character in between (prose, later math, list
 * markers) into one KaTeX error span. rehype-katex's `throwOnError: false`
 * then renders that whole span as inline plain text in KaTeX's own error
 * color — no crash, no console error a developer would see, just a student
 * staring at raw LaTeX source in red on their phone. Nothing caught this
 * until a live screenshot did.
 *
 * This gate runs the exact same processor against every atom body so the
 * next instance of the same authoring mistake fails in CI, not in a
 * student's hands.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';

const CONCEPTS = path.resolve(process.cwd(), 'modules/project-vidhya-content/concepts');

interface Problem {
  file: string;
  message: string;
}

const problems: Problem[] = [];

function findKatexErrors(node: any, found: string[]): void {
  if (!node || typeof node !== 'object') return;
  const classes = node.properties?.className;
  if (node.type === 'element' && Array.isArray(classes) && classes.includes('katex-error')) {
    found.push(String(node.properties?.title ?? 'katex-error').slice(0, 160));
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) findKatexErrors(child, found);
  }
}

function main(): void {
  if (!fs.existsSync(CONCEPTS)) {
    console.error(`check-katex-fences: no content found at ${CONCEPTS}`);
    process.exit(1);
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeKatex, { strict: 'ignore', throwOnError: false } as any);

  let checked = 0;
  const concepts = fs.readdirSync(CONCEPTS, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const concept of concepts) {
    const atomsDir = path.join(CONCEPTS, concept.name, 'atoms');
    if (!fs.existsSync(atomsDir)) continue;
    for (const file of fs.readdirSync(atomsDir).filter((f) => f.endsWith('.md'))) {
      checked++;
      const rel = path.relative(process.cwd(), path.join(atomsDir, file));
      const raw = fs.readFileSync(path.join(atomsDir, file), 'utf8');
      const { content } = matter(raw);
      const found: string[] = [];
      try {
        const tree = processor.runSync(processor.parse(content));
        findKatexErrors(tree, found);
      } catch (err) {
        found.push(`processor threw: ${(err as Error).message}`);
      }
      for (const message of found) problems.push({ file: rel, message });
    }
  }

  if (checked === 0) {
    console.error('check-katex-fences: no atom files found');
    process.exit(1);
  }

  if (problems.length > 0) {
    console.error(`\n✗ katex-fences: ${problems.length} problem(s) across ${checked} atom file(s)\n`);
    for (const p of problems) {
      console.error(`  ${p.file}\n      ${p.message}`);
    }
    console.error(
      '\n  Fix: put the opening and closing $$ alone on their own line, e.g.\n' +
        '    $$\n    \\begin{align} ... \\end{align}\n    $$\n' +
        '  not `$$\\begin{align}` or `...\\end{align}$$` glued to content.\n',
    );
    process.exit(1);
  }
  console.log(`✓ katex-fences: ${checked} atom file(s) render clean`);
}

main();
