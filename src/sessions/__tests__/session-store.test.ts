/**
 * session-store — flat-file backend tests.
 *
 * Covers the path that runs on free-tier Render demos where DATABASE_URL
 * is unset. Verifies that buildSession → recordAnswer → completeSession
 * flow works end-to-end without a Postgres connection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

let testDir: string;
let prevDbUrl: string | undefined;
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  prevDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-store-'));
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(testDir);

  // Seed a minimal content bundle so fetchProblemsForConcept finds problems
  const bundleDir = path.join(testDir, 'frontend/public/data');
  fs.mkdirSync(bundleDir, { recursive: true });
  fs.writeFileSync(
    path.join(bundleDir, 'content-bundle.json'),
    JSON.stringify({
      version: 1,
      problems: [
        {
          id: 'p-derivative-easy-1',
          concept_id: 'calculus-derivatives',
          topic: 'calculus',
          difficulty: 0.3,
          question_text: 'd/dx (x^2) = ?',
          expected_answer: '2x',
          source: 'bundle',
        },
        {
          id: 'p-derivative-mid-1',
          concept_id: 'calculus-derivatives',
          topic: 'calculus',
          difficulty: 0.5,
          question_text: 'd/dx (sin x) = ?',
          expected_answer: 'cos x',
          source: 'bundle',
        },
      ],
      explainers: {},
    }),
  );
});

afterEach(() => {
  cwdSpy.mockRestore();
  fs.rmSync(testDir, { recursive: true, force: true });
  if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
  vi.resetModules();
});

describe('FlatFileStore — selected when DATABASE_URL is unset', () => {
  it('selects flat-file backend when DATABASE_URL is unset', async () => {
    const mod = await import('../session-store');
    mod._resetSessionStoreForTests();
    const store = mod.getSessionStore();
    expect(store).toBeDefined();
    expect(store.constructor.name).toBe('FlatFileStore');
  });

  it('fetchProblemsForConcept reads from content bundle', async () => {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    const problem = await store.fetchProblemsForConcept('calculus-derivatives', 0.7, new Set());
    expect(problem).not.toBeNull();
    expect(problem!.concept_id).toBe('calculus-derivatives');
    expect(['p-derivative-easy-1', 'p-derivative-mid-1']).toContain(problem!.problem_id);
  });

  it('respects max_difficulty filter', async () => {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    // max 0.4 should only return the easy one (0.3)
    const problem = await store.fetchProblemsForConcept('calculus-derivatives', 0.4, new Set());
    expect(problem!.problem_id).toBe('p-derivative-easy-1');
  });

  it('respects excludeIds set', async () => {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    const result = await store.fetchProblemsForConcept(
      'calculus-derivatives',
      1.0,
      new Set(['p-derivative-easy-1', 'p-derivative-mid-1']),
    );
    expect(result).toBeNull();
  });

  it('returns null for concept with no problems', async () => {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    const result = await store.fetchProblemsForConcept('nonexistent-concept', 1.0, new Set());
    expect(result).toBeNull();
  });

  it('full session lifecycle: create → start → resume → answer → complete', async () => {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();

    const problems = [
      {
        problem_id: 'p-derivative-easy-1',
        concept_id: 'calculus-derivatives',
        topic: 'calculus',
        difficulty: 0.3,
        question: 'd/dx (x^2) = ?',
        expected_answer: '2x',
        source: 'bundle',
      },
    ];

    const studymateId = await store.createSession('user-1', 'gate-ma', 'daily', problems);
    expect(studymateId).toMatch(/^sm-/);

    await store.markStarted(studymateId);

    const resumed = await store.findResumable('user-1', 4);
    expect(resumed).not.toBeNull();
    expect(resumed!.id).toBe(studymateId);
    expect(resumed!.state).toBe('IN_PROGRESS');

    const sessionProblems = await store.getSessionProblems(studymateId);
    expect(sessionProblems).toHaveLength(1);
    expect(sessionProblems[0].user_answer).toBeNull();

    await store.recordAnswer(studymateId, 'p-derivative-easy-1', '2x', true);
    const afterAnswer = await store.getSessionProblems(studymateId);
    expect(afterAnswer[0].user_answer).toBe('2x');
    expect(afterAnswer[0].was_correct).toBe(true);

    const attempts = await store.getCompletionAttempts(studymateId);
    expect(attempts).toEqual([{ concept_id: 'calculus-derivatives', was_correct: true }]);

    await store.markCompleted(studymateId, '1/1 today. Strong on calculus.');
    const afterComplete = await store.findResumable('user-1', 4);
    expect(afterComplete).toBeNull(); // SESSION_COMPLETE filtered out
  });

  it('findResumable filters out sessions older than the window', async () => {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();

    await store.createSession('user-1', 'gate-ma', 'daily', [{
      problem_id: 'x', concept_id: 'c', topic: 't', difficulty: 0.5,
      question: 'q', expected_answer: 'a', source: 's',
    }]);

    // Manually back-date the session in the JSON file to 5 hours ago
    const filePath = path.join(testDir, '.data/studymate-sessions.json');
    const contents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    contents.sessions[0].updated_at = fiveHoursAgo;
    fs.writeFileSync(filePath, JSON.stringify(contents));

    const resumed = await store.findResumable('user-1', 4);
    expect(resumed).toBeNull();
  });

  it('persists across store instances (file is the source of truth)', async () => {
    const mod1 = await import('../session-store');
    mod1._resetSessionStoreForTests();
    const store1 = mod1.getSessionStore();

    const id = await store1.createSession('user-1', 'gate-ma', 'daily', [{
      problem_id: 'p1', concept_id: 'c1', topic: 't', difficulty: 0.5,
      question: 'q', expected_answer: 'a', source: 's',
    }]);

    // New store instance reads back the same data
    mod1._resetSessionStoreForTests();
    const store2 = mod1.getSessionStore();
    const problems = await store2.getSessionProblems(id);
    expect(problems).toHaveLength(1);
    expect(problems[0].problem_id).toBe('p1');
  });
});
