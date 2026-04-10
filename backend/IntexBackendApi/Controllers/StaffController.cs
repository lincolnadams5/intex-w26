using IntexBackendApi.Data;
using IntexBackendApi.DTOs;
using IntexBackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Policy = "StaffOrAdmin")]
public class StaffController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _db;

    public StaffController(UserManager<ApplicationUser> userManager, AppDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/staff/dashboard/summary
    // Safehouse-scoped stat cards + myRecordingsThisMonth for the logged-in user.
    [HttpGet("dashboard/summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nowUtc = DateTime.UtcNow;

        var activeResidents = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active" && r.SafehouseId == safehouseId);

        var highCriticalRisk = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active" &&
                             r.SafehouseId == safehouseId &&
                             (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"));

        // "My recordings this month" — filter by the logged-in user's SW code
        var myRecordingsThisMonth = user?.SocialWorkerCode is not null
            ? await _db.ProcessRecordings
                .Join(_db.Residents,
                    p => p.ResidentId,
                    r => r.ResidentId,
                    (p, r) => new { p, r })
                .CountAsync(x =>
                    x.r.SafehouseId == safehouseId &&
                    x.p.SocialWorker == user.SocialWorkerCode &&
                    x.p.SessionDate >= startOfMonth)
            : 0;

        var upcomingConferences = await _db.InterventionPlans
            .Join(_db.Residents,
                ip => ip.ResidentId,
                r  => r.ResidentId,
                (ip, r) => new { ip, r })
            .CountAsync(x =>
                x.r.SafehouseId == safehouseId &&
                x.ip.CaseConferenceDate >= nowUtc);

        return Ok(new
        {
            activeResidents,
            highCriticalRisk,
            myRecordingsThisMonth,
            upcomingConferences,
        });
    }

    // GET /api/staff/dashboard/activity
    // Activity feed scoped to the staff user's safehouse (no donor events).
    [HttpGet("dashboard/activity")]
    public async Task<IActionResult> GetDashboardActivity()
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        var cutoff = DateTime.UtcNow.AddDays(-30);

        // Incidents at this safehouse
        var incidents = await _db.IncidentReports
            .Where(i => i.SafehouseId == safehouseId && i.IncidentDate >= cutoff)
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

        // Process recordings for residents at this safehouse
        var recordings = await _db.ProcessRecordings
            .Where(p => p.SessionDate >= cutoff)
            .Join(_db.Residents,
                p => p.ResidentId,
                r => r.ResidentId,
                (p, r) => new { p, r })
            .Where(x => x.r.SafehouseId == safehouseId)
            .Select(x => new ActivityItemDto
            {
                Type   = "recording",
                Label  = $"Process recording — {x.r.InternalCode ?? "Unknown"}",
                Detail = $"By {x.p.SocialWorker ?? "Unknown"} · {x.p.SessionType}",
                Date   = x.p.SessionDate!.Value,
            })
            .OrderByDescending(x => x.Date)
            .Take(5)
            .ToListAsync();

        // Home visitations for residents at this safehouse
        var visitations = await _db.HomeVisitations
            .Where(v => v.VisitDate >= cutoff)
            .Join(_db.Residents,
                v => v.ResidentId,
                r => r.ResidentId,
                (v, r) => new { v, r })
            .Where(x => x.r.SafehouseId == safehouseId)
            .Select(x => new ActivityItemDto
            {
                Type   = "visitation",
                Label  = $"Home visitation — {x.r.InternalCode ?? "Unknown"}",
                Detail = $"{x.v.VisitType} · Outcome: {x.v.VisitOutcome ?? "Pending"}",
                Date   = x.v.VisitDate!.Value,
            })
            .OrderByDescending(x => x.Date)
            .Take(5)
            .ToListAsync();

        var feed = incidents
            .Concat(recordings)
            .Concat(visitations)
            .OrderByDescending(x => x.Date)
            .Take(10)
            .ToList();

        return Ok(feed);
    }

    // GET /api/staff/dashboard/conferences
    // Upcoming case conferences for residents at the staff user's safehouse.
    [HttpGet("dashboard/conferences")]
    public async Task<IActionResult> GetDashboardConferences()
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;
        var nowUtc = DateTime.UtcNow;

        var conferences = await _db.InterventionPlans
            .Join(_db.Residents,
                ip => ip.ResidentId,
                r  => r.ResidentId,
                (ip, r) => new { ip, r })
            .Where(x => x.r.SafehouseId == safehouseId && x.ip.CaseConferenceDate >= nowUtc)
            .Select(x => new
            {
                residentCode   = x.r.InternalCode ?? "Unknown",
                planCategory   = x.ip.PlanCategory,
                status         = x.ip.Status,
                conferenceDate = x.ip.CaseConferenceDate,
            })
            .OrderBy(x => x.conferenceDate)
            .Take(10)
            .ToListAsync();

        return Ok(conferences);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  RESIDENTS
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/staff/residents/summary
    // Safehouse-scoped stat cards + My Safehouse detail card.
    [HttpGet("residents/summary")]
    public async Task<IActionResult> GetResidentsSummary()
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nowUtc = DateTime.UtcNow;

        var activeResidents = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active" && r.SafehouseId == safehouseId);

        var highCriticalRisk = await _db.Residents
            .CountAsync(r => r.CaseStatus == "Active" &&
                             r.SafehouseId == safehouseId &&
                             (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"));

        var reintegrationInProgress = await _db.Residents
            .CountAsync(r => r.SafehouseId == safehouseId &&
                             r.ReintegrationStatus == "In Progress");

        var upcomingConferences = await _db.InterventionPlans
            .Join(_db.Residents,
                ip => ip.ResidentId,
                r  => r.ResidentId,
                (ip, r) => new { ip, r })
            .CountAsync(x =>
                x.r.SafehouseId == safehouseId &&
                x.ip.CaseConferenceDate >= nowUtc);

        // My Safehouse card details
        var safehouse = safehouseId.HasValue
            ? await _db.Safehouses.FirstOrDefaultAsync(s => s.SafehouseId == safehouseId.Value)
            : null;

        var latestMetric = safehouseId.HasValue
            ? await _db.SafehouseMonthlyMetrics
                .Where(m => m.SafehouseId == safehouseId.Value)
                .OrderByDescending(m => m.MonthStart)
                .FirstOrDefaultAsync()
            : null;

        var processRecordingsThisMonth = await _db.ProcessRecordings
            .Join(_db.Residents,
                p => p.ResidentId,
                r => r.ResidentId,
                (p, r) => new { p, r })
            .CountAsync(x =>
                x.r.SafehouseId == safehouseId &&
                x.p.SessionDate >= startOfMonth);

        var incidentsThisMonth = await _db.IncidentReports
            .CountAsync(i =>
                i.SafehouseId == safehouseId &&
                i.IncidentDate >= startOfMonth);

        return Ok(new
        {
            stats = new
            {
                activeResidents,
                highCriticalRisk,
                reintegrationInProgress,
                upcomingConferences,
            },
            safehouse = safehouse is null ? null : new
            {
                name                 = safehouse.Name ?? "—",
                region               = safehouse.Region ?? "—",
                capacity             = safehouse.CapacityGirls ?? 0,
                occupancy            = safehouse.CurrentOccupancy ?? 0,
                avgEducationProgress = latestMetric?.AvgEducationProgress,
                avgHealthScore       = latestMetric?.AvgHealthScore,
                processRecordingsThisMonth,
                incidentsThisMonth,
            },
        });
    }

    // GET /api/staff/residents?page=1&pageSize=10&search=&riskLevel=&status=
    // Paginated caseload list for the staff user's safehouse with search + filter.
    [HttpGet("residents")]
    public async Task<IActionResult> GetResidents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] string? status = null)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        // Admins with no safehouse assignment see all residents; staff see their safehouse only
        var query = safehouseId.HasValue
            ? _db.Residents.Where(r => r.SafehouseId == safehouseId)
            : _db.Residents.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(r => r.InternalCode != null &&
                                     r.InternalCode.ToLower().Contains(search.ToLower()));

        if (!string.IsNullOrWhiteSpace(riskLevel))
            query = query.Where(r => r.CurrentRiskLevel == riskLevel);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.CaseStatus == status);

        var total = await query.CountAsync();

        var rows = await query
            .OrderByDescending(r => r.DateOfAdmission)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                residentId           = r.ResidentId,
                internalCode         = r.InternalCode ?? "—",
                caseCategory         = r.CaseCategory ?? "—",
                currentRiskLevel     = r.CurrentRiskLevel ?? "—",
                dateOfAdmission      = r.DateOfAdmission,
                assignedSocialWorker = r.AssignedSocialWorker ?? "—",
                caseStatus           = r.CaseStatus ?? "—",
                reintegrationStatus  = r.ReintegrationStatus,
            })
            .ToListAsync();

        // Fetch readiness scores for these residents (degrade gracefully if table absent)
        var ids = rows.Select(r => r.residentId).ToList();
        Dictionary<int, ResidentReintegrationScore> scoreMap = new();
        try
        {
            var scores = await _db.ResidentReintegrationScores
                .Where(sc => ids.Contains(sc.ResidentId))
                .ToListAsync();
            scoreMap = scores.ToDictionary(sc => sc.ResidentId);
        }
        catch { /* resident_reintegration_scores table not yet available */ }

        var items = rows.Select(r =>
        {
            scoreMap.TryGetValue(r.residentId, out var sc);
            return new
            {
                residentId           = r.residentId,
                internalCode         = r.internalCode,
                caseCategory         = r.caseCategory,
                currentRiskLevel     = r.currentRiskLevel,
                dateOfAdmission      = r.dateOfAdmission,
                assignedSocialWorker = r.assignedSocialWorker,
                caseStatus           = r.caseStatus,
                readinessBand        = sc?.ReadinessBand,
                readinessFlag        = sc?.ReadinessBand == "Ready for Review"
                                       && r.reintegrationStatus == "In Progress",
            };
        }).ToList();

        return Ok(new { total, items });
    }

    // GET /api/staff/residents/{id}
    // Full profile for a single resident; must belong to the staff user's safehouse.
    [HttpGet("residents/{id:int}")]
    public async Task<IActionResult> GetResident(int id)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        var r = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == id);
        if (r is null) return NotFound(new { message = "Resident not found." });
        if (r.SafehouseId != safehouseId) return Forbid();

        return Ok(new
        {
            r.ResidentId,
            internalCode         = r.InternalCode ?? "—",
            caseCategory         = r.CaseCategory ?? "—",
            sex                  = r.Sex ?? "—",
            dateOfBirth          = r.DateOfBirth,
            ageUponAdmission     = r.AgeUponAdmission ?? "—",
            presentAge           = r.PresentAge ?? "—",
            dateOfAdmission      = r.DateOfAdmission,
            referralSource       = r.ReferralSource ?? "—",
            assignedSocialWorker = r.AssignedSocialWorker ?? "—",
            currentRiskLevel     = r.CurrentRiskLevel ?? "—",
            initialRiskLevel     = r.InitialRiskLevel ?? "—",
            caseStatus           = r.CaseStatus ?? "—",
            reintegrationStatus  = r.ReintegrationStatus,
            isPwd                = r.IsPwd ?? false,
            pwdType              = r.PwdType,
            familyIs4ps          = r.FamilyIs4ps ?? false,
            familySoloParent     = r.FamilySoloParent ?? false,
            familyIndigenous     = r.FamilyIndigenous ?? false,
            familyInformalSettler = r.FamilyInformalSettler ?? false,
            subCategories = new
            {
                orphaned     = r.SubCatOrphaned ?? false,
                trafficked   = r.SubCatTrafficked ?? false,
                childLabor   = r.SubCatChildLabor ?? false,
                physicalAbuse = r.SubCatPhysicalAbuse ?? false,
                sexualAbuse  = r.SubCatSexualAbuse ?? false,
                osaec        = r.SubCatOsaec ?? false,
                cicl         = r.SubCatCicl ?? false,
                atRisk       = r.SubCatAtRisk ?? false,
                streetChild  = r.SubCatStreetChild ?? false,
                childWithHiv = r.SubCatChildWithHiv ?? false,
            },
        });
    }

    // GET /api/staff/residents/{id}/recordings
    // All process recordings for a resident at the staff user's safehouse.
    [HttpGet("residents/{id:int}/recordings")]
    public async Task<IActionResult> GetResidentRecordings(int id)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        var resident = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == id);
        if (resident is null) return NotFound(new { message = "Resident not found." });
        if (resident.SafehouseId != safehouseId) return Forbid();

        var recordings = await _db.ProcessRecordings
            .Where(p => p.ResidentId == id)
            .OrderByDescending(p => p.SessionDate)
            .Select(p => new
            {
                p.RecordingId,
                sessionDate            = p.SessionDate,
                socialWorker           = p.SocialWorker ?? "—",
                sessionType            = p.SessionType ?? "—",
                emotionalStateObserved = p.EmotionalStateObserved ?? "—",
                sessionNarrative       = p.SessionNarrative ?? "",
                interventionsApplied   = p.InterventionsApplied ?? "",
                followUpActions        = p.FollowUpActions ?? "",
                concernsFlagged        = p.ConcernsFlagged ?? false,
            })
            .ToListAsync();

        return Ok(recordings);
    }

    // GET /api/staff/residents/{id}/visits
    // All home visits for a resident at the staff user's safehouse.
    [HttpGet("residents/{id:int}/visits")]
    public async Task<IActionResult> GetResidentVisits(int id)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        var resident = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == id);
        if (resident is null) return NotFound(new { message = "Resident not found." });
        if (resident.SafehouseId != safehouseId) return Forbid();

        var visits = await _db.HomeVisitations
            .Where(v => v.ResidentId == id)
            .OrderByDescending(v => v.VisitDate)
            .Select(v => new
            {
                v.VisitationId,
                visitDate              = v.VisitDate,
                socialWorker           = v.SocialWorker ?? "—",
                visitType              = v.VisitType ?? "—",
                locationVisited        = v.LocationVisited ?? "—",
                familyMembersPresent   = v.FamilyMembersPresent ?? "",
                purpose                = v.Purpose ?? "",
                observations           = v.Observations ?? "",
                familyCooperationLevel = v.FamilyCooperationLevel ?? "—",
                safetyConcernsNoted    = v.SafetyConcernsNoted ?? false,
                followUpNeeded         = v.FollowUpNeeded ?? false,
                followUpNotes          = v.FollowUpNotes ?? "",
                visitOutcome           = v.VisitOutcome ?? "",
            })
            .ToListAsync();

        return Ok(visits);
    }

    // GET /api/staff/residents/{id}/intervention-plan
    // Current intervention plan for a resident at the staff user's safehouse.
    [HttpGet("residents/{id:int}/intervention-plan")]
    public async Task<IActionResult> GetResidentInterventionPlan(int id)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        var resident = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == id);
        if (resident is null) return NotFound(new { message = "Resident not found." });
        if (resident.SafehouseId != safehouseId) return Forbid();

        var plans = await _db.InterventionPlans
            .Where(ip => ip.ResidentId == id)
            .OrderByDescending(ip => ip.UpdatedAt ?? ip.CreatedAt)
            .Select(ip => new
            {
                ip.PlanId,
                planCategory      = ip.PlanCategory ?? "—",
                planDescription   = ip.PlanDescription ?? "",
                servicesProvided  = ip.ServicesProvided ?? "",
                targetValue       = ip.TargetValue,
                targetDate        = ip.TargetDate,
                status            = ip.Status ?? "—",
                caseConferenceDate = ip.CaseConferenceDate,
                createdAt         = ip.CreatedAt,
                updatedAt         = ip.UpdatedAt,
            })
            .ToListAsync();

        return Ok(plans);
    }

    // POST /api/staff/residents
    // Resident intake — SafehouseId and CaseStatus are always set server-side.
    [HttpPost("residents")]
    public async Task<IActionResult> CreateResident([FromBody] CreateResidentDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        if (safehouseId is null)
            return BadRequest(new { message = "Your account is not assigned to a safehouse." });

        var resident = new Resident
        {
            SafehouseId          = safehouseId,
            CaseStatus           = "Pending",   // always set server-side
            InternalCode         = dto.InternalCode,
            DateOfAdmission      = dto.DateOfAdmission,
            ReferralSource       = dto.ReferralSource,
            AssignedSocialWorker = dto.AssignedSocialWorker,
            CaseCategory         = dto.CaseCategory,
            SubCatOrphaned       = dto.SubCatOrphaned,
            SubCatTrafficked     = dto.SubCatTrafficked,
            SubCatChildLabor     = dto.SubCatChildLabor,
            SubCatPhysicalAbuse  = dto.SubCatPhysicalAbuse,
            SubCatSexualAbuse    = dto.SubCatSexualAbuse,
            SubCatOsaec          = dto.SubCatOsaec,
            SubCatCicl           = dto.SubCatCicl,
            SubCatAtRisk         = dto.SubCatAtRisk,
            SubCatStreetChild    = dto.SubCatStreetChild,
            SubCatChildWithHiv   = dto.SubCatChildWithHiv,
            Sex                  = dto.Sex,
            AgeUponAdmission     = dto.AgeUponAdmission,
            IsPwd                = dto.IsPwd,
            PwdType              = dto.PwdType,
            FamilyIs4ps          = dto.FamilyIs4ps,
            FamilySoloParent     = dto.FamilySoloParent,
            FamilyIndigenous     = dto.FamilyIndigenous,
            FamilyInformalSettler = dto.FamilyInformalSettler,
            InitialRiskLevel     = dto.InitialRiskLevel,
            CurrentRiskLevel     = dto.InitialRiskLevel,
            NotesRestricted      = dto.NotesRestricted,
            CreatedAt            = DateTime.UtcNow,
        };

        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetResident), new { id = resident.ResidentId }, new
        {
            resident.ResidentId,
            internalCode = resident.InternalCode,
            caseStatus   = resident.CaseStatus,
        });
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  PROCESS RECORDINGS
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/staff/process-recordings/mine?page=1&pageSize=10&residentId=
    // Recordings submitted by the logged-in user (matched by SocialWorker name).
    [HttpGet("process-recordings/mine")]
    public async Task<IActionResult> GetMyProcessRecordings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? residentId = null)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;
        var swCode = user?.SocialWorkerCode ?? string.Empty;

        var query = _db.ProcessRecordings
            .Where(p => p.SocialWorker == swCode)
            .Join(_db.Residents,
                p => p.ResidentId,
                r => r.ResidentId,
                (p, r) => new { p, r });

        if (safehouseId.HasValue)
            query = query.Where(x => x.r.SafehouseId == safehouseId);

        if (residentId.HasValue)
            query = query.Where(x => x.p.ResidentId == residentId.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.p.SessionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.p.RecordingId,
                residentCode           = x.r.InternalCode ?? "—",
                sessionDate            = x.p.SessionDate,
                sessionType            = x.p.SessionType ?? "—",
                emotionalStateObserved = x.p.EmotionalStateObserved ?? "—",
                sessionNarrative       = x.p.SessionNarrative ?? "",
                interventionsApplied   = x.p.InterventionsApplied ?? "",
                followUpActions        = x.p.FollowUpActions ?? "",
                concernsFlagged        = x.p.ConcernsFlagged ?? false,
            })
            .ToListAsync();

        return Ok(new { total, items });
    }

    // POST /api/staff/process-recordings
    // Create a new process recording; resident must belong to the staff user's safehouse.
    [HttpPost("process-recordings")]
    public async Task<IActionResult> CreateProcessRecording([FromBody] CreateProcessRecordingDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        var resident = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == dto.ResidentId);
        if (resident is null)
            return NotFound(new { message = "Resident not found." });
        if (safehouseId.HasValue && resident.SafehouseId != safehouseId)
            return Forbid();

        var recording = new ProcessRecording
        {
            ResidentId             = dto.ResidentId,
            SessionDate            = dto.SessionDate,
            SocialWorker           = user?.SocialWorkerCode ?? dto.SocialWorker, // always prefer server-side SW code
            SessionType            = dto.SessionType,
            EmotionalStateObserved = dto.EmotionalStateObserved,
            SessionNarrative       = dto.NarrativeSummary,
            InterventionsApplied   = dto.InterventionsApplied,
            FollowUpActions        = dto.FollowUpActions,
            ConcernsFlagged        = dto.ConcernsFlagged,
        };

        _db.ProcessRecordings.Add(recording);
        await _db.SaveChangesAsync();

        return StatusCode(201, new
        {
            recording.RecordingId,
            message = "Recording saved successfully.",
        });
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  HOME VISITS
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/staff/home-visits/mine?page=1&pageSize=10
    // Home visits submitted by the logged-in user (matched by SocialWorker name).
    [HttpGet("home-visits/mine")]
    public async Task<IActionResult> GetMyHomeVisits(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;
        var swCode = user?.SocialWorkerCode ?? string.Empty;

        var query = _db.HomeVisitations
            .Where(v => v.SocialWorker == swCode)
            .Join(_db.Residents,
                v => v.ResidentId,
                r => r.ResidentId,
                (v, r) => new { v, r });

        if (safehouseId.HasValue)
            query = query.Where(x => x.r.SafehouseId == safehouseId);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.v.VisitDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.v.VisitationId,
                residentCode        = x.r.InternalCode ?? "—",
                visitDate           = x.v.VisitDate,
                visitType           = x.v.VisitType ?? "—",
                safetyConcernsNoted = x.v.SafetyConcernsNoted ?? false,
                followUpNeeded      = x.v.FollowUpNeeded ?? false,
                observations        = x.v.Observations ?? "",
                familyCooperationLevel = x.v.FamilyCooperationLevel ?? "—",
                visitOutcome        = x.v.VisitOutcome ?? "",
                followUpNotes       = x.v.FollowUpNotes ?? "",
            })
            .ToListAsync();

        return Ok(new { total, items });
    }

    // POST /api/staff/home-visits
    // Create a new home visit; resident must belong to the staff user's safehouse.
    [HttpPost("home-visits")]
    public async Task<IActionResult> CreateHomeVisit([FromBody] CreateHomeVisitDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;

        var resident = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == dto.ResidentId);
        if (resident is null)
            return NotFound(new { message = "Resident not found." });
        if (safehouseId.HasValue && resident.SafehouseId != safehouseId)
            return Forbid();

        var visit = new HomeVisitation
        {
            ResidentId             = dto.ResidentId,
            VisitDate              = dto.VisitDate,
            SocialWorker           = user?.SocialWorkerCode ?? dto.SocialWorker, // always prefer server-side SW code
            VisitType              = dto.VisitType,
            LocationVisited        = dto.LocationVisited,
            FamilyMembersPresent   = dto.FamilyMembersPresent,
            Purpose                = dto.Purpose,
            Observations           = dto.Observations,
            FamilyCooperationLevel = dto.FamilyCooperationLevel,
            SafetyConcernsNoted    = dto.SafetyConcernsNoted,
            FollowUpNeeded         = dto.FollowUpNeeded,
            FollowUpNotes          = dto.FollowUpNotes,
            VisitOutcome           = dto.VisitOutcome,
        };

        _db.HomeVisitations.Add(visit);
        await _db.SaveChangesAsync();

        return StatusCode(201, new
        {
            visit.VisitationId,
            message = "Visit record saved successfully.",
        });
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  CASE CONFERENCES
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/staff/case-conferences
    // Read-only list of upcoming and past conferences for residents at the staff user's safehouse.
    [HttpGet("case-conferences")]
    public async Task<IActionResult> GetCaseConferences()
    {
        var user = await _userManager.GetUserAsync(User);
        var safehouseId = user?.SafehouseId;
        var nowUtc = DateTime.UtcNow;

        var all = await _db.InterventionPlans
            .Where(ip => ip.CaseConferenceDate.HasValue)
            .Join(_db.Residents,
                ip => ip.ResidentId,
                r  => r.ResidentId,
                (ip, r) => new { ip, r })
            .Where(x => x.r.SafehouseId == safehouseId)
            .Select(x => new
            {
                residentCode    = x.r.InternalCode ?? "Unknown",
                planDescription = x.ip.PlanDescription ?? "—",
                planCategory    = x.ip.PlanCategory ?? "—",
                conferenceDate  = x.ip.CaseConferenceDate!.Value,
            })
            .OrderBy(x => x.conferenceDate)
            .ToListAsync();

        var upcoming = all.Where(x => x.conferenceDate >= nowUtc).ToList();
        var history  = all.Where(x => x.conferenceDate < nowUtc)
                          .OrderByDescending(x => x.conferenceDate)
                          .ToList();

        return Ok(new { upcoming, history });
    }
}
