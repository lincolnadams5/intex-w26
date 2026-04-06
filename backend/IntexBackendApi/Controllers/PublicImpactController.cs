using IntexBackendApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicImpactController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicImpactController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ImpactSummaryDto>> GetImpactSummary()
    {
        var totalMonetaryDonations = await _db.Donations
            .Where(d => d.DonationType == "Monetary" && d.Amount != null)
            .SumAsync(d => d.Amount) ?? 0;

        var totalDonationCount = await _db.Donations.CountAsync();

        var totalSupporters = await _db.Supporters.CountAsync();

        var activeSupporters = await _db.Supporters
            .Where(s => s.Status == "Active")
            .CountAsync();

        var activeSafehouses = await _db.Safehouses
            .Where(s => s.Status == "Active")
            .CountAsync();

        var totalCapacity = await _db.Safehouses
            .Where(s => s.Status == "Active")
            .SumAsync(s => s.CapacityGirls) ?? 0;

        var currentOccupancy = await _db.Safehouses
            .Where(s => s.Status == "Active")
            .SumAsync(s => s.CurrentOccupancy) ?? 0;

        var activePartners = await _db.Partners
            .Where(p => p.Status == "Active")
            .CountAsync();

        var regionsServed = await _db.Safehouses
            .Where(s => s.Status == "Active" && s.Region != null)
            .Select(s => s.Region)
            .Distinct()
            .CountAsync();

        return new ImpactSummaryDto
        {
            TotalMonetaryDonations = totalMonetaryDonations,
            TotalDonationCount = totalDonationCount,
            TotalSupporters = totalSupporters,
            ActiveSupporters = activeSupporters,
            ActiveSafehouses = activeSafehouses,
            TotalCapacity = totalCapacity,
            CurrentOccupancy = currentOccupancy,
            ActivePartners = activePartners,
            RegionsServed = regionsServed
        };
    }

    [HttpGet("donations-by-type")]
    public async Task<ActionResult<IEnumerable<DonationsByTypeDto>>> GetDonationsByType()
    {
        var result = await _db.Donations
            .Where(d => d.DonationType != null)
            .GroupBy(d => d.DonationType)
            .Select(g => new DonationsByTypeDto
            {
                DonationType = g.Key!,
                Count = g.Count(),
                TotalValue = g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0)
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return result;
    }

    [HttpGet("donations-by-month")]
    public async Task<ActionResult<IEnumerable<DonationsByMonthDto>>> GetDonationsByMonth()
    {
        var result = await _db.Donations
            .Where(d => d.DonationDate != null)
            .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
            .Select(g => new DonationsByMonthDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count(),
                TotalAmount = g.Sum(d => d.Amount ?? 0)
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToListAsync();

        return result;
    }

    [HttpGet("allocations-by-program")]
    public async Task<ActionResult<IEnumerable<AllocationsByProgramDto>>> GetAllocationsByProgram()
    {
        var result = await _db.DonationAllocations
            .Where(a => a.ProgramArea != null)
            .GroupBy(a => a.ProgramArea)
            .Select(g => new AllocationsByProgramDto
            {
                ProgramArea = g.Key!,
                TotalAllocated = g.Sum(a => a.AmountAllocated ?? 0),
                AllocationCount = g.Count()
            })
            .OrderByDescending(x => x.TotalAllocated)
            .ToListAsync();

        return result;
    }

    [HttpGet("supporters-by-type")]
    public async Task<ActionResult<IEnumerable<SupportersByTypeDto>>> GetSupportersByType()
    {
        var result = await _db.Supporters
            .Where(s => s.SupporterType != null)
            .GroupBy(s => s.SupporterType)
            .Select(g => new SupportersByTypeDto
            {
                SupporterType = g.Key!,
                Count = g.Count(),
                ActiveCount = g.Count(s => s.Status == "Active")
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return result;
    }

    [HttpGet("supporters-by-channel")]
    public async Task<ActionResult<IEnumerable<SupportersByChannelDto>>> GetSupportersByChannel()
    {
        var result = await _db.Supporters
            .Where(s => s.AcquisitionChannel != null)
            .GroupBy(s => s.AcquisitionChannel)
            .Select(g => new SupportersByChannelDto
            {
                Channel = g.Key!,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return result;
    }

    [HttpGet("in-kind-by-category")]
    public async Task<ActionResult<IEnumerable<InKindByCategoryDto>>> GetInKindByCategory()
    {
        var result = await _db.InKindDonationItems
            .Where(i => i.ItemCategory != null)
            .GroupBy(i => i.ItemCategory)
            .Select(g => new InKindByCategoryDto
            {
                Category = g.Key!,
                TotalItems = g.Sum(i => i.Quantity ?? 0),
                EstimatedValue = g.Sum(i => (i.Quantity ?? 0) * (i.EstimatedUnitValue ?? 0))
            })
            .OrderByDescending(x => x.EstimatedValue)
            .ToListAsync();

        return result;
    }

    [HttpGet("partners-by-role")]
    public async Task<ActionResult<IEnumerable<PartnersByRoleDto>>> GetPartnersByRole()
    {
        var result = await _db.Partners
            .Where(p => p.RoleType != null)
            .GroupBy(p => p.RoleType)
            .Select(g => new PartnersByRoleDto
            {
                RoleType = g.Key!,
                Count = g.Count(),
                ActiveCount = g.Count(p => p.Status == "Active")
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return result;
    }

    [HttpGet("campaign-performance")]
    public async Task<ActionResult<IEnumerable<CampaignPerformanceDto>>> GetCampaignPerformance()
    {
        var result = await _db.Donations
            .Where(d => d.CampaignName != null)
            .GroupBy(d => d.CampaignName)
            .Select(g => new CampaignPerformanceDto
            {
                CampaignName = g.Key!,
                DonationCount = g.Count(),
                TotalRaised = g.Sum(d => d.Amount ?? 0),
                UniqueDonors = g.Select(d => d.SupporterId).Distinct().Count()
            })
            .OrderByDescending(x => x.TotalRaised)
            .ToListAsync();

        return result;
    }
}

public class ImpactSummaryDto
{
    public decimal TotalMonetaryDonations { get; set; }
    public int TotalDonationCount { get; set; }
    public int TotalSupporters { get; set; }
    public int ActiveSupporters { get; set; }
    public int ActiveSafehouses { get; set; }
    public int TotalCapacity { get; set; }
    public int CurrentOccupancy { get; set; }
    public int ActivePartners { get; set; }
    public int RegionsServed { get; set; }
}

public class DonationsByTypeDto
{
    public string DonationType { get; set; } = "";
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}

public class DonationsByMonthDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
}

public class AllocationsByProgramDto
{
    public string ProgramArea { get; set; } = "";
    public decimal TotalAllocated { get; set; }
    public int AllocationCount { get; set; }
}

public class SupportersByTypeDto
{
    public string SupporterType { get; set; } = "";
    public int Count { get; set; }
    public int ActiveCount { get; set; }
}

public class SupportersByChannelDto
{
    public string Channel { get; set; } = "";
    public int Count { get; set; }
}

public class InKindByCategoryDto
{
    public string Category { get; set; } = "";
    public int TotalItems { get; set; }
    public decimal EstimatedValue { get; set; }
}

public class PartnersByRoleDto
{
    public string RoleType { get; set; } = "";
    public int Count { get; set; }
    public int ActiveCount { get; set; }
}

public class CampaignPerformanceDto
{
    public string CampaignName { get; set; } = "";
    public int DonationCount { get; set; }
    public decimal TotalRaised { get; set; }
    public int UniqueDonors { get; set; }
}
