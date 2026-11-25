namespace PlatinumOvertime_API.DTOs.Requests;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword     { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Username    { get; set; } = string.Empty;
    public string IdNumber    { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
