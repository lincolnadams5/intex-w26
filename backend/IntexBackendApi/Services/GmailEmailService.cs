using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using IntexBackendApi.Settings;

namespace IntexBackendApi.Services;

// Sends emails via Gmail SMTP using MailKit.
// Requires a Gmail account with 2-Step Verification and an App Password.
public class GmailEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<GmailEmailService> _logger;

    public GmailEmailService(
        IOptions<EmailSettings> settings,
        ILogger<GmailEmailService> logger)
    {
        _settings = settings.Value;
        _logger   = logger;
    }

    public async Task SendTwoFactorCodeAsync(string toEmail, string userName, string code)
    {
        var subject   = "Your verification code";
        var htmlBody  = Build2FAEmailHtml(userName, code);
        var plainBody = $"Hi {userName}, your verification code is: {code}. It expires in 10 minutes.";
        await SendEmailAsync(toEmail, subject, plainBody, htmlBody);
    }

    public async Task SendPasswordResetAsync(string toEmail, string userName, string resetLink)
    {
        var subject   = "Reset your password";
        var htmlBody  = BuildPasswordResetHtml(userName, resetLink);
        var plainBody = $"Hi {userName}, click this link to reset your password: {resetLink}. This link expires in 1 hour.";
        await SendEmailAsync(toEmail, subject, plainBody, htmlBody);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string userName)
    {
        var subject   = "Welcome!";
        var htmlBody  = BuildWelcomeHtml(userName);
        var plainBody = $"Hi {userName}, welcome! Your account has been created.";
        await SendEmailAsync(toEmail, subject, plainBody, htmlBody);
    }

    // Connects to Gmail SMTP with STARTTLS, authenticates with the App Password,
    // and sends a single email with both HTML and plain text bodies.
    private async Task SendEmailAsync(
        string toEmail, string subject, string plainText, string htmlContent)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            TextBody = plainText,
            HtmlBody = htmlContent
        };
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_settings.SenderEmail, _settings.AppPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(quit: true);

            _logger.LogInformation("Email sent to {To} — subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} — subject: {Subject}", toEmail, subject);
            // Don't rethrow — email failures shouldn't crash auth flows.
        }
    }

    private static string Build2FAEmailHtml(string name, string code) => $@"
        <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;'>
            <h2 style='color: #1a1a2e;'>Verification Code</h2>
            <p>Hi {name},</p>
            <p>Your verification code is:</p>
            <div style='background: #f0f0f5; padding: 16px 24px; border-radius: 8px;
                        text-align: center; margin: 24px 0;'>
                <span style='font-size: 32px; font-weight: bold; letter-spacing: 6px;
                             color: #1a1a2e;'>{code}</span>
            </div>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p style='color: #666; font-size: 13px;'>
                If you didn't request this code, you can safely ignore this email.
            </p>
        </div>";

    private static string BuildPasswordResetHtml(string name, string link) => $@"
        <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;'>
            <h2 style='color: #1a1a2e;'>Reset Your Password</h2>
            <p>Hi {name},</p>
            <p>We received a request to reset your password. Click the button below:</p>
            <div style='text-align: center; margin: 24px 0;'>
                <a href='{link}'
                   style='background: #1a1a2e; color: white; padding: 12px 32px;
                          border-radius: 6px; text-decoration: none; font-weight: bold;'>
                    Reset Password
                </a>
            </div>
            <p style='color: #666; font-size: 13px;'>
                This link expires in 1 hour. If you didn't request a reset,
                ignore this email — your password will remain unchanged.
            </p>
            <p style='color: #999; font-size: 12px; word-break: break-all;'>
                Direct link: {link}
            </p>
        </div>";

    private static string BuildWelcomeHtml(string name) => $@"
        <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;'>
            <h2 style='color: #1a1a2e;'>Welcome!</h2>
            <p>Hi {name},</p>
            <p>Your account has been created successfully. You can now log in
               and start using the platform.</p>
            <p>If you have any questions, don't hesitate to reach out.</p>
            <p style='margin-top: 32px; color: #666; font-size: 13px;'>— The Team</p>
        </div>";
}
