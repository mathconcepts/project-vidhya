// @ts-nocheck
/**
 * Live LLM smoke test for the admin orchestrator bridge.
 *
 * PHILOSOPHY — this test differs from the ordinary smoke tests:
 *
 *   The ordinary smoke tests (src/admin-orchestrator/__tests__/...)
 *   prove the code is correct with NO API keys configured. They verify
 *   that the bridge gracefully returns null and that deterministic
 *   fallbacks work. They're what CI runs on every commit.
 *
 *   THIS test is different: it proves the bridge ACTUALLY talks to a
 *   real provider when a key is configured. It burns real tokens. It
 *   is opt-in via env var and is SKIPPED with a clear log line if the
 *   required env is not present.
 *
 * HOW TO RUN
 * ==========
 *
 * Gemini:
 *   VIDHYA_LLM_PRIMARY_PROVIDER=google-gemini \
 *   VIDHYA_LLM_PRIMARY_KEY=<key> \
 *     npx tsx smoke/live-llm-smoke.ts
 *
 * Anthropic:
 *   VIDHYA_LLM_PRIMARY_PROVIDER=anthropic \
 *   VIDHYA_LLM_PRIMARY_KEY=sk-ant-... \
 *     npx tsx smoke/live-llm-smoke.ts
 *
 * OpenAI:
 *   VIDHYA_LLM_PRIMARY_PROVIDER=openai \
 *   VIDHYA_LLM_PRIMARY_KEY=sk-... \
 *     npx tsx smoke/live-llm-smoke.ts
 *
 * Legacy env vars are also supported (loadConfigFromEnv maps them):
 *   GEMINI_API_KEY=...    npx tsx smoke/live-llm-smoke.ts
 *   ANTHROPIC_API_KEY=... npx tsx smoke/live-llm-smoke.ts
 *   OPENAI_API_KEY=...    npx tsx smoke/live-llm-smoke.ts
 *
 * SKIP BEHAVIOUR
 * ==============
 *
 * If no provider + key is available, the test exits 0 with a
 * "SKIPPED (no LLM configured)" line. This is correct for CI — the
 * live test is a manual-only confidence check, not a gate.
 *
 * BUDGET SAFETY
 * =============
 *
 * Every prompt is capped at ~120 output tokens. Worst case across all
 * 7 cases is <1000 output tokens + <2000 input tokens. At Anthropic
 * Haiku pricing (~$0.0025/1k), a full run costs <$0.01. At Gemini
 * Flash it's free/near-free.
 *
 * Set VIDHYA_LLM_SMOKE=skip to force skip even with a key present
 * (useful in CI where a key is set but you don't want to burn it on
 * every build).
 */

import fs from 'fs';

// Seed a realistic state so the agent has something to narrate
async function seedState(): Promise<{ run_id: string; strategy_id: string }> {
  // Clear any prior state
  ['feedback.json', 'sample-checks.json', 'courses.json', 'build-events.json',
   'attention-coverage.json', 'marketing-articles.json', 'marketing-sync.json',
   'marketing-campaigns.json', 'admin-orchestrator-tasks.json',
   'admin-orchestrator-runs.json'].forEach(f => {
    try { fs.rmSync(`.data/${f}`, { force: true }); } catch {}
  });

  await import('/tmp/vidhya-fresh/src/exams/adapters/index');
  const AO = await import('/tmp/vidhya-fresh/src/admin-orchestrator');
  const FB = await import('/tmp/vidhya-fresh/src/feedback/store');
  const { buildOrUpdateCourse } = await import('/tmp/vidhya-fresh/src/exam-builder/orchestrator');

  const ugee = await buildOrUpdateCourse({
    exam_id: 'EXM-UGEE-MATH-SAMPLE', build_kind: 'new', actor: 'admin',
    options: { skip_llm: true, auto_supersede_open: true },
  });

  // Seed 4 feedback items on same topic (triggers high-volume signal)
  for (let i = 0; i < 4; i++) {
    FB.submitFeedback({
      kind: 'clarity_issue' as any,
      target: {
        exam_id: 'EXM-UGEE-MATH-SAMPLE',
        sample_check_id: ugee.sample_check_id,
        question_id: `q${i}`,
        topic_id: 'calculus',
      } as any,
      description: 'seed feedback',
      submitted_by: { user_id: `u${i}`, anonymous: false },
    });
  }

  AO.clearAllTasks(); AO._resetAgentStore();
  const run = await AO.runAdminAgent({
    triggered_by: 'live-smoke',
    trigger_kind: 'manual',
    auto_enqueue_tasks: true,
    attempt_llm_narration: false,
  });

  if (run.strategies_proposed.length === 0) {
    throw new Error('seed produced no strategies — cannot run live smoke');
  }
  return { run_id: run.id, strategy_id: run.strategies_proposed[0].id };
}

// ============================================================================

(async () => {
  // Skip if force-disabled
  if (process.env.VIDHYA_LLM_SMOKE === 'skip') {
    console.log('\n━━━ LIVE LLM SMOKE: SKIPPED (VIDHYA_LLM_SMOKE=skip) ━━━\n');
    process.exit(0);
  }

  const AO = await import('/tmp/vidhya-fresh/src/admin-orchestrator');
  const availability = AO.describeLLMAvailability();

  if (!availability.available) {
    console.log('\n━━━ LIVE LLM SMOKE: SKIPPED ━━━');
    console.log(`Reason: ${availability.reason ?? 'no provider+key in environment'}`);
    console.log('To run this test, set one of:');
    console.log('  • VIDHYA_LLM_PRIMARY_PROVIDER + VIDHYA_LLM_PRIMARY_KEY');
    console.log('  • GEMINI_API_KEY (legacy)');
    console.log('  • ANTHROPIC_API_KEY (legacy)');
    console.log('  • OPENAI_API_KEY (legacy)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  }

  console.log('━━━ LIVE LLM SMOKE ━━━');
  console.log(`Provider: ${availability.provider_id}`);
  console.log('Burning real tokens — this run costs <$0.01.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━\n');

  let pass = 0, fail = 0;
  const t0 = Date.now();

  const assert = (label: string, ok: boolean, detail = '') => {
    if (ok) { pass++; console.log(`  ✓ ${label}${detail ? '   ' + detail : ''}`); }
    else { fail++; console.log(`  ✗ ${label}${detail ? '   ' + detail : ''}`); }
  };

  // Seed
  console.log('Seeding realistic state...');
  const { run_id, strategy_id } = await seedState();
  console.log(`  run_id=${run_id}, strategy_id=${strategy_id}\n`);

  // ═══ CASE 1: Bridge returns real output ═══
  console.log('═══ CASE 1: Direct bridge call ═══');
  const t1 = Date.now();
  const { output, meta } = await AO.callLLMWithConfig({
    system: 'You answer in exactly one short sentence. No preamble.',
    user: 'What is 2 + 2? Answer in one sentence.',
    max_tokens: 30,
    temperature: 0.1,
    agent_id: 'live-smoke:case-1',
  });
  const t1_elapsed = Date.now() - t1;
  assert('Output is non-null', output !== null, `(took ${t1_elapsed}ms)`);
  assert('Output has content', !!output?.content && output.content.length > 0);
  assert('Output has provider name', typeof output?.provider === 'string');
  assert('Output has model name', typeof output?.model === 'string' && output.model.length > 0);
  assert('Output has latency_ms', typeof output?.latency_ms === 'number' && output.latency_ms > 0);
  assert('meta.attempted=true', meta.attempted === true);
  assert('No skip_reason', !meta.skip_reason);
  assert('No error', !meta.error);
  if (output) {
    console.log(`     response: ${output.content.slice(0, 80)}${output.content.length > 80 ? '...' : ''}`);
    console.log(`     model=${output.model}, provider=${output.provider}, tokens=${output.input_tokens}→${output.output_tokens}`);
  }

  // ═══ CASE 2: narrateStrategy returns LLM narration ═══
  console.log('\n═══ CASE 2: narrateStrategyTool with real LLM ═══');
  const narr = await AO.narrateStrategyTool({ strategy_id, run_id });
  assert('strategy_id echoed', narr.strategy_id === strategy_id);
  assert('deterministic_summary present', !!narr.deterministic_summary);
  assert('llm_narration is non-null string', typeof narr.llm_narration === 'string' && narr.llm_narration.length > 0);
  assert('llm_meta.attempted=true', narr.llm_meta.attempted === true);
  assert('llm_meta.provider populated', !!narr.llm_meta.provider);
  assert('llm_meta.model populated', !!narr.llm_meta.model);
  assert('llm_meta.latency_ms populated', typeof narr.llm_meta.latency_ms === 'number');
  if (narr.llm_narration) {
    console.log(`     narration: ${narr.llm_narration.slice(0, 120)}${narr.llm_narration.length > 120 ? '...' : ''}`);
  }

  // ═══ CASE 3: summarizeHealth returns LLM summary ═══
  console.log('\n═══ CASE 3: summarizeHealthTool with real LLM ═══');
  const summ = await AO.summarizeHealthTool({ run_id });
  assert('run_id echoed', summ.run_id === run_id);
  assert('deterministic_summary populated', !!summ.deterministic_summary);
  assert('llm_summary is non-null string', typeof summ.llm_summary === 'string' && summ.llm_summary.length > 0);
  assert('signal_count >= 1', summ.signal_count >= 1);
  assert('llm_meta.provider populated', !!summ.llm_meta.provider);
  if (summ.llm_summary) {
    console.log(`     summary: ${summ.llm_summary.slice(0, 140)}${summ.llm_summary.length > 140 ? '...' : ''}`);
  }

  // ═══ CASE 4: suggestNextAction returns LLM reason ═══
  console.log('\n═══ CASE 4: suggestNextActionTool with real LLM ═══');
  // Find a role with open tasks
  const rolesT = new Set<string>();
  for (const t of AO.listTasks({ statuses: ['open'] })) rolesT.add(t.assigned_role);
  const targetRole = [...rolesT][0] as any;
  if (targetRole) {
    const sugg = await AO.suggestNextActionTool({ role: targetRole });
    assert('suggested_task populated', !!sugg.suggested_task);
    assert('reason populated', !!sugg.reason);
    assert('llm_reason is non-null string', typeof sugg.llm_reason === 'string' && sugg.llm_reason.length > 0);
    assert('llm_meta.provider populated', !!sugg.llm_meta.provider);
    if (sugg.llm_reason) {
      console.log(`     llm_reason: ${sugg.llm_reason.slice(0, 120)}${sugg.llm_reason.length > 120 ? '...' : ''}`);
    }
  } else {
    console.log('  ⚠ No roles have open tasks; skipping case 4');
  }

  // ═══ CASE 5: runAdminAgent with attempt_llm_narration=true produces narrations ═══
  console.log('\n═══ CASE 5: Full runAdminAgent with real narration ═══');
  AO.clearAllTasks(); AO._resetAgentStore();
  const { run_id: run2_id } = await seedState();
  const run2 = AO.getLatestAgentRun()!;
  // Re-run with narration enabled
  const run3 = await AO.runAdminAgent({
    triggered_by: 'live-smoke:case-5',
    trigger_kind: 'manual',
    auto_enqueue_tasks: true,
    attempt_llm_narration: true,
  });
  assert('llm_narration_attempted=true', run3.llm_narration_attempted === true);
  assert('llm_narration_succeeded=true', run3.llm_narration_succeeded === true);
  const narratedCount = run3.strategies_proposed.filter(s => !!s.llm_narration).length;
  assert(`At least 1 strategy has llm_narration (got ${narratedCount}/${run3.strategies_proposed.length})`, narratedCount >= 1);

  // ═══ CASE 6: MCP tools/call agent:summarize-health end-to-end ═══
  console.log('\n═══ CASE 6: LLM tool via MCP tools/call ═══');
  const mcpResp: any = await AO.handleMCPRequest(
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'agent:summarize-health', arguments: {} } },
    { role: 'admin', actor: 'live-smoke' },
  );
  assert('MCP call succeeds', !!mcpResp.result && !mcpResp.error);
  const body = JSON.parse(mcpResp.result.content[0].text);
  assert('Body has deterministic_summary', !!body.deterministic_summary);
  assert('Body has llm_summary (non-null, via live LLM)', typeof body.llm_summary === 'string' && body.llm_summary.length > 0);

  // ═══ CASE 7: Cost / latency tracking present ═══
  console.log('\n═══ CASE 7: Usage telemetry ═══');
  const finalCall = await AO.callLLMWithConfig({
    user: 'Say "hello".',
    max_tokens: 20,
    temperature: 0.0,
    agent_id: 'live-smoke:case-7',
  });
  assert('Final call succeeded', finalCall.output !== null);
  assert('input_tokens reported', typeof finalCall.output?.input_tokens === 'number' && finalCall.output!.input_tokens > 0);
  assert('output_tokens reported', typeof finalCall.output?.output_tokens === 'number' && finalCall.output!.output_tokens > 0);
  assert('cost_estimate_usd is a number (may be 0)', typeof finalCall.output?.cost_estimate_usd === 'number');

  const t_total = Date.now() - t0;

  console.log(`\n${'━'.repeat(58)}`);
  console.log(`Live LLM smoke: ${pass} passed / ${fail} failed   (${t_total}ms total)`);
  console.log(`Provider: ${availability.provider_id}`);
  console.log(`${'━'.repeat(58)}\n`);

  // Clean up seeded state
  ['feedback.json', 'sample-checks.json', 'courses.json', 'build-events.json',
   'attention-coverage.json', 'marketing-articles.json', 'marketing-sync.json',
   'marketing-campaigns.json', 'admin-orchestrator-tasks.json',
   'admin-orchestrator-runs.json'].forEach(f => {
    try { fs.rmSync(`.data/${f}`, { force: true }); } catch {}
  });

  if (fail > 0) process.exit(1);
})();
