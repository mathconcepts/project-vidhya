/**
 * Knowledge Tracks — board/class/subject combinations students study at school.
 *
 * Each track maps to one or more registered exam adapters. When a student
 * picks "CBSE Class 12 Mathematics" we know they are most likely heading
 * toward BITSAT, JEE Main, or UGEE. The student then picks which of those
 * exams they want to actively prepare for; the knowledge track stays in
 * their profile so GBrain can personalize ("a CBSE Class 12 student
 * preparing for BITSAT") and we can recommend curriculum-aligned content.
 *
 * This file is the single source of truth. To add a new state board or
 * subject, append to KNOWLEDGE_TRACKS — no other code needs to change.
 */

export type Board =
  | 'CBSE'        // Central Board of Secondary Education
  | 'ICSE'        // Indian Certificate of Secondary Education
  | 'KAR-PUE'     // Karnataka Pre-University Education
  | 'MAH-HSC'     // Maharashtra HSC Board
  | 'TN-HSE';     // Tamil Nadu Higher Secondary

export type Grade = 'class-11' | 'class-12';

export type Subject =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology';

export interface KnowledgeTrack {
  /** Stable id, e.g. "CBSE-12-MATH" */
  id: string;
  board: Board;
  board_name: string;          // human-readable, e.g. "CBSE"
  grade: Grade;
  grade_name: string;          // "Class 12"
  subject: Subject;
  subject_name: string;        // "Mathematics"
  /** Public name for UI ("CBSE Class 12 Mathematics") */
  display_name: string;
  /** Exam adapter ids this track most commonly leads into */
  suggested_exam_ids: string[];
  /** One-line student-facing description */
  description: string;
}

const BOARD_NAMES: Record<Board, string> = {
  'CBSE':    'CBSE',
  'ICSE':    'ICSE',
  'KAR-PUE': 'Karnataka PUE',
  'MAH-HSC': 'Maharashtra HSC',
  'TN-HSE':  'Tamil Nadu HSE',
};

const GRADE_NAMES: Record<Grade, string> = {
  'class-11': 'Class 11',
  'class-12': 'Class 12',
};

const SUBJECT_NAMES: Record<Subject, string> = {
  'mathematics': 'Mathematics',
  'physics':     'Physics',
  'chemistry':   'Chemistry',
  'biology':     'Biology',
};

/**
 * Build a track. The id is derived from (board, grade, subject) so callers
 * never have to write it manually — keeps everything consistent.
 */
function track(
  board: Board,
  grade: Grade,
  subject: Subject,
  suggested_exam_ids: string[],
  description: string,
): KnowledgeTrack {
  const id = `${board}-${grade.split('-')[1]}-${subject.toUpperCase().slice(0, 4)}`;
  return {
    id,
    board,
    board_name: BOARD_NAMES[board],
    grade,
    grade_name: GRADE_NAMES[grade],
    subject,
    subject_name: SUBJECT_NAMES[subject],
    display_name: `${BOARD_NAMES[board]} ${GRADE_NAMES[grade]} ${SUBJECT_NAMES[subject]}`,
    suggested_exam_ids,
    description,
  };
}

// Concrete exam ids registered in src/exams/adapters/
const EXAM = {
  BITSAT:    'EXM-BITSAT-MATH-SAMPLE',
  JEE_MAIN:  'EXM-JEEMAIN-MATH-SAMPLE',
  UGEE:      'EXM-UGEE-MATH-SAMPLE',
  GATE:      'EXM-GATE-MATH-SAMPLE',
  NEET_BIO:  'EXM-NEET-BIO-SAMPLE',
  NEET_PHYS: 'EXM-NEET-PHYS-SAMPLE',
  NEET_CHEM: 'EXM-NEET-CHEM-SAMPLE',
} as const;

/**
 * Master list of supported knowledge tracks.
 *
 * Subject → exam mapping rationale:
 *   Mathematics  -> BITSAT, JEE Main, UGEE (engineering pipeline)
 *   Physics      -> JEE Main, NEET Physics (engineering + medical)
 *   Chemistry    -> JEE Main, NEET Chemistry
 *   Biology      -> NEET Biology only (medical pipeline)
 */
export const KNOWLEDGE_TRACKS: KnowledgeTrack[] = [
  // CBSE
  track('CBSE', 'class-12', 'mathematics', [EXAM.BITSAT, EXAM.JEE_MAIN, EXAM.UGEE],
    'Standard CBSE Class 12 math — leads to engineering entrances.'),
  track('CBSE', 'class-12', 'physics', [EXAM.JEE_MAIN, EXAM.NEET_PHYS],
    'CBSE Class 12 physics — engineering and medical pathways.'),
  track('CBSE', 'class-12', 'chemistry', [EXAM.JEE_MAIN, EXAM.NEET_CHEM],
    'CBSE Class 12 chemistry — engineering and medical pathways.'),
  track('CBSE', 'class-12', 'biology', [EXAM.NEET_BIO],
    'CBSE Class 12 biology — medical entrance preparation.'),
  track('CBSE', 'class-11', 'mathematics', [EXAM.BITSAT, EXAM.JEE_MAIN],
    'CBSE Class 11 math foundation — early engineering prep.'),
  track('CBSE', 'class-11', 'physics', [EXAM.JEE_MAIN, EXAM.NEET_PHYS],
    'CBSE Class 11 physics foundation.'),
  track('CBSE', 'class-11', 'chemistry', [EXAM.JEE_MAIN, EXAM.NEET_CHEM],
    'CBSE Class 11 chemistry foundation.'),
  track('CBSE', 'class-11', 'biology', [EXAM.NEET_BIO],
    'CBSE Class 11 biology foundation — medical prep.'),

  // ICSE
  track('ICSE', 'class-12', 'mathematics', [EXAM.BITSAT, EXAM.JEE_MAIN, EXAM.UGEE],
    'ICSE Class 12 math — engineering entrances.'),
  track('ICSE', 'class-12', 'physics', [EXAM.JEE_MAIN, EXAM.NEET_PHYS],
    'ICSE Class 12 physics.'),
  track('ICSE', 'class-12', 'chemistry', [EXAM.JEE_MAIN, EXAM.NEET_CHEM],
    'ICSE Class 12 chemistry.'),
  track('ICSE', 'class-12', 'biology', [EXAM.NEET_BIO],
    'ICSE Class 12 biology.'),

  // Karnataka PUE
  track('KAR-PUE', 'class-12', 'mathematics', [EXAM.BITSAT, EXAM.JEE_MAIN],
    'Karnataka PUE II year math.'),
  track('KAR-PUE', 'class-12', 'biology', [EXAM.NEET_BIO],
    'Karnataka PUE II year biology.'),

  // Maharashtra HSC
  track('MAH-HSC', 'class-12', 'mathematics', [EXAM.BITSAT, EXAM.JEE_MAIN],
    'Maharashtra HSC Class 12 math.'),
  track('MAH-HSC', 'class-12', 'biology', [EXAM.NEET_BIO],
    'Maharashtra HSC Class 12 biology.'),

  // Tamil Nadu HSE
  track('TN-HSE', 'class-12', 'mathematics', [EXAM.BITSAT, EXAM.JEE_MAIN],
    'Tamil Nadu HSE Class 12 math.'),
  track('TN-HSE', 'class-12', 'biology', [EXAM.NEET_BIO],
    'Tamil Nadu HSE Class 12 biology.'),
];

// ============================================================================

export function listTracks(): KnowledgeTrack[] {
  return KNOWLEDGE_TRACKS.slice();
}

export function getTrack(id: string): KnowledgeTrack | null {
  return KNOWLEDGE_TRACKS.find(t => t.id === id) ?? null;
}

/**
 * Group tracks by board for the picker UI.
 * Returns a list shaped like { board, board_name, grades: [...] }.
 */
export function listTracksByBoard(): Array<{
  board: Board;
  board_name: string;
  grades: Array<{
    grade: Grade;
    grade_name: string;
    subjects: KnowledgeTrack[];
  }>;
}> {
  const byBoard = new Map<Board, KnowledgeTrack[]>();
  for (const t of KNOWLEDGE_TRACKS) {
    const list = byBoard.get(t.board) ?? [];
    list.push(t);
    byBoard.set(t.board, list);
  }
  return [...byBoard.entries()].map(([board, tracks]) => {
    const byGrade = new Map<Grade, KnowledgeTrack[]>();
    for (const t of tracks) {
      const list = byGrade.get(t.grade) ?? [];
      list.push(t);
      byGrade.set(t.grade, list);
    }
    return {
      board,
      board_name: BOARD_NAMES[board],
      grades: [...byGrade.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([grade, subjects]) => ({
          grade,
          grade_name: GRADE_NAMES[grade],
          subjects,
        })),
    };
  });
}

/**
 * Find tracks that suggest a particular exam — the inverse mapping.
 * Useful for showing "students preparing for BITSAT typically come from
 * these school streams" in admin/marketing surfaces.
 */
export function getTracksForExam(exam_id: string): KnowledgeTrack[] {
  return KNOWLEDGE_TRACKS.filter(t => t.suggested_exam_ids.includes(exam_id));
}
