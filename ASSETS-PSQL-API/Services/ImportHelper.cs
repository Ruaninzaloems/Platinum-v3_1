using AssetManagement.Models;

namespace AssetManagement.Services;

public static class ImportHelper
{
    private const long MaxFileSize = 10 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".xlsx", ".xls"];
    private static readonly string[] AllowedContentTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/octet-stream"
    ];

    public static ImportResult? ValidateFile(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return new ImportResult { Success = false, Errors = [new ImportError { Row = 0, Column = "", Value = "", Message = "No file uploaded" }] };

        if (file.Length > MaxFileSize)
            return new ImportResult { Success = false, Errors = [new ImportError { Row = 0, Column = "", Value = file.FileName, Message = $"File exceeds maximum size of {MaxFileSize / 1024 / 1024}MB" }] };

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return new ImportResult { Success = false, Errors = [new ImportError { Row = 0, Column = "", Value = file.FileName, Message = "Invalid file type. Only .xlsx and .xls files are accepted" }] };

        return null;
    }
}
