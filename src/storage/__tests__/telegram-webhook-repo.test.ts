/**
 * Tests for TelegramWebhookRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool.
 */

import { describe, it, expect } from 'vitest';
import { PgTelegramWebhookRepo, NullTelegramWebhookRepo } from '../repositories/telegram-webhook-repo';

describe('PgTelegramWebhookRepo', () => {
  it('findPyqById queries by id with LIMIT 1 and returns the first row', async () => {
    const query = async (sql: string, params: any[]) => {
      expect(sql).toMatch(/FROM pyq_questions WHERE id = \$1 LIMIT 1/);
      expect(params).toEqual(['pyq_1']);
      return { rows: [{ id: 'pyq_1', correct_answer: 'A', explanation: 'because' }] };
    };
    const repo = new PgTelegramWebhookRepo({ query } as any);
    expect(await repo.findPyqById('pyq_1')).toEqual({ id: 'pyq_1', correct_answer: 'A', explanation: 'because' });
  });

  it('returns null when no row matches', async () => {
    const query = async () => ({ rows: [] });
    const repo = new PgTelegramWebhookRepo({ query } as any);
    expect(await repo.findPyqById('nonexistent')).toBeNull();
  });
});

describe('NullTelegramWebhookRepo', () => {
  it('findPyqById returns null (handleShowSolution throws before using it in practice)', async () => {
    const repo = new NullTelegramWebhookRepo();
    expect(await repo.findPyqById()).toBeNull();
  });
});
