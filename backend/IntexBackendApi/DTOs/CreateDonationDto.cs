using System.ComponentModel.DataAnnotations;

namespace IntexBackendApi.DTOs;

public class CreateDonationDto
{
    [Required]
    [Range(1, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public double Amount { get; set; }

    public bool IsRecurring { get; set; }

    [MaxLength(200)]
    public string? CampaignName { get; set; }
}
