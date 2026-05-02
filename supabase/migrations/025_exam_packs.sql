-- =============================================================================
-- 025_exam_packs.sql
-- =============================================================================
-- Phase 1 of Curriculum R&D — operator-defined exam packs alongside the
-- canonical YAML packs in `data/curriculum/`. Eng-review D5: exam packs are
-- DATA, not code. Operators create new packs via the admin UI; they live in
-- the DB. Canonical packs (gate-ma, jee-main) stay in version control as YAML.
--
-- The exam-loader (src/curriculum/exam-loader.ts post-PR-#31) merges YAML +
-- DB rows so callers see one unified view.
--
-- Idempotent. Additive.
-- =============================================================================

CREATE TABLE IF NOT EXISTS exam_packs (
  id            TEXT PRIMARY KEY,                            -- 'gate-ma', 'jee-main', 'custom-isi-msqe', ...
  name          TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'operator'
                CHECK (source IN ('yaml', 'operator')),       -- yaml = mirrors a file in data/curriculum/
  config        JSONB NOT NULL,                              -- mirrors the YAML structure: metadata, syllabus, etc.
  -- Capability flags. Default true for operator-friendly packs that opt in.
  -- For Phase 1: gate-ma + jee-main get interactives_enabled=true via YAML;
  -- new operator packs default to FALSE (text+GIF only) per scope lock.
  interactives_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    TEXT,                                        -- user_id of admin who created it (if operator-source)
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_packs_status
  ON exam_packs(status, source);

-- updated_at auto-touch via trigger (function already created in migration 023).
DROP TRIGGER IF EXISTS exam_packs_touch ON exam_packs;
CREATE TRIGGER exam_packs_touch
  BEFORE UPDATE ON exam_packs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =============================================================================
-- End of 025_exam_packs.sql
-- =============================================================================
