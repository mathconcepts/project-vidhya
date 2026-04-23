// @ts-nocheck
/**
 * Template presets — curated starter templates for new students.
 *
 * When a student first opens the planner they see an empty template
 * list. That's a feature-discovery failure: the template system is
 * great but invisible.
 *
 * This module exports 5 curated suggestion templates covering the
 * common session-shape archetypes:
 *   - Bus stop    (3 min)    spot-review the most overdue
 *   - Commute     (8 min)    short focused session on the primary exam
 *   - Morning    (15 min)    balanced session across exams
 *   - Afternoon  (30 min)    solid block with a micro-mock capstone
 *   - Weekend    (60 min)    deep session, multi-exam allowed
 *
 * These are offered as SUGGESTIONS — clicking one saves it as a real
 * template for the student AND runs the planner immediately. The
 * student can delete it later or never look at it again.
 */

export interface PresetTemplate {
  /** Stable slug used to prevent re-importing the same preset twice */
  slug: string;
  name: string;
  minutes_available: number;
  exam_selection: 'all' | 'primary' | string[];
  description: string;
}

/**
 * The curated list. Order matters — rendered in this order in the UI.
 */
export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    slug: 'preset-bus-stop',
    name: 'Bus stop',
    minutes_available: 3,
    exam_selection: 'primary',
    description: 'Tiny spot-review of your most overdue topic.',
  },
  {
    slug: 'preset-commute',
    name: 'Commute',
    minutes_available: 8,
    exam_selection: 'primary',
    description: 'Short focused session on your next-closest exam.',
  },
  {
    slug: 'preset-morning',
    name: 'Morning session',
    minutes_available: 15,
    exam_selection: 'all',
    description: 'Balanced 15 minutes across your registered exams.',
  },
  {
    slug: 'preset-afternoon',
    name: 'Afternoon block',
    minutes_available: 30,
    exam_selection: 'all',
    description: 'Main practice plus a micro-mock capstone.',
  },
  {
    slug: 'preset-weekend',
    name: 'Weekend deep dive',
    minutes_available: 60,
    exam_selection: 'all',
    description: 'Extended multi-topic session with harder difficulty.',
  },
];

/**
 * Which presets remain "unadopted" for a given student — i.e. the
 * student hasn't saved a template matching the preset's slug yet.
 * The UI renders unadopted presets as dotted-border suggestion cards;
 * adopted ones don't re-surface.
 */
export function unadoptedPresets(
  adoptedSlugs: Set<string>,
): PresetTemplate[] {
  return PRESET_TEMPLATES.filter(p => !adoptedSlugs.has(p.slug));
}
