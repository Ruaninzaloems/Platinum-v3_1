namespace PlatinumOvertime_API.DTOs.Responses;

public class EmployeeDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string EmployeeNumber { get; set; } = string.Empty;
    public string EmpCode { get; set; } = string.Empty;
    public string IdNo { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DivisionId { get; set; } = string.Empty;
    public string DivisionName { get; set; } = string.Empty;
    public string PositionId { get; set; } = string.Empty;
    public string PositionDescription { get; set; } = string.Empty;
}

public class PositionDto
{
    public string Id { get; set; } = string.Empty;
    public string PositionCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;

    /// <summary>
    /// Incumbent employee for this position. All four fields are empty
    /// when the position has no current occupant in Payroll_Employee.
    /// </summary>
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeFirstName { get; set; } = string.Empty;
    public string EmployeeSurname { get; set; } = string.Empty;
}

public class DepartmentDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? DivisionName { get; set; }
}
