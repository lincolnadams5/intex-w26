using System.ComponentModel.DataAnnotations;

namespace IntexBackendApi.DTOs;

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;
}
