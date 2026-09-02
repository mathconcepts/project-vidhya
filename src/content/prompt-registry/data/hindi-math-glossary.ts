/**
 * src/content/prompt-registry/data/hindi-math-glossary.ts
 *
 * Curated English -> Hindi glossary for modifier.hindi_glossary
 * (src/content/prompt-registry/resources/modifiers.ts). Scoped to Linear
 * Algebra vocabulary first (TODOS.md's "check Linear Algebra first, then
 * do the rest" plan) — other topics' terms are a separate, later addition
 * to this same file, not a new mechanism.
 *
 * PROVENANCE AND CONFIDENCE — read before trusting this as authoritative.
 * Terms follow standard NCERT Hindi-medium mathematics vocabulary
 * (Devanagari + a romanized reading) — the reference a GATE aspirant who
 * studied in Hindi medium would actually recognize. This list has NOT been
 * reviewed by a native Hindi-medium mathematics educator. Treat it the
 * same way this repo treats every other unverified claim (evidence_level:
 * design_hypothesis, not directly_reviewed): usable as a first pass,
 * gated behind the 'pilot' approval_state (never 'released') until a
 * qualified reviewer signs off. GATE itself is conducted in English, so
 * every entry is deliberately "Hindi term (English term)" — a bridging
 * aid, not a replacement of the English vocabulary the exam and this
 * platform's base content both use.
 */

export interface HindiGlossaryEntry {
  english: string;
  hindi_devanagari: string;
  hindi_romanized: string;
}

export const LINEAR_ALGEBRA_HINDI_GLOSSARY: readonly HindiGlossaryEntry[] = [
  { english: 'matrix', hindi_devanagari: 'आव्यूह', hindi_romanized: 'āvyūh' },
  { english: 'vector', hindi_devanagari: 'सदिश', hindi_romanized: 'sadish' },
  { english: 'scalar', hindi_devanagari: 'अदिश', hindi_romanized: 'adish' },
  { english: 'determinant', hindi_devanagari: 'सारणिक', hindi_romanized: 'sāraṇik' },
  { english: 'inverse', hindi_devanagari: 'व्युत्क्रम', hindi_romanized: 'vyutkram' },
  { english: 'transpose', hindi_devanagari: 'परिवर्त', hindi_romanized: 'parivart' },
  { english: 'identity matrix', hindi_devanagari: 'तत्समक आव्यूह', hindi_romanized: 'tatsamak āvyūh' },
  { english: 'rank', hindi_devanagari: 'कोटि', hindi_romanized: 'koti' },
  { english: 'null space', hindi_devanagari: 'शून्य समष्टि', hindi_romanized: 'shoonya samashti' },
  { english: 'basis', hindi_devanagari: 'आधार', hindi_romanized: 'ādhār' },
  { english: 'dimension', hindi_devanagari: 'विमा', hindi_romanized: 'vimā' },
  { english: 'linear combination', hindi_devanagari: 'रैखिक संयोजन', hindi_romanized: 'raikhik sanyojan' },
  { english: 'linearly independent', hindi_devanagari: 'रैखिक स्वतंत्र', hindi_romanized: 'raikhik swatantra' },
  { english: 'linearly dependent', hindi_devanagari: 'रैखिक निर्भर', hindi_romanized: 'raikhik nirbhar' },
  { english: 'span', hindi_devanagari: 'विस्तार', hindi_romanized: 'vistār' },
  { english: 'subspace', hindi_devanagari: 'उपसमष्टि', hindi_romanized: 'upasamashti' },
  { english: 'eigenvalue', hindi_devanagari: 'आइगेन मान', hindi_romanized: 'eigen maan' },
  { english: 'eigenvector', hindi_devanagari: 'आइगेन सदिश', hindi_romanized: 'eigen sadish' },
  { english: 'characteristic polynomial', hindi_devanagari: 'अभिलाक्षणिक बहुपद', hindi_romanized: 'abhilākṣaṇik bahupad' },
  { english: 'diagonal matrix', hindi_devanagari: 'विकर्ण आव्यूह', hindi_romanized: 'vikarṇ āvyūh' },
  { english: 'diagonalizable', hindi_devanagari: 'विकर्णीय', hindi_romanized: 'vikarṇīya' },
  { english: 'symmetric matrix', hindi_devanagari: 'सममित आव्यूह', hindi_romanized: 'samamit āvyūh' },
  { english: 'orthogonal', hindi_devanagari: 'लंबकोणीय', hindi_romanized: 'lambakoṇīya' },
  { english: 'orthonormal', hindi_devanagari: 'लांबिक-मानीकृत', hindi_romanized: 'lāmbik-mānīkṛt' },
  { english: 'norm', hindi_devanagari: 'मानक', hindi_romanized: 'mānak' },
  { english: 'singular matrix', hindi_devanagari: 'अव्युत्क्रमणीय आव्यूह', hindi_romanized: 'avyutkramaṇīya āvyūh' },
  { english: 'non-singular', hindi_devanagari: 'व्युत्क्रमणीय', hindi_romanized: 'vyutkramaṇīya' },
  { english: 'system of linear equations', hindi_devanagari: 'रैखिक समीकरण निकाय', hindi_romanized: 'raikhik samīkaraṇ nikāy' },
  { english: 'augmented matrix', hindi_devanagari: 'संवर्धित आव्यूह', hindi_romanized: 'sanvardhit āvyūh' },
  { english: 'transformation', hindi_devanagari: 'रूपांतरण', hindi_romanized: 'rūpāntaraṇ' },
] as const;

/** Case-insensitive lookup, longest-match-first so "eigenvalue" doesn't get pre-empted by a shorter unrelated hit. */
export function lookupHindiGloss(term: string): HindiGlossaryEntry | null {
  const needle = term.trim().toLowerCase();
  const sorted = [...LINEAR_ALGEBRA_HINDI_GLOSSARY].sort((a, b) => b.english.length - a.english.length);
  return sorted.find((e) => e.english.toLowerCase() === needle) ?? null;
}

/** Formats an entry as the inline gloss text a prompt or a rendered gloss would show. */
export function formatHindiGloss(entry: HindiGlossaryEntry): string {
  return `${entry.hindi_devanagari} (${entry.hindi_romanized})`;
}
