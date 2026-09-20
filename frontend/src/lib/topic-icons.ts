/**
 * frontend/src/lib/topic-icons.ts
 *
 * The ONE topic-icon name -> component map.
 *
 * `src/curriculum/topic-adapter.ts`'s `ICON_MAP` picks a glyph NAME per
 * syllabus section; this resolves that name to a lucide component. It used to
 * be two independent copies, one in `Home.tsx` and one in `SpinePage.tsx`, and
 * they had already drifted: `crosshair` and `triangle` were added to Home's
 * copy with the JEE Mathematics sections and never to Spine's, so the same
 * student saw distinct icons on one page and three identical fallbacks on the
 * other. Both pages now read this file — the "parallel truths that drift" bug
 * class the repo has been closing since v4.25.0.
 *
 * `iconForTopic` falls back rather than throwing: a section whose glyph name
 * has no entry renders a neutral book instead of crashing the topic list. The
 * fallback is deliberately NOT one of the real glyphs, so an unmapped name
 * looks unmapped instead of impersonating another subject.
 */
import {
  Grid3x3, Activity, GitBranch, Circle, BarChart, Hash, Repeat, Layers,
  Share2, Navigation, Crosshair, Triangle,
  Move, Thermometer, AudioWaveform, Zap, Sun, Atom, FlaskConical, Hexagon,
  Table, BookOpen,
} from 'lucide-react';
import type React from 'react';

export const TOPIC_ICONS: Record<string, React.ElementType> = {
  // GATE-MA sections.
  'grid': Grid3x3,
  'activity': Activity,
  'git-branch': GitBranch,
  'circle': Circle,
  'bar-chart': BarChart,
  'hash': Hash,
  'repeat': Repeat,
  'layers': Layers,
  'share-2': Share2,
  'navigation': Navigation,
  // JEE Mathematics sections.
  'crosshair': Crosshair,
  'triangle': Triangle,
  // JEE Physics and Chemistry sections.
  'move': Move,
  'thermometer': Thermometer,
  'audio-waveform': AudioWaveform,
  'zap': Zap,
  'sun': Sun,
  'atom': Atom,
  'flask-conical': FlaskConical,
  'hexagon': Hexagon,
  'table': Table,
};

/** The glyph for a topic's icon name, or a neutral fallback. */
export function iconForTopic(name: string | null | undefined): React.ElementType {
  return (name && TOPIC_ICONS[name]) || BookOpen;
}
