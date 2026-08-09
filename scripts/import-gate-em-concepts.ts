// @ts-nocheck
/**
 * import-gate-em-concepts.ts
 *
 * Reads the real content from data/courses/gate-em/concepts/{concept-id}/
 * and writes it into frontend/public/data/explainers.json, replacing all
 * placeholder entries with real markdown-sourced content.
 *
 * Run:
 *   npx tsx scripts/import-gate-em-concepts.ts
 *   npx tsx scripts/build-bundle.ts   (rebuilds content-bundle.json)
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CONCEPTS_DIR = path.join(ROOT, 'data/courses/gate-em/concepts');
const EXPLAINERS_PATH = path.join(ROOT, 'frontend/public/data/explainers.json');

// ── Markdown section parser ───────────────────────────────────────────────────

function parseSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = md.split('\n');
  let current: string | null = null;
  const buf: string[] = [];

  function flush() {
    if (current !== null) sections[current] = buf.join('\n').trim();
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      flush();
      current = h2[1].trim();
      buf.length = 0;
    } else if (current !== null) {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

// ── Extract worked examples from MCQ explanations ────────────────────────────

function mcqsToWorkedExamples(questions: any[]): any[] {
  return questions.map((q) => ({
    difficulty: q.difficulty ?? 'medium',
    problem: q.question,
    solution: q.explanation,
    answer: q.options?.[q.correct_answer] ?? q.correct_answer,
  }));
}

// ── Extract common misconceptions from tips "Common Student Errors" ──────────

function parseMisconceptions(errorSection: string): any[] {
  if (!errorSection) return [];
  const bullets = errorSection
    .split('\n')
    .filter((l) => l.trim().startsWith('-'));
  return bullets.map((b, i) => {
    const content = b.replace(/^-\s*/, '').trim();
    // Bold text before colon is the misconception label
    const boldMatch = content.match(/^\*\*(.+?)\*\*[:\s]+(.+)/);
    if (boldMatch) {
      return {
        id: `mc-${String(i + 1).padStart(2, '0')}`,
        description: boldMatch[1].trim(),
        corrective: boldMatch[2].trim(),
      };
    }
    return {
      id: `mc-${String(i + 1).padStart(2, '0')}`,
      description: content.slice(0, 80),
      corrective: content,
    };
  });
}

// ── Build exam tip from explainer GATE relevance + tips pattern ───────────────

function buildExamTip(gateRelevance: string, gatePattern: string): string {
  const parts: string[] = [];
  if (gateRelevance) {
    // Strip leading "> " blockquote markers
    const cleaned = gateRelevance
      .split('\n')
      .map((l) => l.replace(/^>\s*/, '').trim())
      .filter(Boolean)
      .join(' ');
    parts.push(cleaned);
  }
  if (gatePattern) {
    parts.push(gatePattern.trim());
  }
  return parts.join('\n\n') || 'Practice problems matching GATE frequency.';
}

// ── Parse topic/label/gate_frequency from explainer.md header line ─────────

function parseExplainerHeader(md: string): { label: string; topic: string; gate_frequency: string } {
  // Line: > GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.3
  const headerLine = md.split('\n').find((l) => l.startsWith('>')) ?? '';
  const parts = headerLine.replace(/^>\s*/, '').split('|').map((s) => s.trim());
  const topic = (parts[1] ?? '').toLowerCase().replace(/\s+/g, '-') || 'unknown';
  const freqMatch = (parts[2] ?? '').match(/(high|medium|low)/i);
  const gate_frequency = freqMatch ? freqMatch[1].toLowerCase() : 'medium';
  // Label from H1
  const h1 = md.split('\n').find((l) => l.startsWith('# '));
  const label = h1 ? h1.replace(/^#\s+/, '').trim() : '';
  return { label, topic, gate_frequency };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== Importing GATE-EM concept files into explainers.json ===\n');

  // Load existing explainers.json to preserve the wrapper structure
  const existing = JSON.parse(fs.readFileSync(EXPLAINERS_PATH, 'utf-8'));

  const conceptDirs = fs
    .readdirSync(CONCEPTS_DIR)
    .filter((d) => fs.statSync(path.join(CONCEPTS_DIR, d)).isDirectory())
    .sort();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const byConceptOut: Record<string, any> = { ...existing.by_concept };

  for (const conceptId of conceptDirs) {
    const dir = path.join(CONCEPTS_DIR, conceptId);
    const explainerPath = path.join(dir, 'explainer.md');
    const mcqsPath = path.join(dir, 'mcqs.json');
    const tipsPath = path.join(dir, 'tips.md');

    if (!fs.existsSync(explainerPath)) {
      errors.push(`MISSING explainer.md: ${conceptId}`);
      skipped++;
      continue;
    }

    try {
      // Parse explainer.md
      const explainerMd = fs.readFileSync(explainerPath, 'utf-8');
      const sections = parseSections(explainerMd);
      const header = parseExplainerHeader(explainerMd);

      const coreDefinition =
        sections['Core Definition'] ??
        sections['Definition'] ??
        '';
      const intuition = sections['Intuition First'] ?? '';
      const whatHappens =
        sections['What Happens (Worked Example)'] ??
        sections['What Happens'] ??
        sections['Worked Example'] ??
        '';
      const whyItWorks = sections['Why It Works'] ?? '';
      const gateRelevance =
        sections['GATE MA Relevance'] ??
        sections['GATE Relevance'] ??
        '';

      // Parse tips.md
      let misconceptions: any[] = [];
      let gatePattern = '';
      if (fs.existsSync(tipsPath)) {
        const tipsMd = fs.readFileSync(tipsPath, 'utf-8');
        const tipSections = parseSections(tipsMd);
        misconceptions = parseMisconceptions(
          tipSections['Common Student Errors'] ??
          tipSections['Common Errors'] ??
          ''
        );
        gatePattern =
          tipSections['GATE Question Pattern'] ??
          tipSections['GATE Pattern Recognition'] ??
          '';
      }

      // Parse mcqs.json for worked examples
      let workedExamples: any[] = [];
      if (fs.existsSync(mcqsPath)) {
        const mcqData = JSON.parse(fs.readFileSync(mcqsPath, 'utf-8'));
        // Use medium+hard questions as worked examples (more instructive)
        const instructive = (mcqData.questions ?? []).filter(
          (q: any) => q.difficulty === 'medium' || q.difficulty === 'hard'
        );
        workedExamples = mcqsToWorkedExamples(
          instructive.length > 0 ? instructive.slice(0, 2) : (mcqData.questions ?? []).slice(0, 2)
        );
      }

      // Build deep_explanation from full explainer sections
      const deepParts = [intuition, coreDefinition, whatHappens, whyItWorks]
        .map((s) => s.trim())
        .filter(Boolean);
      const deepExplanation = deepParts.join('\n\n');

      // Strip LaTeX and markdown from canonical_definition for plain-text use
      const canonicalDefinition = coreDefinition
        .split('\n')
        .slice(0, 5)
        .join(' ')
        .replace(/\$\$[\s\S]*?\$\$/g, '')
        .replace(/\$[^$]+\$/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#+\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);

      // Fall back to existing placeholder for topic/label/gate_frequency if header parse fails
      const existingEntry = existing.by_concept?.[conceptId] ?? {};

      byConceptOut[conceptId] = {
        concept_id: conceptId,
        topic: header.topic !== 'unknown' ? header.topic : (existingEntry.topic ?? 'unknown'),
        label: header.label || existingEntry.label || conceptId,
        gate_frequency: header.gate_frequency || existingEntry.gate_frequency || 'medium',
        canonical_definition: canonicalDefinition || existingEntry.canonical_definition || '',
        deep_explanation: deepExplanation,
        worked_examples: workedExamples,
        common_misconceptions: misconceptions,
        prerequisite_reminders: existingEntry.prerequisite_reminders ?? [],
        exam_tip: buildExamTip(gateRelevance, gatePattern),
        generated_at: new Date().toISOString(),
        model: 'gate-em-concept-files',
      };

      imported++;
      console.log(`  ✓ ${conceptId}`);
    } catch (err: any) {
      errors.push(`ERROR ${conceptId}: ${err.message}`);
      skipped++;
    }
  }

  // Write updated explainers.json
  const output = {
    version: existing.version ?? '1.0',
    generated_at: new Date().toISOString(),
    total: Object.keys(byConceptOut).length,
    by_concept: byConceptOut,
  };
  fs.writeFileSync(EXPLAINERS_PATH, JSON.stringify(output, null, 2));

  console.log(`\n=== Done ===`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped:  ${skipped}`);
  if (errors.length) {
    console.log('\nErrors:');
    errors.forEach((e) => console.log(' ', e));
  }
  console.log(`\nNext step: npx tsx scripts/build-bundle.ts`);
}

main();
