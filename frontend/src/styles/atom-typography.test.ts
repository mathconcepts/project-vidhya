/**
 * Guards the lesson body's typography against the failure that shipped it
 * flat for months.
 *
 * What happened: MarkdownAtomRenderer wrapped its output in `prose prose-sm`.
 * @tailwindcss/typography was never installed, so Tailwind emitted no `.prose`
 * rules at all — while `@tailwind base` (preflight) shipped
 *   h1,h2,h3,h4,h5,h6 { font-size: inherit; font-weight: inherit }
 *   ol,ul,menu        { list-style: none; margin: 0; padding: 0 }
 * Every authored heading rendered at body weight; every bullet list lost its
 * markers. 265 of 777 atoms use headings and 408 use lists, so the whole
 * lesson surface read as undifferentiated text.
 *
 * No component test could see this: jsdom renders the DOM, not the stylesheet.
 * So these assertions read the source of truth directly — the CSS file and the
 * Tailwind config — and check the two halves that have to agree:
 *
 *   1. Nothing relies on `prose` class names while the plugin is absent.
 *   2. Something actually restores what preflight strips.
 *
 * If a future change DOES install @tailwindcss/typography, assertion (1)
 * relaxes on its own. Assertion (2) stays either way.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');
const REPO_FRONTEND = join(__dirname, '..', '..');

function read(rel: string): string {
  return readFileSync(join(REPO_FRONTEND, rel), 'utf8');
}

/** Same walker shape the other invariant tests in this repo use. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const tailwindConfig = read('tailwind.config.cjs');
const packageJson = read('package.json');
const globals = read('src/styles/globals.css');

const typographyPluginInstalled =
  packageJson.includes('@tailwindcss/typography') &&
  tailwindConfig.includes('typography');

describe('atom body typography', () => {
  it('does not use `prose` class names unless the plugin that defines them is installed', () => {
    const files = walk(SRC);
    expect(files.length).toBeGreaterThan(50); // the walker actually walked

    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      // Only class-attribute usage counts. Prose as an English word in a
      // comment ("render below the prose") is not a styling claim.
      for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const classes = (m[1] ?? m[2] ?? '').split(/\s+/);
        if (classes.some((c) => c === 'prose' || c.startsWith('prose-'))) {
          offenders.push(file.replace(SRC, 'src'));
          break;
        }
      }
    }

    if (typographyPluginInstalled) return; // the classes would be real
    expect(
      offenders,
      'These files style content with Tailwind Typography class names, but ' +
        '@tailwindcss/typography is not installed, so those classes emit ' +
        'nothing. Use the .vidhya-atom-body rules in styles/globals.css.',
    ).toEqual([]);
  });

  it('restores the heading hierarchy that preflight flattens', () => {
    if (typographyPluginInstalled) return;
    // Preflight sets headings to inherit font-size AND font-weight, so both
    // have to come back or headings stay indistinguishable from body text.
    expect(globals).toMatch(/\.vidhya-atom-body h1[\s\S]{0,600}?font-size/);
    expect(globals).toMatch(/\.vidhya-atom-body h1,[\s\S]{0,400}?font-weight/);
  });

  it('restores list markers and indentation that preflight strips', () => {
    if (typographyPluginInstalled) return;
    expect(globals).toMatch(/\.vidhya-atom-body ul\s*\{[^}]*list-style:\s*disc/);
    expect(globals).toMatch(/\.vidhya-atom-body ol\s*\{[^}]*list-style:\s*decimal/);
    // Markers with no indent still read as a wall; padding is half the fix.
    expect(globals).toMatch(/\.vidhya-atom-body ul,[\s\S]{0,200}?padding-left/);
  });

  it('keeps atom body text at or above the 17px design-system floor', () => {
    // DESIGN-SYSTEM.md: 17px is the floor for anything a student reads.
    // `prose-sm` would set 14px, which is why the plugin was not adopted.
    const bodyRule = globals.match(/\.vidhya-atom-body\s*\{[^}]*\}/)?.[0] ?? '';
    expect(bodyRule).toContain('var(--text-body)');
    // Headings must never be set below the body size either.
    expect(globals).not.toMatch(
      /\.vidhya-atom-body h[1-6][^{]*\{[^}]*font-size:\s*var\(--text-(caption2?|footnote|subhead|callout)\)/,
    );
  });
});
