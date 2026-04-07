# Email Service Implementation Plan — Gmail SMTP

> **Companion to:** authentication-implementation-plan.md
> **Date:** April 7, 2026
> **Provider:** Gmail SMTP (via App Password)
> **Use cases:** 2FA codes, password reset links, welcome emails

---

## Summary

This plan sets up a reusable email service in the ASP.NET backend using Gmail's SMTP server with the built-in `MailKit` library. No third-party SDK is needed — .NET's ecosystem has first-class SMTP support through MailKit. The service is built behind the same `IEmailService` interface that the other agent's stub implements, so swapping the stub for real email delivery is seamless.

**Why Gmail SMTP?** Zero signup friction, free, and reliable for a class project. You just need a Gmail account with 2-Step Verification enabled and an App Password generated.

---

## Step 1 — Gmail Account Setup

### 1.1 Enable 2-Step Verification on Gmail

You need this enabled before Gmail will let you create an App Password.

1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. Under "How you sign in to Google," click **2-Step Verification** and follow the prompts to enable it.

### 1.2 Generate an App Password

App Passwords let your backend authenticate with Gmail without exposing your real Google password.

1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. You may need to sign in again.
3. Under "App name," type something like `IntexBackend` and click **Create**.
4. Google will show a 16-character password (e.g., `abcd efgh ijkl mnop`). **Copy it immediately** — you won't see it again.
5. Store this securely in your backend config (never in source code).

### 1.3 Important Notes

- The App Password is tied to your Google account. If you disable 2-Step Verification, all App Passwords are revoked.
- Gmail allows ~500 emails/day for regular accounts. More than enough for this project.
- Emails will come from your Gmail address (e.g., `yourname@gmail.com`). For a class project this is fine.

---

## Step 2 — Backend Configuration

### 2.1 Install NuGet Package

MailKit is the recommended SMTP library for .NET — it's more reliable and modern than the legacy `System.Net.Mail.SmtpClient`.

```bash
cd backend/IntexBackendApi
dotnet add package MailKit
```

### 2.2 Add Configuration to appsettings

In `appsettings.Development.json` (already gitignored):

```json
{
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "yourname@gmail.com",
    "SenderName": "Your Org Name",
    "AppPassword": "abcd efgh ijkl mnop"
  }
}
```

For production on Render, set these as environment variables:
- `Email__SmtpHost`
- `Email__SmtpPort`
- `Email__SenderEmail`
- `Email__SenderName`
- `Email__AppPassword`

(ASP.NET Core automatically maps `__` in env vars to `:` in the configuration hierarchy.)

### 2.3 Create a Settings Class

```csharp
// Settings/EmailSettings.cs
namespace IntexBackendApi.Settings
{
    // Holds SMTP configuration values loaded from appsettings or env vars.
    public class EmailSettings
    {
        public string SmtpHost { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string AppPassword { get; set; } = string.Empty;
    }
}
```

### 2.4 Register in Program.cs

```csharp
// In Program.cs
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("Email")
);
```

---

## Step 3 — Email Service Interface & Implementation

### 3.1 Interface

This is the same contract the stub already implements. The Gmail service implements the same interface, making the swap seamless.

```csharp
// Services/IEmailService.cs
namespace IntexBackendApi.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Send a 2FA verification code to the user.
        /// </summary>
        Task SendTwoFactorCodeAsync(string toEmail, string userName, string code);

        /// <summary>
        /// Send a password reset link to the user.
        /// </summary>
        Task SendPasswordResetAsync(string toEmail, string userName, string resetLink);

        /// <summary>
        /// Send a welcome email after successful registration.
        /// </summary>
        Task SendWelcomeEmailAsync(string toEmail, string userName);
    }
}
```

### 3.2 Gmail SMTP Implementation

```csharp
// Services/GmailEmailService.cs
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using IntexBackendApi.Settings;

namespace IntexBackendApi.Services
{
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
            _logger = logger;
        }

        // ── 2FA Code Email ──────────────────────────────────────────
        public async Task SendTwoFactorCodeAsync(
            string toEmail, string userName, string code)
        {
            var subject = "Your verification code";
            var htmlBody = Build2FAEmailHtml(userName, code);
            var plainBody = $"Hi {userName}, your verification code is: {code}. "
                          + "It expires in 10 minutes.";

            await SendEmailAsync(toEmail, subject, plainBody, htmlBody);
        }

        // ── Password Reset Email ────────────────────────────────────
        public async Task SendPasswordResetAsync(
            string toEmail, string userName, string resetLink)
        {
            var subject = "Reset your password";
            var htmlBody = BuildPasswordResetHtml(userName, resetLink);
            var plainBody = $"Hi {userName}, click this link to reset your password: "
                          + $"{resetLink}. This link expires in 1 hour.";

            await SendEmailAsync(toEmail, subject, plainBody, htmlBody);
        }

        // ── Welcome Email ───────────────────────────────────────────
        public async Task SendWelcomeEmailAsync(
            string toEmail, string userName)
        {
            var subject = "Welcome to our platform!";
            var htmlBody = BuildWelcomeHtml(userName);
            var plainBody = $"Hi {userName}, welcome! Your account has been created.";

            await SendEmailAsync(toEmail, subject, plainBody, htmlBody);
        }

        // ── Core Send Method ────────────────────────────────────────
        // Connects to Gmail SMTP, authenticates with the App Password,
        // and sends a single email with both HTML and plain text bodies.
        private async Task SendEmailAsync(
            string toEmail, string subject, string plainText, string htmlContent)
        {
            // Build the email message
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            // Create a multipart body with both plain text and HTML
            // (email clients that can't render HTML will fall back to plain text)
            var bodyBuilder = new BodyBuilder
            {
                TextBody = plainText,
                HtmlBody = htmlContent
            };
            message.Body = bodyBuilder.ToMessageBody();

            try
            {
                using var client = new SmtpClient();

                // Connect to Gmail SMTP with STARTTLS on port 587
                await client.ConnectAsync(
                    _settings.SmtpHost,
                    _settings.SmtpPort,
                    SecureSocketOptions.StartTls);

                // Authenticate with Gmail App Password
                await client.AuthenticateAsync(
                    _settings.SenderEmail,
                    _settings.AppPassword);

                // Send the email
                await client.SendAsync(message);
                await client.DisconnectAsync(quit: true);

                _logger.LogInformation(
                    "Email sent to {To} — subject: {Subject}",
                    toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to send email to {To} — subject: {Subject}",
                    toEmail, subject);

                // Don't throw — email failures shouldn't crash auth flows.
                // The user will see a generic error or can retry.
            }
        }

        // ── HTML Templates ──────────────────────────────────────────
        // Inline for simplicity. For a production app you might load
        // from .html files or use a templating engine.

        private static string Build2FAEmailHtml(string name, string code)
        {
            return $@"
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
        }

        private static string BuildPasswordResetHtml(string name, string link)
        {
            return $@"
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
        }

        private static string BuildWelcomeHtml(string name)
        {
            return $@"
            <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;'>
                <h2 style='color: #1a1a2e;'>Welcome!</h2>
                <p>Hi {name},</p>
                <p>Your account has been created successfully. You can now log in
                   and start using the platform.</p>
                <p>If you have any questions, don't hesitate to reach out.</p>
                <p style='margin-top: 32px; color: #666; font-size: 13px;'>
                    — The Team
                </p>
            </div>";
        }
    }
}
```

### 3.3 Register the Service in Program.cs

```csharp
// In Program.cs — swap the stub for the real implementation
// when Gmail SMTP is configured

if (string.IsNullOrEmpty(builder.Configuration["Email:AppPassword"]))
{
    // No App Password configured — use the stub (logs emails to console)
    builder.Services.AddScoped<IEmailService, StubEmailService>();
}
else
{
    // Gmail SMTP is configured — use the real service
    builder.Services.AddScoped<IEmailService, GmailEmailService>();
}
```

This conditional registration means:
- **During local dev without an App Password:** the stub continues to work (the other agent's implementation).
- **Once you add the Gmail App Password:** it automatically switches to real email delivery.
- **No code changes needed** — just add the config value.

---

## Step 4 — Wiring Into Auth Flows

### 4.1 Two-Factor Authentication

In your `AuthController` login flow, inject `IEmailService` and call it after generating the code. The controller already has the 2FA check in place with a stub — here's what the real version looks like:

```csharp
// In AuthController, update the login 2FA block:

if (user.TwoFactorEnabled)
{
    // Generate a real 2FA token using Identity's email token provider
    var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");

    // Send it to the user's email
    await _emailService.SendTwoFactorCodeAsync(user.Email!, user.FullName, code);

    return Ok(new AuthResponseDto
    {
        Requires2FA = true,
        UserId      = user.Id,
    });
}
```

And update the `verify-2fa` endpoint to use real verification:

```csharp
// In AuthController verify-2fa endpoint, replace the stub logic:

var valid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", dto.Code);
if (!valid)
    return Unauthorized(new { message = "Invalid or expired code" });

var token   = await GenerateJwtTokenAsync(user);
var profile = await BuildProfileDtoAsync(user);

return Ok(new AuthResponseDto { Token = token, User = profile });
```

### 4.2 Password Reset

Add two new endpoints to `AuthController`:

```csharp
// POST /api/auth/forgot-password
// Accepts { email } in body. Generates a reset token and emails the link.
// Always returns 200 to prevent email enumeration attacks.
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
{
    var user = await _userManager.FindByEmailAsync(dto.Email);

    // Always return OK — don't reveal whether the email exists
    if (user == null)
        return Ok(new { message = "If that email exists, a reset link has been sent." });

    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
    var encodedToken = WebUtility.UrlEncode(token);
    var resetLink = $"{_frontendBaseUrl}/reset-password?email={user.Email}&token={encodedToken}";

    await _emailService.SendPasswordResetAsync(user.Email!, user.FullName, resetLink);

    return Ok(new { message = "If that email exists, a reset link has been sent." });
}

// POST /api/auth/reset-password
// Accepts { email, token, newPassword } in body.
[HttpPost("reset-password")]
public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
{
    var user = await _userManager.FindByEmailAsync(dto.Email);
    if (user == null)
        return BadRequest("Invalid request.");

    var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);

    if (!result.Succeeded)
        return BadRequest(result.Errors.Select(e => e.Description));

    return Ok(new { message = "Password has been reset successfully." });
}
```

**Note:** You'll need to add `_frontendBaseUrl` as a config value (e.g., `https://intex-w26.vercel.app` in production, `http://localhost:5173` in dev) and inject it into the controller or read from `IConfiguration`.

### 4.3 Welcome Email

In the registration endpoint, after the user is created successfully:

```csharp
// In AuthController register flow, after CreateAsync and AddToRoleAsync:
await _emailService.SendWelcomeEmailAsync(user.Email!, user.FullName);
```

---

## Step 5 — Frontend Pages

### 5.1 Forgot Password Page

Create `frontend/src/pages/ForgotPassword.tsx`:
- Simple form with an email input.
- On submit, POST to `/api/auth/forgot-password`.
- Show a confirmation message ("Check your email for a reset link") regardless of whether the email exists.

### 5.2 Reset Password Page

Create `frontend/src/pages/ResetPassword.tsx`:
- Reads `email` and `token` from the URL query params.
- Form with "New Password" and "Confirm Password" fields.
- Client-side validation: minimum 14 characters (matching the backend policy).
- On submit, POST to `/api/auth/reset-password`.
- On success, redirect to login with a success message.

### 5.3 Route Updates in App.tsx

```typescript
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

Add a "Forgot password?" link on the Login page that navigates to `/forgot-password`.

---

## Step 6 — New Files Summary

| File | Purpose |
|---|---|
| `Settings/EmailSettings.cs` | Config class for SMTP host, port, sender, App Password |
| `Services/IEmailService.cs` | Interface (may already exist from the stub agent) |
| `Services/GmailEmailService.cs` | Gmail SMTP implementation using MailKit |
| `DTOs/ForgotPasswordDto.cs` | Request shape: `{ email }` |
| `DTOs/ResetPasswordDto.cs` | Request shape: `{ email, token, newPassword }` |
| `frontend/src/pages/ForgotPassword.tsx` | "Forgot password?" form |
| `frontend/src/pages/ResetPassword.tsx` | Reset password with token form |

---

## Step 7 — Testing Checklist

Before considering this complete, verify each flow end-to-end:

- [ ] **2FA code delivery:** Enable 2FA on a test account → log in → receive code at Gmail → enter code → get JWT
- [ ] **Password reset:** Click "Forgot password?" → enter email → receive email with link → click link → enter new password → log in with new password
- [ ] **Welcome email:** Register a new account → receive welcome email
- [ ] **Stub fallback:** Remove the App Password from config → verify the stub service is used and emails are logged to the console instead
- [ ] **Error handling:** Invalid/expired reset tokens show a clear error message
- [ ] **Email enumeration prevention:** Submitting a non-existent email to forgot-password still returns a generic success message
- [ ] **Check spam folder:** Gmail-sent emails sometimes land in spam for new senders — verify delivery

---

## Security Notes

1. **Never reveal whether an email exists** in the forgot-password response. Always return the same message.
2. **Reset tokens expire** — ASP.NET Identity's default token lifespan is reasonable, but you can configure it via `DataProtectionTokenProviderOptions.TokenLifespan` if needed.
3. **App Password is a secret** — treat it like a database password. Store in `appsettings.Development.json` (gitignored) locally, and as an environment variable on Render. Never commit it.
4. **Plain text fallback** — every email includes both HTML and plain text bodies for clients that don't render HTML.
5. **Email failures are caught** — the `GmailEmailService` catches exceptions so a Gmail outage won't crash your login flow. Failures are logged for debugging.
6. **Don't use your personal Gmail for production** — for the class project this is fine, but note that the "from" address will be your Gmail. If you want a cleaner look, create a dedicated Gmail account (e.g., `intex.noreply.w26@gmail.com`).

---

## Troubleshooting

**"Authentication failed" when connecting to Gmail:**
- Double check the App Password (no spaces — Google shows it with spaces but you may need to enter it without).
- Make sure 2-Step Verification is still enabled on the Gmail account.
- Make sure you're using the App Password, not your regular Gmail password.

**Emails landing in spam:**
- This is common with Gmail-sent emails. For a class project, just note this for the graders.
- You can reduce spam likelihood by making sure the "From" name is professional and the email content doesn't look spammy.

**"Connection refused" or timeout:**
- Verify you're using port 587 with STARTTLS (not port 465 with SSL, which uses a different connection mode).
- Check that outbound SMTP traffic isn't blocked by your network/firewall. Some university networks block port 587.
- If on a restricted network, try port 465 with `SecureSocketOptions.SslOnConnect` instead.
