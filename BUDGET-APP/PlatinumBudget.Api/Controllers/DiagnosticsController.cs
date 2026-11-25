using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

[ApiController]
[Route("api/diagnostics")]
public class DiagnosticsController : ControllerBase
{
    private readonly IConfiguration _config;
    public DiagnosticsController(IConfiguration config) => _config = config;

    [HttpGet("mbm-connection")]
    public async Task<IActionResult> TestMbmConnection()
    {
        var cs = _config.GetConnectionString("MBM");
        if (string.IsNullOrEmpty(cs)) return BadRequest("MBM connection string not configured.");
        try
        {
            await using var conn = new SqlConnection(cs);
            await conn.OpenAsync();
            await using var cmd = new SqlCommand(
                "SELECT TOP 10 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME", conn);
            await using var reader = await cmd.ExecuteReaderAsync();
            var tables = new List<string>();
            while (await reader.ReadAsync()) tables.Add(reader.GetString(0));
            return Ok(new { status = "Connected", database = conn.Database, server = conn.DataSource, tableCount = tables.Count, sampleTables = tables });
        }
        catch (Exception ex)
        {
            return Ok(new { status = "Failed", error = ex.Message });
        }
    }
}
