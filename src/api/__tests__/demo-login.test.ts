import { describe, it, expect } from 'vitest';
import { resolveDemoRole, buildDemoLoginHtml, type DemoTokens } from '../demo-login';

const TOKENS: DemoTokens = {
  'student-active': { token: 'tok-student', name: 'Priya', email: 'priya@test.com', role: 'student' },
  teacher: { token: 'tok-teacher', name: 'Dr Rajan', email: 'rajan@test.com', role: 'teacher' },
  admin: { token: 'tok-admin', name: 'Admin', email: 'admin@test.com', role: 'admin' },
};

describe('resolveDemoRole', () => {
  it('maps "student" → "student-active"', () => {
    expect(resolveDemoRole('student')).toBe('student-active');
  });

  it('passes through other roles unchanged', () => {
    expect(resolveDemoRole('teacher')).toBe('teacher');
    expect(resolveDemoRole('admin')).toBe('admin');
    expect(resolveDemoRole('student-active')).toBe('student-active');
  });
});

describe('buildDemoLoginHtml', () => {
  it('sets localStorage with the correct key and token', () => {
    const entry = TOKENS['student-active'];
    const html = buildDemoLoginHtml(entry);
    expect(html).toContain('"vidhya.auth.token.v1"');
    expect(html).toContain(JSON.stringify(entry.token));
  });

  it('students redirect to /', () => {
    const html = buildDemoLoginHtml(TOKENS['student-active']);
    // PR #28 changed buildDemoLoginHtml to JSON.stringify the path so
    // double-quotes wrap the literal. Admins go to /admin/content-rd;
    // students still go to /.
    expect(html).toContain('window.location.replace("/")');
  });

  it('admins redirect to /admin/content-rd (PR #28)', () => {
    const html = buildDemoLoginHtml(TOKENS.admin);
    expect(html).toContain('window.location.replace("/admin/content-rd")');
  });

  it('shows the user name and role in the page', () => {
    const entry = TOKENS.teacher;
    const html = buildDemoLoginHtml(entry);
    expect(html).toContain(entry.name);
    expect(html).toContain(entry.role);
  });

  it('does not leak other tokens into the page', () => {
    const html = buildDemoLoginHtml(TOKENS['student-active']);
    expect(html).not.toContain(TOKENS.teacher.token);
    expect(html).not.toContain(TOKENS.admin.token);
  });
});
