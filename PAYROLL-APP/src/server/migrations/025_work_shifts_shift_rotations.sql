-- Migration 025: Work Shifts & Shift Rotations schema update
-- Adds legacy Platinum ERP columns to work_shifts and shift_rotations,
-- creates shift_rotation_details, and sets sequences safely above legacy
-- ID ranges so historical IDs can be inserted without sequence collision.
--
-- SERIAL columns allow explicit id inserts at any time without special syntax.
-- After importing legacy data with explicit IDs run the post-migration step
-- at the bottom of this file to re-align each sequence.

ALTER TABLE work_shifts
  ADD COLUMN IF NOT EXISTS night_hours      NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color            VARCHAR(20)  DEFAULT '#1976D2',
  ADD COLUMN IF NOT EXISTS break_start_time TIME,
  ADD COLUMN IF NOT EXISTS break_end_time   TIME,
  ADD COLUMN IF NOT EXISTS break_hours      NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by       INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP    DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by       INTEGER;

ALTER TABLE shift_rotations
  ADD COLUMN IF NOT EXISTS short_description       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS condition_of_service_id INTEGER,
  ADD COLUMN IF NOT EXISTS employee_subtype_id      INTEGER,
  ADD COLUMN IF NOT EXISTS start_date               DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date                 DATE DEFAULT '9999-12-31',
  ADD COLUMN IF NOT EXISTS no_of_weeks              INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by               INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by               INTEGER;

CREATE TABLE IF NOT EXISTS shift_rotation_details (
  id                SERIAL PRIMARY KEY,
  description       VARCHAR(100) NOT NULL,
  shift_rotation_id INTEGER      NOT NULL REFERENCES shift_rotations(id) ON DELETE CASCADE,
  week_no           INTEGER      NOT NULL DEFAULT 1,
  monday            INTEGER      REFERENCES work_shifts(id),
  tuesday           INTEGER      REFERENCES work_shifts(id),
  wednesday         INTEGER      REFERENCES work_shifts(id),
  thursday          INTEGER      REFERENCES work_shifts(id),
  friday            INTEGER      REFERENCES work_shifts(id),
  saturday          INTEGER      REFERENCES work_shifts(id),
  sunday            INTEGER      REFERENCES work_shifts(id),
  enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by        INTEGER,
  created_at        TIMESTAMP    DEFAULT NOW(),
  updated_at        TIMESTAMP    DEFAULT NOW(),
  updated_by        INTEGER
);

-- Set sequences well above the expected Platinum legacy ID range (typically < 10 000).
-- SERIAL columns accept any explicit id without special syntax; these setval calls
-- only prevent the auto-generated ids from colliding with newly inserted legacy rows.
SELECT setval('work_shifts_id_seq',
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM work_shifts) + 1, 100000));
SELECT setval('shift_rotations_id_seq',
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM shift_rotations) + 1, 100000));
SELECT setval('shift_rotation_details_id_seq',
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM shift_rotation_details) + 1, 100000));

-- POST-MIGRATION STEP (run after bulk-inserting legacy data with explicit IDs):
-- SELECT setval('work_shifts_id_seq',            (SELECT MAX(id) FROM work_shifts)            + 1);
-- SELECT setval('shift_rotations_id_seq',        (SELECT MAX(id) FROM shift_rotations)        + 1);
-- SELECT setval('shift_rotation_details_id_seq', (SELECT MAX(id) FROM shift_rotation_details) + 1);
