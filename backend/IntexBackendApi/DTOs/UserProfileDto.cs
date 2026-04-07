namespace IntexBackendApi.DTOs;

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? SafehouseId { get; set; }
    public int? SupporterId { get; set; }
    public DateTime CreatedAt { get; set; }
}
