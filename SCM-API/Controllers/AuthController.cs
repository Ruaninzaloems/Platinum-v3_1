using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.DTOs.Requests;
using SCM_API.DTOs.Responses;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrEmpty(request.UserName) || string.IsNullOrEmpty(request.Password))
            return BadRequest(ApiResponse<LoginResponseDto>.Fail("Username and password are required"));

        var result = await _authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(ApiResponse<LoginResponseDto>.Fail("Invalid username or password"));

        return Ok(ApiResponse<LoginResponseDto>.Ok(result, "Login successful"));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Refresh([FromBody] RefreshTokenDto request)
    {
        var result = await _authService.RefreshTokenAsync(request.Token);
        if (result == null)
            return Unauthorized(ApiResponse<LoginResponseDto>.Fail("Invalid or expired token"));

        return Ok(ApiResponse<LoginResponseDto>.Ok(result, "Token refreshed"));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(ApiResponse.Ok("Logged out successfully"));
    }

    [Authorize]
    [HttpGet("users")]
    public ActionResult GetUsers()
        => Ok(new[] {
            new { userId = 1, userName = "admin", name = "System", surname = "Administrator", email = "admin@municipality.gov.za", role = "system_admin", active = true, department = "IT", lastLogin = DateTime.UtcNow.AddHours(-1) }
        });
}
