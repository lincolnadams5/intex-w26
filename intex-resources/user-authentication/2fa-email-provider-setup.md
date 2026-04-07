# Wiring Up Email-Based 2FA

> The 2FA backend endpoints (`/api/auth/enable-2fa`, `/api/auth/verify-2fa`) are already stubbed.
> Follow this guide to connect them to a real email provider.

---

## What Is Already Done

- `TwoFactorEnabled` flag exists on `ApplicationUser` and is stored in the DB.
- `POST /api/auth/enable-2fa` sets `TwoFactorEnabled = true` for the calling user.
- `POST /api/auth/disable-2fa` sets it back to `false`.
- `POST /api/auth/login` detects `TwoFactorEnabled` and returns `{ requires2FA: true, userId }` instead of a token.
- `POST /api/auth/verify-2fa` accepts a `{ userId, code }` body and — once wired — will verify the code and return the JWT.
- The frontend Login page already handles the two-step UI (email+password → code input).

The only missing piece is **generating and sending the code** (step A) and **verifying it** (step B).

---

## Option 1: SendGrid (recommended for Render)

### 1. Install the package

```bash
dotnet add package SendGrid
```

### 2. Add your API key

Set it as a secret locally and as an env var on Render:

```bash
# Locally
dotnet user-secrets set "SendGrid:ApiKey" "<your-api-key>"

# Render dashboard → Environment → Add variable
# Key: SendGrid__ApiKey   Value: <your-api-key>
```

### 3. Create an email sender service

Create `Services/EmailSender.cs`:

```csharp
using Microsoft.AspNetCore.Identity.UI.Services;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace IntexBackendApi.Services;

public class EmailSender : IEmailSender
{
    private readonly string _apiKey;

    public EmailSender(IConfiguration config)
    {
        _apiKey = config["SendGrid:ApiKey"]
            ?? throw new InvalidOperationException("SendGrid:ApiKey not configured.");
    }

    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        var client  = new SendGridClient(_apiKey);
        var from    = new EmailAddress("noreply@pagasasanctuary.org", "Pag-asa Sanctuary");
        var to      = new EmailAddress(email);
        var msg     = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent: null, htmlContent: htmlMessage);
        await client.SendEmailAsync(msg);
    }
}
```

### 4. Register it in Program.cs

```csharp
// Add after the AddIdentityCore(...) block
builder.Services.AddTransient<IEmailSender, EmailSender>();
```

---

## Option 2: MailKit / SMTP (local dev or Gmail)

### 1. Install the package

```bash
dotnet add package MailKit
```

### 2. Add SMTP config (user secrets / Render env var)

```json
// appsettings.Development.json (gitignored)
{
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "yourapp@gmail.com",
    "Password": "your-app-password"
  }
}
```

### 3. Create an email sender service

```csharp
using MailKit.Net.Smtp;
using Microsoft.AspNetCore.Identity.UI.Services;
using MimeKit;

namespace IntexBackendApi.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _config;

    public SmtpEmailSender(IConfiguration config) => _config = config;

    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Pag-asa Sanctuary", _config["Smtp:Username"]));
        message.To.Add(new MailboxAddress("", email));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlMessage };

        using var client = new SmtpClient();
        await client.ConnectAsync(_config["Smtp:Host"], int.Parse(_config["Smtp:Port"]!), false);
        await client.AuthenticateAsync(_config["Smtp:Username"], _config["Smtp:Password"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
```

### 4. Register it in Program.cs

```csharp
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();
```

---

## Completing the Stub Endpoints in AuthController.cs

Once an `IEmailSender` is registered, update the two stub endpoints:

### In `enable-2fa` — send a confirmation email (optional UX step):

```csharp
// After SetTwoFactorEnabledAsync(user, true):
await _emailSender.SendEmailAsync(
    user.Email!,
    "2FA Enabled — Pag-asa Sanctuary",
    "<p>Two-factor authentication has been enabled on your account.</p>"
);
```

### In `login` — generate and email the code when 2FA is required:

Replace the current early-return block with:

```csharp
if (user.TwoFactorEnabled)
{
    // Generate a 6-digit email token (valid for ~10 minutes via Identity's data protection)
    var token = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");

    await _emailSender.SendEmailAsync(
        user.Email!,
        "Your Login Code — Pag-asa Sanctuary",
        $"<p>Your verification code is: <strong>{token}</strong></p>" +
        "<p>This code expires in 10 minutes.</p>"
    );

    return Ok(new AuthResponseDto { Requires2FA = true, UserId = user.Id });
}
```

### In `verify-2fa` — replace the stub with real verification:

```csharp
// Remove the stub block and replace with:
var valid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", dto.Code);
if (!valid)
    return Unauthorized(new { message = "Invalid or expired code" });

var token   = await GenerateJwtTokenAsync(user);
var profile = await BuildProfileDtoAsync(user);
return Ok(new AuthResponseDto { Token = token, User = profile });
```

You also need to inject `IEmailSender` into `AuthController`:

```csharp
private readonly IEmailSender _emailSender;

public AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IConfiguration config,
    IEmailSender emailSender)   // <-- add this
{
    _userManager   = userManager;
    _signInManager = signInManager;
    _config        = config;
    _emailSender   = emailSender;  // <-- and this
}
```

---

## Testing

1. Log in as a Staff or Donor user.
2. Call `POST /api/auth/enable-2fa` (attach your JWT).
3. Log out, then log back in — the login response should include `"requires2FA": true`.
4. Check the email inbox for the 6-digit code.
5. Submit the code to `POST /api/auth/verify-2fa` — you should receive a full JWT.

---

## Notes

- The grader accounts (`admin@pagasasanctuary.com` and all staff accounts) have `TwoFactorEnabled = false` — graders can log in without 2FA.
- The `"Email"` token provider used in `GenerateTwoFactorTokenAsync` is registered automatically by `.AddDefaultTokenProviders()` in `Program.cs`.
- Codes generated by Identity expire after the `DataProtectionTokenProviderOptions.TokenLifespan` (default: 1 day). For a tighter 10-minute window, configure it in `Program.cs`:

```csharp
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromMinutes(10);
});
```
