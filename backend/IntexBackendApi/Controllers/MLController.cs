using IntexBackendApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Controllers;

[Route("api/admin/ml")]
[ApiController]
[Authorize(Policy = "AdminOnly")]
public class MLController : ControllerBase
{
    private readonly AppDbContext _db;

    public MLController(AppDbContext db) { _db = db; }

    // GET /api/admin/ml/donor-risk-scores
    // Returns all scored donors joined with display names and donation stats, sorted by risk descending.
    [HttpGet("donor-risk-scores")]
    public async Task<IActionResult> GetDonorRiskScores()
    {
        var scores = await _db.DonorRiskScores
            .Join(_db.Supporters, r => r.SupporterId, s => s.SupporterId,
                (r, s) => new
                {
                    r.SupporterId,
                    r.RiskScore,
                    r.AtRiskPred,
                    r.ScoredAt,
                    r.ContactedAt,
                    r.RiskReasons,
                    DonorName = s.DisplayName ?? "Anonymous",
                })
            .OrderByDescending(x => x.RiskScore)
            .ToListAsync();

        var supporterIds = scores.Select(x => x.SupporterId).ToList();

        var rawDonations = await _db.Donations
            .Where(d => supporterIds.Contains(d.SupporterId))
            .Select(d => new { d.SupporterId, d.EstimatedValue })
            .ToListAsync();

        var totalGivenMap = rawDonations
            .GroupBy(d => d.SupporterId)
            .ToDictionary(g => g.Key, g => g.Sum(d => d.EstimatedValue ?? 0));

        var result = scores.Select(x => new
        {
            x.SupporterId,
            donorName    = x.DonorName,
            x.RiskScore,
            x.AtRiskPred,
            x.ScoredAt,
            x.ContactedAt,
            riskReasons  = x.RiskReasons,
            totalGiven   = totalGivenMap.TryGetValue(x.SupporterId, out var total) ? total : 0,
        });

        return Ok(result);
    }

    // PUT /api/admin/ml/donor-risk-scores/{supporterId}/contacted
    // Marks a donor as contacted for outreach purposes.
    [HttpPut("donor-risk-scores/{supporterId}/contacted")]
    public async Task<IActionResult> MarkContacted(int supporterId)
    {
        var row = await _db.DonorRiskScores.FindAsync(supporterId);
        if (row == null) return NotFound();
        row.ContactedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/admin/ml/donor-outreach-profiles
    // Returns per-donor outreach recommendations joined with display names.
    [HttpGet("donor-outreach-profiles")]
    public async Task<IActionResult> GetDonorOutreachProfiles()
    {
        var result = await _db.DonorOutreachProfiles
            .Join(_db.Supporters, p => p.SupporterId, s => s.SupporterId,
                (p, s) => new
                {
                    p.SupporterId,
                    donorName        = s.DisplayName ?? "Anonymous",
                    p.PreferredChannel,
                    p.Cadence,
                    p.MessageTemplate,
                    p.BestDay,
                    p.AskType,
                    p.ScoredAt,
                })
            .OrderBy(x => x.donorName)
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/admin/ml/donor-upgrade-scores
    // Returns upgrade-candidate donors joined with display names, sorted by upgrade score descending.
    [HttpGet("donor-upgrade-scores")]
    public async Task<IActionResult> GetDonorUpgradeScores()
    {
        var result = await _db.DonorUpgradeScores
            .Join(_db.Supporters, u => u.SupporterId, s => s.SupporterId,
                (u, s) => new
                {
                    u.SupporterId,
                    donorName       = s.DisplayName ?? "Anonymous",
                    u.RfmSegment,
                    u.UpgradeCandidate,
                    u.UpgradeScore,
                    u.CurrentAvgGift,
                    u.SegmentAvgGift,
                    suggestedAsk    = Math.Round(u.CurrentAvgGift * 1.5, 2),
                    u.ScoredAt,
                })
            .Where(x => x.UpgradeCandidate)
            .OrderByDescending(x => x.UpgradeScore)
            .ToListAsync();

        return Ok(result);
    }
}
