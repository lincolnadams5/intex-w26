using System.ComponentModel.DataAnnotations;

namespace IntexBackendApi.DTOs;

public class Verify2FADto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public string Code { get; set; } = string.Empty;
}
