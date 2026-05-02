/**
 * extractGifSceneDescription tests (§4.15 v4.11.0 template wiring).
 *
 * The orchestrator parses fenced ```gif-scene\n{json}\n``` blocks from
 * atom content. This test pins down the contract for the template
 * authors: what shapes parse, what shapes don't.
 */
import { describe, it, expect } from 'vitest';
import { extractGifSceneDescription } from '../orchestrator';

describe('extractGifSceneDescription', () => {
  it('returns null when no gif-scene block is present', () => {
    expect(extractGifSceneDescription('Plain markdown body.')).toBeNull();
  });

  it('parses a parametric scene block', () => {
    const body = `Some intuition about waves.

\`\`\`gif-scene
{"type":"parametric","expression":"sin(x + t)","x_range":[-3,3],"y_range":[-2,2],"t_range":[0,6.28],"frames":30,"fps":12}
\`\`\`

Trailing prose.`;
    const r = extractGifSceneDescription(body);
    expect(r).not.toBeNull();
    expect((r as any).type).toBe('parametric');
    expect((r as any).expression).toBe('sin(x + t)');
    expect((r as any).frames).toBe(30);
  });

  it('parses a function-trace scene block', () => {
    const body = `Tangent line at x=1.

\`\`\`gif-scene
{"type":"function-trace","expression":"x^2","x_range":[-2,2],"y_range":[0,4],"frames":30,"fps":12}
\`\`\``;
    const r = extractGifSceneDescription(body);
    expect((r as any).type).toBe('function-trace');
  });

  it('returns null for an unknown scene type', () => {
    const body = '```gif-scene\n{"type":"vector-field","expression":"x"}\n```';
    expect(extractGifSceneDescription(body)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    const body = '```gif-scene\n{"type":parametric}\n```';
    expect(extractGifSceneDescription(body)).toBeNull();
  });

  it('returns null when the fence has no closing newline', () => {
    const body = '```gif-scene{"type":"parametric"}```';
    expect(extractGifSceneDescription(body)).toBeNull();
  });

  it('finds the first scene block when multiple are present', () => {
    const body = `\`\`\`gif-scene
{"type":"parametric","expression":"sin(x)"}
\`\`\`

\`\`\`gif-scene
{"type":"function-trace","expression":"x^2"}
\`\`\``;
    const r = extractGifSceneDescription(body);
    expect((r as any).type).toBe('parametric');
  });
});
