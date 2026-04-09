namespace IntexBackendApi.DTOs;

public class ProcessRecordingDto
{
    public DateTime? SessionDate { get; set; }
    public string? SocialWorker { get; set; }
    public string? SessionType { get; set; }
    public int? SessionDurationMinutes { get; set; }
    public string? EmotionalStateObserved { get; set; }
    public string? EmotionalStateEnd { get; set; }
    public string? SessionNarrative { get; set; }
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool? ProgressNoted { get; set; }
    public bool? ConcernsFlagged { get; set; }
    public bool? ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }
}
