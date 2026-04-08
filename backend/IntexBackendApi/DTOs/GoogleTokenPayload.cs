using System.Text.Json.Serialization;

namespace IntexBackendApi.DTOs;

/// <summary>
/// Represents the payload returned by Google's tokeninfo endpoint.
/// See: https://developers.google.com/identity/sign-in/web/backend-auth
/// </summary>
public class GoogleTokenPayload
{
    [JsonPropertyName("sub")]
    public string Sub { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("picture")]
    public string Picture { get; set; } = string.Empty;

    [JsonPropertyName("aud")]
    public string Aud { get; set; } = string.Empty;

    [JsonPropertyName("email_verified")]
    public string EmailVerified { get; set; } = string.Empty;
}
