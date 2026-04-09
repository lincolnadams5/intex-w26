namespace IntexBackendApi.DTOs;

public class DonationDto
{
    public int DonationId { get; set; }
    public string DonationDate { get; set; } = "";
    public string DonationType { get; set; } = "Monetary";
    public string? CampaignName { get; set; }
    public double? Amount { get; set; }
    public string? CurrencyCode { get; set; }
    public string? Items { get; set; }
    public bool IsRecurring { get; set; }
}

public class DonorMetricsDto
{
    public double TotalMonetary { get; set; }
    public int TotalDonations { get; set; }
    public int InKindItems { get; set; }
    public int YearsSupporting { get; set; }
}

public class DonorDashboardDto
{
    public DonorMetricsDto Metrics { get; set; } = new();
    public List<DonationDto> Donations { get; set; } = [];
}
