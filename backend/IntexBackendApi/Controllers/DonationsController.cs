using System.Security.Claims;
using IntexBackendApi.Data;
using IntexBackendApi.DTOs;
using IntexBackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DonationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public DonationsController(AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // POST /api/donations
    // Creates a new monetary donation for the authenticated user.
    // Automatically creates a Supporter record if one doesn't exist yet.
    [HttpPost]
    public async Task<ActionResult<DonationDto>> Create([FromBody] CreateDonationDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return Unauthorized();

        var supporterId = await EnsureSupporterAsync(user);

        var donation = new Donation
        {
            SupporterId = supporterId,
            DonationType = "Monetary",
            DonationDate = DateTime.UtcNow,
            ChannelSource = "Online",
            CurrencyCode = "PHP",
            Amount = dto.Amount,
            IsRecurring = dto.IsRecurring,
            CampaignName = dto.CampaignName,
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = donation.DonationId }, MapToDto(donation, null));
    }

    // GET /api/donations/my
    // Returns the authenticated user's donation history and summary metrics.
    [HttpGet("my")]
    public async Task<ActionResult<DonorDashboardDto>> GetMy()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return Unauthorized();

        // No donations yet (no supporter record linked)
        if (user.SupporterId == null)
            return Ok(new DonorDashboardDto());

        var donations = await _db.Donations
            .Where(d => d.SupporterId == user.SupporterId)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();

        if (donations.Count == 0)
            return Ok(new DonorDashboardDto());

        // Fetch in-kind items for all in-kind donations in one query
        var inKindIds = donations
            .Where(d => d.DonationType == "In-Kind")
            .Select(d => d.DonationId)
            .ToList();

        var allItems = inKindIds.Count > 0
            ? await _db.InKindDonationItems.Where(i => inKindIds.Contains(i.DonationId)).ToListAsync()
            : [];

        var itemsByDonation = allItems
            .GroupBy(i => i.DonationId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var donationDtos = donations
            .Select(d => MapToDto(d, itemsByDonation.TryGetValue(d.DonationId, out var its) ? its : null))
            .ToList();

        // Metrics
        var totalMonetary = donations.Where(d => d.DonationType == "Monetary").Sum(d => d.Amount ?? 0);
        var inKindItemCount = allItems.Sum(i => i.Quantity ?? 0);

        var firstDate = donations.Min(d => d.DonationDate);
        int yearsSupporting = 0;
        if (firstDate.HasValue)
        {
            var daysSince = (DateTime.UtcNow - firstDate.Value).TotalDays;
            yearsSupporting = Math.Max(1, (int)Math.Floor(daysSince / 365));
        }

        return Ok(new DonorDashboardDto
        {
            Metrics = new DonorMetricsDto
            {
                TotalMonetary = totalMonetary,
                TotalDonations = donations.Count,
                InKindItems = inKindItemCount,
                YearsSupporting = yearsSupporting,
            },
            Donations = donationDtos,
        });
    }

    // GET /api/donations/{id}
    // Returns a single donation belonging to the authenticated user.
    [HttpGet("{id}")]
    public async Task<ActionResult<DonationDto>> GetById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return Unauthorized();

        var donation = await _db.Donations.FindAsync(id);
        if (donation == null) return NotFound();
        if (donation.SupporterId != user.SupporterId) return Forbid();

        var items = await _db.InKindDonationItems
            .Where(i => i.DonationId == id)
            .ToListAsync();

        return Ok(MapToDto(donation, items.Count > 0 ? items : null));
    }

    // Ensures the user has a linked Supporter record, creating one if needed.
    private async Task<int> EnsureSupporterAsync(ApplicationUser user)
    {
        if (user.SupporterId.HasValue)
            return user.SupporterId.Value;

        var nameParts = user.FullName?.Split(' ', 2) ?? [];
        var supporter = new Supporter
        {
            SupporterType = "Individual",
            FirstName = nameParts.Length > 0 ? nameParts[0] : null,
            LastName = nameParts.Length > 1 ? nameParts[1] : null,
            DisplayName = user.FullName,
            Email = user.Email,
            Status = "Active",
            AcquisitionChannel = "Online",
            FirstDonationDate = DateOnly.FromDateTime(DateTime.UtcNow), // Supporter.FirstDonationDate stays DateOnly
            CreatedAt = DateTime.UtcNow,
        };

        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();

        user.SupporterId = supporter.SupporterId;
        await _userManager.UpdateAsync(user);

        return supporter.SupporterId;
    }

    private static DonationDto MapToDto(Donation d, List<InKindDonationItem>? items)
    {
        string? itemSummary = null;
        if (items is { Count: > 0 })
            itemSummary = string.Join(", ", items.Select(i => $"{i.Quantity} {i.ItemName}"));

        return new DonationDto
        {
            DonationId = d.DonationId,
            DonationDate = d.DonationDate?.ToString("yyyy-MM-dd") ?? "",
            DonationType = d.DonationType ?? "Monetary",
            CampaignName = d.CampaignName,
            Amount = d.Amount,
            CurrencyCode = d.CurrencyCode,
            Items = itemSummary,
            IsRecurring = d.IsRecurring ?? false,
        };
    }
}
