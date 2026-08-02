/**
 * vidhya-data — data export/import with verify (CEO plan Phase 0 §5.2,
 * "Task 7"). See src/data-migration/snapshot.ts for the engine and its
 * documented scope (today: exactly one snapshot-able table,
 * cohort_signals — see that file's header for why).
 *
 * Usage:
 *   npx tsx scripts/vidhya-data.ts export --backend <pg|file> --out <dir>
 *   npx tsx scripts/vidhya-data.ts import --backend <pg|file> --in <dir>
 *   npx tsx scripts/vidhya-data.ts verify --backend <pg|file> --dir <dir>
 *
 * `--backend pg` requires DATABASE_URL. Exit 0 on success, 1 on any
 * error (including a MigrationVerifyError from `import`/`verify` — an
 * import that doesn't verify is reported as a failure, never silently
 * accepted).
 */

import { Pool } from 'pg';
import {
  exportSnapshot,
  importSnapshot,
  verifySnapshot,
  MigrationVerifyError,
  type Backend,
} from '../src/data-migration/snapshot';

function parseArgs(argv: string[]): { command: string; flags: Record<string, string> } {
  const [command, ...rest] = argv;
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i]?.replace(/^--/, '');
    const value = rest[i + 1];
    if (key && value !== undefined) flags[key] = value;
  }
  return { command, flags };
}

function requireFlag(flags: Record<string, string>, name: string): string {
  const value = flags[name];
  if (!value) {
    console.error(`FAIL — missing required --${name}`);
    process.exit(1);
  }
  return value;
}

function parseBackend(flags: Record<string, string>): Backend {
  const backend = requireFlag(flags, 'backend');
  if (backend !== 'pg' && backend !== 'file') {
    console.error(`FAIL — --backend must be 'pg' or 'file', got '${backend}'`);
    process.exit(1);
  }
  return backend;
}

async function makePool(backend: Backend): Promise<Pool | null> {
  if (backend !== 'pg') return null;
  if (!process.env.DATABASE_URL) {
    console.error(`FAIL — --backend pg requires DATABASE_URL to be set`);
    process.exit(1);
  }
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));

  console.log('vidhya-data — CEO plan Phase 0 §5.2\n');

  if (command === 'export') {
    const backend = parseBackend(flags);
    const outDir = requireFlag(flags, 'out');
    const pool = await makePool(backend);
    try {
      const manifest = await exportSnapshot(outDir, backend, pool);
      for (const t of manifest.tables) {
        console.log(`ok  [export] ${t.name}: ${t.row_count} row(s), checksum ${t.checksum.slice(0, 12)}…`);
      }
      console.log(`\nPASS — exported ${manifest.tables.length} table(s) from '${backend}' to ${outDir}`);
    } finally {
      await pool?.end();
    }
    return;
  }

  if (command === 'import') {
    const backend = parseBackend(flags);
    const inDir = requireFlag(flags, 'in');
    const pool = await makePool(backend);
    try {
      const manifest = await importSnapshot(inDir, backend, pool);
      for (const t of manifest.tables) {
        console.log(`ok  [import] ${t.name}: ${t.row_count} row(s) imported and verified`);
      }
      console.log(`\nPASS — imported ${manifest.tables.length} table(s) from ${inDir} into '${backend}'`);
    } finally {
      await pool?.end();
    }
    return;
  }

  if (command === 'verify') {
    const backend = parseBackend(flags);
    const dir = requireFlag(flags, 'dir');
    const pool = await makePool(backend);
    try {
      const manifest = await verifySnapshot(dir, backend, pool);
      for (const t of manifest.tables) {
        console.log(`ok  [verify] ${t.name}: ${t.row_count} row(s) match manifest`);
      }
      console.log(`\nPASS — '${backend}' matches the snapshot at ${dir}`);
    } finally {
      await pool?.end();
    }
    return;
  }

  console.error(`FAIL — unknown command '${command ?? ''}'. Expected: export | import | verify`);
  process.exit(1);
}

main().catch((err) => {
  if (err instanceof MigrationVerifyError) {
    console.error(`\nFAIL — ${err.message}`);
  } else {
    console.error(`\nFAIL — ${(err as Error).message}`);
  }
  process.exit(1);
});
