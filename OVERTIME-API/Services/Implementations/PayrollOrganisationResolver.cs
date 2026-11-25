using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Read-only classification for payroll review. Retains captured labels, using
/// master data only to fill gaps. Never writes inferred values onto transactions.
/// </summary>
internal static class PayrollOrganisationResolver
{
    internal sealed record Organisation(
        int? DepartmentId, string? DepartmentName, int? DivisionId, string? DivisionName);

    internal static Organisation Resolve(
        OvertimeTransaction transaction,
        PayrollPosition? position,
        IReadOnlyDictionary<int, string?> departments,
        IReadOnlyDictionary<int, ConstDivision> divisions)
    {
        var divisionId = transaction.LegacyDivisionId
            ?? UniqueNameId(transaction.LegacyDivisionName, divisions.Select(d => (d.Key, d.Value.DivisionDesc)))
            ?? UniqueNameId(transaction.DivisionName, divisions.Select(d => (d.Key, d.Value.DivisionDesc)))
            ?? position?.DivisionId;
        var division = divisionId.HasValue && divisions.TryGetValue(divisionId.Value, out var foundDivision)
            ? foundDivision : null;
        var divisionName = First(
            transaction.LegacyDivisionName,
            transaction.LegacyDivisionId.HasValue ? division?.DivisionDesc : transaction.DivisionName,
            division?.DivisionDesc);

        var departmentId = transaction.LegacyDepartmentId
            ?? UniqueNameId(transaction.LegacyDepartmentName, departments.Select(d => (d.Key, d.Value)))
            ?? (int.TryParse(transaction.DepartmentId, out var capturedDepartmentId)
                && departments.ContainsKey(capturedDepartmentId) ? capturedDepartmentId : (int?)null)
            ?? UniqueNameId(transaction.DepartmentName, departments.Select(d => (d.Key, d.Value)))
            ?? division?.DepartmentId
            ?? position?.DepartmentId;
        var departmentMasterName = departmentId.HasValue
            && departments.TryGetValue(departmentId.Value, out var foundDepartment) ? foundDepartment : null;
        var departmentName = First(
            transaction.LegacyDepartmentName,
            transaction.LegacyDepartmentId.HasValue ? departmentMasterName : transaction.DepartmentName,
            departmentMasterName);

        return new(departmentId, departmentName, divisionId, divisionName);
    }

    private static string? First(params string?[] values) =>
        values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));

    // Never guess between identically named organisational units.
    private static int? UniqueNameId(string? name, IEnumerable<(int Id, string? Name)> master)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var matches = master.Where(d => string.Equals(d.Name?.Trim(), name.Trim(),
            StringComparison.OrdinalIgnoreCase)).Take(2).ToList();
        return matches.Count == 1 ? matches[0].Id : null;
    }
}
