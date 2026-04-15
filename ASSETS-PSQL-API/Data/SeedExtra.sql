
-- Const_Asset_Condition seed data
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 7, 'Fair', 1, '2021-06-11 13:27:33.833', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 7);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 8, 'Good', 1, '2021-06-11 13:27:49.287', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 8);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 9, 'Not Applicable', 1, '2021-06-11 13:28:02.417', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 9);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 10, 'Poor', 1, '2021-06-11 13:28:15.617', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 10);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 11, 'Very Good', 1, '2021-06-11 13:28:28.290', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 11);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 12, 'Very Poor', 1, '2021-06-11 13:28:42.943', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 12);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 13, 'Scrap', 1, '2021-06-17 10:15:30.017', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 13);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 14, 'Not Verified', 1, '2021-06-17 10:15:44.387', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 14);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 15, 'Disposed', 1, '2022-05-18 12:38:22.240', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 15);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 16, 'Write-off', 1, '2022-05-27 14:56:50.410', 251
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 16);
INSERT INTO "Const_Asset_Condition" ("Asset_Condition_ID", "Description", "Enabled", "DateCaptured", "CapturerID")
SELECT 17, 'Not Assessed', 1, '2024-10-07 13:12:28.703', 199
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Condition" WHERE "Asset_Condition_ID" = 17);
SELECT setval(pg_get_serial_sequence('"Const_Asset_Condition"', 'Asset_Condition_ID'), (SELECT COALESCE(MAX("Asset_Condition_ID"),0) FROM "Const_Asset_Condition"));

-- Const_Asset_Criticality_Grade seed data
INSERT INTO "Const_Asset_Criticality_Grade" ("AssetCriticalityGradeID", "AssetCriticalityGradeDesc", "ConsequenceOfFailure", "QualitiveDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 1, 'Cursory', 'Insignificant', 'Is readily observed under normal operating conditions', 1, '2020-06-06 15:00:01.707', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Criticality_Grade" WHERE "AssetCriticalityGradeID" = 1);
INSERT INTO "Const_Asset_Criticality_Grade" ("AssetCriticalityGradeID", "AssetCriticalityGradeDesc", "ConsequenceOfFailure", "QualitiveDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 2, 'Non-Critical', 'Minor', 'Can be managed', 1, '2020-06-06 15:00:01.817', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Criticality_Grade" WHERE "AssetCriticalityGradeID" = 2);
INSERT INTO "Const_Asset_Criticality_Grade" ("AssetCriticalityGradeID", "AssetCriticalityGradeDesc", "ConsequenceOfFailure", "QualitiveDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 3, 'Important', 'Moderate', 'Can be managed but requires additional resources and management effort', 1, '2020-06-06 15:00:01.863', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Criticality_Grade" WHERE "AssetCriticalityGradeID" = 3);
INSERT INTO "Const_Asset_Criticality_Grade" ("AssetCriticalityGradeID", "AssetCriticalityGradeDesc", "ConsequenceOfFailure", "QualitiveDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 4, 'Critical', 'Major', 'Will have a prolonged impact and extensive consequences', 1, '2020-06-06 15:00:01.923', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Criticality_Grade" WHERE "AssetCriticalityGradeID" = 4);
INSERT INTO "Const_Asset_Criticality_Grade" ("AssetCriticalityGradeID", "AssetCriticalityGradeDesc", "ConsequenceOfFailure", "QualitiveDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 5, 'Most Critical', 'Catastrophic', 'Irreversible and extensive impacts, or significantly, or significantly underlying key business objectives', 1, '2020-06-06 15:00:01.973', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Criticality_Grade" WHERE "AssetCriticalityGradeID" = 5);
SELECT setval(pg_get_serial_sequence('"Const_Asset_Criticality_Grade"', 'AssetCriticalityGradeID'), (SELECT COALESCE(MAX("AssetCriticalityGradeID"),0) FROM "Const_Asset_Criticality_Grade"));

-- Const_Asset_Health_Grade seed data
INSERT INTO "Const_Asset_Health_Grade" ("AssetHealthGradeID", "AssetHealthGradeDesc", "DRC", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 1, 'Very good', '61% or more', 1, '2020-06-06 15:00:02.707', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Health_Grade" WHERE "AssetHealthGradeID" = 1);
INSERT INTO "Const_Asset_Health_Grade" ("AssetHealthGradeID", "AssetHealthGradeDesc", "DRC", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 2, 'Good', '54 to 60%', 1, '2020-06-06 15:00:02.817', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Health_Grade" WHERE "AssetHealthGradeID" = 2);
INSERT INTO "Const_Asset_Health_Grade" ("AssetHealthGradeID", "AssetHealthGradeDesc", "DRC", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 3, 'Fair', '47 to 53%', 1, '2020-06-06 15:00:02.863', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Health_Grade" WHERE "AssetHealthGradeID" = 3);
INSERT INTO "Const_Asset_Health_Grade" ("AssetHealthGradeID", "AssetHealthGradeDesc", "DRC", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 4, 'Poor', '40% to 46%', 1, '2020-06-06 15:00:02.923', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Health_Grade" WHERE "AssetHealthGradeID" = 4);
INSERT INTO "Const_Asset_Health_Grade" ("AssetHealthGradeID", "AssetHealthGradeDesc", "DRC", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 5, 'Very poor', 'Less than 39%', 1, '2020-06-06 15:00:02.987', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Health_Grade" WHERE "AssetHealthGradeID" = 5);
SELECT setval(pg_get_serial_sequence('"Const_Asset_Health_Grade"', 'AssetHealthGradeID'), (SELECT COALESCE(MAX("AssetHealthGradeID"),0) FROM "Const_Asset_Health_Grade"));

-- Const_Asset_Performance_Grade seed data
INSERT INTO "Const_Asset_Performance_Grade" ("AssetPerformanceGradeID", "AssetPerformanceGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 1, 'Substantially exceeds requirements', 1, '2020-06-06 15:00:02.033', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Performance_Grade" WHERE "AssetPerformanceGradeID" = 1);
INSERT INTO "Const_Asset_Performance_Grade" ("AssetPerformanceGradeID", "AssetPerformanceGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 2, 'Exceeds requirements moderately', 1, '2020-06-06 15:00:02.143', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Performance_Grade" WHERE "AssetPerformanceGradeID" = 2);
INSERT INTO "Const_Asset_Performance_Grade" ("AssetPerformanceGradeID", "AssetPerformanceGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 3, 'Meets requirements', 1, '2020-06-06 15:00:02.207', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Performance_Grade" WHERE "AssetPerformanceGradeID" = 3);
INSERT INTO "Const_Asset_Performance_Grade" ("AssetPerformanceGradeID", "AssetPerformanceGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 4, 'Moderate non-compliance', 1, '2020-06-06 15:00:02.270', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Performance_Grade" WHERE "AssetPerformanceGradeID" = 4);
INSERT INTO "Const_Asset_Performance_Grade" ("AssetPerformanceGradeID", "AssetPerformanceGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 5, 'Substantial non-compliance', 1, '2020-06-06 15:00:02.317', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Performance_Grade" WHERE "AssetPerformanceGradeID" = 5);
SELECT setval(pg_get_serial_sequence('"Const_Asset_Performance_Grade"', 'AssetPerformanceGradeID'), (SELECT COALESCE(MAX("AssetPerformanceGradeID"),0) FROM "Const_Asset_Performance_Grade"));

-- Const_Asset_Utilisation_Grade seed data
INSERT INTO "Const_Asset_Utilisation_Grade" ("AssetUtilisationGradeID", "AssetUtilisationGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 1, 'Not Used', 1, '2020-06-06 15:00:02.377', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Utilisation_Grade" WHERE "AssetUtilisationGradeID" = 1);
INSERT INTO "Const_Asset_Utilisation_Grade" ("AssetUtilisationGradeID", "AssetUtilisationGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 2, 'Underused', 1, '2020-06-06 15:00:02.487', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Utilisation_Grade" WHERE "AssetUtilisationGradeID" = 2);
INSERT INTO "Const_Asset_Utilisation_Grade" ("AssetUtilisationGradeID", "AssetUtilisationGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 3, 'Normal use', 1, '2020-06-06 15:00:02.533', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Utilisation_Grade" WHERE "AssetUtilisationGradeID" = 3);
INSERT INTO "Const_Asset_Utilisation_Grade" ("AssetUtilisationGradeID", "AssetUtilisationGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 4, 'At capacity', 1, '2020-06-06 15:00:02.597', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Utilisation_Grade" WHERE "AssetUtilisationGradeID" = 4);
INSERT INTO "Const_Asset_Utilisation_Grade" ("AssetUtilisationGradeID", "AssetUtilisationGradeDesc", "Enabled", "DateCaptured", "CapturerID", "Default")
SELECT 5, 'Overloaded', 1, '2020-06-06 15:00:02.660', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_Utilisation_Grade" WHERE "AssetUtilisationGradeID" = 5);
SELECT setval(pg_get_serial_sequence('"Const_Asset_Utilisation_Grade"', 'AssetUtilisationGradeID'), (SELECT COALESCE(MAX("AssetUtilisationGradeID"),0) FROM "Const_Asset_Utilisation_Grade"));


  -- CIDMS Accounting Group seed data
  INSERT INTO "Const_Asset_CIDMS_Accounting_Group" ("AssetAccountGroupID", "AssetAccountGroupDesc", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '1', 'Investment property', '1', '2020-01-28 15:21:21.310', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Group" WHERE "AssetAccountGroupID" = 1);
INSERT INTO "Const_Asset_CIDMS_Accounting_Group" ("AssetAccountGroupID", "AssetAccountGroupDesc", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '2', 'Property, plant and equipment', '1', '2020-01-28 15:21:21.310', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Group" WHERE "AssetAccountGroupID" = 2);
INSERT INTO "Const_Asset_CIDMS_Accounting_Group" ("AssetAccountGroupID", "AssetAccountGroupDesc", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '3', 'Intangible assets', '1', '2020-01-28 15:21:21.310', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Group" WHERE "AssetAccountGroupID" = 3);
INSERT INTO "Const_Asset_CIDMS_Accounting_Group" ("AssetAccountGroupID", "AssetAccountGroupDesc", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '4', 'Heritage assets', '1', '2020-01-28 15:21:21.310', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Group" WHERE "AssetAccountGroupID" = 4);
INSERT INTO "Const_Asset_CIDMS_Accounting_Group" ("AssetAccountGroupID", "AssetAccountGroupDesc", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '5', 'Construction Work-in-progress', '1', '2022-06-07 12:38:34.550', '251', '2024-12-11 12:49:07.760', '196', '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Group" WHERE "AssetAccountGroupID" = 5);
SELECT setval(pg_get_serial_sequence('"Const_Asset_CIDMS_Accounting_Group"', 'AssetAccountGroupID'), (SELECT COALESCE(MAX("AssetAccountGroupID"),1) FROM "Const_Asset_CIDMS_Accounting_Group"));

  -- CIDMS Accounting Sub Group seed data
  INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '1', 'Other assets', '2', '1', '2020-01-28 15:25:05.407', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 1);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '2', 'Intangible assets', '3', '1', '2020-01-28 15:25:05.407', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 2);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '3', 'Heritage assets', '4', '1', '2020-01-28 15:25:05.407', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 3);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '4', 'Investment property', '1', '1', '2020-01-28 15:25:05.407', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 4);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '5', 'Community assets', '2', '1', '2020-01-28 15:25:05.407', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 5);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '6', 'Infrastructure assets', '2', '1', '2020-01-28 15:25:05.407', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 6);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '7', 'Community Assets', '5', '1', '2022-06-07 12:43:59.787', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 7);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '8', 'Outsourced', '5', '1', '2022-10-06 11:44:32.183', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 8);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '9', 'Other Assets', '5', '1', '2024-04-18 12:22:09.863', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 9);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '10', 'Infrastructure assets', '5', '1', '2024-04-18 12:22:24.567', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 10);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '11', 'Furniture and Office Equipment', '2', '1', '2024-04-19 15:59:05.307', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 11);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '12', 'Computer Equipment', '2', '1', '2024-04-19 15:59:20.703', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 12);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '13', 'Machinery and Equipment', '2', '1', '2024-04-19 15:59:33.967', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 13);
INSERT INTO "Const_Asset_CIDMS_Accounting_Sub_Group" ("AssetAccountSubGroupID", "AssetAccountSubGroupDesc", "AssetAccountGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '14', 'Transport Assets', '2', '1', '2024-04-19 15:59:49.973', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Accounting_Sub_Group" WHERE "AssetAccountSubGroupID" = 14);
SELECT setval(pg_get_serial_sequence('"Const_Asset_CIDMS_Accounting_Sub_Group"', 'AssetAccountSubGroupID'), (SELECT COALESCE(MAX("AssetAccountSubGroupID"),1) FROM "Const_Asset_CIDMS_Accounting_Sub_Group"));

  -- CIDMS Class seed data
  INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '1', 'Housing', '1', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 1);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '2', 'Operational buildings', '1', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 2);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '3', 'Licences and rights', '2', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 3);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '4', 'Servitudes', '2', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 4);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '5', 'Conservation areas', '3', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 5);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '6', 'Historic buildings', '3', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 6);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '7', 'Monuments', '3', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 7);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '8', 'Other heritage', '3', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 8);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '9', 'Works of art', '3', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 9);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '10', 'Investment property', '4', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 10);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '11', 'Community facilities', '5', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 11);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '12', 'Community facilities, operational buildings, sports and recreational facilities and housing', '5', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 12);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '13', 'Sport and recreation facilities', '5', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 13);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '14', 'Coastal infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 14);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '15', 'Electrical infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 15);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '16', 'Information and communications infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 16);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '17', 'Rail infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 17);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '18', 'Roads infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 18);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '19', 'Sanitation infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 19);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '20', 'Solid-waste infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 20);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '21', 'Stormwater infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 21);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '22', 'Water-supply infrastructure', '6', '1', '2020-01-28 15:27:49.263', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 22);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '23', 'Furniture and Office Equipment', '1', '1', '2021-05-07 15:32:29.333', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 23);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '24', 'Information and Communication Infrastructure', '1', '1', '2021-05-07 15:38:07.280', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 24);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '25', 'Machinery and Equipment', '1', '1', '2021-05-07 15:38:28.637', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 25);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '26', 'Transport Assets', '1', '1', '2021-05-07 15:38:49.463', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 26);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '27', 'Community Facilities', '1', '1', '2021-06-14 11:03:06.440', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 27);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '28', 'Computer Equipment', '1', '1', '2021-06-15 16:59:44.953', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 28);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '29', 'Security Measures', '1', '1', '2021-11-11 08:30:15.013', '199', '2021-11-11 08:40:03.713', '199', NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 29);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '30', 'Sport and Recreation Facilities', '7', '1', '2022-06-07 12:45:41.467', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 30);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '31', 'Community Facilities', '7', '1', '2022-06-07 12:46:21.243', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 31);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '32', 'Land', '1', '1', '2022-10-04 12:05:22.140', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 32);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '33', 'Other assets', '1', '1', '2022-10-06 08:24:27.977', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 33);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '34', 'Community Facilities', '8', '1', '2022-10-06 11:53:56.120', '252', '2022-10-06 16:02:00.360', '252', NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 34);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '35', 'Electrical Infrastructure', '8', '1', '2022-10-06 16:02:35.700', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 35);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '36', 'Roads Infrastructure', '8', '1', '2022-10-06 16:03:51.553', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 36);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '37', 'Sport and Recreation Facilities', '8', '1', '2022-10-06 16:05:01.677', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 37);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '38', 'Other', '2', '1', '2022-11-30 12:38:27.597', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 38);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '39', 'Electrical Infrastructure', '10', '1', '2024-04-18 12:24:17.070', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 39);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '40', 'Roads infrastructure', '10', '1', '2024-04-18 12:24:29.627', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 40);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '41', 'Housing', '9', '1', '2024-04-18 12:24:48.773', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 41);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '42', 'Operational Buildings', '9', '1', '2024-04-18 12:24:57.560', '562', '2024-12-11 06:33:33.000', '271', '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 42);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '43', 'Furniture and Office Equipment', '11', '1', '2024-04-19 16:02:02.717', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 43);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '44', 'Computer Equipment', '12', '1', '2024-04-19 16:02:12.480', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 44);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '45', 'Machinery and Equipment', '13', '1', '2024-04-19 16:02:26.043', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 45);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '46', 'Transport Assets', '14', '1', '2024-04-19 16:02:34.420', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 46);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '47', 'Clearview Fence', '6', '1', '2025-02-03 16:04:47.027', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 47);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '48', 'Drone', '11', '1', '2025-02-17 11:22:06.930', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 48);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '49', 'Firearms', '1', '1', '2025-02-25 12:57:08.407', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 49);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '50', 'Community Assets', '7', '1', '2025-03-12 08:12:09.273', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 50);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '51', 'Buildings', '4', '1', '2025-11-11 16:08:06.570', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 51);
INSERT INTO "Const_Asset_CIDMS_Class" ("AssetCIDMSClassID", "AssetCIDMSClassDesc", "AssetAccountSubGroupID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '52', 'Outdoor Furniture', '4', '1', '2025-11-11 16:48:00.037', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Class" WHERE "AssetCIDMSClassID" = 52);
SELECT setval(pg_get_serial_sequence('"Const_Asset_CIDMS_Class"', 'AssetCIDMSClassID'), (SELECT COALESCE(MAX("AssetCIDMSClassID"),1) FROM "Const_Asset_CIDMS_Class"));

  -- CIDMS Group Type seed data
  INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '2', 'Attenuation', '21', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 2);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '3', 'Borehole', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 3);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '4', 'Bulk mains', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 4);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '5', 'Capital spares', '12', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 5);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '6', 'Capital spares', '14', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 6);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '7', 'Capital spares', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 7);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '8', 'Capital spares', '16', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 8);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '9', 'Capital spares', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 9);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '10', 'Capital spares', '18', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 10);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '11', 'Capital spares', '19', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 11);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '12', 'Capital spares', '20', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 12);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '13', 'Capital spares', '21', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 13);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '14', 'Capital spares', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 14);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '15', 'Core layers', '16', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 15);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '16', 'Dams and weirs', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 16);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '17', 'Data centres', '16', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 17);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '18', 'Distribution', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 18);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '19', 'Distribution layers', '16', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 19);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '20', 'Drainage collection', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 20);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '21', 'Drainage collection', '21', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 21);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '22', 'Effluent licences', '3', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 22);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '23', 'General buildings and open spaces', '12', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 23);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '24', 'HV substations', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 24);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '25', 'HV switching stations', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 25);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '26', 'HV transmission conductors', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 26);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '27', 'Improved property', '10', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 27);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '28', 'LV networks', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 28);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '29', 'LV networks', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 29);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '30', 'MV networks', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 30);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '31', 'MV networks', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 31);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '32', 'MV substations', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 32);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '33', 'MV substations', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 33);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '34', 'MV switching stations', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 34);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '35', 'MV switching stations', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 35);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '36', 'Outfall sewers', '19', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 36);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '37', 'Piers', '14', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 37);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '38', 'Power plants', '15', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 38);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '39', 'Promenade', '14', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 39);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '40', 'PRV station', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 40);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '41', 'Pump stations', '19', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 41);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '42', 'Pump stations', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 42);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '43', 'Rail furniture', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 43);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '44', 'Rail lines', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 44);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '45', 'Rail structures', '17', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 45);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '46', 'Reservoirs', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 46);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '47', 'Reticulation', '19', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 47);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '48', 'Revetments', '14', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 48);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '49', 'Road furniture', '18', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 49);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '50', 'Road structures', '18', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 50);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '51', 'Roads', '18', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 51);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '52', 'Sand pumps', '14', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 52);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '53', 'Servitudes', '4', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 53);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '54', 'Solid waste licences', '3', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 54);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '55', 'Stormwater conveyance', '21', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 55);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '56', 'Toilet facilities', '19', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 56);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '57', 'Unimproved property', '10', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 57);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '58', 'Waste transfer stations, processing facilities, and landfill sites', '20', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 58);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '59', 'Waste-water treatment works', '19', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 59);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '60', 'Water rights', '3', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 60);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '61', 'Water treatment works', '22', '1', '2020-01-28 15:31:06.077', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 61);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '62', 'Furniture and Fitting', '23', '1', '2021-05-07 15:33:45.847', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 62);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '63', 'Kitchen Appliances', '23', '1', '2021-05-07 15:34:22.767', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 63);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '64', 'Office Equipment', '23', '1', '2021-05-07 15:34:46.073', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 64);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '65', 'Security Item', '24', '1', '2021-05-07 15:46:42.990', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 65);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '66', 'Plant Machinery and Equipment', '25', '1', '2021-05-07 15:47:19.863', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 66);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '67', 'Motor Vehicles', '26', '1', '2021-05-07 15:47:51.720', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 67);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '68', 'Taxi Ranks - Bus Terminals', '11', '1', '2021-06-11 14:24:00.937', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 68);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '69', 'Testing Stations', '11', '1', '2021-06-11 14:36:16.297', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 69);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '70', 'Cemeteries - Crematoria', '11', '1', '2021-06-14 10:31:28.507', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 70);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '71', 'Centres', '11', '1', '2021-06-14 10:31:47.530', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 71);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '72', 'Clinics - Care Centres', '11', '1', '2021-06-14 10:32:04.147', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 72);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '73', 'Halls', '11', '1', '2021-06-14 10:32:19.257', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 73);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '74', 'Libraries', '11', '1', '2021-06-14 10:32:51.397', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 74);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '75', 'Parks', '11', '1', '2021-06-14 10:33:11.723', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 75);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '76', 'Public Open Space', '11', '1', '2021-06-14 10:33:35.600', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 76);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '77', 'Stalls', '11', '1', '2021-06-14 10:34:04.440', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 77);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '78', 'Outdoor Facilities', '13', '1', '2021-06-14 10:35:30.493', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 78);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '79', 'Halls', '27', '1', '2021-06-14 11:04:01.583', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 79);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '80', 'Municipal Offices', '2', '1', '2021-06-14 11:04:36.103', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 80);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '81', 'Computer Equipment', '28', '1', '2021-06-15 17:00:42.773', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 81);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '82', 'Audio Visual Equipment', '24', '1', '2021-06-15 17:01:05.740', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 82);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '83', 'Security Measures', '29', '1', '2021-11-11 08:42:21.377', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 83);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '84', 'Community Facilities', '11', '1', '2022-05-19 14:11:03.487', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 84);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '85', 'Halls', '31', '1', '2022-06-07 12:46:56.730', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 85);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '86', 'Testing Stations', '31', '1', '2022-06-07 12:47:12.300', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 86);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '87', 'Taxi Ranks - Bus Terminals', '31', '1', '2022-06-07 12:47:29.503', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 87);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '88', 'Community Facilities', '31', '1', '2022-06-07 12:47:52.727', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 88);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '89', 'Outdoor Facilities', '30', '1', '2022-06-07 12:48:34.070', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 89);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '90', 'Land', '32', '1', '2022-10-04 12:06:35.383', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 90);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '91', 'Nursery', '11', '1', '2022-10-05 11:11:06.730', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 91);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '92', 'Security Item', '29', '1', '2022-10-05 16:26:31.793', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 92);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '93', 'Other assets', '33', '1', '2022-10-06 08:32:24.480', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 93);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '94', 'Machinery And Electrical Equipment', '25', '1', '2022-10-06 10:09:26.530', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 94);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '95', 'Furniture And Fittings', '25', '1', '2022-10-06 10:09:50.907', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 95);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '96', 'Municipal Jewellery', '8', '1', '2022-10-06 12:26:31.690', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 96);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '97', 'Animal Pound', '31', '1', '2022-10-07 12:45:36.703', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 97);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '98', 'Drainage', '13', '1', '2022-10-07 14:22:28.957', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 98);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '99', 'Buildings', '13', '1', '2022-10-07 14:22:42.800', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 99);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '100', 'External Facilities', '13', '1', '2022-10-07 14:22:54.173', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 100);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '101', 'Animal Pound', '11', '1', '2022-10-10 09:09:16.113', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 101);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '102', 'Culturally Significant Buildings', '7', '1', '2022-10-10 10:08:15.223', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 102);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '103', 'Markets', '11', '1', '2022-11-17 13:18:00.887', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 103);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '104', 'Computer Software', '38', '1', '2022-11-30 12:39:03.970', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 104);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '105', 'Land', '11', '1', '2024-04-15 11:16:40.990', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 105);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '106', 'Municipal Offices', '11', '1', '2024-04-15 18:04:11.327', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 106);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '107', 'LV Networks', '39', '1', '2024-04-18 12:27:13.830', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 107);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '108', 'Social Housing', '41', '1', '2024-04-18 12:27:29.233', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 108);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '109', 'Municipal Offices', '42', '1', '2024-04-18 12:27:44.043', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 109);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '110', 'Roads', '40', '1', '2024-04-19 14:34:23.713', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 110);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '111', 'Furniture and Office Equipment', '43', '1', '2024-04-19 16:03:44.020', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 111);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '112', 'Computer Equipment', '44', '1', '2024-04-19 16:04:00.970', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 112);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '113', 'Machinery and Equipment', '45', '1', '2024-04-19 16:04:07.887', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 113);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '114', 'Motor Vehicles', '46', '1', '2024-04-19 16:04:14.760', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 114);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '115', 'Housing', '2', '1', '2024-10-07 18:26:00.003', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 115);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '116', 'Investment Property', '10', '1', '2024-10-07 18:29:17.567', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 116);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '117', 'Parks', '31', '1', '2024-10-07 18:50:57.303', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 117);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '118', 'Building Roof', '11', '1', '2025-01-28 17:53:01.497', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 118);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '119', 'Furniture and fitting', '48', '1', '2025-02-17 11:24:43.233', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 119);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '120', 'General buildings and open spaces', '11', '1', '2025-02-26 10:04:28.690', '271', '2025-02-26 10:36:57.853', '271', '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 120);
INSERT INTO "Const_Asset_CIDMS_Group_Type" ("AssetCIDMSGroupTypeID", "AssetCIDMSGroupTypeDesc", "AssetCIDMSClassID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '121', 'Community Assets', '50', '1', '2025-03-12 08:19:31.760', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Group_Type" WHERE "AssetCIDMSGroupTypeID" = 121);
SELECT setval(pg_get_serial_sequence('"Const_Asset_CIDMS_Group_Type"', 'AssetCIDMSGroupTypeID'), (SELECT COALESCE(MAX("AssetCIDMSGroupTypeID"),1) FROM "Const_Asset_CIDMS_Group_Type"));

  -- CIDMS Asset Type seed data
  INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '1', 'as applicable', '5', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 1);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '2', 'as applicable (from above)', '5', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 2);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '3', 'Boiler plants', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 3);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '4', 'Buildings', '15', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 4);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '5', 'Buildings', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 5);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '6', 'Buildings', '17', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 6);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '7', 'Buildings', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 7);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '8', 'Buildings', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 8);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '9', 'Buildings', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 9);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '10', 'Buildings', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 10);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '11', 'Buildings', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 11);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '12', 'Buildings', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 12);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '13', 'Buildings', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 13);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '14', 'Buildings', '40', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 14);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '15', 'Buildings', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 15);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '16', 'Buildings', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 16);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '17', 'Buildings', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 17);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '18', 'Buildings', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 18);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '19', 'Buildings', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 19);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '20', 'Buildings', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 20);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '21', 'Civil structures', '2', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 21);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '22', 'Civil structures', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 22);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '23', 'Civil structures', '15', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 23);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '24', 'Civil structures', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 24);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '25', 'Civil structures', '20', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 25);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '26', 'Civil structures', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 26);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '27', 'Civil structures', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 27);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '28', 'Civil structures', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 28);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '29', 'Civil structures', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 29);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '30', 'Civil structures', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 30);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '31', 'Civil structures', '36', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 31);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '32', 'Civil structures', '37', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 32);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '33', 'Civil structures', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 33);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '34', 'Civil structures', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 34);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '35', 'Civil structures', '40', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 35);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '36', 'Civil structures', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 36);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '37', 'Civil structures', '45', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 37);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '38', 'Civil structures', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 38);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '39', 'Civil structures', '47', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 39);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '40', 'Civil structures', '48', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 40);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '41', 'Civil structures', '49', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 41);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '42', 'Civil structures', '50', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 42);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '43', 'Civil structures', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 43);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '44', 'Civil structures', '55', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 44);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '45', 'Civil structures', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 45);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '46', 'Civil structures', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 46);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '47', 'Civil structures', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 47);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '48', 'Communal sanitation', '56', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 48);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '49', 'Communal standpipes', '18', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 49);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '50', 'Communication equipment', '15', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 50);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '51', 'Communication equipment', '19', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 51);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '52', 'Communication equipment', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 52);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '53', 'Communication equipment', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 53);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '54', 'Communication equipment', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 54);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '55', 'Communication equipment', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 55);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '56', 'Control and instrumentation', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 56);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '57', 'Control and instrumentation', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 57);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '58', 'Control and instrumentation', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 58);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '59', 'Control and instrumentation', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 59);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '60', 'Control and instrumentation', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 60);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '61', 'Control and instrumentation', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 61);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '62', 'Control and instrumentation', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 62);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '63', 'Control and instrumentation', '40', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 63);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '64', 'Control and instrumentation', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 64);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '65', 'Control and instrumentation', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 65);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '66', 'Control and instrumentation', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 66);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '67', 'Control and instrumentation', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 67);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '68', 'Control and instrumentation', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 68);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '69', 'DC systems', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 69);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '70', 'DC systems', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 70);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '71', 'DC systems', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 71);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '72', 'DC systems', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 72);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '73', 'DC systems', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 73);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '74', 'DC systems', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 74);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '75', 'DC systems', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 75);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '76', 'DC systems', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 76);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '77', 'Drainage', '2', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 77);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '78', 'Drainage', '20', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 78);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '79', 'Drainage', '55', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 79);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '80', 'Drainage', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 80);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '81', 'Earthworks', '2', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 81);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '82', 'Earthworks', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 82);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '83', 'Earthworks', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 83);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '84', 'Earthworks', '20', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 84);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '85', 'Earthworks', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 85);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '86', 'Earthworks', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 86);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '87', 'Earthworks', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 87);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '88', 'Earthworks', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 88);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '89', 'Earthworks', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 89);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '90', 'Earthworks', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 90);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '91', 'Earthworks', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 91);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '92', 'Earthworks', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 92);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '93', 'Earthworks', '44', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 93);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '94', 'Earthworks', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 94);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '95', 'Earthworks', '48', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 95);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '96', 'Earthworks', '51', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 96);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '97', 'Earthworks', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 97);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '98', 'Earthworks', '55', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 98);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '99', 'Earthworks', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 99);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '100', 'Earthworks', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 100);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '101', 'Earthworks', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 101);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '102', 'Effluent licences', '22', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 102);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '103', 'Electrical equipment', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 103);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '104', 'Electrical equipment', '4', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 104);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '105', 'Electrical equipment', '15', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 105);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '106', 'Electrical equipment', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 106);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '107', 'Electrical equipment', '17', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 107);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '108', 'Electrical equipment', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 108);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '109', 'Electrical equipment', '37', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 109);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '110', 'Electrical equipment', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 110);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '111', 'Electrical equipment', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 111);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '112', 'Electrical equipment', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 112);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '113', 'Electrical equipment', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 113);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '114', 'Electrical equipment', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 114);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '115', 'Electrical equipment', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 115);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '116', 'Electrical equipment', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 116);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '117', 'Electrical equipment', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 117);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '118', 'Electricity bulk meter', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 118);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '119', 'Electricity bulk meters', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 119);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '120', 'Electricity bulk meters', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 120);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '121', 'Electricity bulk meters', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 121);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '122', 'Electricity meters', '28', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 122);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '123', 'External facilities', '2', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 123);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '124', 'External facilities', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 124);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '125', 'External facilities', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 125);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '126', 'External facilities', '20', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 126);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '127', 'External facilities', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 127);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '128', 'External facilities', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 128);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '129', 'External facilities', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 129);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '130', 'External facilities', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 130);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '131', 'External facilities', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 131);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '132', 'External facilities', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 132);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '133', 'External facilities', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 133);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '134', 'External facilities', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 134);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '135', 'External facilities', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 135);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '136', 'External facilities', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 136);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '137', 'External facilities', '55', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 137);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '138', 'External facilities', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 138);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '139', 'External facilities', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 139);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '140', 'External facilities', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 140);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '141', 'HV cables', '26', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 141);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '142', 'HV overhead lines', '26', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 142);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '143', 'HV switching station equipment', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 143);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '144', 'HV switching station equipment', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 144);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '145', 'HV switching station equipment', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 145);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '146', 'HV transformers', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 146);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '147', 'HV transformers', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 147);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '148', 'Improved property', '27', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 148);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '149', 'Land', '2', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 149);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '150', 'Land', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 150);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '151', 'Land', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 151);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '152', 'Land', '20', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 152);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '153', 'Land', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 153);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '154', 'Land', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 154);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '155', 'Land', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 155);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '156', 'Land', '26', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 156);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '157', 'Land', '30', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 157);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '158', 'Land', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 158);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '159', 'Land', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 159);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '160', 'Land', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 160);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '161', 'Land', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 161);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '162', 'Land', '40', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 162);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '163', 'Land', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 163);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '164', 'Land', '44', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 164);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '165', 'Land', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 165);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '166', 'Land', '51', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 166);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '167', 'Land', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 167);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '168', 'Land', '55', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 168);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '169', 'Land', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 169);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '170', 'Land', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 170);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '171', 'Land', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 171);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '172', 'LV conductors', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 172);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '173', 'LV conductors', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 173);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '174', 'LV conductors', '28', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 174);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '175', 'LV conductors', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 175);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '176', 'LV conductors', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 176);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '177', 'LV conductors', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 177);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '178', 'LV conductors', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 178);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '179', 'LV conductors', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 179);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '180', 'LV conductors', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 180);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '181', 'LV conductors', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 181);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '182', 'Mechanical equipment', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 182);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '183', 'Mechanical equipment', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 183);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '184', 'Mechanical equipment', '17', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 184);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '185', 'Mechanical equipment', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 185);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '186', 'Mechanical equipment', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 186);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '187', 'Mechanical equipment', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 187);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '188', 'Mechanical equipment', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 188);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '189', 'Mechanical equipment', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 189);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '190', 'Mechanical equipment', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 190);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '191', 'Mechanical equipment', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 191);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '192', 'Mechanical equipment', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 192);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '193', 'Mechanical equipment', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 193);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '194', 'Metal work', '2', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 194);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '195', 'Metal work', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 195);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '196', 'Metal work', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 196);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '197', 'Metal work', '20', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 197);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '198', 'Metal work', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 198);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '199', 'Metal work', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 199);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '200', 'Metal work', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 200);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '201', 'Metal work', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 201);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '202', 'Metal work', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 202);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '203', 'Metal work', '37', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 203);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '204', 'Metal work', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 204);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '205', 'Metal work', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 205);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '206', 'Metal work', '40', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 206);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '207', 'Metal work', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 207);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '208', 'Metal work', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 208);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '209', 'Metal work', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 209);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '210', 'Metal work', '55', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 210);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '211', 'Metal work', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 211);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '212', 'Metal work', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 212);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '213', 'Metal work', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 213);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '214', 'Municipal service connections', '18', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 214);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '215', 'Municipal service connections', '28', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 215);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '216', 'Municipal service connections', '47', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 216);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '217', 'MV conductors', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 217);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '218', 'MV conductors', '30', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 218);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '219', 'MV conductors', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 219);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '220', 'MV conductors', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 220);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '221', 'MV conductors', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 221);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '222', 'MV conductors', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 222);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '223', 'MV conductors', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 223);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '224', 'MV mini-substations', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 224);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '225', 'MV mini-substations', '30', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 225);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '226', 'MV mini-substations', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 226);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '227', 'MV mini-substations', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 227);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '228', 'MV mini-substations', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 228);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '229', 'MV mini-substations', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 229);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '230', 'MV mini-substations', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 230);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '231', 'MV mini-substations', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 231);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '232', 'MV mini-substations', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 232);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '233', 'MV mini-substations', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 233);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '234', 'MV network equipment', '30', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 234);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '235', 'MV network equipment', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 235);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '236', 'MV substation equipment', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 236);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '237', 'MV substation equipment', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 237);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '238', 'MV substation equipment', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 238);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '239', 'MV substation equipment', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 239);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '240', 'MV substation equipment', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 240);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '241', 'MV substation equipment', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 241);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '242', 'MV substation equipment', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 242);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '243', 'MV switching station equipment', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 243);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '244', 'MV switching station equipment', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 244);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '245', 'MV switching station equipment', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 245);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '246', 'MV switching station equipment', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 246);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '247', 'MV switching station equipment', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 247);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '248', 'MV switching station equipment', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 248);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '249', 'MV switching station equipment', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 249);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '250', 'MV transformers', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 250);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '251', 'MV transformers', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 251);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '252', 'MV transformers', '30', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 252);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '253', 'MV transformers', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 253);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '254', 'MV transformers', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 254);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '255', 'MV transformers', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 255);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '256', 'MV transformers', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 256);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '257', 'MV transformers', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 257);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '258', 'MV transformers', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 258);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '259', 'MV transformers', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 259);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '260', 'MV transformers', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 260);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '261', 'Pavements', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 261);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '262', 'Pavements', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 262);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '263', 'Pavements', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 263);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '264', 'Pavements', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 264);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '265', 'Pavements', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 265);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '266', 'Pavements', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 266);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '267', 'Pavements', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 267);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '268', 'Pavements', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 268);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '269', 'Pavements', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 269);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '270', 'Pavements', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 270);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '271', 'Pavements', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 271);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '272', 'Pavements', '51', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 272);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '273', 'Pavements', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 273);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '274', 'Pavements', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 274);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '275', 'Pavements', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 275);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '276', 'Pavements', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 276);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '277', 'Pedestrian bridges', '45', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 277);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '278', 'Pedestrian bridges', '50', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 278);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '279', 'Pipe bridges', '4', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 279);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '280', 'Pipe bridges', '18', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 280);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '281', 'Pipe bridges', '47', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 281);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '282', 'Pipe work', '2', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 282);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '283', 'Pipe work', '3', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 283);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '284', 'Pipe work', '4', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 284);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '285', 'Pipe work', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 285);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '286', 'Pipe work', '18', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 286);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '287', 'Pipe work', '20', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 287);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '288', 'Pipe work', '36', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 288);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '289', 'Pipe work', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 289);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '290', 'Pipe work', '40', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 290);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '291', 'Pipe work', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 291);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '292', 'Pipe work', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 292);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '293', 'Pipe work', '47', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 293);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '294', 'Pipe work', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 294);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '295', 'Pipe work', '55', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 295);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '296', 'Pipe work', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 296);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '297', 'Pipe work', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 297);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '298', 'Pipe work', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 298);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '299', 'Process control and instrumentation', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 299);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '300', 'Provisions', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 300);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '301', 'Public lighting', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 301);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '302', 'Public lighting', '28', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 302);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '303', 'Public lighting', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 303);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '304', 'Public lighting', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 304);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '305', 'Rail bridges', '45', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 305);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '306', 'Rails and ballast', '44', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 306);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '307', 'Rail-side furniture', '43', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 307);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '308', 'Road bridges', '50', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 308);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '309', 'Road furniture', '49', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 309);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '310', 'Road furniture', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 310);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '311', 'Service connection on site', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 311);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '312', 'Service connection on site', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 312);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '313', 'Service connection on site', '61', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 313);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '314', 'Service connections on site', '16', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 314);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '315', 'Service connections on site', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 315);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '316', 'Service connections on site', '24', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 316);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '317', 'Service connections on site', '25', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 317);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '318', 'Service connections on site', '32', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 318);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '319', 'Service connections on site', '34', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 319);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '320', 'Service connections on site', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 320);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '321', 'Service connections on site', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 321);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '322', 'Service connections on site', '41', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 322);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '323', 'Service connections on site', '46', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 323);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '324', 'Service connections on site', '52', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 324);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '325', 'Service connections on site', '58', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 325);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '326', 'Service connections on site', '59', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 326);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '327', 'Servitudes', '53', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 327);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '328', 'Solid waste licences', '54', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 328);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '329', 'Sports facilities', '23', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 329);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '330', 'Sports facilities', '39', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 330);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '331', 'Traffic signals', '49', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 331);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '332', 'Turbine equipment', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 332);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '333', 'Turbine generators', '38', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 333);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '334', 'Unimproved property', '57', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 334);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '335', 'Water rights', '60', '1', '2020-01-28 15:33:20.650', '1', NULL, NULL, '1'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 335);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '336', 'Furniture and Fitting', '62', '1', '2021-05-07 15:36:46.360', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 336);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '337', 'Kitchen Appliances', '63', '1', '2021-05-07 15:45:04.373', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 337);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '338', 'Office Equipment', '64', '1', '2021-05-07 15:45:35.957', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 338);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '339', 'Security Item', '65', '1', '2021-05-07 17:55:17.670', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 339);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '340', 'Plant Machinery and Equipment', '66', '1', '2021-05-10 14:01:31.287', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 340);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '341', 'Motor Vehicles', '67', '1', '2021-05-10 14:03:54.617', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 341);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '342', 'Buildings', '68', '1', '2021-06-11 14:24:58.440', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 342);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '343', 'Civil Structures', '68', '1', '2021-06-11 14:25:17.260', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 343);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '344', 'External Facilities', '68', '1', '2021-06-11 14:25:37.003', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 344);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '345', 'Land', '68', '1', '2021-06-11 14:25:58.320', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 345);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '346', 'Pavements', '68', '1', '2021-06-11 14:26:16.700', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 346);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '347', 'External Facilities', '69', '1', '2021-06-11 14:36:37.497', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 347);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '348', 'Pavements', '57', '1', '2021-06-14 10:05:00.727', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 348);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '349', 'Pavements', '27', '1', '2021-06-14 10:07:30.740', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 349);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '350', 'Land', '27', '1', '2021-06-14 10:07:55.750', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 350);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '351', 'External Facilities', '27', '1', '2021-06-14 10:08:25.027', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 351);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '352', 'Civil Structures', '27', '1', '2021-06-14 10:08:45.480', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 352);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '353', 'Buildings', '27', '1', '2021-06-14 10:09:06.387', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 353);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '354', 'Buildings', '70', '1', '2021-06-14 10:36:57.753', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 354);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '355', 'External Facilities', '70', '1', '2021-06-14 10:37:19.893', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 355);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '356', 'Land', '70', '1', '2021-06-14 10:37:46.123', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 356);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '357', 'Pavements', '70', '1', '2021-06-14 10:38:04.297', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 357);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '358', 'Land', '71', '1', '2021-06-14 10:38:42.037', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 358);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '359', 'Buildings', '71', '1', '2021-06-14 10:39:04.943', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 359);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '360', 'External Facilities', '71', '1', '2021-06-14 10:39:23.170', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 360);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '361', 'Land', '72', '1', '2021-06-14 10:39:59.713', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 361);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '362', 'Buildings', '72', '1', '2021-06-14 10:40:25.593', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 362);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '363', 'External Facilities', '72', '1', '2021-06-14 10:40:51.283', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 363);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '364', 'Buildings', '73', '1', '2021-06-14 10:41:33.347', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 364);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '365', 'Civil Structures', '73', '1', '2021-06-14 10:41:54.283', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 365);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '366', 'External Facilities', '73', '1', '2021-06-14 10:42:41.727', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 366);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '367', 'Land', '73', '1', '2021-06-14 10:43:05.143', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 367);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '368', 'Buildings', '74', '1', '2021-06-14 10:43:39.510', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 368);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '369', 'External Facilities', '74', '1', '2021-06-14 10:43:58.337', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 369);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '370', 'Land', '74', '1', '2021-06-14 10:44:19.220', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 370);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '371', 'Buildings', '75', '1', '2021-06-14 10:46:30.543', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 371);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '372', 'Civil Structures', '75', '1', '2021-06-14 10:47:10.137', '199', '2021-06-15 08:52:35.147', '199', NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 372);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '373', 'External Facilities', '75', '1', '2021-06-14 10:47:39.090', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 373);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '374', 'Land', '75', '1', '2021-06-14 10:47:59.167', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 374);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '375', 'Land', '76', '1', '2021-06-14 10:48:38.460', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 375);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '376', 'Buildings', '77', '1', '2021-06-14 10:49:18.887', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 376);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '377', 'Buildings', '78', '1', '2021-06-14 10:52:49.710', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 377);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '378', 'Civil Structures', '78', '1', '2021-06-14 10:53:16.490', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 378);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '379', 'External Facilities', '78', '1', '2021-06-14 10:53:39.077', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 379);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '380', 'Land', '78', '1', '2021-06-14 10:54:05.320', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 380);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '381', 'Metal Work', '78', '1', '2021-06-14 10:54:28.630', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 381);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '382', 'Pavements', '78', '1', '2021-06-14 10:54:50.607', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 382);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '383', 'Sports Facilities', '78', '1', '2021-06-14 10:55:15.473', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 383);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '384', 'Land', '79', '1', '2021-06-14 11:06:54.890', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 384);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '385', 'Buildings', '80', '1', '2021-06-14 11:07:45.690', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 385);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '386', 'Civil Structures', '80', '1', '2021-06-14 11:08:09.227', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 386);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '387', 'Community Facilities', '80', '1', '2021-06-14 11:10:54.683', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 387);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '388', 'External Facilities', '80', '1', '2021-06-14 11:11:23.013', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 388);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '389', 'Land', '80', '1', '2021-06-14 11:11:45.557', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 389);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '390', 'Pavements', '80', '1', '2021-06-14 11:12:07.630', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 390);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '391', 'Drainage', '21', '1', '2021-06-14 14:11:44.597', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 391);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '392', 'Computer Equipment', '81', '1', '2021-06-15 17:01:56.957', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 392);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '393', 'Audio Visual Equipment', '82', '1', '2021-06-15 17:02:34.783', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 393);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '394', 'Kitchen Appliances', '64', '1', '2021-11-11 08:25:08.537', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 394);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '395', 'Audio Visual Equipment', '62', '1', '2021-11-11 08:27:39.113', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 395);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '396', 'Security Item', '66', '1', '2021-11-11 08:33:47.207', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 396);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '397', 'Security Item', '83', '1', '2021-11-11 08:43:05.463', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 397);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '398', 'Land', '57', '1', '2022-05-18 15:41:26.157', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 398);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '399', 'Drainage', '27', '1', '2022-05-19 09:36:16.770', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 399);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '400', 'Pavements', '74', '1', '2022-05-19 12:48:54.207', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 400);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '401', 'Drainage', '70', '1', '2022-05-19 13:50:01.897', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 401);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '402', 'Pavements', '73', '1', '2022-05-19 13:57:27.140', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 402);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '403', 'Pipe Work', '78', '1', '2022-05-19 14:04:26.160', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 403);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '404', 'External Facilities', '84', '1', '2022-05-19 14:11:36.730', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 404);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '405', 'Drainage', '73', '1', '2022-05-19 15:29:35.673', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 405);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '406', 'Drainage', '78', '1', '2022-05-19 15:29:53.340', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 406);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '407', 'Civil Structures', '74', '1', '2022-05-19 16:06:30.887', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 407);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '408', 'Drainage', '68', '1', '2022-05-19 18:15:41.193', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 408);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '409', 'Earthworks', '70', '1', '2022-05-19 18:35:26.533', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 409);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '410', 'Earthworks', '68', '1', '2022-05-19 18:35:42.170', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 410);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '411', 'External Facilities', '28', '1', '2022-05-19 19:27:21.493', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 411);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '412', 'Pavements', '49', '1', '2022-05-20 11:40:20.293', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 412);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '413', 'Attenuation', '51', '1', '2022-05-20 11:42:09.133', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 413);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '414', 'Drainage', '51', '1', '2022-05-20 11:42:23.980', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 414);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '415', 'Pipe Work', '51', '1', '2022-05-20 11:42:54.293', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 415);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '416', 'Public Lighting', '51', '1', '2022-05-20 11:43:09.813', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 416);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '417', 'Road Bridges', '55', '1', '2022-05-20 14:06:19.883', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 417);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '418', 'Drainage', '80', '1', '2022-06-01 12:04:37.110', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 418);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '419', 'Pipe Work', '80', '1', '2022-06-01 14:17:50.203', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 419);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '420', 'Sports Facilities', '89', '1', '2022-06-07 12:49:24.023', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 420);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '421', 'Buildings', '85', '1', '2022-06-07 12:59:25.387', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 421);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '422', 'Buildings', '86', '1', '2022-06-07 13:06:53.737', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 422);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '423', 'Buildings', '88', '1', '2022-06-07 13:11:30.707', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 423);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '424', 'Buildings', '87', '1', '2022-06-08 11:40:37.980', '251', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 424);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '425', 'Sign Electronic LED', '49', '1', '2022-10-04 09:42:42.470', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 425);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '426', 'Land', '90', '1', '2022-10-04 12:07:28.263', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 426);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '427', 'Public Lighting', '84', '1', '2022-10-05 11:29:09.143', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 427);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '428', 'Parks', '84', '1', '2022-10-05 12:42:30.367', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 428);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '429', 'Halls', '84', '1', '2022-10-05 12:42:56.060', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 429);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '430', 'Security Item', '92', '1', '2022-10-05 16:27:11.030', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 430);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '431', 'Other assets', '93', '1', '2022-10-06 08:33:40.917', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 431);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '432', 'Machinery And Electrical Equipment', '94', '1', '2022-10-06 10:11:25.493', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 432);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '433', 'Furniture And Fittings', '95', '1', '2022-10-06 10:12:15.243', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 433);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '434', 'Municipal Jewellery', '96', '1', '2022-10-06 12:27:13.150', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 434);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '435', 'External Facilities', '97', '1', '2022-10-07 12:46:02.650', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 435);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '436', 'Buildings', '91', '1', '2022-10-07 14:00:35.200', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 436);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '437', 'External Facilities', '91', '1', '2022-10-07 14:01:23.843', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 437);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '438', 'Civil Structures', '91', '1', '2022-10-07 14:01:52.327', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 438);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '439', 'Metal Work', '75', '1', '2022-10-07 14:09:01.317', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 439);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '440', 'Attenuation', '68', '1', '2022-10-07 14:13:32.213', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 440);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '441', 'External Facilities', '101', '1', '2022-10-10 09:09:43.357', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 441);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '442', 'Culturally Significant Buildings', '102', '1', '2022-10-10 10:08:50.507', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 442);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '443', 'AUC', '103', '1', '2022-11-17 13:18:23.257', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 443);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '444', 'AUC', '73', '1', '2022-11-17 13:22:20.487', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 444);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '445', 'AUC', '78', '1', '2022-11-17 13:26:28.550', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 445);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '446', 'AUC', '71', '1', '2022-11-17 13:29:25.843', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 446);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '447', 'AUC', '84', '1', '2022-11-17 13:31:59.000', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 447);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '448', 'AUC', '68', '1', '2022-11-17 13:34:32.303', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 448);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '449', 'AUC', '101', '1', '2022-11-17 13:36:41.863', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 449);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '450', 'Other Software', '104', '1', '2022-11-30 12:39:38.753', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 450);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '451', 'Computer Software', '104', '1', '2022-11-30 12:39:48.437', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 451);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '452', 'Server Software', '104', '1', '2022-11-30 12:40:00.510', '199', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 452);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '453', 'Pump', '80', '1', '2023-11-07 20:28:13.213', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 453);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '454', 'Mechanical Equipment', '80', '1', '2023-11-07 20:35:06.290', '252', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 454);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '455', 'Electrical Equipment', '78', '1', '2023-11-09 10:03:49.383', '285', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 455);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '456', 'Attenuation', '78', '1', '2023-11-09 16:07:05.600', '285', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 456);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '457', 'Mechanical Equipment', '27', '1', '2024-04-15 06:40:13.493', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 457);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '458', 'Land', '105', '1', '2024-04-15 11:17:12.417', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 458);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '459', 'Buildings', '106', '1', '2024-04-15 18:04:44.780', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 459);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '460', 'Buildings', '108', '1', '2024-04-19 14:11:03.380', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 460);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '461', 'Public Lighting', '107', '1', '2024-04-19 14:36:08.760', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 461);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '462', 'Pavements', '110', '1', '2024-04-19 14:38:48.790', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 462);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '463', 'Buildings', '97', '1', '2024-04-19 14:45:28.507', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 463);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '464', 'Buildings', '109', '1', '2024-04-19 14:55:25.150', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 464);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '465', 'Furniture and Office Equipment', '111', '1', '2024-04-19 16:05:09.673', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 465);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '466', 'Computer Equipment', '112', '1', '2024-04-19 16:05:18.783', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 466);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '467', 'Machinery and Equipment', '113', '1', '2024-04-19 16:05:28.310', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 467);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '468', 'Motor Vehicles', '114', '1', '2024-04-19 16:05:37.297', '562', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 468);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '469', 'Social Housing', '115', '1', '2024-10-07 18:26:30.723', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 469);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '470', 'External Facilities', '116', '1', '2024-10-07 18:30:49.357', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 470);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '471', 'Investment Property', '116', '1', '2024-10-07 18:31:02.390', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 471);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '472', 'Sports Fields', '78', '1', '2024-10-07 18:39:08.023', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 472);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '473', 'External Facilities', '117', '1', '2024-10-07 18:51:28.660', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 473);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '474', 'Sport Field', '27', '1', '2024-10-07 19:08:42.937', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 474);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '475', 'Road Furniture', '80', '1', '2024-10-07 19:41:33.197', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 475);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '476', 'Mechanical Equipment', '78', '1', '2024-10-07 19:46:37.370', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 476);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '477', 'Metal Work', '84', '1', '2024-10-07 19:49:04.713', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 477);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '478', 'Pavements', '109', '1', '2024-10-07 20:20:18.187', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 478);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '479', 'Civil Structures', '84', '1', '2024-10-07 20:31:36.390', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 479);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '480', 'Buildings', '84', '1', '2024-10-07 20:38:54.473', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 480);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '481', 'Drainage', '84', '1', '2024-10-07 20:41:28.047', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 481);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '482', 'Pavements', '84', '1', '2024-10-07 20:54:55.073', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 482);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '483', 'Mechanical Equipment', '84', '1', '2024-10-07 21:15:19.403', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 483);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '484', 'Road Furniture', '27', '1', '2024-10-07 21:48:51.390', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 484);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '485', 'Public Lighting', '110', '1', '2024-10-07 22:14:31.927', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 485);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '486', 'Pavements', '88', '1', '2024-10-07 22:28:09.600', '199', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 486);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '487', 'Fence', '109', '1', '2024-12-11 06:49:33.437', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 487);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '488', 'Buildings', '118', '1', '2025-01-28 17:55:35.223', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 488);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '489', 'Building Roof', '80', '1', '2025-01-29 10:35:15.450', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 489);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '490', 'Furniture and fitting', '119', '1', '2025-02-17 11:26:10.813', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 490);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '491', 'Earthworks', '120', '1', '2025-02-26 13:36:49.753', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 491);
INSERT INTO "Const_Asset_CIDMS_Asset_Type" ("AssetCIDMSAssetTypeID", "AssetCIDMSAssetTypeDesc", "AssetCIDMSGroupTypeID", "Enabled", "DateCaptured", "CapturerID", "DateModified", "ModifierID", "Default")
SELECT '492', 'Community Assets', '121', '1', '2025-03-12 08:20:35.687', '271', NULL, NULL, '0'
WHERE NOT EXISTS (SELECT 1 FROM "Const_Asset_CIDMS_Asset_Type" WHERE "AssetCIDMSAssetTypeID" = 492);
SELECT setval(pg_get_serial_sequence('"Const_Asset_CIDMS_Asset_Type"', 'AssetCIDMSAssetTypeID'), (SELECT COALESCE(MAX("AssetCIDMSAssetTypeID"),1) FROM "Const_Asset_CIDMS_Asset_Type"));
  
-- Disable FK triggers for CIDMS Component/SubComponent (parent tables may not be seeded yet)
ALTER TABLE "Const_Asset_CIDMS_Component_Type" DISABLE TRIGGER ALL;
ALTER TABLE "Const_Asset_CIDMS_SubComponent_Type" DISABLE TRIGGER ALL;

-- Const_Asset_CIDMS_Component_Type seed data (full reload)
DELETE FROM "Const_Asset_CIDMS_SubComponent_Type";
DELETE FROM "Const_Asset_CIDMS_Component_Type";
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1, 'Air conditioning', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (2, 'Anchored wall', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (3, 'as applicable (from above)', 2, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (4, 'Automated electricity meter', 122, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (5, 'Auto-recloser', 234, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (6, 'Auto-recloser', 243, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (7, 'Baler', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (8, 'Ballasts', 306, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (9, 'Basketball court', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (10, 'Batteries', 69, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (11, 'Battery charger', 69, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (12, 'Billboard', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (13, 'Boiler', 3, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (14, 'Boiler feed pump', 3, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (15, 'Bowling green', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (16, 'Capacitor bank', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (17, 'Capacitor bank', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (18, 'Capacitor bank', 234, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (19, 'Capacitor bank', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (20, 'Carport', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (21, 'Carport', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (22, 'Cast iron', 194, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (23, 'Cathodic protection', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (24, 'Channel', 77, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (25, 'Chemical toilet', 48, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (26, 'Chiller', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (27, 'Communal standpipe', 49, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (28, 'Communication cable', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (29, 'Communications switch', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (30, 'Commuter shelter', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (31, 'Compactor', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (32, 'Compressor', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (33, 'Condenser', 3, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (34, 'Control cable', 141, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (35, 'Control cable', 172, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (36, 'Control cable', 217, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (37, 'Control panel', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (38, 'Control panel', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (39, 'Control panel', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (40, 'Control panel', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (41, 'Control panel', 243, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (42, 'Conventional electricity meter', 122, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (43, 'Conveyor belt', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (44, 'Crane', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (45, 'Culvert', 77, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (46, 'Current transformer', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (47, 'Current transformer', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (48, 'Distributed control system', 56, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (49, 'Distributed control system', 299, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (50, 'Distributed process control system', 56, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (51, 'Doser', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (52, 'Earth structure', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (53, 'Earthworks', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (54, 'Earthworks', 81, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (55, 'Economiser', 3, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (56, 'Electrical installation (building)', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (57, 'Electrical service connection', 314, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (58, 'Electricity bulk meter', 118, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (59, 'Electricity bulk meter', 119, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (60, 'Electricity servitude', 327, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (61, 'Electricity transmission reserve', 149, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (62, 'Engine', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (63, 'Engine - gas', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (64, 'Exciter', 333, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (65, 'External furniture', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (66, 'External furniture', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (67, 'External lighting', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (68, 'External lighting', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (69, 'Extraction blower', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (70, 'Fabricated steel', 194, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (71, 'Fan', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (72, 'Fibre-optic cable', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (73, 'Filter media', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (74, 'Finishes, fixtures and fittings', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (75, 'Fire protection', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (76, 'Flare stack', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (77, 'Floor', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (78, 'Footpath', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (79, 'Gabions', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (80, 'Gasometer', 56, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (81, 'Gasometer', 299, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (82, 'Gearbox', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (83, 'Generator', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (84, 'Generator', 333, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (85, 'Generator breaker', 333, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (86, 'Generator busbar', 333, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (87, 'Generator transformer', 333, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (88, 'GIS busbar', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (89, 'GIS switchgear', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (90, 'lf course', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (91, 'Grid inlet', 77, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (92, 'Guard rail', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (93, 'Heat exchanger', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (94, 'High mast light', 301, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (95, 'HV busbar indoor', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (96, 'HV busbar outdoor', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (97, 'HV cables', 141, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (98, 'HV circuit breaker', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (99, 'HV earth switch', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (100, 'HV isolator', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (101, 'HV overhead line conductor', 142, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (102, 'HV overhead line support structure', 142, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (103, 'HV transformer compact unit circuit breaker, isolator and current', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (104, 'HV transformers', 146, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (105, 'Hydrant', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (106, 'Irrigation', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (107, 'Irrigation', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (108, 'Jukskei court', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (109, 'Kerb', 77, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (110, 'Kerb inlet', 77, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (111, 'Land', 149, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (112, 'Landfill restoration', 300, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (113, 'Landscaping', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (114, 'Landscaping', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (115, 'Lifts', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (116, 'Lightning mast and shield wiring', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (117, 'Lining – landfill', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (118, 'Load control set', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (119, 'LV cable', 172, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (120, 'LV cable', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (121, 'LV circuit breaker', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (122, 'LV circuit breaker', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (123, 'LV kiosk', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (124, 'LV overhead line', 172, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (125, 'LV overhead line', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (126, 'LV pole top box', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (127, 'Masonry structure', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (128, 'Mini roundabout', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (129, 'Motor', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (130, 'Multiplexer', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (131, 'MV cable', 217, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (132, 'MV circuit breaker', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (133, 'MV circuit breaker', 243, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (134, 'MV earth switch', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (135, 'MV isolator', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (136, 'MV isolator', 243, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (137, 'MV overhead line', 217, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (138, 'MV transformer compact unit circuit breaker, isolator and current', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (139, 'MV transformers', 224, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (140, 'MV transformers', 250, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (141, 'Network control kiosk', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (142, 'Oil burner', 3, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (143, 'PABX', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (144, 'Paving', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (145, 'Paving', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (146, 'Paving', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (147, 'Pedestrian bridge railing', 277, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (148, 'Pedestrian bridge substructure', 277, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (149, 'Pedestrian bridge superstructure', 277, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (150, 'Perimeter protection', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (151, 'Perimeter protection', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (152, 'Pipe - fuel', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (153, 'Pipe - gas', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (154, 'Pipe - gas', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (155, 'Pipe - sewer', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (156, 'Pipe - sewer', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (157, 'Pipe - sewer', 311, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (158, 'Pipe - sewer', 314, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (159, 'Pipe - steam', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (160, 'Pipe - storm water', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (161, 'Pipe - water', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (162, 'Pipe - water', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (163, 'Pipe - water', 311, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (164, 'Pipe - water', 314, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (165, 'Pipe bridge abutment', 279, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (166, 'Pipe bridge railing', 279, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (167, 'Pipe bridge substructure', 279, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (168, 'Pipe bridge superstructure', 279, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (169, 'Plumbing', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (170, 'Points (rail)', 306, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (171, 'Precipitator', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (172, 'Prepaid electricity meter', 122, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (173, 'Pressure vessel', 194, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (174, 'Process instrumentation', 56, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (175, 'Pulveriser', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (176, 'Pump - hand', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (177, 'Pump - sewer', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (178, 'Pump - submersible', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (179, 'Pump - water', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (180, 'Radio infrastructure', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (181, 'Rail bridge abutments', 305, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (182, 'Rail bridge side barrier', 305, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (183, 'Rail bridge substructure', 305, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (184, 'Rail bridge superstructure', 305, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (185, 'Rail lines', 306, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (186, 'Rail reserve', 149, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (187, 'RC structure', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (188, 'RC structure', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (189, 'Reactor', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (190, 'Reactor', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (191, 'Reactor', 234, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (192, 'Reactor', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (193, 'Reheater', 3, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (194, 'Retaining wall', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (195, 'Ring main unit', 224, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (196, 'Ring main unit', 234, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (197, 'Ring main unit', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (198, 'Ring main unit', 243, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (199, 'Road bridge abutment', 308, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (200, 'Road bridge side barrier', 308, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (201, 'Road bridge substructure', 308, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (202, 'Road bridge superstructure', 308, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (203, 'Road reserve', 149, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (204, 'Road structural layer', 261, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (205, 'Road surface', 261, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (206, 'Roof', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (207, 'Router', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (208, 'SCADA', 56, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (209, 'SCADA', 299, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (210, 'Sectionaliser', 234, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (211, 'Security system', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (212, 'Septic tank', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (213, 'Septic tank', 48, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (214, 'Server', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (215, 'Sewerage servitude', 327, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (216, 'Sign - general', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (217, 'Sign - general', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (218, 'Sign - general', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (219, 'Sign - regulatory', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (220, 'Signalling (trains)', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (221, 'Small building/enclosure', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (222, 'Small building/enclosure', 48, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (223, 'Small building/enclosure', 123, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (224, 'Small building/enclosure', 307, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (225, 'Spectator stand', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (226, 'Speed hump', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (227, 'Sports field', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (228, 'Squash court', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (229, 'Station earthing mat and electrodes', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (230, 'Steel structure', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (231, 'Steel structure', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (232, 'Storage area network', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (233, 'Stormwater reserve', 149, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (234, 'Stormwater servitude', 327, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (235, 'Street lights', 301, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (236, 'Street rubbish bin', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (237, 'Subsoil drains', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (238, 'Subsoil drains', 77, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (239, 'Superheater', 3, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (240, 'Surge arrestor', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (241, 'Surge arrestor', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (242, 'Swimming pool', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (243, 'Tank', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (244, 'Telemetry', 56, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (245, 'Tennis court', 329, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (246, 'Timber pole structure', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (247, 'Traffic island', 309, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (248, 'Traffic signal units', 331, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (249, 'Transformer NECRT', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (250, 'Transformer NER', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (251, 'Transformer unit', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (252, 'Tunnel bore structure', 21, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (253, 'Turbine', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (254, 'Turbine', 332, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (255, 'Uninterrupted power supply', 103, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (256, 'Valve - fuel', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (257, 'Valve - gas', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (258, 'Valve - steam', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (259, 'Valve - water', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (260, 'Vending station', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (261, 'VIP latrine (excluding structure)', 48, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (262, 'Voltage transformer', 143, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (263, 'Voltage transformer', 236, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (264, 'Walls', 4, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (265, 'Water meter', 214, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (266, 'Water meter', 282, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (267, 'Water servitude', 327, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (268, 'Weighbridge', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (269, 'Well', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (270, 'Winch', 182, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (271, 'Wireless access point', 50, 1, '2020-01-28 15:35:10.513', 1, 1);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (272, 'Air Conditioner', 2, 1, '2021-05-07 15:49:42.253', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (273, 'Alcotest', 336, 1, '2021-05-07 15:50:20.547', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (274, 'Bar Fridge', 336, 1, '2021-05-07 15:50:54.623', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (275, 'Bench', 336, 1, '2021-05-07 15:51:46.843', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (276, 'Bid Box', 336, 1, '2021-05-07 15:52:22.467', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (277, 'Binder', 336, 1, '2021-05-07 15:52:55.737', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (278, 'Book display', 336, 1, '2021-05-07 15:53:29.050', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (279, 'Bookcase', 336, 1, '2021-05-07 15:54:01.847', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (280, 'Cabinet', 336, 1, '2021-05-07 15:54:43.433', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (281, 'Camera', 336, 1, '2021-05-07 15:55:16.860', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (282, 'CAMERA SONY CYBERSHOT', 336, 1, '2021-05-07 15:55:49.377', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (283, 'CANON DIGITAL CAMERA', 336, 1, '2021-05-07 15:56:33.600', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (284, 'CANON DIGITAL CAMERA EOS 700D', 336, 1, '2021-05-07 15:57:13.850', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (285, 'Cash Drawer', 336, 1, '2021-05-07 15:57:51.157', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (286, 'Chair', 336, 1, '2021-05-07 15:58:36.020', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (287, 'Coat & Hat Stand', 336, 1, '2021-05-07 15:59:16.180', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (288, 'Computer', 336, 1, '2021-05-07 16:00:02.390', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (289, 'Computer Box', 336, 1, '2021-05-07 16:00:54.343', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (290, 'Computer Stand', 336, 1, '2021-05-07 16:01:37.287', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (291, 'Couch', 336, 1, '2021-05-07 16:02:22.057', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (292, 'Counter', 336, 1, '2021-05-07 16:03:05.757', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (293, 'CPU', 336, 1, '2021-05-07 16:03:54.283', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (294, 'Credenza', 336, 1, '2021-05-07 16:04:32.670', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (295, 'Cupboard', 336, 1, '2021-05-07 16:05:31.513', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (296, 'Data Projector', 336, 1, '2021-05-07 16:06:12.057', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (297, 'Data Sheet', 336, 1, '2021-05-07 16:06:56.407', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (298, 'Desk', 336, 1, '2021-05-07 16:07:49.763', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (299, 'Desktop', 336, 1, '2021-05-07 16:08:41.490', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (300, 'Drawer', 336, 1, '2021-05-07 16:09:18.677', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (301, 'Drawers', 336, 1, '2021-05-07 16:10:06.623', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (302, 'DVD Drive', 336, 1, '2021-05-07 16:10:49.363', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (303, 'Fax', 336, 1, '2021-05-07 16:11:28.467', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (304, 'Filer', 336, 1, '2021-05-07 16:12:15.947', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (305, 'Folding Machine', 336, 1, '2021-05-07 16:12:57.857', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (306, 'Franking Machine', 336, 1, '2021-05-07 16:13:36.200', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (307, 'Fridge', 336, 1, '2021-05-07 16:14:22.990', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (308, 'Hard Drive', 336, 1, '2021-05-07 16:15:07.797', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (309, 'Heater', 336, 1, '2021-05-07 16:15:48.940', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (310, 'Ipad', 336, 1, '2021-05-07 16:16:31.450', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (311, 'Laminator', 336, 1, '2021-05-07 16:17:11.700', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (312, 'Laptop', 336, 1, '2021-05-07 16:17:57.630', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (313, 'LICENCE DISK SCANNER AND NUMBER PLATE RECOGNITION', 336, 1, '2021-05-07 16:18:41.833', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (314, 'Locker', 336, 1, '2021-05-07 16:19:26.023', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (315, 'Media Player', 336, 1, '2021-05-07 16:20:15.380', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (316, 'Megaphone', 336, 1, '2021-05-07 16:20:56.997', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (317, 'Mic Stand', 336, 1, '2021-05-07 16:21:44.153', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (318, 'Microphones', 336, 1, '2021-05-07 16:22:29.097', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (319, 'Microwave', 336, 1, '2021-05-07 16:23:11.337', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (320, 'Mixing Console', 336, 1, '2021-05-07 16:24:06.093', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (321, 'Monitor', 336, 1, '2021-05-07 16:24:58.423', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (322, 'Notice Board', 336, 1, '2021-05-07 16:25:46.173', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (323, 'OLYMPUS DIGITAL VOICE RECORDER', 336, 1, '2021-05-07 16:26:29.737', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (324, 'Pedenza', 336, 1, '2021-05-07 16:27:11.087', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (325, 'Pedestal', 336, 1, '2021-05-07 16:27:52.357', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (326, 'Phone', 336, 1, '2021-05-07 16:28:34.113', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (327, 'Pigeon Hole', 336, 1, '2021-05-07 16:29:13.503', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (328, 'Pin Board', 336, 1, '2021-05-07 16:30:37.747', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (329, 'Podium', 336, 1, '2021-05-07 16:31:16.670', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (330, 'Portable Drive', 336, 1, '2021-05-07 16:31:56.887', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (331, 'Post Box', 336, 1, '2021-05-07 16:32:36.540', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (332, 'Printer', 336, 1, '2021-05-07 16:33:18.633', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (333, 'Projector', 336, 1, '2021-05-07 16:33:57.787', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (334, 'Rack Server', 336, 1, '2021-05-07 16:34:37.927', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (335, 'Recorder', 336, 1, '2021-05-07 16:35:21.820', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (336, 'Roof rack', 336, 1, '2021-05-07 16:36:09.207', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (337, 'Router', 336, 1, '2021-05-07 16:36:50.393', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (338, 'Safe', 336, 1, '2021-05-07 16:37:29.657', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (339, 'Screen', 336, 1, '2021-05-07 16:38:10.720', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (340, 'Screen Divider', 336, 1, '2021-05-07 16:38:59.830', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (341, 'Seater', 336, 1, '2021-05-07 16:39:42.407', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (342, 'Server', 336, 1, '2021-05-07 16:40:42.093', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (343, 'Shelf', 336, 1, '2021-05-07 16:41:32.067', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (344, 'Shelving', 336, 1, '2021-05-07 16:43:52.847', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (345, 'Shredder', 336, 1, '2021-05-07 16:47:13.780', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (346, 'Speaker', 336, 1, '2021-05-07 16:47:54.503', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (347, 'Speaker Stand', 336, 1, '2021-05-07 16:48:40.510', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (348, 'Speed Measuring Intrument', 336, 1, '2021-05-07 16:49:23.300', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (349, 'Speed Trapper', 336, 1, '2021-05-07 16:50:07.890', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (350, 'Stand', 336, 1, '2021-05-07 16:50:53.983', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (351, 'Suggestion Box', 336, 1, '2021-05-07 16:51:34.590', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (352, 'Switch', 336, 1, '2021-05-07 16:52:15.680', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (353, 'Switchboard', 336, 1, '2021-05-07 16:52:55.317', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (354, 'Table', 336, 1, '2021-05-07 16:53:36.463', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (355, 'Tender Box', 336, 1, '2021-05-07 16:54:21.510', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (356, 'Tennis Table', 336, 1, '2021-05-07 16:55:00.807', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (357, 'Trunk', 336, 1, '2021-05-07 16:55:40.357', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (358, 'Urn', 336, 1, '2021-05-07 16:56:22.953', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (359, 'Vacuum Cleaner', 336, 1, '2021-05-07 16:57:04.530', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (360, 'Voice Recorder', 336, 1, '2021-05-07 16:57:50.723', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (361, 'Wall unit', 336, 1, '2021-05-07 16:58:38.540', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (362, 'Whiteboard', 336, 1, '2021-05-07 16:59:35.620', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (363, 'Workstation', 336, 1, '2021-05-07 17:00:19.393', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (364, 'Water Dispenser', 336, 1, '2021-05-07 17:01:10.820', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (365, 'Tray', 337, 1, '2021-05-07 17:03:51.810', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (366, 'Trolley', 337, 1, '2021-05-07 17:04:36.837', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (367, 'Light Box', 338, 1, '2021-05-07 17:05:51.533', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (368, 'BROWNING FIREARM 9MM', 339, 1, '2021-05-07 17:56:25.397', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (369, 'Haelgeweer', 339, 1, '2021-05-07 17:57:10.233', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (370, 'NORINCO 213 9MMP PISTOLS', 339, 1, '2021-05-07 17:57:50.967', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (371, 'NORINCO NZ 75', 339, 1, '2021-05-07 17:58:40.513', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (372, 'PISTOL HELWAN KAL', 339, 1, '2021-05-07 17:59:24.240', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (373, 'PISTOL NORINCO KAL', 339, 1, '2021-05-07 18:00:13.677', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (374, 'Revolver', 339, 1, '2021-05-07 18:00:56.267', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (375, 'Security System', 339, 1, '2021-05-07 18:01:49.243', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (376, 'Bakkie', 341, 1, '2021-05-10 14:08:08.677', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (377, 'Bus', 341, 1, '2021-05-10 14:08:58.503', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (378, 'Car', 341, 1, '2021-05-10 14:09:46.943', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (379, 'Combi', 341, 1, '2021-05-10 14:10:34.267', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (380, 'Jeep', 341, 1, '2021-05-10 14:11:23.600', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (381, 'Trailer', 341, 1, '2021-05-10 14:12:25.553', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (382, 'Truck', 341, 1, '2021-05-10 14:13:10.460', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (383, 'Radio', 340, 1, '2021-05-10 14:15:39.533', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (384, 'Jack', 340, 1, '2021-05-10 14:17:22.053', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (385, 'Chainsaw', 340, 1, '2021-05-10 14:18:54.913', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (386, 'Trimmer', 340, 1, '2021-05-10 14:25:11.387', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (387, 'Battery Charger', 340, 1, '2021-05-10 14:26:22.277', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (388, 'Bench Presser', 340, 1, '2021-05-10 14:28:27.107', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (389, 'Bin', 340, 1, '2021-05-10 14:29:20.533', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (390, 'Blower', 340, 1, '2021-05-10 14:30:12.977', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (391, 'TLB', 340, 1, '2021-05-10 14:31:02.873', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (392, 'Generator', 340, 1, '2021-05-10 14:31:58.567', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (393, 'Dumbells', 340, 1, '2021-05-10 14:32:52.870', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (394, 'Diesel Bowser', 340, 1, '2021-05-10 14:33:59.087', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (395, 'Excavator', 340, 1, '2021-05-10 14:34:45.737', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (396, 'Fumigator', 340, 1, '2021-05-10 14:41:49.683', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (397, 'Grader', 340, 1, '2021-05-10 14:42:39.127', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (398, 'Grass cutter', 340, 1, '2021-05-10 14:43:30.663', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (399, 'Roller', 340, 1, '2021-05-11 08:00:53.020', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (400, 'Picker', 340, 1, '2021-05-11 08:01:51.610', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (401, 'Converter', 340, 1, '2021-05-11 08:02:48.363', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (402, 'Lawnmower', 340, 1, '2021-05-11 08:03:53.193', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (403, 'Weight', 340, 1, '2021-05-11 08:04:39.730', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (404, 'Mower', 340, 1, '2021-05-11 08:05:32.423', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (405, 'Measuring Wheel', 340, 1, '2021-05-11 08:06:44.150', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (406, 'Pruner', 340, 1, '2021-05-11 08:07:48.830', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (407, 'Compactor', 340, 1, '2021-05-11 08:09:14.083', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (408, 'Compressor', 340, 1, '2021-05-11 08:10:05.227', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (409, 'Crane', 340, 1, '2021-05-11 08:10:51.280', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (410, 'Lights', 340, 1, '2021-05-11 08:11:51.493', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (411, 'Tipper', 340, 1, '2021-05-11 08:12:57.883', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (412, 'Pressing Machine', 340, 1, '2021-05-11 08:14:17.453', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (413, 'Marking Machine', 340, 1, '2021-05-11 08:15:08.287', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (414, 'Drill', 340, 1, '2021-05-11 08:16:04.900', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (415, 'Concrete Cutter', 340, 1, '2021-05-11 08:17:05.743', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (416, 'Tanker', 340, 1, '2021-05-11 08:17:56.883', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (417, 'Water Dispenser', 340, 1, '2021-05-11 08:18:55.213', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (418, 'Tractor', 340, 1, '2021-05-11 08:19:49.803', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (419, 'Tredmill', 340, 1, '2021-05-11 08:20:51.380', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (420, 'Waterwell', 340, 1, '2021-05-11 08:22:07.550', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (421, 'Water Pump', 340, 1, '2021-05-11 08:22:58.873', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (422, 'Welding Machine', 340, 1, '2021-05-11 08:23:52.920', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (423, 'CHAIR HIGH BACK', 336, 1, '2021-05-11 09:17:37.893', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (424, 'Walls', 342, 1, '2021-06-11 14:27:44.353', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (425, 'Kerb Inlet', 343, 1, '2021-06-11 14:28:17.303', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (426, 'External Furniture', 344, 1, '2021-06-11 14:28:48.797', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (427, 'Footpath', 344, 1, '2021-06-11 14:29:11.670', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (428, 'Perimeter Protection', 344, 1, '2021-06-11 14:29:34.530', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (429, 'Carport', 344, 1, '2021-06-11 14:29:57.043', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (430, 'Land', 345, 1, '2021-06-11 14:30:19.133', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (431, 'Road Structural Layer', 346, 1, '2021-06-11 14:30:41.753', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (432, 'External Furniture', 347, 1, '2021-06-11 14:37:37.420', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (433, 'Paving', 353, 1, '2021-06-14 10:10:56.027', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (434, 'Small Building - Enclosure', 353, 1, '2021-06-14 10:12:13.950', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (435, 'Walls', 353, 1, '2021-06-14 10:13:10.183', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (436, 'RC Structure', 352, 1, '2021-06-14 10:14:17.397', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (437, 'Carport', 351, 1, '2021-06-14 10:15:31.310', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (438, 'Landscaping', 351, 1, '2021-06-14 10:16:23.687', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (439, 'Paving', 351, 1, '2021-06-14 10:17:22.953', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (440, 'Perimeter Protection', 351, 1, '2021-06-14 10:18:09.910', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (441, 'Land', 350, 1, '2021-06-14 10:19:26.283', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (442, 'Road Structural Layer', 349, 1, '2021-06-14 10:20:40.013', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (443, 'Land', 334, 1, '2021-06-14 10:22:21.607', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (444, 'Land', 384, 1, '2021-06-14 11:14:37.080', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (445, 'Small Building - Enclosure', 385, 1, '2021-06-14 11:17:49.700', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (446, 'Walls', 385, 1, '2021-06-14 11:19:04.660', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (447, 'Kerb Inlet', 386, 1, '2021-06-14 11:20:46.867', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (448, 'Pipe - Storm Water', 386, 1, '2021-06-14 11:22:30.060', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (449, 'RC Structure', 386, 1, '2021-06-14 11:23:29.723', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (450, 'Steel Structure', 386, 1, '2021-06-14 11:25:00.853', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (451, 'Tank', 386, 1, '2021-06-14 11:25:55.743', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (452, 'Walls', 387, 1, '2021-06-14 11:27:32.497', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (453, 'Carport', 388, 1, '2021-06-14 11:46:29.057', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (454, 'External Furniture', 388, 1, '2021-06-14 11:47:32.997', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (455, 'External Lighting', 388, 1, '2021-06-14 11:48:22.477', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (456, 'Footpath', 388, 1, '2021-06-14 11:49:15.333', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (457, 'Landscaping', 388, 1, '2021-06-14 11:50:09.030', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (458, 'Perimeter Protection', 388, 1, '2021-06-14 11:51:02.573', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (459, 'Sign - General', 388, 1, '2021-06-14 11:51:53.960', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (460, 'Land', 389, 1, '2021-06-14 11:53:32.227', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (461, 'Road Structural Layer', 390, 1, '2021-06-14 11:54:52.387', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (462, 'Small Building - Enclosure', 354, 1, '2021-06-14 12:12:15.550', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (463, 'Walls', 354, 1, '2021-06-14 12:13:09.340', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (464, 'Perimeter Protection', 355, 1, '2021-06-14 12:14:08.347', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (465, 'Sign - General', 355, 1, '2021-06-14 12:16:20.990', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (466, 'Land', 356, 1, '2021-06-14 12:17:25.103', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (467, 'Road Structural Layer', 357, 1, '2021-06-14 12:18:23.363', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (468, 'Earthworks', 357, 1, '2021-06-14 12:19:29.263', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (469, 'Kerb', 357, 1, '2021-06-14 12:20:36.130', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (470, 'Land', 358, 1, '2021-06-14 12:22:11.350', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (471, 'Small Building - Enclosure', 359, 1, '2021-06-14 12:23:14.567', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (472, 'Perimeter Protection', 360, 1, '2021-06-14 12:24:31.300', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (473, 'Land', 361, 1, '2021-06-14 12:26:21.067', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (474, 'Perimeter Protection', 363, 1, '2021-06-14 12:27:40.727', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (475, 'Walls', 362, 1, '2021-06-14 12:28:44.497', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (476, 'Small Building - Enclosure', 362, 1, '2021-06-14 12:29:51.367', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (477, 'Small Building - Enclosure', 364, 1, '2021-06-14 12:31:49.670', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (478, 'Walls', 364, 1, '2021-06-14 12:32:57.643', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (479, 'Channel', 365, 1, '2021-06-14 12:34:19.117', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (480, 'Steel Structure', 365, 1, '2021-06-14 12:35:24.340', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (481, 'Tank', 365, 1, '2021-06-14 12:36:22.250', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (482, 'External Furniture', 366, 1, '2021-06-14 12:37:57.010', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (483, 'External Lighting', 366, 1, '2021-06-14 12:39:00.487', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (484, 'Footpath', 366, 1, '2021-06-14 12:39:55.110', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (485, 'Landscaping', 366, 1, '2021-06-14 12:40:58.617', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (486, 'Paving', 366, 1, '2021-06-14 12:41:55.583', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (487, 'Perimeter Protection', 366, 1, '2021-06-14 12:42:53.063', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (488, 'Land', 367, 1, '2021-06-14 12:44:11.603', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (489, 'Walls', 368, 1, '2021-06-14 12:45:31.227', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (490, 'External Furniture', 369, 1, '2021-06-14 12:46:31.587', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (491, 'External Lighting', 369, 1, '2021-06-14 12:47:41.337', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (492, 'Footpath', 369, 1, '2021-06-14 12:48:43.710', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (493, 'Paving', 369, 1, '2021-06-14 12:49:39.797', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (494, 'Perimeter Protection', 369, 1, '2021-06-14 12:50:33.967', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (495, 'Small Building - Enclosure', 369, 1, '2021-06-14 12:51:29.770', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (496, 'Land', 370, 1, '2021-06-14 12:52:31.213', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (497, 'Walls', 371, 1, '2021-06-14 12:53:54.287', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (498, 'Small Building - Enclosure', 371, 1, '2021-06-14 12:54:51.267', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (499, 'RC Structure', 372, 1, '2021-06-14 12:56:04.897', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (500, 'Steel Structure', 372, 1, '2021-06-14 12:57:04.743', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (501, 'Tank', 372, 1, '2021-06-14 12:57:59.797', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (502, 'Valve - Water', 372, 1, '2021-06-14 12:58:55.077', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (503, 'External Furniture', 373, 1, '2021-06-14 13:02:59.730', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (504, 'External Lighting', 373, 1, '2021-06-14 13:03:54.270', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (505, 'Footpath', 373, 1, '2021-06-14 13:04:56.163', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (506, 'Irrigation', 373, 1, '2021-06-14 13:10:05.280', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (507, 'Landscaping', 373, 1, '2021-06-14 13:11:19.433', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (508, 'Perimeter Protection', 373, 1, '2021-06-14 13:12:19.660', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (509, 'Sign - General', 373, 1, '2021-06-14 13:13:24.490', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (510, 'Small Building - Enclosure', 373, 1, '2021-06-14 13:14:23.693', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (511, 'Land', 374, 1, '2021-06-14 13:15:59.917', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (512, 'Land', 375, 1, '2021-06-14 13:24:01.447', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (513, 'Fabricated Steel', 376, 1, '2021-06-14 13:25:36.780', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (514, 'Walls', 377, 1, '2021-06-14 13:35:05.107', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (515, 'RC Structure', 377, 1, '2021-06-14 13:36:06.540', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (516, 'Culvert', 378, 1, '2021-06-14 13:37:08.133', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (517, 'Earthworks', 378, 1, '2021-06-14 13:38:17.533', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (518, 'Irrigation', 378, 1, '2021-06-14 13:39:19.223', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (519, 'Masonry Structure', 378, 1, '2021-06-14 13:40:14.537', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (520, 'Pipe - Storm Water', 378, 1, '2021-06-14 13:41:18.830', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (521, 'RC Structure', 378, 1, '2021-06-14 13:42:18.763', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (522, 'Steel Structure', 378, 1, '2021-06-14 13:43:18.600', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (523, 'Tank', 378, 1, '2021-06-14 13:44:16.063', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (524, 'External Furniture', 379, 1, '2021-06-14 13:45:24.087', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (525, 'External Lighting', 379, 1, '2021-06-14 13:46:26.743', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (526, 'Paving', 379, 1, '2021-06-14 13:47:40.090', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (527, 'Perimeter Protection', 379, 1, '2021-06-14 13:49:13.033', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (528, 'Sign - General', 379, 1, '2021-06-14 13:50:21.417', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (529, 'Land', 380, 1, '2021-06-14 13:51:25.293', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (530, 'Fabricated Steel', 381, 1, '2021-06-14 13:52:50.297', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (531, 'Steel Structure', 381, 1, '2021-06-14 13:53:52.980', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (532, 'Road Structural Layer', 382, 1, '2021-06-14 13:54:59.137', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (533, 'Fabricated Steel', 383, 1, '2021-06-14 13:55:59.653', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (534, 'Sports Field', 383, 1, '2021-06-14 13:57:14.320', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (535, 'Road Structural Layer', 272, 1, '2021-06-14 15:06:13.250', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (536, 'LV Overhead Line', 174, 1, '2021-06-14 15:18:05.147', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (537, 'High Mast Light', 302, 1, '2021-06-14 15:22:11.903', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (538, 'Street Lights', 302, 1, '2021-06-14 15:24:28.837', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (539, 'Retaining Wall', 41, 1, '2021-06-14 15:27:19.527', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (540, 'Steel Structure', 41, 1, '2021-06-14 15:28:22.537', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (541, 'Pedestrian Bridge Railing', 309, 1, '2021-06-14 15:45:22.893', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (542, 'Sign - GeneralSign - Regulatory', 309, 1, '2021-06-14 15:48:28.313', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (543, 'Street Lights', 309, 1, '2021-06-14 15:53:49.573', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (544, 'Commuter Bench', 309, 1, '2021-06-14 15:56:07.160', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (545, 'Earthworks', 96, 1, '2021-06-14 16:01:38.403', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (546, 'Paving', 272, 1, '2021-06-14 16:03:16.937', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (547, 'Road Surface', 272, 1, '2021-06-14 16:04:39.670', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (548, 'Street Lights', 272, 1, '2021-06-14 16:06:02.263', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (549, 'Carport', 391, 1, '2021-06-14 16:08:09.770', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (550, 'Grid Inlet', 391, 1, '2021-06-14 16:09:12.357', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (551, 'Kerb', 391, 1, '2021-06-14 16:10:43.950', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (552, 'Kerb Inlet', 391, 1, '2021-06-14 16:11:46.037', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (553, 'Subsoil Drains', 391, 1, '2021-06-14 16:12:51.360', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (554, 'Gabions', 44, 1, '2021-06-14 16:14:28.520', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (555, 'RC Structure', 44, 1, '2021-06-14 16:15:31.837', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (556, 'Sign - Regulatory', 44, 1, '2021-06-14 16:16:41.863', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (557, 'Channel', 79, 1, '2021-06-14 16:18:10.367', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (558, 'Culvert', 79, 1, '2021-06-14 16:19:14.773', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (559, 'RC Structure', 79, 1, '2021-06-14 16:20:16.807', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (560, 'Road Bridge Abutment', 79, 1, '2021-06-14 16:21:21.247', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (561, 'Pipe - Sewer', 295, 1, '2021-06-14 16:22:55.520', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (562, 'Pipe - Storm Water', 295, 1, '2021-06-14 16:23:56.327', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (563, 'Pipe - Water', 295, 1, '2021-06-14 16:24:59.677', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (564, 'Pipe Bridge Substructure', 295, 1, '2021-06-14 16:26:07.643', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (565, 'Airconditioner', 338, 1, '2021-06-15 16:09:12.657', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (566, 'Laminator', 338, 1, '2021-06-15 16:10:31.277', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (567, 'Alcohol test', 338, 1, '2021-06-15 16:11:37.157', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (568, 'Camera', 338, 1, '2021-06-15 16:12:58.027', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (569, 'Heater', 338, 1, '2021-06-15 16:14:15.837', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (570, 'Folding Machine', 338, 1, '2021-06-15 16:15:23.803', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (571, 'Franking Machine', 338, 1, '2021-06-15 16:16:39.170', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (572, 'Megaphone', 338, 1, '2021-06-15 16:17:58.377', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (573, 'Box', 338, 1, '2021-06-15 16:26:23.000', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (574, 'Bulk Filer', 338, 1, '2021-06-15 16:27:29.137', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (575, 'Board', 338, 1, '2021-06-15 16:28:36.097', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (576, 'Binding Machine', 338, 1, '2021-06-15 16:29:46.377', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (577, 'Cash Drawer', 338, 1, '2021-06-15 16:30:52.370', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (578, 'Cell Phone', 338, 1, '2021-06-15 16:32:02.060', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (579, 'Divider', 338, 1, '2021-06-15 16:33:09.653', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (580, 'Mic Stand', 338, 1, '2021-06-15 16:34:45.680', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (581, 'Recorder', 338, 1, '2021-06-15 16:35:50.500', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (582, 'Safe', 338, 1, '2021-06-15 16:36:56.153', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (583, 'Shredder', 338, 1, '2021-06-15 16:38:03.443', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (584, 'Speaker Stand', 338, 1, '2021-06-15 16:39:11.723', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (585, 'Trolley', 338, 1, '2021-06-15 16:40:19.323', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (586, 'Vacuum Cleaner', 338, 1, '2021-06-15 16:41:27.203', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (587, 'Water Dispenser', 338, 1, '2021-06-15 16:42:49.917', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (588, 'Fridge', 337, 1, '2021-06-15 16:55:45.197', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (589, 'Laptop', 392, 1, '2021-06-15 17:04:21.173', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (590, 'Ipad', 392, 1, '2021-06-15 17:05:37.180', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (591, 'Media Player', 393, 1, '2021-06-15 17:07:28.057', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (592, 'Desktop Computer', 392, 1, '2021-06-15 17:18:09.573', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (593, 'External Drive', 392, 1, '2021-06-15 17:19:31.540', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (594, 'Firewall', 392, 1, '2021-06-15 17:20:45.107', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (595, 'Monitor', 392, 1, '2021-06-15 17:22:05.530', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (596, 'Printer', 392, 1, '2021-06-15 17:23:16.557', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (597, 'Router', 392, 1, '2021-06-15 17:26:05.427', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (598, 'Server', 392, 1, '2021-06-15 17:27:33.270', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (599, 'Switch', 392, 1, '2021-06-15 17:28:55.150', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (600, 'UPS', 392, 1, '2021-06-15 17:30:09.957', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (601, 'Microphone', 393, 1, '2021-06-15 17:38:42.667', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (602, 'Mixing  Console', 393, 1, '2021-06-15 17:39:59.893', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (603, 'Projector', 393, 1, '2021-06-15 17:41:13.790', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (604, 'Projector Screen', 393, 1, '2021-06-15 17:42:25.403', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (605, 'Speaker', 393, 1, '2021-06-15 17:43:35.027', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (606, 'Fire Arm', 339, 1, '2021-06-15 17:48:58.207', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (607, 'Speed Trap', 339, 1, '2021-06-15 17:50:25.907', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (608, 'Benchpress', 2, 1, '2021-06-15 17:54:35.790', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (609, 'Brushcutter', 340, 1, '2021-06-15 17:56:04.340', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (610, 'Chain Saw', 340, 1, '2021-06-15 17:57:18.173', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (611, 'Cherry Picker', 340, 1, '2021-06-15 17:59:52.647', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (612, 'Concrete Cutter Machine', 340, 1, '2021-06-15 18:01:17.537', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (613, 'Skip Bin', 340, 1, '2021-06-15 18:11:45.803', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (614, 'Scanner', 340, 1, '2021-06-15 18:12:59.943', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (615, 'Grid Roller', 340, 1, '2021-06-15 18:14:10.890', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (616, 'Road Marking Machine', 340, 1, '2021-06-15 18:15:25.787', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (617, 'Hauler', 340, 1, '2021-06-15 18:16:39.790', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (618, 'Emergency Lights', 340, 1, '2021-06-15 18:18:07.153', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (619, 'GYM Equipment', 340, 1, '2021-06-15 18:19:19.497', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (620, 'Fumigation Machine', 340, 1, '2021-06-15 18:21:07.150', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (621, 'Plate Compactor', 340, 1, '2021-06-15 18:22:21.033', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (622, 'Microwave', 337, 1, '2021-06-15 18:29:58.687', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (623, 'Motor Vehicles', 341, 1, '2021-06-15 18:35:31.753', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (624, 'Pruner Tree', 340, 1, '2021-06-17 13:09:37.950', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (625, 'Benchpress', 340, 1, '2021-07-19 11:36:51.243', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (626, 'Microwave', 2, 1, '2021-11-11 08:48:49.393', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (627, 'Speed Trap', 2, 1, '2021-11-11 09:03:31.197', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (628, 'Diesel Bowser Machine', 340, 1, '2021-11-11 09:30:46.877', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (629, 'Security System', 396, 1, '2021-11-11 09:56:20.507', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (630, 'Speed Trap', 396, 1, '2021-11-11 11:12:34.523', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (631, 'Microphone', 395, 1, '2021-11-11 11:29:59.983', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (632, 'Projector', 395, 1, '2021-11-11 11:34:48.773', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (633, 'Fire Arm', 397, 1, '2021-11-11 11:49:25.907', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (634, 'Land', 398, 1, '2022-05-18 15:42:29.383', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (635, 'Municipal Flats', 353, 1, '2022-05-18 19:50:57.797', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (636, 'Garage', 353, 1, '2022-05-19 09:26:41.603', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (637, 'Dwelling Normal Size House', 353, 1, '2022-05-19 09:27:29.770', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (638, 'Hall-Indoor Sport Complex', 353, 1, '2022-05-19 09:29:01.317', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (639, 'Market', 353, 1, '2022-05-19 09:29:26.803', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (640, 'Internal Road', 349, 1, '2022-05-19 09:32:31.237', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (641, 'Catchpit', 399, 1, '2022-05-19 09:37:16.557', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (642, 'Tank Stand', 352, 1, '2022-05-19 09:41:57.137', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (643, 'Footpath', 351, 1, '2022-05-19 09:51:31.927', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (644, 'Tank', 352, 1, '2022-05-19 09:57:03.830', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (645, 'Ablution - Change Rooms', 377, 1, '2022-05-19 12:07:35.147', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (646, 'Ablution Block', 377, 1, '2022-05-19 12:09:09.577', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (647, 'Taxi Rank', 342, 1, '2022-05-19 12:38:29.030', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (648, 'License testing centre', 359, 1, '2022-05-19 12:39:39.020', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (649, 'Library', 368, 1, '2022-05-19 12:41:19.227', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (650, 'Parking', 346, 1, '2022-05-19 12:47:52.657', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (651, 'Parking', 400, 1, '2022-05-19 12:50:20.687', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (652, 'Walkway', 373, 1, '2022-05-19 12:52:43.047', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (653, 'Walkway', 366, 1, '2022-05-19 12:53:42.493', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (654, 'Walkway', 344, 1, '2022-05-19 12:54:37.763', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (655, 'Office Block', 362, 1, '2022-05-19 12:57:29.080', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (656, 'Office Block', 364, 1, '2022-05-19 12:58:52.560', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (657, 'Office Block', 342, 1, '2022-05-19 13:02:12.207', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (658, 'Office Block', 377, 1, '2022-05-19 13:03:52.877', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (659, 'Boreholes', 373, 1, '2022-05-19 13:13:19.157', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (660, 'Cenotaph', 373, 1, '2022-05-19 13:15:22.083', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (661, 'Changeroom', 377, 1, '2022-05-19 13:18:44.193', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (662, 'Community Hall', 364, 1, '2022-05-19 13:41:53.827', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (663, 'Dwelling Low Cost Housing', 364, 1, '2022-05-19 13:44:00.587', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (664, 'Handrails', 366, 1, '2022-05-19 13:45:31.843', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (665, 'Heritage Building', 364, 1, '2022-05-19 13:46:57.107', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (666, 'Kerb Barrier', 401, 1, '2022-05-19 13:50:56.507', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (667, 'Lawns', 373, 1, '2022-05-19 13:52:50.077', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (668, 'Mobile Office', 364, 1, '2022-05-19 13:54:12.253', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (669, 'Netball Court', 383, 1, '2022-05-19 13:55:29.287', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (670, 'Paved Area', 402, 1, '2022-05-19 13:58:25.010', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (671, 'Paved Area', 346, 1, '2022-05-19 13:59:11.407', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (672, 'Pavement', 346, 1, '2022-05-19 14:00:10.387', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (673, 'Pavilion', 378, 1, '2022-05-19 14:00:58.190', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (674, 'Small Urban Office', 371, 1, '2022-05-19 14:02:14.097', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (675, 'Small Urban Office', 342, 1, '2022-05-19 14:02:58.980', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (676, 'Sub-soil Drain Pipe', 403, 1, '2022-05-19 14:05:25.313', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (677, 'Unpaved Road', 346, 1, '2022-05-19 14:06:23.493', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (678, 'Perimeter Protection', 404, 1, '2022-05-19 14:12:36.923', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (679, 'Internal Road', 400, 1, '2022-05-19 14:15:43.290', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (680, 'External Furniture', 355, 1, '2022-05-19 14:39:17.910', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (681, 'Ablution Block', 371, 1, '2022-05-19 15:00:43.203', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (682, 'Ablution Block', 364, 1, '2022-05-19 15:05:31.167', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (683, 'Small Building - Enclosure', 342, 1, '2022-05-19 15:18:38.500', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (684, 'Channel', 405, 1, '2022-05-19 15:31:16.197', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (685, 'Channel', 406, 1, '2022-05-19 15:31:49.177', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (686, 'Small Building - Enclosure', 377, 1, '2022-05-19 15:40:23.540', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (687, 'Internal Road', 357, 1, '2022-05-19 15:48:12.027', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (688, 'Internal Road', 382, 1, '2022-05-19 15:49:21.283', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (689, 'Internal Road', 346, 1, '2022-05-19 15:51:45.880', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (690, 'Hall-Indoor Sport Complex', 364, 1, '2022-05-19 15:54:01.420', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (691, 'Tank', 407, 1, '2022-05-19 16:07:25.360', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (692, 'Culvert', 406, 1, '2022-05-19 17:39:05.667', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (693, 'Retaining Wall', 378, 1, '2022-05-19 17:41:59.883', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (694, 'Tank Stand', 365, 1, '2022-05-19 17:45:07.297', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (695, 'Tank Stand', 407, 1, '2022-05-19 17:45:56.440', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (696, 'Tank Stand', 2, 1, '2022-05-19 17:46:22.113', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (697, 'Tank Stand', 372, 1, '2022-05-19 17:47:13.383', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (698, 'Tank Stand', 378, 1, '2022-05-19 17:52:29.840', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (699, 'Small Building - Enclosure', 368, 1, '2022-05-19 17:57:51.543', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (700, 'Pipe - Storm Water', 403, 1, '2022-05-19 18:11:13.177', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (701, 'Market', 342, 1, '2022-05-19 18:13:10.900', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (702, 'Kerb Inlet', 408, 1, '2022-05-19 18:31:27.913', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (703, 'Earthworks', 409, 1, '2022-05-19 18:36:45.883', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (704, 'Earthworks', 410, 1, '2022-05-19 18:37:12.123', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (705, 'Small Building - Enclosure', 376, 1, '2022-05-19 18:39:16.717', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (706, 'Footpath', 379, 1, '2022-05-19 18:43:34.960', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (707, 'Catchpit', 406, 1, '2022-05-19 18:49:46.253', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (708, 'Swimming Pool', 383, 1, '2022-05-19 18:52:04.467', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (709, 'Paved Area', 382, 1, '2022-05-19 19:00:02.877', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (710, 'External Lighting', 411, 1, '2022-05-19 19:29:18.157', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (711, 'Rural Electrification', 215, 1, '2022-05-19 19:29:42.880', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (712, 'LED Lights', 302, 1, '2022-05-19 19:30:32.327', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (713, 'Access Road', 272, 1, '2022-05-20 11:35:16.053', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (714, 'Cattle Grid', 41, 1, '2022-05-20 11:45:26.940', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (715, 'Parking', 412, 1, '2022-05-20 11:47:54.923', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (716, 'Paved Area', 412, 1, '2022-05-20 11:48:31.103', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (717, 'Railing - Handrails', 309, 1, '2022-05-20 11:51:51.653', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (718, 'Rubbish Bin', 309, 1, '2022-05-20 11:52:32.017', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (719, 'Sign - Guidance', 309, 1, '2022-05-20 11:53:00.977', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (720, 'Sign - Information', 309, 1, '2022-05-20 11:53:28.207', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (721, 'Sign - Warning', 309, 1, '2022-05-20 11:54:05.410', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (722, 'Traffic Circle', 309, 1, '2022-05-20 11:55:03.587', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (723, 'Walkway', 309, 1, '2022-05-20 11:55:41.043', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (724, 'Bridge Abutment', 308, 1, '2022-05-20 12:04:39.660', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (725, 'Bridge Side Barrier', 308, 1, '2022-05-20 12:05:12.177', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (726, 'Bridge Sub Structure', 308, 1, '2022-05-20 12:05:36.833', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (727, 'Low Level Bridge', 308, 1, '2022-05-20 12:06:08.737', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (728, 'Vehicle Bridge', 308, 1, '2022-05-20 12:06:33.847', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (729, 'Gabions', 413, 1, '2022-05-20 12:10:31.777', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (730, 'Catchpit', 414, 1, '2022-05-20 12:12:29.777', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (731, 'Channel', 414, 1, '2022-05-20 12:13:04.467', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (732, 'Culvert', 414, 1, '2022-05-20 12:13:35.617', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (733, 'Head And Wingwalls', 414, 1, '2022-05-20 12:14:03.693', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (734, 'Kerb', 414, 1, '2022-05-20 12:14:28.087', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (735, 'Kerb Barrier', 414, 1, '2022-05-20 12:14:54.660', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (736, 'Kerb Inlet', 414, 1, '2022-05-20 12:15:26.513', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (737, 'Pavement', 272, 1, '2022-05-20 12:23:07.527', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (738, 'Unpaved Road', 272, 1, '2022-05-20 12:23:53.547', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (739, 'Pipe - Storm Water', 415, 1, '2022-05-20 12:35:22.283', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (740, 'Pipe', 415, 1, '2022-05-20 12:35:49.120', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (741, 'Street Lights', 416, 1, '2022-05-20 12:39:57.933', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (742, 'Manhole', 44, 1, '2022-05-20 14:11:35.737', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (743, 'Catchpit', 79, 1, '2022-05-20 14:13:48.033', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (744, 'Kerb Barrier', 79, 1, '2022-05-20 14:14:29.320', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (745, 'Kerb Inlet', 79, 1, '2022-05-20 14:14:59.090', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (746, 'Pipe', 295, 1, '2022-05-20 14:21:30.653', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (747, 'Low Level Bridge', 417, 1, '2022-05-20 14:24:06.180', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (748, 'Ablution - Change Rooms', 385, 1, '2022-05-20 15:36:56.057', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (749, 'Dwelling Low Cost Housing', 385, 1, '2022-05-20 15:37:46.540', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (750, 'Dwelling Normal Size House', 385, 1, '2022-05-20 15:38:11.813', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (751, 'Garage', 385, 1, '2022-05-20 15:38:37.170', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (752, 'Hall-Indoor Sport Complex', 385, 1, '2022-05-20 15:39:00.063', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (753, 'Mobile Office', 385, 1, '2022-05-20 15:39:25.440', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (754, 'Office Block', 385, 1, '2022-05-20 15:39:49.280', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (755, 'Small Urban Office', 385, 1, '2022-05-20 15:40:24.673', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (756, 'Board', 336, 1, '2022-05-30 11:19:07.943', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (757, 'Sick Bed', 336, 1, '2022-05-30 11:33:17.257', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (758, 'Computer Workstation', 336, 1, '2022-05-30 11:35:15.147', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (759, 'Projector Screen', 395, 1, '2022-05-30 11:37:08.057', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (760, 'Microwave', 394, 1, '2022-05-30 12:40:27.800', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (761, 'Voice Recorder', 338, 1, '2022-05-30 12:58:37.970', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (762, 'CPU', 392, 1, '2022-05-30 13:41:42.213', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (763, 'Fridge', 394, 1, '2022-05-30 14:26:03.353', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (764, 'TV Screen', 338, 1, '2022-05-30 15:08:33.627', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (765, 'PA System', 338, 1, '2022-05-30 15:11:45.937', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (766, 'Mixing  Console', 395, 1, '2022-05-30 15:29:42.213', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (767, 'Speaker', 395, 1, '2022-05-31 08:40:39.567', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (768, 'Media Player', 395, 1, '2022-05-31 09:26:45.907', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (769, 'Pressure Washer', 340, 1, '2022-05-31 11:14:57.047', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (770, 'Boom Spray', 340, 1, '2022-05-31 11:17:54.343', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (771, 'Plough', 340, 1, '2022-05-31 11:23:05.603', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (772, 'License Disk Scanner', 340, 1, '2022-05-31 11:25:36.337', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (773, 'Planter', 340, 1, '2022-05-31 11:28:26.257', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (774, 'Lifeguard Post and Seat', 340, 1, '2022-05-31 11:54:09.840', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (775, 'Swimming Pool Sweeper', 340, 1, '2022-05-31 11:55:49.200', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (776, 'Edge Trimmer', 340, 1, '2022-05-31 11:57:31.833', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (777, 'Truck', 340, 1, '2022-05-31 12:00:50.090', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (778, 'Trailer', 340, 1, '2022-05-31 12:02:22.077', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (779, 'Speed Trap', 340, 1, '2022-05-31 12:03:58.120', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (780, 'Tank Stand', 386, 1, '2022-06-01 11:59:22.113', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (781, 'Internal Road', 390, 1, '2022-06-01 12:01:41.267', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (782, 'Kerb Inlet', 418, 1, '2022-06-01 12:07:23.533', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (783, 'Walkway', 388, 1, '2022-06-01 12:20:31.117', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (784, 'Lawns', 388, 1, '2022-06-01 12:22:34.767', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (785, 'Pipe - Storm Water', 419, 1, '2022-06-01 14:19:24.010', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (786, 'Pipe', 419, 1, '2022-06-01 15:58:13.230', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (787, 'Culvert', 418, 1, '2022-06-01 16:04:43.953', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (788, 'Paved Area', 390, 1, '2022-06-01 16:10:56.243', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (789, 'Tourism Structure', 423, 1, '2022-06-08 08:26:26.793', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (790, 'Community Hall', 421, 1, '2022-06-08 08:36:42.380', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (791, 'Community Hall - Retention', 421, 1, '2022-06-08 08:47:47.567', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (792, 'Sports Facility', 420, 1, '2022-06-08 08:51:14.113', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (793, 'Sports Facility - Retention', 420, 1, '2022-06-08 08:53:02.300', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (794, 'Taxi Rank - Retention', 424, 1, '2022-06-08 11:43:43.960', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (795, 'Testing Station', 422, 1, '2022-06-08 11:48:38.367', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (796, 'Testing Station - Retention', 422, 1, '2022-06-08 11:58:14.583', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (797, 'Taxi Rank', 5, 1, '2022-06-14 12:58:56.007', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (798, 'Taxi Rank', 424, 1, '2022-06-14 13:09:19.350', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (799, 'Network Server', 392, 1, '2022-10-03 14:15:40.390', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (800, 'Server Rack Mount', 392, 1, '2022-10-03 14:18:47.017', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (801, 'Sign Electronic LED', 309, 1, '2022-10-04 09:45:17.807', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (802, 'Manhole', 414, 1, '2022-10-04 10:27:17.717', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (803, 'High Mast Light', 416, 1, '2022-10-04 10:58:34.623', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (804, 'Post Top Light', 416, 1, '2022-10-04 11:00:27.933', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (805, 'Filing Cabinet', 336, 1, '2022-10-04 11:00:53.220', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (806, 'Visitors Chair', 336, 1, '2022-10-04 11:01:27.207', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (807, 'Light Box with Poles', 336, 1, '2022-10-04 11:01:58.237', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (808, 'Land', 426, 1, '2022-10-04 12:09:26.337', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (809, 'Cell Phone', 336, 1, '2022-10-04 14:49:48.953', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (810, 'Boardroom Table', 336, 1, '2022-10-04 14:50:28.010', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (811, 'Boardroom Desk', 336, 1, '2022-10-04 14:50:55.297', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (812, 'Brochure Stand', 336, 1, '2022-10-04 14:51:22.127', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (813, 'Bulk Filer', 336, 1, '2022-10-04 14:51:50.470', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (814, 'Chairs And Couches', 336, 1, '2022-10-04 14:52:19.853', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (815, 'Coat Stand', 336, 1, '2022-10-04 14:52:56.903', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (816, 'Coffee Table', 336, 1, '2022-10-04 14:53:48.993', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (817, 'Conference Table', 336, 1, '2022-10-04 14:54:34.600', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (818, 'Desk - Credenza and Pedestal', 336, 1, '2022-10-04 14:55:09.483', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (819, 'Desk Extension', 336, 1, '2022-10-04 14:55:41.160', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (820, 'Digital Voice Processing', 336, 1, '2022-10-04 14:56:11.140', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (821, 'Draughtsman Chair', 336, 1, '2022-10-04 14:56:39.750', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (822, 'Dual Vocal Set', 336, 1, '2022-10-04 14:57:12.653', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (823, 'Dunham Bush', 336, 1, '2022-10-04 14:57:39.370', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (824, 'Interactive White Board System-Projector', 336, 1, '2022-10-04 14:58:22.657', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (825, 'Loudhailer', 336, 1, '2022-10-04 14:58:58.683', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (826, 'Open L - Extension', 336, 1, '2022-10-04 14:59:24.157', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (827, 'Projector Stand', 336, 1, '2022-10-04 15:00:06.480', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (828, 'Quarter Link', 336, 1, '2022-10-04 15:00:33.007', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (829, 'Reception Counter', 336, 1, '2022-10-04 15:01:04.847', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (830, 'Trolley', 336, 1, '2022-10-04 15:01:40.577', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (831, 'Coat and Hat Stand', 336, 1, '2022-10-04 15:11:26.687', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (832, 'Amplifier', 336, 1, '2022-10-04 16:37:38.993', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (833, 'Beltpack Transmitter', 336, 1, '2022-10-04 16:38:13.597', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (834, 'Gym Stand Bars', 336, 1, '2022-10-04 16:38:44.443', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (835, 'TV Screen', 336, 1, '2022-10-04 16:58:48.090', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (836, 'Office Block - Electrical Connection', 385, 1, '2022-10-05 10:48:42.580', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (837, 'Generator Building', 368, 1, '2022-10-05 11:25:00.183', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (838, 'Street Light', 427, 1, '2022-10-05 11:30:25.757', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (839, 'Flowerbed And Shrub -Trees', 379, 1, '2022-10-05 12:50:42.867', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (840, 'Flowerbed And Shrub -Trees', 428, 1, '2022-10-05 12:53:16.917', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (841, 'Flowerbed And Shrub -Trees', 429, 1, '2022-10-05 12:53:55.083', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (842, 'Athletics Outdoor Track And Field', 383, 1, '2022-10-05 13:05:38.460', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (843, 'Ballade Poles', 372, 1, '2022-10-05 13:08:49.870', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (844, 'Culvert Pipe', 406, 1, '2022-10-05 13:16:26.763', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (845, 'Dwelling Flats', 377, 1, '2022-10-05 13:18:35.627', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (846, 'Pump Station Building', 377, 1, '2022-10-05 13:20:05.197', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (847, 'Rugby Field', 383, 1, '2022-10-05 13:23:30.977', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (848, 'Softball Field', 383, 1, '2022-10-05 13:24:14.043', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (849, 'Golf Course', 383, 1, '2022-10-05 13:24:46.450', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (850, 'Office Small Urban Office - Similar To House', 371, 1, '2022-10-05 13:28:26.077', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (851, 'Office Small Urban Office - Similar To House', 342, 1, '2022-10-05 13:38:09.580', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (852, 'Fire Arm', 430, 1, '2022-10-05 16:28:30.000', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (853, 'Other assets', 431, 1, '2022-10-06 08:35:22.430', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (854, 'Tennis Court', 383, 1, '2022-10-06 08:41:03.133', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (855, 'Flowerbed And Shrub -Trees', 373, 1, '2022-10-06 08:51:26.660', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (856, 'Medal', 434, 1, '2022-10-06 12:28:43.913', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (857, 'Chain', 434, 1, '2022-10-06 12:29:24.823', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (858, 'Server Mount Cabinet', 392, 1, '2022-10-06 12:39:52.730', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (859, 'External Hard Drive', 392, 1, '2022-10-06 12:47:00.723', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (860, 'Forticare', 392, 1, '2022-10-06 13:17:32.473', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (861, 'Document Sealer 2D', 392, 1, '2022-10-06 13:40:20.793', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (862, 'Monochrome Payslip Laser Printer', 392, 1, '2022-10-06 13:46:54.693', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (863, '2 Way Radio', 432, 1, '2022-10-07 10:08:12.940', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (864, 'Air Jack', 432, 1, '2022-10-07 10:08:41.787', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (865, 'Angle Grinder', 432, 1, '2022-10-07 10:09:08.023', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (866, 'Backhoe Loader-TLB', 432, 1, '2022-10-07 10:09:57.020', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (867, 'Battery Charger', 432, 1, '2022-10-07 10:10:39.727', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (868, 'Bench Press', 432, 1, '2022-10-07 10:11:11.540', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (869, 'Blower', 432, 1, '2022-10-07 10:12:12.377', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (870, 'Boom Spray', 432, 1, '2022-10-07 10:12:52.083', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (871, 'Cabinet Battery Box', 432, 1, '2022-10-07 10:13:33.177', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (872, 'Chainsaw', 432, 1, '2022-10-07 10:13:55.977', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (873, 'Cherry Picker', 432, 1, '2022-10-07 10:14:20.023', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (874, 'Cold Milling Machine', 432, 1, '2022-10-07 10:14:46.100', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (875, 'Compactor', 432, 1, '2022-10-07 10:15:12.220', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (876, 'Compressor', 432, 1, '2022-10-07 10:16:18.917', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (877, 'Converter', 432, 1, '2022-10-07 10:16:57.830', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (878, 'Crane', 432, 1, '2022-10-07 10:17:28.977', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (879, 'Diesel Bowser Trailer', 432, 1, '2022-10-07 10:17:52.267', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (880, 'Drill', 432, 1, '2022-10-07 10:18:40.250', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (881, 'Dumbbells', 432, 1, '2022-10-07 10:19:04.767', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (882, 'Dumpy Level', 432, 1, '2022-10-07 10:19:47.320', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (883, 'Edge Trimmer', 432, 1, '2022-10-07 10:20:11.183', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (884, 'Excavator', 432, 1, '2022-10-07 10:21:03.667', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (885, 'Fumigation Machine', 432, 1, '2022-10-07 10:21:26.680', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (886, 'Generator', 432, 1, '2022-10-07 10:21:52.930', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (887, 'Grader', 432, 1, '2022-10-07 10:22:40.737', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (888, 'Grass Cutter', 432, 1, '2022-10-07 10:23:47.410', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (889, 'Grass Cutter Machine', 432, 1, '2022-10-07 10:24:12.693', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (890, 'Grid Roller', 432, 1, '2022-10-07 10:24:36.207', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (891, 'Grinder', 432, 1, '2022-10-07 10:25:33.977', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (892, 'High Pressure Washer', 432, 1, '2022-10-07 10:25:57.080', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (893, 'Hydraulic Heavy Crimper', 432, 1, '2022-10-07 10:26:25.553', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (894, 'Industrial Generator', 432, 1, '2022-10-07 10:28:44.460', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (895, 'Jack', 432, 1, '2022-10-07 10:29:07.777', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (896, 'Licence Disk Scanner and Number Plate Recognition', 432, 1, '2022-10-07 10:29:32.927', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (897, 'Lifeguard Post and Seat', 432, 1, '2022-10-07 10:30:08.300', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (898, 'Lowbed', 432, 1, '2022-10-07 10:31:39.347', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (899, 'Maize Planter', 432, 1, '2022-10-07 10:32:03.720', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (900, 'Maximum User Weight', 432, 1, '2022-10-07 10:32:27.077', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (901, 'Maximum Weight Capacity', 432, 1, '2022-10-07 10:32:56.127', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (902, 'Measuring Wheel', 432, 1, '2022-10-07 10:33:21.907', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (903, 'Mouldboard Plough', 432, 1, '2022-10-07 10:33:46.133', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (904, 'Mower', 432, 1, '2022-10-07 10:34:22.310', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (905, 'Multipurpose Tester Digital', 432, 1, '2022-10-07 10:34:53.777', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (906, 'Offset Disc Harrow', 432, 1, '2022-10-07 10:37:13.327', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (907, 'Planter', 432, 1, '2022-10-07 10:39:16.773', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (908, 'Pressing Machine', 432, 1, '2022-10-07 10:48:32.203', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (909, 'Pruner Tree', 432, 1, '2022-10-07 10:49:54.043', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (910, 'Roadblock Lights', 432, 1, '2022-10-07 10:50:34.467', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (911, 'Roller', 432, 1, '2022-10-07 10:51:07.480', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (912, 'Skip Bin', 432, 1, '2022-10-07 10:51:33.147', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (913, 'Skip Truck', 432, 1, '2022-10-07 10:51:59.207', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (914, 'Speed Measuring Instrument', 432, 1, '2022-10-07 10:52:25.563', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (915, 'Speed Trapper', 432, 1, '2022-10-07 10:52:51.327', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (916, 'Tanker Fuel', 432, 1, '2022-10-07 10:53:17.180', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (917, 'Tar-Concrete Cutter Machine', 432, 1, '2022-10-07 10:53:57.123', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (918, 'Tip Truck', 432, 1, '2022-10-07 10:54:30.720', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (919, 'Tipper Truck', 432, 1, '2022-10-07 10:54:58.420', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (920, 'Tool bag set', 432, 1, '2022-10-07 10:55:50.423', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (921, 'Tractor', 432, 1, '2022-10-07 10:56:16.190', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (922, 'Tractor Roller Mower', 432, 1, '2022-10-07 10:56:42.913', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (923, 'Trailer', 432, 1, '2022-10-07 10:57:18.530', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (924, 'Treadmill', 432, 1, '2022-10-07 10:58:39.567', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (925, 'Truck', 432, 1, '2022-10-07 10:59:06.777', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (926, 'Tyre Inflator and Deflator', 432, 1, '2022-10-07 10:59:32.523', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (927, 'Vibratory Compactor', 432, 1, '2022-10-07 11:00:17.890', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (928, 'Water Pump Machine', 432, 1, '2022-10-07 11:01:05.847', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (929, 'Welding Machine', 432, 1, '2022-10-07 11:01:40.653', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (930, 'Inflatable ribbon', 433, 1, '2022-10-07 11:04:01.457', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (931, 'Grinder', 433, 1, '2022-10-07 11:04:28.520', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (932, 'Perimeter Protection', 435, 1, '2022-10-07 12:47:27.273', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (933, 'Boom Gate', 379, 1, '2022-10-07 13:14:24.100', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (934, 'Park Table', 379, 1, '2022-10-07 13:15:14.010', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (935, 'Flowerbed And Shrub -Trees', 366, 1, '2022-10-07 13:42:51.653', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (936, 'Hall-Indoor Sport Complex', 366, 1, '2022-10-07 13:43:38.397', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (937, 'Ablution - Change Rooms', 421, 1, '2022-10-07 13:45:09.330', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (938, 'Small Building - Enclosure', 421, 1, '2022-10-07 13:45:59.217', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (939, 'Kerb Barrier', 405, 1, '2022-10-07 13:46:41.967', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (940, 'Small Building - Enclosure', 436, 1, '2022-10-07 14:03:11.990', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (941, 'Perimeter Protection', 437, 1, '2022-10-07 14:03:44.223', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (942, 'Tank', 438, 1, '2022-10-07 14:04:14.683', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (943, 'Tank Stand', 438, 1, '2022-10-07 14:04:44.513', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (944, 'Fabricated Steel', 439, 1, '2022-10-07 14:10:05.407', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (945, 'Kerb Barrier', 408, 1, '2022-10-07 14:15:49.680', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (946, 'Gabions', 440, 1, '2022-10-07 14:17:09.417', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (947, 'Kerb Barrier', 406, 1, '2022-10-07 14:24:27.303', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (948, 'Hall-Indoor Sport Complex', 377, 1, '2022-10-07 14:25:15.277', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (949, 'Walkway', 379, 1, '2022-10-07 14:25:57.823', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (950, 'Carport', 379, 1, '2022-10-07 14:41:40.380', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (951, 'Laptop Docking Station', 392, 1, '2022-10-09 17:04:04.927', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (952, 'Patch Panel', 392, 1, '2022-10-09 17:09:29.263', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (953, 'Fiber Tray', 392, 1, '2022-10-09 17:13:32.333', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (954, 'NAS Storage', 392, 1, '2022-10-09 17:17:37.967', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (955, 'Proline', 392, 1, '2022-10-09 17:24:10.433', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (956, 'Optical Transceiver', 392, 1, '2022-10-09 18:32:42.387', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (957, 'Ablution - Change Rooms', 364, 1, '2022-10-10 07:55:16.033', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (958, 'External Furniture', 404, 1, '2022-10-10 08:08:32.917', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (959, 'Parking', 402, 1, '2022-10-10 08:23:31.193', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (960, 'Perimeter Protection', 441, 1, '2022-10-10 09:12:52.397', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (961, 'Heritage Assets', 442, 1, '2022-10-10 10:10:08.103', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (962, 'Culturally Significant Buildings', 442, 1, '2022-10-10 10:16:01.660', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (963, 'Combo Binder', 336, 1, '2022-11-02 15:15:09.653', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (964, 'Shelves', 336, 1, '2022-11-02 15:17:05.263', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (965, 'White Board', 336, 1, '2022-11-02 15:17:46.153', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (966, 'Interactive White Board System - Projector', 336, 1, '2022-11-02 15:19:20.727', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (967, 'Haelgeweer Maverick Kal', 430, 1, '2022-11-02 15:21:20.350', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (968, 'Haelgeweer Mossberg Kal', 430, 1, '2022-11-02 15:21:42.457', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (969, 'Haelgeweer Protecta Kal', 430, 1, '2022-11-02 15:22:14.233', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (970, 'Norinco 213 9mmp Pistol', 430, 1, '2022-11-02 15:22:55.140', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (971, 'Revolver Taurus 38 Special', 430, 1, '2022-11-02 15:23:15.857', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (972, 'Security System', 430, 1, '2022-11-02 15:54:34.570', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (973, 'Browning Firearm 9mm', 430, 1, '2022-11-02 15:59:50.830', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (974, 'Pistol Norinco Kal', 430, 1, '2022-11-02 16:00:36.070', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (975, 'Air Conditioner', 336, 1, '2022-11-02 16:06:04.650', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (976, 'Norinco Nz 75', 430, 1, '2022-11-03 08:18:14.863', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (977, 'Pistol Helwan Kal', 430, 1, '2022-11-03 08:18:46.990', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (978, 'Minibus', 341, 1, '2022-11-03 09:14:16.663', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (979, 'LDV', 341, 1, '2022-11-03 09:21:21.883', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (980, 'Sedan', 341, 1, '2022-11-03 09:22:27.787', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (981, 'SUV', 341, 1, '2022-11-03 09:22:51.190', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (982, 'Laptop Bag', 431, 1, '2022-11-03 09:27:13.623', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (983, 'AUC', 443, 1, '2022-11-17 13:19:18.897', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (984, 'AUC', 444, 1, '2022-11-17 13:23:25.163', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (985, 'AUC', 445, 1, '2022-11-17 13:27:16.350', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (986, 'AUC', 446, 1, '2022-11-17 13:30:16.780', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (987, 'AUC', 447, 1, '2022-11-17 13:32:46.247', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (988, 'AUC', 448, 1, '2022-11-17 13:35:28.523', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (989, 'AUC', 449, 1, '2022-11-17 13:37:35.367', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (990, 'AUC', 272, 1, '2022-11-30 08:52:57.723', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (991, 'AUC', 174, 1, '2022-11-30 08:56:27.697', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (992, 'AUC', 302, 1, '2022-11-30 08:56:58.160', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (993, 'Other Software', 450, 1, '2022-11-30 12:41:12.460', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (994, 'Computer Software', 451, 1, '2022-11-30 12:41:36.170', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (995, 'Server Software', 452, 1, '2022-11-30 12:41:59.237', 199, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (996, 'Camera', 392, 1, '2023-03-15 15:24:26.237', 271, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (997, 'Biometric Scanner', 392, 1, '2023-03-15 15:33:11.493', 271, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (998, 'Network Video Recorder', 392, 1, '2023-03-15 15:35:41.240', 271, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (999, 'Telephone handset', 338, 1, '2023-08-09 16:06:56.437', 271, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1000, 'Office Mobile', 385, 1, '2023-11-07 20:19:39.660', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1001, 'Office Small Urban', 385, 1, '2023-11-07 20:37:29.340', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1002, 'Ablution - Changeroom', 385, 1, '2023-11-07 20:38:04.017', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1003, 'Town Hall', 385, 1, '2023-11-07 20:39:44.480', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1004, 'Honorary Stone', 386, 1, '2023-11-07 20:40:54.127', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1005, 'V-Channel', 418, 1, '2023-11-07 20:42:02.953', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1006, 'Pump', 454, 1, '2023-11-07 20:43:01.013', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1007, 'K53 Drivers Testing Incline', 390, 1, '2023-11-07 20:44:51.790', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1008, 'Kerb Barrier', 418, 1, '2023-11-07 20:47:33.597', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1009, 'Channel', 418, 1, '2023-11-07 20:48:11.003', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1010, 'Lunar 24 Gps Module', 309, 1, '2023-11-08 09:31:34.590', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1011, 'Gabions', 414, 1, '2023-11-08 11:07:51.340', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1012, 'Blue lamps and siren', 341, 1, '2023-11-08 15:21:28.753', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1013, 'Outdoor Exercise Equipment', 383, 1, '2023-11-08 16:24:10.130', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1014, 'GPS', 432, 1, '2023-11-08 19:21:06.507', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1015, 'Tow Tractor Bell For Grid Roller', 2, 1, '2023-11-08 19:22:07.503', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1016, 'Fire Compression - Control Panel', 432, 1, '2023-11-08 19:24:37.470', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1017, 'Radio 2-Way', 432, 1, '2023-11-08 20:06:17.433', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1018, 'Tow Tractor Bell For Grid Roller', 432, 1, '2023-11-08 20:07:48.820', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1019, 'Road Marking Machine', 432, 1, '2023-11-08 20:08:32.007', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1020, 'Backhoe Loader - TLB', 432, 1, '2023-11-08 20:18:16.063', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1021, 'Tar - Concrete Cutter Machine', 432, 1, '2023-11-08 20:18:56.493', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1022, 'Inflatable ribbon', 432, 1, '2023-11-08 20:30:58.500', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1023, 'Slide', 383, 1, '2023-11-08 20:51:38.910', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1024, 'Swing', 383, 1, '2023-11-08 20:59:21.917', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1025, 'See Saw', 383, 1, '2023-11-08 21:05:04.500', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1026, 'Laptop Bag', 392, 1, '2023-11-09 08:07:10.823', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1027, 'Speedpoint', 392, 1, '2023-11-09 08:07:44.830', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1028, 'Ablution - Change Rooms', 371, 1, '2023-11-09 09:02:45.360', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1029, 'Urban Office', 371, 1, '2023-11-09 09:12:06.193', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1030, 'Urban Office', 342, 1, '2023-11-09 09:14:40.993', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1031, 'Roller Door', 366, 1, '2023-11-09 09:41:42.177', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1032, 'Roller Door', 379, 1, '2023-11-09 09:43:47.013', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1033, 'Pump - Centrifugal', 455, 1, '2023-11-09 10:06:31.913', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1034, 'Starting Block', 379, 1, '2023-11-09 10:11:28.643', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1035, 'Club House', 377, 1, '2023-11-09 10:41:12.703', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1036, 'Borehole Enclosure', 377, 1, '2023-11-09 10:57:34.217', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1037, 'Pump -Hydraulic', 455, 1, '2023-11-09 11:01:46.733', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1038, 'Filing Shelves', 336, 1, '2023-11-09 11:54:27.467', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1039, 'Trolley - Tea', 336, 1, '2023-11-09 11:55:27.470', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1040, 'Reception Table', 336, 1, '2023-11-09 11:56:37.243', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1041, 'Pistol Safe', 336, 1, '2023-11-09 11:57:13.433', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1042, 'Filer Bay', 336, 1, '2023-11-09 11:58:14.113', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1043, 'Book Shelves', 336, 1, '2023-11-09 11:59:41.000', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1044, 'Filing Cupboard', 336, 1, '2023-11-09 12:00:20.650', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1045, 'Telephone Handset', 336, 1, '2023-11-09 12:14:43.913', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1046, 'Light Box', 336, 1, '2023-11-09 12:16:01.127', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1047, 'Walkway', 363, 1, '2023-11-09 15:15:28.117', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1048, 'Handrails', 379, 1, '2023-11-09 15:31:18.213', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1049, 'Parking', 382, 1, '2023-11-09 15:43:33.953', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1050, 'Channel', 408, 1, '2023-11-09 15:52:14.580', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1051, 'Boreholes', 379, 1, '2023-11-09 16:01:59.093', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1052, 'Flood Light', 351, 1, '2023-11-09 16:08:29.433', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1053, 'Pump', 351, 1, '2023-11-09 16:09:19.330', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1054, 'Gabions', 456, 1, '2023-11-09 16:09:35.310', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1055, 'Culturally Significant Buildings Cost', 442, 1, '2023-11-09 16:11:13.747', 251, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1056, 'Land', 353, 1, '2023-11-09 16:12:39.773', 252, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1057, 'Ablution Block', 342, 1, '2023-11-09 16:19:08.373', 285, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1058, 'Sign Electronic Led', 388, 1, '2023-11-09 16:36:23.423', 339, NULL);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1059, 'Pump (Hydraulic)', 457, 1, '2024-04-15 06:40:54.787', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1060, 'Paved Area', 351, 1, '2024-04-15 09:34:13.183', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1061, 'Land', 458, 1, '2024-04-15 11:17:57.457', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1062, 'Megaphone Handheld', 338, 1, '2024-04-15 13:46:38.547', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1063, 'Loud Hailer', 336, 1, '2024-04-15 13:48:09.360', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1064, 'Water Pump Machine', 454, 1, '2024-04-15 16:39:06.267', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1065, 'Honorary Stone', 388, 1, '2024-04-15 16:41:12.017', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1066, 'Kerb Barrier', 390, 1, '2024-04-15 16:48:45.903', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1067, 'Retaining Wall', 386, 1, '2024-04-15 16:54:38.153', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1068, 'Channel', 386, 1, '2024-04-15 16:57:03.550', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1069, 'Halls', 364, 1, '2024-04-15 17:53:18.923', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1070, 'Swimming Pool Starting Block', 379, 1, '2024-04-15 17:55:43.873', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1071, 'Small Urban Office', 459, 1, '2024-04-15 18:05:31.097', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1072, 'Roller Door', 364, 1, '2024-04-15 18:13:15.657', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1073, 'Roller Door', 377, 1, '2024-04-15 18:13:57.083', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1074, 'Pavement', 382, 1, '2024-04-15 18:22:14.033', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1075, 'Pavement', 402, 1, '2024-04-15 18:24:38.657', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1076, 'Boreholes', 372, 1, '2024-04-15 18:37:01.860', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1077, 'Boreholes', 378, 1, '2024-04-15 18:37:41.783', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1078, 'Borehole Enclosure', 378, 1, '2024-04-15 18:54:40.153', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1079, 'Water Pump Machine', 378, 1, '2024-04-15 18:57:02.160', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1080, 'Gabions', 378, 1, '2024-04-15 18:57:12.880', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1081, 'Sports Ground', 420, 1, '2024-04-19 14:05:50.780', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1082, 'House', 421, 1, '2024-04-19 14:06:06.503', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1083, 'Building', 435, 1, '2024-04-19 14:07:21.263', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1084, 'House', 460, 1, '2024-04-19 14:11:37.407', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1085, 'Operational Buildings', 385, 1, '2024-04-19 14:12:28.207', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1086, 'Unpaved Road', 462, 1, '2024-04-19 14:41:08.800', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1087, 'High Mast Light', 461, 1, '2024-04-19 14:41:32.740', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1088, 'Building', 463, 1, '2024-04-19 14:46:36.587', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1089, 'Operational Buildings', 464, 1, '2024-04-19 14:56:14.840', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1090, 'HP Probook 450 G10 (IS)', 466, 1, '2024-04-19 16:08:09.610', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1091, 'HP Probook 450 G11 (IS)', 466, 1, '2024-04-19 16:08:19.710', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1092, 'HP Probook 450 G12 (IS)', 466, 1, '2024-04-19 16:08:30.217', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1093, 'HP Probook 450 G13 (IS)', 466, 1, '2024-04-19 16:08:52.270', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1094, 'Television', 465, 1, '2024-04-19 16:11:23.030', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1095, 'Water Separation', 465, 1, '2024-04-19 16:11:32.420', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1096, 'Shredder Machine', 465, 1, '2024-04-19 16:11:40.397', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1097, 'Gazebo', 465, 1, '2024-04-19 16:11:50.293', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1098, 'Furrow', 467, 1, '2024-04-19 16:12:07.783', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1099, 'Compactor truck', 467, 1, '2024-04-19 16:12:15.387', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1100, 'Road Sweeper', 467, 1, '2024-04-19 16:12:22.707', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1101, 'Jump Starter', 467, 1, '2024-04-19 16:12:30.997', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1102, 'Hydraulic Jack', 467, 1, '2024-04-19 16:12:39.517', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1103, 'Laptop', 466, 1, '2024-04-19 17:16:18.610', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1104, 'Printer', 466, 1, '2024-04-19 17:16:28.840', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1105, 'Chain Saw', 467, 1, '2024-04-19 17:17:38.407', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1106, 'Excavator', 467, 1, '2024-04-19 17:17:50.687', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1107, 'Concrete Cutter Machine', 467, 1, '2024-04-19 17:18:01.427', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1108, 'Grader', 467, 1, '2024-04-19 17:18:11.057', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1109, 'Chair', 465, 1, '2024-04-19 17:18:42.593', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1110, 'Microwave', 465, 1, '2024-04-19 17:18:54.730', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1111, 'Fridge', 465, 1, '2024-04-19 17:19:04.767', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1112, 'Projector', 465, 1, '2024-04-19 17:19:13.263', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1113, 'Airconditioner', 465, 1, '2024-04-19 17:19:25.173', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1114, 'Voice Recorder', 465, 1, '2024-04-19 17:19:38.873', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1115, 'Table', 465, 1, '2024-04-19 17:19:52.293', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1116, 'Chair High Back', 465, 1, '2024-04-19 17:38:45.330', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1117, 'Camera', 465, 1, '2024-04-19 17:47:02.133', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1118, 'SUV', 468, 1, '2024-04-19 17:51:16.430', 562, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1119, 'TV Monitor', 466, 1, '2024-07-12 16:30:33.030', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1120, 'Mobile Devices', 466, 1, '2024-07-12 16:46:31.347', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1121, 'Biometric', 392, 1, '2024-10-07 15:37:11.487', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1122, 'Camera Set', 392, 1, '2024-10-07 15:37:33.293', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1123, 'Car Siren', 341, 1, '2024-10-07 15:38:53.580', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1124, 'CCTV NVR', 392, 1, '2024-10-07 15:39:25.563', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1125, 'Document Sealer', 392, 1, '2024-10-07 15:39:52.020', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1126, 'Dot Matrix Flatbed Printer', 392, 1, '2024-10-07 15:40:13.110', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1127, 'Foldable Table', 336, 1, '2024-10-07 15:41:00.253', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1128, 'Microphone Switchboard', 336, 1, '2024-10-07 15:41:34.683', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1129, 'Network Cabinet', 392, 1, '2024-10-07 15:42:54.560', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1130, 'Smart TV Screen', 392, 1, '2024-10-07 15:43:24.207', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1131, 'Decoder', 392, 1, '2024-10-07 15:44:01.617', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1132, 'Vehicle Jump Start', 432, 1, '2024-10-07 15:44:46.883', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1133, 'Digital Camera', 336, 1, '2024-10-07 15:52:20.427', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1134, 'Office Post Box', 336, 1, '2024-10-07 15:59:56.363', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1135, 'Bucket and Wringer', 336, 1, '2024-10-07 16:08:46.640', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1136, 'Filer Bulk 9 Bay', 336, 1, '2024-10-07 16:09:14.390', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1137, 'Media Portable Player', 336, 1, '2024-10-07 16:09:35.360', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1138, 'Reception Desk', 336, 1, '2024-10-07 16:09:56.157', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1139, 'Wireless Microphone System', 336, 1, '2024-10-07 16:10:17.330', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1140, 'Cabinet Battery Box', 392, 1, '2024-10-07 16:21:33.453', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1141, 'Smart TV Screen', 336, 1, '2024-10-07 16:22:06.930', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1142, 'Gazebo', 336, 1, '2024-10-07 16:22:22.953', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1143, 'Mobile Devices', 392, 1, '2024-10-07 16:22:41.373', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1144, 'Road Sweeper', 340, 1, '2024-10-07 16:29:01.173', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1145, 'Dwelling Low Cost Housing', 469, 1, '2024-10-07 18:27:03.547', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1146, 'Dwelling Normal Size House', 469, 1, '2024-10-07 18:27:10.603', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1147, 'Braai', 470, 1, '2024-10-07 18:31:46.107', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1148, 'Perimeter Protection', 470, 1, '2024-10-07 18:31:55.790', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1149, 'Land', 471, 1, '2024-10-07 18:32:26.160', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1150, 'Horse Racing Field', 472, 1, '2024-10-07 18:40:00.160', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1151, 'Netball Court', 472, 1, '2024-10-07 18:40:11.617', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1152, 'Rugby Field', 472, 1, '2024-10-07 18:40:22.187', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1153, 'Sport Facility', 472, 1, '2024-10-07 18:40:32.800', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1154, 'Football (Soccer) Pitch', 472, 1, '2024-10-07 18:40:52.510', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1155, 'Swimming Pool', 472, 1, '2024-10-07 18:41:20.680', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1156, 'Animal Pound', 463, 1, '2024-10-07 18:45:17.560', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1157, 'Buildings', 464, 1, '2024-10-07 18:46:46.593', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1158, 'Bullet Proof Windows', 385, 1, '2024-10-07 18:47:22.777', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1159, 'Flag Pole', 351, 1, '2024-10-07 18:48:05.667', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1160, 'Kerb Edge', 414, 1, '2024-10-07 18:48:43.910', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1161, 'Park Bench', 309, 1, '2024-10-07 18:49:21.607', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1162, 'Parks', 473, 1, '2024-10-07 18:51:56.593', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1163, 'PPE Developed Land', 426, 1, '2024-10-07 18:52:39.380', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1164, 'PPE Undeveloped Land', 426, 1, '2024-10-07 18:53:17.637', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1165, 'Roads', 462, 1, '2024-10-07 18:54:24.707', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1166, 'Turnstiles', 404, 1, '2024-10-07 18:55:10.287', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1167, 'Golf Course', 474, 1, '2024-10-07 19:09:13.543', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1168, 'Softball Field', 474, 1, '2024-10-07 19:09:25.637', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1169, 'Tennis Court', 474, 1, '2024-10-07 19:09:35.453', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1170, 'Outdoor Exercise Equipment', 379, 1, '2024-10-07 19:12:14.430', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1171, 'Internal Road', 402, 1, '2024-10-07 19:20:40.193', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1172, 'Horse Racing Field', 420, 1, '2024-10-07 19:22:28.887', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1173, 'Speed Hump', 475, 1, '2024-10-07 19:42:02.460', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1174, 'Pump (Hydraulic)', 476, 1, '2024-10-07 19:47:04.980', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1175, 'Fabricated Steel', 477, 1, '2024-10-07 19:49:35.350', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1176, 'Ablution - Change Rooms', 342, 1, '2024-10-07 19:53:12.330', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1177, 'Dwelling Flats', 353, 1, '2024-10-07 19:59:42.023', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1178, 'Community Hall', 353, 1, '2024-10-07 20:03:45.013', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1179, 'Railing - Handrails', 366, 1, '2024-10-07 20:04:58.020', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1180, 'Pump (Hydraulic)', 454, 1, '2024-10-07 20:06:03.027', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1181, 'Street Light', 373, 1, '2024-10-07 20:12:08.090', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1182, 'Paving', 478, 1, '2024-10-07 20:20:46.593', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1183, 'Small Building - Enclosure', 423, 1, '2024-10-07 20:27:12.060', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1184, 'Tank Stand', 479, 1, '2024-10-07 20:32:09.530', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1185, 'Tank', 479, 1, '2024-10-07 20:34:39.560', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1186, 'Ablution - Change Rooms', 480, 1, '2024-10-07 20:39:26.027', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1187, 'Culvert Pipe', 481, 1, '2024-10-07 20:41:54.840', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1188, 'Walkway', 404, 1, '2024-10-07 20:44:15.130', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1189, 'Catchpit', 481, 1, '2024-10-07 20:50:40.447', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1190, 'Paved Area', 482, 1, '2024-10-07 20:55:26.853', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1191, 'Handrails', 404, 1, '2024-10-07 20:59:54.227', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1192, 'External Lighting', 404, 1, '2024-10-07 21:02:18.323', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1193, 'Roller Door', 404, 1, '2024-10-07 21:04:13.717', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1194, 'Footpath', 404, 1, '2024-10-07 21:06:12.680', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1195, 'Kerb Barrier', 481, 1, '2024-10-07 21:08:16.847', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1196, 'Channel', 481, 1, '2024-10-07 21:10:33.290', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1197, 'Office Block', 480, 1, '2024-10-07 21:12:37.433', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1198, 'Parking', 482, 1, '2024-10-07 21:13:38.070', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1199, 'Pump - Centrifugal', 483, 1, '2024-10-07 21:15:45.707', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1200, 'Pump Station Building', 480, 1, '2024-10-07 21:16:41.307', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1201, 'Retaining Wall', 479, 1, '2024-10-07 21:23:00.493', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1202, 'Internal Road', 482, 1, '2024-10-07 21:26:41.773', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1203, 'Small Building - Enclosure', 480, 1, '2024-10-07 21:29:56.467', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1204, 'Ballade Poles', 479, 1, '2024-10-07 21:31:56.380', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1205, 'Parking', 388, 1, '2024-10-07 21:36:06.583', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1206, 'Pump - Centrifugal', 454, 1, '2024-10-07 21:36:51.653', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1207, 'Perimeter Protection', 411, 1, '2024-10-07 21:38:36.330', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1208, 'Walkway', 351, 1, '2024-10-07 21:44:13.697', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1209, 'Retaining Wall', 399, 1, '2024-10-07 21:45:17.723', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1210, 'External Furniture', 351, 1, '2024-10-07 21:46:20.343', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1211, 'Office Block', 353, 1, '2024-10-07 21:47:33.467', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1212, 'Sign - Information', 484, 1, '2024-10-07 21:49:29.147', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1213, 'Club House', 353, 1, '2024-10-07 21:50:16.393', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1214, 'Street Light', 485, 1, '2024-10-07 22:15:01.023', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1215, 'Paving', 486, 1, '2024-10-07 22:28:37.240', 199, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1216, 'Drone', 490, 1, '2025-02-17 11:27:33.997', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1217, 'Earthworks', 85, 1, '2025-02-26 13:38:25.497', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1218, 'Earthworks', 491, 1, '2025-02-26 13:50:22.473', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1219, 'Community Assets', 492, 1, '2025-03-12 08:21:29.693', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1220, 'Firearms', 430, 1, '2025-06-02 06:09:12.560', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1221, 'Buildings', 353, 1, '2025-11-11 16:11:35.053', 271, 0);
INSERT INTO "Const_Asset_CIDMS_Component_Type" ("AssetCIDMSComponentTypeID", "AssetCIDMSComponentTypeDesc", "AssetCIDMSAssetTypeID", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1222, 'Outdoor Furniture', 148, 1, '2025-11-11 16:49:58.167', 271, 0);
SELECT setval(pg_get_serial_sequence('"Const_Asset_CIDMS_Component_Type"', 'AssetCIDMSComponentTypeID'), (SELECT COALESCE(MAX("AssetCIDMSComponentTypeID"),1) FROM "Const_Asset_CIDMS_Component_Type"));

-- Const_Asset_CIDMS_SubComponent_Type seed data (full reload)
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1, 'Trolley', 366, 0, 1, 1, '2021-05-07 17:07:14.113', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (2, 'Tray', 365, 0, 1, 1, '2021-05-07 17:07:28.337', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (3, 'Light Box', 367, 0, 1, 1, '2021-05-07 17:08:15.537', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (4, 'Air Conditioner', 272, 0, 1, 1, '2021-05-07 17:09:00.950', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (5, 'Alcotest', 273, 0, 1, 1, '2021-05-07 17:09:23.183', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (6, 'Bar Fridge', 274, 0, 1, 1, '2021-05-07 17:09:43.457', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (7, 'Bench', 275, 0, 1, 1, '2021-05-07 17:10:01.687', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (8, 'Bid Box', 276, 0, 1, 1, '2021-05-07 17:10:34.063', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (9, 'Binders', 277, 0, 1, 1, '2021-05-07 17:10:52.083', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (10, 'Book display', 278, 0, 1, 1, '2021-05-07 17:11:11.650', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (11, 'Bookcase', 279, 0, 1, 1, '2021-05-07 17:11:33.430', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (12, 'Cabinet', 280, 0, 1, 1, '2021-05-07 17:12:01.193', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (13, 'Camera', 281, 0, 1, 1, '2021-05-07 17:12:28.477', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (14, 'CAMERA SONY CYBERSHOT', 282, 0, 1, 1, '2021-05-07 17:12:50.167', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (15, 'CANON DIGITAL CAMERA', 283, 0, 1, 1, '2021-05-07 17:13:16.773', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (16, 'CANON DIGITAL CAMERA EOS 700D', 284, 0, 1, 1, '2021-05-07 17:13:34.373', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (17, 'Cash Drawer', 285, 0, 1, 1, '2021-05-07 17:13:55.280', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (18, 'Chair', 286, 1, 1, 1, '2021-05-07 17:14:38.533', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (19, 'Coat & Hat Stand', 287, 0, 1, 1, '2021-05-07 17:14:57.883', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (20, 'Computer', 288, 0, 1, 1, '2021-05-07 17:15:33.247', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (21, 'Computer Box', 289, 0, 1, 1, '2021-05-07 17:15:53.050', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (22, 'Computer Stand', 290, 0, 1, 1, '2021-05-07 17:16:12.927', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (23, 'Couch', 291, 0, 1, 1, '2021-05-07 17:16:36.797', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (24, 'Counter', 292, 0, 1, 1, '2021-05-07 17:16:58.587', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (25, 'CPU', 293, 0, 1, 1, '2021-05-07 17:17:20.087', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (26, 'Credenza', 294, 0, 1, 1, '2021-05-07 17:19:53.667', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (27, 'Cupboard', 295, 0, 1, 1, '2021-05-07 17:20:14.780', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (28, 'Data Projector', 296, 0, 1, 1, '2021-05-07 17:20:38.453', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (29, 'Data Sheet', 297, 0, 1, 1, '2021-05-07 17:21:00.960', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (30, 'Desk', 298, 1, 1, 1, '2021-05-07 17:21:22.477', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (31, 'Desktop', 299, 0, 1, 1, '2021-05-07 17:21:46.663', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (32, 'Drawer', 300, 0, 1, 1, '2021-05-07 17:23:00.897', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (33, 'Drawers', 301, 0, 1, 1, '2021-05-07 17:23:26.120', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (34, 'DVD Drive', 302, 0, 1, 1, '2021-05-07 17:23:51.010', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (35, 'Fax', 303, 0, 1, 1, '2021-05-07 17:26:20.817', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (36, 'Filer', 304, 0, 1, 1, '2021-05-07 17:26:40.530', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (37, 'Folding Machine', 305, 0, 1, 1, '2021-05-07 17:27:04.113', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (38, 'Franking Machine', 306, 0, 1, 1, '2021-05-07 17:27:26.890', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (39, 'Fridge', 307, 0, 1, 1, '2021-05-07 17:27:48.523', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (40, 'Hard Drive', 308, 1, 1, 1, '2021-05-07 17:28:08.737', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (41, 'Heater', 309, 1, 1, 1, '2021-05-07 17:29:13.370', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (42, 'Ipad', 310, 1, 1, 1, '2021-05-07 17:29:34.810', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (43, 'Laminator', 311, 1, 1, 1, '2021-05-07 17:29:54.193', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (44, 'Laptop', 312, 1, 1, 1, '2021-05-07 17:30:13.353', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (45, 'LICENCE DISK SCANNER AND NUMBER PLATE RECOGNITION', 313, 1, 1, 1, '2021-05-07 17:32:31.027', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (46, 'Locker', 314, 0, 1, 1, '2021-05-07 17:32:52.140', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (47, 'Media Player', 315, 1, 1, 1, '2021-05-07 17:33:17.393', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (48, 'Megaphone', 316, 1, 1, 1, '2021-05-07 17:33:40.603', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (49, 'Mic Stand', 317, 1, 1, 1, '2021-05-07 17:33:59.647', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (50, 'Microphones', 318, 1, 1, 1, '2021-05-07 17:34:19.477', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (51, 'Microwave', 319, 1, 1, 1, '2021-05-07 17:34:44.530', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (52, 'Mixing Console', 320, 1, 1, 1, '2021-05-07 17:35:06.700', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (53, 'Monitor', 321, 1, 1, 1, '2021-05-07 17:35:29.413', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (54, 'Notice Board', 322, 1, 1, 1, '2021-05-07 17:35:56.283', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (55, 'OLYMPUS DIGITAL VOICE RECORDER', 323, 1, 1, 1, '2021-05-07 17:36:32.530', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (56, 'Pedenza', 324, 1, 1, 1, '2021-05-07 17:36:59.150', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (57, 'Pedestal', 325, 1, 1, 1, '2021-05-07 17:37:27.683', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (58, 'Phone', 326, 1, 1, 1, '2021-05-07 17:37:49.777', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (59, 'Pigeon Hole', 327, 1, 1, 1, '2021-05-07 17:38:11.980', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (60, 'Pin Board', 328, 1, 1, 1, '2021-05-07 17:38:33.540', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (61, 'Podium', 329, 1, 1, 1, '2021-05-07 17:38:55.747', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (62, 'Portable Drive', 330, 1, 1, 1, '2021-05-07 17:39:13.713', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (63, 'Post Box', 331, 1, 1, 1, '2021-05-07 17:39:35.827', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (64, 'Printer', 332, 1, 1, 1, '2021-05-07 17:39:55.597', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (65, 'Projector', 333, 1, 1, 1, '2021-05-07 17:40:23.143', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (66, 'Rack Server', 334, 1, 1, 1, '2021-05-07 17:40:44.377', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (67, 'Recorder', 335, 1, 1, 1, '2021-05-07 17:41:10.683', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (68, 'Roof rack', 336, 1, 1, 1, '2021-05-07 17:41:33.037', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (69, 'Router', 337, 1, 1, 1, '2021-05-07 17:43:22.260', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (70, 'Safe', 338, 1, 1, 1, '2021-05-07 17:43:45.587', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (71, 'Screen', 339, 1, 1, 1, '2021-05-07 17:44:07.067', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (72, 'Screen Divider', 340, 1, 1, 1, '2021-05-07 17:44:27.460', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (73, 'Seater', 341, 1, 1, 1, '2021-05-07 17:44:50.373', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (74, 'Server', 342, 1, 1, 1, '2021-05-07 17:45:12.037', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (75, 'Shelf', 343, 1, 1, 1, '2021-05-07 17:45:35.007', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (76, 'Shelving', 344, 1, 1, 1, '2021-05-07 17:45:56.107', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (77, 'Shredder', 345, 1, 1, 1, '2021-05-07 17:46:18.497', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (78, 'Speaker', 346, 1, 1, 1, '2021-05-07 17:46:42.150', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (79, 'Speaker Stand', 347, 1, 1, 1, '2021-05-07 17:47:05.857', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (80, 'Speed Measuring Intrument', 348, 1, 1, 1, '2021-05-07 17:47:30.310', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (81, 'Speed Trapper', 349, 1, 1, 1, '2021-05-07 17:47:53.797', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (82, 'Stand', 350, 1, 1, 1, '2021-05-07 17:48:18.877', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (83, 'Suggestion Box', 351, 1, 1, 1, '2021-05-07 17:48:44.173', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (84, 'Switch', 352, 1, 1, 1, '2021-05-07 17:49:08.007', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (85, 'Switchboard', 353, 1, 1, 1, '2021-05-07 17:49:31.077', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (86, 'Table', 354, 0, 1, 1, '2021-05-07 17:49:51.460', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (87, 'Tender Box', 355, 1, 1, 1, '2021-05-07 17:50:22.800', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (88, 'Tennis Table', 356, 1, 1, 1, '2021-05-07 17:50:45.047', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (89, 'Trunk', 357, 1, 1, 1, '2021-05-07 17:51:08.220', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (90, 'Urn', 358, 1, 1, 1, '2021-05-07 17:51:30.440', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (91, 'Vacuum Cleaner', 359, 1, 1, 1, '2021-05-07 17:51:53.383', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (92, 'Voice Recorder', 360, 1, 1, 1, '2021-05-07 17:52:20.507', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (93, 'Wall unit', 361, 1, 1, 1, '2021-05-07 17:52:42.027', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (94, 'Water Dispenser', 364, 1, 1, 1, '2021-05-07 17:53:04.437', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (95, 'Whiteboard', 362, 1, 1, 1, '2021-05-07 17:53:25.887', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (96, 'Workstation', 363, 0, 1, 1, '2021-05-07 17:53:48.623', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (97, 'BROWNING FIREARM 9MM', 368, 0, 1, 1, '2021-05-07 18:02:47.843', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (98, 'Haelgeweer', 369, 1, 1, 1, '2021-05-07 18:03:23.253', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (99, 'NORINCO 213 9MMP PISTOLS', 370, 1, 1, 1, '2021-05-07 18:03:40.867', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (100, 'NORINCO NZ 75', 371, 1, 1, 1, '2021-05-07 18:04:00.360', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (101, 'PISTOL HELWAN KAL', 372, 1, 1, 1, '2021-05-07 18:04:20.340', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (102, 'PISTOL NORINCO KAL', 373, 1, 1, 1, '2021-05-07 18:04:40.340', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (103, 'Revolver', 374, 1, 1, 1, '2021-05-07 18:05:00.583', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (104, 'Security System', 375, 1, 1, 1, '2021-05-07 18:05:23.450', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (105, 'Bar Fridge', 273, 1, 1, 1, '2021-05-11 08:45:42.777', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (106, 'Megaphone', 273, 1, 1, 1, '2021-05-11 08:46:07.083', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (107, 'Podium', 273, 1, 1, 1, '2021-05-11 08:46:18.310', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (108, 'Battery Charger', 387, 1, 1, 1, '2021-05-11 08:47:13.140', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (109, 'Bench Presser', 388, 1, 1, 1, '2021-05-11 08:47:29.627', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (110, 'Bin', 389, 1, 1, 1, '2021-05-11 08:47:50.537', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (111, 'Blower', 390, 1, 1, 1, '2021-05-11 08:48:14.120', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (112, 'Chainsaw', 385, 0, 1, 1, '2021-05-11 08:48:36.860', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (113, 'Compactor', 407, 1, 1, 1, '2021-05-11 08:49:05.160', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (114, 'Compressor', 408, 1, 1, 1, '2021-05-11 08:49:26.807', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (115, 'Concrete Cutter', 415, 0, 1, 1, '2021-05-11 08:49:45.727', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (116, 'Converter', 401, 1, 1, 1, '2021-05-11 08:50:07.350', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (117, 'Crane', 409, 1, 1, 1, '2021-05-11 08:50:26.443', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (118, 'Diesel Bowser', 394, 1, 1, 1, '2021-05-11 08:50:45.543', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (119, 'Dumbells', 393, 1, 1, 1, '2021-05-11 08:51:03.817', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (120, 'Drill', 414, 1, 1, 1, '2021-05-11 08:51:19.780', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (121, 'Excavator', 395, 1, 1, 1, '2021-05-11 08:51:40.470', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (122, 'Fumigator', 396, 1, 1, 1, '2021-05-11 08:51:55.733', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (123, 'Generator', 392, 1, 1, 1, '2021-05-11 08:52:20.733', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (124, 'Jack', 384, 0, 1, 1, '2021-05-11 08:52:54.047', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (125, 'Grader', 397, 1, 1, 1, '2021-05-11 08:53:09.473', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (126, 'Grass cutter', 398, 1, 1, 1, '2021-05-11 08:53:25.767', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (127, 'Lights', 410, 1, 1, 1, '2021-05-11 08:53:49.940', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (128, 'Lawnmower', 402, 1, 1, 1, '2021-05-11 08:54:04.883', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (129, 'Marking Machine', 413, 1, 1, 1, '2021-05-11 08:54:22.017', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (130, 'Picker', 400, 1, 1, 1, '2021-05-11 08:54:49.973', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (131, 'Measuring Wheel', 405, 1, 1, 1, '2021-05-11 08:55:05.920', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (132, 'Mower', 404, 1, 1, 1, '2021-05-11 08:55:21.460', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (133, 'Radio', 383, 1, 1, 1, '2021-05-11 08:56:13.413', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (134, 'Pressing Machine', 412, 1, 1, 1, '2021-05-11 08:56:45.133', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (135, 'Pruner', 406, 1, 1, 1, '2021-05-11 08:59:29.077', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (136, 'Roller', 399, 1, 1, 1, '2021-05-11 08:59:57.563', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (137, 'Tanker', 416, 1, 1, 1, '2021-05-11 09:06:07.110', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (138, 'Tipper', 411, 1, 1, 1, '2021-05-11 09:06:22.743', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (139, 'TLB', 391, 1, 1, 1, '2021-05-11 09:07:43.067', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (140, 'Tractor', 418, 1, 1, 1, '2021-05-11 09:07:57.610', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (141, 'Tredmill', 419, 0, 1, 1, '2021-05-11 09:08:15.760', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (142, 'Trimmer', 386, 1, 1, 1, '2021-05-11 09:08:59.320', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (143, 'Water Dispenser', 417, 1, 1, 1, '2021-05-11 09:09:22.310', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (144, 'Water Pump', 421, 1, 1, 1, '2021-05-11 09:09:41.557', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (145, 'Weight', 403, 1, 1, 1, '2021-05-11 09:10:50.290', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (146, 'Waterwell', 420, 1, 1, 1, '2021-05-11 09:11:07.313', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (147, 'Welding Machine', 422, 1, 1, 1, '2021-05-11 09:11:22.280', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (148, 'Bakkie', 376, 0, 1, 1, '2021-05-11 09:12:06.357', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (149, 'Bus', 377, 1, 1, 1, '2021-05-11 09:12:31.737', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (150, 'Car', 378, 1, 1, 1, '2021-05-11 09:12:55.033', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (151, 'Combi', 379, 1, 1, 1, '2021-05-11 09:13:10.553', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (152, 'Truck', 382, 1, 1, 1, '2021-05-11 09:13:30.823', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (153, 'Jeep', 380, 1, 1, 1, '2021-05-11 09:13:51.427', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (154, 'Trailer', 381, 1, 1, 1, '2021-05-11 09:14:07.423', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (155, 'CHAIR HIGH BACK', 423, 0, 1, 1, '2021-05-11 09:19:01.527', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (156, 'Walls', 424, 1, 1, 1, '2021-06-11 14:32:12.620', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (157, 'Kerb Inlet', 425, 1, 1, 1, '2021-06-11 14:32:35.937', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (158, 'Taxi Rank', 426, 1, 1, 1, '2021-06-11 14:33:22.760', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (159, 'External Furniture', 426, 1, 1, 1, '2021-06-11 14:33:35.943', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (160, 'Footpath', 427, 1, 1, 1, '2021-06-11 14:33:58.050', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (161, 'Perimeter Protection', 428, 1, 1, 1, '2021-06-11 14:34:07.740', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (162, 'Carport', 429, 1, 1, 1, '2021-06-11 14:34:19.170', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (163, 'Land', 430, 1, 1, 1, '2021-06-11 14:34:58.230', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (164, 'Road Structural Layer', 431, 1, 1, 1, '2021-06-11 14:35:08.150', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (165, 'License testing centre', 432, 1, 1, 1, '2021-06-11 14:38:12.717', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (166, 'Paving', 433, 1, 1, 1, '2021-06-14 10:24:37.600', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (167, 'Small Building - Enclosure', 434, 1, 1, 1, '2021-06-14 10:24:56.077', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (168, 'Walls', 435, 1, 1, 1, '2021-06-14 10:25:20.807', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (169, 'RC Structure', 436, 1, 1, 1, '2021-06-14 10:25:45.730', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (170, 'Carport', 437, 1, 1, 1, '2021-06-14 10:26:17.833', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (171, 'Landscaping', 438, 1, 1, 1, '2021-06-14 10:26:33.833', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (172, 'Paving', 439, 1, 1, 1, '2021-06-14 10:26:47.397', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (173, 'Perimeter Protection', 440, 1, 1, 1, '2021-06-14 10:27:01.867', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (174, 'Land', 441, 1, 1, 1, '2021-06-14 10:27:28.123', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (175, 'Road Structural Layer', 442, 1, 1, 1, '2021-06-14 10:28:05.000', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (176, 'Land', 443, 1, 1, 1, '2021-06-14 10:28:50.603', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (177, 'Small Building - Enclosure', 445, 1, 1, 1, '2021-06-14 11:58:43.683', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (178, 'Walls', 446, 1, 1, 1, '2021-06-14 11:59:02.710', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (179, 'Kerb Inlet', 447, 1, 1, 1, '2021-06-14 12:00:26.223', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (180, 'Pipe - Storm Water', 448, 1, 1, 1, '2021-06-14 12:01:00.723', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (181, 'RC Structure', 449, 1, 1, 1, '2021-06-14 12:01:31.673', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (182, 'Steel Structure', 450, 1, 1, 1, '2021-06-14 12:01:59.933', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (183, 'Tank', 451, 1, 1, 1, '2021-06-14 12:02:31.037', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (184, 'Walls', 452, 1, 1, 1, '2021-06-14 12:03:24.877', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (185, 'Carport', 453, 1, 1, 1, '2021-06-14 12:04:21.010', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (186, 'External Furniture', 454, 1, 1, 1, '2021-06-14 12:04:46.193', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (187, 'External Lighting', 455, 1, 1, 1, '2021-06-14 12:05:14.083', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (188, 'Footpath', 456, 1, 1, 1, '2021-06-14 12:05:36.943', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (189, 'Landscaping', 457, 1, 1, 1, '2021-06-14 12:05:58.410', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (190, 'Perimeter Protection', 458, 1, 1, 1, '2021-06-14 12:06:15.343', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (191, 'Sign - General', 459, 1, 1, 1, '2021-06-14 12:06:34.987', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (192, 'Land', 460, 1, 1, 1, '2021-06-14 12:07:13.750', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (193, 'Road Structural Layer', 461, 1, 1, 1, '2021-06-14 12:07:40.390', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (194, 'Land', 444, 1, 1, 1, '2021-06-14 12:10:00.153', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (195, 'Small building - enclosure', 462, 1, 1, 1, '2021-06-14 14:17:25.253', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (196, 'Walls', 463, 1, 1, 1, '2021-06-14 14:17:42.913', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (197, 'Perimeter Protection', 464, 1, 1, 1, '2021-06-14 14:18:22.443', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (198, 'Sign - General', 465, 1, 1, 1, '2021-06-14 14:19:30.080', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (199, 'Land', 466, 1, 1, 1, '2021-06-14 14:20:34.810', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (200, 'Road Structural Layer', 467, 1, 1, 1, '2021-06-14 14:21:15.003', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (201, 'Earthworks', 468, 1, 1, 1, '2021-06-14 14:21:42.323', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (202, 'Kerb', 469, 1, 1, 1, '2021-06-14 14:22:00.130', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (203, 'Land', 470, 1, 1, 1, '2021-06-14 14:22:59.437', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (204, 'Small Building - Enclosure', 471, 1, 1, 1, '2021-06-14 14:23:39.630', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (205, 'Perimeter Protection', 472, 1, 1, 1, '2021-06-14 14:24:31.967', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (206, 'Walls', 475, 1, 1, 1, '2021-06-14 14:25:11.820', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (207, 'Small Building - Enclosure', 476, 1, 1, 1, '2021-06-14 14:25:46.483', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (208, 'Perimeter Protection', 474, 1, 1, 1, '2021-06-14 14:26:33.957', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (209, 'Land', 473, 1, 1, 1, '2021-06-14 14:28:52.810', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (210, 'Small Building - Enclosure', 477, 1, 1, 1, '2021-06-14 14:29:38.663', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (211, 'Walls', 478, 1, 1, 1, '2021-06-14 14:29:57.407', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (212, 'Channel', 479, 1, 1, 1, '2021-06-14 14:30:46.423', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (213, 'Steel Structure', 480, 1, 1, 1, '2021-06-14 14:31:11.037', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (214, 'Tank', 481, 1, 1, 1, '2021-06-14 14:31:30.737', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (215, 'External Furniture', 482, 1, 1, 1, '2021-06-14 14:32:11.793', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (216, 'Community Hall', 482, 1, 1, 1, '2021-06-14 14:32:19.883', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (217, 'External lighting', 483, 1, 1, 1, '2021-06-14 14:32:53.463', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (218, 'Footpath', 484, 1, 1, 1, '2021-06-14 14:33:20.620', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (219, 'Landscaping', 485, 1, 1, 1, '2021-06-14 14:33:44.360', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (220, 'Paving', 486, 1, 1, 1, '2021-06-14 14:34:07.873', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (221, 'Perimeter Protection', 487, 1, 1, 1, '2021-06-14 14:34:30.547', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (222, 'Land', 488, 1, 1, 1, '2021-06-14 14:35:11.707', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (223, 'Walls', 489, 1, 1, 1, '2021-06-14 14:36:42.620', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (224, 'External Furniture', 490, 1, 1, 1, '2021-06-14 14:37:21.127', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (225, 'External Lighting', 491, 1, 1, 1, '2021-06-14 14:38:36.623', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (226, 'Footpath', 492, 1, 1, 1, '2021-06-14 14:39:00.793', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (227, 'Paving', 493, 1, 1, 1, '2021-06-14 14:39:23.103', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (228, 'Perimeter Protection', 494, 1, 1, 1, '2021-06-14 14:39:40.937', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (229, 'Small Building - Enclosure', 495, 1, 1, 1, '2021-06-14 14:40:06.730', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (230, 'Land', 496, 1, 1, 1, '2021-06-14 14:40:39.750', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (231, 'Small Building - Enclosure', 498, 1, 1, 1, '2021-06-14 14:41:25.990', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (232, 'Walls', 497, 1, 1, 1, '2021-06-14 14:41:43.930', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (233, 'RC Structure', 499, 1, 1, 1, '2021-06-14 14:42:16.977', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (234, 'Steel Structure', 500, 1, 1, 1, '2021-06-14 14:42:38.167', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (235, 'Tank', 501, 1, 1, 1, '2021-06-14 14:42:56.050', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (236, 'Valve - Water', 502, 1, 1, 1, '2021-06-14 14:43:15.397', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (237, 'External Furniture', 503, 1, 1, 1, '2021-06-14 14:43:50.570', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (238, 'External Lighting', 504, 1, 1, 1, '2021-06-14 14:44:13.650', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (239, 'Footpath', 505, 1, 1, 1, '2021-06-14 14:44:35.470', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (240, 'External Facilities', 2, 0, 1, 1, '2021-06-14 14:44:58.637', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (241, 'Landscaping', 507, 1, 1, 1, '2021-06-14 14:48:03.727', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (242, 'Perimeter Protection', 508, 1, 1, 1, '2021-06-14 14:48:23.777', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (243, 'Sign - General', 509, 1, 1, 1, '2021-06-14 14:48:44.733', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (244, 'Small Building - Enclosure', 510, 1, 1, 1, '2021-06-14 14:49:08.603', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (245, 'Land', 511, 1, 1, 1, '2021-06-14 14:49:52.877', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (246, 'Land', 512, 1, 1, 1, '2021-06-14 14:51:19.423', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (247, 'Fabricated Steel', 513, 1, 1, 1, '2021-06-14 14:52:05.963', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (248, 'License testing centre', 426, 1, 1, 1, '2021-06-14 15:01:04.000', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (249, 'Walls', 514, 1, 1, 1, '2021-06-14 15:07:25.613', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (250, 'Road Structural Layer', 535, 1, 1, 1, '2021-06-14 15:07:34.840', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (251, 'RC Structure', 515, 1, 1, 1, '2021-06-14 15:07:43.530', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (252, 'Culvert', 516, 1, 1, 1, '2021-06-14 15:08:18.630', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (253, 'Earthworks', 517, 1, 1, 1, '2021-06-14 15:08:41.457', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (254, 'Irrigation', 518, 1, 1, 1, '2021-06-14 15:09:05.093', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (255, 'Masonry Structure', 519, 1, 1, 1, '2021-06-14 15:09:23.463', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (256, 'Pipe - Storm Water', 520, 1, 1, 1, '2021-06-14 15:09:42.773', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (257, 'RC Structure', 521, 1, 1, 1, '2021-06-14 15:10:11.947', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (258, 'Steel Structure', 522, 1, 1, 1, '2021-06-14 15:10:44.063', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (259, 'Tank', 523, 1, 1, 1, '2021-06-14 15:11:03.060', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (260, 'External Furniture', 524, 1, 1, 1, '2021-06-14 15:12:25.073', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (261, 'External Lighting', 525, 1, 1, 1, '2021-06-14 15:12:47.347', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (262, 'Paving', 526, 1, 1, 1, '2021-06-14 15:13:10.367', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (263, 'Perimeter Protection', 527, 1, 1, 1, '2021-06-14 15:13:29.583', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (264, 'Sign - General', 528, 1, 1, 1, '2021-06-14 15:13:51.277', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (265, 'Land', 529, 1, 1, 1, '2021-06-14 15:14:31.410', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (266, 'Fabricated Steel', 530, 1, 1, 1, '2021-06-14 15:15:10.163', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (267, 'Steel Structure', 531, 1, 1, 1, '2021-06-14 15:15:33.243', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (268, 'Road Structural Layer', 532, 1, 1, 1, '2021-06-14 15:16:10.070', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (269, 'Fabricated Steel', 533, 1, 1, 1, '2021-06-14 15:16:38.773', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (270, 'Sports Field', 534, 1, 1, 1, '2021-06-14 15:17:03.880', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (271, 'LV Overhead Line', 536, 1, 1, 1, '2021-06-14 15:18:27.673', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (272, 'High Mast Light', 537, 1, 1, 1, '2021-06-14 15:23:06.283', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (273, 'Street Lights', 538, 1, 1, 1, '2021-06-14 16:28:44.557', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (274, 'Retaining Wall', 539, 1, 1, 1, '2021-06-14 16:29:57.667', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (275, 'Commuter Bench', 544, 1, 1, 1, '2021-06-14 16:30:39.587', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (276, 'Commuter Shelter', 30, 1, 1, 1, '2021-06-14 16:31:04.433', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (277, 'Footpath', 78, 1, 1, 1, '2021-06-14 16:31:27.527', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (278, 'Guard Rail', 92, 1, 1, 1, '2021-06-14 16:31:47.850', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (279, 'Mini Roundabout', 128, 1, 1, 1, '2021-06-14 16:32:08.063', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (280, 'Paving', 146, 1, 1, 1, '2021-06-14 16:32:26.160', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (281, 'Pedestrian Bridge Railing', 541, 1, 1, 1, '2021-06-14 16:32:52.107', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (282, 'Sign - General', 218, 1, 1, 1, '2021-06-14 16:33:20.257', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (283, 'Sign - Regulatory', 219, 1, 1, 1, '2021-06-14 16:33:42.770', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (284, 'Speed Hump', 226, 1, 1, 1, '2021-06-14 16:34:14.270', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (285, 'Street Lights', 543, 1, 1, 1, '2021-06-14 16:34:35.360', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (286, 'Street Rubbish Bin', 236, 1, 1, 1, '2021-06-14 16:34:52.237', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (287, 'Traffic Signal Units', 248, 1, 1, 1, '2021-06-14 16:35:32.087', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (288, 'Road Bridge Abutment', 199, 1, 1, 1, '2021-06-14 16:36:33.713', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (289, 'Road Bridge Side Barrier', 200, 1, 1, 1, '2021-06-14 16:36:52.240', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (290, 'Road Bridge Substructure', 201, 1, 1, 1, '2021-06-14 16:37:11.283', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (291, 'Road Bridge Superstructure', 202, 1, 1, 1, '2021-06-14 16:37:30.713', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (292, 'Earthworks', 545, 1, 1, 1, '2021-06-14 16:38:54.343', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (293, 'Paving', 546, 1, 1, 1, '2021-06-14 16:39:32.590', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (294, 'Road Surface', 547, 1, 1, 1, '2021-06-14 16:40:47.307', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (295, 'Street Lights', 548, 1, 1, 1, '2021-06-14 16:41:24.147', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (296, 'Carport', 549, 1, 1, 1, '2021-06-14 16:42:34.840', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (297, 'Grid Inlet', 550, 1, 1, 1, '2021-06-14 16:42:58.793', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (298, 'Kerb', 551, 1, 1, 1, '2021-06-14 16:43:35.393', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (299, 'Kerb Inlet', 552, 1, 1, 1, '2021-06-14 16:44:11.430', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (300, 'Subsoil Drains', 553, 1, 1, 1, '2021-06-14 16:44:44.583', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (301, 'Gabions', 554, 1, 1, 1, '2021-06-14 16:46:00.160', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (302, 'RC Structure', 555, 1, 1, 1, '2021-06-14 16:46:23.600', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (303, 'Sign - Regulatory', 556, 1, 1, 1, '2021-06-14 16:46:41.967', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (304, 'Channel', 557, 1, 1, 1, '2021-06-14 16:47:13.990', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (305, 'Culvert', 558, 1, 1, 1, '2021-06-14 16:47:37.023', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (306, 'RC Structure', 559, 1, 1, 1, '2021-06-14 16:48:20.503', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (307, 'Road Bridge Abutment', 560, 1, 1, 1, '2021-06-14 16:48:47.313', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (308, 'Pipe - Sewer', 561, 1, 1, 1, '2021-06-14 16:53:32.437', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (309, 'Pipe - Storm Water', 562, 1, 1, 1, '2021-06-14 16:54:03.833', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (310, 'Pipe - Water', 563, 1, 1, 1, '2021-06-14 16:54:35.967', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (311, 'Pipe Bridge Substructure', 564, 1, 1, 1, '2021-06-14 16:55:04.820', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (312, 'Steel Structure', 540, 1, 1, 1, '2021-06-15 08:54:05.917', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (313, 'Borehole', 506, 1, 1, 1, '2021-06-15 08:55:57.067', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (314, 'Airconditioner', 565, 1, 1, 1, '2021-06-15 16:20:19.040', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (315, 'Laminator', 566, 1, 1, 1, '2021-06-15 16:20:39.540', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (316, 'Alcohol test', 567, 0, 1, 1, '2021-06-15 16:20:56.720', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (317, 'Camera', 568, 1, 1, 1, '2021-06-15 16:21:11.037', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (318, 'Heater', 569, 1, 1, 1, '2021-06-15 16:21:28.843', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (319, 'Folding Machine', 570, 1, 1, 1, '2021-06-15 16:21:49.933', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (320, 'Franking Machine', 571, 1, 1, 1, '2021-06-15 16:22:08.493', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (321, 'Megaphone', 572, 1, 1, 1, '2021-06-15 16:22:32.010', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (322, 'Binding Machine', 576, 1, 1, 1, '2021-06-15 16:45:44.983', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (323, 'Board', 575, 1, 1, 1, '2021-06-15 16:46:05.327', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (324, 'Box', 573, 1, 1, 1, '2021-06-15 16:46:27.543', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (325, 'Bulk Filer', 574, 1, 1, 1, '2021-06-15 16:46:46.880', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (326, 'Cash Drawer', 577, 1, 1, 1, '2021-06-15 16:47:29.437', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (327, 'Cell Phone', 578, 1, 1, 1, '2021-06-15 16:47:58.037', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (328, 'Divider', 579, 1, 1, 1, '2021-06-15 16:48:19.427', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (329, 'Mic Stand', 580, 1, 1, 1, '2021-06-15 16:50:57.150', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (330, 'Recorder', 581, 1, 1, 1, '2021-06-15 16:51:18.250', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (331, 'Safe', 582, 0, 2, 1, '2021-06-15 16:51:37.617', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (332, 'Shredder', 583, 1, 1, 1, '2021-06-15 16:51:59.527', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (333, 'Speaker Stand', 584, 1, 1, 1, '2021-06-15 16:52:18.933', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (334, 'Trolley', 585, 1, 1, 1, '2021-06-15 16:52:41.360', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (335, 'Vacuum Cleaner', 586, 1, 1, 1, '2021-06-15 16:52:59.680', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (336, 'Water Dispenser', 587, 1, 1, 1, '2021-06-15 16:53:20.427', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (337, 'Fridge', 588, 1, 1, 1, '2021-06-15 16:57:20.460', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (338, 'Laptop', 589, 0, 1, 1, '2021-06-15 17:15:01.153', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (339, 'Ipad', 590, 1, 1, 1, '2021-06-15 17:15:10.993', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (340, 'Media Player', 591, 1, 1, 1, '2021-06-15 17:15:53.377', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (341, 'Desktop Computer', 592, 1, 1, 1, '2021-06-15 17:31:50.393', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (342, 'External Drive', 593, 1, 1, 1, '2021-06-15 17:32:13.240', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (343, 'Firewall', 594, 1, 1, 1, '2021-06-15 17:32:32.677', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (344, 'Monitor', 595, 1, 1, 1, '2021-06-15 17:34:15.223', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (345, 'Printer', 596, 1, 1, 1, '2021-06-15 17:34:38.177', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (346, 'Router', 597, 1, 1, 1, '2021-06-15 17:35:02.687', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (347, 'Server', 598, 1, 1, 1, '2021-06-15 17:35:21.947', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (348, 'Switch', 599, 1, 1, 1, '2021-06-15 17:35:40.453', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (349, 'UPS', 600, 1, 1, 1, '2021-06-15 17:36:02.283', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (350, 'Microphone', 601, 1, 1, 1, '2021-06-15 17:45:13.403', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (351, 'Projector', 603, 1, 1, 1, '2021-06-15 17:45:33.297', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (352, 'Mixing  Console', 602, 1, 1, 1, '2021-06-15 17:46:33.300', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (353, 'Projector Screen', 604, 1, 1, 1, '2021-06-15 17:46:52.927', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (354, 'Speaker', 605, 1, 1, 1, '2021-06-15 17:47:12.440', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (355, 'Fire Arm', 606, 1, 1, 1, '2021-06-15 17:51:59.240', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (356, 'Speed Trap', 607, 1, 1, 1, '2021-06-15 17:52:39.620', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (357, 'Cherry Picker', 611, 1, 1, 1, '2021-06-15 18:04:17.100', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (358, 'Chain Saw', 610, 0, 1, 1, '2021-06-15 18:05:25.143', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (359, 'Benchpress', 608, 1, 1, 1, '2021-06-15 18:07:46.987', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (360, 'Brushcutter', 609, 1, 1, 1, '2021-06-15 18:08:31.513', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (361, 'Emergency Lights', 618, 1, 1, 1, '2021-06-15 18:23:46.550', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (362, 'Scanner', 614, 1, 1, 1, '2021-06-15 18:24:18.690', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (363, 'Skip Bin', 613, 1, 1, 1, '2021-06-15 18:24:38.570', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (364, 'Grid Roller', 615, 1, 1, 1, '2021-06-15 18:25:07.110', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (365, 'Concrete Cutter Machine', 612, 1, 1, 1, '2021-06-15 18:25:33.460', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (366, 'Hauler', 617, 1, 1, 1, '2021-06-15 18:26:02.800', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (367, 'Plate Compactor', 621, 0, 1, 1, '2021-06-15 18:26:31.607', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (368, 'Road Marking Machine', 616, 0, 1, 1, '2021-06-15 18:27:01.750', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (369, 'GYM Equipment', 619, 1, 1, 1, '2021-06-15 18:27:29.207', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (370, 'Fumigation Machine', 620, 1, 1, 1, '2021-06-15 18:27:52.310', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (371, 'Microwave', 622, 1, 1, 1, '2021-06-15 18:32:05.757', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (372, 'Motor Vehicles', 623, 1, 1, 1, '2021-06-15 18:36:51.657', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (373, 'Pruner Tree', 624, 1, 1, 1, '2021-06-17 13:10:56.630', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (374, 'Benchpress', 608, 1, 1, 1, '2021-07-19 11:16:19.127', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (375, 'Benchpress', 625, 1, 1, 1, '2021-07-19 11:37:11.130', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (376, 'Board', 272, 1, 1, 1, '2021-11-10 16:11:31.940', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (377, 'Computer Workstation', 272, 1, 1, 1, '2021-11-10 16:14:06.320', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (378, 'Sick Bed', 272, 1, 1, 1, '2021-11-10 16:14:27.600', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (379, 'License Disk Scanner', 383, 1, 1, 1, '2021-11-10 16:16:40.470', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (380, 'Trailer', 383, 1, 1, 1, '2021-11-10 16:17:08.780', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (381, 'Speed Trapper', 383, 1, 1, 1, '2021-11-10 16:17:29.227', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (382, 'Edge Trimmer', 383, 1, 1, 1, '2021-11-10 16:17:47.927', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (383, 'Plough', 383, 1, 1, 1, '2021-11-10 16:18:52.687', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (384, 'Planter', 383, 1, 1, 1, '2021-11-10 16:19:06.437', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (385, 'Pressure Washer', 383, 1, 1, 1, '2021-11-10 16:19:22.980', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (386, 'Lifeguard Post and Seat', 383, 1, 1, 1, '2021-11-10 16:19:38.783', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (387, 'Swimming Pool Sweeper', 383, 1, 1, 1, '2021-11-10 16:19:52.923', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (388, 'Voice Recorder', 367, 1, 1, 1, '2021-11-10 16:23:28.760', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (389, 'TV Screen', 367, 1, 1, 1, '2021-11-10 16:25:20.460', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (390, 'PA System', 367, 1, 1, 1, '2021-11-10 16:25:38.123', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (391, 'Desktop Computer', 589, 1, 1, 1, '2021-11-10 16:29:29.483', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (392, 'CPU', 589, 1, 1, 1, '2021-11-10 16:29:44.810', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (393, 'Diesel Bowser Machine', 383, 1, 1, 1, '2021-11-11 09:49:25.877', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (394, 'Security System', 629, 1, 1, 1, '2021-11-11 11:10:24.493', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (395, 'Speed Trap', 630, 1, 1, 1, '2021-11-11 11:26:34.300', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (396, 'Projector Screen', 632, 1, 1, 1, '2021-11-11 11:41:06.987', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (397, 'Media Player', 632, 1, 1, 1, '2021-11-11 11:41:25.697', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (398, 'Mixing Console', 632, 1, 1, 1, '2021-11-11 11:41:51.283', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (399, 'Speaker', 632, 1, 1, 1, '2021-11-11 11:42:04.923', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (400, 'Microphone', 631, 1, 1, 1, '2021-11-11 11:43:36.950', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (401, 'Fire Arm', 633, 1, 1, 1, '2021-11-11 11:52:36.457', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (402, 'Land', 634, 1, 1, 1, '2022-05-18 15:42:52.543', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (403, 'Municipal Flats', 635, 1, 1, 1, '2022-05-18 19:51:17.553', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (404, 'Garage', 636, 1, 1, 1, '2022-05-19 09:30:00.180', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (405, 'Dwelling Normal Size House', 637, 1, 1, 1, '2022-05-19 09:30:12.027', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (406, 'Hall-Indoor Sport Complex', 638, 1, 1, 1, '2022-05-19 09:30:20.530', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (407, 'Market', 639, 1, 1, 1, '2022-05-19 09:30:30.123', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (408, 'Internal Road', 640, 1, 1, 1, '2022-05-19 09:32:57.147', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (409, 'Catchpit', 641, 1, 1, 1, '2022-05-19 09:37:36.247', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (410, 'Tank Stand', 642, 1, 1, 1, '2022-05-19 09:42:15.427', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (411, 'Palisade Fence', 440, 1, 1, 1, '2022-05-19 09:45:36.193', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (412, 'Sliding Gate', 440, 1, 1, 1, '2022-05-19 09:46:29.347', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (413, 'Pedestrian Gate', 440, 1, 1, 1, '2022-05-19 09:47:15.267', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (414, 'Wall', 440, 1, 1, 1, '2022-05-19 09:47:44.973', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (415, 'Swivel Gate', 440, 1, 1, 1, '2022-05-19 09:48:34.950', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (416, 'Fence', 440, 1, 1, 1, '2022-05-19 09:49:18.403', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (417, 'Footpath', 643, 1, 1, 1, '2022-05-19 09:51:49.160', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (418, 'Outbuilding (Storeroom)', 434, 1, 1, 1, '2022-05-19 09:54:36.460', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (419, 'Jo-Jo Tank', 644, 1, 1, 1, '2022-05-19 09:57:31.873', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (420, 'Taxi Rank', 647, 1, 1, 1, '2022-05-19 12:41:58.513', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (421, 'License testing centre', 648, 1, 1, 1, '2022-05-19 12:42:05.577', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (422, 'Library', 649, 1, 1, 1, '2022-05-19 12:42:12.783', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (423, 'Parking', 650, 1, 1, 1, '2022-05-19 12:48:17.677', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (424, 'Parking', 651, 1, 1, 1, '2022-05-19 12:50:42.587', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (425, 'Walkway', 652, 1, 1, 1, '2022-05-19 12:54:57.390', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (426, 'Walkway', 653, 1, 1, 1, '2022-05-19 12:55:03.700', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (427, 'Walkway', 654, 1, 1, 1, '2022-05-19 12:55:08.963', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (428, 'Office Block', 655, 1, 1, 1, '2022-05-19 13:05:44.397', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (429, 'Office Block', 656, 1, 1, 1, '2022-05-19 13:05:50.957', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (430, 'Office Block', 657, 1, 1, 1, '2022-05-19 13:05:55.997', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (431, 'Office Block', 658, 1, 1, 1, '2022-05-19 13:06:01.567', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (432, 'Boreholes', 659, 1, 1, 1, '2022-05-19 13:13:38.023', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (433, 'Cenotaph', 660, 1, 1, 1, '2022-05-19 13:15:37.000', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (434, 'Changeroom', 661, 1, 1, 1, '2022-05-19 13:20:44.797', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (435, 'Community Hall', 662, 1, 1, 1, '2022-05-19 13:42:10.820', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (436, 'Dwelling Low Cost Housing', 663, 1, 1, 1, '2022-05-19 13:44:19.563', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (437, 'Handrails', 664, 1, 1, 1, '2022-05-19 13:45:52.503', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (438, 'Heritage Building', 665, 1, 1, 1, '2022-05-19 13:47:12.030', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (439, 'Kerb Barrier', 666, 1, 1, 1, '2022-05-19 13:51:12.517', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (440, 'Lawns', 667, 1, 1, 1, '2022-05-19 14:07:00.013', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (441, 'Mobile Office', 668, 1, 1, 1, '2022-05-19 14:07:20.043', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (442, 'Netball Court', 669, 1, 1, 1, '2022-05-19 14:07:35.600', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (443, 'Paved Area', 670, 1, 1, 1, '2022-05-19 14:07:54.027', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (444, 'Paved Area', 671, 1, 1, 1, '2022-05-19 14:08:02.223', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (445, 'Pavement', 672, 1, 1, 1, '2022-05-19 14:08:23.780', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (446, 'Pavilion', 673, 1, 1, 1, '2022-05-19 14:08:41.937', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (447, 'Small Urban Office', 674, 1, 1, 1, '2022-05-19 14:08:58.207', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (448, 'Small Urban Office', 675, 1, 1, 1, '2022-05-19 14:09:04.813', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (449, 'Sub-soil Drain Pipe', 676, 1, 1, 1, '2022-05-19 14:09:14.733', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (450, 'Unpaved Road', 677, 1, 1, 1, '2022-05-19 14:09:23.103', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (451, 'Fence', 678, 1, 1, 1, '2022-05-19 14:12:57.427', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (452, 'Internal Road', 679, 1, 1, 1, '2022-05-19 14:15:59.817', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (453, 'Fence', 494, 1, 1, 1, '2022-05-19 14:17:53.783', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (454, 'Sliding Gate', 494, 1, 1, 1, '2022-05-19 14:19:04.437', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (455, 'Street Light Head', 491, 1, 1, 1, '2022-05-19 14:19:49.160', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (456, 'Palisade Fence', 494, 1, 1, 1, '2022-05-19 14:20:37.430', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (457, 'Park Table', 503, 1, 1, 1, '2022-05-19 14:21:34.430', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (458, 'Park Bench', 503, 1, 1, 1, '2022-05-19 14:25:35.230', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (459, 'Plant Pot', 503, 1, 1, 1, '2022-05-19 14:27:00.063', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (460, 'Street Rubbish Bin', 503, 1, 1, 1, '2022-05-19 14:28:21.117', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (461, 'Braai', 503, 1, 1, 1, '2022-05-19 14:30:09.547', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (462, 'Plant Pot', 524, 1, 1, 1, '2022-05-19 14:33:22.520', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (463, 'Flood Light', 525, 1, 1, 1, '2022-05-19 14:33:58.417', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (464, 'Football (Soccer) Pitch', 534, 1, 1, 1, '2022-05-19 14:35:57.743', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (465, 'Sign - Information', 524, 1, 1, 1, '2022-05-19 14:37:33.483', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (466, 'Sign - Information', 680, 1, 1, 1, '2022-05-19 14:39:38.787', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (467, 'Sign - Information', 503, 1, 1, 1, '2022-05-19 14:40:17.667', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (468, 'Wall', 527, 1, 1, 1, '2022-05-19 14:41:36.667', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (469, 'Wall', 508, 1, 1, 1, '2022-05-19 14:41:56.173', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (470, 'Wall', 487, 1, 1, 1, '2022-05-19 14:42:10.180', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (471, 'Street Rubbish Bin', 524, 1, 1, 1, '2022-05-19 14:44:53.610', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (472, 'Football (Soccer) Goal Posts', 530, 1, 1, 1, '2022-05-19 14:46:32.987', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (473, 'Fence', 464, 1, 1, 1, '2022-05-19 14:49:55.583', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (474, 'Fence', 474, 1, 1, 1, '2022-05-19 14:51:07.417', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (475, 'Fence', 487, 1, 1, 1, '2022-05-19 14:53:52.520', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (476, 'Fence', 527, 1, 1, 1, '2022-05-19 14:55:41.753', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (477, 'Fence', 508, 1, 1, 1, '2022-05-19 14:56:47.193', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (478, 'Fence', 428, 1, 1, 1, '2022-05-19 14:57:50.420', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (479, 'Ablution Block', 681, 1, 1, 1, '2022-05-19 15:01:03.700', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (480, 'Ablution Block', 646, 1, 1, 1, '2022-05-19 15:03:35.937', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (481, 'Ablution Block', 682, 1, 1, 1, '2022-05-19 15:05:45.993', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (482, 'Palisade Fence', 508, 1, 1, 1, '2022-05-19 15:07:41.307', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (483, 'Palisade Fence', 487, 1, 1, 1, '2022-05-19 15:08:02.583', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (484, 'Palisade Fence', 464, 1, 1, 1, '2022-05-19 15:08:20.033', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (485, 'Palisade Fence', 527, 1, 1, 1, '2022-05-19 15:08:40.303', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (486, 'Post Top Light', 525, 1, 1, 1, '2022-05-19 15:10:03.630', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (487, 'Post Top Light', 504, 1, 1, 1, '2022-05-19 15:10:25.783', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (488, 'Garden Light', 504, 1, 1, 1, '2022-05-19 15:11:43.603', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (489, 'Water feature', 503, 1, 1, 1, '2022-05-19 15:12:19.767', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (490, 'Lapa', 510, 1, 1, 1, '2022-05-19 15:13:13.873', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (491, 'Toilets', 498, 1, 1, 1, '2022-05-19 15:13:53.540', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (492, 'Toilets', 477, 1, 1, 1, '2022-05-19 15:14:22.960', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (493, 'Toilets', 683, 1, 1, 1, '2022-05-19 15:19:02.920', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (494, 'Toilets', 462, 1, 1, 1, '2022-05-19 15:19:23.050', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (495, 'Jungle Gym', 503, 1, 1, 1, '2022-05-19 15:22:32.093', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (496, 'Flood Light', 504, 1, 1, 1, '2022-05-19 15:23:07.387', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (497, 'Flood Light', 483, 1, 1, 1, '2022-05-19 15:23:24.247', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (498, 'Sliding Gate', 487, 1, 1, 1, '2022-05-19 15:24:34.187', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (499, 'Sliding Gate', 527, 1, 1, 1, '2022-05-19 15:24:59.087', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (500, 'Sliding Gate', 508, 1, 1, 1, '2022-05-19 15:25:18.953', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (501, 'Plant Pot', 482, 1, 1, 1, '2022-05-19 15:27:54.830', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (502, 'Channel', 684, 1, 1, 1, '2022-05-19 15:32:10.407', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (503, 'V-Channel', 685, 1, 1, 1, '2022-05-19 15:32:20.347', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (504, 'Guardhouse', 462, 1, 1, 1, '2022-05-19 15:33:32.197', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (505, 'Guardhouse', 686, 1, 1, 1, '2022-05-19 15:40:43.607', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (506, 'Swivel Gate', 464, 1, 1, 1, '2022-05-19 15:41:47.760', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (507, 'Swivel Gate', 474, 1, 1, 1, '2022-05-19 15:42:21.823', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (508, 'Swivel Gate', 487, 1, 1, 1, '2022-05-19 15:42:45.410', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (509, 'Swivel Gate', 494, 1, 1, 1, '2022-05-19 15:43:08.557', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (510, 'Swivel Gate', 527, 1, 1, 1, '2022-05-19 15:43:28.793', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (511, 'Swivel Gate', 428, 1, 1, 1, '2022-05-19 15:43:54.583', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (512, 'Internal Road', 687, 1, 1, 1, '2022-05-19 15:52:00.243', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (513, 'Internal Road', 688, 1, 1, 1, '2022-05-19 15:52:06.240', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (514, 'Internal Road', 689, 1, 1, 1, '2022-05-19 15:52:12.047', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (515, 'Hall-Indoor Sport Complex', 690, 1, 1, 1, '2022-05-19 15:54:18.953', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (516, 'Ablution - Change Rooms', 645, 1, 1, 1, '2022-05-19 15:57:03.827', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (517, 'Ablution - Change Rooms', 477, 1, 1, 1, '2022-05-19 15:57:48.123', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (518, 'Rugby Post', 530, 1, 1, 1, '2022-05-19 15:59:05.170', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (519, 'Netball post', 530, 1, 1, 1, '2022-05-19 15:59:58.887', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (520, 'Rugby Field', 534, 1, 1, 1, '2022-05-19 16:01:45.120', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (521, 'Pedestrian Gate', 527, 1, 1, 1, '2022-05-19 16:02:51.830', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (522, 'Pedestrian Gate', 487, 1, 1, 1, '2022-05-19 16:03:11.560', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (523, 'Jo-Jo Tank', 523, 1, 1, 1, '2022-05-19 16:05:00.947', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (524, 'Jo-Jo Tank', 481, 1, 1, 1, '2022-05-19 16:05:24.457', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (525, 'Jo-Jo Tank', 691, 1, 1, 1, '2022-05-19 16:07:45.623', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (526, 'Box Culvert', 692, 1, 1, 1, '2022-05-19 17:39:30.473', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (527, 'Retaining Wall', 693, 1, 1, 1, '2022-05-19 17:42:35.183', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (528, 'Tank Stand', 694, 1, 1, 1, '2022-05-19 17:47:50.293', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (529, 'Tank Stand', 697, 1, 1, 1, '2022-05-19 17:51:25.107', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (530, 'Tank Stand', 698, 1, 1, 1, '2022-05-19 17:52:46.087', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (531, 'Outbuilding (Storeroom)', 476, 1, 1, 1, '2022-05-19 17:55:57.790', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (532, 'Outbuilding (Storeroom)', 477, 1, 1, 1, '2022-05-19 17:56:16.700', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (533, 'Outbuilding (Storeroom)', 699, 1, 1, 1, '2022-05-19 17:59:41.467', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (534, 'Outbuilding (Storeroom)', 686, 1, 1, 1, '2022-05-19 18:02:33.687', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (535, 'Outbuilding (Storeroom)', 498, 1, 1, 1, '2022-05-19 18:04:29.763', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (536, 'Outbuilding (Storeroom)', 683, 1, 1, 1, '2022-05-19 18:04:55.237', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (537, 'Street Rubbish Bin', 482, 1, 1, 1, '2022-05-19 18:07:08.620', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (538, 'Park Bench', 482, 1, 1, 1, '2022-05-19 18:07:52.503', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (539, 'Park Bench', 524, 1, 1, 1, '2022-05-19 18:08:28.390', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (540, 'Pipe - Storm Water', 700, 1, 1, 1, '2022-05-19 18:11:29.853', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (541, 'Market', 701, 1, 1, 1, '2022-05-19 18:13:26.890', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (542, 'Kerb Inlet', 702, 1, 1, 1, '2022-05-19 18:31:44.990', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (543, 'Flag Pole', 482, 1, 1, 1, '2022-05-19 18:33:06.287', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (544, 'Earthworks', 703, 1, 1, 1, '2022-05-19 18:37:27.833', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (545, 'Earthworks', 704, 1, 1, 1, '2022-05-19 18:37:33.310', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (546, 'Hawker Stalls', 705, 1, 1, 1, '2022-05-19 18:39:33.843', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (547, 'Hawkers Stalls', 683, 1, 1, 1, '2022-05-19 18:40:20.877', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (548, 'Pump Station Building', 686, 1, 1, 1, '2022-05-19 18:41:38.313', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (549, 'Footpath', 706, 1, 1, 1, '2022-05-19 18:43:54.027', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (550, 'Rubbish Bin', 524, 1, 1, 1, '2022-05-19 18:46:42.487', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (551, 'Rubbish Bin', 503, 1, 1, 1, '2022-05-19 18:47:05.373', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (552, 'Catchpit', 707, 1, 1, 1, '2022-05-19 18:50:07.303', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (553, 'Swimming Pool', 708, 1, 1, 1, '2022-05-19 18:52:26.017', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (554, 'Braai', 524, 1, 1, 1, '2022-05-19 18:53:09.140', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (555, 'Jo-Jo Tank', 501, 1, 1, 1, '2022-05-19 18:57:30.013', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (556, 'Paved Area', 709, 1, 1, 1, '2022-05-19 19:00:26.003', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (557, 'Fence', 472, 1, 1, 1, '2022-05-19 19:01:53.507', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (558, 'Tank Stand', 695, 1, 1, 1, '2022-05-19 19:04:07.437', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (559, 'Post Top Light', 710, 1, 1, 1, '2022-05-19 19:31:17.230', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (560, 'Rural Electrification', 711, 1, 1, 1, '2022-05-19 19:31:30.903', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (561, 'LED Lights', 712, 1, 1, 1, '2022-05-19 19:32:01.277', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (562, 'Street Light', 538, 1, 1, 1, '2022-05-19 19:32:37.317', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (563, 'Access Road', 713, 1, 1, 1, '2022-05-20 11:36:02.580', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (564, 'Cattle Grid', 714, 1, 1, 1, '2022-05-20 11:46:25.323', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (565, 'Parking', 715, 1, 1, 1, '2022-05-20 11:48:53.513', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (566, 'Paved Area', 716, 1, 1, 1, '2022-05-20 11:49:01.803', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (567, 'Walkway', 723, 1, 1, 1, '2022-05-20 11:56:15.083', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (568, 'Railing - Handrails', 717, 1, 1, 1, '2022-05-20 11:58:13.527', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (569, 'Rubbish Bin', 718, 1, 1, 1, '2022-05-20 11:58:46.830', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (570, 'Sign - Guidance', 719, 1, 1, 1, '2022-05-20 11:59:02.980', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (571, 'Sign - Information', 720, 1, 1, 1, '2022-05-20 11:59:27.400', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (572, 'Sign - Warning', 721, 1, 1, 1, '2022-05-20 12:00:28.907', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (573, 'Traffic Circle', 722, 1, 1, 1, '2022-05-20 12:01:45.057', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (574, 'Bridge Abutment', 724, 1, 1, 1, '2022-05-20 12:06:52.443', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (575, 'Bridge Sub Structure', 726, 1, 1, 1, '2022-05-20 12:07:00.990', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (576, 'Bridge Side Barrier', 725, 1, 1, 1, '2022-05-20 12:07:08.280', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (577, 'Low Level Bridge', 727, 1, 1, 1, '2022-05-20 12:07:15.933', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (578, 'Vehicle Bridge', 728, 1, 1, 1, '2022-05-20 12:07:22.610', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (579, 'Gabions', 729, 1, 1, 1, '2022-05-20 12:10:51.263', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (580, 'Catchpit', 730, 1, 1, 1, '2022-05-20 12:16:10.263', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (581, 'Channel', 731, 1, 1, 1, '2022-05-20 12:16:32.587', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (582, 'V-Channel', 731, 1, 1, 1, '2022-05-20 12:16:41.777', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (583, 'Culvert', 732, 1, 1, 1, '2022-05-20 12:17:03.210', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (584, 'Culvert Pipe', 732, 1, 1, 1, '2022-05-20 12:17:24.597', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (585, 'Culvert Box', 732, 1, 1, 1, '2022-05-20 12:17:55.987', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (586, 'Head And Wingwalls', 733, 1, 1, 1, '2022-05-20 12:18:16.160', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (587, 'Kerb', 734, 1, 1, 1, '2022-05-20 12:18:45.673', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (588, 'Kerb Barrier', 735, 1, 1, 1, '2022-05-20 12:19:08.783', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (589, 'Kerb Inlet', 736, 1, 1, 1, '2022-05-20 12:19:20.857', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (590, 'Ring Road', 713, 1, 1, 1, '2022-05-20 12:21:06.547', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (591, 'Pavement', 737, 1, 1, 1, '2022-05-20 12:25:24.627', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (592, 'Unpaved Road', 738, 1, 1, 1, '2022-05-20 12:26:57.120', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (593, 'Pipe - Storm Water', 739, 1, 1, 1, '2022-05-20 12:37:37.687', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (594, 'Pipe', 740, 1, 1, 1, '2022-05-20 12:38:03.067', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (595, 'Street Light', 741, 0, 1, 1, '2022-05-20 12:40:13.520', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (596, 'Gabions', 79, 1, 1, 1, '2022-05-20 14:09:38.023', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (597, 'Manhole', 742, 1, 1, 1, '2022-05-20 14:12:01.603', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (598, 'Catchpit', 743, 1, 1, 1, '2022-05-20 14:15:53.343', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (599, 'Box Culvert', 558, 1, 1, 1, '2022-05-20 14:16:36.360', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (600, 'Culvert Box', 558, 1, 1, 1, '2022-05-20 14:17:11.990', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (601, 'Pipe Culvert', 558, 1, 1, 1, '2022-05-20 14:17:24.883', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (602, 'Culvert Pipe', 558, 1, 1, 1, '2022-05-20 14:17:38.693', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (603, 'Kerb Barrier', 744, 1, 1, 1, '2022-05-20 14:19:01.320', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (604, 'Kerb Inlet', 745, 1, 1, 1, '2022-05-20 14:19:29.270', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (605, 'Pipe', 746, 1, 1, 1, '2022-05-20 14:22:46.100', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (606, 'Low Level Bridge', 747, 1, 1, 1, '2022-05-20 14:24:20.920', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (607, 'Ablution - Change Rooms', 748, 1, 1, 1, '2022-05-20 15:40:52.777', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (608, 'Dwelling Low Cost Housing', 749, 1, 1, 1, '2022-05-20 15:41:22.737', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (609, 'Dwelling Normal Size House', 750, 1, 1, 1, '2022-05-20 15:41:36.327', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (610, 'Garage', 751, 1, 1, 1, '2022-05-20 15:41:48.707', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (611, 'Hall-Indoor Sport Complex', 752, 1, 1, 1, '2022-05-20 15:42:02.250', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (612, 'Mobile Office', 753, 1, 1, 1, '2022-05-20 15:42:14.720', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (613, 'Office Block', 754, 1, 1, 1, '2022-05-20 15:42:32.873', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (614, 'Small Urban Office', 755, 1, 1, 1, '2022-05-20 15:42:49.740', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (615, 'Outbuilding (Storeroom)', 445, 1, 1, 1, '2022-05-20 15:43:22.617', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (616, 'Gaurdhouse', 445, 1, 1, 1, '2022-05-20 15:43:31.463', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (617, 'Storage Container', 445, 1, 1, 1, '2022-05-20 15:43:40.570', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (618, 'Camera', 568, 0, 1, 1, '2022-05-30 08:46:51.963', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (619, 'Projector', 632, 0, 1, 1, '2022-05-30 11:39:11.097', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (620, 'Projector Screen', 604, 0, 1, 1, '2022-05-30 11:40:07.370', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (621, 'Speaker', 605, 0, 1, 1, '2022-05-30 11:40:35.410', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (622, 'Board', 756, 0, 1, 1, '2022-05-30 11:42:08.127', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (623, 'Chair', 286, 0, 1, 1, '2022-05-30 11:42:40.970', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (624, 'Sick Bed', 757, 0, 1, 1, '2022-05-30 11:43:43.703', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (625, 'Stand', 350, 0, 1, 1, '2022-05-30 11:44:24.840', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (626, 'Microwave', 760, 0, 1, 1, '2022-05-30 12:42:15.020', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (627, 'Fridge', 588, 0, 1, 1, '2022-05-30 12:56:16.650', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (628, 'Voice Recorder', 761, 0, 1, 1, '2022-05-30 13:00:52.027', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (629, 'CPU', 762, 0, 1, 1, '2022-05-30 13:43:27.610', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (630, 'Microwave', 760, 1, 1, 1, '2022-05-30 14:29:03.473', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (631, 'Fridge', 763, 0, 1, 1, '2022-05-30 15:01:05.867', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (632, 'TV Screen', 764, 0, 1, 1, '2022-05-30 15:20:09.497', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (633, 'PA System', 765, 0, 1, 1, '2022-05-30 15:20:21.953', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (634, 'Media Player', 591, 0, 1, 1, '2022-05-30 15:26:45.853', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (635, 'Mixing  Console', 766, 0, 1, 1, '2022-05-30 15:36:42.170', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (636, 'Computer Workstation', 758, 0, 1, 1, '2022-05-30 15:41:11.427', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (637, 'Microphone', 631, 0, 1, 1, '2022-05-31 08:37:41.713', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (638, 'Speaker', 767, 0, 1, 1, '2022-05-31 08:42:32.420', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (639, 'Projector Screen', 759, 0, 1, 1, '2022-05-31 09:23:34.013', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (640, 'Media Player', 768, 0, 1, 1, '2022-05-31 09:28:35.110', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (641, 'Truck', 777, 0, 1, 1, '2022-05-31 12:05:35.183', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (642, 'Trailer', 778, 0, 1, 1, '2022-05-31 12:06:13.287', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (643, 'Diesel Bowser Machine', 778, 0, 1, 1, '2022-05-31 12:06:43.900', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (644, 'Pressure Washer', 769, 0, 1, 1, '2022-05-31 12:07:14.223', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (645, 'Boom Spray', 770, 0, 1, 1, '2022-05-31 12:07:37.820', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (646, 'Plough', 771, 0, 1, 1, '2022-05-31 12:07:58.073', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (647, 'Planter', 773, 0, 1, 1, '2022-05-31 12:08:12.980', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (648, 'Lifeguard Post and Seat', 774, 0, 1, 1, '2022-05-31 12:08:30.813', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (649, 'Swimming Pool Sweeper', 775, 0, 1, 1, '2022-05-31 12:08:48.967', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (650, 'License Disk Scanner', 772, 0, 1, 1, '2022-05-31 12:09:06.367', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (651, 'Speed Trap', 779, 0, 1, 1, '2022-05-31 12:09:24.300', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (652, 'Offset Trailer', 778, 0, 1, 1, '2022-05-31 12:09:45.693', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (653, 'Shelf', 343, 0, 1, 1, '2022-06-01 09:26:12.080', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (654, 'Desk', 298, 0, 1, 1, '2022-06-01 09:26:37.013', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (655, 'Airconditioner', 565, 0, 1, 1, '2022-06-01 09:27:59.473', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (656, 'Edge Trimmer', 776, 0, 1, 1, '2022-06-01 09:38:54.287', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (657, 'Grass Cutter', 398, 0, 1, 1, '2022-06-01 09:39:20.393', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (658, 'Blower', 390, 0, 1, 1, '2022-06-01 09:40:00.273', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (659, 'Fire Arm', 633, 0, 1, 1, '2022-06-01 10:46:45.663', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (660, 'Palisade Fence', 458, 0, 1, 1, '2022-06-01 12:10:53.033', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (661, 'Pedestrian Gate', 458, 0, 1, 1, '2022-06-01 12:12:29.727', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (662, 'Wall', 458, 0, 1, 1, '2022-06-01 12:13:11.370', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (663, 'Sliding Gate', 458, 0, 1, 1, '2022-06-01 12:14:03.117', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (664, 'Swivel Gate', 458, 0, 1, 1, '2022-06-01 12:15:40.867', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (665, 'Fence', 458, 0, 1, 1, '2022-06-01 12:16:22.767', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (666, 'Boom Gate Manual', 458, 0, 1, 1, '2022-06-01 12:17:11.010', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (667, 'Electrical Fence', 458, 0, 1, 1, '2022-06-01 12:17:56.917', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (668, 'Walkway', 783, 0, 1, 1, '2022-06-01 12:25:35.353', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (669, 'Flood Light', 455, 0, 1, 1, '2022-06-01 12:26:11.433', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (670, 'Flag Pole', 454, 0, 1, 1, '2022-06-01 12:26:46.530', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (671, 'Sign - Information', 454, 0, 1, 1, '2022-06-01 12:27:12.807', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (672, 'Lawns', 784, 0, 1, 1, '2022-06-01 12:27:42.360', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (673, 'Tank Stand', 780, 0, 1, 1, '2022-06-01 12:29:35.923', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (674, 'Internal Road', 781, 0, 1, 1, '2022-06-01 12:30:16.527', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (675, 'Kerb Inlet', 782, 0, 1, 1, '2022-06-01 13:19:58.193', 0, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (676, 'Pipe - Storm Water', 785, 0, 1, 1, '2022-06-01 14:21:16.197', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (677, 'Culvert Pipe', 787, 0, 1, 1, '2022-06-01 16:07:32.377', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (678, 'Pipe', 786, 0, 1, 1, '2022-06-01 16:07:57.950', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (679, 'Jo-Jo Tank', 451, 0, 1, 1, '2022-06-01 16:13:58.023', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (680, 'Paved Area', 788, 1, 1, 1, '2022-06-01 16:17:33.300', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (681, 'Internal Road', 781, 1, 1, 1, '2022-06-01 16:18:58.203', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (682, 'Pipe - Storm Water', 785, 1, 1, 1, '2022-06-01 16:19:40.497', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (683, 'Pipe', 786, 1, 1, 1, '2022-06-01 16:19:52.213', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (684, 'Palisade Fence', 458, 1, 1, 1, '2022-06-01 16:20:29.910', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (685, 'Wall', 458, 1, 1, 1, '2022-06-01 16:20:59.437', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (686, 'Fence', 458, 1, 1, 1, '2022-06-01 16:21:19.910', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (687, 'Swivel Gate', 458, 1, 1, 1, '2022-06-01 16:21:53.327', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (688, 'Pedestrian Gate', 458, 1, 1, 1, '2022-06-01 16:22:24.410', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (689, 'Walkway', 458, 1, 1, 1, '2022-06-01 16:22:44.023', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (690, 'Flood Light', 455, 1, 1, 1, '2022-06-01 16:23:48.913', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (691, 'Sliding Gate', 458, 1, 1, 1, '2022-06-01 16:24:47.560', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (692, 'Electrical Fence', 458, 1, 1, 1, '2022-06-01 16:24:57.480', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (693, 'Boom Gate Manual', 458, 1, 1, 1, '2022-06-01 16:25:20.567', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (694, 'Walkway', 783, 1, 1, 1, '2022-06-01 16:25:51.633', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (695, 'Flag Pole', 454, 1, 1, 1, '2022-06-01 16:26:18.213', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (696, 'Sign - Information', 454, 1, 1, 1, '2022-06-01 16:26:31.083', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (697, 'Lawns', 784, 1, 1, 1, '2022-06-01 16:26:52.510', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (698, 'Tank Stand', 780, 1, 1, 1, '2022-06-01 16:27:39.107', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (699, 'Kerb Inlet', 782, 1, 1, 1, '2022-06-01 16:28:51.590', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (700, 'Culvert Pipe', 787, 1, 1, 1, '2022-06-01 16:30:33.147', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (701, 'Community Hall', 790, 1, 1, 1, '2022-06-08 12:00:57.217', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (702, 'Community Hall - Retention', 791, 1, 1, 1, '2022-06-08 12:01:48.497', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (703, 'Sports Facility', 792, 1, 1, 1, '2022-06-08 12:02:45.450', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (704, 'Sports Facility - Retention', 793, 1, 1, 1, '2022-06-08 12:03:18.880', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (705, 'Taxi Rank - Retention', 794, 1, 1, 1, '2022-06-08 12:06:55.580', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (706, 'Testing Station', 795, 1, 1, 1, '2022-06-08 12:12:10.170', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (707, 'Testing Station - Retention', 796, 1, 1, 1, '2022-06-08 12:12:38.363', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (708, 'Tourism Structure', 789, 1, 1, 1, '2022-06-08 12:13:55.780', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (709, 'Taxi Rank', 798, 1, 1, 1, '2022-06-14 13:11:45.360', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (710, 'Network Server', 799, 0, 1, 1, '2022-10-03 14:16:30.507', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (711, 'Server Rack Mount', 800, 0, 1, 1, '2022-10-03 14:19:33.813', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (712, 'Sign Electronic LED', 801, 1, 1, 1, '2022-10-04 09:45:55.900', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (713, 'Manhole', 802, 1, 1, 1, '2022-10-04 10:27:59.567', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (714, 'High Mast Light', 803, 1, 1, 1, '2022-10-04 11:02:07.610', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (715, 'Post Top Light', 804, 1, 1, 1, '2022-10-04 11:02:20.860', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (716, 'Filing Cabinet', 805, 0, 1, 1, '2022-10-04 11:03:26.693', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (717, 'Visitors Chair', 806, 0, 1, 1, '2022-10-04 11:03:44.390', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (718, 'Light Box with Poles', 807, 0, 1, 1, '2022-10-04 11:03:59.163', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (719, 'Land', 808, 1, 1, 1, '2022-10-04 12:10:59.813', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (720, 'Boardroom Desk', 811, 0, 1, 1, '2022-10-04 15:07:21.887', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (721, 'Boardroom Table', 810, 0, 1, 1, '2022-10-04 15:07:52.383', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (722, 'Brochure Stand', 812, 0, 1, 1, '2022-10-04 15:08:13.250', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (723, 'Bulk Filer', 813, 0, 1, 1, '2022-10-04 15:08:34.247', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (724, 'Cell Phone', 809, 0, 1, 1, '2022-10-04 15:08:54.193', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (725, 'Chairs And Couches', 814, 0, 1, 1, '2022-10-04 15:09:37.580', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (726, 'Coat and Hat Stand', 287, 0, 1, 1, '2022-10-04 15:10:04.043', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (727, 'Coat and Hat Stand', 831, 1, 1, 1, '2022-10-04 15:12:34.543', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (728, 'Coat Stand', 815, 1, 1, 1, '2022-10-04 15:13:02.000', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (729, 'Coffee Table', 816, 0, 1, 1, '2022-10-04 15:13:23.530', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (730, 'Coat and Hat Stand', 831, 0, 1, 1, '2022-10-04 15:13:48.970', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (731, 'Binder', 277, 0, 1, 1, '2022-10-04 15:14:13.647', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (732, 'Conference Table', 817, 0, 1, 1, '2022-10-04 15:15:02.110', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (733, 'Desk - Credenza and Pedestal', 818, 0, 1, 1, '2022-10-04 15:16:03.670', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (734, 'Desk Extension', 819, 0, 1, 1, '2022-10-04 15:16:25.270', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (735, 'Digital Voice Processing', 820, 0, 1, 1, '2022-10-04 15:16:52.233', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (736, 'Draughtsman Chair', 821, 0, 1, 1, '2022-10-04 15:17:14.680', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (737, 'Dual Vocal Set', 822, 0, 1, 1, '2022-10-04 15:17:32.883', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (738, 'Dunham Bush', 823, 0, 1, 1, '2022-10-04 15:17:53.390', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (739, 'Interactive White Board System-Projector', 824, 0, 1, 1, '2022-10-04 15:18:29.797', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (740, 'Loudhailer', 825, 0, 1, 1, '2022-10-04 15:18:50.227', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (741, 'Microphones', 318, 0, 1, 1, '2022-10-04 15:19:09.953', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (742, 'Open L - Extension', 826, 0, 1, 1, '2022-10-04 15:19:30.477', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (743, 'Projector Stand', 827, 0, 1, 1, '2022-10-04 15:19:51.213', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (744, 'Quarter Link', 828, 0, 1, 1, '2022-10-04 15:20:12.257', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (745, 'Reception Counter', 829, 0, 1, 1, '2022-10-04 15:20:34.883', 252, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (746, 'Trolley', 830, 0, 1, 1, '2022-10-04 15:21:25.640', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (747, 'Whiteboard', 362, 0, 1, 1, '2022-10-04 15:22:04.643', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (748, 'Amplifier', 832, 0, 1, 1, '2022-10-04 16:41:24.817', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (749, 'Beltpack Transmitter', 833, 0, 1, 1, '2022-10-04 16:41:41.840', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (750, 'Gym Stand Bars', 834, 0, 1, 1, '2022-10-04 16:41:59.780', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (751, 'Microphone', 318, 0, 1, 1, '2022-10-04 16:56:40.340', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (752, 'TV Screen', 835, 0, 1, 1, '2022-10-04 16:59:56.480', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (753, 'Office Block - Electrical Connection', 836, 1, 1, 1, '2022-10-05 10:51:11.340', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (754, 'Guardhouse', 445, 1, 1, 1, '2022-10-05 10:52:51.290', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (755, 'Sign Electronic Led', 454, 1, 1, 1, '2022-10-05 10:57:35.940', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (756, 'Street Light', 838, 1, 1, 1, '2022-10-05 11:30:56.223', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (757, 'Flowerbed And Shrub -Trees', 839, 1, 1, 1, '2022-10-05 12:51:25.730', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (758, 'Flowerbed And Shrub -Trees', 841, 1, 1, 1, '2022-10-05 12:54:33.827', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (759, 'Flowerbed And Shrub -Trees', 840, 1, 1, 1, '2022-10-05 12:55:15.313', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (760, 'Athletics Outdoor Track And Field', 842, 1, 1, 1, '2022-10-05 13:06:03.073', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (761, 'Ballade Poles', 843, 1, 1, 1, '2022-10-05 13:09:58.590', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (762, 'Culvert Pipe', 844, 1, 1, 1, '2022-10-05 13:17:05.473', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (763, 'Dwelling Flats', 845, 1, 1, 1, '2022-10-05 13:20:56.517', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (764, 'Pump Station Building', 846, 1, 1, 1, '2022-10-05 13:21:09.953', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (765, 'Rugby Field', 847, 1, 1, 1, '2022-10-05 13:25:24.420', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (766, 'Softball Field', 848, 1, 1, 1, '2022-10-05 13:25:36.040', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (767, 'Golf Course', 849, 1, 1, 1, '2022-10-05 13:25:45.880', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (768, 'Office Small Urban Office - Similar To House', 850, 1, 1, 1, '2022-10-05 13:43:10.297', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (769, 'Office Small Urban Office - Similar To House', 851, 1, 1, 1, '2022-10-05 13:43:24.543', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (770, 'Fire Arm', 852, 0, 1, 1, '2022-10-05 16:29:25.460', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (771, 'Boom Gate', 527, 1, 1, 1, '2022-10-06 08:27:43.623', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (772, 'Veranda', 498, 1, 1, 1, '2022-10-06 08:34:28.233', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (773, 'Other assets', 853, 0, 1, 1, '2022-10-06 08:36:37.323', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (774, 'Tennis Court', 854, 1, 1, 1, '2022-10-06 08:41:46.430', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (775, 'Flowerbed And Shrub -Trees', 855, 1, 1, 1, '2022-10-06 08:52:19.747', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (776, 'Generator Building', 837, 1, 1, 1, '2022-10-06 08:55:50.310', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (777, 'Medal', 856, 0, 1, 1, '2022-10-06 12:30:56.147', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (778, 'Chain', 857, 0, 1, 1, '2022-10-06 12:31:15.947', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (779, 'External Hard Drive', 859, 0, 1, 1, '2022-10-06 12:48:24.310', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (780, 'Server Mount Cabinet', 858, 0, 1, 1, '2022-10-06 12:49:37.647', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (781, 'Forticare', 860, 0, 1, 1, '2022-10-06 13:24:06.573', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (782, 'Document Sealer 2D', 861, 0, 1, 1, '2022-10-06 13:41:05.227', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (783, 'Monochrome Payslip Laser Printer', 862, 0, 1, 1, '2022-10-06 13:47:25.313', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (784, '2 Way Radio', 863, 0, 1, 1, '2022-10-07 11:08:11.460', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (785, 'Air Jack', 864, 0, 1, 1, '2022-10-07 11:08:27.923', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (786, 'Angle Grinder', 865, 0, 1, 1, '2022-10-07 11:08:44.683', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (787, 'Backhoe Loader-TLB', 866, 0, 1, 1, '2022-10-07 11:09:03.783', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (788, 'Battery Charger', 867, 0, 1, 1, '2022-10-07 11:09:19.533', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (789, 'Bench Press', 868, 0, 1, 1, '2022-10-07 11:10:09.327', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (790, 'Blower', 869, 0, 1, 1, '2022-10-07 11:10:33.003', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (791, 'Boom Spray', 870, 0, 1, 1, '2022-10-07 11:10:52.540', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (792, 'Cabinet Battery Box', 871, 0, 1, 1, '2022-10-07 11:11:12.793', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (793, 'Chainsaw', 872, 0, 1, 1, '2022-10-07 11:11:33.207', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (794, 'Cherry Picker', 873, 0, 1, 1, '2022-10-07 11:11:52.703', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (795, 'Cold Milling Machine', 874, 0, 1, 1, '2022-10-07 11:12:09.770', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (796, 'Compactor', 875, 0, 1, 1, '2022-10-07 11:12:26.203', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (797, 'Compressor', 876, 0, 1, 1, '2022-10-07 11:12:44.857', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (798, 'Converter', 877, 0, 1, 1, '2022-10-07 11:13:03.483', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (799, 'Crane', 878, 0, 1, 1, '2022-10-07 11:13:20.193', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (800, 'Diesel Bowser Trailer', 879, 0, 1, 1, '2022-10-07 11:13:35.443', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (801, 'Drill', 880, 0, 1, 1, '2022-10-07 11:13:52.333', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (802, 'Dumbbells', 881, 0, 1, 1, '2022-10-07 11:14:08.053', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (803, 'Dumpy Level', 882, 0, 1, 1, '2022-10-07 11:14:24.373', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (804, 'Edge Trimmer', 883, 0, 1, 1, '2022-10-07 11:14:51.023', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (805, 'Excavator', 884, 0, 1, 1, '2022-10-07 11:15:09.827', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (806, 'Fumigation Machine', 885, 0, 1, 1, '2022-10-07 11:15:26.033', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (807, 'Generator', 886, 0, 1, 1, '2022-10-07 11:15:44.763', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (808, 'Grader', 887, 0, 1, 1, '2022-10-07 11:17:59.257', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (809, 'Grass Cutter', 888, 0, 1, 1, '2022-10-07 11:18:13.307', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (810, 'Grass Cutter Machine', 889, 0, 1, 1, '2022-10-07 11:18:35.533', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (811, 'Grid Roller', 890, 0, 1, 1, '2022-10-07 11:18:58.080', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (812, 'Grinder', 891, 0, 1, 1, '2022-10-07 11:19:21.007', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (813, 'High Pressure Washer', 892, 0, 1, 1, '2022-10-07 11:19:37.947', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (814, 'Hydraulic Heavy Crimper', 893, 0, 1, 1, '2022-10-07 11:20:04.107', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (815, 'Industrial Generator', 894, 0, 1, 1, '2022-10-07 11:20:17.583', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (816, 'Jack', 895, 0, 1, 1, '2022-10-07 11:20:31.383', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (817, 'Licence Disk Scanner and Number Plate Recognition', 896, 0, 1, 1, '2022-10-07 11:20:45.863', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (818, 'Lifeguard Post and Seat', 897, 0, 1, 1, '2022-10-07 11:21:03.393', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (819, 'Lowbed', 898, 0, 1, 1, '2022-10-07 11:21:18.677', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (820, 'Maize Planter', 899, 0, 1, 1, '2022-10-07 11:21:33.413', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (821, 'Maximum User Weight', 900, 0, 1, 1, '2022-10-07 11:21:48.660', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (822, 'Maximum Weight Capacity', 901, 0, 1, 1, '2022-10-07 11:22:02.760', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (823, 'Measuring Wheel', 902, 0, 1, 1, '2022-10-07 11:22:23.130', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (824, 'Mouldboard Plough', 903, 0, 1, 1, '2022-10-07 11:22:52.183', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (825, 'Mower', 904, 0, 1, 1, '2022-10-07 11:23:09.180', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (826, 'Multipurpose Tester Digital', 905, 0, 1, 1, '2022-10-07 11:23:21.790', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (827, 'Offset Disc Harrow', 906, 0, 1, 1, '2022-10-07 11:23:35.523', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (828, 'Planter', 907, 0, 1, 1, '2022-10-07 11:23:49.443', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (829, 'Pressing Machine', 908, 0, 1, 1, '2022-10-07 11:24:03.693', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (830, 'Pruner Tree', 909, 0, 1, 1, '2022-10-07 11:24:18.360', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (831, 'Roadblock Lights', 910, 0, 1, 1, '2022-10-07 11:24:35.643', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (832, 'Roller', 911, 0, 1, 1, '2022-10-07 11:24:56.730', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (833, 'Skip Bin', 912, 0, 1, 1, '2022-10-07 11:25:14.187', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (834, 'Skip Truck', 913, 0, 1, 1, '2022-10-07 11:25:30.267', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (835, 'Speed Measuring Instrument', 914, 0, 1, 1, '2022-10-07 11:25:44.307', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (836, 'Speed Trapper', 915, 0, 1, 1, '2022-10-07 11:26:01.593', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (837, 'Tanker Fuel', 916, 0, 1, 1, '2022-10-07 11:26:19.020', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (838, 'Tar-Concrete Cutter Machine', 917, 0, 1, 1, '2022-10-07 11:26:37.470', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (839, 'Tip Truck', 918, 0, 1, 1, '2022-10-07 11:26:54.670', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (840, 'Tipper Truck', 919, 0, 1, 1, '2022-10-07 11:27:19.607', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (841, 'Tool bag set', 920, 0, 1, 1, '2022-10-07 11:27:58.290', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (842, 'Tractor', 921, 0, 1, 1, '2022-10-07 11:28:16.640', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (843, 'Tractor Roller Mower', 922, 0, 1, 1, '2022-10-07 11:28:37.727', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (844, 'Trailer', 923, 0, 1, 1, '2022-10-07 11:29:17.960', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (845, 'Treadmill', 924, 0, 1, 1, '2022-10-07 11:29:34.430', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (846, 'Truck', 925, 0, 1, 1, '2022-10-07 11:29:48.003', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (847, 'Tyre Inflator and Deflator', 926, 0, 1, 1, '2022-10-07 11:30:27.670', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (848, 'Vibratory Compactor', 927, 0, 1, 1, '2022-10-07 11:30:53.867', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (849, 'Water Pump Machine', 928, 0, 1, 1, '2022-10-07 11:31:12.253', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (850, 'Welding Machine', 929, 0, 1, 1, '2022-10-07 11:31:25.363', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (851, 'Inflatable ribbon', 930, 0, 1, 1, '2022-10-07 11:33:32.830', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (852, 'Grinder', 931, 0, 1, 1, '2022-10-07 11:33:45.533', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (853, 'Fence', 932, 1, 1, 1, '2022-10-07 12:47:54.533', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (854, 'Park Table', 524, 1, 1, 1, '2022-10-07 12:59:53.317', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (855, 'Jungle Gym', 524, 1, 1, 1, '2022-10-07 13:01:25.963', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (856, 'Toilets', 686, 1, 1, 1, '2022-10-07 13:04:46.187', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (857, 'Palisade Fence', 678, 1, 1, 1, '2022-10-07 13:07:58.583', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (858, 'Sliding Gate', 678, 1, 1, 1, '2022-10-07 13:08:19.983', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (859, 'Cold Milling Machine', 874, 1, 1, 1, '2022-10-07 13:30:02.720', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (860, 'Diesel Bowser Trailer', 879, 1, 1, 1, '2022-10-07 13:31:00.173', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (861, 'Flowerbed And Shrub -Trees', 935, 1, 1, 1, '2022-10-07 13:53:05.330', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (862, 'Hall-Indoor Sport Complex', 936, 1, 1, 1, '2022-10-07 13:53:24.400', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (863, 'Sign Electronic LED', 482, 1, 1, 1, '2022-10-07 13:53:48.663', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (864, 'Ablution - Change Rooms', 937, 1, 1, 1, '2022-10-07 13:54:20.413', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (865, 'Guardhouse', 938, 1, 1, 1, '2022-10-07 13:54:47.487', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (866, 'V-Channel', 684, 1, 1, 1, '2022-10-07 13:55:07.753', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (867, 'Kerb Barrier', 939, 1, 1, 1, '2022-10-07 13:55:26.973', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (868, 'Park Bench', 678, 1, 1, 1, '2022-10-07 13:58:07.743', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (869, 'Outbuilding (Storeroom)', 940, 1, 1, 1, '2022-10-07 14:05:46.700', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (870, 'Fence', 941, 1, 1, 1, '2022-10-07 14:06:01.307', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (871, 'Jo-Jo Tank', 942, 1, 1, 1, '2022-10-07 14:06:22.573', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (872, 'Tank Stand', 943, 1, 1, 1, '2022-10-07 14:06:42.653', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (873, 'Sign Electronic: Structure', 944, 1, 1, 1, '2022-10-07 14:10:54.110', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (874, 'Pedestrian Gate', 941, 1, 1, 1, '2022-10-07 14:11:09.963', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (875, 'Kerb Barrier', 945, 1, 1, 1, '2022-10-07 14:18:22.220', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (876, 'Gabions', 946, 1, 1, 1, '2022-10-07 14:18:47.910', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (877, 'Hawker Stalls', 683, 1, 1, 1, '2022-10-07 14:19:27.573', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (878, 'Kerb Barrier', 947, 1, 1, 1, '2022-10-07 14:42:29.660', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (879, 'Hall-Indoor Sport Complex', 948, 1, 1, 1, '2022-10-07 14:42:42.227', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (880, 'Walkway', 949, 1, 1, 1, '2022-10-07 14:42:53.070', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (881, 'Carport', 950, 1, 1, 1, '2022-10-07 14:43:19.877', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (882, 'Flag Pole', 524, 1, 1, 1, '2022-10-07 14:44:10.153', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (883, 'Laptop Docking Station', 951, 0, 1, 1, '2022-10-09 17:04:53.303', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (884, 'Patch Panel', 952, 0, 1, 1, '2022-10-09 17:10:15.893', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (885, 'Fiber Tray', 953, 0, 1, 1, '2022-10-09 17:14:19.473', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (886, 'NAS Storage', 954, 0, 1, 1, '2022-10-09 17:18:17.207', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (887, 'Proline', 955, 0, 1, 1, '2022-10-09 17:25:15.710', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (888, 'Optical Transceiver', 956, 0, 1, 1, '2022-10-09 18:33:19.253', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (889, 'Ablution - Change Rooms', 957, 1, 1, 1, '2022-10-10 07:56:03.743', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (890, 'Park Bench', 958, 1, 1, 1, '2022-10-10 08:09:05.183', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (891, 'Parking', 959, 1, 1, 1, '2022-10-10 08:25:57.710', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (892, 'Guardhouse', 477, 1, 1, 1, '2022-10-10 08:44:31.713', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (893, 'Pedestrian Gate', 508, 1, 1, 1, '2022-10-10 08:45:23.463', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (894, 'Fence', 960, 1, 1, 1, '2022-10-10 09:13:23.617', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (895, 'Culturally Significant Buildings', 961, 1, 1, 1, '2022-10-10 10:10:57.440', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (896, 'Cenotaph', 962, 1, 1, 1, '2022-10-10 10:16:29.103', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (897, 'Air Conditioner', 565, 0, 1, 1, '2022-11-02 15:12:17.490', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (898, 'Combo Binder', 963, 1, 1, 1, '2022-11-02 15:25:28.330', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (899, 'Shelves', 964, 0, 1, 1, '2022-11-02 15:25:37.553', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (900, 'Interactive White Board System - Projector', 966, 0, 1, 1, '2022-11-02 15:26:16.517', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (901, 'Haelgeweer Maverick Kal', 967, 0, 1, 1, '2022-11-02 15:26:25.863', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (902, 'Haelgeweer Mossberg Kal', 968, 0, 1, 1, '2022-11-02 15:26:33.710', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (903, 'Haelgeweer Protecta Kal', 969, 0, 1, 1, '2022-11-02 15:26:41.780', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (904, 'Norinco 213 9mmp Pistol', 970, 0, 1, 1, '2022-11-02 15:26:51.507', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (905, 'Revolver Taurus 38 Special', 971, 0, 1, 1, '2022-11-02 15:26:58.917', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (906, 'Medal', 856, 1, 1, 1, '2022-11-02 15:49:50.783', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (907, 'Chain', 857, 1, 1, 1, '2022-11-02 15:49:59.793', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (908, 'Security System', 972, 1, 1, 1, '2022-11-02 15:54:52.317', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (909, 'Browning Firearm 9mm', 368, 1, 1, 1, '2022-11-02 15:56:23.970', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (910, 'Browning Firearm 9mm', 973, 0, 1, 1, '2022-11-02 16:01:04.057', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (911, 'Pistol Norinco Kal', 974, 0, 1, 1, '2022-11-02 16:01:16.943', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (912, 'Air Conditioner', 975, 1, 1, 1, '2022-11-02 16:06:36.167', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (913, 'Norinco Nz 75', 976, 1, 1, 1, '2022-11-03 08:19:48.807', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (914, 'Pistol Helwan Kal', 977, 1, 1, 1, '2022-11-03 08:20:42.573', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (915, 'Minibus', 978, 1, 1, 1, '2022-11-03 09:14:45.647', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (916, 'LDV', 979, 1, 1, 1, '2022-11-03 09:23:32.847', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (917, 'Sedan', 980, 1, 1, 1, '2022-11-03 09:23:41.420', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (918, 'SUV', 981, 1, 1, 1, '2022-11-03 09:23:50.713', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (919, 'Laptop Bag', 982, 1, 1, 1, '2022-11-03 09:27:28.883', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (920, 'White Board', 965, 1, 1, 1, '2022-11-03 09:31:55.407', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (921, 'AUC', 983, 1, 1, 1, '2022-11-17 13:19:34.067', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (922, 'AUC', 984, 1, 1, 1, '2022-11-17 13:23:53.003', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (923, 'AUC', 985, 1, 1, 1, '2022-11-17 13:27:32.870', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (924, 'AUC', 986, 1, 1, 1, '2022-11-17 13:30:32.430', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (925, 'AUC', 987, 1, 1, 1, '2022-11-17 13:33:00.257', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (926, 'AUC', 988, 1, 1, 1, '2022-11-17 13:35:45.530', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (927, 'AUC', 989, 1, 1, 1, '2022-11-17 13:37:50.537', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (928, 'Vacant Land', 634, 1, 1, 1, '2022-11-17 13:49:02.070', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (929, 'AUC', 990, 1, 1, 1, '2022-11-30 08:53:19.480', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (930, 'AUC', 991, 1, 1, 1, '2022-11-30 08:57:19.390', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (931, 'AUC', 992, 1, 1, 1, '2022-11-30 08:57:25.643', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (932, 'Other Software', 993, 0, 1, 1, '2022-11-30 12:42:24.433', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (933, 'Computer Software', 994, 0, 1, 1, '2022-11-30 12:42:34.490', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (934, 'Server Software', 995, 0, 1, 1, '2022-11-30 12:42:42.493', 199, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (935, 'Camera-CCTV', 996, 0, 1, 1, '2023-03-15 15:29:26.933', 271, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (936, 'Network Video Recorder', 997, 0, 1, 1, '2023-03-15 15:38:32.480', 271, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (937, 'Network Video Recorder', 998, 0, 1, 1, '2023-03-15 15:39:40.107', 271, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (938, 'Biometric Scanner', 997, 0, 1, 1, '2023-03-15 15:39:59.097', 271, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (939, 'Telephone handset', 999, 0, 1, 1, '2023-08-11 18:00:10.697', 271, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (940, 'Office Mobile', 1000, 1, 1, 1, '2023-11-07 20:20:59.953', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (941, 'Walls', 458, 1, 1, 1, '2023-11-07 20:22:32.747', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (942, 'Outbuilding  - Storeroom', 445, 1, 1, 1, '2023-11-07 20:24:00.453', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (943, 'Retaining Walls', 458, 1, 1, 1, '2023-11-07 20:25:20.653', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (944, 'Park Bench', 454, 1, 1, 1, '2023-11-07 20:26:15.650', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (945, 'Flowerbed and Shrub - Trees', 454, 1, 1, 1, '2023-11-07 20:26:25.547', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (946, 'Kerb Barrier', 1008, 1, 1, 1, '2023-11-07 20:50:29.030', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (947, 'Paved Area', 788, 0, 1, 1, '2023-11-07 20:51:23.590', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (948, 'Channel', 1009, 0, 1, 1, '2023-11-07 20:52:09.743', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (949, 'V-Channel', 1005, 1, 1, 1, '2023-11-07 21:15:50.430', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (950, 'Pump - Hydraulic', 1006, 0, 1, 1, '2023-11-07 21:16:25.980', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (951, 'Office Small Urban', 1001, 1, 1, 1, '2023-11-07 21:17:00.973', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (952, 'Honorary Stone', 1004, 1, 1, 1, '2023-11-07 21:17:24.303', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (953, 'Town Hall', 1003, 1, 1, 1, '2023-11-07 21:17:56.433', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (954, 'K53 Drivers Testing Incline', 1007, 1, 1, 1, '2023-11-07 21:18:17.393', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (955, 'Lunar 24 Gps Module', 1010, 1, 1, 1, '2023-11-08 09:33:32.647', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (956, 'Gabions', 1011, 1, 1, 1, '2023-11-08 11:08:57.747', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (957, 'Blue lamps and siren', 1012, 0, 1, 1, '2023-11-08 15:22:26.387', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (958, 'Ablution - Changeroom', 1002, 1, 1, 1, '2023-11-08 15:33:37.030', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (959, 'Outdoor Exercise Equipment', 1013, 1, 1, 1, '2023-11-08 16:27:47.403', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (960, 'GPS', 1014, 0, 1, 1, '2023-11-08 19:23:04.543', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (961, 'Tow Tractor Bell For Grid Roller', 1015, 0, 1, 1, '2023-11-08 19:24:24.750', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (962, 'Fire Compression - Control Panel', 1016, 0, 1, 1, '2023-11-08 19:25:02.740', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (963, 'Radio 2-Way', 1017, 0, 1, 1, '2023-11-08 20:06:55.637', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (964, 'Tow Tractor Bell For Grid Roller', 1018, 0, 1, 1, '2023-11-08 20:08:49.450', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (965, 'Road Marking Machine', 1019, 0, 1, 1, '2023-11-08 20:09:06.427', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (966, 'Tar - Concrete Cutter Machine', 1021, 0, 1, 1, '2023-11-08 20:20:24.087', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (967, 'Backhoe Loader - TLB', 1020, 0, 1, 1, '2023-11-08 20:20:42.087', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (968, 'Inflatable ribbon', 1022, 0, 1, 1, '2023-11-08 20:31:22.223', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (969, 'Slide', 1023, 1, 1, 1, '2023-11-08 20:53:44.727', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (970, 'Swing', 1024, 1, 1, 1, '2023-11-08 21:00:42.790', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (971, 'Laptop Bag', 1026, 0, 1, 1, '2023-11-09 08:08:35.753', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (972, 'Speedpoint', 1027, 0, 1, 1, '2023-11-09 08:08:48.790', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (973, 'See Saw', 1025, 1, 1, 1, '2023-11-09 08:54:22.163', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (974, 'Ablution - Change Rooms', 1028, 1, 1, 1, '2023-11-09 09:03:29.053', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (975, 'Urban Office', 1029, 1, 1, 1, '2023-11-09 09:17:08.140', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (976, 'Urban Office', 1030, 1, 1, 1, '2023-11-09 09:17:20.760', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (977, 'Roller Door', 1031, 1, 1, 1, '2023-11-09 09:44:21.270', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (978, 'Roller Door', 1032, 1, 1, 1, '2023-11-09 09:44:31.510', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (979, 'Pump - Centrifugal', 1033, 1, 1, 1, '2023-11-09 10:07:07.157', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (980, 'Starting Block', 1034, 1, 1, 1, '2023-11-09 10:12:07.797', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (981, 'Club House', 1035, 1, 1, 1, '2023-11-09 10:41:55.273', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (982, 'Timber Deck', 527, 1, 1, 1, '2023-11-09 10:47:14.603', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (983, 'Borehole Enclosure', 1036, 1, 1, 1, '2023-11-09 10:58:11.993', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (984, 'Pump -Hydraulic', 1037, 1, 1, 1, '2023-11-09 11:02:31.507', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (985, 'Filing Shelves', 1038, 0, 1, 1, '2023-11-09 11:56:13.577', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (986, 'Trolley - Tea', 1039, 0, 1, 1, '2023-11-09 11:56:25.037', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (987, 'Reception Table', 1040, 0, 1, 1, '2023-11-09 11:57:30.010', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (988, 'Pistol Safe', 1041, 0, 1, 1, '2023-11-09 11:59:17.980', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (989, 'Filer Bay', 1042, 0, 1, 1, '2023-11-09 11:59:29.023', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (990, 'Book Shelves', 1043, 0, 1, 1, '2023-11-09 12:00:38.217', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (991, 'Filing Cupboard', 1044, 0, 1, 1, '2023-11-09 12:00:48.667', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (992, 'Telephone Handset', 1045, 0, 1, 1, '2023-11-09 12:16:18.493', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (993, 'Light Box', 1046, 0, 1, 1, '2023-11-09 12:16:34.780', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (994, 'Roadearthworks', 703, 1, 1, 1, '2023-11-09 14:45:09.680', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (995, 'Rubbish Bin', 482, 1, 1, 1, '2023-11-09 15:06:27.850', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (996, 'Guardhouse', 476, 1, 1, 1, '2023-11-09 15:12:17.563', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (997, 'Walkway', 1047, 1, 1, 1, '2023-11-09 15:16:14.040', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (998, 'Toilets', 476, 1, 1, 1, '2023-11-09 15:17:34.990', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (999, 'Ablution Block', 683, 1, 1, 1, '2023-11-09 15:18:33.920', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1000, 'Sliding Gate', 428, 1, 1, 1, '2023-11-09 15:24:42.847', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1001, 'Pedestrian Gate', 428, 1, 1, 1, '2023-11-09 15:27:39.703', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1002, 'Handrails', 1048, 1, 1, 1, '2023-11-09 15:31:53.923', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1003, 'Parking', 1049, 1, 1, 1, '2023-11-09 15:44:11.760', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1004, 'Channel', 685, 1, 1, 1, '2023-11-09 15:50:52.643', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1005, 'Channel', 1050, 1, 1, 1, '2023-11-09 15:53:01.080', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1006, 'Sign Electronic-Structure', 944, 1, 1, 1, '2023-11-09 15:55:16.003', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1007, 'Lapa', 686, 1, 1, 1, '2023-11-09 15:58:54.840', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1008, 'Boreholes', 1051, 1, 1, 1, '2023-11-09 16:04:33.423', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1009, 'Gabions', 1054, 1, 1, 1, '2023-11-09 16:10:33.137', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1010, 'Cenotaph', 1055, 0, 1, 1, '2023-11-09 16:12:30.880', 251, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1011, 'Ablution Block', 1057, 1, 1, 1, '2023-11-09 16:19:44.837', 285, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1012, 'Flood Light', 1052, 1, 1, 1, '2023-11-09 16:29:05.157', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1013, 'Pump', 1053, 1, 1, 1, '2023-11-09 16:29:24.577', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1014, 'Paved Area', 439, 1, 1, 1, '2023-11-09 16:30:06.167', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1015, 'Storeroom', 434, 1, 1, 1, '2023-11-09 16:31:24.463', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1016, 'Dwelling Normal Size House', 636, 1, 1, 1, '2023-11-09 16:32:08.123', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1017, 'Hall', 638, 1, 1, 1, '2023-11-09 16:32:33.837', 252, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1018, 'Sign Electronic Led', 1058, 1, 1, 1, '2023-11-09 16:36:49.820', 339, 1);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1019, 'Unpaved Road Reval', 738, 1, 1, 1, '2024-02-29 09:25:25.587', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1020, 'Unpaved Road Reval 2', 738, 1, 1, 1, '2024-02-29 10:30:27.097', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1021, 'Pump (Hydraulic)', 1059, 1, 1, 1, '2024-04-15 06:41:41.697', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1022, 'Paved Area', 1060, 1, 1, 1, '2024-04-15 09:34:49.503', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1023, 'Land', 1061, 1, 1, 1, '2024-04-15 11:18:33.977', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1024, 'Megaphone Handheld', 1062, 0, 1, 1, '2024-04-15 13:46:52.863', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1025, 'Loud Hailer', 1063, 0, 1, 1, '2024-04-15 13:48:59.507', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1026, 'Water Pump Machine', 1064, 1, 1, 1, '2024-04-15 16:39:38.597', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1027, 'Honorary Stone', 1065, 1, 1, 1, '2024-04-15 16:41:40.087', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1028, 'Kerb Barrier', 1066, 1, 1, 1, '2024-04-15 16:49:19.510', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1029, 'Retaining Wall', 1067, 1, 1, 1, '2024-04-15 16:55:07.753', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1030, 'Channel', 1068, 1, 1, 1, '2024-04-15 16:57:43.207', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1031, 'Halls', 1069, 1, 1, 1, '2024-04-15 17:53:52.717', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1032, 'Swimming Pool Starting Block', 1070, 1, 1, 1, '2024-04-15 17:56:14.173', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1033, 'Small Urban Office', 1071, 1, 1, 1, '2024-04-15 18:06:12.070', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1034, 'Roller Door', 1072, 1, 1, 1, '2024-04-15 18:14:26.143', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1035, 'Roller Door', 1073, 1, 1, 1, '2024-04-15 18:14:38.003', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1036, 'Pavement', 1074, 1, 1, 1, '2024-04-15 18:22:47.780', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1037, 'Pavement', 1075, 1, 1, 1, '2024-04-15 18:25:16.577', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1038, 'Boreholes', 1076, 1, 1, 1, '2024-04-15 18:38:27.447', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1039, 'Boreholes', 1077, 1, 1, 1, '2024-04-15 18:38:37.553', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1040, 'Borehole Enclosure', 1078, 1, 1, 1, '2024-04-15 18:55:12.913', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1041, 'Water Pump Machine', 1079, 1, 1, 1, '2024-04-15 19:01:05.100', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1042, 'House', 1084, 1, 1, 1, '2024-04-19 14:13:55.470', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1043, 'Operational Buildings', 1085, 1, 1, 1, '2024-04-19 14:14:19.740', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1044, 'Sports Ground', 1081, 1, 1, 1, '2024-04-19 14:15:46.333', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1045, 'High Mast Light', 1087, 1, 1, 1, '2024-04-19 14:42:35.143', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1046, 'Roads', 1086, 1, 1, 1, '2024-04-19 14:42:47.647', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1047, 'Animal Pound', 1088, 1, 1, 1, '2024-04-19 14:46:50.857', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1048, 'Operational Buildings', 1089, 1, 1, 1, '2024-04-19 14:56:31.707', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1049, 'HP Probook 450 G10 (IS)', 1090, 0, 1, 1, '2024-04-19 16:09:11.583', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1050, 'HP Probook 450 G11 (IS)', 1091, 0, 1, 1, '2024-04-19 16:09:22.640', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1051, 'HP Probook 450 G12 (IS)', 1092, 0, 1, 1, '2024-04-19 16:09:31.333', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1052, 'HP Probook 450 G13 (IS)', 1093, 0, 1, 1, '2024-04-19 16:09:39.840', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1053, 'Television', 1094, 0, 1, 1, '2024-04-19 16:13:31.940', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1054, 'Water Separation', 1095, 0, 1, 1, '2024-04-19 16:13:40.820', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1055, 'Shredder Machine', 1096, 0, 1, 1, '2024-04-19 16:13:49.163', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1056, 'Gazebo', 1097, 0, 1, 1, '2024-04-19 16:13:58.290', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1057, 'Furrow', 1098, 0, 1, 1, '2024-04-19 16:14:05.857', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1058, 'Compactor truck', 1099, 0, 1, 1, '2024-04-19 16:14:13.600', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1059, 'Road Sweeper', 1100, 0, 1, 1, '2024-04-19 16:14:25.620', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1060, 'Jump Starter', 1101, 0, 1, 1, '2024-04-19 16:14:34.820', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1061, 'Hydraulic Jack', 1102, 0, 1, 1, '2024-04-19 16:14:46.687', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1062, 'Laptop', 1103, 0, 1, 1, '2024-04-19 17:16:44.573', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1063, 'Printer', 1104, 0, 1, 1, '2024-04-19 17:16:52.617', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1064, 'Table', 1115, 0, 1, 1, '2024-04-19 17:26:34.153', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1065, 'Voice Recorder', 1114, 0, 1, 1, '2024-04-19 17:26:42.570', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1066, 'Airconditioner', 1113, 0, 1, 1, '2024-04-19 17:26:51.870', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1067, 'Projector', 1112, 0, 1, 1, '2024-04-19 17:27:00.607', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1068, 'Fridge', 1111, 0, 1, 1, '2024-04-19 17:27:08.837', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1069, 'Microwave', 1110, 0, 1, 1, '2024-04-19 17:27:18.910', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1070, 'Chair', 1109, 0, 1, 1, '2024-04-19 17:27:27.613', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1071, 'Grader', 1108, 0, 1, 1, '2024-04-19 17:27:37.213', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1072, 'Chain Saw', 1105, 0, 1, 1, '2024-04-19 17:37:56.813', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1073, 'Chair High Back', 1116, 0, 1, 1, '2024-04-19 17:39:45.297', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1074, 'Concrete Cutter Machine', 1107, 0, 1, 1, '2024-04-19 17:42:18.607', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1075, 'Excavator', 1106, 0, 1, 1, '2024-04-19 17:42:37.033', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1076, 'Camera', 996, 0, 1, 1, '2024-04-19 17:44:07.840', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1077, 'Camera', 1117, 0, 1, 1, '2024-04-19 17:47:53.917', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1078, 'SUV', 1118, 0, 1, 1, '2024-04-19 17:51:52.953', 562, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1079, 'TV Monitor', 1119, 0, 1, 1, '2024-07-12 16:31:37.233', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1080, 'Mobile Devices', 1120, 0, 1, 1, '2024-07-12 16:47:18.480', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1081, 'Biometric', 1121, 0, 1, 1, '2024-10-07 15:45:50.153', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1082, 'Camera Set', 1122, 0, 1, 1, '2024-10-07 15:46:04.747', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1083, 'Car Siren', 1123, 0, 1, 1, '2024-10-07 15:46:19.557', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1084, 'CCTV NVR', 1124, 0, 1, 1, '2024-10-07 15:46:27.307', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1085, 'Document Sealer', 1125, 0, 1, 1, '2024-10-07 15:46:40.447', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1086, 'Dot Matrix Flatbed Printer', 1126, 0, 1, 1, '2024-10-07 15:46:51.937', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1087, 'Foldable Table', 1127, 0, 1, 1, '2024-10-07 15:47:04.570', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1088, 'Microphone Switchboard', 1128, 0, 1, 1, '2024-10-07 15:47:21.937', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1089, 'Network Cabinet', 1129, 0, 1, 1, '2024-10-07 15:47:37.380', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1090, 'Smart TV Screen', 1130, 0, 1, 1, '2024-10-07 15:47:54.200', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1091, 'Decoder', 1131, 0, 1, 1, '2024-10-07 15:48:07.527', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1092, 'Vehicle Jump Start', 1132, 0, 1, 1, '2024-10-07 15:48:21.423', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1093, 'Digital Camera', 1133, 0, 1, 1, '2024-10-07 15:53:26.190', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1094, 'Office Post Box', 1134, 0, 1, 1, '2024-10-07 16:01:06.923', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1095, 'Bucket and Wringer', 1135, 0, 1, 1, '2024-10-07 16:10:58.800', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1096, 'Filer Bulk 9 Bay', 1136, 0, 1, 1, '2024-10-07 16:11:08.657', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1097, 'Media Portable Player', 1137, 0, 1, 1, '2024-10-07 16:11:16.690', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1098, 'Reception Desk', 1138, 0, 1, 1, '2024-10-07 16:11:24.497', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1099, 'Wireless Microphone System', 1139, 0, 1, 1, '2024-10-07 16:11:32.730', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1100, 'Cabinet Battery Box', 1140, 0, 1, 1, '2024-10-07 16:23:22.403', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1101, 'Smart TV Screen', 1141, 0, 1, 1, '2024-10-07 16:23:37.763', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1102, 'Gazebo', 1142, 0, 1, 1, '2024-10-07 16:23:45.607', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1103, 'Mobile Devices', 1143, 0, 1, 1, '2024-10-07 16:23:55.153', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1104, 'Road Sweeper', 1144, 0, 1, 1, '2024-10-07 16:29:33.137', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1105, 'Dwelling Low Cost Housing', 1145, 1, 1, 1, '2024-10-07 18:27:44.277', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1106, 'Dwelling Normal Size House', 1146, 1, 1, 1, '2024-10-07 18:27:54.363', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1107, 'Braai', 1147, 1, 1, 1, '2024-10-07 18:33:37.807', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1108, 'Boom Gate Manual', 1148, 1, 1, 1, '2024-10-07 18:33:51.790', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1109, 'Land', 1149, 1, 1, 1, '2024-10-07 18:34:01.650', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1110, 'Horse Racing Field', 1150, 1, 1, 1, '2024-10-07 18:42:03.740', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1111, 'Netball Court', 1151, 1, 1, 1, '2024-10-07 18:42:10.573', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1112, 'Rugby Field', 1152, 1, 1, 1, '2024-10-07 18:42:17.143', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1113, 'Sport Facility', 1153, 1, 1, 1, '2024-10-07 18:42:23.640', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1114, 'Football (Soccer) Pitch', 1154, 1, 1, 1, '2024-10-07 18:42:31.013', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1115, 'Swimming Pool', 1155, 1, 1, 1, '2024-10-07 18:42:38.610', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1116, 'Animal Pound', 1156, 1, 1, 1, '2024-10-07 18:56:24.477', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1117, 'Buildings', 1157, 1, 1, 1, '2024-10-07 18:56:54.633', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1118, 'Bullet Proof Windows', 1158, 1, 1, 1, '2024-10-07 18:57:25.000', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1119, 'Flag Pole', 1159, 1, 1, 1, '2024-10-07 18:57:44.983', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1120, 'Kerb Edge', 1160, 1, 1, 1, '2024-10-07 18:58:10.137', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1121, 'Park Bench', 1161, 1, 1, 1, '2024-10-07 18:58:34.590', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1122, 'Parks', 1162, 1, 1, 1, '2024-10-07 18:58:54.810', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1123, 'PPE Developed Land', 1163, 1, 1, 1, '2024-10-07 18:59:08.860', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1124, 'PPE Undeveloped Land', 1164, 1, 1, 1, '2024-10-07 18:59:16.963', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1125, 'Roads', 1165, 1, 1, 1, '2024-10-07 18:59:45.847', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1126, 'Turnstiles', 1166, 1, 1, 1, '2024-10-07 19:00:01.053', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1127, 'Golf Course', 1167, 1, 1, 1, '2024-10-07 19:10:03.160', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1128, 'Softball Field', 1168, 1, 1, 1, '2024-10-07 19:10:10.967', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1129, 'Tennis Court', 1169, 1, 1, 1, '2024-10-07 19:10:17.953', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1130, 'Outdoor Exercise Equipment', 1170, 1, 1, 1, '2024-10-07 19:16:44.337', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1131, 'Football and Rugby Posts Combination', 530, 1, 1, 1, '2024-10-07 19:17:22.373', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1132, 'Internal Road', 1171, 1, 1, 1, '2024-10-07 19:26:01.637', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1133, 'Horse Racing Field', 1172, 1, 1, 1, '2024-10-07 19:26:12.217', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1134, 'Pedestrian Gate', 678, 1, 1, 1, '2024-10-07 19:27:19.487', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1135, 'Speed Hump', 1173, 1, 1, 1, '2024-10-07 19:42:31.093', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1136, 'V-Channel', 1068, 1, 1, 1, '2024-10-07 19:43:44.687', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1137, 'Pump (Hydraulic)', 1174, 1, 1, 1, '2024-10-07 19:47:33.417', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1138, 'Sign Electronic: Structure', 1175, 1, 1, 1, '2024-10-07 19:50:01.980', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1139, 'Ablution - Change Rooms', 1176, 1, 1, 1, '2024-10-07 19:53:42.573', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1140, 'Pavements', 672, 1, 1, 1, '2024-10-07 19:55:32.393', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1141, 'Dwelling Flats', 1177, 1, 1, 1, '2024-10-07 20:00:11.297', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1142, 'Community Hall', 1178, 1, 1, 1, '2024-10-07 20:08:56.470', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1143, 'Railing - Handrails', 1179, 1, 1, 1, '2024-10-07 20:09:08.690', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1144, 'Pump (Hydraulic)', 1180, 1, 1, 1, '2024-10-07 20:09:25.927', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1145, 'VIP Toilets', 477, 1, 1, 1, '2024-10-07 20:09:58.417', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1146, 'Street Light', 1181, 1, 1, 1, '2024-10-07 20:12:51.830', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1147, 'Culvert Bridge', 732, 1, 1, 1, '2024-10-07 20:17:27.693', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1148, 'Paving', 1182, 1, 1, 1, '2024-10-07 20:21:20.303', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1149, 'Toilets', 1183, 1, 1, 1, '2024-10-07 20:27:40.697', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1150, 'Wall', 678, 1, 1, 1, '2024-10-07 20:29:18.950', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1151, 'Tank Stand', 1184, 1, 1, 1, '2024-10-07 20:32:36.027', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1152, 'Jo-Jo Tank', 1185, 1, 1, 1, '2024-10-07 20:35:08.730', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1153, 'Ablution - Change Rooms', 1186, 1, 1, 1, '2024-10-07 20:39:54.923', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1154, 'Culvert Pipe', 1187, 1, 1, 1, '2024-10-07 20:42:24.873', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1155, 'Walkway', 1188, 1, 1, 1, '2024-10-07 20:44:42.953', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1156, 'Rubbish Bin', 958, 1, 1, 1, '2024-10-07 20:47:28.350', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1157, 'Catchpit', 1189, 1, 1, 1, '2024-10-07 20:51:24.720', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1158, 'Outbuilding (Storeroom)', 1183, 1, 1, 1, '2024-10-07 20:52:15.957', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1159, 'Paved Area', 1190, 1, 1, 1, '2024-10-07 20:55:54.313', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1160, 'Swivel Gate', 678, 1, 1, 1, '2024-10-07 20:58:03.233', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1161, 'Handrails', 1191, 1, 1, 1, '2024-10-07 21:00:22.580', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1162, 'Flood Light', 1192, 1, 1, 1, '2024-10-07 21:02:45.817', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1163, 'Roller Door', 1193, 1, 1, 1, '2024-10-07 21:04:43.423', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1164, 'Footpath', 1194, 1, 1, 1, '2024-10-07 21:06:45.023', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1165, 'Kerb Barrier', 1195, 1, 1, 1, '2024-10-07 21:08:58.220', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1166, 'V-Channel', 1196, 1, 1, 1, '2024-10-07 21:11:03.197', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1167, 'Braai', 958, 1, 1, 1, '2024-10-07 21:19:18.693', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1168, 'Office Block', 1197, 1, 1, 1, '2024-10-07 21:19:51.963', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1169, 'Parking', 1198, 1, 1, 1, '2024-10-07 21:19:59.033', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1170, 'Pump - Centrifugal', 1199, 1, 1, 1, '2024-10-07 21:20:07.050', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1171, 'Pump Station Building', 1200, 1, 1, 1, '2024-10-07 21:20:16.350', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1172, 'Guardhouse', 1183, 1, 1, 1, '2024-10-07 21:21:34.300', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1173, 'Retaining Wall', 1201, 1, 1, 1, '2024-10-07 21:24:37.200', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1174, 'Channel', 1196, 1, 1, 1, '2024-10-07 21:25:03.343', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1175, 'Internal Road', 1202, 1, 1, 1, '2024-10-07 21:28:11.720', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1176, 'Veranda', 1203, 1, 1, 1, '2024-10-07 21:30:31.370', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1177, 'Ballade Poles', 1204, 1, 1, 1, '2024-10-07 21:33:25.630', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1178, 'Clearview Fence', 458, 1, 1, 1, '2024-10-07 21:33:53.737', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1179, 'Parking', 1205, 1, 1, 1, '2024-10-07 21:39:51.490', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1180, 'Pump - Centrifugal', 1206, 1, 1, 1, '2024-10-07 21:39:59.607', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1181, 'Palisade Fence', 1207, 1, 1, 1, '2024-10-07 21:40:09.420', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1182, 'Sliding Gate', 1207, 1, 1, 1, '2024-10-07 21:41:10.043', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1183, 'Fence', 1207, 1, 1, 1, '2024-10-07 21:41:58.773', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1184, 'Pedestrian Gate', 1207, 1, 1, 1, '2024-10-07 21:42:34.117', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1185, 'Walkway', 1208, 1, 1, 1, '2024-10-07 21:50:53.257', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1186, 'Retaining Wall', 1209, 1, 1, 1, '2024-10-07 21:51:00.977', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1187, 'Park Table', 1210, 1, 1, 1, '2024-10-07 21:51:09.853', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1188, 'Office Block', 1211, 1, 1, 1, '2024-10-07 21:51:18.053', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1189, 'Sign - Information', 1212, 1, 1, 1, '2024-10-07 21:51:26.910', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1190, 'Club House', 1213, 1, 1, 1, '2024-10-07 21:51:40.453', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1191, 'Street Light', 1214, 1, 1, 1, '2024-10-07 22:15:35.083', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1192, 'Paving', 1215, 1, 1, 1, '2024-10-07 22:29:05.797', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1193, 'Toilets', 1186, 1, 1, 1, '2024-10-07 22:31:37.840', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1194, 'Outbuilding (Storeroom)', 1203, 1, 1, 1, '2024-10-07 22:35:26.190', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1195, 'Guardhouse', 1203, 1, 1, 1, '2024-10-07 22:35:35.817', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1196, 'Sport Facility', 792, 1, 1, 1, '2024-10-09 12:07:14.817', 199, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1197, 'Fence', 1089, 1, 1, 1, '2024-12-11 14:05:35.747', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1198, 'Clearview Fence', 527, 1, 1, 1, '2025-02-03 16:29:59.047', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1199, 'Building Roof', 686, 1, 1, 1, '2025-02-03 17:47:51.840', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1200, 'Building Wall', 686, 1, 1, 1, '2025-02-03 17:48:41.703', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1201, 'Drone', 1216, 0, 1, 1, '2025-02-17 11:28:46.703', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1202, 'General buildings and open spaces', 704, 1, 1, 1, '2025-02-26 10:29:21.267', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1203, 'Earthworks', 1218, 1, 1, 1, '2025-02-26 13:51:33.923', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1204, 'Community Assets', 1219, 1, 1, 1, '2025-03-12 08:23:06.090', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1205, 'Firearms', 1220, 0, 1, 1, '2025-06-02 06:12:21.883', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1206, 'Buildings', 1221, 1, 1, 1, '2025-11-11 16:15:22.527', 271, 0);
INSERT INTO "Const_Asset_CIDMS_SubComponent_Type" ("AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", "AssetCIDMSComponentTypeID", "Infrastructure", "Nature", "Enabled", "DateCaptured", "CapturerID", "Default")
VALUES (1207, 'Outdoor Furniture', 1222, 1, 1, 1, '2025-11-11 16:52:33.840', 271, 0);
SELECT setval(pg_get_serial_sequence('"Const_Asset_CIDMS_SubComponent_Type"', 'AssetCIDMSSubComponentTypeID'), (SELECT COALESCE(MAX("AssetCIDMSSubComponentTypeID"),1) FROM "Const_Asset_CIDMS_SubComponent_Type"));

-- Re-enable FK triggers
ALTER TABLE "Const_Asset_CIDMS_Component_Type" ENABLE TRIGGER ALL;
ALTER TABLE "Const_Asset_CIDMS_SubComponent_Type" ENABLE TRIGGER ALL;

-- Workflow Definitions
INSERT INTO "workflow_definitions" ("name", "entity_type", "steps", "is_active")
SELECT 'Impairment Approval', 'impairment', '[{"step": 1, "name": "Manager Approval", "role": "manager"}, {"step": 2, "name": "CFO Approval", "role": "cfo"}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM "workflow_definitions" WHERE "entity_type" = 'impairment');
INSERT INTO "workflow_definitions" ("name", "entity_type", "steps", "is_active")
SELECT 'Disposal Approval', 'disposal', '[{"step": 1, "name": "Manager Approval", "role": "manager"}, {"step": 2, "name": "CFO Approval", "role": "cfo"}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM "workflow_definitions" WHERE "entity_type" = 'disposal');
INSERT INTO "workflow_definitions" ("name", "entity_type", "steps", "is_active")
SELECT 'Depreciation Approval', 'depreciation', '[{"step": 1, "name": "Manager Approval", "role": "manager"}, {"step": 2, "name": "CFO Approval", "role": "cfo"}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM "workflow_definitions" WHERE "entity_type" = 'depreciation');
INSERT INTO "workflow_definitions" ("name", "entity_type", "steps", "is_active")
SELECT 'Transfer Approval', 'transfer', '[{"step": 1, "name": "Manager Approval", "role": "manager"}, {"step": 2, "name": "CFO Approval", "role": "cfo"}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM "workflow_definitions" WHERE "entity_type" = 'transfer');
INSERT INTO "workflow_definitions" ("name", "entity_type", "steps", "is_active")
SELECT 'Revaluation Approval', 'revaluation', '[{"step": 1, "name": "Manager Approval", "role": "manager"}, {"step": 2, "name": "CFO Approval", "role": "cfo"}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM "workflow_definitions" WHERE "entity_type" = 'revaluation');
INSERT INTO "workflow_definitions" ("name", "entity_type", "steps", "is_active")
SELECT 'Impairment Reversal Approval', 'impairment_reversal', '[{"step": 1, "name": "Manager Approval", "role": "manager"}, {"step": 2, "name": "CFO Approval", "role": "cfo"}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM "workflow_definitions" WHERE "entity_type" = 'impairment_reversal');
INSERT INTO "workflow_definitions" ("name", "entity_type", "steps", "is_active")
SELECT 'Refurbishment Approval', 'refurbishment', '[{"step": 1, "name": "Manager Approval", "role": "manager"}, {"step": 2, "name": "CFO Approval", "role": "cfo"}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM "workflow_definitions" WHERE "entity_type" = 'refurbishment');

-- ===== Const_FinYearWithIndex_sys seed data =====
INSERT INTO "Const_FinYearWithIndex_sys" ("ID", "ActiveFinYear", "CurrentIndex", "FinYear") VALUES
(1,'2018/2019',-7,'2011/2012'),
(2,'2018/2019',-6,'2012/2013'),
(3,'2018/2019',-5,'2013/2014'),
(4,'2018/2019',-4,'2014/2015'),
(5,'2018/2019',-3,'2015/2016'),
(6,'2018/2019',-2,'2016/2017'),
(7,'2018/2019',-1,'2017/2018'),
(8,'2018/2019',0,'2018/2019'),
(9,'2018/2019',1,'2019/2020'),
(10,'2019/2020',-7,'2012/2013'),
(11,'2019/2020',-6,'2013/2014'),
(12,'2019/2020',-5,'2014/2015'),
(13,'2019/2020',-4,'2015/2016'),
(14,'2019/2020',-3,'2016/2017'),
(15,'2019/2020',-2,'2017/2018'),
(16,'2019/2020',-1,'2018/2019'),
(17,'2019/2020',0,'2019/2020'),
(18,'2019/2020',1,'2020/2021'),
(19,'2020/2021',-7,'2013/2014'),
(20,'2020/2021',-6,'2014/2015'),
(21,'2020/2021',-5,'2015/2016'),
(22,'2020/2021',-4,'2016/2017'),
(23,'2020/2021',-3,'2017/2018'),
(24,'2020/2021',-2,'2018/2019'),
(25,'2020/2021',-1,'2019/2020'),
(26,'2020/2021',0,'2020/2021'),
(27,'2020/2021',1,'2021/2022'),
(28,'2021/2022',-7,'2014/2015'),
(29,'2021/2022',-6,'2015/2016'),
(30,'2021/2022',-5,'2016/2017'),
(31,'2021/2022',-4,'2017/2018'),
(32,'2021/2022',-3,'2018/2019'),
(33,'2021/2022',-2,'2019/2020'),
(34,'2021/2022',-1,'2020/2021'),
(35,'2021/2022',0,'2021/2022'),
(36,'2021/2022',1,'2022/2023'),
(37,'2022/2023',-7,'2015/2016'),
(38,'2022/2023',-6,'2016/2017'),
(39,'2022/2023',-5,'2017/2018'),
(40,'2022/2023',-4,'2018/2019'),
(41,'2022/2023',-3,'2019/2020'),
(42,'2022/2023',-2,'2020/2021'),
(43,'2022/2023',-1,'2021/2022'),
(44,'2022/2023',0,'2022/2023'),
(45,'2022/2023',1,'2023/2024'),
(46,'2023/2024',-7,'2016/2017'),
(47,'2023/2024',-6,'2017/2018'),
(48,'2023/2024',-5,'2018/2019'),
(49,'2023/2024',-4,'2019/2020'),
(50,'2023/2024',-3,'2020/2021'),
(51,'2023/2024',-2,'2021/2022'),
(52,'2023/2024',-1,'2022/2023'),
(53,'2023/2024',0,'2023/2024'),
(54,'2023/2024',1,'2024/2025'),
(55,'2024/2025',-7,'2017/2018'),
(56,'2024/2025',-6,'2018/2019'),
(57,'2024/2025',-5,'2019/2020'),
(58,'2024/2025',-4,'2020/2021'),
(59,'2024/2025',-3,'2021/2022'),
(60,'2024/2025',-2,'2022/2023'),
(61,'2024/2025',-1,'2023/2024'),
(62,'2024/2025',0,'2024/2025'),
(63,'2024/2025',1,'2025/2026'),
(64,'2025/2026',-7,'2018/2019'),
(65,'2025/2026',-6,'2019/2020'),
(66,'2025/2026',-5,'2020/2021'),
(67,'2025/2026',-4,'2021/2022'),
(68,'2025/2026',-3,'2022/2023'),
(69,'2025/2026',-2,'2023/2024'),
(70,'2025/2026',-1,'2024/2025'),
(71,'2025/2026',0,'2025/2026'),
(72,'2025/2026',1,'2026/2027')
ON CONFLICT ("ID") DO NOTHING;
