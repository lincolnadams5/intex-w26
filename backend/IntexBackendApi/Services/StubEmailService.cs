namespace IntexBackendApi.Services;

// Used when no Gmail App Password is configured.
// Logs email content to the console instead of sending real emails.
public class StubEmailService : IEmailService
{
    private readonly ILogger<StubEmailService> _logger;

    public StubEmailService(ILogger<StubEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendTwoFactorCodeAsync(string toEmail, string userName, string code)
    {
        _logger.LogInformation(
            "[STUB EMAIL] 2FA code for {Email}: {Code}", toEmail, code);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string userName, string resetLink)
    {
        _logger.LogInformation(
            "[STUB EMAIL] Password reset link for {Email}: {Link}", toEmail, resetLink);
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(string toEmail, string userName)
    {
        _logger.LogInformation(
            "[STUB EMAIL] Welcome email for {Email} ({Name})", toEmail, userName);
        return Task.CompletedTask;
    }
}
