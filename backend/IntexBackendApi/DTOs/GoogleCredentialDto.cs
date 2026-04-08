using System.ComponentModel.DataAnnotations;

namespace IntexBackendApi.DTOs;

public class GoogleCredentialDto
{
    [Required]
    public string Credential { get; set; } = string.Empty;
}
