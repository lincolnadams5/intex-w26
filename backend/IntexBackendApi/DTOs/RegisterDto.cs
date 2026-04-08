using System.ComponentModel.DataAnnotations;

namespace IntexBackendApi.DTOs;

public class RegisterDto
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [StringLength(256, MinimumLength = 14)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare("Password", ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
