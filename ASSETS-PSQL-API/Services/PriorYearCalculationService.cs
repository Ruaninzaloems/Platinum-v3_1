using AssetManagement.Models;

namespace AssetManagement.Services;

public class PriorYearCalculationService
{
    private static (DateTime fyStart, DateTime fyEnd) GetFyBounds(int fyStartYear)
    {
        return (new DateTime(fyStartYear, 7, 1), new DateTime(fyStartYear + 1, 6, 30));
    }

    private static int GetCurrentFyStartYear()
    {
        var now = DateTime.Today;
        return now.Month >= 7 ? now.Year : now.Year - 1;
    }

    private static string GetCurrentFinYear()
    {
        var y = GetCurrentFyStartYear();
        return $"{y}/{y + 1}";
    }

    private static (int priorDays, int compDays, int currentDays) SplitDays(
        DateTime fromDate, DateTime effectiveDate)
    {
        // Use the earlier of effectiveDate and today as the calculation ceiling
        DateTime ceiling = effectiveDate < DateTime.Today ? effectiveDate : DateTime.Today;

        int currentFyStart = GetCurrentFyStartYear();
        DateTime compFyBegin = new DateTime(currentFyStart - 1, 7, 1);
        DateTime currentFyBegin = new DateTime(currentFyStart, 7, 1);

        // Prior periods: days from fromDate up to (but not past) the comparative FY start
        // Only counted when the asset pre-dates the comparative FY
        int priorDays = 0;
        if (fromDate < compFyBegin)
        {
            DateTime priorEnd = ceiling < compFyBegin ? ceiling : compFyBegin;
            priorDays = Math.Max(0, (int)(priorEnd - fromDate).TotalDays);
        }

        // Comparative period: from max(fromDate, compFyBegin) to min(ceiling, currentFyBegin)
        DateTime compStart = fromDate > compFyBegin ? fromDate : compFyBegin;
        DateTime compEnd = ceiling < currentFyBegin ? ceiling : currentFyBegin;
        int compDays = Math.Max(0, (int)(compEnd - compStart).TotalDays);

        // Current period: from max(fromDate, currentFyBegin) to ceiling
        int currentDays = 0;
        if (ceiling > currentFyBegin)
        {
            DateTime currStart = fromDate > currentFyBegin ? fromDate : currentFyBegin;
            currentDays = Math.Max(0, (int)(ceiling - currStart).TotalDays);
        }

        return (priorDays, compDays, currentDays);
    }

    public PriorYearCalculationResult Calculate(
        PriorYearCalculateRequest req,
        AssetDetailsForPriorYear asset)
    {
        return req.AdjustmentTypeCode switch
        {
            "COST" => CalculateCost(req, asset),
            "VALUATION" => CalculateValuation(req, asset),
            "DATE" => CalculateDate(req, asset),
            "RESIDUAL" => CalculateResidual(req, asset),
            "IMP_COST" => CalculateImpairmentCost(req, asset),
            "IMP_REVAL" => CalculateImpairmentReval(req, asset),
            "IMPREV_COST" => CalculateImprevCost(req, asset),
            "IMPREV_REVAL" => CalculateImprevReval(req, asset),
            "DISP_COST" => CalculateDisposalCost(req, asset),
            "DISP_REVAL" => CalculateDisposalReval(req, asset),
            "DEEMED_COST" => CalculateDeemedCost(req, asset),
            _ => new PriorYearCalculationResult()
        };
    }

    private PriorYearCalculationResult CalculateCost(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        decimal oldCost = asset.PurchaseAmount;
        decimal newCost = req.NewCostAmount ?? 0m;
        decimal deltaCost = newCost - oldCost;
        decimal residual = asset.ResidualValue;
        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        DateTime fromDate = asset.InserviceDate ?? asset.AcquisitionDate ?? DateTime.Today.AddYears(-1);
        DateTime effectiveDate = req.EffectiveDate ?? DateTime.Today;

        var (priorDays, compDays, currentDays) = SplitDays(fromDate, effectiveDate);
        decimal totalDays = eul > 0 ? eul * 365m : 1m;
        decimal dailyDepDelta = totalDays > 0 ? deltaCost / totalDays : 0m;

        result.PriorPeriods_CostDelta = deltaCost;
        result.PriorPeriods_AccDepDelta = Math.Round(dailyDepDelta * priorDays, 2);

        result.ComparativePeriod_DepChargeDelta = Math.Round(dailyDepDelta * compDays, 2);
        result.ComparativePeriod_AccDepDelta = Math.Round(dailyDepDelta * (priorDays + compDays), 2);

        result.CurrentPeriod_DepChargeDelta = Math.Round(dailyDepDelta * currentDays, 2);
        result.CurrentPeriod_AccDepDelta = Math.Round(dailyDepDelta * (priorDays + compDays + currentDays), 2);

        result.HasResidualValueWarning = residual > 1m;
        result.HasImpairmentWarning = asset.AccumulatedImpairmentClosingBalance > 0m;

        result.JournalLines = BuildCostJournalLines(deltaCost, result);
        return result;
    }

    private PriorYearCalculationResult CalculateValuation(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        decimal oldCost = asset.CurrentReplacementCostCRC > 0 ? asset.CurrentReplacementCostCRC : asset.PurchaseAmount;
        decimal oldAccDep = Math.Abs(asset.AccumulatedDepreciationClosingBalance);
        decimal oldRR = asset.RevaluationReserveClosingBalance;

        decimal newCarryingValue = req.NewValuationAmount ?? 0m;
        decimal newRUL = req.NewRUL ?? asset.RemainingUsefulLife;
        if (newRUL <= 0) newRUL = 1m;
        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : (asset.RemainingUsefulLife + (DateTime.Today.Year - (asset.InserviceDate ?? DateTime.Today).Year));
        if (eul <= 0) eul = newRUL;

        decimal newCost = eul > 0 ? Math.Round(newCarryingValue / newRUL * eul, 2) : newCarryingValue;
        decimal newAccDep = newCost - newCarryingValue;

        decimal deltaCost = newCost - oldCost;
        decimal deltaAccDep = newAccDep - oldAccDep;

        // RR delta = NewRR - OldRR (restatement method per GRAP 17)
        // NewRR = OldRR + change in carrying value (new CV - old CV)
        decimal oldCarryingValue = oldCost - oldAccDep;
        decimal deltaRR = newCarryingValue - oldCarryingValue;

        result.PriorPeriods_CostDelta = deltaCost;
        result.PriorPeriods_AccDepDelta = deltaAccDep;
        result.PriorPeriods_RRDelta = deltaRR;

        decimal oldAnnualDep = eul > 0 ? (oldCost - asset.ResidualValue) / eul : 0m;
        decimal newAnnualDep = newRUL > 0 ? (newCost - asset.ResidualValue) / newRUL : 0m;
        decimal depChargeDelta = newAnnualDep - oldAnnualDep;

        result.ComparativePeriod_DepChargeDelta = Math.Round(depChargeDelta, 2);
        result.CurrentPeriod_DepChargeDelta = Math.Round(depChargeDelta, 2);

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = asset.AccumulatedImpairmentClosingBalance > 0m;

        result.JournalLines = BuildValuationJournalLines(deltaCost, deltaAccDep, deltaRR);
        return result;
    }

    private PriorYearCalculationResult CalculateDate(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        DateTime oldDate = asset.InserviceDate ?? asset.AcquisitionDate ?? DateTime.Today;
        DateTime newDate = req.NewAcquisitionDate ?? oldDate;
        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        decimal annualDep = eul > 0 ? (asset.PurchaseAmount - asset.ResidualValue) / eul : 0m;

        int daysDiff = (int)(newDate - oldDate).TotalDays;
        decimal dailyDep = eul > 0 ? annualDep / 365m : 0m;
        decimal totalDepDelta = Math.Round(dailyDep * Math.Abs(daysDiff), 2);
        if (newDate > oldDate) totalDepDelta = -totalDepDelta;

        var (priorDays, compDays, currentDays) = SplitDays(oldDate < newDate ? oldDate : newDate, req.EffectiveDate ?? DateTime.Today);
        decimal totalDaysRange = Math.Max(1, priorDays + compDays + currentDays);

        result.PriorPeriods_AccDepDelta = Math.Round(totalDepDelta * priorDays / totalDaysRange, 2);
        result.ComparativePeriod_DepChargeDelta = Math.Round(totalDepDelta * compDays / totalDaysRange, 2);
        result.ComparativePeriod_AccDepDelta = Math.Round(totalDepDelta * (priorDays + compDays) / totalDaysRange, 2);
        result.CurrentPeriod_DepChargeDelta = Math.Round(totalDepDelta * currentDays / totalDaysRange, 2);
        result.CurrentPeriod_AccDepDelta = totalDepDelta;

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = asset.AccumulatedImpairmentClosingBalance > 0m;

        result.JournalLines = BuildDepJournalLines(totalDepDelta, "Acquisition Date Correction");
        return result;
    }

    private PriorYearCalculationResult CalculateResidual(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        decimal oldResidual = asset.ResidualValue;
        decimal newResidual = req.NewResidualValue ?? 0m;
        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        if (eul <= 0) eul = asset.RemainingUsefulLife > 0 ? asset.RemainingUsefulLife : 1m;

        // Effective date is when the new residual value takes effect (prospective from this date)
        DateTime effectiveDate = req.ResidualValueEffectiveDate ?? req.EffectiveDate ?? DateTime.Today;

        decimal oldAnnualDep = eul > 0 ? (asset.PurchaseAmount - oldResidual) / eul : 0m;
        decimal newAnnualDep = eul > 0 ? (asset.PurchaseAmount - newResidual) / eul : 0m;
        decimal deltaAnnualDep = newAnnualDep - oldAnnualDep;

        // Period split starts from effectiveDate (the delta only applies AFTER the effective date)
        var (priorDays, compDays, currentDays) = SplitDays(effectiveDate, DateTime.Today);
        decimal dailyDepDelta = deltaAnnualDep / 365m;

        result.PriorPeriods_AccDepDelta = Math.Round(dailyDepDelta * priorDays, 2);
        result.ComparativePeriod_DepChargeDelta = Math.Round(dailyDepDelta * compDays, 2);
        result.ComparativePeriod_AccDepDelta = Math.Round(dailyDepDelta * (priorDays + compDays), 2);
        result.CurrentPeriod_DepChargeDelta = Math.Round(dailyDepDelta * currentDays, 2);
        result.CurrentPeriod_AccDepDelta = Math.Round(dailyDepDelta * (priorDays + compDays + currentDays), 2);

        result.HasResidualValueWarning = newResidual > 1m;
        result.HasImpairmentWarning = asset.AccumulatedImpairmentClosingBalance > 0m;

        result.JournalLines = BuildDepJournalLines(result.CurrentPeriod_AccDepDelta, "Residual Value Adjustment");
        return result;
    }

    private PriorYearCalculationResult CalculateImpairmentCost(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        decimal oldImp = Math.Abs(asset.AccumulatedImpairmentClosingBalance);
        decimal newImp = req.NewImpairmentAmount ?? 0m;
        decimal deltaImp = newImp - oldImp;
        DateTime effectiveDate = req.ImpairmentEffectiveDate ?? req.EffectiveDate ?? DateTime.Today;

        // Impairment loss recognised at effectiveDate, carried in prior periods
        result.PriorPeriods_AccImpDelta = deltaImp;

        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        if (eul <= 0) eul = 1m;
        decimal oldCA = asset.CarryingAmountClosingBalance;
        decimal newCA = Math.Max(0, oldCA - deltaImp);
        // Future depreciation is lower on the impaired asset — split the dep charge delta
        // from the effective date forward (not from asset inception)
        decimal oldAnnualDep = eul > 0 ? oldCA / eul : 0m;
        decimal newAnnualDep = eul > 0 ? newCA / eul : 0m;
        decimal deltaAnnualDep = newAnnualDep - oldAnnualDep;
        var (_, compDays, currentDays) = SplitDays(effectiveDate, DateTime.Today);
        result.ComparativePeriod_DepChargeDelta = Math.Round(deltaAnnualDep / 365m * compDays, 2);
        result.CurrentPeriod_DepChargeDelta = Math.Round(deltaAnnualDep / 365m * currentDays, 2);

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = true;

        result.JournalLines = BuildImpJournalLines(deltaImp, 0m, false);
        return result;
    }

    private PriorYearCalculationResult CalculateImpairmentReval(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        decimal oldImp = Math.Abs(asset.AccumulatedImpairmentClosingBalance);
        decimal newImp = req.NewImpairmentAmount ?? 0m;
        decimal deltaImp = newImp - oldImp;
        decimal rr = asset.RevaluationReserveClosingBalance;
        decimal fromRR = Math.Min(deltaImp, rr);
        decimal fromIS = Math.Max(0, deltaImp - fromRR);
        DateTime effectiveDate = req.ImpairmentEffectiveDate ?? req.EffectiveDate ?? DateTime.Today;

        result.PriorPeriods_AccImpDelta = deltaImp;
        result.PriorPeriods_RRDelta = -fromRR;

        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        if (eul <= 0) eul = 1m;
        decimal oldCA = asset.CarryingAmountClosingBalance;
        decimal newCA = Math.Max(0, oldCA - deltaImp);
        decimal deltaAnnualDep = eul > 0 ? (newCA - oldCA) / eul : 0m;
        // Period-split dep charge delta from the impairment effective date forward
        var (_, compDays, currentDays) = SplitDays(effectiveDate, DateTime.Today);
        result.ComparativePeriod_DepChargeDelta = Math.Round(deltaAnnualDep / 365m * compDays, 2);
        result.CurrentPeriod_DepChargeDelta = Math.Round(deltaAnnualDep / 365m * currentDays, 2);

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = true;

        result.JournalLines = BuildImpJournalLines(fromIS, fromRR, false);
        return result;
    }

    private PriorYearCalculationResult CalculateImprevCost(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        decimal oldImp = Math.Abs(asset.AccumulatedImpairmentClosingBalance);
        decimal oldCA = asset.CarryingAmountClosingBalance;
        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        if (eul <= 0) eul = 1m;

        // GRAP cap: CA without prior impairment, measured at the adjustment effective date
        DateTime effectiveDate = req.ImpairmentEffectiveDate ?? req.EffectiveDate ?? DateTime.Today;
        DateTime fromDate = asset.InserviceDate ?? asset.AcquisitionDate ?? effectiveDate.AddYears(-1);
        int daysSinceAcq = Math.Max(1, (int)(effectiveDate - fromDate).TotalDays);
        decimal totalEulDays = eul * 365m;
        decimal dailyDep = totalEulDays > 0 ? asset.PurchaseAmount / totalEulDays : 0m;
        decimal accDepNoImp = Math.Round(dailyDep * daysSinceAcq, 2);
        decimal caAsIfNoImp = Math.Max(0, asset.PurchaseAmount - accDepNoImp - asset.ResidualValue);
        decimal grapCap = caAsIfNoImp - oldCA;

        decimal requestedReversal = req.NewImpairmentAmount ?? 0m;
        decimal actualReversal = Math.Min(requestedReversal, Math.Min(grapCap, oldImp));

        result.PriorPeriods_AccImpDelta = -actualReversal;
        decimal depChargeDelta = eul > 0 ? actualReversal / eul : 0m;

        result.ComparativePeriod_DepChargeDelta = -Math.Round(depChargeDelta, 2);
        result.CurrentPeriod_DepChargeDelta = -Math.Round(depChargeDelta, 2);

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = oldImp > 0m;

        result.JournalLines = BuildImpJournalLines(actualReversal, 0m, true);
        return result;
    }

    private PriorYearCalculationResult CalculateImprevReval(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        decimal oldImp = Math.Abs(asset.AccumulatedImpairmentClosingBalance);
        decimal oldCA = asset.CarryingAmountClosingBalance;
        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        if (eul <= 0) eul = 1m;
        decimal rr = asset.RevaluationReserveClosingBalance;

        // GRAP cap: CA without prior impairment, measured at adjustment effective date
        DateTime effectiveDate = req.ImpairmentEffectiveDate ?? req.EffectiveDate ?? DateTime.Today;
        DateTime fromDate = asset.InserviceDate ?? asset.AcquisitionDate ?? effectiveDate.AddYears(-1);
        int daysSinceAcq = Math.Max(1, (int)(effectiveDate - fromDate).TotalDays);
        decimal totalEulDays = eul * 365m;
        decimal dailyDep = totalEulDays > 0 ? asset.PurchaseAmount / totalEulDays : 0m;
        decimal accDepNoImp = Math.Round(dailyDep * daysSinceAcq, 2);
        decimal caAsIfNoImp = Math.Max(0, asset.PurchaseAmount - accDepNoImp - asset.ResidualValue);
        decimal grapCap = caAsIfNoImp - oldCA;

        decimal requestedReversal = req.NewImpairmentAmount ?? 0m;
        decimal actualReversal = Math.Min(requestedReversal, Math.Min(grapCap, oldImp));
        // GRAP 21: reversal goes to RR only up to the amount originally charged against RR
        // (proxied by current RR balance — the RR component of prior impairment)
        decimal toRR = Math.Min(actualReversal, rr);

        result.PriorPeriods_AccImpDelta = -actualReversal;
        result.PriorPeriods_RRDelta = toRR;

        decimal depChargeDelta = eul > 0 ? actualReversal / eul : 0m;
        result.ComparativePeriod_DepChargeDelta = -Math.Round(depChargeDelta, 2);
        result.CurrentPeriod_DepChargeDelta = -Math.Round(depChargeDelta, 2);

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = oldImp > 0m;

        result.JournalLines = BuildImpJournalLines(actualReversal - toRR, toRR, true);
        return result;
    }

    // Depreciation to disposal date: calculates any outstanding (catch-up) depreciation
    // that has accrued since the last period close up to the disposal date.
    // GRAP 17 / MFMA IFRS basis: dep must be charged up to disposal date before derecognition.
    private static (decimal catchUpDep, int priorDays, int compDays, int currentDays) CalcDepToDisposalDate(
        AssetDetailsForPriorYear asset, DateTime disposalDate)
    {
        DateTime fromDate = asset.InserviceDate ?? asset.AcquisitionDate ?? disposalDate;
        decimal eul = asset.UsefullLife > 0 ? asset.UsefullLife : asset.RemainingUsefulLife;
        decimal residual = asset.ResidualValue;
        decimal cost = asset.PurchaseAmount;
        decimal existingAccDep = Math.Abs(asset.AccumulatedDepreciationClosingBalance);

        decimal totalEulDays = eul > 0 ? eul * 365m : 1m;
        decimal dailyDep = (cost - residual) / totalEulDays;

        // Total depreciation that should be charged from in-service date to disposal date
        int daysToDisposal = Math.Max(0, (int)(disposalDate - fromDate).TotalDays);
        decimal depToDisposalDate = Math.Round(dailyDep * daysToDisposal, 2);
        // Cap at full depreciable amount (cannot over-depreciate)
        depToDisposalDate = Math.Min(depToDisposalDate, cost - residual);

        // Catch-up = additional dep not yet recorded
        decimal catchUpDep = Math.Max(0m, depToDisposalDate - existingAccDep);

        // Split the catch-up across periods using the disposal date as effective date
        var (priorDays, compDays, currentDays) = SplitDays(fromDate, disposalDate);
        return (catchUpDep, priorDays, compDays, currentDays);
    }

    private PriorYearCalculationResult CalculateDisposalCost(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        DateTime disposalDate = req.DisposalDate ?? req.EffectiveDate ?? DateTime.Today;
        decimal proceeds = req.DisposalProceeds ?? 0m;

        decimal cost = asset.PurchaseAmount;
        decimal accDep = Math.Abs(asset.AccumulatedDepreciationClosingBalance);
        decimal accImp = Math.Abs(asset.AccumulatedImpairmentClosingBalance);

        // Calculate depreciation catch-up to disposal date (GRAP 17: charge dep to date of disposal)
        var (catchUpDep, priorDays, compDays, currentDays) = CalcDepToDisposalDate(asset, disposalDate);
        decimal totalDays = Math.Max(1, priorDays + compDays + currentDays);
        decimal catchUpPrior = Math.Round(catchUpDep * priorDays / totalDays, 2);
        decimal catchUpComp = Math.Round(catchUpDep * compDays / totalDays, 2);
        decimal catchUpCurrent = catchUpDep - catchUpPrior - catchUpComp;

        decimal accDepAtDisposal = accDep + catchUpDep;
        decimal caAtDisposal = Math.Max(0m, cost - accDepAtDisposal - accImp);
        decimal gainLoss = proceeds - caAtDisposal;

        // Derecognition deltas (after charging catch-up dep, then zero everything)
        result.PriorPeriods_AccDepDelta = Math.Round(-accDep - catchUpPrior, 2);
        result.ComparativePeriod_DepChargeDelta = catchUpComp;
        result.ComparativePeriod_AccDepDelta = Math.Round(-(accDep + catchUpPrior + catchUpComp), 2);
        result.CurrentPeriod_DepChargeDelta = catchUpCurrent;
        result.CurrentPeriod_AccDepDelta = -accDepAtDisposal;
        result.PriorPeriods_CostDelta = -cost;
        result.PriorPeriods_AccImpDelta = -accImp;

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = accImp > 0m;

        result.JournalLines = BuildDisposalJournalLines(cost, accDepAtDisposal, accImp, 0m, proceeds, gainLoss, catchUpDep);
        return result;
    }

    private PriorYearCalculationResult CalculateDisposalReval(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        var result = new PriorYearCalculationResult();
        DateTime disposalDate = req.DisposalDate ?? req.EffectiveDate ?? DateTime.Today;
        decimal proceeds = req.DisposalProceeds ?? 0m;

        decimal cost = asset.CurrentReplacementCostCRC > 0 ? asset.CurrentReplacementCostCRC : asset.PurchaseAmount;
        decimal accDep = Math.Abs(asset.AccumulatedDepreciationClosingBalance);
        decimal accImp = Math.Abs(asset.AccumulatedImpairmentClosingBalance);
        decimal rr = asset.RevaluationReserveClosingBalance;

        // Recompute catch-up dep against CRC cost for revalued assets
        var assetForCalc = new AssetDetailsForPriorYear
        {
            PurchaseAmount = cost,
            AccumulatedDepreciationClosingBalance = asset.AccumulatedDepreciationClosingBalance,
            AccumulatedImpairmentClosingBalance = asset.AccumulatedImpairmentClosingBalance,
            ResidualValue = asset.ResidualValue,
            UsefullLife = asset.UsefullLife,
            RemainingUsefulLife = asset.RemainingUsefulLife,
            InserviceDate = asset.InserviceDate,
            AcquisitionDate = asset.AcquisitionDate,
            CarryingAmountClosingBalance = asset.CarryingAmountClosingBalance,
            RevaluationReserveClosingBalance = asset.RevaluationReserveClosingBalance,
            CurrentReplacementCostCRC = asset.CurrentReplacementCostCRC
        };
        var (catchUpDep, priorDays, compDays, currentDays) = CalcDepToDisposalDate(assetForCalc, disposalDate);
        decimal totalDays = Math.Max(1, priorDays + compDays + currentDays);
        decimal catchUpPrior = Math.Round(catchUpDep * priorDays / totalDays, 2);
        decimal catchUpComp = Math.Round(catchUpDep * compDays / totalDays, 2);
        decimal catchUpCurrent = catchUpDep - catchUpPrior - catchUpComp;

        decimal accDepAtDisposal = accDep + catchUpDep;
        decimal caAtDisposal = Math.Max(0m, cost - accDepAtDisposal - accImp);
        decimal gainLoss = proceeds - caAtDisposal;

        result.PriorPeriods_CostDelta = -cost;
        result.PriorPeriods_AccDepDelta = Math.Round(-accDep - catchUpPrior, 2);
        result.PriorPeriods_AccImpDelta = -accImp;
        result.PriorPeriods_RRDelta = -rr;
        result.ComparativePeriod_DepChargeDelta = catchUpComp;
        result.ComparativePeriod_AccDepDelta = Math.Round(-(accDep + catchUpPrior + catchUpComp), 2);
        result.CurrentPeriod_DepChargeDelta = catchUpCurrent;
        result.CurrentPeriod_AccDepDelta = -accDepAtDisposal;

        result.HasResidualValueWarning = asset.ResidualValue > 1m;
        result.HasImpairmentWarning = accImp > 0m;

        result.JournalLines = BuildDisposalJournalLines(cost, accDepAtDisposal, accImp, rr, proceeds, gainLoss, catchUpDep);
        return result;
    }

    private PriorYearCalculationResult CalculateDeemedCost(PriorYearCalculateRequest req, AssetDetailsForPriorYear asset)
    {
        return new PriorYearCalculationResult
        {
            JournalLines = new List<PriorYearJournalLine>
            {
                new() { Period = "Opening Balance", Description = "Deemed Cost — new asset recognition", Debit = req.NewCostAmount ?? 0m, Account = "Asset Account" }
            }
        };
    }

    private static List<PriorYearJournalLine> BuildCostJournalLines(decimal deltaCost, PriorYearCalculationResult r)
    {
        var lines = new List<PriorYearJournalLine>();
        if (deltaCost != 0)
        {
            lines.Add(new() { Period = "Prior Periods", Description = "Asset at Cost — Correction", Debit = deltaCost > 0 ? deltaCost : null, Credit = deltaCost < 0 ? Math.Abs(deltaCost) : null, Account = "Asset at Cost" });
            lines.Add(new() { Period = "Prior Periods", Description = "Prior Year Surplus/Deficit — Cost Correction", Debit = deltaCost < 0 ? Math.Abs(deltaCost) : null, Credit = deltaCost > 0 ? deltaCost : null, Account = "Accumulated Surplus/Deficit" });
        }
        if (r.PriorPeriods_AccDepDelta != 0)
            lines.Add(new() { Period = "Prior Periods", Description = "Accumulated Depreciation — Correction", Debit = r.PriorPeriods_AccDepDelta < 0 ? Math.Abs(r.PriorPeriods_AccDepDelta) : null, Credit = r.PriorPeriods_AccDepDelta > 0 ? r.PriorPeriods_AccDepDelta : null, Account = "Accumulated Depreciation" });
        if (r.ComparativePeriod_DepChargeDelta != 0)
            lines.Add(new() { Period = "Comparative Period", Description = "Depreciation Charge — Correction", Debit = r.ComparativePeriod_DepChargeDelta > 0 ? r.ComparativePeriod_DepChargeDelta : null, Credit = r.ComparativePeriod_DepChargeDelta < 0 ? Math.Abs(r.ComparativePeriod_DepChargeDelta) : null, Account = "Depreciation" });
        if (r.CurrentPeriod_DepChargeDelta != 0)
            lines.Add(new() { Period = "Current Period", Description = "Depreciation Charge — Correction", Debit = r.CurrentPeriod_DepChargeDelta > 0 ? r.CurrentPeriod_DepChargeDelta : null, Credit = r.CurrentPeriod_DepChargeDelta < 0 ? Math.Abs(r.CurrentPeriod_DepChargeDelta) : null, Account = "Depreciation" });
        return lines;
    }

    private static List<PriorYearJournalLine> BuildValuationJournalLines(decimal deltaCost, decimal deltaAccDep, decimal deltaRR)
    {
        var lines = new List<PriorYearJournalLine>();
        if (deltaCost != 0)
            lines.Add(new() { Period = "Prior Periods", Description = "Asset at Revalued Amount", Debit = deltaCost > 0 ? deltaCost : null, Credit = deltaCost < 0 ? Math.Abs(deltaCost) : null, Account = "Asset at Cost/Revalued Amount" });
        if (deltaAccDep != 0)
            lines.Add(new() { Period = "Prior Periods", Description = "Accumulated Depreciation — Restatement", Debit = deltaAccDep < 0 ? Math.Abs(deltaAccDep) : null, Credit = deltaAccDep > 0 ? deltaAccDep : null, Account = "Accumulated Depreciation" });
        if (deltaRR != 0)
            lines.Add(new() { Period = "Prior Periods", Description = "Revaluation Reserve", Debit = deltaRR < 0 ? Math.Abs(deltaRR) : null, Credit = deltaRR > 0 ? deltaRR : null, Account = "Revaluation Reserve" });
        return lines;
    }

    private static List<PriorYearJournalLine> BuildDepJournalLines(decimal depDelta, string description)
    {
        return new List<PriorYearJournalLine>
        {
            new() { Period = "Adjustment", Description = description + " — Depreciation Correction", Debit = depDelta > 0 ? depDelta : null, Credit = depDelta < 0 ? Math.Abs(depDelta) : null, Account = "Accumulated Depreciation / Depreciation Expense" }
        };
    }

    private static List<PriorYearJournalLine> BuildImpJournalLines(decimal impFromIS, decimal impFromRR, bool isReversal)
    {
        var lines = new List<PriorYearJournalLine>();
        string dir = isReversal ? "Reversal" : "Loss";
        if (impFromIS != 0)
            lines.Add(new() { Period = "Adjustment", Description = $"Impairment {dir} — Income Statement", Debit = !isReversal ? impFromIS : null, Credit = isReversal ? impFromIS : null, Account = "Impairment Loss (IS)" });
        if (impFromRR != 0)
            lines.Add(new() { Period = "Adjustment", Description = $"Impairment {dir} — Revaluation Reserve", Debit = !isReversal ? impFromRR : null, Credit = isReversal ? impFromRR : null, Account = "Revaluation Reserve" });
        decimal total = impFromIS + impFromRR;
        if (total != 0)
            lines.Add(new() { Period = "Adjustment", Description = "Accumulated Impairment", Debit = isReversal ? total : null, Credit = !isReversal ? total : null, Account = "Accumulated Impairment" });
        return lines;
    }

    private static List<PriorYearJournalLine> BuildDisposalJournalLines(decimal cost, decimal accDep, decimal accImp, decimal rr, decimal proceeds, decimal gainLoss, decimal catchUpDep = 0m)
    {
        var lines = new List<PriorYearJournalLine>();
        if (catchUpDep > 0)
        {
            lines.Add(new() { Period = "Depreciation to Disposal Date", Description = "Depreciation Charge (catch-up to disposal date)", Debit = catchUpDep, Account = "Depreciation Expense" });
            lines.Add(new() { Period = "Depreciation to Disposal Date", Description = "Accumulated Depreciation (to disposal date)", Credit = catchUpDep, Account = "Accumulated Depreciation" });
        }
        if (proceeds > 0)
            lines.Add(new() { Period = "Disposal", Description = "Proceeds Received", Debit = proceeds, Account = "Bank / Receivable" });
        lines.Add(new() { Period = "Disposal", Description = "Remove Accumulated Depreciation", Debit = accDep, Account = "Accumulated Depreciation" });
        if (accImp > 0)
            lines.Add(new() { Period = "Disposal", Description = "Remove Accumulated Impairment", Debit = accImp, Account = "Accumulated Impairment" });
        lines.Add(new() { Period = "Disposal", Description = "Remove Asset Cost", Credit = cost, Account = "Asset at Cost/Revalued Amount" });
        if (rr != 0)
            lines.Add(new() { Period = "Disposal", Description = "Transfer Revaluation Reserve to Accumulated Surplus", Debit = rr, Account = "Revaluation Reserve" });
        if (gainLoss > 0)
            lines.Add(new() { Period = "Disposal", Description = "Gain on Disposal", Credit = gainLoss, Account = "Gain on Disposal of Assets" });
        else if (gainLoss < 0)
            lines.Add(new() { Period = "Disposal", Description = "Loss on Disposal", Debit = Math.Abs(gainLoss), Account = "Loss on Disposal of Assets" });
        return lines;
    }
}
