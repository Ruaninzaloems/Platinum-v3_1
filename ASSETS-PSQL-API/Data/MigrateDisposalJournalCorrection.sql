-- Migration: Correct imbalanced disposal GL journal for AssetDisposal_ID=1
--
-- Root cause: costPlusRevaluation was calculated as purchaseAmount + revaluationValue
-- instead of accDepreciation + accImpairment + carryingValue. For Asset 1 the
-- RevaluationValue column was 0, so the Cost credit leg was R180,210.21 while the
-- total debit legs (AccumDep + AccumImp + Proceeds + Loss) were R219,337.55 — a
-- R39,127.34 imbalance.
--
-- Business-key targeting (idempotent — safe to re-run):

-- 1. Correct the GL "Asset Disposal - Cost" credit leg.
--    Identified via the disposal document type prefix ('306/') combined with
--    the description pattern and the incorrect old credit value.
UPDATE "Asset_GeneralLedger"
SET "Credit" = 219337.55
WHERE "DocumentNumber" LIKE '306/%'
  AND "TransactionDetails" LIKE '%Asset Disposal - Cost%'
  AND "Credit" = 180210.21;

-- 2. Correct Asset_Register_Transactions DisposalTotalValue.
--    Uses business keys: asset, disposal transaction type, and old wrong value.
UPDATE "Asset_Register_Transactions"
SET "DisposalTotalValue" = 219337.55
WHERE "AssetRegisterItem_ID" = 1
  AND "TransactionTypeID" IN (
      SELECT "ReferenceData_ID" FROM "Const_ReferenceData_sys"
      WHERE "Description" = 'Disposal'
      LIMIT 1
  )
  AND "DisposalTotalValue" = 180210.21;

-- 3. Correct Asset_Register_Items CarryingAmountClosingBalance.
--    Only affects disposed assets (DateOfDisposal IS NOT NULL) with a negative balance.
UPDATE "Asset_Register_Items"
SET "CarryingAmountClosingBalance" = 0
WHERE "AssetRegisterItem_ID" = 1
  AND "DateOfDisposal" IS NOT NULL
  AND "CarryingAmountClosingBalance" < 0;
