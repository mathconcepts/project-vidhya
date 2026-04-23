// @ts-nocheck
/**
 * End-to-end stdio integration test.
 *
 * Spawns `npx tsx src/admin-orchestrator/stdio-server.ts` as a real
 * child process, writes newline-delimited JSON-RPC to its stdin, and
 * parses responses + notifications from its stdout.
 *
 * The existing offline smoke (`/tmp/smoke-v2270.ts` style) exercises
 * `processLine()` in-process. That proves the dispatch logic but NOT
 * the transport layer — we've never actually verified that the
 * subprocess starts, reads stdin line-by-line, writes JSON-RPC
 * responses to stdout without interleaving stderr, and exits cleanly
 * on stdin close.
 *
 * This test verifies:
 *   1. subprocess boots and stays alive
 *   2. initialize round-trip succeeds via real pipe I/O
 *   3. tools/list returns the expected 29 tools
 *   4. tools/call invokes a read-only tool end-to-end
 *   5. logging/setLevel + a logger event emitted during a tool call
 *      produces a notifications/message on stdout
 *   6. malformed JSON on stdin produces -32700 response without
 *      killing the process
 *   7. subprocess exits cleanly on stdin close (exit code 0)
 *
 * Run: npx tsx smoke/stdio-integration-smoke.ts
 *
 * Skip behaviour: none. This test requires the local checkout; it
 * should always run in CI to catch subprocess-level regressions.
 */

import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';

// ============================================================================
// Subprocess harness
// ============================================================================

interface PendingRequest {
  resolve: (msg: any) => void;
  reject: (err: Error) => void;
  timeout: NodeJS.Timeout;
}

class StdioClient {
  public proc: ChildProcessWithoutNullStreams;
  private buffer = '';
  private pending = new Map<number | string, PendingRequest>();
  /** Notifications received (no id) */
  public notifications: any[] = [];
  /** stderr lines captured */
  public stderrLines: string[] = [];
  /** Resolves when subprocess exits */
  public exitPromise: Promise<{ code: number | null; signal: string | null }>;

  constructor(scriptPath: string, env: Record<string, string>) {
    this.proc = spawn('npx', ['-y', 'tsx', scriptPath], {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.proc.stdout.setEncoding('utf8');
    this.proc.stderr.setEncoding('utf8');

    this.proc.stdout.on('data', (chunk: string) => this.handleStdout(chunk));
    this.proc.stderr.on('data', (chunk: string) => {
      for (const line of chunk.split('\n')) {
        if (line.trim()) this.stderrLines.push(line);
      }
    });

    this.exitPromise = new Promise((resolve) => {
      this.proc.once('exit', (code, signal) => resolve({ code, signal }));
    });
  }

  private handleStdout(chunk: string): void {
    this.buffer += chunk;
    let idx = this.buffer.indexOf('\n');
    while (idx !== -1) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (line) this.handleLine(line);
      idx = this.buffer.indexOf('\n');
    }
  }

  private handleLine(line: string): void {
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch (err) {
      // Not JSON on stdout — protocol violation
      for (const [, p] of this.pending) {
        clearTimeout(p.timeout);
        p.reject(new Error(`stdout emitted non-JSON line: ${line.slice(0, 80)}`));
      }
      this.pending.clear();
      return;
    }

    if (msg.id !== undefined && this.pending.has(msg.id)) {
      // Response to a pending request
      const pending = this.pending.get(msg.id)!;
      clearTimeout(pending.timeout);
      this.pending.delete(msg.id);
      pending.resolve(msg);
    } else if (msg.method) {
      // Notification (no id, has method)
      this.notifications.push(msg);
    }
  }

  /** Send a JSON-RPC request and await its response (10s timeout) */
  async call(method: string, params?: any, id?: number | string): Promise<any> {
    const reqId = id ?? Math.floor(Math.random() * 1000000);
    const req = { jsonrpc: '2.0', id: reqId, method, ...(params !== undefined ? { params } : {}) };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(reqId);
        reject(new Error(`timeout waiting for response to ${method} (id=${reqId})`));
      }, 10000);
      this.pending.set(reqId, { resolve, reject, timeout });
      this.proc.stdin.write(JSON.stringify(req) + '\n');
    });
  }

  /** Write a raw line to stdin (used to test malformed JSON handling) */
  writeRaw(line: string): void {
    this.proc.stdin.write(line + '\n');
  }

  close(): void {
    this.proc.stdin.end();
  }

  kill(): void {
    this.proc.kill('SIGTERM');
  }
}

// ============================================================================
// Main
// ============================================================================

(async () => {
  const scriptPath = path.resolve(process.cwd(), 'src/admin-orchestrator/stdio-server.ts');

  // Use an isolated actor + data dir so session state doesn't leak
  const testActor = 'stdio-integration-smoke';
  const env = {
    VIDHYA_MCP_ROLE: 'admin',
    VIDHYA_MCP_ACTOR: testActor,
    VIDHYA_LOG_STDERR: 'off',
  };

  console.log('━━━ stdio integration test ━━━');
  console.log(`Spawning: npx tsx ${scriptPath}`);
  const client = new StdioClient(scriptPath, env);

  let pass = 0, fail = 0;
  const check = (label: string, ok: boolean, extra = '') => {
    if (ok) { pass++; console.log(`  ✓ ${label}${extra ? ' — ' + extra : ''}`); }
    else { fail++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); }
  };

  // Give the subprocess a moment to start (tsx cold-start)
  await new Promise(r => setTimeout(r, 3000));

  try {
    // ═══ CASE 1: subprocess alive ═══
    console.log('\n═══ CASE 1: subprocess startup ═══');
    check('subprocess pid assigned', typeof client.proc.pid === 'number' && client.proc.pid > 0);
    check('subprocess still running (not exited)', client.proc.exitCode === null);

    // ═══ CASE 2: initialize round-trip ═══
    console.log('\n═══ CASE 2: initialize handshake ═══');
    const initResp = await client.call('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'stdio-integration-test' },
    }, 1);
    check('initialize received response', !!initResp);
    check('response jsonrpc=2.0', initResp.jsonrpc === '2.0');
    check('response id echoed', initResp.id === 1);
    check('response has result', !!initResp.result);
    check('result.protocolVersion 2024-11-05', initResp.result?.protocolVersion === '2024-11-05');
    check('result.serverInfo.name', initResp.result?.serverInfo?.name === 'project-vidhya-admin-orchestrator');
    check('result.serverInfo.version 2.28.0', initResp.result?.serverInfo?.version === '2.28.0');
    check('result.capabilities has tools', !!initResp.result?.capabilities?.tools);
    check('result.capabilities has logging', !!initResp.result?.capabilities?.logging);
    check('result.capabilities has completions', !!initResp.result?.capabilities?.completions);

    // ═══ CASE 3: ping ═══
    console.log('\n═══ CASE 3: ping ═══');
    const pingResp = await client.call('ping', undefined, 2);
    check('ping response received', !!pingResp);
    check('ping id echoed', pingResp.id === 2);
    check('ping has result', pingResp.result !== undefined);

    // ═══ CASE 4: tools/list ═══
    console.log('\n═══ CASE 4: tools/list ═══');
    const toolsResp = await client.call('tools/list', undefined, 3);
    check('tools/list succeeds', !!toolsResp.result);
    check('admin sees all 29 tools', toolsResp.result?.tools?.length === 29);
    check('tools have name + description + inputSchema',
      toolsResp.result?.tools?.every(t => !!t.name && !!t.description && !!t.inputSchema));
    check('tools have annotations', toolsResp.result?.tools?.every(t => !!t.annotations));

    // ═══ CASE 5: tools/call (read-only) ═══
    console.log('\n═══ CASE 5: tools/call (read-only) ═══');
    const callResp = await client.call('tools/call', {
      name: 'agent:describe-capabilities',
      arguments: {},
    }, 4);
    check('tools/call succeeds', !!callResp.result && !callResp.error);
    check('result has content array', Array.isArray(callResp.result?.content));
    check('content is text type', callResp.result?.content?.[0]?.type === 'text');
    const capsBody = JSON.parse(callResp.result?.content?.[0]?.text ?? '{}');
    check('response body has version 2.28.0', capsBody.version === '2.28.0');
    check('response body has tool_count 29', capsBody.tool_count === 29);

    // ═══ CASE 6: resources/list ═══
    console.log('\n═══ CASE 6: resources/list ═══');
    const resResp = await client.call('resources/list', undefined, 5);
    check('resources/list succeeds', !!resResp.result);
    check('admin sees ≥11 resources', (resResp.result?.resources?.length || 0) >= 11);
    check('includes logs/recent',
      resResp.result?.resources?.some((r: any) => r.uri === 'vidhya://admin/logs/recent'));

    // ═══ CASE 7: prompts/list ═══
    console.log('\n═══ CASE 7: prompts/list ═══');
    const promptsResp = await client.call('prompts/list', undefined, 6);
    check('prompts/list succeeds', !!promptsResp.result);
    check('admin sees 6 prompts', promptsResp.result?.prompts?.length === 6);

    // ═══ CASE 8: completion/complete ═══
    console.log('\n═══ CASE 8: completion/complete (v2.28.0) ═══');
    const compResp = await client.call('completion/complete', {
      ref: { type: 'ref/prompt', name: 'strategy-review' },
      argument: { name: 'priority_filter', value: 'P' },
    }, 7);
    check('completion/complete succeeds', !!compResp.result);
    check('result has completion envelope', !!compResp.result?.completion);
    check('values is array', Array.isArray(compResp.result?.completion?.values));
    // All 5 options (P0, P1, P2, P3, P0+P1) start with P
    check('values include P0', compResp.result?.completion?.values?.includes('P0'));
    check('values include P0+P1', compResp.result?.completion?.values?.includes('P0+P1'));
    check('total >= 5', (compResp.result?.completion?.total || 0) >= 5);

    // ═══ CASE 9: logging/setLevel + subsequent event push ═══
    console.log('\n═══ CASE 9: logging/setLevel + notifications/message push ═══');
    const prevNotifCount = client.notifications.length;

    // Set level to debug so we see everything
    const levelResp = await client.call('logging/setLevel', { level: 'debug' }, 8);
    check('setLevel succeeds', !!levelResp.result !== undefined && !levelResp.error);

    // Trigger a tools/call that will emit logs internally
    await client.call('tools/call', {
      name: 'scanner:run-full-scan',
      arguments: {},
    }, 9);

    // Allow async push time to arrive
    await new Promise(r => setTimeout(r, 500));

    const newNotifications = client.notifications.slice(prevNotifCount);
    check(`received ${newNotifications.length} notifications after setLevel=debug`,
      newNotifications.length > 0);

    if (newNotifications.length > 0) {
      const n = newNotifications[0];
      check('notification is jsonrpc 2.0', n.jsonrpc === '2.0');
      check('notification method is notifications/message', n.method === 'notifications/message');
      check('notification has params.level', typeof n.params?.level === 'string');
      check('notification has params.logger', typeof n.params?.logger === 'string');
      check('notification has params.data', typeof n.params?.data === 'object');
      check('notification has timestamp', typeof n.params?.data?.timestamp === 'string');
    }

    // Raise level to error — info logs should stop pushing
    await client.call('logging/setLevel', { level: 'error' }, 10);
    const countBefore = client.notifications.length;
    // Trigger another scan — emits info/debug logs but filter should block them
    await client.call('tools/call', { name: 'agent:describe-capabilities', arguments: {} }, 11);
    await new Promise(r => setTimeout(r, 500));
    const countAfter = client.notifications.length;
    check('info events filtered out after setLevel=error',
      countAfter === countBefore,
      `before=${countBefore} after=${countAfter}`);

    // ═══ CASE 10: malformed JSON on stdin ═══
    console.log('\n═══ CASE 10: malformed JSON on stdin ═══');
    const malformedResponsePromise = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('no response to malformed JSON')), 5000);
      // Error response to malformed input has id=null
      const check = () => {
        for (let i = 0; i < client.notifications.length; i++) {
          const msg = client.notifications[i];
          if (msg.error && msg.error.code === -32700) {
            clearTimeout(timeout);
            resolve(msg);
            return;
          }
        }
      };
      // We need a different capture path since error responses with id=null
      // aren't caught by our pending-request map. Set up a stdout hook.
      const origHandler = (client as any).handleLine;
      (client as any).handleLine = function (line: string) {
        try {
          const msg = JSON.parse(line);
          if (msg.id === null && msg.error && msg.error.code === -32700) {
            clearTimeout(timeout);
            resolve(msg);
            return;
          }
        } catch {}
        origHandler.call(this, line);
      };
    });

    client.writeRaw('{not valid json');

    const malformed = await malformedResponsePromise.catch(err => ({ error: err.message }));
    check('malformed JSON → -32700 response', (malformed as any)?.error?.code === -32700);
    check('error id is null',  (malformed as any)?.id === null);

    // ═══ CASE 11: subprocess still responsive after malformed input ═══
    console.log('\n═══ CASE 11: subprocess survives malformed input ═══');
    const postPing = await client.call('ping', undefined, 999);
    check('ping after bad input still succeeds', !!postPing.result !== undefined);

    // ═══ CASE 12: clean shutdown on stdin close ═══
    console.log('\n═══ CASE 12: clean shutdown on stdin close ═══');
    client.close();
    // Give it up to 3s to exit gracefully
    const exitInfo = await Promise.race([
      client.exitPromise,
      new Promise<any>(r => setTimeout(() => r({ code: null, signal: null, timedOut: true }), 3000)),
    ]);
    check('subprocess exited', (exitInfo as any)?.code !== null || (exitInfo as any)?.signal !== null);
    check('exit code is 0 (clean)', (exitInfo as any)?.code === 0);

    console.log(`\n${'━'.repeat(58)}`);
    console.log(`stdio integration: ${pass} passed / ${fail} failed`);
    console.log(`notifications received: ${client.notifications.length}`);
    console.log(`stderr lines (first 3): ${client.stderrLines.slice(0, 3).join(' | ')}`);
    console.log(`${'━'.repeat(58)}`);

  } catch (err: any) {
    console.error(`\nFATAL: ${err.message ?? err}`);
    console.error('stderr capture:\n' + client.stderrLines.slice(-10).join('\n'));
    client.kill();
    fail++;
  } finally {
    // Ensure subprocess is down
    if (client.proc.exitCode === null) client.kill();
  }

  if (fail > 0) process.exit(1);
})();
