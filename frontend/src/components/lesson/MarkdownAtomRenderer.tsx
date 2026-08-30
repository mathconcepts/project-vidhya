/**
 * MarkdownAtomRenderer — content module v3 atom body renderer.
 *
 * Replaces the v2 `whitespace-pre-wrap` rendering with a real markdown
 * pipeline that handles:
 *   - $inline$ and $$display$$ math via KaTeX (remark-math + rehype-katex)
 *   - :::directive{attrs} blocks resolved through INTERACTIVE_PROVIDER_REGISTRY
 *   - :::interactive{ref=name} references the prefilled interactives library
 *   - Standard markdown (headings, lists, code, emphasis, links)
 *
 * Pipeline (per the eng review decision: parse in renderer with useMemo,
 * not in atom-loader — keeps loader format-agnostic):
 *
 *   markdown string
 *      ↓
 *   unified()
 *      ↓
 *   remark-parse → mdast
 *      ↓
 *   remark-math → math nodes
 *      ↓
 *   remark-directive → directive nodes
 *      ↓
 *   directiveTransform (custom) → maps directives to React component nodes
 *      ↓
 *   remark-rehype → hast
 *      ↓
 *   rehype-katex → KaTeX-rendered math
 *      ↓
 *   rehype-react → React tree
 *
 * On parse error: fall back to plain text rendering with a console.warn.
 * Atoms NEVER fail to render — the upfront-baseline contract from eng review.
 */

import { useMemo, lazy, Suspense } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeReact from 'rehype-react';
import { visit } from 'unist-util-visit';
import * as runtime from 'react/jsx-runtime';
// KaTeX CSS — preloaded core fonts in index.html, full stylesheet here.
import 'katex/dist/katex.min.css';

import { InteractiveBoundary, resolveInteractive, type DirectiveType } from './interactives/registry';
import { AnswerReveal } from './AnswerReveal';

// ─── Custom remark plugin: fold <details>/<summary> into a disclosure node
//
// Content authors hide answers with:
//
//     <details>
//     <summary>Answer</summary>
//
//     **A**. ...prose...
//
//     </details>
//
// CommonMark parses `<details>\n<summary>…</summary>` as ONE html node
// (an HTML block, terminated by the blank line), the answer prose as
// ordinary sibling paragraphs, and `</details>` as a SECOND html node.
// They are siblings, never nested. `remark-rehype` runs with
// `allowDangerousHtml: false`, so both html nodes are dropped and the
// answer paragraphs between them survive as visible body text — the
// answer leaked on all 200 retrieval atoms. See AnswerReveal.tsx for the
// full write-up and for why `rehype-raw` is the wrong fix here.
//
// This pass rewrites [open, ...body, close] into a single container node
// carrying the summary label, which `applyData` in mdast-util-to-hast maps
// to <vidhya-answer-reveal> via `data.hName`. The body children still go
// through remark-math/KaTeX normally. No raw HTML reaches the output.

const DETAILS_OPEN_RE = /<details(?:\s[^>]*)?>/i;
const DETAILS_CLOSE_RE = /<\/details\s*>/i;
const SUMMARY_RE = /<summary(?:\s[^>]*)?>([\s\S]*?)<\/summary\s*>/i;

/** Strips tags from the captured <summary> inner text. Labels are plain words
 *  ("Answer", "Solution") — anything else degrades to the default. */
function summaryLabel(html: string): string | undefined {
  const m = SUMMARY_RE.exec(html);
  if (!m) return undefined;
  return m[1].replace(/<[^>]*>/g, '').trim() || undefined;
}

function foldDetails(children: any[]): any[] {
  const out: any[] = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (Array.isArray(node?.children)) node.children = foldDetails(node.children);

    const isOpen = node?.type === 'html' && DETAILS_OPEN_RE.test(node.value ?? '');
    if (!isOpen) {
      out.push(node);
      continue;
    }

    // Walk forward to the matching close, counting depth so a nested
    // <details> inside an answer can't close the outer one early.
    let depth = 1;
    let end = -1;
    for (let j = i + 1; j < children.length; j++) {
      const v = children[j]?.type === 'html' ? (children[j].value ?? '') : '';
      if (!v) continue;
      if (DETAILS_OPEN_RE.test(v)) depth++;
      if (DETAILS_CLOSE_RE.test(v)) {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }

    // Unclosed <details>: treat the remaining siblings as the body rather
    // than dropping the marker and spilling the answer. An authoring typo
    // must fail closed (answer stays hidden), never open.
    const bodyEnd = end === -1 ? children.length : end;
    const body = children.slice(i + 1, bodyEnd).map((c: any) =>
      Array.isArray(c?.children) ? { ...c, children: foldDetails(c.children) } : c,
    );

    out.push({
      type: 'answerReveal',
      children: body,
      data: {
        hName: 'vidhya-answer-reveal',
        hProperties: { 'data-summary': summaryLabel(node.value ?? '') ?? 'Answer' },
      },
    });
    i = bodyEnd; // skip the body and the close marker
  }
  return out;
}

function remarkDetailsTransform() {
  return (tree: any) => {
    if (Array.isArray(tree.children)) tree.children = foldDetails(tree.children);
  };
}

// ─── Custom remark plugin: convert ::: directives to interactive React nodes
//
// remark-directive parses :::name{attr=value}...::: into nodes with type
// 'containerDirective' / 'leafDirective' / 'textDirective'. We rewrite them
// to hast div nodes carrying the original directive name + attrs as a JSON
// data attribute that the React renderer picks up.

const KNOWN_DIRECTIVES = new Set<string>([
  'math3d', 'parametric', 'vectorfield', 'surface',  // Tier 1 MathBox
  'slider', 'graph2d',                                // Tier 2 Desmos
  'cas', 'construct',                                 // Tier 3 GeoGebra
  'manim',                                            // Tier 0 pre-rendered
  'verify', 'wolfram-tool',                           // Server-side
  'quiz', 'recall',                                   // No fallback needed
  'interactive',                                      // Library reference
]);

function remarkDirectiveTransform() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {});
        const name = node.name as string;

        if (!KNOWN_DIRECTIVES.has(name)) {
          // Unknown directive — render as inline placeholder (don't throw)
          data.hName = 'span';
          data.hProperties = {
            'data-unknown-directive': name,
            style: 'font-size:12px;color:var(--orange)',
          };
          node.children = [{ type: 'text', value: `(unsupported directive: ${name})` }];
          return;
        }

        // Map to a custom <vidhya-interactive> hast element. The React
        // mapping below renders this as <InteractiveBoundary>.
        data.hName = 'vidhya-interactive';
        data.hProperties = {
          'data-directive': name,
          'data-attrs': JSON.stringify(node.attributes ?? {}),
        };
      }
    });
  };
}

interface InteractiveTagProps {
  'data-directive': string;
  'data-attrs': string;
  children?: React.ReactNode;
}

function VidhyaInteractive({ 'data-directive': directive, 'data-attrs': attrsJson }: InteractiveTagProps) {
  // Parse the attrs JSON. Defensive — corrupted attrs render as text.
  let attrs: Record<string, any> = {};
  try {
    attrs = JSON.parse(attrsJson);
  } catch {
    /* ignore */
  }
  return (
    <Suspense
      fallback={
        <div
          className="my-3 h-32 w-full rounded-md border animate-pulse"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)' }}
        />
      }
    >
      <InteractiveBoundary directive={directive as DirectiveType} attrs={attrs} />
    </Suspense>
  );
}

/**
 * Adapter for the <vidhya-answer-reveal> element emitted by
 * remarkDetailsTransform. rehype-react passes the hProperties through as
 * props, so the authored <summary> label arrives as `data-summary`.
 */
function VidhyaAnswerReveal(props: any) {
  return <AnswerReveal summary={props['data-summary']}>{props.children}</AnswerReveal>;
}

// rehype-react component map — KaTeX nodes are pure HTML so we don't
// need to override math elements. The vidhya-interactive custom tag
// gets routed to the boundary.
const rehypeReactOptions = {
  Fragment: (runtime as any).Fragment,
  jsx: (runtime as any).jsx,
  jsxs: (runtime as any).jsxs,
  components: {
    'vidhya-interactive': VidhyaInteractive as any,
    'vidhya-answer-reveal': VidhyaAnswerReveal as any,
  },
};

export interface MarkdownAtomRendererProps {
  /** The atom body markdown content (post-frontmatter). */
  content: string;
  /** Stable id used as memoization key. */
  atomId: string;
  /**
   * Opt-in modifier for atom types authored as "- **label**: detail" lists
   * (common_traps, exam_pattern) — renders each top-level bullet as a
   * hairline-separated label row instead of a flowing paragraph bullet. See
   * .vidhya-atom-body--structured in styles/globals.css. Omit for every
   * other atom type; default rendering is unchanged.
   */
  structured?: boolean;
  /**
   * Extra class(es) appended to the wrapper div, e.g. a tone modifier like
   * `vidhya-atom-body--hint`. `.vidhya-atom-body` sets its own explicit
   * `color`, so a parent's inline style can't override it by inheritance —
   * a class-level modifier is the only way to retint rendered markdown.
   */
  className?: string;
}

export function MarkdownAtomRenderer({ content, atomId, structured = false, className }: MarkdownAtomRendererProps) {
  const tree = useMemo(() => {
    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkDirective)
        .use(remarkDirectiveTransform)
        // Must run BEFORE remark-rehype: it consumes the raw <details> html
        // nodes that remark-rehype would otherwise drop on the floor.
        .use(remarkDetailsTransform)
        .use(remarkRehype, { allowDangerousHtml: false })
        .use(rehypeKatex, { strict: 'ignore', throwOnError: false } as any)
        .use(rehypeReact, rehypeReactOptions as any);
      const result = processor.processSync(content);
      return result.result as React.ReactNode;
    } catch (err) {
      console.warn(`[MarkdownAtomRenderer] parse failed for ${atomId}: ${(err as Error).message}`);
      // Plain-text fallback — atom always renders.
      return (
        <div className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-secondary)' }}>
          {content}
        </div>
      );
    }
  }, [content, atomId]);

  // `prose prose-sm` used to sit here. @tailwindcss/typography is not
  // installed (tailwind.config.cjs: `plugins: []`), so both were dead class
  // names — a production build emitted zero `.prose` rules while preflight
  // flattened every heading and stripped every list marker. The real styling
  // is `.vidhya-atom-body` in styles/globals.css, written against the Clarity
  // tokens. Do not re-add `prose-sm`: it sets a 14px body, under the 17px
  // floor for student-facing text.
  return (
    <div
      className={`max-w-none vidhya-atom-body${structured ? ' vidhya-atom-body--structured' : ''}${className ? ` ${className}` : ''}`}
    >
      {tree}
    </div>
  );
}

// ─── Helper for `:::interactive{ref=name}` library references
// Resolves the reference at render time. Exported for component reuse.
export { resolveInteractive };
