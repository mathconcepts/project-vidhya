/**
 * Bridge Registry — central lookup for curricula and bridge mappings.
 *
 * Add a new curriculum: import its file, push into CURRICULA below.
 * Add a new mapping: import, push into MAPPINGS below. That's the whole
 * extension story.
 */

import type { Curriculum, BridgeMapping } from './types';
import { TN_CLASS_12_MATH } from './curricula/tn-class-12-math';
import { TN_12_MATH_TO_JEE } from './mappings/tn-12-math-to-jee';

const CURRICULA: Curriculum[] = [TN_CLASS_12_MATH];
const MAPPINGS: BridgeMapping[] = [TN_12_MATH_TO_JEE];

export function listCurricula(): Curriculum[] {
  return CURRICULA.slice();
}

export function getCurriculum(id: string): Curriculum | null {
  return CURRICULA.find(c => c.id === id) ?? null;
}

export function listMappings(): BridgeMapping[] {
  return MAPPINGS.slice();
}

export function getMapping(id: string): BridgeMapping | null {
  return MAPPINGS.find(m => m.id === id) ?? null;
}

export function getMappingByPair(source_id: string, target_id: string): BridgeMapping | null {
  return MAPPINGS.find(m => m.source_curriculum_id === source_id && m.target_exam_id === target_id) ?? null;
}

/** Find a concept inside the registered curricula. */
export function getConcept(concept_id: string) {
  for (const c of CURRICULA) {
    for (const t of c.topics) {
      for (const concept of t.concepts) {
        if (concept.id === concept_id) {
          return { curriculum: c, topic: t, concept };
        }
      }
    }
  }
  return null;
}
