using Microsoft.AspNetCore.Mvc;
using IntexBackendApi.Models;
using IntexBackendApi.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var user = await _authService.RegisterUserAsync(request);

        if (user == null)
            return BadRequest("Email already registered");

        var token = _authService.GenerateJwtToken(user);

        return Ok(new { user, token });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _authService.ValidateUserAsync(request.Email, request.Password);

        if (user == null)
            return Unauthorized("Invalid email or password");

        var token = _authService.GenerateJwtToken(user);

        return Ok(new { user, token });
    }

    // 🔐 TEST ENDPOINT
    [HttpGet("secure")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public IActionResult Secure()
    {
        return Ok("You are authenticated");
    }
}