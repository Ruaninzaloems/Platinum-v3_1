using SCM_API.DTOs.Requests;
using SCM_API.DTOs.Responses;

namespace SCM_API.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto?> RefreshTokenAsync(string token);
}
