using IntexBackendApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Data;

/// <summary>
/// Seeds roles and default user accounts on startup. Fully idempotent — safe to run repeatedly.
///
/// Seeded accounts:
///   Admin  — admin@pagasasanctuary.com  (no 2FA, for graders)
///   Staff  — 20 social workers (SW-01 through SW-20) distributed across 9 safehouses
///            proportional to each safehouse's staff capacity.
///   Donors — one account per MonetaryDonor in the supporters table, linked by SupporterId
///
/// Safehouse distribution (capacity → staff count):
///   SH01 cap 4 → 2 staff: SW-01, SW-10
///   SH02 cap 5 → 2 staff: SW-02, SW-11
///   SH03 cap 4 → 2 staff: SW-03, SW-12
///   SH04 cap 4 → 2 staff: SW-04, SW-13
///   SH05 cap 4 → 2 staff: SW-05, SW-14
///   SH06 cap 5 → 2 staff: SW-06, SW-15
///   SH07 cap 4 → 2 staff: SW-07, SW-16
///   SH08 cap 7 → 4 staff: SW-08, SW-17, SW-18, SW-19  (largest safehouse)
///   SH09 cap 3 → 2 staff: SW-09, SW-20
///
/// All seeded passwords: supersecretpassword
///
/// Role assignment uses db.Database.ExecuteSqlRawAsync instead of UserManager.AddToRoleAsync
/// to avoid the EF 10 + Npgsql ObjectDisposedException caused by batched command execution.
/// </summary>
public static class DbSeeder
{
    // 20 staff accounts — (FullName, Email, SafehouseId, SocialWorkerCode)
    // SW-01 through SW-09 are the original 9; SW-10 through SW-20 are new.
    private static readonly (string FullName, string Email, int SafehouseId, string SocialWorkerCode)[] StaffAccounts =
    [
        // SH01 (cap 4) — 2 staff
        ("Maria Santos",        "msantos@pagasasanctuary.org",      1, "SW-01"),
        ("Florante Aguilar",    "faguilar@pagasasanctuary.org",     1, "SW-10"),

        // SH02 (cap 5) — 2 staff
        ("James Reyes",         "jreyes@pagasasanctuary.org",       2, "SW-02"),
        ("Marites Domingo",     "mdomingo@pagasasanctuary.org",     2, "SW-11"),

        // SH03 (cap 4) — 2 staff
        ("Ana Cruz",            "acruz@pagasasanctuary.org",        3, "SW-03"),
        ("Renato Dela Cruz",    "rdelacruz@pagasasanctuary.org",    3, "SW-12"),

        // SH04 (cap 4) — 2 staff
        ("Carlos Mendoza",      "cmendoza@pagasasanctuary.org",     4, "SW-04"),
        ("Cecilia Bautista",    "cbautista@pagasasanctuary.org",    4, "SW-13"),

        // SH05 (cap 4) — 2 staff
        ("Rosa Garcia",         "rgarcia@pagasasanctuary.org",      5, "SW-05"),
        ("Fernando Castillo",   "fcastillo@pagasasanctuary.org",    5, "SW-14"),

        // SH06 (cap 5) — 2 staff
        ("Eduardo Torres",      "etorres@pagasasanctuary.org",      6, "SW-06"),
        ("Natividad Rosario",   "nrosario@pagasasanctuary.org",     6, "SW-15"),

        // SH07 (cap 4) — 2 staff
        ("Lucia Villanueva",    "lvillanueva@pagasasanctuary.org",  7, "SW-07"),
        ("Alejandro Panganiban","apanganiban@pagasasanctuary.org",  7, "SW-16"),

        // SH08 (cap 7) — 4 staff (largest safehouse)
        ("Ramon Pascual",       "rpascual@pagasasanctuary.org",     8, "SW-08"),
        ("Corazon Espinosa",    "cespinosa@pagasasanctuary.org",    8, "SW-17"),
        ("Benedict Navarro",    "bnavarro@pagasasanctuary.org",     8, "SW-18"),
        ("Esperanza Lim",       "elim@pagasasanctuary.org",         8, "SW-19"),

        // SH09 (cap 3) — 2 staff
        ("Elena Aquino",        "eaquino@pagasasanctuary.org",      9, "SW-09"),
        ("Salvador Manalo",     "smanalo@pagasasanctuary.org",      9, "SW-20"),
    ];

    private const string SeedPassword = "supersecretpassword";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db          = services.GetRequiredService<AppDbContext>();
        var logger      = services.GetRequiredService<ILogger<AppDbContext>>();

        // ── 1. Seed roles ────────────────────────────────────────────────────────
        foreach (var roleName in new[] { "Admin", "Staff", "Donor" })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
                logger.LogInformation("Created role: {Role}", roleName);
            }
        }

        // Look up role IDs once — used for direct SQL INSERT to bypass AddToRoleAsync batching.
        var roleIds = new Dictionary<string, string>();
        foreach (var roleName in new[] { "Admin", "Staff", "Donor" })
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role is not null)
                roleIds[roleName] = role.Id;
        }

        // ── 2. Seed admin account ────────────────────────────────────────────────
        await CreateUserIfNotExistsAsync(
            userManager, db, logger,
            email:            "admin@pagasasanctuary.com",
            fullName:         "Admin",
            password:         SeedPassword,
            roleId:           roleIds["Admin"],
            twoFactorEnabled: false  // No 2FA — required for graders
        );

        // ── 3. Seed staff accounts (20 total, SW-01 through SW-20) ───────────────
        foreach (var (fullName, email, safehouseId, swCode) in StaffAccounts)
        {
            await CreateOrUpdateStaffAsync(
                userManager, db, logger,
                email:            email,
                fullName:         fullName,
                safehouseId:      safehouseId,
                socialWorkerCode: swCode,
                staffRoleId:      roleIds["Staff"]
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
                userManager, db, logger,
                email:            supporter.Email!,
                fullName:         fullName,
                password:         SeedPassword,
                roleId:           roleIds["Donor"],
                supporterId:      supporter.SupporterId,
                twoFactorEnabled: false
            );
        }
    }

    /// <summary>
    /// Inserts a role assignment directly via EF Core raw SQL, bypassing UserManager.AddToRoleAsync.
    /// AddToRoleAsync uses EF's command batching which triggers an ObjectDisposedException in
    /// Npgsql after many sequential Identity operations.
    /// </summary>
    private static Task InsertUserRoleAsync(AppDbContext db, string userId, string roleId)
        => db.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO "AspNetUserRoles" (user_id, role_id)
            VALUES ({0}, {1})
            ON CONFLICT DO NOTHING
            """,
            userId, roleId);

    /// <summary>
    /// Creates a staff user if they don't exist, or updates their SocialWorkerCode if they do.
    /// This ensures existing staff (seeded before the SW code column existed) get their code assigned.
    /// </summary>
    private static async Task CreateOrUpdateStaffAsync(
        UserManager<ApplicationUser> userManager,
        AppDbContext db,
        ILogger logger,
        string email,
        string fullName,
        int    safehouseId,
        string socialWorkerCode,
        string staffRoleId)
    {
        var existing = await userManager.FindByEmailAsync(email);

        if (existing is not null)
        {
            // User already exists — update SW code if not yet set
            if (existing.SocialWorkerCode != socialWorkerCode)
            {
                existing.SocialWorkerCode = socialWorkerCode;
                var updateResult = await userManager.UpdateAsync(existing);
                if (updateResult.Succeeded)
                    logger.LogInformation("Updated SocialWorkerCode for {Email}: {Code}", email, socialWorkerCode);
                else
                    logger.LogWarning("Failed to update SocialWorkerCode for {Email}", email);
            }

            // Also ensure the role is assigned (in case a prior run created the user but crashed before adding the role)
            await InsertUserRoleAsync(db, existing.Id, staffRoleId);
            return;
        }

        // New user — create with SW code, then assign role via raw SQL
        var user = new ApplicationUser
        {
            UserName         = email,
            Email            = email,
            FullName         = fullName,
            SafehouseId      = safehouseId,
            SocialWorkerCode = socialWorkerCode,
            TwoFactorEnabled = false,
            EmailConfirmed   = true,
            IsActive         = true,
            CreatedAt        = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(user, SeedPassword);

        if (result.Succeeded)
        {
            await InsertUserRoleAsync(db, user.Id, staffRoleId);
            logger.LogInformation("Seeded Staff user: {Email} ({Code})", email, socialWorkerCode);
        }
        else
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("Failed to seed staff user {Email}: {Errors}", email, errors);
        }
    }

    private static async Task CreateUserIfNotExistsAsync(
        UserManager<ApplicationUser> userManager,
        AppDbContext db,
        ILogger logger,
        string email,
        string fullName,
        string password,
        string roleId,
        int?   safehouseId      = null,
        int?   supporterId      = null,
        bool   twoFactorEnabled = false)
    {
        // Skip if user with this email already exists
        if (await userManager.FindByEmailAsync(email) is not null)
            return;

        var user = new ApplicationUser
        {
            UserName         = email,
            Email            = email,
            FullName         = fullName,
            SafehouseId      = safehouseId,
            SupporterId      = supporterId,
            TwoFactorEnabled = twoFactorEnabled,
            EmailConfirmed   = true,   // Skip email confirmation for seeded accounts
            IsActive         = true,
            CreatedAt        = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(user, password);

        if (result.Succeeded)
        {
            await InsertUserRoleAsync(db, user.Id, roleId);
            logger.LogInformation("Seeded user: {Email}", email);
        }
        else
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("Failed to seed user {Email}: {Errors}", email, errors);
        }
    }
}
