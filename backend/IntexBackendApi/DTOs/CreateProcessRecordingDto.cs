namespace IntexBackendApi.DTOs;

public class CreateProcessRecordingDto
{
    public int ResidentId { get; set; }
    public DateTime SessionDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string SessionType { get; set; } = string.Empty;
    public string EmotionalStateObserved { get; set; } = string.Empty;
    public string NarrativeSummary { get; set; } = string.Empty;
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool ConcernsFlagged { get; set; }
}
