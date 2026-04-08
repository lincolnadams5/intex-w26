using System.ComponentModel.DataAnnotations;

namespace IntexBackendApi.DTOs;

public class ResetPasswordDto
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [StringLength(256, MinimumLength = 14)]
    public string NewPassword { get; set; } = string.Empty;
}
