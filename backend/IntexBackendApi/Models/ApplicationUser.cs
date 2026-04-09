using Microsoft.AspNetCore.Identity;

namespace IntexBackendApi.Models;

/// <summary>
/// Extends IdentityUser with application-specific fields.
/// SafehouseId: populated for Staff — determines which safehouse's data they can access.
/// SupporterId: populated for Donors — links to their record in the supporters table.
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Null for Admin and Donor accounts
    public int? SafehouseId { get; set; }

    // Null for Admin and Staff accounts
    public int? SupporterId { get; set; }

    // SW-XX code for social workers (Staff only); null for Admin and Donor accounts
    public string? SocialWorkerCode { get; set; }
}
