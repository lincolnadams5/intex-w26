namespace IntexBackendApi.DTOs;

public class CreateResidentDto
{
    public string? InternalCode { get; set; }
    public DateOnly? DateOfAdmission { get; set; }
    public string? ReferralSource { get; set; }
    public string? AssignedSocialWorker { get; set; }
    public string? CaseCategory { get; set; }

    // Sub-categories
    public bool? SubCatOrphaned { get; set; }
    public bool? SubCatTrafficked { get; set; }
    public bool? SubCatChildLabor { get; set; }
    public bool? SubCatPhysicalAbuse { get; set; }
    public bool? SubCatSexualAbuse { get; set; }
    public bool? SubCatOsaec { get; set; }
    public bool? SubCatCicl { get; set; }
    public bool? SubCatAtRisk { get; set; }
    public bool? SubCatStreetChild { get; set; }
    public bool? SubCatChildWithHiv { get; set; }

    public string? Sex { get; set; }
    public string? AgeUponAdmission { get; set; }

    // Disability
    public bool? IsPwd { get; set; }
    public string? PwdType { get; set; }

    // Family profile
    public bool? FamilyIs4ps { get; set; }
    public bool? FamilySoloParent { get; set; }
    public bool? FamilyIndigenous { get; set; }
    public bool? FamilyInformalSettler { get; set; }

    public string? InitialRiskLevel { get; set; }
    public string? NotesRestricted { get; set; }
}
