-- Migration 024: Public Holidays Configuration Schema
-- Extends the holidays table with statutory/ad-hoc classification,
-- Sunday→Monday observation logic, and seeds SA statutory holiday data.
-- This migration is idempotent and safe to re-run.

-- ============================================================
-- 1. SCHEMA CHANGES — add new columns to holidays table
-- ============================================================

ALTER TABLE holidays ALTER COLUMN holiday_date DROP NOT NULL;

ALTER TABLE holidays
  ADD COLUMN IF NOT EXISTS holiday_type      VARCHAR(20)  NOT NULL DEFAULT 'STATUTORY_FIXED',
  ADD COLUMN IF NOT EXISTS auto_shift_sunday BOOLEAN      NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS year              INTEGER,
  ADD COLUMN IF NOT EXISTS is_observed       BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS statutory_month   INTEGER,
  ADD COLUMN IF NOT EXISTS statutory_day     INTEGER,
  ADD COLUMN IF NOT EXISTS notes             TEXT,
  ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW();

-- Partial unique index: only one template per holiday name (year IS NULL rows)
CREATE UNIQUE INDEX IF NOT EXISTS holidays_template_name_uq
  ON holidays (name) WHERE year IS NULL;

-- Partial unique index: only one instance per (name, year) pair
CREATE UNIQUE INDEX IF NOT EXISTS holidays_instance_name_year_uq
  ON holidays (name, year) WHERE year IS NOT NULL;

-- ============================================================
-- 2. SEED — 10 SA statutory public holiday templates (year = NULL)
--    Public Holidays Act 36 of 1994
--    Good Friday and Family Day (Easter) are excluded here because
--    they require the Easter algorithm — see Task #282.
-- ============================================================

INSERT INTO holidays (name, holiday_date, recurring, enabled, holiday_type, auto_shift_sunday,
                      statutory_month, statutory_day, year, is_observed, notes, created_at, updated_at)
VALUES
  ('New Year''s Day',       NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,  1,  1,  NULL, FALSE, 'Public Holidays Act 36 of 1994', NOW(), NOW()),
  ('Human Rights Day',      NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,  3, 21,  NULL, FALSE, 'Human Rights Day — 21 March', NOW(), NOW()),
  ('Freedom Day',           NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,  4, 27,  NULL, FALSE, 'First democratic election — 27 April 1994', NOW(), NOW()),
  ('Workers'' Day',         NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,  5,  1,  NULL, FALSE, 'International Workers Day', NOW(), NOW()),
  ('Youth Day',             NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,  6, 16,  NULL, FALSE, 'Soweto Uprising — 16 June 1976', NOW(), NOW()),
  ('National Women''s Day', NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,  8,  9,  NULL, FALSE, 'Women''s March to Union Buildings — 9 August 1956', NOW(), NOW()),
  ('Heritage Day',          NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,  9, 24,  NULL, FALSE, 'Heritage Day — 24 September', NOW(), NOW()),
  ('Day of Reconciliation', NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE, 12, 16,  NULL, FALSE, 'Day of Reconciliation — 16 December', NOW(), NOW()),
  ('Christmas Day',         NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE, 12, 25,  NULL, FALSE, 'Christmas Day — 25 December', NOW(), NOW()),
  ('Day of Goodwill',       NULL, FALSE, TRUE, 'STATUTORY_FIXED', TRUE, 12, 26,  NULL, FALSE, 'Day of Goodwill — 26 December', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. GENERATE instances for 2025, 2026, 2027
--    Applies Sunday→Monday observed-date shift (Act 36 of 1994 s.2(2))
-- ============================================================

DO $$
DECLARE
  yr          INT;
  t           RECORD;
  stat_date   DATE;
  obs_date    DATE;
  is_shifted  BOOLEAN;
BEGIN
  FOREACH yr IN ARRAY ARRAY[2025, 2026, 2027] LOOP
    FOR t IN
      SELECT * FROM holidays
      WHERE holiday_type = 'STATUTORY_FIXED' AND year IS NULL
      ORDER BY statutory_month, statutory_day
    LOOP
      -- Skip if a STATUTORY instance already exists for this (name, year)
      -- Filtering by holiday_type ensures ad-hoc holidays on the same date do not block generation
      IF EXISTS (
        SELECT 1 FROM holidays
        WHERE name = t.name AND year = yr AND holiday_type = 'STATUTORY_FIXED'
      ) THEN
        CONTINUE;
      END IF;

      stat_date  := make_date(yr, t.statutory_month, t.statutory_day);
      is_shifted := EXTRACT(DOW FROM stat_date) = 0;  -- 0 = Sunday in PostgreSQL
      obs_date   := CASE WHEN is_shifted THEN stat_date + 1 ELSE stat_date END;

      INSERT INTO holidays (name, holiday_date, recurring, enabled, holiday_type, auto_shift_sunday,
                            statutory_month, statutory_day, year, is_observed, notes, created_at, updated_at)
      VALUES (t.name, obs_date, FALSE, TRUE, 'STATUTORY_FIXED', TRUE,
              t.statutory_month, t.statutory_day, yr, is_shifted, t.notes, NOW(), NOW());
    END LOOP;
  END LOOP;
END $$;
