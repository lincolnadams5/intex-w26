using IntexBackendApi.Data;
using IntexBackendApi.DTOs;
using IntexBackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _db;

    public AdminController(UserManager<ApplicationUser> userManager, AppDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    // ── Risk level ordinal helper ──────────────────────────────────────────────
    private static readonly Dictionary<string, int> RiskOrdinal = new()
    {
        { "Low", 0 }, { "Medium", 1 }, { "High", 2 }, { "Critical", 3 }
    };

    // ── Month label helper (e.g. "Apr 2025") ──────────────────────────────────
    private static string MonthLabel(int year, int month) =>
        new DateOnly(year, month, 1).ToString("MMM yyyy");


    // ═══════════════════════════════════════════════════════════════════════════
    //  USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

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
                IsActive    = user.IsActive,
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

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, dto.Role);

        return Ok(new { message = $"Role updated to {dto.Role}" });
    }

    // PUT /api/admin/users/{id}/deactivate
    // Soft-deactivates a user account.
    [HttpPut("users/{id}/deactivate")]
    public async Task<IActionResult> Deactivate(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(new { message = "User not found" });

        user.IsActive = false;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "User deactivated" });
    }

    // PUT /api/admin/users/{id}/activate
    // Re-activates a previously deactivated user account.
    [HttpPut("users/{id}/activate")]
    public async Task<IActionResult> Activate(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(new { message = "User not found" });

        user.IsActive = true;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "User activated" });
    }

    // DELETE /api/admin/users/{id}
    // Permanently deletes a user account. Use with caution.
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(new { message = "User not found" });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return StatusCode(500, new { message = "Failed to delete user", errors = result.Errors });

        return Ok(new { message = "User deleted" });
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/admin/dashboard/summary
    // Four top-row stat cards for the command center.
    [HttpGet("dashboard/summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var startOfMonth = new DateOnly(today.Year, today.Month, 1);

        var activeResidents = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active");

        var highCriticalRisk = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active" &&
                             (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"));

        var activeDonors = await _db.Supporters
            .CountAsync(s => s.Status == "Active");

        var monthlyDonations = await _db.Donations
            .Where(d => d.DonationType == "Monetary" && d.DonationDate >= startOfMonth)
            .SumAsync(d => d.Amount ?? 0);

        return Ok(new
        {
            activeResidents,
            highCriticalRisk,
            activeDonors,
            monthlyDonationsTotal = monthlyDonations,
        });
    }

    // GET /api/admin/dashboard/activity
    // Unified recent-activity feed — top 10 events across four tables.
    [HttpGet("dashboard/activity")]
    public async Task<IActionResult> GetDashboardActivity()
    {
        // DonationDate is a 'date' column → compare with DateOnly
        var cutoffDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
        // IncidentDate, SessionDate, VisitDate are 'timestamptz' → must be UTC
        var cutoffTs   = DateTime.UtcNow.AddDays(-30);

        // Recent donations joined to supporter display name
        var donations = await _db.Donations
            .Where(d => d.DonationDate >= cutoffDate)
            .Join(_db.Supporters,
                d => d.SupporterId,
                s => s.SupporterId,
                (d, s) => new ActivityItemDto
                {
                    Type   = "donation",
                    Label  = $"{s.DisplayName ?? "Anonymous"} donated",
                    Detail = $"{d.DonationType} — {(d.Amount.HasValue ? $"₱{d.Amount:N0}" : d.EstimatedValue.HasValue ? $"₱{d.EstimatedValue:N0} est." : "—")}",
                    Date   = d.DonationDate!.Value.ToDateTime(TimeOnly.MinValue),
                })
            .OrderByDescending(x => x.Date)
            .Take(5)
            .ToListAsync();

        // Recent incidents joined to resident code
        var incidents = await _db.IncidentReports
            .Where(i => i.IncidentDate >= cutoffTs)
            .Join(_db.Residents,
                i => i.ResidentId,
                r => r.ResidentId,
                (i, r) => new ActivityItemDto
                {
                    Type   = "incident",
                    Label  = $"Incident filed — {r.InternalCode ?? "Unknown"}",
                    Detail = $"{i.IncidentType} · Severity: {i.Severity}",
                    Date   = i.IncidentDate!.Value,
                })
            .OrderByDescending(x => x.Date)
            .Take(5)
            .ToListAsync();

        // Recent process recordings joined to resident code
        var recordings = await _db.ProcessRecordings
            .Where(p => p.SessionDate >= cutoffTs)
            .Join(_db.Residents,
                p => p.ResidentId,
                r => r.ResidentId,
                (p, r) => new ActivityItemDto
                {
                    Type   = "recording",
                    Label  = $"Process recording — {r.InternalCode ?? "Unknown"}",
                    Detail = $"By {p.SocialWorker ?? "Unknown"} · {p.SessionType}",
                    Date   = p.SessionDate!.Value,
                })
            .OrderByDescending(x => x.Date)
            .Take(5)
            .ToListAsync();

        // Recent home visitations joined to resident code
        var visitations = await _db.HomeVisitations
            .Where(v => v.VisitDate >= cutoffTs)
            .Join(_db.Residents,
                v => v.ResidentId,
                r => r.ResidentId,
                (v, r) => new ActivityItemDto
                {
                    Type   = "visitation",
                    Label  = $"Home visitation — {r.InternalCode ?? "Unknown"}",
                    Detail = $"{v.VisitType} · Outcome: {v.VisitOutcome ?? "Pending"}",
                    Date   = v.VisitDate!.Value,
                })
            .OrderByDescending(x => x.Date)
            .Take(5)
            .ToListAsync();

        // Merge, sort descending, take top 10
        var feed = donations
            .Concat(incidents)
            .Concat(recordings)
            .Concat(visitations)
            .OrderByDescending(x => x.Date)
            .Take(10)
            .ToList();

        return Ok(feed);
    }

    // GET /api/admin/dashboard/conferences
    // Upcoming case conferences from intervention plans.
    [HttpGet("dashboard/conferences")]
    public async Task<IActionResult> GetDashboardConferences()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        var conferences = await _db.InterventionPlans
            .Where(ip => ip.CaseConferenceDate >= today)
            .Join(_db.Residents,
                ip => ip.ResidentId,
                r  => r.ResidentId,
                (ip, r) => new
                {
                    residentCode   = r.InternalCode ?? "Unknown",
                    planCategory   = ip.PlanCategory,
                    status         = ip.Status,
                    conferenceDate = ip.CaseConferenceDate,
                })
            .OrderBy(x => x.conferenceDate)
            .Take(10)
            .ToListAsync();

        return Ok(conferences);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  DONORS & CONTRIBUTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/admin/donors/summary
    [HttpGet("donors/summary")]
    public async Task<IActionResult> GetDonorsSummary()
    {
        var totalAllTime = await _db.Donations
            .Where(d => d.DonationType == "Monetary")
            .SumAsync(d => d.Amount ?? 0);

        var totalSupporters   = await _db.Supporters.CountAsync();
        var activeSupporters  = await _db.Supporters.CountAsync(s => s.Status == "Active");
        var inactiveSupporters = await _db.Supporters.CountAsync(s => s.Status == "Inactive");

        var recurringDonors = await _db.Donations
            .Where(d => d.IsRecurring == true)
            .Select(d => d.SupporterId)
            .Distinct()
            .CountAsync();

        return Ok(new
        {
            totalAllTime,
            totalSupporters,
            activeSupporters,
            inactiveSupporters,
            recurringDonors,
        });
    }

    // GET /api/admin/donors/trends
    // Monthly monetary donation totals for the past 12 months.
    [HttpGet("donors/trends")]
    public async Task<IActionResult> GetDonorTrends()
    {
        var today   = DateOnly.FromDateTime(DateTime.Today);
        var cutoff  = new DateOnly(today.Year, today.Month, 1).AddMonths(-11);

        var raw = await _db.Donations
            .Where(d => d.DonationType == "Monetary" && d.DonationDate >= cutoff)
            .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(d => d.Amount ?? 0) })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        var result = raw.Select(x => new { label = MonthLabel(x.Year, x.Month), total = x.Total });
        return Ok(result);
    }

    // GET /api/admin/donors/by-type
    // Donation counts and totals grouped by donation type.
    [HttpGet("donors/by-type")]
    public async Task<IActionResult> GetDonationsByType()
    {
        var result = await _db.Donations
            .Where(d => d.DonationType != null)
            .GroupBy(d => d.DonationType!)
            .Select(g => new
            {
                donationType = g.Key,
                count        = g.Count(),
                total        = g.Sum(d => (d.Amount ?? 0) + (d.EstimatedValue ?? 0)),
            })
            .OrderByDescending(x => x.total)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/donors/by-channel
    // Total monetary amount raised per acquisition channel.
    [HttpGet("donors/by-channel")]
    public async Task<IActionResult> GetDonationsByChannel()
    {
        var result = await _db.Donations
            .Where(d => d.ChannelSource != null && d.DonationType == "Monetary")
            .GroupBy(d => d.ChannelSource!)
            .Select(g => new
            {
                channel = g.Key,
                total   = g.Sum(d => d.Amount ?? 0),
            })
            .OrderByDescending(x => x.total)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/donors/by-campaign
    // Campaign performance: total raised and unique donor count.
    [HttpGet("donors/by-campaign")]
    public async Task<IActionResult> GetDonationsByCampaign()
    {
        var result = await _db.Donations
            .Where(d => d.CampaignName != null && d.DonationType == "Monetary")
            .GroupBy(d => d.CampaignName!)
            .Select(g => new
            {
                campaignName = g.Key,
                total        = g.Sum(d => d.Amount ?? 0),
                donorCount   = g.Select(d => d.SupporterId).Distinct().Count(),
            })
            .OrderByDescending(x => x.total)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/donors/allocations
    // Donation allocations by safehouse and program area (flat — pivot on frontend).
    [HttpGet("donors/allocations")]
    public async Task<IActionResult> GetDonationAllocations()
    {
        var result = await _db.DonationAllocations
            .Join(_db.Safehouses,
                da => da.SafehouseId,
                s  => s.SafehouseId,
                (da, s) => new { da, safehouseName = s.Name ?? "Unknown" })
            .Where(x => x.da.ProgramArea != null)
            .GroupBy(x => new { x.safehouseName, x.da.ProgramArea })
            .Select(g => new
            {
                safehouseName = g.Key.safehouseName,
                programArea   = g.Key.ProgramArea!,
                total         = g.Sum(x => x.da.AmountAllocated ?? 0),
            })
            .OrderBy(x => x.safehouseName)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/donors/recent?page=1&pageSize=5
    // Paginated list of recent donations with supporter display names.
    [HttpGet("donors/recent")]
    public async Task<IActionResult> GetRecentDonations([FromQuery] int page = 1, [FromQuery] int pageSize = 5)
    {
        var query = _db.Donations
            .Join(_db.Supporters,
                d => d.SupporterId,
                s => s.SupporterId,
                (d, s) => new
                {
                    d.DonationId,
                    donorName    = s.DisplayName ?? "Anonymous",
                    donationType = d.DonationType ?? "—",
                    amount       = d.Amount ?? d.EstimatedValue ?? 0,
                    donationDate = d.DonationDate,
                    campaignName = d.CampaignName ?? "—",
                    channelSource = d.ChannelSource ?? "—",
                    isRecurring  = d.IsRecurring ?? false,
                })
            .OrderByDescending(x => x.donationDate);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, items });
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  RESIDENTS & CASE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/admin/residents/summary
    [HttpGet("residents/summary")]
    public async Task<IActionResult> GetResidentsSummary()
    {
        var activeResidents = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active");

        var highCriticalRisk = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active" &&
                             (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"));

        var reintegrationInProgress = await _db.Residents
            .CountAsync(r => r.ReintegrationStatus == "In Progress");

        var unresolvedHighIncidents = await _db.IncidentReports
            .CountAsync(i => i.Severity == "High" && i.Resolved == false);

        return Ok(new
        {
            activeResidents,
            highCriticalRisk,
            reintegrationInProgress,
            unresolvedHighIncidents,
        });
    }

    // GET /api/admin/residents/list
    // Full resident table with optional filters + readiness score (graceful if table missing).
    [HttpGet("residents/list")]
    public async Task<IActionResult> GetResidentsList(
        [FromQuery] string? status = "Active",
        [FromQuery] int? safehouseId = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] string? reintegrationType = null,
        [FromQuery] string? reintegrationStatus = null,
        [FromQuery] string? search = null)
    {
        // Step 1 — fetch matching residents joined with their safehouse name
        var rows = await _db.Residents
            .Where(r => (status == null || r.CaseStatus == status)
                     && (!safehouseId.HasValue || r.SafehouseId == safehouseId)
                     && (riskLevel == null || r.CurrentRiskLevel == riskLevel)
                     && (reintegrationType == null || r.ReintegrationType == reintegrationType)
                     && (reintegrationStatus == null || r.ReintegrationStatus == reintegrationStatus)
                     && (search == null || (r.InternalCode != null && r.InternalCode.Contains(search)))
                     && r.SafehouseId.HasValue)
            .Join(_db.Safehouses,
                r => r.SafehouseId!.Value,
                s => s.SafehouseId,
                (r, s) => new
                {
                    r.ResidentId,
                    internalCode         = r.InternalCode ?? "Unknown",
                    safehouseName        = s.Name ?? "Unknown",
                    caseStatus           = r.CaseStatus ?? "—",
                    r.CurrentRiskLevel,
                    r.ReintegrationType,
                    r.ReintegrationStatus,
                    r.AssignedSocialWorker,
                    r.LengthOfStay,
                })
            .OrderBy(r => r.internalCode)
            .ToListAsync();

        // Step 2 — try to fetch readiness scores; degrade gracefully if table absent
        Dictionary<int, ResidentReintegrationScore> scoreMap = new();
        try
        {
            var ids    = rows.Select(r => r.ResidentId).ToList();
            var scores = await _db.ResidentReintegrationScores
                .Where(sc => ids.Contains(sc.ResidentId))
                .ToListAsync();
            scoreMap = scores.ToDictionary(sc => sc.ResidentId);
        }
        catch { /* resident_reintegration_scores table not yet created — scores will be null */ }

        // Step 3 — merge and return
        var result = rows.Select(r =>
        {
            scoreMap.TryGetValue(r.ResidentId, out var sc);
            return new
            {
                residentId           = r.ResidentId,
                internalCode         = r.internalCode,
                safehouseName        = r.safehouseName,
                caseStatus           = r.caseStatus,
                currentRiskLevel     = r.CurrentRiskLevel,
                reintegrationType    = r.ReintegrationType,
                reintegrationStatus  = r.ReintegrationStatus,
                assignedSocialWorker = r.AssignedSocialWorker,
                lengthOfStay         = r.LengthOfStay,
                readinessBand        = sc?.ReadinessBand,
                readinessFlag        = sc?.ReadinessBand == "Ready for Review"
                                       && r.ReintegrationStatus == "In Progress",
            };
        });

        return Ok(result);
    }

    // GET /api/admin/residents/alerts
    // Three alert types: risk escalations, unresolved High incidents, no recent recording.
    [HttpGet("residents/alerts")]
    public async Task<IActionResult> GetResidentAlerts()
    {
        // 1. Risk escalations (current risk > initial risk for active residents)
        var allActive = await _db.Residents
            .Where(r => r.CaseStatus == "Active" &&
                        r.InitialRiskLevel != null &&
                        r.CurrentRiskLevel != null &&
                        r.SafehouseId.HasValue)
            .Join(_db.Safehouses,
                r => r.SafehouseId!.Value,
                s => s.SafehouseId,
                (r, s) => new
                {
                    internalCode     = r.InternalCode ?? "Unknown",
                    safehouseName    = s.Name ?? "Unknown",
                    initialRiskLevel = r.InitialRiskLevel!,
                    currentRiskLevel = r.CurrentRiskLevel!,
                    lengthOfStay     = r.LengthOfStay ?? "—",
                })
            .ToListAsync();

        var riskEscalations = allActive
            .Where(r =>
                RiskOrdinal.TryGetValue(r.currentRiskLevel, out int curr) &&
                RiskOrdinal.TryGetValue(r.initialRiskLevel, out int init) &&
                curr > init)
            .OrderByDescending(r =>
                RiskOrdinal.TryGetValue(r.currentRiskLevel, out int curr) ? curr : 0)
            .ToList();

        // 2. Unresolved High incidents
        var unresolvedHighIncidents = await _db.IncidentReports
            .Where(i => i.Severity == "High" && i.Resolved == false)
            .Join(_db.Residents,
                i => i.ResidentId,
                r => r.ResidentId,
                (i, r) => new { i, residentCode = r.InternalCode ?? "Unknown" })
            .Join(_db.Safehouses,
                x => x.i.SafehouseId,
                s => s.SafehouseId,
                (x, s) => new
                {
                    x.i.IncidentId,
                    residentCode  = x.residentCode,
                    safehouseName = s.Name ?? "Unknown",
                    incidentDate  = x.i.IncidentDate,
                    incidentType  = x.i.IncidentType ?? "—",
                })
            .OrderByDescending(x => x.incidentDate)
            .Take(20)
            .ToListAsync();

        // 3. Active residents with no process recording in the last 30 days
        var cutoff = DateTime.UtcNow.AddDays(-30);

        var recentlyRecordedIds = await _db.ProcessRecordings
            .Where(p => p.SessionDate >= cutoff)
            .Select(p => p.ResidentId)
            .Distinct()
            .ToListAsync();

        var noRecentRecording = await _db.Residents
            .Where(r => r.CaseStatus == "Active" &&
                        r.SafehouseId.HasValue &&
                        !recentlyRecordedIds.Contains(r.ResidentId))
            .Join(_db.Safehouses,
                r => r.SafehouseId!.Value,
                s => s.SafehouseId,
                (r, s) => new
                {
                    residentId    = r.ResidentId,
                    internalCode  = r.InternalCode ?? "Unknown",
                    safehouseName = s.Name ?? "Unknown",
                })
            .OrderBy(x => x.internalCode)
            .ToListAsync();

        return Ok(new { riskEscalations, unresolvedHighIncidents, noRecentRecording });
    }

    // GET /api/admin/safehouses/overview
    // Each safehouse with occupancy and the latest month's metrics.
    [HttpGet("safehouses/overview")]
    public async Task<IActionResult> GetSafehousesOverview()
    {
        var safehouses = await _db.Safehouses.ToListAsync();

        // Pull all metrics, then get the most recent per safehouse in memory
        var allMetrics = await _db.SafehouseMonthlyMetrics
            .OrderByDescending(m => m.MonthStart)
            .ToListAsync();

        var latestMetrics = allMetrics
            .GroupBy(m => m.SafehouseId)
            .ToDictionary(g => g.Key, g => g.First());

        var result = safehouses.Select(s =>
        {
            latestMetrics.TryGetValue(s.SafehouseId, out var m);
            return new
            {
                safehouseId          = s.SafehouseId,
                name                 = s.Name ?? "Unknown",
                region               = s.Region ?? "—",
                capacity             = s.CapacityGirls ?? 0,
                occupancy            = s.CurrentOccupancy ?? 0,
                avgEducationProgress = m?.AvgEducationProgress,
                avgHealthScore       = m?.AvgHealthScore,
                processRecordingCount = m?.ProcessRecordingCount,
                incidentCount        = m?.IncidentCount,
            };
        });

        return Ok(result);
    }

    // GET /api/admin/residents/risk-by-safehouse
    // Active resident count per risk level per safehouse (for stacked bar).
    [HttpGet("residents/risk-by-safehouse")]
    public async Task<IActionResult> GetRiskBySafehouse()
    {
        var data = await _db.Residents
            .Where(r => r.CaseStatus == "Active" && r.SafehouseId.HasValue && r.CurrentRiskLevel != null)
            .Join(_db.Safehouses,
                r => r.SafehouseId!.Value,
                s => s.SafehouseId,
                (r, s) => new { safehouseName = s.Name ?? "Unknown", r.CurrentRiskLevel })
            .ToListAsync();

        var result = data
            .GroupBy(x => x.safehouseName)
            .Select(g => new
            {
                safehouseName = g.Key,
                Low      = g.Count(x => x.CurrentRiskLevel == "Low"),
                Medium   = g.Count(x => x.CurrentRiskLevel == "Medium"),
                High     = g.Count(x => x.CurrentRiskLevel == "High"),
                Critical = g.Count(x => x.CurrentRiskLevel == "Critical"),
            })
            .OrderBy(x => x.safehouseName)
            .ToList();

        return Ok(result);
    }

    // GET /api/admin/residents/risk-escalations
    // Residents whose current risk level is higher than their intake assessment.
    [HttpGet("residents/risk-escalations")]
    public async Task<IActionResult> GetRiskEscalations()
    {
        var residents = await _db.Residents
            .Where(r => r.CaseStatus == "Active" &&
                        r.InitialRiskLevel != null &&
                        r.CurrentRiskLevel != null &&
                        r.SafehouseId.HasValue)
            .Join(_db.Safehouses,
                r => r.SafehouseId!.Value,
                s => s.SafehouseId,
                (r, s) => new
                {
                    internalCode    = r.InternalCode ?? "Unknown",
                    safehouseName   = s.Name ?? "Unknown",
                    initialRiskLevel = r.InitialRiskLevel!,
                    currentRiskLevel = r.CurrentRiskLevel!,
                    lengthOfStay    = r.LengthOfStay ?? "—",
                })
            .ToListAsync();

        // Filter in memory where current ordinal > initial ordinal
        var escalations = residents
            .Where(r =>
                RiskOrdinal.TryGetValue(r.currentRiskLevel, out int curr) &&
                RiskOrdinal.TryGetValue(r.initialRiskLevel, out int init) &&
                curr > init)
            .OrderByDescending(r =>
                RiskOrdinal.TryGetValue(r.currentRiskLevel, out int curr) ? curr : 0)
            .ToList();

        return Ok(escalations);
    }

    // GET /api/admin/process-recordings/recent
    // Process recordings from the past 7 days.
    [HttpGet("process-recordings/recent")]
    public async Task<IActionResult> GetRecentProcessRecordings()
    {
        // SessionDate is stored as timestamptz — must be UTC
        var cutoff = DateTime.UtcNow.AddDays(-7);

        var result = await _db.ProcessRecordings
            .Where(p => p.SessionDate >= cutoff)
            .Join(_db.Residents,
                p => p.ResidentId,
                r => r.ResidentId,
                (p, r) => new
                {
                    p.RecordingId,
                    residentCode          = r.InternalCode ?? "Unknown",
                    sessionDate           = p.SessionDate,
                    socialWorker          = p.SocialWorker ?? "—",
                    sessionType           = p.SessionType ?? "—",
                    emotionalStateObserved = p.EmotionalStateObserved ?? "—",
                    emotionalStateEnd     = p.EmotionalStateEnd ?? "—",
                    concernsFlagged       = p.ConcernsFlagged ?? false,
                })
            .OrderByDescending(x => x.sessionDate)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/incidents/recent
    // Incident reports from the past 14 days.
    [HttpGet("incidents/recent")]
    public async Task<IActionResult> GetRecentIncidents()
    {
        // IncidentDate is stored as timestamptz — must be UTC
        var cutoff = DateTime.UtcNow.AddDays(-14);

        var result = await _db.IncidentReports
            .Where(i => i.IncidentDate >= cutoff)
            .Join(_db.Residents,
                i => i.ResidentId,
                r => r.ResidentId,
                (i, r) => new { i, residentCode = r.InternalCode ?? "Unknown" })
            .Join(_db.Safehouses,
                x => x.i.SafehouseId,
                s => s.SafehouseId,
                (x, s) => new
                {
                    x.i.IncidentId,
                    residentCode    = x.residentCode,
                    safehouseName   = s.Name ?? "Unknown",
                    incidentDate    = x.i.IncidentDate,
                    incidentType    = x.i.IncidentType ?? "—",
                    severity        = x.i.Severity ?? "—",
                    resolved        = x.i.Resolved ?? false,
                    followUpRequired = x.i.FollowUpRequired ?? false,
                })
            .OrderByDescending(x => x.incidentDate)
            .ToListAsync();

        return Ok(result);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  SOCIAL MEDIA ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/admin/social/summary
    [HttpGet("social/summary")]
    public async Task<IActionResult> GetSocialSummary()
    {
        var totalPosts = await _db.SocialMediaPosts.CountAsync();

        // Use nullable overload so an empty set returns null instead of throwing
        var avgEngagementRate = await _db.SocialMediaPosts
            .Where(p => p.EngagementRate.HasValue)
            .AverageAsync(p => p.EngagementRate) ?? 0;

        var totalReferrals = await _db.SocialMediaPosts
            .SumAsync(p => p.DonationReferrals ?? 0);

        var totalReferralValue = await _db.SocialMediaPosts
            .SumAsync(p => p.EstimatedDonationValuePhp ?? 0);

        return Ok(new
        {
            totalPosts,
            avgEngagementRate = Math.Round(avgEngagementRate, 2),
            totalReferrals,
            totalReferralValue,
        });
    }

    // GET /api/admin/social/by-platform
    // Average engagement rate per platform.
    [HttpGet("social/by-platform")]
    public async Task<IActionResult> GetSocialByPlatform()
    {
        var result = await _db.SocialMediaPosts
            .Where(p => p.Platform != null && p.EngagementRate.HasValue)
            .GroupBy(p => p.Platform!)
            .Select(g => new
            {
                platform          = g.Key,
                avgEngagementRate = g.Average(p => p.EngagementRate!.Value),
                postCount         = g.Count(),
            })
            .OrderByDescending(x => x.avgEngagementRate)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/social/by-post-type
    // Average engagement rate per post type.
    [HttpGet("social/by-post-type")]
    public async Task<IActionResult> GetSocialByPostType()
    {
        var result = await _db.SocialMediaPosts
            .Where(p => p.PostType != null && p.EngagementRate.HasValue)
            .GroupBy(p => p.PostType!)
            .Select(g => new
            {
                postType          = g.Key,
                avgEngagementRate = g.Average(p => p.EngagementRate!.Value),
                postCount         = g.Count(),
            })
            .OrderByDescending(x => x.avgEngagementRate)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/social/by-content-topic
    // Average engagement rate per content topic.
    [HttpGet("social/by-content-topic")]
    public async Task<IActionResult> GetSocialByContentTopic()
    {
        var result = await _db.SocialMediaPosts
            .Where(p => p.ContentTopic != null && p.EngagementRate.HasValue)
            .GroupBy(p => p.ContentTopic!)
            .Select(g => new
            {
                contentTopic      = g.Key,
                avgEngagementRate = g.Average(p => p.EngagementRate!.Value),
                postCount         = g.Count(),
            })
            .OrderByDescending(x => x.avgEngagementRate)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/social/referral-trend
    // Monthly donation referrals vs post count for the last 6 months.
    [HttpGet("social/referral-trend")]
    public async Task<IActionResult> GetSocialReferralTrend()
    {
        var cutoff = new DateOnly(
            DateTime.Today.Year,
            DateTime.Today.Month,
            1
        ).AddMonths(-5);

        var raw = await _db.SocialMediaPosts
            .Where(p => p.CreatedAt >= cutoff.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc))
            .GroupBy(p => new { p.CreatedAt!.Value.Year, p.CreatedAt!.Value.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                totalReferrals = g.Sum(p => p.DonationReferrals ?? 0),
                postCount      = g.Count(),
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        var result = raw.Select(x => new
        {
            label          = MonthLabel(x.Year, x.Month),
            totalReferrals = x.totalReferrals,
            postCount      = x.postCount,
        });

        return Ok(result);
    }

    // GET /api/admin/social/posting-heatmap
    // Average engagement rate grouped by day-of-week and 3-hour bucket.
    [HttpGet("social/posting-heatmap")]
    public async Task<IActionResult> GetSocialPostingHeatmap()
    {
        var raw = await _db.SocialMediaPosts
            .Where(p => p.DayOfWeek != null && p.PostHour.HasValue && p.EngagementRate.HasValue)
            .Select(p => new
            {
                p.DayOfWeek,
                HourBucket        = p.PostHour!.Value / 3,
                EngagementRate    = p.EngagementRate!.Value,
            })
            .ToListAsync();

        var result = raw
            .GroupBy(x => new { x.DayOfWeek, x.HourBucket })
            .Select(g => new
            {
                day               = g.Key.DayOfWeek,
                hourBucket        = g.Key.HourBucket,
                avgEngagementRate = Math.Round(g.Average(x => x.EngagementRate), 2),
            })
            .OrderBy(x => x.day)
            .ThenBy(x => x.hourBucket)
            .ToList();

        return Ok(result);
    }

    // GET /api/admin/social/top-posts
    // Top performing posts sorted by engagement rate descending.
    [HttpGet("social/top-posts")]
    public async Task<IActionResult> GetSocialTopPosts()
    {
        var result = await _db.SocialMediaPosts
            .Where(p => p.EngagementRate.HasValue)
            .OrderByDescending(p => p.EngagementRate)
            .Take(50)
            .Select(p => new
            {
                p.PostId,
                platform              = p.Platform ?? "—",
                postType              = p.PostType ?? "—",
                contentTopic          = p.ContentTopic ?? "—",
                createdAt             = p.CreatedAt,
                engagementRate        = p.EngagementRate,
                impressions           = p.Impressions ?? 0,
                reach                 = p.Reach ?? 0,
                likes                 = p.Likes ?? 0,
                shares                = p.Shares ?? 0,
                donationReferrals     = p.DonationReferrals ?? 0,
                estimatedDonationValue = p.EstimatedDonationValuePhp ?? 0,
            })
            .ToListAsync();

        return Ok(result);
    }
}


// ── Shared DTO used by the activity feed ──────────────────────────────────────
public class ActivityItemDto
{
    public string Type   { get; set; } = string.Empty;
    public string Label  { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

// ── DTO for role changes (kept here with the controller that uses it) ─────────
public class ChangeRoleDto
{
    public string Role { get; set; } = string.Empty;
}
