import { describe, it, expect } from 'vitest';
import { personaUserId, isPersonaUserId } from '../persona-seeder';

describe('personaUserId', () => {
  it('returns a UUID-shaped string with the namespace prefix', () => {
    const id = personaUserId('priya-cbse-12-anxious');
    expect(id).toMatch(/^0aded0a0-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('is deterministic — same slug → same id', () => {
    expect(personaUserId('priya-cbse-12-anxious')).toBe(personaUserId('priya-cbse-12-anxious'));
  });

  it('differs across slugs', () => {
    expect(personaUserId('priya-cbse-12-anxious')).not.toBe(personaUserId('arjun-iit-driven'));
  });
});

describe('isPersonaUserId', () => {
  it('accepts persona-namespaced ids', () => {
    expect(isPersonaUserId(personaUserId('any-slug'))).toBe(true);
  });

  it('rejects regular UUIDs', () => {
    expect(isPersonaUserId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(false);
    expect(isPersonaUserId('00000000-0000-0000-0000-000000000000')).toBe(false);
  });

  it('rejects empty / non-string input', () => {
    expect(isPersonaUserId('')).toBe(false);
    expect(isPersonaUserId(null as any)).toBe(false);
  });
});
