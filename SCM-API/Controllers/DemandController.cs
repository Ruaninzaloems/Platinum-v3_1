using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Models.DTOs;
using SCM_API.Services;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/demand")]
public class DemandController : ControllerBase
{
    private readonly IDemandService _service;
    private readonly IRequisitionService _requisitionService;

    public DemandController(IDemandService service, IRequisitionService requisitionService)
    {
        _service = service;
        _requisitionService = requisitionService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult> GetDashboard()
    {
        var dashboard = await _service.GetDashboardAsync();
        return Ok(ApiResponse<object>.Ok(new
        {
            totalPlans = dashboard.TotalPlans,
            pending = dashboard.SubmittedPlans,
            approved = dashboard.ApprovedPlans,
            totalValue = dashboard.TotalDemandValue,
            currentFinancialYear = dashboard.CurrentFinancialYear,
            kpis = new
            {
                totalPlans = dashboard.TotalPlans,
                totalDemandValue = dashboard.TotalDemandValue,
                budgetCoverage = dashboard.BudgetCoverage,
                budgetGap = dashboard.TotalDemandValue - dashboard.TotalBudgetValue,
                avgComplianceScore = dashboard.ComplianceScore,
                conversionRate = dashboard.ConversionRate,
                linkedItems = (int)(dashboard.TotalItems * dashboard.ConversionRate / 100),
                totalItems = dashboard.TotalItems,
                needsCompleted = dashboard.CompletedAssessments,
                needsTotal = dashboard.TotalAssessments,
                specsApproved = dashboard.SpecificationsReady,
                specsTotal = dashboard.SpecificationsTotal,
                aggregationSavings = dashboard.AggregationSavings,
                aggregationCount = dashboard.AggregationGroups,
                overdueItems = dashboard.OverdueItems
            },
            statusDistribution = dashboard.StatusDistribution.Select(kvp => new { status = kvp.Key, count = kvp.Value, value = 0m, percentage = dashboard.TotalPlans > 0 ? Math.Round((decimal)kvp.Value / dashboard.TotalPlans * 100) : 0 }),
            departmentBreakdown = dashboard.ByDepartment.Select(d => new
            {
                department = d.Department,
                plans = d.Plans,
                value = d.Value,
                items = d.Items,
                complianceScore = d.Compliance,
                budgetUtilisation = d.BudgetUtil
            }),
            categoryBreakdown = dashboard.CategoryBreakdown,
            procurementMethodBreakdown = dashboard.ProcurementMethodBreakdown,
            quarterlyPipeline = dashboard.QuarterlyPipeline,
            riskSummary = dashboard.RiskSummary,
            legislativeCompliance = new
            {
                idpAlignment = dashboard.TotalPlans > 0 ? (int)Math.Round((decimal)dashboard.ByDepartment.Count(d => d.Compliance >= 80) / Math.Max(dashboard.ByDepartment.Count, 1) * 100) : 0,
                budgetCoverage = dashboard.BudgetCoverage,
                specReadiness = dashboard.SpecificationsTotal > 0 ? (int)Math.Round((decimal)dashboard.SpecificationsReady / dashboard.SpecificationsTotal * 100) : 0
            }
        }));
    }

    [HttpGet("plans")]
    public async Task<ActionResult> GetPlans([FromQuery] string? financialYear, [FromQuery] int? departmentId, [FromQuery] string? department, [FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllPlansAsync(financialYear, departmentId, department, status, search, page, pageSize);
        var planDtos = result.Items.Select(MapPlanToResponse);
        return Ok(new
        {
            data = planDtos,
            isSuccess = true,
            page = result.Page,
            pageSize = result.PageSize,
            totalCount = result.TotalCount,
            totalPages = result.TotalPages,
            errors = Array.Empty<string>(),
            timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("plans")]
    public async Task<ActionResult> CreatePlan([FromBody] CreateDemandPlanRequest request)
    {
        var plan = await _service.CreatePlanAsync(request);
        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan), "Demand plan created successfully"));
    }

    [HttpGet("plans/{id}")]
    public async Task<ActionResult> GetPlanById(int id)
    {
        var plan = await _service.GetPlanByIdAsync(id);
        if (plan == null) return NotFound(ApiResponse.Fail("Demand plan not found"));
        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan)));
    }

    [HttpPut("plans/{id}")]
    public async Task<ActionResult> UpdatePlan(int id, [FromBody] UpdateDemandPlanRequest request)
    {
        var plan = await _service.UpdatePlanAsync(id, request);
        if (plan == null) return NotFound(ApiResponse.Fail("Demand plan not found"));
        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan), "Demand plan updated"));
    }

    [HttpDelete("plans/{id}")]
    public async Task<ActionResult> DeletePlan(int id)
    {
        var success = await _service.DeletePlanAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Demand plan not found"));
        return Ok(ApiResponse.Ok("Demand plan deleted"));
    }

    [HttpPost("plans/{id}/submit")]
    public async Task<ActionResult> SubmitPlan(int id)
    {
        var plan = await _service.SubmitPlanAsync(id);
        if (plan == null) return BadRequest(ApiResponse.Fail("Cannot submit plan. Ensure it is in Draft status."));
        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan), "Plan submitted for review"));
    }

    [HttpPost("plans/{id}/review")]
    public async Task<ActionResult> ReviewPlan(int id, [FromBody] WorkflowActionRequest? request)
    {
        var plan = await _service.ReviewPlanAsync(id, request);
        if (plan == null) return BadRequest(ApiResponse.Fail("Cannot review plan. Ensure it is in Submitted status."));
        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan), "Plan marked as reviewed"));
    }

    [HttpPost("plans/{id}/approve")]
    public async Task<ActionResult> ApprovePlan(int id, [FromBody] WorkflowActionRequest? request)
    {
        var plan = await _service.ApprovePlanAsync(id, request);
        if (plan == null) return BadRequest(ApiResponse.Fail("Cannot approve plan. Ensure it is in Reviewed status."));

        if (plan.StatusId == 4)
        {
            var existing = _requisitionService.GetByDemandPlanRef(plan.ReferenceNumber ?? "");
            if (existing.Count == 0)
            {
                var groupedItems = new Dictionary<string, List<DemandPlanItemDto>>();
                foreach (var item in plan.Items)
                {
                    var method = item.ProcurementMethod ?? "RFQ";
                    if (!groupedItems.ContainsKey(method)) groupedItems[method] = new();
                    groupedItems[method].Add(item);
                }

                foreach (var group in groupedItems)
                {
                    var groupItems = group.Value;
                    var totalValue = groupItems.Sum(i => i.UnitPrice * i.Quantity);
                    var lineItems = groupItems.Select((item, idx) => (object)new
                    {
                        id = $"LI-{idx + 1:D3}",
                        description = item.Description,
                        quantity = item.Quantity,
                        unitOfMeasure = item.UnitOfMeasure,
                        estimatedUnitCost = new { amount = item.UnitPrice, currency = "ZAR" },
                        totalCost = new { amount = item.UnitPrice * item.Quantity, currency = "ZAR" }
                    }).ToArray();

                    var reqId = _requisitionService.CreateFromDemandPlan(
                        plan.ReferenceNumber ?? "", plan.DepartmentName ?? "Unknown",
                        plan.DepartmentId ?? 0, $"{string.Join(", ", groupItems.Select(i => i.Description).Take(3))}",
                        totalValue, plan.CreatedByName ?? "System", plan.FinancialYear ?? "2025/26",
                        plan.Vote ?? "", group.Key, plan.Priority ?? "Medium", lineItems);

                    foreach (var item in groupItems)
                        item.LinkedRequisitionIds = new List<int> { reqId };
                }
            }
        }

        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan), "Plan approved successfully"));
    }

    [HttpPost("plans/{id}/reject")]
    public async Task<ActionResult> RejectPlan(int id, [FromBody] WorkflowActionRequest request)
    {
        var plan = await _service.RejectPlanAsync(id, request);
        if (plan == null) return BadRequest(ApiResponse.Fail("Cannot reject plan."));
        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan), "Plan rejected"));
    }

    [HttpGet("plans/{id}/items")]
    public async Task<ActionResult> GetPlanItems(int id)
    {
        var items = await _service.GetPlanItemsAsync(id);
        var itemDtos = items.Select(MapItemToResponse);
        return Ok(ApiResponse<object>.Ok(itemDtos));
    }

    [HttpPost("plans/{id}/items")]
    public async Task<ActionResult> AddPlanItem(int id, [FromBody] CreateDemandItemRequest request)
    {
        var item = await _service.AddPlanItemAsync(id, request);
        if (item == null) return NotFound(ApiResponse.Fail("Demand plan not found"));
        return Ok(ApiResponse<object>.Ok(MapItemToResponse(item), "Item added to plan"));
    }

    [HttpPut("plans/{id}/items/{itemId}")]
    public async Task<ActionResult> UpdatePlanItem(int id, int itemId, [FromBody] CreateDemandItemRequest request)
    {
        var item = await _service.UpdatePlanItemAsync(id, itemId, request);
        if (item == null) return NotFound(ApiResponse.Fail("Item not found"));
        return Ok(ApiResponse<object>.Ok(MapItemToResponse(item), "Item updated"));
    }

    [HttpDelete("plans/{id}/items/{itemId}")]
    public async Task<ActionResult> DeletePlanItem(int id, int itemId)
    {
        var success = await _service.DeletePlanItemAsync(id, itemId);
        if (!success) return NotFound(ApiResponse.Fail("Item not found"));
        return Ok(ApiResponse.Ok("Item deleted"));
    }

    [HttpGet("needs-assessments")]
    public async Task<ActionResult> GetNeedsAssessments([FromQuery] string? financialYear, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetNeedsAssessmentsAsync(financialYear, search, page, pageSize);
        var needDtos = result.Items.Select(MapNeedToResponse);
        return Ok(new
        {
            data = needDtos,
            isSuccess = true,
            page = result.Page,
            pageSize = result.PageSize,
            totalCount = result.TotalCount,
            totalPages = result.TotalPages,
            errors = Array.Empty<string>(),
            timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("needs-assessments")]
    public async Task<ActionResult> CreateNeedsAssessment([FromBody] CreateNeedsAssessmentRequest request)
    {
        var need = await _service.CreateNeedsAssessmentAsync(request);
        return Ok(ApiResponse<object>.Ok(MapNeedToResponse(need), "Needs assessment created"));
    }

    [HttpGet("needs-assessments/{id}")]
    public async Task<ActionResult> GetNeedsAssessmentById(int id)
    {
        var need = await _service.GetNeedsAssessmentByIdAsync(id);
        if (need == null) return NotFound(ApiResponse.Fail("Needs assessment not found"));
        return Ok(ApiResponse<object>.Ok(MapNeedToResponse(need)));
    }

    [HttpPut("needs-assessments/{id}")]
    public async Task<ActionResult> UpdateNeedsAssessment(int id, [FromBody] CreateNeedsAssessmentRequest request)
    {
        var need = await _service.UpdateNeedsAssessmentAsync(id, request);
        if (need == null) return NotFound(ApiResponse.Fail("Needs assessment not found or not editable"));
        return Ok(ApiResponse<object>.Ok(MapNeedToResponse(need), "Needs assessment updated"));
    }

    [HttpDelete("needs-assessments/{id}")]
    public async Task<ActionResult> DeleteNeedsAssessment(int id)
    {
        var success = await _service.DeleteNeedsAssessmentAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Needs assessment not found or cannot be deleted"));
        return Ok(ApiResponse.Ok("Needs assessment deleted"));
    }

    [HttpPost("needs-assessments/{id}/submit")]
    public async Task<ActionResult> SubmitNeedsAssessment(int id)
    {
        var need = await _service.SubmitNeedsAssessmentAsync(id);
        if (need == null) return BadRequest(ApiResponse.Fail("Cannot submit. Ensure it is in draft status."));
        return Ok(ApiResponse<object>.Ok(MapNeedToResponse(need), "Needs assessment submitted"));
    }

    [HttpPost("needs-assessments/{id}/approve")]
    public async Task<ActionResult> ApproveNeedsAssessment(int id, [FromBody] WorkflowActionRequest? request)
    {
        var need = await _service.ApproveNeedsAssessmentAsync(id, request);
        if (need == null) return BadRequest(ApiResponse.Fail("Cannot approve needs assessment."));
        return Ok(ApiResponse<object>.Ok(MapNeedToResponse(need), "Needs assessment approved"));
    }

    [HttpPost("needs-assessments/{id}/reject")]
    public async Task<ActionResult> RejectNeedsAssessment(int id, [FromBody] WorkflowActionRequest request)
    {
        var need = await _service.RejectNeedsAssessmentAsync(id, request);
        if (need == null) return BadRequest(ApiResponse.Fail("Cannot reject needs assessment."));
        return Ok(ApiResponse<object>.Ok(MapNeedToResponse(need), "Needs assessment rejected"));
    }

    [HttpPost("plans/{id}/return")]
    public async Task<ActionResult> ReturnPlan(int id, [FromBody] WorkflowActionRequest request)
    {
        var plan = await _service.ReturnPlanAsync(id, request);
        if (plan == null) return BadRequest(ApiResponse.Fail("Cannot return plan."));
        return Ok(ApiResponse<object>.Ok(MapPlanToResponse(plan), "Plan returned for corrections"));
    }

    [HttpGet("annual-procurement-plan")]
    public ActionResult GetAnnualProcurementPlan([FromQuery] string? financialYear)
        => Ok(ApiResponse<object>.Ok(new
        {
            id = "pp-001",
            referenceNumber = "APP-2025/26-001",
            title = "Annual Procurement Plan 2025/26",
            financialYear = "2025/26",
            status = "published",
            version = 2,
            publishedDate = "2025-03-01",
            preparedByName = "S. Nkosi",
            totalPlannedSpend = new { amount = 187500000m },
            totalBudgetAvailable = new { amount = 215000000m },
            items = new object[]
            {
                new { id = "pi-001", description = "Road rehabilitation programme", procurementMethod = "Open Tender", estimatedValue = 28500000m, targetQuarter = "Q1", category = "capital_works", status = "approved", biddingDocumentReady = true },
                new { id = "pi-002", description = "Water pipeline replacement", procurementMethod = "Open Tender", estimatedValue = 18200000m, targetQuarter = "Q1", category = "capital_works", status = "approved", biddingDocumentReady = true },
                new { id = "pi-003", description = "ICT server infrastructure", procurementMethod = "Open Tender", estimatedValue = 8500000m, targetQuarter = "Q2", category = "goods", status = "pending", biddingDocumentReady = false },
                new { id = "pi-004", description = "Professional consulting services", procurementMethod = "RFQ (Three Quotes)", estimatedValue = 4200000m, targetQuarter = "Q2", category = "services", status = "approved", biddingDocumentReady = true },
                new { id = "pi-005", description = "Fleet vehicle procurement", procurementMethod = "Open Tender", estimatedValue = 12800000m, targetQuarter = "Q3", category = "goods", status = "pending", biddingDocumentReady = false },
                new { id = "pi-006", description = "Building maintenance services", procurementMethod = "RFQ (Three Quotes)", estimatedValue = 3500000m, targetQuarter = "Q3", category = "maintenance", status = "draft", biddingDocumentReady = false },
                new { id = "pi-007", description = "Electrical network expansion", procurementMethod = "Open Tender", estimatedValue = 22000000m, targetQuarter = "Q2", category = "capital_works", status = "approved", biddingDocumentReady = true },
                new { id = "pi-008", description = "Security services contract", procurementMethod = "Limited Bidding", estimatedValue = 6800000m, targetQuarter = "Q1", category = "services", status = "approved", biddingDocumentReady = true }
            },
            quarterlyPipeline = new Dictionary<string, object>
            {
                { "Q1", new { items = 12, value = 53500000m, status = "on_track" } },
                { "Q2", new { items = 10, value = 48700000m, status = "on_track" } },
                { "Q3", new { items = 8, value = 42300000m, status = "delayed" } },
                { "Q4", new { items = 6, value = 43000000m, status = "pending" } }
            },
            methodBreakdown = new Dictionary<string, object>
            {
                { "Open Tender", new { count = 15, value = 95200000m, percentage = 51 } },
                { "RFQ (Three Quotes)", new { count = 18, value = 42800000m, percentage = 23 } },
                { "Limited Bidding", new { count = 5, value = 28500000m, percentage = 15 } },
                { "Emergency", new { count = 3, value = 12400000m, percentage = 7 } },
                { "Single Source", new { count = 2, value = 8600000m, percentage = 4 } }
            }
        }));

    [HttpGet("plans/{id}/compliance-check")]
    public async Task<ActionResult> GetComplianceCheck(int id)
    {
        var plan = await _service.GetPlanByIdAsync(id);
        if (plan == null) return NotFound(ApiResponse.Fail("Plan not found"));
        return Ok(ApiResponse<object>.Ok(new
        {
            planId = id,
            overallScore = plan.ComplianceScore,
            checks = new object[]
            {
                new { check = "IDP Alignment", status = !string.IsNullOrEmpty(plan.IdpReference) ? "pass" : "fail", score = !string.IsNullOrEmpty(plan.IdpReference) ? 20 : 0, maxScore = 20 },
                new { check = "SDBIP Reference", status = !string.IsNullOrEmpty(plan.SdbipReference) ? "pass" : "fail", score = !string.IsNullOrEmpty(plan.SdbipReference) ? 20 : 0, maxScore = 20 },
                new { check = "Budget Allocation", status = plan.TotalBudget > 0 ? "pass" : "fail", score = plan.TotalBudget > 0 ? 20 : 0, maxScore = 20 },
                new { check = "Line Items", status = plan.Items.Count > 0 ? "pass" : "fail", score = plan.Items.Count > 0 ? 20 : 0, maxScore = 20 },
                new { check = "Vote Number", status = !string.IsNullOrEmpty(plan.Vote) ? "pass" : "fail", score = !string.IsNullOrEmpty(plan.Vote) ? 10 : 0, maxScore = 10 },
                new { check = "Description", status = !string.IsNullOrEmpty(plan.Description) ? "pass" : "fail", score = !string.IsNullOrEmpty(plan.Description) ? 10 : 0, maxScore = 10 }
            }
        }));
    }

    [HttpGet("plans/{id}/budget-analysis")]
    public async Task<ActionResult> GetBudgetAnalysis(int id)
    {
        var plan = await _service.GetPlanByIdAsync(id);
        if (plan == null) return NotFound(ApiResponse.Fail("Plan not found"));
        return Ok(ApiResponse<object>.Ok(new
        {
            planId = id,
            totalBudget = plan.TotalBudget,
            totalDemand = plan.TotalDemand,
            variance = plan.BudgetVariance.Amount,
            utilisation = plan.BudgetUtilisation,
            status = plan.BudgetUtilisation > 90 ? "over_budget" : plan.BudgetUtilisation > 70 ? "on_track" : "under_utilised"
        }));
    }

    [HttpGet("plans/{id}/audit-trail")]
    public async Task<ActionResult> GetAuditTrail(int id)
    {
        var plan = await _service.GetPlanByIdAsync(id);
        if (plan == null) return NotFound(ApiResponse.Fail("Plan not found"));
        return Ok(ApiResponse<object>.Ok(plan.AuditTrail));
    }

    [HttpPost("plans/{id}/generate-requisitions")]
    public async Task<ActionResult> GenerateRequisitions(int id)
    {
        var plan = await _service.GetPlanByIdAsync(id);
        if (plan == null) return NotFound(ApiResponse.Fail("Plan not found"));
        if (plan.StatusId != 4) return BadRequest(ApiResponse.Fail("Only approved plans can generate requisitions"));

        var existing = _requisitionService.GetByDemandPlanRef(plan.ReferenceNumber ?? "");
        if (existing.Count > 0)
        {
            var existingIds = existing.Select(r => r.TryGetValue("id", out var rid) && rid is int i ? i : 0).Where(i => i > 0).ToList();
            foreach (var item in plan.Items)
                item.LinkedRequisitionIds = existingIds;

            return Ok(ApiResponse<object>.Ok(new { planId = id, requisitionsGenerated = 0, existingRequisitions = existing.Count, message = $"Requisitions already exist for this plan ({existing.Count} found)", requisitions = existing.Select(r => new { id = r["id"], requisitionNumber = r["requisitionNumber"], status = r["status"] }) }));
        }

        var generated = new List<object>();
        var groupedItems = new Dictionary<string, List<DemandPlanItemDto>>();
        foreach (var item in plan.Items)
        {
            var method = item.ProcurementMethod ?? "RFQ";
            if (!groupedItems.ContainsKey(method)) groupedItems[method] = new();
            groupedItems[method].Add(item);
        }

        foreach (var group in groupedItems)
        {
            var groupItems = group.Value;
            var totalValue = groupItems.Sum(i => i.UnitPrice * i.Quantity);
            var lineItems = groupItems.Select((item, idx) => (object)new
            {
                id = $"LI-{idx + 1:D3}",
                description = item.Description,
                quantity = item.Quantity,
                unitOfMeasure = item.UnitOfMeasure,
                estimatedUnitCost = new { amount = item.UnitPrice, currency = "ZAR" },
                totalCost = new { amount = item.UnitPrice * item.Quantity, currency = "ZAR" }
            }).ToArray();

            var reqId = _requisitionService.CreateFromDemandPlan(
                plan.ReferenceNumber ?? "",
                plan.DepartmentName ?? "Unknown",
                plan.DepartmentId ?? 0,
                $"{string.Join(", ", groupItems.Select(i => i.Description).Take(3))}",
                totalValue,
                plan.CreatedByName ?? "System",
                plan.FinancialYear ?? "2025/26",
                plan.Vote ?? "",
                group.Key,
                plan.Priority ?? "Medium",
                lineItems
            );

            foreach (var item in groupItems)
                item.LinkedRequisitionIds = new List<int> { reqId };

            generated.Add(new { id = reqId, procurementMethod = group.Key, itemCount = groupItems.Count, totalValue });
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            planId = id,
            requisitionsGenerated = generated.Count,
            message = $"{generated.Count} requisition(s) generated from demand plan items",
            requisitions = generated
        }));
    }

    [HttpGet("procurement-plans")]
    public ActionResult GetProcurementPlans()
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("summary/departments")]
    public async Task<ActionResult> GetDepartmentSummary()
    {
        var dashboard = await _service.GetDashboardAsync();
        return Ok(ApiResponse<object>.Ok(dashboard.ByDepartment));
    }

    [HttpGet("summary/methods")]
    public async Task<ActionResult> GetMethodSummary()
    {
        var dashboard = await _service.GetDashboardAsync();
        return Ok(ApiResponse<object>.Ok(dashboard.ProcurementMethodBreakdown));
    }

    [HttpGet("summary/risk")]
    public async Task<ActionResult> GetRiskSummary()
    {
        var dashboard = await _service.GetDashboardAsync();
        return Ok(ApiResponse<object>.Ok(dashboard.RiskSummary));
    }

    [HttpGet("summary/compliance")]
    public async Task<ActionResult> GetComplianceSummary()
    {
        var dashboard = await _service.GetDashboardAsync();
        return Ok(ApiResponse<object>.Ok(new
        {
            idpAlignment = dashboard.TotalPlans > 0 ? (int)Math.Round((decimal)dashboard.ByDepartment.Count(d => d.Compliance >= 80) / Math.Max(dashboard.ByDepartment.Count, 1) * 100) : 0,
            budgetCoverage = dashboard.BudgetCoverage,
            specReadiness = dashboard.SpecificationsTotal > 0 ? (int)Math.Round((decimal)dashboard.SpecificationsReady / dashboard.SpecificationsTotal * 100) : 0
        }));
    }

    [HttpGet("specifications")]
    public async Task<ActionResult> GetSpecifications()
    {
        var specs = await _service.GetSpecificationsAsync();
        return Ok(ApiResponse<object>.Ok(specs));
    }

    [HttpGet("specifications/{id}")]
    public async Task<ActionResult> GetSpecificationById(int id)
    {
        var spec = await _service.GetSpecificationByIdAsync(id);
        if (spec == null) return NotFound(ApiResponse.Fail("Specification not found"));
        return Ok(ApiResponse<object>.Ok(spec));
    }

    [HttpPost("specifications")]
    public async Task<ActionResult> CreateSpecification([FromBody] CreateSpecificationRequest request)
    {
        var spec = await _service.CreateSpecificationAsync(request);
        return Ok(ApiResponse<object>.Ok(spec, "Specification created"));
    }

    [HttpPut("specifications/{id}")]
    public async Task<ActionResult> UpdateSpecification(int id, [FromBody] CreateSpecificationRequest request)
    {
        var spec = await _service.UpdateSpecificationAsync(id, request);
        if (spec == null) return NotFound(ApiResponse.Fail("Specification not found"));
        return Ok(ApiResponse<object>.Ok(spec, "Specification updated"));
    }

    [HttpDelete("specifications/{id}")]
    public async Task<ActionResult> DeleteSpecification(int id)
    {
        var success = await _service.DeleteSpecificationAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Specification not found"));
        return Ok(ApiResponse.Ok("Specification deleted"));
    }

    [HttpPost("specifications/{id}/submit")]
    public async Task<ActionResult> SubmitSpecification(int id)
    {
        var spec = await _service.SubmitSpecificationAsync(id);
        if (spec == null) return BadRequest(ApiResponse.Fail("Cannot submit specification"));
        return Ok(ApiResponse<object>.Ok(spec, "Specification submitted"));
    }

    [HttpPost("specifications/{id}/approve")]
    public async Task<ActionResult> ApproveSpecification(int id)
    {
        var spec = await _service.ApproveSpecificationAsync(id);
        if (spec == null) return BadRequest(ApiResponse.Fail("Cannot approve specification"));
        return Ok(ApiResponse<object>.Ok(spec, "Specification approved"));
    }

    [HttpPost("specifications/{id}/reject")]
    public async Task<ActionResult> RejectSpecification(int id, [FromBody] WorkflowActionRequest request)
    {
        var spec = await _service.RejectSpecificationAsync(id, request.Reason);
        if (spec == null) return BadRequest(ApiResponse.Fail("Cannot reject specification"));
        return Ok(ApiResponse<object>.Ok(spec, "Specification rejected"));
    }

    [HttpGet("commodity-groups")]
    public async Task<ActionResult> GetCommodityGroups()
    {
        var groups = await _service.GetCommodityGroupsAsync();
        return Ok(ApiResponse<object>.Ok(groups));
    }

    [HttpGet("commodity-groups/{id}")]
    public async Task<ActionResult> GetCommodityGroupById(int id)
    {
        var group = await _service.GetCommodityGroupByIdAsync(id);
        if (group == null) return NotFound(ApiResponse.Fail("Commodity group not found"));
        return Ok(ApiResponse<object>.Ok(group));
    }

    [HttpGet("market-analyses")]
    public async Task<ActionResult> GetMarketAnalyses()
    {
        var analyses = await _service.GetMarketAnalysesAsync();
        return Ok(ApiResponse<object>.Ok(analyses));
    }

    [HttpGet("market-analyses/{id}")]
    public async Task<ActionResult> GetMarketAnalysisById(int id)
    {
        var analysis = await _service.GetMarketAnalysisByIdAsync(id);
        if (analysis == null) return NotFound(ApiResponse.Fail("Market analysis not found"));
        return Ok(ApiResponse<object>.Ok(analysis));
    }

    [HttpPost("market-analyses")]
    public async Task<ActionResult> CreateMarketAnalysis([FromBody] CreateMarketAnalysisRequest request)
    {
        var analysis = await _service.CreateMarketAnalysisAsync(request);
        return Ok(ApiResponse<object>.Ok(analysis, "Market analysis created"));
    }

    [HttpPut("market-analyses/{id}")]
    public async Task<ActionResult> UpdateMarketAnalysis(int id, [FromBody] CreateMarketAnalysisRequest request)
    {
        var analysis = await _service.UpdateMarketAnalysisAsync(id, request);
        if (analysis == null) return NotFound(ApiResponse.Fail("Market analysis not found"));
        return Ok(ApiResponse<object>.Ok(analysis, "Market analysis updated"));
    }

    [HttpPost("market-analyses/{id}/complete")]
    public async Task<ActionResult> CompleteMarketAnalysis(int id)
    {
        var analysis = await _service.CompleteMarketAnalysisAsync(id);
        if (analysis == null) return BadRequest(ApiResponse.Fail("Cannot complete market analysis"));
        return Ok(ApiResponse<object>.Ok(analysis, "Market analysis completed"));
    }

    [HttpGet("aggregations")]
    public async Task<ActionResult> GetAggregations()
    {
        var aggs = await _service.GetAggregationsAsync();
        return Ok(ApiResponse<object>.Ok(aggs));
    }

    [HttpGet("aggregations/{id}")]
    public async Task<ActionResult> GetAggregationById(int id)
    {
        var agg = await _service.GetAggregationByIdAsync(id);
        if (agg == null) return NotFound(ApiResponse.Fail("Aggregation not found"));
        return Ok(ApiResponse<object>.Ok(agg));
    }

    [HttpPost("aggregations")]
    public async Task<ActionResult> CreateAggregation([FromBody] CreateAggregationRequest request)
    {
        var agg = await _service.CreateAggregationAsync(request);
        return Ok(ApiResponse<object>.Ok(agg, "Aggregation created"));
    }

    [HttpPut("aggregations/{id}")]
    public async Task<ActionResult> UpdateAggregation(int id, [FromBody] CreateAggregationRequest request)
    {
        var agg = await _service.UpdateAggregationAsync(id, request);
        if (agg == null) return NotFound(ApiResponse.Fail("Aggregation not found"));
        return Ok(ApiResponse<object>.Ok(agg, "Aggregation updated"));
    }

    [HttpPost("aggregations/{id}/approve")]
    public async Task<ActionResult> ApproveAggregation(int id)
    {
        var agg = await _service.ApproveAggregationAsync(id);
        if (agg == null) return BadRequest(ApiResponse.Fail("Cannot approve aggregation"));
        return Ok(ApiResponse<object>.Ok(agg, "Aggregation approved"));
    }

    [HttpPost("aggregations/{id}/reject")]
    public async Task<ActionResult> RejectAggregation(int id, [FromBody] WorkflowActionRequest request)
    {
        var agg = await _service.RejectAggregationAsync(id, request.Reason);
        if (agg == null) return BadRequest(ApiResponse.Fail("Cannot reject aggregation"));
        return Ok(ApiResponse<object>.Ok(agg, "Aggregation rejected"));
    }

    private static object MapPlanToResponse(DemandPlanDto plan) => new
    {
        id = plan.Id.ToString(),
        referenceNumber = plan.ReferenceNumber,
        title = plan.Title,
        department = plan.DepartmentName,
        departmentCode = plan.DepartmentCode,
        vote = plan.Vote,
        financialYear = plan.FinancialYear,
        status = plan.Status.ToLower(),
        createdBy = plan.CreatedBy,
        createdByName = plan.CreatedByName,
        createdDate = plan.CreatedDate.ToString("yyyy-MM-dd"),
        reviewedByName = plan.ReviewedByName,
        reviewedDate = plan.ReviewedDate?.ToString("yyyy-MM-dd"),
        approvedByName = plan.ApprovedByName,
        approvedDate = plan.ApprovedDate?.ToString("yyyy-MM-dd"),
        idpReference = plan.IdpReference,
        idpObjective = plan.IdpObjective,
        sdbipReference = plan.SdbipReference,
        sdbipIndicator = plan.SdbipIndicator,
        totalBudget = new { amount = plan.TotalBudget },
        totalDemand = new { amount = plan.TotalDemand },
        budgetVariance = new { amount = plan.BudgetVariance.Amount },
        budgetUtilisation = plan.BudgetUtilisation,
        complianceScore = plan.ComplianceScore,
        riskLevel = plan.RiskLevel,
        priorityBreakdown = new
        {
            critical = plan.PriorityBreakdown.Critical,
            high = plan.PriorityBreakdown.High,
            medium = plan.PriorityBreakdown.Medium,
            low = plan.PriorityBreakdown.Low
        },
        procurementMethodSummary = plan.ProcurementMethodSummary,
        quarterlySpendPlan = new Dictionary<string, object>
        {
            { "Q1", new { planned = plan.QuarterlySpendPlan.Q1.Planned, actual = plan.QuarterlySpendPlan.Q1.Actual, committed = plan.QuarterlySpendPlan.Q1.Committed } },
            { "Q2", new { planned = plan.QuarterlySpendPlan.Q2.Planned, actual = plan.QuarterlySpendPlan.Q2.Actual, committed = plan.QuarterlySpendPlan.Q2.Committed } },
            { "Q3", new { planned = plan.QuarterlySpendPlan.Q3.Planned, actual = plan.QuarterlySpendPlan.Q3.Actual, committed = plan.QuarterlySpendPlan.Q3.Committed } },
            { "Q4", new { planned = plan.QuarterlySpendPlan.Q4.Planned, actual = plan.QuarterlySpendPlan.Q4.Actual, committed = plan.QuarterlySpendPlan.Q4.Committed } }
        },
        items = plan.Items.Select(MapItemToResponse).ToList(),
        notes = plan.Notes,
        auditTrail = plan.AuditTrail,
        rejectionReason = plan.RejectionReason
    };

    private static object MapItemToResponse(DemandPlanItemDto item) => new
    {
        id = item.Id.ToString(),
        lineNumber = item.Id,
        description = item.Description,
        quantity = item.Quantity,
        unitOfMeasure = item.UnitOfMeasure,
        unitPrice = item.UnitPrice,
        estimatedValue = new { amount = item.EstimatedValue },
        category = item.Category,
        procurementMethod = item.ProcurementMethod,
        priority = item.Priority.ToLower(),
        deliveryQuarter = item.DeliveryQuarter,
        status = item.Status.ToLower(),
        riskScore = 35,
        needsAssessmentId = item.NeedsAssessmentId,
        specificationId = item.SpecificationId,
        marketAnalysisComplete = false,
        mscoaSegment = item.MscoaSegment,
        linkedRequisitionIds = item.LinkedRequisitionIds ?? new List<int>()
    };

    private static object MapNeedToResponse(NeedsAssessmentDto need) => new
    {
        id = need.Id.ToString(),
        referenceNumber = need.ReferenceNumber,
        title = need.Title,
        department = need.DepartmentName,
        conductedByName = need.CreatedByName,
        conductedDate = need.CreatedDate.ToString("yyyy-MM-dd"),
        priority = need.Priority,
        estimatedCost = new { amount = need.EstimatedCost },
        status = need.Status,
        description = need.Justification,
        legislativeRef = need.Category == "capital_works" ? "MFMA s112(2)(a)" : "SCM Reg 12(5)",
        justification = need.Justification,
        currentSituation = need.CurrentSituation,
        proposedSolution = need.ProposedSolution,
        riskFactors = need.RiskFactors,
        category = need.Category
    };
}
