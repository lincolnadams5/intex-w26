using IntexBackendApi.DTOs;
using IntexBackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]  // Every endpoint in this controller requires Admin role
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    // GET /api/admin/users
    // Returns all users with their assigned roles.
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();

        var profiles = new List<UserProfileDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            profiles.Add(new UserProfileDto
            {
                Id          = user.Id,
                Email       = user.Email!,
                FullName    = user.FullName,
                Role        = roles.FirstOrDefault() ?? string.Empty,
                SafehouseId = user.SafehouseId,
                SupporterId = user.SupporterId,
                CreatedAt   = user.CreatedAt,
            });
        }

        return Ok(profiles);
    }

    // PUT /api/admin/users/{id}/role
    // Changes the role of a user. Only one role at a time is supported.
    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> ChangeRole(string id, [FromBody] ChangeRoleDto dto)
    {
        var validRoles = new[] { "Admin", "Staff", "Donor" };
        if (!validRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Invalid role. Must be one of: {string.Join(", ", validRoles)}" });

        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(new { message = "User not found" });

        // Remove all existing roles before assigning the new one
        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, dto.Role);

        return Ok(new { message = $"Role updated to {dto.Role}" });
    }

    // PUT /api/admin/users/{id}/deactivate
    // Soft-deactivates a user account (sets IsActive = false).
    [HttpPut("users/{id}/deactivate")]
    public async Task<IActionResult> Deactivate(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(new { message = "User not found" });

        user.IsActive = false;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "User deactivated" });
    }
}

public class ChangeRoleDto
{
    public string Role { get; set; } = string.Empty;
}
