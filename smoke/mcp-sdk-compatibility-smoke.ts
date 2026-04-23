// @ts-nocheck
/**
 * MCP Inspector / SDK compatibility test.
 *
 * Verifies the admin orchestrator's stdio server passes validation by
 * Anthropic's official `@modelcontextprotocol/sdk` — the same client
 * library that powers Claude Desktop, Cursor's MCP integration, the
 * MCP Inspector, and every third-party MCP client.
 *
 * If the SDK can successfully:
 *   1. Spawn our server and negotiate protocol version
 *   2. Call every primitive method with correctly-shaped params
 *   3. Parse every response against its Zod schemas without errors
 *   4. Accept our `notifications/message` push events as
 *      spec-compliant
 *
 * …then any MCP client in the ecosystem can talk to our server. The
 * SDK's schemas are the reference implementation of what MCP clients
 * expect; this test is effectively "we are spec-correct enough that
 * Anthropic's own types don't reject us".
 *
 * Why this exists in addition to stdio-integration-smoke:
 *   - stdio-integration-smoke verifies OUR transport — pipes, line
 *     buffering, exit codes, malformed-input handling. It uses a
 *     hand-rolled StdioClient that's permissive about shapes.
 *
 *   - THIS test verifies CONTRACT CORRECTNESS. The SDK's Zod parsers
 *     enforce strict shape validation on every response. If we ship
 *     an extra field in the wrong place or omit a required one, the
 *     SDK throws and this test fails. That's much stronger than
 *     hand-asserting individual keys.
 *
 * Run:
 *   npx tsx smoke/mcp-sdk-compatibility-smoke.ts
 *
 * No LLM credentials needed. Takes ~5s end-to-end.
 */

import path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

(async () => {
  let pass = 0, fail = 0;
  const check = (label: string, ok: boolean, extra = '') => {
    if (ok) { pass++; console.log(`  ✓ ${label}${extra ? ' — ' + extra : ''}`); }
    else { fail++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); }
  };

  const scriptPath = path.resolve(process.cwd(), 'src/admin-orchestrator/stdio-server.ts');

  console.log('━━━ MCP SDK compatibility test ━━━');
  console.log(`Server script: ${scriptPath}`);
  try {
    const fs = await import('fs');
    const pkg = JSON.parse(fs.readFileSync('node_modules/@modelcontextprotocol/sdk/package.json', 'utf8'));
    console.log(`SDK package:   @modelcontextprotocol/sdk v${pkg.version}`);
  } catch {
    console.log(`SDK package:   @modelcontextprotocol/sdk (version read failed — non-fatal)`);
  }

  // Instantiate a client that declares the full suite of capabilities —
  // mirroring how Claude Desktop + MCP Inspector introduce themselves.
  const client = new Client(
    { name: 'vidhya-sdk-compat-test', version: '2.31.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {}, sampling: {} } },
  );

  // Capture any notifications/message events the server pushes.
  const loggingNotifications: any[] = [];
  client.setNotificationHandler(
    (await import('@modelcontextprotocol/sdk/types.js')).LoggingMessageNotificationSchema,
    (notif) => { loggingNotifications.push(notif); },
  );

  // StdioClientTransport spawns the subprocess for us — same mechanism
  // Claude Desktop uses when it reads claude_desktop_config.json.
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'tsx', scriptPath],
    env: {
      ...process.env,
      VIDHYA_MCP_ROLE: 'admin',
      VIDHYA_MCP_ACTOR: 'sdk-compat-test',
      VIDHYA_LOG_STDERR: 'off',
    },
  });

  try {
    // ═══ CASE 1: SDK-driven connect + initialize ═══
    console.log('\n═══ CASE 1: connect + initialize ═══');
    await client.connect(transport);
    check('client.connect() resolved (no Zod error on initialize)', true);

    const serverVersion = client.getServerVersion();
    check('serverVersion.name present', !!serverVersion?.name);
    check('serverVersion.name is project-vidhya-admin-orchestrator',
      serverVersion?.name === 'project-vidhya-admin-orchestrator');
    check('serverVersion.version present', !!serverVersion?.version);
    check(`serverVersion.version is 2.x (got ${serverVersion?.version})`,
      /^2\.\d+\.\d+$/.test(serverVersion?.version));

    const serverCaps = client.getServerCapabilities();
    check('capabilities.tools declared', !!serverCaps?.tools);
    check('capabilities.resources declared', !!serverCaps?.resources);
    check('capabilities.prompts declared', !!serverCaps?.prompts);
    check('capabilities.logging declared', !!serverCaps?.logging);
    check('capabilities.completions declared', !!serverCaps?.completions);

    // ═══ CASE 2: ping ═══
    console.log('\n═══ CASE 2: ping ═══');
    await client.ping();
    check('ping() resolved (no Zod error)', true);

    // ═══ CASE 3: tools/list ═══
    console.log('\n═══ CASE 3: tools/list — SDK parses every tool ═══');
    const toolsResult = await client.listTools();
    check('listTools returned (Zod parse OK)', Array.isArray(toolsResult.tools));
    check(`got 32 tools (admin role)`, toolsResult.tools.length === 32);

    // The SDK enforces that every tool has: name, description, inputSchema.
    // If any of our 32 tools had a misshaped schema, the Zod parse would
    // have thrown before we got here.
    check('every tool has name', toolsResult.tools.every((t: any) => typeof t.name === 'string'));
    check('every tool has description', toolsResult.tools.every((t: any) => typeof t.description === 'string'));
    check('every tool has inputSchema object',
      toolsResult.tools.every((t: any) => t.inputSchema && typeof t.inputSchema === 'object'));
    check('every tool has annotations (v2.23+)',
      toolsResult.tools.every((t: any) => !!t.annotations));

    // ═══ CASE 4: tools/call ═══
    console.log('\n═══ CASE 4: tools/call — read-only ═══');
    const callResult = await client.callTool({
      name: 'agent:describe-capabilities',
      arguments: {},
    });
    check('callTool returned (Zod parse OK)', !!callResult);
    check('content is array', Array.isArray(callResult.content));
    check('content[0].type is text', (callResult.content as any[])[0]?.type === 'text');
    const capsBody = JSON.parse((callResult.content as any[])[0].text);
    check('parsed body has version', !!capsBody.version);
    check(`tool_count matches list (${capsBody.tool_count})`, capsBody.tool_count === 32);

    // ═══ CASE 5: resources/list ═══
    console.log('\n═══ CASE 5: resources/list — SDK parses every resource ═══');
    const resourcesResult = await client.listResources();
    check('listResources returned (Zod parse OK)', Array.isArray(resourcesResult.resources));
    check(`got ≥11 resources`, resourcesResult.resources.length >= 11);
    check('every resource has uri',
      resourcesResult.resources.every((r: any) => typeof r.uri === 'string'));
    check('every resource has name',
      resourcesResult.resources.every((r: any) => typeof r.name === 'string'));
    check('includes vidhya://admin/health/latest',
      resourcesResult.resources.some((r: any) => r.uri === 'vidhya://admin/health/latest'));
    check('includes vidhya://admin/logs/recent (v2.27+)',
      resourcesResult.resources.some((r: any) => r.uri === 'vidhya://admin/logs/recent'));

    // ═══ CASE 6: resources/read ═══
    console.log('\n═══ CASE 6: resources/read ═══');
    const readResult = await client.readResource({ uri: 'vidhya://admin/roles/catalog' });
    check('readResource returned (Zod parse OK)', !!readResult);
    check('contents is array', Array.isArray(readResult.contents));
    check('contents[0] has uri',
      typeof (readResult.contents as any[])[0]?.uri === 'string');
    check('contents[0] has mimeType',
      typeof (readResult.contents as any[])[0]?.mimeType === 'string');
    check('contents[0] has text',
      typeof (readResult.contents as any[])[0]?.text === 'string');

    // ═══ CASE 7: prompts/list ═══
    console.log('\n═══ CASE 7: prompts/list — SDK parses every prompt ═══');
    const promptsResult = await client.listPrompts();
    check('listPrompts returned (Zod parse OK)', Array.isArray(promptsResult.prompts));
    check(`got 6 prompts (admin role)`, promptsResult.prompts.length === 6);
    check('every prompt has name',
      promptsResult.prompts.every((p: any) => typeof p.name === 'string'));
    check('every prompt has description',
      promptsResult.prompts.every((p: any) => typeof p.description === 'string'));
    check('every prompt has arguments array',
      promptsResult.prompts.every((p: any) => Array.isArray(p.arguments)));

    // ═══ CASE 8: prompts/get ═══
    console.log('\n═══ CASE 8: prompts/get — message shape validated by Zod ═══');
    const promptResult = await client.getPrompt({
      name: 'daily-standup',
      arguments: {},
    });
    check('getPrompt returned (Zod parse OK)', !!promptResult);
    check('description present', typeof promptResult.description === 'string');
    check('messages is array', Array.isArray(promptResult.messages));
    check('messages[0].role is user/assistant',
      ['user', 'assistant'].includes((promptResult.messages as any[])[0]?.role));
    check('messages[0].content.type is text',
      (promptResult.messages as any[])[0]?.content?.type === 'text');
    check('messages[0].content.text is string',
      typeof (promptResult.messages as any[])[0]?.content?.text === 'string');

    // ═══ CASE 9: completion/complete ═══
    console.log('\n═══ CASE 9: completion/complete (v2.28+) ═══');
    const compResult = await client.complete({
      ref: { type: 'ref/prompt', name: 'strategy-review' },
      argument: { name: 'priority_filter', value: 'P' },
    });
    check('complete() returned (Zod parse OK)', !!compResult);
    check('completion envelope present', !!compResult.completion);
    check('values is array', Array.isArray(compResult.completion.values));
    check('values contains P0', compResult.completion.values.includes('P0'));
    check('values contains P0+P1', compResult.completion.values.includes('P0+P1'));
    check('total is number', typeof compResult.completion.total === 'number');
    check('hasMore is boolean', typeof compResult.completion.hasMore === 'boolean');

    // Also validate the resource-template variant
    const compResource = await client.complete({
      ref: { type: 'ref/resource', uri: 'vidhya://admin/tasks/by-role/{role}' },
      argument: { name: 'role', value: 'adm' },
    });
    check('complete() for ref/resource (Zod parse OK)', !!compResource);
    check('role completion includes admin', compResource.completion.values.includes('admin'));

    // ═══ CASE 10: logging/setLevel + notifications/message push ═══
    console.log('\n═══ CASE 10: logging/setLevel + notifications/message (Zod-validated push) ═══');
    const priorCount = loggingNotifications.length;
    await client.setLoggingLevel('debug');
    check('setLoggingLevel(debug) resolved (Zod parse OK)', true);

    // Trigger activity that emits logs. The server will push
    // notifications/message to stdout; the SDK's Zod schema validates
    // each one and registers them with our notification handler.
    await client.callTool({ name: 'scanner:run-full-scan', arguments: {} });
    await new Promise(r => setTimeout(r, 500));

    const receivedCount = loggingNotifications.length - priorCount;
    check(`received ${receivedCount} spec-valid notifications/message events`, receivedCount > 0);

    if (receivedCount > 0) {
      const n = loggingNotifications[priorCount];
      check('notification has method=notifications/message',
        n.method === 'notifications/message');
      check('notification.params.level is valid LoggingLevel',
        ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency']
          .includes(n.params.level));
      check('notification.params.logger is string',
        typeof n.params.logger === 'string');
      check('notification.params.data is object',
        typeof n.params.data === 'object' && n.params.data !== null);
    }

    // Mid-session filter change (per MCP spec, setLoggingLevel persists)
    await client.setLoggingLevel('error');
    const beforeFilter = loggingNotifications.length;
    await client.callTool({ name: 'agent:describe-capabilities', arguments: {} });
    await new Promise(r => setTimeout(r, 500));
    check('info events filtered out after setLoggingLevel=error',
      loggingNotifications.length === beforeFilter,
      `before=${beforeFilter} after=${loggingNotifications.length}`);

    // ═══ CASE 11: role-scoped error surface via SDK ═══
    console.log('\n═══ CASE 11: SDK surfaces MCP errors correctly ═══');
    // Unknown tool — should raise an SDK error
    let caughtUnknown = false;
    try {
      await client.callTool({ name: 'nonexistent:tool', arguments: {} });
    } catch (err: any) {
      caughtUnknown = true;
      check('unknown tool throws via SDK', true);
      check('error message mentions tool name',
        (err.message || '').includes('nonexistent:tool') || (err.message || '').toLowerCase().includes('not found'));
    }
    if (!caughtUnknown) check('unknown tool should have thrown', false);

    // Unknown prompt
    let caughtPrompt = false;
    try {
      await client.getPrompt({ name: 'nonexistent-prompt', arguments: {} });
    } catch (err: any) {
      caughtPrompt = true;
      check('unknown prompt throws via SDK', true);
    }
    if (!caughtPrompt) check('unknown prompt should have thrown', false);

    // Unknown resource
    let caughtResource = false;
    try {
      await client.readResource({ uri: 'vidhya://admin/nonexistent/foo' });
    } catch (err: any) {
      caughtResource = true;
      check('unknown resource throws via SDK', true);
    }
    if (!caughtResource) check('unknown resource should have thrown', false);

    // ═══ CASE 12: clean shutdown via SDK ═══
    console.log('\n═══ CASE 12: SDK-driven clean shutdown ═══');
    await client.close();
    check('client.close() resolved cleanly', true);

    console.log(`\n${'━'.repeat(58)}`);
    console.log(`MCP SDK compatibility: ${pass} passed / ${fail} failed`);
    console.log(`notifications received end-to-end: ${loggingNotifications.length}`);
    console.log(`${'━'.repeat(58)}`);

  } catch (err: any) {
    console.error(`\nFATAL: ${err.message ?? err}`);
    if (err.stack) console.error(err.stack.split('\n').slice(0, 10).join('\n'));
    fail++;
    try { await client.close(); } catch {}
  }

  if (fail > 0) process.exit(1);
})();
