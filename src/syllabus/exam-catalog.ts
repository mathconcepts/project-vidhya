// @ts-nocheck
/**
 * Exam Catalog
 *
 * Static registry of exams this instance of Vidhya supports. Each entry
 * defines topic coverage, typical scope, expected prep duration, and
 * topic weights — matching official syllabus documents where available.
 *
 * Adding a new exam: insert an entry here, then let the syllabus generator
 * walk the concept graph filtered by this exam's topics.
 */

import type { ExamScope } from './types';

export interface ExamDefinition {
  id: string;
  name: string;
  authority: string;                    // who administers it
  default_scope: ExamScope;
  allowed_scopes: ExamScope[];          // scopes a student can pick
  topics: string[];                     // topic_ids from concept-graph
  topic_weights: Record<string, number>; // 0..1, sums to ~1.0
  typical_prep_weeks: number;
  reference_url: string;
  official_syllabus_url?: string;
  description: string;
}

export const EXAMS: Record<string, ExamDefinition> = {

  'gate-ma': {
    id: 'gate-ma',
    name: 'GATE Engineering Mathematics',
    authority: 'IIT / IISc — Graduate Aptitude Test in Engineering',
    default_scope: 'mcq-rigorous',
    allowed_scopes: ['mcq-fast', 'mcq-rigorous'],
    topics: [
      'linear-algebra',
      'calculus',
      'differential-equations',
      'probability-statistics',
      'complex-variables',
      'numerical-methods',
      'transform-theory',
      'vector-calculus',
      'discrete-mathematics',
      'graph-theory',
    ],
    topic_weights: {
      'linear-algebra': 0.20,
      'calculus': 0.25,
      'differential-equations': 0.15,
      'probability-statistics': 0.10,
      'complex-variables': 0.08,
      'numerical-methods': 0.05,
      'transform-theory': 0.05,
      'vector-calculus': 0.05,
      'discrete-mathematics': 0.04,
      'graph-theory': 0.03,
    },
    typical_prep_weeks: 12,
    reference_url: 'https://gate.iitk.ac.in/',
    official_syllabus_url: 'https://gate.iitk.ac.in/syllabus.html',
    description: 'Engineering Mathematics portion of GATE — MCQ + numerical-answer-type. 15 marks of 100 in CS/EC/EE/ME papers, 85 marks in dedicated MA paper.',
  },

  'jee-advanced-math': {
    id: 'jee-advanced-math',
    name: 'JEE Advanced — Mathematics',
    authority: 'IIT — Joint Entrance Examination Advanced',
    default_scope: 'mcq-rigorous',
    allowed_scopes: ['mcq-fast', 'mcq-rigorous'],
    topics: [
      'calculus',
      'linear-algebra',
      'probability-statistics',
      'complex-variables',
      'vector-calculus',
    ],
    topic_weights: {
      'calculus': 0.45,
      'linear-algebra': 0.15,
      'probability-statistics': 0.15,
      'complex-variables': 0.15,
      'vector-calculus': 0.10,
    },
    typical_prep_weeks: 52,
    reference_url: 'https://jeeadv.ac.in/',
    official_syllabus_url: 'https://jeeadv.ac.in/resources/syllabus.pdf',
    description: 'Mathematics section of JEE Advanced — high-difficulty MCQ, numerical-answer, and match-the-column types. Emphasizes conceptual depth within a tight timeframe.',
  },

  'university-math-ug-final': {
    id: 'university-math-ug-final',
    name: 'Undergraduate Math — End-Semester (Generic)',
    authority: 'University (varies)',
    default_scope: 'subjective-long',
    allowed_scopes: ['subjective-short', 'subjective-long', 'oral-viva'],
    topics: [
      'calculus',
      'linear-algebra',
      'differential-equations',
      'complex-variables',
      'vector-calculus',
    ],
    topic_weights: {
      'calculus': 0.30,
      'linear-algebra': 0.25,
      'differential-equations': 0.20,
      'complex-variables': 0.15,
      'vector-calculus': 0.10,
    },
    typical_prep_weeks: 4,
    reference_url: 'https://en.wikipedia.org/wiki/Engineering_mathematics',
    description: 'Long-form written exam. Emphasizes derivation, proof, and clear justification. Partial credit for correct approach.',
  },

  'csir-net-math': {
    id: 'csir-net-math',
    name: 'CSIR-NET Mathematical Sciences',
    authority: 'CSIR — National Eligibility Test',
    default_scope: 'mcq-rigorous',
    allowed_scopes: ['mcq-rigorous', 'subjective-long'],
    topics: [
      'calculus',
      'linear-algebra',
      'complex-variables',
      'differential-equations',
      'probability-statistics',
      'discrete-mathematics',
      'numerical-methods',
    ],
    topic_weights: {
      'calculus': 0.20,
      'linear-algebra': 0.18,
      'complex-variables': 0.15,
      'differential-equations': 0.15,
      'probability-statistics': 0.12,
      'discrete-mathematics': 0.10,
      'numerical-methods': 0.10,
    },
    typical_prep_weeks: 24,
    reference_url: 'https://csirnet.nta.ac.in/',
    official_syllabus_url: 'https://csirnet.nta.ac.in/syllabus',
    description: 'Qualifying exam for research fellowships and lectureship in mathematical sciences. Rigorous MCQ + MSQ + NAT format across three parts.',
  },

  'university-viva': {
    id: 'university-viva',
    name: 'Math Viva / Oral Defense (Generic)',
    authority: 'University (varies)',
    default_scope: 'oral-viva',
    allowed_scopes: ['oral-viva'],
    topics: [
      'calculus',
      'linear-algebra',
      'differential-equations',
      'complex-variables',
      'vector-calculus',
    ],
    topic_weights: {
      'calculus': 0.25,
      'linear-algebra': 0.25,
      'differential-equations': 0.20,
      'complex-variables': 0.15,
      'vector-calculus': 0.15,
    },
    typical_prep_weeks: 2,
    reference_url: '',
    description: 'Oral examination with faculty. Emphasizes verbal explanation, conceptual fluency, and cross-topic connection over written derivation.',
  },
};

export function getExam(id: string): ExamDefinition | null {
  return EXAMS[id] || null;
}

export function listExams(): Array<Pick<ExamDefinition, 'id' | 'name' | 'default_scope' | 'allowed_scopes'>> {
  return Object.values(EXAMS).map(e => ({
    id: e.id,
    name: e.name,
    default_scope: e.default_scope,
    allowed_scopes: e.allowed_scopes,
  }));
}
