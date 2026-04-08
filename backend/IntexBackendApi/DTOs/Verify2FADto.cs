using System.ComponentModel.DataAnnotations;

namespace IntexBackendApi.DTOs;

public class Verify2FADto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Code must be exactly 6 digits")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Code must be 6 numeric digits")]
    public string Code { get; set; } = string.Empty;
}
