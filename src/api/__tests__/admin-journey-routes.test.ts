import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { __testing } from '../admin-journey-routes';

const { MILESTONES, buildPayload } = __testing;

describe('MILESTONES (locked order)', () => {
  it('contains the 8 locked milestones in the documented sequence', () => {
    expect(MILESTONES.map((m) => m.id)).toEqual([
      'exam_pack', 'rulesets', 'blueprint', 'approve_blueprint',
      'persona_scenario', 'generation_run', 'first_student', 'first_signal',
    ]);
  });

  it('every milestone has a CTA + doc link', () => {
    for (const m of MILESTONES) {
      expect(m.cta_label.length).toBeGreaterThan(0);
      expect(m.cta_href.startsWith('/')).toBe(true);
      expect(m.doc_link.startsWith('/docs/')).toBe(true);
      expect(m.threshold).toBeGreaterThan(0);
    }
  });
});

describe('buildPayload — derivation', () => {
  it('marks done when count ≥ threshold', () => {
    const p = buildPayload({
      exam_pack: 1,
      rulesets: 5,
      blueprint: 1,
      approve_blueprint: 1,
      persona_scenario: 1,
      generation_run: 1,
      first_student: 0,
      first_signal: 0,
    });
    const rulesets = p.milestones.find((m) => m.id === 'rulesets')!;
    expect(rulesets.status).toBe('done');
    const blueprint = p.milestones.find((m) => m.id === 'blueprint')!;
    expect(blueprint.status).toBe('done');
  });

  it('marks the FIRST non-done as next; rest stay pending', () => {
    const p = buildPayload({
      exam_pack: 1,
      rulesets: 0, // <- next
      blueprint: 0,
      approve_blueprint: 0,
      persona_scenario: 0,
      generation_run: 0,
      first_student: 0,
      first_signal: 0,
    });
    const rulesets = p.milestones.find((m) => m.id === 'rulesets')!;
    const blueprint = p.milestones.find((m) => m.id === 'blueprint')!;
    expect(rulesets.status).toBe('next');
    expect(blueprint.status).toBe('pending');
    expect(p.next_id).toBe('rulesets');
  });

  it('handles all-done state: next_id is null, done_count is 8', () => {
    const p = buildPayload({
      exam_pack: 1, rulesets: 3, blueprint: 1, approve_blueprint: 1,
      persona_scenario: 1, generation_run: 1, first_student: 1, first_signal: 1,
    });
    expect(p.done_count).toBe(8);
    expect(p.next_id).toBeNull();
    for (const m of p.milestones) expect(m.status).toBe('done');
  });

  it('rulesets threshold is 3 (cohort character needs at least a few rules)', () => {
    const partial = buildPayload({
      exam_pack: 1, rulesets: 2, blueprint: 0, approve_blueprint: 0,
      persona_scenario: 0, generation_run: 0, first_student: 0, first_signal: 0,
    });
    expect(partial.milestones.find((m) => m.id === 'rulesets')!.status).toBe('next');
  });

  it('respects locked tiebreaker: earlier milestone wins as next', () => {
    const p = buildPayload({
      exam_pack: 1, rulesets: 0, blueprint: 0,
      approve_blueprint: 0, persona_scenario: 0, generation_run: 0,
      first_student: 0, first_signal: 0,
    });
    expect(p.next_id).toBe('rulesets'); // rulesets wins over blueprint
  });

  it('every milestone in the response carries the full descriptor', () => {
    const p = buildPayload({
      exam_pack: 1, rulesets: 0, blueprint: 0, approve_blueprint: 0,
      persona_scenario: 0, generation_run: 0, first_student: 0, first_signal: 0,
    });
    for (const m of p.milestones) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.cta_href.length).toBeGreaterThan(0);
      expect(m.threshold).toBeGreaterThan(0);
    }
  });
});

describe('surveillance invariant 9: journey routes never expose per-student data', () => {
  it('admin-journey-routes.ts contains no user_id / session_id / student_name / email field assignments', () => {
    const file = path.join(__dirname, '..', 'admin-journey-routes.ts');
    const src = fs.readFileSync(file, 'utf8');
    const FORBIDDEN = [
      /\buser_id\s*:/,
      /\bsession_id\s*:/,
      /\bstudent_name\s*:/,
      /\bemail\s*:/,
    ];
    const found = FORBIDDEN.filter((re) => re.test(src));
    expect(
      found,
      'admin-journey-routes.ts must surface counts only — never per-student / per-record details.',
    ).toEqual([]);
  });
});
