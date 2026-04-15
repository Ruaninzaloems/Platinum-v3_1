using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        return Ok(new
        {
            token = "stub-token-no-auth",
            user = new
            {
                id = 1,
                username = request.Username ?? "admin",
                email = "admin@mnquma.gov.za",
                fullName = "System Administrator",
                role = "admin",
                permissions = new[] { "all" },
                departmentId = 1
            }
        });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = 1,
            username = "admin",
            email = "admin@mnquma.gov.za",
            fullName = "System Administrator",
            role = "admin",
            permissions = new[] { "all" },
            departmentId = 1
        });
    }

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        return Ok(new[]
        {
            new { id = 1, username = "admin", email = "admin@mnquma.gov.za", full_name = "System Administrator", is_active = 1, role_name = "admin", department_id = 1 }
        });
    }

    [HttpGet("roles")]
    public IActionResult GetRoles()
    {
        return Ok(new[]
        {
            new { id = 1, name = "admin", permissions = new[] { "all" } },
            new { id = 2, name = "manager", permissions = new[] { "read", "write", "approve" } },
            new { id = 3, name = "user", permissions = new[] { "read", "write" } }
        });
    }
}

public class LoginRequest
{
    public string? Username { get; set; }
    public string? Password { get; set; }
}
