namespace IntexBackendApi.Services;

public interface IEmailService
{
    Task SendTwoFactorCodeAsync(string toEmail, string userName, string code);
    Task SendPasswordResetAsync(string toEmail, string userName, string resetLink);
    Task SendWelcomeEmailAsync(string toEmail, string userName);
}
