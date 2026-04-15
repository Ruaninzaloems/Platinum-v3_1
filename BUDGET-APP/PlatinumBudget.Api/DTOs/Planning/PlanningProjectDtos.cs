namespace PlatinumBudget.Api.DTOs.Planning;

public class PlanAutoCreateActivationVotesByProjectRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanAutoCreateActivationVotesByYearRequest
{
    public string? FinYear { get; set; }
}

public class PlanAutoCreateProcurementByProjectRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanAutoCreateProcurementByProjectspbkpRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanAutoCreateProcurementForVirtualProjectRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanAutoCreateProcurementInitProjectRequest
{
    public string? FinYear { get; set; }
}

public class PlanDeleteProjectRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetActualAmountByPlanProjectItemIDRequest
{
    public string? FinancialYear { get; set; }
    public int? PlanProjectItemID { get; set; }
}

public class PlanGetAdjustmentProjectByDepartmentIdRequest
{
    public string? DepartmentId { get; set; }
    public string? FinYear { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAdjustmentProjectCostingRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaCostingID { get; set; }
    public string? UserFinYear { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetAdjustmentProjectDetailsForDashboardRequest
{
    public string? FYear { get; set; }
}

public class PlanGetAdjustmentProjectDivisionsRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? DivisionID { get; set; }
    public int? UserId { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAdjustmentProjectFunctionsRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? UserFinYear { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetAdjustmentProjectIDPRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ParentIDPItemID { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAdjustmentProjectItemFundsRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaFundID { get; set; }
    public string? FinYear { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAdjustmentProjectRegionsRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaRegionID { get; set; }
    public string? UserFinYear { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetAdjustmentProjectSCOAItemsRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaItemID { get; set; }
    public string? UserFinYear { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetAdjustmentProjectSearchRequest
{
    public int? IDPItemID { get; set; }
    public int? AdjustmentProjectID { get; set; }
    public string? FinYear { get; set; }
    public int? ScoaFunctionID { get; set; }
    public int? ScoaCostingID { get; set; }
    public int? ScoaAdjustmentProjectID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? DivisionID { get; set; }
    public int? SCOAItemID { get; set; }
    public int? SCOAFundID { get; set; }
    public int? StatusId { get; set; }
    public string? DepartmentId { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAdjustmentProjectWithDeptDivisionsRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? UserId { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAllAdjustmentProjectsWithScoaProjectRequest
{
    public string? FinYear { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetAllProjectsWithScoaProjectRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetFundWidgetDetailsForAdjustmentProjectItemsRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? SCOAFundID { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetFundWidgetDetailsForProjectItemsRequest
{
    public int? ProjectID { get; set; }
    public int? SCOAFundID { get; set; }
}

public class PlanGetNTStringSCOAProjectsRequest
{
    public int? NTStringSCOAProjectID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetPendingAdjustmentProjectsRequest
{
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
}

public class PlanGetProjectByDepartmentIdRequest
{
    public string? DepartmentId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectCashflowBalancesRequest
{
    public string? FinYear { get; set; }
    public int? IDPID { get; set; }
    public int? ResponsiblePersonID { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? FunderID { get; set; }
}

public class PlanGetProjectCessionRequest
{
    public int? PlanProjectServiceProviderID { get; set; }
}

public class PlanGetProjectCostingRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaCostingID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectDetailSearchRequest
{
    public string? ProjectName { get; set; }
    public int? StatusID { get; set; }
}

public class PlanGetProjectDetailsForDashboardRequest
{
    public string? FYear { get; set; }
}

public class PlanGetProjectDivisionsRequest
{
    public int? ProjectID { get; set; }
    public int? DivisionID { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectforAdjustmentProjectApprovalRequest
{
    public string? FinYear { get; set; }
    public int? UserId { get; set; }
    public string? UserFinYear { get; set; }
    public int? ProjecId { get; set; }
}

public class PlanGetProjectFunctionsRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaFunctionID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectFundAllocAmtByScoaFundIDYearRequest
{
    public int? ScoaFundID { get; set; }
    public string? FinYear { get; set; }
    public string? CurrFinYear { get; set; }
}

public class PlanGetProjectFundAllocAmtByScoaFundIDYearForAdjustmentRequest
{
    public int? ScoaFundID { get; set; }
    public string? FinYear { get; set; }
    public string? CurrFinYear { get; set; }
}

public class PlanGetProjectFundByProjectIDYearRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectFundsByAdjustmentProjectIDRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaFundID { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetProjectFundsByAdjustmentProjectIDFinYearRequest
{
    public int? AdjustmentProjectID { get; set; }
    public string? FinYear { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetProjectFundsByProjectIDRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaFundID { get; set; }
}

public class PlanGetProjectFundsByProjectIDFinYearRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectFundYearRequest
{
    public int? ProjectID { get; set; }
    public int? SCOAFundID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectIDPRequest
{
    public int? ProjectID { get; set; }
    public int? ParentIDPItemID { get; set; }
}

public class PlanGetProjectInitialisationbyFilterRequest
{
    public int? DepartmentID { get; set; }
    public int? ProjectType { get; set; }
    public int? FunderID { get; set; }
}

public class PlanGetProjectItemCostEstimateRequest
{
    public int? ProjectPlanID { get; set; }
    public decimal? ReturnProjectItemCostEstimate { get; set; }
}

public class PlanGetProjectItemFundsRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaFundID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectItemIDRequest
{
    public string? ProjectItemDescription { get; set; }
    public int? CapturerID { get; set; }
    public int? ReturnProjectItemID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectItemsByAdjustmentProjectIDRequest
{
    public int? AdjustmentProjectID { get; set; }
    public string? FinYear { get; set; }
    public int? AdjustmentProjectItemId { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetProjectItemsByFinYearsToUpdateRequest
{
    public int? ProjectID { get; set; }
    public int? ProjectItemID { get; set; }
    public string? FinYearToBeExcluded { get; set; }
}

public class PlanGetProjectItemsByProjectIDRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
    public int? ProjectItemId { get; set; }
}

public class PlanGetProjectItemsByProjectIDAndKpiIdRequest
{
    public string? FinYear { get; set; }
    public int? KpiId { get; set; }
}

public class PlanGetProjectItemsTotalAllocPerFundRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaFundID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectManagersRequest
{
    // No parameters
}

public class PlanGetProjectPaymentFrameworkRequest
{
    public string? ProjectName { get; set; }
}

public class PlanGetProjectRegionsRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaRegionID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectSCOAFundsRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaFundID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectSCOAFundsForDropdownRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaFundID { get; set; }
    public string? Type { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectSCOAItemsRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaItemID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetProjectSearchRequest
{
    public int? IDPItemID { get; set; }
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
    public int? ScoaFunctionID { get; set; }
    public int? ScoaCostingID { get; set; }
    public int? ScoaProjectID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? DivisionID { get; set; }
    public int? SCOAItemID { get; set; }
    public int? SCOAFundID { get; set; }
    public int? StatusId { get; set; }
    public string? DepartmentId { get; set; }
}

public class PlanGetProjectServiceProviderRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetProjectServiceProviderVariationRequest
{
    public int? PaymentFrameworkID { get; set; }
}

public class PlanGetProjectStakeholderByProjectIDRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetProjectsToInitialiseRequest
{
    public string? ProjectName { get; set; }
    public int? ProjectID { get; set; }
    public int? DepartmentID { get; set; }
    public int? ProjectType { get; set; }
    public int? FunderID { get; set; }
}

public class PlanGetProjectWithDeptDivisionsRequest
{
    public int? ProjectID { get; set; }
    public int? UserId { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetProjectWithLockedSCOAItemRequest
{
    public int? ProjectID { get; set; }
    public string? FinYear { get; set; }
    public int? ScoaFunctionID { get; set; }
    public int? ScoaRegionID { get; set; }
    public int? DivisionID { get; set; }
    public int? SCOAItemID { get; set; }
    public int? SCOAFundId { get; set; }
}

public class PlanGetProjectWorkOrderDetailsRequest
{
    public string? FinYear { get; set; }
    public long? ProjectStatus { get; set; }
    public string? SearchText { get; set; }
}

public class PlanGetRecentAdjustmentProjectByUserIdRequest
{
    public int? loggedInUserId { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetRecentProjectByUserIdRequest
{
    public int? loggedInUserId { get; set; }
}

public class PlanGetRejectedAdjustmentProjectsRequest
{
    public string? FinYear { get; set; }
}

public class PlanGetRemainingFundsByProjectIDRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetSCOAAdjustmentProjectRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ScoaAdjustmentProjectID { get; set; }
    public string? UserFinYear { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAProjectDescriptionRequest
{
    public int? SCOAID { get; set; }
}

public class PlanGetSCOAProjectExceptionDetailsRequest
{
    public string? CurrentFinyear { get; set; }
    public string? NewFinyear { get; set; }
    public string? ExceptionType { get; set; }
}

public class PlanGetSCOAProjectExceptionDetailsByIDRequest
{
    public int? ExceptionID { get; set; }
    public string? CurrentFinyear { get; set; }
}

public class PlanGetSCOAProjectsRequest
{
    public int? ProjectID { get; set; }
    public int? ScoaProjectID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOAProjectsFBSRequest
{
    public int? SCOAProjectFBSID { get; set; }
    public int? SCOAId { get; set; }
    public string? FinYear { get; set; }
}

public class PlanGetSCOASegmentCountsByAdjustmentProjectIdRequest
{
    public int? AdjustmentProjectID { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetSCOASegmentCountsByProjectIdRequest
{
    public int? ProjectID { get; set; }
}

public class PlanGetSupportingDocumentsForAdjustmentProjectItemsRequest
{
    public int? PlanAdjustmentProjectItemID { get; set; }
    public int? SupportingDocID { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetSupportingDocumentsForProjectItemsRequest
{
    public int? PlanProjectItemID { get; set; }
    public int? SupportingDocID { get; set; }
}

public class PlanGetTrackChangesForAdjustmentProjectItemsRequest
{
    public int? AdjustmentProjectId { get; set; }
    public string? UserFinYear { get; set; }
}

public class PlanGetTrackChangesForProjectItemsRequest
{
    public int? ProjectId { get; set; }
}

public class PlanInsertNewProjectItemRequest
{
    public string? ProjectItemDescription { get; set; }
    public int? CapturerID { get; set; }
    public string? FinYear { get; set; }
}

public class PlanInsertSCOAProjectFBSRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public string? AuditUser { get; set; }
    public bool? IsEnable { get; set; }
    public DateTime? CurrDate { get; set; }
}

public class PlanProjectCashFlowRequest
{
    public int? ProjectID { get; set; }
    public int? UserID { get; set; }
}

public class PlanProjectCashFlowDeleteRequest
{
    public int? ProjectCashFlow_ID { get; set; }
    public int? UserID { get; set; }
}

public class PlanProjectCashFlowDeleteAuditRequest
{
    public int? ProjectCashFlowID { get; set; }
    public int? UserID { get; set; }
}

public class PlanProjectEmploymentCreateRequest
{
    public int? ProjectID { get; set; }
    public int? UserID { get; set; }
}

public class PlanProjectEmploymentRequest
{
    public int? ProjectID { get; set; }
}

public class PlanProjectMilestonesRequest
{
    public int? ProjectID { get; set; }
    public int? UserID { get; set; }
}

public class PlanProjectProgressRequest
{
    public int? ProjectID { get; set; }
}

public class PlanProjectTrainingCreateRequest
{
    public int? ProjectID { get; set; }
    public int? UserID { get; set; }
}

public class PlanProjectTrainingRequest
{
    public int? ProjectID { get; set; }
}

public class PlanProjectWorkOrderBreakdownsRequest
{
    public int? ProjectID { get; set; }
}

public class PlanProjectItembyProjectIDRequest
{
    public int? ProjectID { get; set; }
}

public class PlanProjectItemUkeyRequest
{
    public string? finYear { get; set; }
    public int? userID { get; set; }
}

public class PlanProjectsBehindScheduleRequest
{
    public string? FinYear { get; set; }
    public int? ProjectTypeID { get; set; }
    public int? WeeksBehind { get; set; }
    public decimal? PercentBehind { get; set; }
}

public class PlanRejectAdjustmentProjectRequest
{
    public int? UserId { get; set; }
    public int? AdjustmentProjectId { get; set; }
    public string? RejectReason { get; set; }
}

public class PlanUpdateAdjustmentProjectCodeRequest
{
    public int? ProjectId { get; set; }
    public int? UserId { get; set; }
}

public class PlanUpdateAdjustmentProjectItemsRequest
{
    public int? PlanAdjustmentProjectItemID { get; set; }
    public int? SCOAItemID { get; set; }
    public int? ModifierID { get; set; }
    public int? ProjectFundYearID { get; set; }
}

public class PlanUpdateAdjustmentProjectPlanRequest
{
    public int? AdjustmentProjectID { get; set; }
    public int? ModifierID { get; set; }
}

public class PlanUpdateProjectCodeRequest
{
    public int? ProjectId { get; set; }
    public int? UserId { get; set; }
}

public class PlanUpdateProjectFundAndItemForAdjustmentRequest
{
    public string? AdjustmentId { get; set; }
    public string? UserId { get; set; }
}

public class PlanUpdateProjectItemsRequest
{
    public int? PlanProjectItemID { get; set; }
    public int? SCOAItemID { get; set; }
    public int? ModifierID { get; set; }
    public int? ProjectFundYearID { get; set; }
}

public class PlanUpdateProjectPlanRequest
{
    public int? ProjectID { get; set; }
    public int? ModifierID { get; set; }
}

public class PlanUpdateSCOAProjectFBSRequest
{
    public int? SCOAId { get; set; }
    public int? UserId { get; set; }
    public string? FinYear { get; set; }
    public string? FMSAuditDBName { get; set; }
    public string? AuditUser { get; set; }
    public bool? IsEnable { get; set; }
    public DateTime? CurrDate { get; set; }
}
