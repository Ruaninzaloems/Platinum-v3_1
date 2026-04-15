DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Asset_WIP_Register_Items'
      AND column_name = 'UoM'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE "Asset_WIP_Register_Items"
      ALTER COLUMN "UoM" TYPE TEXT USING CAST("UoM" AS TEXT);
  END IF;
END $$;
