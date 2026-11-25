namespace AssetManagement.Models;

public class BulkUploadJob
{
    public int ID { get; set; }
    public string? Filename { get; set; }
    public int UserId { get; set; } = 1;
    public int? IsDonated { get; set; }
    public int Activate_Validation { get; set; } = 1;
    public int Processed { get; set; }
    public DateTime Date_Created { get; set; }
    public string? Job_Status { get; set; }
    public DateTime? Date_Ran { get; set; }
    public int? No_RecordsInserted { get; set; }
    public int? No_RecodsNotValidating { get; set; }
    public int? Total_Records { get; set; }
    public string? ValidationError_Path { get; set; }
    public int ServiceID { get; set; } = 1;
    public DateTime? ProcessDate { get; set; }
    public int? RunID { get; set; }
    public string? ContractNumber { get; set; }
    public int? ApprovedByID { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public int? UploadType { get; set; }
}

public class ApproveRequest
{
    public string? FinancialYear { get; set; }
    public int? UserId { get; set; }
}

public class WipApproveRequest
{
    public string? FinancialYear { get; set; }
    public int MainAssetId { get; set; }
    public int CreditPlanProjectItemId { get; set; }
    public DateTime TransferDate { get; set; }
    public int? UserId { get; set; }
}
