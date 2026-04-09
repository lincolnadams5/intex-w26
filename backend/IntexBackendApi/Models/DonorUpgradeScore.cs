using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("donor_upgrade_scores")]
public class DonorUpgradeScore
{
    [Key]
    public int SupporterId { get; set; }
    public string? RfmSegment { get; set; }
    public bool UpgradeCandidate { get; set; }
    public double UpgradeScore { get; set; }
    public double CurrentAvgGift { get; set; }
    public double SegmentAvgGift { get; set; }
    public DateTime? ScoredAt { get; set; }
}
