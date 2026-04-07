namespace IntexBackendApi.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserProfileDto User { get; set; } = new();

    // Set to true when the user has 2FA enabled — no token is returned yet
    public bool Requires2FA { get; set; }

    // Returned alongside Requires2FA=true so the frontend can pass it to verify-2fa
    public string? UserId { get; set; }
}
