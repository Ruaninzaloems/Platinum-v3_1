using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.Services.Interfaces;

public interface IOvertimeTransactionsService
{
    Task<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>> ListCurrentForUserAsync(int page, int pageSize, CancellationToken ct = default);
    Task<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>> ListProcessedAsync(int page, int pageSize, CancellationToken ct = default);
    Task<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>> ListEnquiryAsync(int? status, string? departmentId, string? employeeSearch, string? salaryHeadName, DateTime? fromDate, DateTime? toDate, int page, int pageSize, CancellationToken ct = default);
    Task<ApiResponse<List<OvertimeTransactionDto>>> ListForEmployeeAsync(string employeeId, CancellationToken ct = default);
    Task<ApiResponse<OvertimeTransactionDto>> GetAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<OvertimeTransactionDto>> CreateAsync(CreateOvertimeTransactionRequest request, CancellationToken ct = default);
    Task<ApiResponse<OvertimeTransactionDto>> UpdateAsync(Guid id, UpdateOvertimeTransactionRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<AmountPreviewDto>> PreviewAmountAsync(AmountPreviewRequest request, CancellationToken ct = default);
    Task<ApiResponse<List<OvertimeTypeOption>>> GetOvertimeTypesForEmployeeAsync(string employeeId, CancellationToken ct = default);
    Task<ApiResponse<OvertimeDocumentDto>> UploadDocumentAsync(Guid transactionId, IFormFile file, CancellationToken ct = default);
    Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadDocumentAsync(Guid transactionId, Guid documentId, CancellationToken ct = default);
}
