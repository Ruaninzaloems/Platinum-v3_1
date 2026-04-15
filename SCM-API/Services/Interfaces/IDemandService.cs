using SCM_API.Models.Common;
using SCM_API.Models.DTOs;

namespace SCM_API.Services.Interfaces;

public interface IDemandService
{
    Task<DemandDashboardDto> GetDashboardAsync();
    Task<PagedResult<DemandPlanDto>> GetAllPlansAsync(string? financialYear, int? departmentId, string? department, string? status, string? search, int page, int pageSize);
    Task<DemandPlanDto?> GetPlanByIdAsync(int id);
    Task<DemandPlanDto> CreatePlanAsync(CreateDemandPlanRequest request);
    Task<DemandPlanDto?> UpdatePlanAsync(int id, UpdateDemandPlanRequest request);
    Task<bool> DeletePlanAsync(int id);
    Task<DemandPlanDto?> SubmitPlanAsync(int id);
    Task<DemandPlanDto?> ReviewPlanAsync(int id, WorkflowActionRequest? request);
    Task<DemandPlanDto?> ApprovePlanAsync(int id, WorkflowActionRequest? request);
    Task<DemandPlanDto?> RejectPlanAsync(int id, WorkflowActionRequest request);
    Task<List<DemandPlanItemDto>> GetPlanItemsAsync(int planId);
    Task<DemandPlanItemDto?> AddPlanItemAsync(int planId, CreateDemandItemRequest request);
    Task<DemandPlanItemDto?> UpdatePlanItemAsync(int planId, int itemId, CreateDemandItemRequest request);
    Task<bool> DeletePlanItemAsync(int planId, int itemId);
    Task<DemandPlanDto?> ReturnPlanAsync(int id, WorkflowActionRequest request);
    Task<PagedResult<NeedsAssessmentDto>> GetNeedsAssessmentsAsync(string? financialYear, string? search, int page, int pageSize);
    Task<NeedsAssessmentDto> CreateNeedsAssessmentAsync(CreateNeedsAssessmentRequest request);
    Task<NeedsAssessmentDto?> GetNeedsAssessmentByIdAsync(int id);
    Task<NeedsAssessmentDto?> UpdateNeedsAssessmentAsync(int id, CreateNeedsAssessmentRequest request);
    Task<bool> DeleteNeedsAssessmentAsync(int id);
    Task<NeedsAssessmentDto?> SubmitNeedsAssessmentAsync(int id);
    Task<NeedsAssessmentDto?> ApproveNeedsAssessmentAsync(int id, WorkflowActionRequest? request);
    Task<NeedsAssessmentDto?> RejectNeedsAssessmentAsync(int id, WorkflowActionRequest request);
    Task<List<SpecificationDto>> GetSpecificationsAsync();
    Task<SpecificationDto?> GetSpecificationByIdAsync(int id);
    Task<SpecificationDto> CreateSpecificationAsync(CreateSpecificationRequest request);
    Task<SpecificationDto?> UpdateSpecificationAsync(int id, CreateSpecificationRequest request);
    Task<bool> DeleteSpecificationAsync(int id);
    Task<SpecificationDto?> SubmitSpecificationAsync(int id);
    Task<SpecificationDto?> ApproveSpecificationAsync(int id);
    Task<SpecificationDto?> RejectSpecificationAsync(int id, string? reason);
    Task<List<CommodityGroupDto>> GetCommodityGroupsAsync();
    Task<CommodityGroupDto?> GetCommodityGroupByIdAsync(int id);
    Task<List<MarketAnalysisDto>> GetMarketAnalysesAsync();
    Task<MarketAnalysisDto?> GetMarketAnalysisByIdAsync(int id);
    Task<MarketAnalysisDto> CreateMarketAnalysisAsync(CreateMarketAnalysisRequest request);
    Task<MarketAnalysisDto?> UpdateMarketAnalysisAsync(int id, CreateMarketAnalysisRequest request);
    Task<MarketAnalysisDto?> CompleteMarketAnalysisAsync(int id);
    Task<List<AggregationDto>> GetAggregationsAsync();
    Task<AggregationDto?> GetAggregationByIdAsync(int id);
    Task<AggregationDto> CreateAggregationAsync(CreateAggregationRequest request);
    Task<AggregationDto?> UpdateAggregationAsync(int id, CreateAggregationRequest request);
    Task<AggregationDto?> ApproveAggregationAsync(int id);
    Task<AggregationDto?> RejectAggregationAsync(int id, string? reason);
}
