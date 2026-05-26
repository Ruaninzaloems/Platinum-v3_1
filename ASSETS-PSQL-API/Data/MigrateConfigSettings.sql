-- MigrateConfigSettings.sql
-- Creates AAAA_ConfigSettings table if it does not already exist.
-- Column names are preserved exactly from the SQL Server source schema (shared table).

CREATE TABLE IF NOT EXISTS "AAAA_ConfigSettings" (
    "ConfigSett_ID"              SERIAL PRIMARY KEY,
    "KeyName"                    VARCHAR(100),
    "KeyValue"                   VARCHAR(500),
    "KeyDescription"             VARCHAR(500),
    "Module"                     VARCHAR(100),
    "DateCaptured"               TIMESTAMP,
    "CapturerID"                 INTEGER,
    "perMuni_SetupRequirements"  BOOLEAN NOT NULL DEFAULT FALSE
);
