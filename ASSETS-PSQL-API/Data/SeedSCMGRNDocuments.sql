INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 1, 'Appointment letter Mrs Mhaga - Copy.docx', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\141011443\Appointment letter Mrs Mhaga - Copy.docx', NULL, '2020-10-14 11:44:03.667', 148, 298
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 1);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 2, 'ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\236145934\ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', NULL, '2022-06-23 14:59:34.643', 247, 555
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 2);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 3, 'ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\23615249\ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', NULL, '2022-06-23 15:02:49.223', 247, 556
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 3);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 4, 'ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\23615912\ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', NULL, '2022-06-23 15:09:12.550', 247, 557
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 4);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 5, 'ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\236151049\ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', NULL, '2022-06-23 15:10:49.320', 247, 558
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 5);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 6, 'ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\236151131\ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', NULL, '2022-06-23 15:11:31.600', 247, 559
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 6);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 7, 'ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\236151314\ARENA PRO FORMA INVOICE (026) (00E) (1).pdf', NULL, '2022-06-23 15:13:14.497', 247, 560
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 7);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 8, 'ARENA PRO FORMA INVOICE (026) (02D).pdf', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\0\ARENA PRO FORMA INVOICE (026) (02D).pdf', NULL, '2022-10-31 15:34:39.130', 240, 743
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 8);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 9, 'GRN 18052023 LITHOTECH.jpg', '\\192.168.112.142\EMS_Files_EMS_Mnquma\\GRN\195163242\GRN 18052023 LITHOTECH.jpg', NULL, '2023-05-19 16:32:42.483', 259, 1028
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 9);
INSERT INTO "SCM_GRNDocuments" ("Document_ID", "DocumentName", "DocumentPath", "FileType", "DateCaptured", "CapturerID", "GRN_ID")
  SELECT 10, 'GRN.pdf', '\\192.168.250.73\EMS_Files_EMS_Mnquma\\GRN\3031166\GRN.pdf', NULL, '2026-03-30 11:06:06.880', 217, 3145
  WHERE NOT EXISTS (SELECT 1 FROM "SCM_GRNDocuments" WHERE "Document_ID" = 10);
SELECT setval(pg_get_serial_sequence('"SCM_GRNDocuments"', 'Document_ID'), GREATEST(10, (SELECT COALESCE(MAX("Document_ID"), 0) FROM "SCM_GRNDocuments")));
