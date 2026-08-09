/**
 * scripts/playbook-cli.ts
 *
 * Minimal CLI for the Playbook Layer (Track E5).
 *
 * Usage:
 *   npm run playbook:list
 *   npm run playbook:estimate -- <playbook-id> [--params '{"key":"value"}']
 *   npm run playbook:run -- <playbook-id> [--params '{"key":"value"}'] [--dry-run]
 */

import { listPlaybooks, getPlaybook } from '../src/playbooks/registry.js';
import { estimateRun, launchPlaybook } from '../src/playbooks/runner.js';

const [command, ...rest] = process.argv.slice(2);

function parseArgs(args: string[]): { id?: string; params: Record<string, unknown>; dryRun: boolean } {
  let id: string | undefined;
  let params: Record<string, unknown> = {};
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--params' && args[i + 1]) {
      try { params = JSON.parse(args[i + 1]); } catch { /* ignore */ }
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (!args[i].startsWith('--')) {
      id = args[i];
    }
  }

  return { id, params, dryRun };
}

async function main(): Promise<void> {
  switch (command) {
    case 'list': {
      const playbooks = listPlaybooks();
      console.log(`\nRegistered playbooks (${playbooks.length}):\n`);
      for (const p of playbooks) {
        console.log(`  ${p.id.padEnd(30)} [${p.executor}]  ${p.title}`);
      }
      console.log('');
      break;
    }

    case 'estimate': {
      const { id, params } = parseArgs(rest);
      if (!id) { console.error('Usage: playbook:estimate <id> [--params <json>]'); process.exit(1); }
      try {
        const result = estimateRun(id, params);
        console.log('\nDry-run estimate:');
        console.log(JSON.stringify(result.estimate, null, 2));
        if (result.validation_errors.length) {
          console.warn('Validation errors:', result.validation_errors);
        }
      } catch (e) {
        console.error(String(e)); process.exit(1);
      }
      break;
    }

    case 'run': {
      const { id, params, dryRun } = parseArgs(rest);
      if (!id) { console.error('Usage: playbook:run <id> [--params <json>] [--dry-run]'); process.exit(1); }
      try {
        console.log(`\nLaunching playbook '${id}'${dryRun ? ' (dry-run)' : ''}...\n`);
        const { run, brief_path } = await launchPlaybook(id, params, { dry_run: dryRun });
        console.log(`  run_id: ${run.run_id}`);
        console.log(`  status: ${run.status}`);
        if (brief_path) console.log(`  brief:  ${brief_path}`);
        console.log('');
      } catch (e) {
        console.error(String(e)); process.exit(1);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}. Valid: list | estimate | run`);
      process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
