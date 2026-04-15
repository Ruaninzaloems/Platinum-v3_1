DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Asset_Register_Items'
      AND column_name = 'Department'
  ) THEN
    UPDATE "Asset_Register_Items"
    SET "MunicipalDepartment_ID" = "Department"::TEXT
    WHERE "Department" IS NOT NULL
      AND ("MunicipalDepartment_ID" IS NULL OR "MunicipalDepartment_ID" = '');

    ALTER TABLE "Asset_Register_Items" DROP COLUMN "Department";
  END IF;
END
$$;
