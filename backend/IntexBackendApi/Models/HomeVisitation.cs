using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("home_visitations")]
public class HomeVisitation
{
    [Key]
    public int VisitationId { get; set; }
    public int ResidentId { get; set; }
    // Stored as timestamptz in PostgreSQL — use DateTime? not DateOnly?
    public DateTime? VisitDate { get; set; }
    public string? SocialWorker { get; set; }
    public string? VisitType { get; set; }
    public string? LocationVisited { get; set; }
    public string? FamilyMembersPresent { get; set; }
    public string? Purpose { get; set; }
    public string? Observations { get; set; }
    public string? FamilyCooperationLevel { get; set; }
    public bool? SafetyConcernsNoted { get; set; }
    public bool? FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string? VisitOutcome { get; set; }
}
