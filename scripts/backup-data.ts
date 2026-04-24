// @ts-nocheck
/**
 * scripts/backup-data.ts
 *
 * Snapshot the flat-file .data/ store into a timestamped tarball
 * under backups/ (gitignored).
 *
 * Usage:
 *   npx tsx scripts/backup-data.ts                # create a backup
 *   npx tsx scripts/backup-data.ts --list         # list existing
 *   npx tsx scripts/backup-data.ts --prune 30     # delete backups older than N days
 *
 * Designed to be driven by cron on the deploy host, or by the
 * in-process scheduler at daily cadence. For Render deploys with
 * persistent disks, backups should be uploaded off-host (S3,
 * Backblaze B2, etc.) — this script only creates the local tarball.
 *
 * PENDING.md §1.4 — local tarball complete; off-host upload is
 * operator-configurable (not in scope of this script).
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import path from 'path';

const DATA_DIR = '.data';
const BACKUPS_DIR = 'backups';

function ensureBackupsDir(): void {
  if (!existsSync(BACKUPS_DIR)) {
    mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function createBackup(): string {
  if (!existsSync(DATA_DIR)) {
    console.log(`No ${DATA_DIR}/ directory found — nothing to back up.`);
    return '';
  }
  ensureBackupsDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BACKUPS_DIR, `data-${stamp}.tar.gz`);
  try {
    execSync(`tar -czf ${target} ${DATA_DIR}`, { stdio: 'pipe' });
    const size = statSync(target).size;
    console.log(`✓ backup created: ${target} (${(size / 1024).toFixed(1)} KB)`);
    return target;
  } catch (e: any) {
    console.error(`backup failed: ${e?.message}`);
    process.exit(1);
  }
  return '';
}

function listBackups(): void {
  ensureBackupsDir();
  const files = readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('data-') && f.endsWith('.tar.gz'))
    .sort()
    .reverse();
  if (files.length === 0) {
    console.log('No backups found.');
    return;
  }
  console.log(`${files.length} backup(s):`);
  for (const f of files) {
    const p = path.join(BACKUPS_DIR, f);
    const size = statSync(p).size;
    console.log(`  ${f}  (${(size / 1024).toFixed(1)} KB)`);
  }
}

function pruneBackups(days: number): void {
  ensureBackupsDir();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const files = readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('data-') && f.endsWith('.tar.gz'));
  let pruned = 0;
  for (const f of files) {
    const p = path.join(BACKUPS_DIR, f);
    if (statSync(p).mtimeMs < cutoff) {
      unlinkSync(p);
      console.log(`pruned: ${f}`);
      pruned += 1;
    }
  }
  console.log(`${pruned} backup(s) pruned (older than ${days} days).`);
}

// ─── main ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args[0] === '--list') {
  listBackups();
} else if (args[0] === '--prune') {
  const days = parseInt(args[1] ?? '30', 10);
  pruneBackups(Number.isFinite(days) ? days : 30);
} else {
  createBackup();
}
