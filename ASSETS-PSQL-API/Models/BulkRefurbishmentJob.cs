namespace AssetManagement.Models;

public class BulkRefurbJob
{
    public int ID { get; set; }
    public string? Filename { get; set; }
    public string Status { get; set; } = "Pending";
    public int TotalRecords { get; set; }
    public int PostedRecords { get; set; }
    public int ErrorRecords { get; set; }
    public int UploadedBy { get; set; } = 1;
    public DateTime UploadedDate { get; set; }
    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectionReason { get; set; }
}

public class BulkRefurbItem
{
    public int ID { get; set; }
    public int JobID { get; set; }
    public int RowNumber { get; set; }
    public int AssetRegisterItemID { get; set; }
    public DateTime RefurbDate { get; set; }
    public decimal? Refurb_DT { get; set; }
    public decimal? Refurb_CT { get; set; }
    public decimal? Refurb_Depreciation { get; set; }
    public decimal? Refurb_Revaluation { get; set; }
    public decimal? Refurb_Impairment { get; set; }
    public int? DebitPlanProjectItemId { get; set; }
    public int? CreditPlanProjectItemId { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ErrorMessage { get; set; }
    public int? PostedEntityID { get; set; }
    public DateTime DateCreated { get; set; }
}

public class BulkRefurbRejectRequest
{
    public string? Reason { get; set; }
}
