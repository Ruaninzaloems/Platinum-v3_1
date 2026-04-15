namespace AssetManagement.Models;

public class ImportResult
{
    public bool Success { get; set; }
    public int Imported { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}

public class ImportError
{
    public int Row { get; set; }
    public string Column { get; set; } = "";
    public string? Value { get; set; }
    public string Message { get; set; } = "";
}
