/**
 * src/api/admin-walkthrough-routes.ts
 *
 *   GET /api/admin/walkthrough
 *
 * The itinerary behind the admin "Demo walkthrough" button: an ordered list of
 * stops that, walked end to end, shows every capability the product can
 * currently demonstrate.
 *
 * ── Why this is computed and not a written-down list ────────────────────
 *
 * A hand-maintained tour is a list of claims that rots. Tonight's failures
 * were all the same species: something asserted about a system rather than
 * measured from it. So every stop here is derived from the artefacts it
 * depends on — the rails config, the atoms on disk, the widget blocks inside
 * them, the persona files — and a stop whose dependency is missing is marked
 * `available: false` with the reason, never silently dropped and never shown
 * as if it would work.
 *
 * The operator standing in front of someone needs to know which stops are
 * real BEFORE they start walking, not when a screen comes up empty.
 *
 * ── What "all possibilities" means concretely ───────────────────────────
 *
 * Three axes, and the itinerary covers each:
 *
 *   - **Widget kinds** — simulation, manipulable, guided_walkthrough. Every
 *     kind that exists in the corpus must appear at least once.
 *   - **Learner stance** — the same concept opened as an unconfident student
 *     and as a confident one, which is the only way the authored variant axis
 *     is visible at all.
 *   - **Surfaces** — the graded item, the bring-your-own-problem step, and the
 *     admin views that show what the system knows about its own content.
 *
 * Counts only, no student data: this route reads config and files, never a
 * student table.
 */

import fs from 'fs';
import path from 'path';
import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { loadConceptAtoms, listConceptIds } from '../content/atom-loader';
import { VARIANT_STANCES } from '../content/stance-variants';
import { loadPersona } from '../scenarios/persona-loader';
import { STRUGGLING_STATES, THRIVING_STATES } from '../teaching/motivation-source';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

/** Persona signal the client re-uses to open a route AS someone. */
export interface StopPersona {
  id: string;
  display_name: string;
  mastery_by_concept: Record<string, number>;
  recent_errors: string[];
  motivation_state?: string;
  representation_mode?: string;
}

export interface WalkthroughStop {
  id: string;
  /** One line naming what the operator should do. */
  title: string;
  /** What to actually look at once the screen loads. */
  look_for: string;
  /** Why this stop is in the tour — the claim it demonstrates. */
  proves: string;
  route: string;
  /** Set this persona before navigating; null means sign-out-neutral. */
  persona: StopPersona | null;
  /** False when the artefact this stop needs is not present. */
  available: boolean;
  /** Populated only when available is false. */
  unavailable_reason?: string;
}

export interface WalkthroughItinerary {
  stops: WalkthroughStop[];
  /** Widget kinds found in the corpus, and whether the tour reaches each. */
  coverage: {
    widget_kinds_in_corpus: string[];
    widget_kinds_covered: string[];
    stances_covered: string[];
    available_stops: number;
    total_stops: number;
  };
  generated_at: string;
}

const RAILS_PATH = path.join(process.cwd(), 'config', 'demo-rails.json');

/** The widget kind authored in an atom body, or null. */
export function widgetKindOf(body: string): string | null {
  const m = body.match(/```interactive-spec\s*\n([\s\S]*?)```/);
  if (!m) return null;
  try {
    const kind = (JSON.parse(m[1]) as { kind?: string }).kind;
    return typeof kind === 'string' ? kind : null;
  } catch {
    // An unparseable block renders as nothing, so for tour purposes it is not
    // a widget. Reporting it as one is how an operator ends up presenting a
    // blank rectangle.
    return null;
  }
}

/**
 * The name a rail uses for an atom, derived from the atom's id.
 *
 * Rails name atoms by file stem — `hook`, `intuition`, `worked-example`. Most
 * atom ids are `<concept>.<stem>`, but the demo corpus carries legacy ids that
 * join with a hyphen instead (`orthogonality-worked-example`), and one that
 * uses an underscore (`determinants.worked_example`).
 *
 * Splitting on '.' alone silently returned the whole id for the hyphenated
 * ones, so their widgets went uncounted and the tour under-reported what a
 * lesson would actually show. Strip whichever separator the id uses, then
 * normalise underscores.
 */
export function railAtomKey(conceptId: string, atomId: string): string {
  let rest = atomId;
  for (const sep of ['.', '-']) {
    const prefix = `${conceptId}${sep}`;
    if (rest.startsWith(prefix)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }
  return rest.replace(/_/g, '-');
}

function personaSignal(id: string): StopPersona | null {
  try {
    const p = loadPersona(id);
    return {
      id: p.id,
      display_name: p.display_name,
      mastery_by_concept: p.seed.initial_mastery,
      recent_errors: p.seed.recent_misconceptions,
      motivation_state: p.seed.motivation_state,
      representation_mode: p.seed.representation_mode,
    };
  } catch {
    return null;
  }
}

/**
 * Build the itinerary.
 *
 * Exported and dependency-injected so the ordering and the availability rules
 * are testable without a filesystem or a running server.
 */
export function buildItinerary(input: {
  /** concept_id → atom_type-ish key → widget kind (null when none). */
  conceptWidgets: Record<string, Record<string, string | null>>;
  /** concept_id → atom key → which stances have an authored body. */
  conceptStances: Record<string, Record<string, string[]>>;
  rails: Array<{ id: string; title: string; persona: string; rail: any }>;
  personas: Record<string, StopPersona | null>;
  now: string;
}): WalkthroughItinerary {
  const stops: WalkthroughStop[] = [];
  const { conceptWidgets, conceptStances, rails, personas } = input;

  const kindsInCorpus = new Set<string>();
  for (const byAtom of Object.values(conceptWidgets)) {
    for (const k of Object.values(byAtom)) if (k) kindsInCorpus.add(k);
  }

  stops.push({
    id: 'deck',
    title: 'Open the journey deck',
    look_for: 'Four journeys, each naming a real student rather than a feature.',
    proves: 'The tour is the product, not a slideshow.',
    route: '/demo',
    persona: null,
    available: rails.length > 0,
    unavailable_reason: rails.length === 0 ? 'config/demo-rails.json has no cards' : undefined,
  });

  // One stop per atom rail, walking the concept that carries the most widget
  // kinds first — the operator's first impression should be the richest screen
  // available, not whichever card happens to be listed first.
  const atomRails = rails.filter((c) => c.rail?.kind === 'atoms');
  const scored = atomRails
    .map((c) => {
      const widgets = conceptWidgets[c.rail.concept_id] ?? {};
      const kinds = new Set(
        (c.rail.atoms ?? []).map((a: string) => widgets[a]).filter(Boolean) as string[],
      );
      return { card: c, kinds };
    })
    .sort((a, b) => b.kinds.size - a.kinds.size);

  for (const { card, kinds } of scored) {
    const conceptId = card.rail.concept_id;
    stops.push({
      id: `lesson:${card.id}`,
      title: `${card.title}`,
      look_for:
        kinds.size > 0
          ? `${kinds.size} interactive kind${kinds.size === 1 ? '' : 's'} across the lesson: ${[...kinds].join(', ')}.`
          : 'Prose only — this rail has no interactive widgets.',
      proves:
        kinds.size >= 3
          ? 'Every interactive kind the product has, in a single lesson.'
          : 'The lesson composes for this student from their own mastery.',
      route: `/lesson/${conceptId}`,
      persona: personas[card.persona] ?? null,
      available: kinds.size > 0,
      unavailable_reason:
        kinds.size === 0 ? `no atom on this rail carries an interactive block` : undefined,
    });

    if (card.rail.practice_item_id) {
      stops.push({
        id: `practice:${card.id}`,
        title: 'Answer the graded question',
        look_for: 'GATE marking, graded server-side. Getting it wrong is the better demo.',
        proves: 'The mark is real, not a mock — the answer key never reaches the browser.',
        route: `/attempt/${card.rail.practice_item_id}`,
        persona: personas[card.persona] ?? null,
        available: true,
      });
    }
    if (card.rail.invite_doubt) {
      stops.push({
        id: `doubt:${card.id}`,
        title: 'Hand over your own problem',
        look_for: 'It says up front that nothing is solved on screen.',
        proves: 'The product does not fake an answer it cannot produce offline.',
        route: '/demo/doubt',
        persona: personas[card.persona] ?? null,
        available: true,
      });
    }
  }

  // The stance pair: the same concept, twice, as two different students. This
  // is the only way the authored variant axis is visible, and it needs the
  // same route twice — which is why the walkthrough tracks position by index
  // rather than by route.
  const pairConcept = scored[0]?.card?.rail?.concept_id;
  const stancesHere = pairConcept ? (conceptStances[pairConcept] ?? {}) : {};
  const covered = new Set<string>();
  for (const list of Object.values(stancesHere)) for (const s of list) covered.add(s);
  const bothAuthored = VARIANT_STANCES.every((s) => covered.has(s));

  const shakenPersona = Object.values(personas).find(
    (p) => p && (STRUGGLING_STATES as readonly string[]).includes(String(p.motivation_state)),
  );
  const assuredPersona = Object.values(personas).find(
    (p) => p && (THRIVING_STATES as readonly string[]).includes(String(p.motivation_state)),
  );

  for (const [stance, persona] of [
    ['unconfident', shakenPersona],
    ['confident', assuredPersona],
  ] as const) {
    const missing = !pairConcept
      ? 'no atom rail to compare on'
      : !bothAuthored
        ? `${pairConcept} has no authored body for both stances`
        : !persona
          ? `no persona with a ${stance} motivation state`
          : null;
    stops.push({
      id: `stance:${stance}`,
      title: `Re-open the same lesson as the ${stance} student`,
      look_for:
        stance === 'unconfident'
          ? 'The opening line starts from one concrete example, not the general statement.'
          : 'The opening line skips the scaffolding and goes at what costs marks.',
      proves: 'Same concept, same widgets, different words. This is the personalisation claim.',
      route: pairConcept ? `/lesson/${pairConcept}` : '/demo',
      persona: persona ?? null,
      available: missing === null,
      unavailable_reason: missing ?? undefined,
    });
  }

  stops.push({
    id: 'maturity',
    title: 'Show what the system knows about its own content',
    look_for:
      'Blockers outrank percentages, and anything unmeasurable reads as unknown rather than zero.',
    proves: 'The product reports honestly on its own personalisation, including when it is off.',
    route: '/admin',
    persona: null,
    available: true,
  });

  const kindsCovered = new Set<string>();
  for (const s of stops) {
    if (!s.available) continue;
    const m = s.look_for.match(/lesson: (.+)\.$/);
    if (m) for (const k of m[1].split(', ')) kindsCovered.add(k);
  }

  return {
    stops,
    coverage: {
      widget_kinds_in_corpus: [...kindsInCorpus].sort(),
      widget_kinds_covered: [...kindsCovered].sort(),
      stances_covered: bothAuthored ? [...VARIANT_STANCES] : [],
      available_stops: stops.filter((s) => s.available).length,
      total_stops: stops.length,
    },
    generated_at: input.now,
  };
}

async function gather(): Promise<Parameters<typeof buildItinerary>[0]> {
  let rails: any[] = [];
  try {
    rails = JSON.parse(fs.readFileSync(RAILS_PATH, 'utf8')).cards ?? [];
  } catch {
    rails = [];
  }

  const conceptWidgets: Record<string, Record<string, string | null>> = {};
  const conceptStances: Record<string, Record<string, string[]>> = {};
  const wanted = new Set<string>(
    rails.filter((c) => c.rail?.kind === 'atoms').map((c) => c.rail.concept_id),
  );
  for (const id of listConceptIds()) {
    if (!wanted.has(id)) continue;
    const atoms = await loadConceptAtoms(id);
    conceptWidgets[id] = {};
    conceptStances[id] = {};
    for (const a of atoms) {
      const key = railAtomKey(id, a.id);
      conceptWidgets[id][key] = widgetKindOf(a.content);
      conceptStances[id][key] = Object.keys(a.stance_variants ?? {});
    }
  }

  const personas: Record<string, StopPersona | null> = {};
  for (const c of rails) if (c.persona) personas[c.persona] = personaSignal(c.persona);

  return { conceptWidgets, conceptStances, rails, personas, now: new Date().toISOString() };
}

async function handleWalkthrough(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;
  try {
    sendJSON(res, buildItinerary(await gather()));
  } catch (err) {
    console.error('[admin-walkthrough] failed:', err);
    sendError(res, 500, 'Failed to build the walkthrough itinerary');
  }
}

export const adminWalkthroughRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/walkthrough', handler: handleWalkthrough },
];
