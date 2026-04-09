using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("donations")]
public class Donation
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int DonationId { get; set; }
    public int SupporterId { get; set; }
    public string? DonationType { get; set; }
    public DateTime? DonationDate { get; set; }
    public string? ChannelSource { get; set; }
    public string? CurrencyCode { get; set; }
    public double? Amount { get; set; }
    public double? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public bool? IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? Notes { get; set; }
    public int? CreatedByPartnerId { get; set; }
    public int? ReferralPostId { get; set; }
}
