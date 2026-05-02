-- 018_media_artifacts.sql — Multi-modal content (PENDING.md §4.15).
--
-- Tracks per-atom media sidecars (GIF animations, audio narration, etc.)
-- generated alongside text atoms by the orchestrator. Keyed on
-- (atom_id, version_n, kind) so a single atom version can have multiple
-- artifact kinds (gif + audio_narration in v1).
--
-- Lifecycle:
--   queued   → render scheduled (currently unused; v1 GIF render is sync)
--   rendering → render in progress (currently unused)
--   done     → file at src_path is ready to serve
--   failed   → render error; details in error_log
--
-- Storage: file paths point to MEDIA_STORAGE_DIR (default .data/media/).
-- Free tier ephemeral disk caveat: Render free tier loses .data on
-- restart. Acknowledged in CHANGELOG operator action; v1 ships .data/
-- with S3/R2 migration as a v2 follow-up.
--
-- Pruning: when atom_versions.activate() flips active flags, the orchestrator's
-- media-prune sweep deletes superseded media_artifacts rows and their files.
-- expires_at is a TTL safety net for orphans (default NULL = no TTL).

CREATE TABLE IF NOT EXISTS media_artifacts (
  atom_id          TEXT NOT NULL,
  version_n        INTEGER NOT NULL,
  kind             TEXT NOT NULL CHECK (kind IN ('gif', 'audio_narration')),
  status           TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('queued', 'rendering', 'done', 'failed')),
  src_path         TEXT NOT NULL,
  bytes            INTEGER,
  duration_ms      INTEGER,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  error_log        TEXT,
  PRIMARY KEY (atom_id, version_n, kind)
);

CREATE INDEX IF NOT EXISTS media_artifacts_status_idx
  ON media_artifacts (status) WHERE status IN ('queued', 'rendering');

CREATE INDEX IF NOT EXISTS media_artifacts_expires_idx
  ON media_artifacts (expires_at) WHERE expires_at IS NOT NULL;
