using IntexBackendApi.DTOs;
using IntexBackendApi.Models;
using IntexBackendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration config,
        IEmailService emailService,
        IHttpClientFactory httpClientFactory)
    {
        _userManager        = userManager;
        _signInManager      = signInManager;
        _config             = config;
        _emailService       = emailService;
        _httpClientFactory  = httpClientFactory;
    }

    // POST /api/auth/register
    // Registers a new user with the Donor role by default.
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing is not null)
            return Conflict(new { message = "Email is already registered" });

        var user = new ApplicationUser
        {
            UserName       = dto.Email,
            Email          = dto.Email,
            FullName       = dto.FullName,
            EmailConfirmed = true,
            IsActive       = true,
            CreatedAt      = DateTime.UtcNow,
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { message = "Registration failed", errors });
        }

        var roleResult = await _userManager.AddToRoleAsync(user, "Donor");
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return StatusCode(500, new { message = "Registration failed: could not assign user role" });
        }

        await _emailService.SendWelcomeEmailAsync(user.Email!, user.FullName);

        var token   = await GenerateJwtTokenAsync(user);
        var profile = await BuildProfileDtoAsync(user);

        return Ok(new AuthResponseDto { Token = token, User = profile });
    }

    // POST /api/auth/login
    // Authenticates the user. If 2FA is enabled, generates a code and emails it,
    // then returns Requires2FA=true with no token.
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "Invalid email or password" });

        // CheckPasswordSignInAsync handles lockout counting automatically
        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return StatusCode(429, new { message = "Account locked due to too many failed attempts. Try again in 15 minutes." });

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid email or password" });

        // 2FA — generate a real token and email it, then return a partial response
        if (user.TwoFactorEnabled)
        {
            var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");
            await _emailService.SendTwoFactorCodeAsync(user.Email!, user.FullName, code);

            return Ok(new AuthResponseDto
            {
                Requires2FA = true,
                UserId      = user.Id,
            });
        }

        var token   = await GenerateJwtTokenAsync(user);
        var profile = await BuildProfileDtoAsync(user);

        return Ok(new AuthResponseDto { Token = token, User = profile });
    }

    // POST /api/auth/logout
    // JWT is stateless — the client drops the token. This endpoint exists for completeness.
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully" });
    }

    // GET /api/auth/me
    // Returns the profile of the currently authenticated user.
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var profile = await BuildProfileDtoAsync(user);
        return Ok(profile);
    }

    // POST /api/auth/enable-2fa
    // Enables two-factor authentication for the current user.
    [HttpPost("enable-2fa")]
    [Authorize]
    public async Task<IActionResult> Enable2FA()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user   = await _userManager.FindByIdAsync(userId!);
        if (user is null) return NotFound();

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { message = "Two-factor authentication enabled. A verification code will be sent to your email on next login." });
    }

    // POST /api/auth/disable-2fa
    // Disables two-factor authentication for the current user.
    [HttpPost("disable-2fa")]
    [Authorize]
    public async Task<IActionResult> Disable2FA()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user   = await _userManager.FindByIdAsync(userId!);
        if (user is null) return NotFound();

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        return Ok(new { message = "Two-factor authentication disabled." });
    }

    // POST /api/auth/verify-2fa
    // Verifies the 2FA code submitted after a Requires2FA login response.
    [HttpPost("verify-2fa")]
    public async Task<IActionResult> Verify2FA([FromBody] Verify2FADto dto)
    {
        var user = await _userManager.FindByIdAsync(dto.UserId);
        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "Invalid session" });

        var valid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", dto.Code);
        if (!valid)
            return Unauthorized(new { message = "Invalid or expired code" });

        var token   = await GenerateJwtTokenAsync(user);
        var profile = await BuildProfileDtoAsync(user);

        return Ok(new AuthResponseDto { Token = token, User = profile });
    }

    // POST /api/auth/forgot-password
    // Generates a password reset token and emails the link.
    // Always returns 200 to prevent email enumeration.
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);

        if (user is not null)
        {
            var resetToken    = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken  = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(resetToken));
            var frontendBase  = _config["FrontendBaseUrl"] ?? "http://localhost:5173";
            var resetLink     = $"{frontendBase}/reset-password?email={Uri.EscapeDataString(user.Email!)}&token={encodedToken}";

            await _emailService.SendPasswordResetAsync(user.Email!, user.FullName, resetLink);
        }

        return Ok(new { message = "If that email exists, a reset link has been sent." });
    }

    // POST /api/auth/reset-password
    // Accepts { email, token, newPassword } and resets the user's password.
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null)
            return BadRequest(new { message = "Invalid request." });

        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(dto.Token));
        var result = await _userManager.ResetPasswordAsync(user, decodedToken, dto.NewPassword);

        if (!result.Succeeded)
            return BadRequest(new { message = "Reset failed.", errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "Password has been reset successfully." });
    }

    // POST /api/auth/google-signin
    // Verifies a Google ID token, then finds or creates the user and returns a JWT.
    // The ID token is produced by @react-oauth/google on the frontend.
    [HttpPost("google-signin")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleCredentialDto dto)
    {
        var googleClientId = _config["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId not configured.");

        // Verify the ID token by calling Google's tokeninfo endpoint
        var http = _httpClientFactory.CreateClient();
        var tokenInfoUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={dto.Credential}";
        var response = await http.GetAsync(tokenInfoUrl);

        if (!response.IsSuccessStatusCode)
            return Unauthorized(new { message = "Invalid Google credential" });

        var payload = await response.Content.ReadFromJsonAsync<GoogleTokenPayload>();

        if (payload is null)
            return Unauthorized(new { message = "Could not parse Google token" });

        // Verify that this token was issued for OUR app (prevents token substitution attacks)
        if (payload.Aud != googleClientId)
            return Unauthorized(new { message = "Token audience mismatch" });

        if (!string.Equals(payload.EmailVerified, "true", StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { message = "Google account email is not verified" });

        // Find existing user or create a new one
        var user = await _userManager.FindByEmailAsync(payload.Email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName       = payload.Email,
                Email          = payload.Email,
                FullName       = !string.IsNullOrWhiteSpace(payload.Name) ? payload.Name : payload.Email,
                EmailConfirmed = true,   // Google has already verified the email
                IsActive       = true,
                CreatedAt      = DateTime.UtcNow,
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                var errors = createResult.Errors.Select(e => e.Description);
                return BadRequest(new { message = "Account creation failed", errors });
            }

            await _userManager.AddToRoleAsync(user, "Donor");
            await _emailService.SendWelcomeEmailAsync(user.Email!, user.FullName);
        }

        if (!user.IsActive)
            return Unauthorized(new { message = "This account has been deactivated" });

        // Google authentication bypasses 2FA — the user has already authenticated with Google
        var token   = await GenerateJwtTokenAsync(user);
        var profile = await BuildProfileDtoAsync(user);

        return Ok(new AuthResponseDto { Token = token, User = profile });
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var roles  = await _userManager.GetRolesAsync(user);
        var jwtKey = _config["Jwt:Key"]!;
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FullName),
        };

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<UserProfileDto> BuildProfileDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserProfileDto
        {
            Id               = user.Id,
            Email            = user.Email!,
            FullName         = user.FullName,
            Role             = roles.FirstOrDefault() ?? string.Empty,
            SafehouseId      = user.SafehouseId,
            SupporterId      = user.SupporterId,
            SocialWorkerCode = user.SocialWorkerCode,
            CreatedAt        = user.CreatedAt,
        };
    }
}
