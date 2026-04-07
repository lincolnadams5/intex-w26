using IntexBackendApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Data;

/// <summary>
/// Seeds roles and default user accounts on startup. Fully idempotent — safe to run repeatedly.
///
/// Seeded accounts:
///   Admin  — admin@pagasasanctuary.com  (no 2FA, for graders)
///   Staff  — one account per safehouse (9 total), linked by SafehouseId
///   Donors — one account per MonetaryDonor in the supporters table, linked by SupporterId
///
/// All seeded passwords: supersecretpassword
/// </summary>
public static class DbSeeder
{
    // 9 staff accounts — one per safehouse (SafehouseId 1–9)
    // Format: <first_initial><last_name>@pagasasanctuary.org
    private static readonly (string FullName, string Email, int SafehouseId)[] StaffAccounts =
    [
        ("Maria Santos",      "msantos@pagasasanctuary.org",     1),
        ("James Reyes",       "jreyes@pagasasanctuary.org",      2),
        ("Ana Cruz",          "acruz@pagasasanctuary.org",       3),
        ("Carlos Mendoza",    "cmendoza@pagasasanctuary.org",    4),
        ("Rosa Garcia",       "rgarcia@pagasasanctuary.org",     5),
        ("Eduardo Torres",    "etorres@pagasasanctuary.org",     6),
        ("Lucia Villanueva",  "lvillanueva@pagasasanctuary.org", 7),
        ("Ramon Pascual",     "rpascual@pagasasanctuary.org",    8),
        ("Elena Aquino",      "eaquino@pagasasanctuary.org",     9),
    ];

    private const string SeedPassword = "supersecretpassword";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db          = services.GetRequiredService<AppDbContext>();
        var logger      = services.GetRequiredService<ILogger<AppDbContext>>();

        // ── 1. Seed roles ────────────────────────────────────────────────────────
        foreach (var role in new[] { "Admin", "Staff", "Donor" })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created role: {Role}", role);
            }
        }

        // ── 2. Seed admin account ────────────────────────────────────────────────
        await CreateUserIfNotExistsAsync(
            userManager, logger,
            email:    "admin@pagasasanctuary.com",
            fullName: "Admin",
            password: SeedPassword,
            role:     "Admin",
            twoFactorEnabled: false  // No 2FA — required for graders
        );

        // ── 3. Seed staff accounts (one per safehouse) ───────────────────────────
        foreach (var (fullName, email, safehouseId) in StaffAccounts)
        {
            await CreateUserIfNotExistsAsync(
                userManager, logger,
                email:       email,
                fullName:    fullName,
                password:    SeedPassword,
                role:        "Staff",
                safehouseId: safehouseId,
                twoFactorEnabled: false
            );
        }

        // ── 4. Seed donor accounts from MonetaryDonors in the supporters table ───
        // Project only the columns we need to avoid type-mapping issues with
        // DateOnly fields stored as timestamp in the existing database.
        var monetaryDonors = await db.Supporters
            .Where(s => s.SupporterType == "MonetaryDonor" && s.Email != null)
            .Select(s => new
            {
                s.SupporterId,
                s.Email,
                s.DisplayName,
                s.FirstName,
                s.LastName,
            })
            .ToListAsync();

        logger.LogInformation("Seeding {Count} MonetaryDonor accounts", monetaryDonors.Count);

        foreach (var supporter in monetaryDonors)
        {
            var fullName = supporter.DisplayName
                ?? $"{supporter.FirstName} {supporter.LastName}".Trim();

            await CreateUserIfNotExistsAsync(
                userManager, logger,
                email:       supporter.Email!,
                fullName:    fullName,
                password:    SeedPassword,
                role:        "Donor",
                supporterId: supporter.SupporterId,
                twoFactorEnabled: false
            );
        }
    }

    private static async Task CreateUserIfNotExistsAsync(
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        string email,
        string fullName,
        string password,
        string role,
        int?   safehouseId      = null,
        int?   supporterId      = null,
        bool   twoFactorEnabled = false)
    {
        // Skip if user with this email already exists
        if (await userManager.FindByEmailAsync(email) is not null)
            return;

        var user = new ApplicationUser
        {
            UserName          = email,
            Email             = email,
            FullName          = fullName,
            SafehouseId       = safehouseId,
            SupporterId       = supporterId,
            TwoFactorEnabled  = twoFactorEnabled,
            EmailConfirmed    = true,   // Skip email confirmation for seeded accounts
            IsActive          = true,
            CreatedAt         = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(user, password);

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(user, role);
            logger.LogInformation("Seeded {Role} user: {Email}", role, email);
        }
        else
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("Failed to seed user {Email}: {Errors}", email, errors);
        }
    }
}
