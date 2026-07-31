/**
 * beacon.ts tests.
 *
 * The module holds its queue/wired-listeners state at module scope (a
 * deliberate singleton — see the file header), so each test re-imports a
 * fresh instance via `vi.resetModules()` rather than sharing state across
 * cases. `pagehide` is used as the flush trigger throughout since `flush()`
 * itself isn't exported (only the five track* functions are the public
 * contract) and waiting on the real 4s interval would make every test slow.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

async function freshBeacon() {
  vi.resetModules();
  return import('./beacon');
}

function flushNow() {
  window.dispatchEvent(new Event('pagehide'));
}

// jsdom's Blob doesn't implement `.text()`; FileReader does support reading
// Blob content back out, so use it to inspect what sendBeacon() was handed.
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('beacon', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('delivers a page_view event via sendBeacon with the locked §2.3 shape', async () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, sendBeacon, onLine: true, userAgent: 'test-agent' });

    const { trackPageView } = await freshBeacon();
    trackPageView('/diagnostic', 250);
    flushNow();

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeacon.mock.calls[0];
    expect(url).toBe('/api/analytics');
    const body = JSON.parse(await readBlob(blob as Blob));
    expect(body.event_type).toBe('page_view');
    expect(body.metadata.route).toBe('/diagnostic');
    expect(body.metadata.ms_to_content).toBe(250);
    expect(typeof body.metadata.timestamp).toBe('string');
  });

  it('falls back to fetch({keepalive:true}) when sendBeacon is unavailable', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: undefined, onLine: true, userAgent: 'test-agent' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const { trackShare } = await freshBeacon();
    trackShare('report_card');
    flushNow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/analytics');
    expect(init.keepalive).toBe(true);
    const body = JSON.parse(init.body);
    expect(body.event_type).toBe('share');
    expect(body.metadata.artifact).toBe('report_card');
  });

  it('falls back to fetch when sendBeacon rejects the payload (returns false)', async () => {
    const sendBeacon = vi.fn().mockReturnValue(false);
    vi.stubGlobal('navigator', { ...navigator, sendBeacon, onLine: true, userAgent: 'test-agent' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const { trackAction } = await freshBeacon();
    trackAction('plan_view_start_hour1', '/diagnostic');
    flushNow();

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stays queued while offline, then delivers once back online, without dropping the event', async () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, sendBeacon, onLine: false, userAgent: 'test-agent' });

    const { trackDrop } = await freshBeacon();
    trackDrop('/diagnostic', 'question_5_view', 42_000);
    flushNow();

    expect(sendBeacon).not.toHaveBeenCalled();
    const persisted = JSON.parse(localStorage.getItem('vidhya_beacon_queue_v1') || '[]');
    expect(persisted).toHaveLength(1);
    expect(persisted[0].event_type).toBe('drop');
    expect(persisted[0].metadata.last_action).toBe('question_5_view');

    // Come back online and flush — the queued event must not be silently
    // dropped. This also drains this test's module instance so its
    // still-registered 'pagehide' listener has nothing left to fire later
    // (module-scoped singleton state can't be un-wired between tests — see
    // file header — so an un-drained queue here would otherwise leak an
    // unexpected extra send into a later test).
    vi.stubGlobal('navigator', { ...navigator, sendBeacon, onLine: true, userAgent: 'test-agent' });
    flushNow();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('vidhya_beacon_queue_v1')).toBeNull();
  });

  it('flushes a previously-persisted offline queue once back online', async () => {
    localStorage.setItem(
      'vidhya_beacon_queue_v1',
      JSON.stringify([{ event_type: 'pending_grade', identifier: 'anon-beacon', metadata: { ms: 900, outcome: 'graded' } }]),
    );
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, sendBeacon, onLine: true, userAgent: 'test-agent' });

    // Any track* call wires the module and merges the persisted queue in.
    const { trackAction } = await freshBeacon();
    trackAction('resume', '/planned');
    flushNow();

    expect(sendBeacon).toHaveBeenCalledTimes(2);
    const types = sendBeacon.mock.calls.map(([, blob]) => blob).length;
    expect(types).toBe(2);
    expect(localStorage.getItem('vidhya_beacon_queue_v1')).toBeNull();
  });
});
