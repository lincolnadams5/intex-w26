using IntexBackendApi.DTOs;
using IntexBackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _config;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration config)
    {
        _userManager  = userManager;
        _signInManager = signInManager;
        _config        = config;
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

        await _userManager.AddToRoleAsync(user, "Donor");

        var token   = await GenerateJwtTokenAsync(user);
        var profile = await BuildProfileDtoAsync(user);

        return Ok(new AuthResponseDto { Token = token, User = profile });
    }

    // POST /api/auth/login
    // Authenticates the user. If 2FA is enabled, returns Requires2FA=true with no token.
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

        // 2FA check — return a partial response so the client can request the second factor
        if (user.TwoFactorEnabled)
        {
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
    // ⚠️  STUB: Email sending is not yet wired to a real provider.
    //     See intex-resources/user-authentication/2fa-email-provider-setup.md to complete.
    [HttpPost("enable-2fa")]
    [Authorize]
    public async Task<IActionResult> Enable2FA()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user   = await _userManager.FindByIdAsync(userId!);
        if (user is null) return NotFound();

        await _userManager.SetTwoFactorEnabledAsync(user, true);

        // TODO: When email provider is configured, send a confirmation email here.
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
    // ⚠️  STUB: Token generation/validation needs an email provider to actually send codes.
    //     See intex-resources/user-authentication/2fa-email-provider-setup.md to complete.
    [HttpPost("verify-2fa")]
    public async Task<IActionResult> Verify2FA([FromBody] Verify2FADto dto)
    {
        var user = await _userManager.FindByIdAsync(dto.UserId);
        if (user is null)
            return Unauthorized(new { message = "Invalid session" });

        // TODO: Replace with real verification once email provider is wired up.
        // var valid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", dto.Code);
        // if (!valid) return Unauthorized(new { message = "Invalid or expired code" });

        // STUB: accept any 6-digit code for now
        if (dto.Code.Length != 6 || !dto.Code.All(char.IsDigit))
            return Unauthorized(new { message = "Invalid code format" });

        var token   = await GenerateJwtTokenAsync(user);
        var profile = await BuildProfileDtoAsync(user);

        return Ok(new AuthResponseDto { Token = token, User = profile });
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var jwtKey = _config["Jwt:Key"]!;
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FullName),
        };

        // Add each role as a claim so [Authorize(Roles = "...")] works on controllers
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
            Id          = user.Id,
            Email       = user.Email!,
            FullName    = user.FullName,
            Role        = roles.FirstOrDefault() ?? string.Empty,
            SafehouseId = user.SafehouseId,
            SupporterId = user.SupporterId,
            CreatedAt   = user.CreatedAt,
        };
    }
}
