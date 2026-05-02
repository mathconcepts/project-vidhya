// @ts-nocheck
/**
 * tts-generator.ts — TTS narration for atom bodies (§4.15 Phase C).
 *
 * Extracts a narration script from atom markdown (stripping math, directives,
 * frontmatter), POSTs to the configured TTS provider (default OpenAI tts-1),
 * returns the resulting MP3 buffer.
 *
 * Cost: ~$0.015 per 1k chars at OpenAI tts-1. ~$0.005 per 300-word atom.
 *
 * Gating contract:
 *   - Disabled by default (TTS_PROVIDER unset). Module returns null.
 *   - Set TTS_PROVIDER=openai + OPENAI_API_KEY to enable.
 *   - Future: 'elevenlabs', 'disabled' (explicit off).
 *
 * Atom-type gating (per CEO review): narration only valuable on atom types
 * where read-aloud aids comprehension. v1 ships intuition only. formal_definition
 * was dropped per subagent's "low-value vs editorial" finding.
 */

const NARRATION_ATOM_TYPES = new Set(['intuition']);
const MAX_SCRIPT_CHARS = 1500; // ~250 words; bounds TTS cost per atom
const MIN_SCRIPT_CHARS = 40;   // skip too-short bodies; not worth narrating

export interface TtsResult {
  buffer: Buffer;
  duration_ms: number;
  script: string;
  voice: string;
  cost_usd_estimate: number;
}

/**
 * Whether this atom_type is eligible for TTS narration.
 */
export function shouldNarrate(atom_type: string): boolean {
  return NARRATION_ATOM_TYPES.has(atom_type);
}

/**
 * Strip markdown to a plain narration script. Removes:
 *   - frontmatter (---...---)
 *   - LaTeX math ($...$ and $$...$$) — replaced with a brief "[math expression]"
 *     marker so the narrator says something rather than just skipping
 *   - :::directive blocks (interactives, manim, verify, etc.)
 *   - Code fences (```...```)
 *   - Markdown formatting (**bold**, *italic*, [links](url), # headers)
 *
 * Caps at MAX_SCRIPT_CHARS so we don't blow TTS budget on long atoms.
 */
export function extractNarrationScript(content: string): string {
  let s = content;
  // Frontmatter
  s = s.replace(/^---[\s\S]*?---\s*/m, '');
  // Display math (multi-line)
  s = s.replace(/\$\$[\s\S]*?\$\$/g, ' [math expression] ');
  // Inline math
  s = s.replace(/\$[^\n$]+\$/g, ' [math expression] ');
  // :::directive blocks (container)
  s = s.replace(/:::[\s\S]+?:::/g, ' ');
  // Single-line :::directive
  s = s.replace(/^:::[a-z-]+\{[^}]*\}\s*$/gm, ' ');
  // Code fences
  s = s.replace(/```[\s\S]*?```/g, ' ');
  // Headers (keep text, drop hashes)
  s = s.replace(/^#+\s+/gm, '');
  // Bold/italic markers (keep text)
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');
  // Link syntax: keep visible text only
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Inline code (keep text)
  s = s.replace(/`([^`]+)`/g, '$1');
  // Collapse whitespace
  s = s.replace(/\n{2,}/g, '. ').replace(/\s+/g, ' ').trim();
  // Cap length
  if (s.length > MAX_SCRIPT_CHARS) {
    s = s.slice(0, MAX_SCRIPT_CHARS).replace(/\s+\S*$/, '') + '.';
  }
  return s;
}

/**
 * Generate narration for a single atom body. Returns null when:
 *   - TTS provider is disabled
 *   - The script is below the min-length threshold
 *   - The provider call fails (graceful — atom ships without audio)
 */
export async function generateNarration(
  atom_type: string,
  content: string,
): Promise<TtsResult | null> {
  if (!shouldNarrate(atom_type)) return null;
  const provider = (process.env.TTS_PROVIDER ?? 'disabled').toLowerCase();
  if (provider === 'disabled' || provider === '') return null;

  const script = extractNarrationScript(content);
  if (script.length < MIN_SCRIPT_CHARS) return null;

  if (provider === 'openai') return generateOpenAi(script);

  console.warn(`[tts-generator] unknown TTS_PROVIDER: ${provider}`);
  return null;
}

async function generateOpenAi(script: string): Promise<TtsResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[tts-generator] OPENAI_API_KEY not set');
    return null;
  }
  const voice = process.env.TTS_VOICE ?? 'alloy';
  const model = process.env.TTS_MODEL ?? 'tts-1';
  const t0 = Date.now();
  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        input: script,
        response_format: 'mp3',
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.warn(`[tts-generator] OpenAI ${r.status}: ${err.slice(0, 200)}`);
      return null;
    }
    const arrayBuf = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const duration_ms = Date.now() - t0;
    // tts-1 pricing: $15 per 1M chars = $0.000015/char.
    const cost_usd_estimate = script.length * 0.000015;
    return { buffer, duration_ms, script, voice, cost_usd_estimate };
  } catch (err) {
    console.warn(`[tts-generator] OpenAI call failed: ${(err as Error).message}`);
    return null;
  }
}
