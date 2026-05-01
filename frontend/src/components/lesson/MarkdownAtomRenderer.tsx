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
            className: 'text-xs text-amber-400',
            'data-unknown-directive': name,
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
        <div className="my-3 h-32 w-full rounded-md bg-surface-900 border border-surface-800 animate-pulse" />
      }
    >
      <InteractiveBoundary directive={directive as DirectiveType} attrs={attrs} />
    </Suspense>
  );
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
  },
};

export interface MarkdownAtomRendererProps {
  /** The atom body markdown content (post-frontmatter). */
  content: string;
  /** Stable id used as memoization key. */
  atomId: string;
}

export function MarkdownAtomRenderer({ content, atomId }: MarkdownAtomRendererProps) {
  const tree = useMemo(() => {
    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkDirective)
        .use(remarkDirectiveTransform)
        .use(remarkRehype, { allowDangerousHtml: false })
        .use(rehypeKatex, { strict: 'ignore', throwOnError: false } as any)
        .use(rehypeReact, rehypeReactOptions as any);
      const result = processor.processSync(content);
      return result.result as React.ReactNode;
    } catch (err) {
      console.warn(`[MarkdownAtomRenderer] parse failed for ${atomId}: ${(err as Error).message}`);
      // Plain-text fallback — atom always renders.
      return <div className="whitespace-pre-wrap text-sm text-surface-300">{content}</div>;
    }
  }, [content, atomId]);

  return <div className="prose prose-invert prose-sm max-w-none vidhya-atom-body">{tree}</div>;
}

// ─── Helper for `:::interactive{ref=name}` library references
// Resolves the reference at render time. Exported for component reuse.
export { resolveInteractive };
