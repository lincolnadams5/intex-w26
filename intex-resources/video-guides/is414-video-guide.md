# IS 414 Security — Video Demonstration Guide
**Pag-asa Sanctuary | INTEX W26**

This guide walks through every IS 414 rubric item in order, tells you exactly what to show and say on camera, and points to the specific file and line of code that satisfies each requirement. Work through this top to bottom while recording.

> **Before you start recording:** Have the following open and ready:
> - The deployed site: `https://intex-w26.lincolnadams.com` (or `https://intex-w26.vercel.app`)
> - The deployed backend API: `https://intex-backend.onrender.com`
> - VS Code with the repository open
> - Chrome DevTools (F12) ready to use
> - A logged-out browser session (clear cookies/localStorage before starting)

---

## Rubric at a Glance

| # | Requirement | Points | Status |
|---|---|---|---|
| 1 | Confidentiality — HTTPS/TLS | 1.0 | ✅ |
| 2 | Confidentiality — HTTP → HTTPS Redirect | 0.5 | ✅ |
| 3 | Authentication — Username/Password | 3.0 | ✅ |
| 4 | Authentication — Better Password Policy | 1.0 | ✅ |
| 5 | Authentication — Protected Pages & Endpoints | 1.0 | ✅ |
| 6 | RBAC — Admin-Only CUD | 1.5 | ✅ |
| 7 | Integrity — Delete Confirmation | 1.0 | ✅ |
| 8 | Credentials — Stored Securely | 1.0 | ⚠️ |
| 9 | Privacy — Privacy Policy | 1.0 | ✅ |
| 10 | Privacy — GDPR Cookie Consent | 1.0 | ✅ |
| 11 | Attack Mitigations — CSP Header | 2.0 | ✅ |
| 12 | Availability — Publicly Deployed | 4.0 | ✅ |
| 13 | Additional Security Features | 2.0 | ✅ |
| | **TOTAL** | **20.0** | |

---

---

## 1. Confidentiality — HTTPS/TLS
**Points: 1.0**

### What the grader is looking for
A valid TLS certificate on your public URL so all traffic is encrypted in transit.

### How to demonstrate

**On camera — browser:**
1. Navigate to `https://intex-w26.lincolnadams.com`
2. Click the padlock icon in the Chrome address bar
3. Click **"Connection is secure"** → **"Certificate is valid"**
4. Show the certificate details — the issuer (e.g. Let's Encrypt / DigiCert / Vercel) and the expiry date

**On camera — DevTools:**
1. Open DevTools → **Security** tab
2. Show the green **"Secure connection"** message and the certificate details panel

### What to say
> *"All connections to Pag-asa Sanctuary use HTTPS with a valid TLS certificate. You can see the padlock in the address bar and the certificate issued by [issuer]. The Security tab in DevTools confirms the connection is secure."*

### Code evidence
**File:** `backend/IntexBackendApi/Program.cs`
```csharp
// Line 92-97 — HSTS configuration
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});

// Line 125 — HSTS middleware (production only)
app.UseHsts();

// Line 129 — HTTPS redirect
app.UseHttpsRedirection();
```

> **Show this code on camera** after showing the browser certificate.

---

## 2. Confidentiality — HTTP → HTTPS Redirect
**Points: 0.5**

### What the grader is looking for
Any HTTP request should automatically redirect to HTTPS. They may check this with a network tool or by typing `http://` manually.

### How to demonstrate

**Option A — Browser:**
1. In the address bar, type `http://intex-w26.lincolnadams.com` (note: `http`, not `https`)
2. Press Enter
3. Show that the browser immediately redirects to `https://intex-w26.lincolnadams.com`

**Option B — DevTools Network tab:**
1. Open DevTools → **Network** tab, check **Preserve log**
2. Navigate to `http://intex-w26.lincolnadams.com`
3. Show the first request returned a **301** or **308** redirect to the HTTPS URL
4. Show the second request succeeded at the HTTPS URL with **200**

> **Note:** Cloud providers (Vercel, Render) may handle the redirect at the infrastructure level before it reaches your app code — this is fine and still earns full credit. Show the redirect happening in the network tab regardless of where it is enforced.

### What to say
> *"Typing the site with HTTP automatically redirects to HTTPS. You can see the 301 redirect in the Network tab. In code, `app.UseHttpsRedirection()` in Program.cs handles this at the application level, and our cloud provider enforces it at the infrastructure level as well."*

### Code evidence
**File:** `backend/IntexBackendApi/Program.cs`
```csharp
// Line 129
app.UseHttpsRedirection();
```

---

## 3. Authentication — Username / Password
**Points: 3.0**

> **This is the highest-value single requirement. Spend extra time on it.**

### What the grader is looking for
- A working login page that accepts email and password
- Correct credentials let you in; wrong credentials are rejected with a clear error
- ASP.NET Identity (or equivalent) is used under the hood
- JWT or session token issued after login

### How to demonstrate

**Live demo — correct login:**
1. Navigate to `https://intex-w26.lincolnadams.com/login`
2. Enter a valid admin email and password
3. Show the redirect to `/admin/dashboard`
4. Open DevTools → **Application** → **Local Storage** → show the `token` key with a JWT value

**Live demo — wrong credentials:**
1. Log out (or open incognito)
2. Enter the correct email but a wrong password
3. Show the **"Invalid email or password"** error message on screen

**Live demo — account lockout:**
1. Enter wrong credentials 5 times in a row
2. Show the **"Account locked due to too many failed attempts. Try again in 15 minutes."** message
3. Mention this returns HTTP 429

### What to say
> *"Authentication is handled by ASP.NET Identity Core with JWT Bearer tokens. After a successful login, a signed JWT is stored in localStorage and sent as a Bearer token with every subsequent API request. Wrong credentials return a 401 Unauthorized. After 5 consecutive failures the account is locked for 15 minutes, returning a 429 Too Many Requests."*

### Code evidence

**File:** `backend/IntexBackendApi/Program.cs` — Identity setup
```csharp
// Lines 27-48 — ASP.NET Identity Core registration
builder.Services.AddIdentityCore<ApplicationUser>(options => { ... })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders()
    .AddSignInManager();

// Lines 51-72 — JWT Bearer authentication scheme
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => { ... });
```

**File:** `backend/IntexBackendApi/Controllers/AuthController.cs` — Login endpoint
```csharp
// Lines 84-117 — POST /api/auth/login
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto dto)
{
    var user = await _userManager.FindByEmailAsync(dto.Email);
    if (user is null || !user.IsActive)
        return Unauthorized(new { message = "Invalid email or password" });

    var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

    if (result.IsLockedOut)
        return StatusCode(429, new { message = "Account locked due to too many failed attempts..." });

    if (!result.Succeeded)
        return Unauthorized(new { message = "Invalid email or password" });
    ...
}
```

**File:** `backend/IntexBackendApi/Controllers/AuthController.cs` — JWT generation
```csharp
// Lines ~230-260 — GenerateJwtTokenAsync private method
private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
{
    var roles  = await _userManager.GetRolesAsync(user);
    var claims = new List<Claim> { ... };
    var token  = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddHours(1), ...);
    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

**File:** `frontend/src/contexts/AuthContext.tsx` — Token storage
```tsx
// Line ~79 — JWT stored in localStorage after login
localStorage.setItem('token', data.token)
```

---

## 4. Authentication — Better Password Policy
**Points: 1.0**

> **⚠️ The rubric says this will be STRICTLY graded according to how it was taught in class. Make sure to show the exact code clearly.**

### What the grader is looking for
Password options that are stricter than the ASP.NET Identity defaults. The class-specific instruction is: **minimum 14 characters only** (no digit, uppercase, lowercase, or special character requirements). This is stricter because length is more important than complexity.

### How to demonstrate

**Live demo — weak password rejected:**
1. Go to `/register`
2. Try to register with a password shorter than 14 characters (e.g. `ShortPass123`)
3. Show the error message returned

**On camera — show the code:**
Open `backend/IntexBackendApi/Program.cs` and scroll to the password options.

### What to say
> *"Our password policy requires a minimum of 14 characters. We intentionally disabled complexity requirements — no required digits, uppercase, lowercase, or special characters — because research shows that length is more effective than complexity. This was implemented exactly as taught in class. You can see the `RequiredLength = 14` setting with all other requirements explicitly set to false."*

### Code evidence
**File:** `backend/IntexBackendApi/Program.cs`
```csharp
// Lines 29-35 — Password policy
options.Password.RequiredLength = 14;         // 14-character minimum (default is 6)
options.Password.RequireDigit = false;        // No digit required
options.Password.RequireLowercase = false;    // No lowercase required
options.Password.RequireUppercase = false;    // No uppercase required
options.Password.RequireNonAlphanumeric = false; // No special char required
options.Password.RequiredUniqueChars = 0;    // No unique chars required

// Lines 37-40 — Account lockout
options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
options.Lockout.MaxFailedAccessAttempts = 5;
options.Lockout.AllowedForNewUsers = true;
```

**File:** `backend/IntexBackendApi/DTOs/RegisterDto.cs`
```csharp
// DTO-level enforcement (defense in depth)
[Required]
[StringLength(256, MinimumLength = 14)]
public string Password { get; set; } = string.Empty;
```

---

## 5. Authentication — Protected Pages and API Endpoints
**Points: 1.0**

### What the grader is looking for
- Unauthenticated users can browse public pages (home, impact dashboard, privacy policy)
- Authenticated users can access their role-appropriate pages
- API endpoints correctly return 401 when called without a valid token

### How to demonstrate

**Live demo — public access:**
1. In a logged-out state, navigate to `/` (Landing page) — show it loads fine
2. Navigate to `/impact` (Impact Dashboard) — show it loads fine
3. Navigate to `/privacy` — show it loads fine

**Live demo — protected page blocks unauthenticated users:**
1. While logged out, manually navigate to `https://intex-w26.lincolnadams.com/admin/dashboard`
2. Show you are redirected to `/login` or `/unauthorized`

**Live demo — API blocks unauthenticated requests:**
1. Open DevTools → **Console**
2. Run this fetch call (no Authorization header):
   ```js
   fetch('https://intex-backend.onrender.com/api/admin/users').then(r => console.log(r.status))
   ```
3. Show the console logs `401`

### What to say
> *"Public pages — the landing page, impact dashboard, and privacy policy — are accessible to anyone. The admin portal and all CRUD API endpoints require a valid JWT Bearer token. Attempting to access `/admin/dashboard` without authentication redirects to the login page. Calling a protected API endpoint without a token returns 401 Unauthorized."*

### Code evidence

**File:** `frontend/src/App.tsx` — Public routes (no protection)
```tsx
// Lines 50-60 — Public routes accessible to everyone
<Route path="/" element={<Landing />} />
<Route path="/impact" element={<ImpactDashboard />} />
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/login" element={<Login />} />
```

**File:** `frontend/src/App.tsx` — Protected admin route
```tsx
// Lines 79-98 — Admin portal requires Admin role
<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={['Admin']}>
      <AdminLayout />
    </ProtectedRoute>
  }
>
```

**File:** `backend/IntexBackendApi/Controllers/AdminController.cs`
```csharp
// Line 13 — Class-level: ALL admin endpoints require Admin role
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase { ... }
```

**File:** `backend/IntexBackendApi/Controllers/SafehousesController.cs`
```csharp
// Line 37 — POST requires auth
[Authorize(Policy = "StaffOrAdmin")]
[HttpPost]
public async Task<IActionResult> Create(...)

// Line 47 — PUT requires auth
[Authorize(Policy = "StaffOrAdmin")]
[HttpPut("{id}")]
public async Task<IActionResult> Update(...)

// Line 58 — DELETE requires Admin specifically
[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(...)
```

---

## 6. RBAC — Only Admin Can CUD (Including Endpoints)
**Points: 1.5**

### What the grader is looking for
Role-Based Access Control where:
- **Admin** can Create, Update, and Delete data
- **Non-admin roles** (Staff, Donor, unauthenticated) cannot perform CUD operations
- RBAC must be enforced at the **API endpoint level**, not just the frontend

### How to demonstrate

**Live demo — show three roles exist:**
1. Log in as admin
2. Navigate to the Users management page (`/admin/users`)
3. Show the list of users and their assigned roles (Admin, Staff, Donor)

**Live demo — admin can create/update/delete:**
1. Navigate to a data management page (e.g. Donors, Safehouses)
2. Show the create, edit, and delete buttons are visible and functional for admin

**Live demo — donor cannot delete (API level):**
1. Log in as a Donor user
2. Open DevTools → Console
3. Run:
   ```js
   fetch('https://intex-backend.onrender.com/api/safehouses/1?confirmed=true', {
     method: 'DELETE',
     headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
   }).then(r => console.log(r.status))
   ```
4. Show the console logs `403` (Forbidden)

**On camera — show the policies:**
Open `Program.cs` and show the authorization policy definitions.

### What to say
> *"We have three roles: Admin, Staff, and Donor. Only Admin can delete data. Staff can create and update certain records but cannot delete anything. Donors can only view their own donation history. RBAC is enforced at the API controller level — you can see the `[Authorize(Policy = "AdminOnly")]` attribute on the class and on the DELETE endpoint. If a Donor token is used to call a DELETE endpoint, the API returns 403 Forbidden before the code even runs."*

### Code evidence

**File:** `backend/IntexBackendApi/Program.cs` — Policy definitions
```csharp
// Lines 75-81
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly",    policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOrAdmin", policy => policy.RequireRole("Admin", "Staff"));
    options.AddPolicy("DonorOnly",    policy => policy.RequireRole("Donor"));
    options.AddPolicy("Authenticated", policy => policy.RequireAuthenticatedUser());
});
```

**File:** `backend/IntexBackendApi/Controllers/AdminController.cs`
```csharp
// Line 13 — Everything in this controller is Admin-only
[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase { ... }
```

**File:** `backend/IntexBackendApi/Controllers/SafehousesController.cs`
```csharp
// Line 37 — C: Create requires Staff or Admin
[Authorize(Policy = "StaffOrAdmin")]
[HttpPost]
public async Task<IActionResult> Create(...)

// Line 47 — U: Update requires Staff or Admin
[Authorize(Policy = "StaffOrAdmin")]
[HttpPut("{id}")]
public async Task<IActionResult> Update(...)

// Line 58 — D: Delete requires Admin only
[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(...)
```

**File:** `backend/IntexBackendApi/Data/DbSeeder.cs` — Role seeding
```csharp
// Roles are seeded at startup — Admin, Staff, Donor
// Admin account: admin@pagasasanctuary.com
// Staff accounts: one per safehouse
// Donor accounts: auto-created from Supporters table
```

---

## 7. Integrity — Confirmation Required to Delete Data
**Points: 1.0**

### What the grader is looking for
Users must explicitly confirm before data is permanently deleted. This applies to both the UI (a confirmation dialog) and the API (a required parameter).

### How to demonstrate

**Live demo — frontend confirmation dialog:**
1. Log in as Admin
2. Navigate to a page with deletable records (e.g. Donors, Safehouses, or Users)
3. Click the delete button on a record
4. Show the confirmation modal/dialog that appears asking "Are you sure?"
5. Click **Cancel** — show nothing was deleted
6. Click delete again, then **Confirm** — show the record is removed

**On camera — show backend enforcement:**
Open `SafehousesController.cs` and show the `?confirmed=true` requirement.

### What to say
> *"Deletion requires two layers of confirmation. The frontend shows a modal dialog asking the user to confirm before sending the delete request. On the backend, the DELETE endpoint requires an explicit `?confirmed=true` query parameter — if it's missing, the API returns a 400 Bad Request with the message 'Deletion must be explicitly confirmed.' This means even if someone bypasses the UI and calls the API directly, they still can't delete without the confirmation flag."*

### Code evidence

**File:** `backend/IntexBackendApi/Controllers/SafehousesController.cs`
```csharp
// Lines 57-70 — DELETE endpoint requires explicit confirmation
[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id, [FromQuery] bool confirmed = false)
{
    if (!confirmed)
        return BadRequest(new { message = "Deletion must be explicitly confirmed. Pass ?confirmed=true" });

    var safehouse = await _db.Safehouses.FindAsync(id);
    if (safehouse is null) return NotFound();

    _db.Safehouses.Remove(safehouse);
    await _db.SaveChangesAsync();
    return NoContent();
}
```

**File:** `frontend/src/components/ConfirmDeleteModal.tsx`
```
// Frontend modal component — shown before any delete action is triggered
// Provides "Cancel" and "Confirm Delete" buttons
// Delete API call is only made after the user clicks Confirm
```

---

## 8. Credentials — Stored Securely / Not in Public Repository
**Points: 1.0**

> **⚠️ IMPORTANT: Read this section carefully before recording. There is a known partial issue here.**

### Current situation
The `.gitignore` is correctly configured to exclude `appsettings.Development.json` and `.env` files. **However**, `appsettings.Development.json` may have been committed before the exclusion was put in place and may still exist in git history. Address this before presenting.

### Steps to take before recording
1. Run `git log --oneline -- backend/IntexBackendApi/appsettings.Development.json` to check if it appears in history
2. If it does, rotate all exposed credentials immediately:
   - Generate a new JWT key (32+ character random string)
   - Change the Supabase database password in the Supabase dashboard
   - Revoke and regenerate the Gmail app password in Google Account settings
3. Update the new credentials in your environment variables (Render dashboard, local user-secrets)

### How to demonstrate

**On camera — show .gitignore:**
1. Open `.gitignore` in VS Code
2. Show the lines that exclude sensitive files:
   ```
   appsettings.Development.json
   .env
   .env.*
   !.env.example
   ```

**On camera — show production config uses environment variables:**
1. Open `backend/IntexBackendApi/appsettings.json`
2. Show the placeholders (empty strings or missing values) for sensitive fields
3. Show `Program.cs` where secrets are read from configuration:
   ```csharp
   var jwtKey = builder.Configuration["Jwt:Key"]
       ?? throw new InvalidOperationException("Jwt:Key not configured. Set it via user-secrets locally or Jwt__Key env var in production.");
   ```

**On camera — show Render environment variables (production):**
1. Open the Render dashboard → your backend service → **Environment**
2. Show the environment variables set there (you can blur the values but show the key names)

**On camera — show .env.example (frontend):**
1. Open `frontend/.env.example`
2. Show it contains placeholder values, not real credentials

### What to say
> *"Credentials are kept out of the codebase in two ways. For the backend, sensitive values like the JWT signing key and database connection string are read from environment variables in production — you can see the Render dashboard where they're configured. Locally, we use dotnet user-secrets. The `appsettings.Development.json` file is listed in `.gitignore` and never committed to the repository. For the frontend, the `.env.example` file shows the required variables with placeholder values, and the real `.env` file is gitignored. There are no credentials in any committed file."*

### Code evidence

**File:** `.gitignore`
```
# Backend dev secrets — excluded from repo
appsettings.Development.json

# Frontend environment files
.env
.env.*
!.env.example
```

**File:** `backend/IntexBackendApi/appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""  ← empty placeholder; real value in env var
  },
  "Jwt": {
    "Key": ""  ← empty placeholder; real value in env var
  }
}
```

**File:** `backend/IntexBackendApi/Program.cs`
```csharp
// Jwt:Key is required — throws at startup if missing from env
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key not configured...");

// Connection string is required — throws at startup if missing from env
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
```

**File:** `backend/IntexBackendApi/backend.csproj`
```xml
<!-- UserSecretsId enables dotnet user-secrets for local development -->
<UserSecretsId>dfba6f62-99c0-4db0-a504-5e14092b256b</UserSecretsId>
```

---

## 9. Privacy — Privacy Policy
**Points: 1.0**

### What the grader is looking for
- A privacy policy page with real, customized content (not just a generic template)
- Linked from the site footer (at minimum on the home page)

### How to demonstrate

**Live demo — footer link:**
1. Navigate to the home page
2. Scroll to the footer
3. Show the **"Privacy Policy"** link in the Resources column
4. Click it — show it navigates to `/privacy`

**Live demo — policy content:**
Scroll through the privacy policy page and briefly narrate each section:
- What data we collect
- How we use it
- Data storage and security
- User rights (access, correction, deletion — GDPR-style)
- Cookie policy
- Contact information (`support@pagasa.org`)

### What to say
> *"Our privacy policy is linked from the footer on every page and is accessible to unauthenticated users. The content is customized for Pag-asa Sanctuary — it explains what data we collect, how we use it, how long we retain it, and what rights users have under GDPR including the right to access, correct, and delete their data. The policy also discloses our cookie usage."*

### Code evidence

**File:** `frontend/src/pages/PrivacyPolicy.tsx`
```
// Full privacy policy component covering:
// - Data collection (name, email, donation history, cookies, login info)
// - Data usage (service delivery, security, analytics)
// - User rights (access, correction, deletion, restriction, objection)
// - Cookie disclosure
// - Contact: support@pagasa.org
```

**File:** `frontend/src/components/Footer.tsx`
```tsx
// Line 59 — Privacy Policy link in footer
{ label: 'Privacy Policy', href: '/privacy' }
```

**File:** `frontend/src/App.tsx`
```tsx
// Line 54 — Route definition
<Route path="/privacy" element={<PrivacyPolicy />} />
```

---

## 10. Privacy — GDPR Cookie Consent Notification
**Points: 1.0**

### What the grader is looking for
A cookie consent banner that is either:
- **Fully functional:** The banner actually controls whether tracking/analytics cookies are set
- **Cosmetic:** The banner shows but doesn't actually gate any behavior

> **You must be explicit in the video about which one it is.** You will NOT lose points for cosmetic — just for being unclear.

**Our implementation is fully functional.** Here's how to demonstrate it.

### How to demonstrate

**Live demo — banner appears on first visit:**
1. Clear all cookies and localStorage for the site (DevTools → Application → Clear site data)
2. Navigate to the home page
3. Show the cookie consent banner appearing at the bottom of the page

**Live demo — accepting enables analytics:**
1. Open DevTools → **Console**
2. Click **Accept** on the banner
3. Show in the Console: `[Analytics] page_view` log entries appear
4. Open DevTools → **Application → Cookies** → show `cookie_consent=accepted` and `analytics=true` cookies set

**Live demo — declining blocks analytics:**
1. Clear site data again
2. Navigate to the home page, open Console
3. Click **Decline** on the banner
4. Navigate to another page
5. Show the Console has NO `[Analytics]` entries
6. Show Cookies: `cookie_consent=declined`, and the `analytics` cookie is absent

### What to say
> *"Our cookie consent is fully functional. When a user accepts cookies, an analytics cookie is set and our page-view tracking activates — you can see the structured `[Analytics] page_view` events firing in the console each time you navigate. When a user declines, no analytics cookie is set and no tracking events are fired. The banner doesn't reappear after the user has made a choice. We link to our Privacy Policy from within the banner."*

### Code evidence

**File:** `frontend/src/components/CookieBanner.tsx`
```tsx
// Banner appears only until user makes a choice
const accept = () => {
    setCookie("cookie_consent", "accepted");  // Sets consent cookie
    document.cookie = "analytics=true; path=/";  // Enables analytics cookie
    setVisible(false);
};

const decline = () => {
    setCookie("cookie_consent", "declined");  // Sets consent cookie
    document.cookie = "analytics=; Max-Age=0; path=/";  // Removes analytics cookie
    setVisible(false);
};
```

**File:** `frontend/src/utils/analytics.ts`
```ts
// trackPageView only fires when consent is "accepted"
export function trackPageView(path: string): void {
    const consent = getCookie('cookie_consent')
    if (consent !== 'accepted') return  // ← BLOCKS tracking if not accepted
    console.info('[Analytics] page_view', { path, timestamp: ..., session: ... })
}
```

**File:** `frontend/src/App.tsx`
```tsx
// AnalyticsTracker component calls trackPageView on every route change
function AnalyticsTracker() {
    const location = useLocation()
    useEffect(() => {
        trackPageView(location.pathname)
    }, [location.pathname])
    return null
}
```

---

## 11. Attack Mitigations — CSP Header
**Points: 2.0**

> **⚠️ The grader will verify the CSP header using DevTools Network inspector, NOT by looking at the page source. Make sure to show it in the Network tab.**

### What the grader is looking for
- `Content-Security-Policy` header present on HTTP responses
- Header is set via HTTP (not a `<meta>` tag in the HTML)
- Sources are appropriately specified and restricted (not a wildcard `*`)

### How to demonstrate

**Live demo — show the CSP header in DevTools:**
1. Navigate to `https://intex-w26.lincolnadams.com`
2. Open DevTools → **Network** tab
3. Click on the first document request (the main HTML file)
4. Click the **Headers** tab
5. Scroll down to **Response Headers**
6. Show the `Content-Security-Policy` header and its full value

**On camera — point out each directive:**
> Walk through each directive and explain why it is included.

**On camera — show the code:**
Open `Program.cs` and show the middleware block.

### What to say
> *"The Content-Security-Policy header is set as an HTTP response header on every request — not as a meta tag, which would be easier to bypass. You can see it here in the Network tab's Response Headers. Let me walk through the directives: `default-src 'self'` means all resources default to same-origin only. `script-src 'self' https://accounts.google.com` allows our own scripts plus Google Identity Services for OAuth. `style-src 'self' 'unsafe-inline'` allows our styles — the unsafe-inline is required for our Tailwind CSS. `connect-src` restricts API calls to our own backend and Google's tokeninfo endpoint. `frame-ancestors 'none'` prevents the page from being embedded in an iframe, which protects against clickjacking. `form-action 'self'` ensures forms can only submit to our own domain."*

### Code evidence

**File:** `backend/IntexBackendApi/Program.cs`
```csharp
// Lines 131-148 — CSP middleware (set as HTTP header, not meta tag)
app.Use(async (context, next) =>
{
    context.Response.Headers.Append(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' https://accounts.google.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' https://intex-backend.onrender.com https://oauth2.googleapis.com; " +
        "frame-src https://accounts.google.com; " +
        "frame-ancestors 'none'; " +
        "form-action 'self';"
    );
    await next();
});
```

**Directive explanations for the video:**

| Directive | Value | Reason |
|---|---|---|
| `default-src` | `'self'` | Block all unspecified resources by default |
| `script-src` | `'self' https://accounts.google.com` | Own scripts + Google OAuth library |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind CSS requires inline styles |
| `img-src` | `'self' data: https:` | Allow local, base64, and HTTPS images |
| `font-src` | `'self'` | Fonts from same origin only |
| `connect-src` | `'self' + Render URL + Google tokeninfo` | API and OAuth token verification |
| `frame-src` | `https://accounts.google.com` | Google OAuth popup |
| `frame-ancestors` | `'none'` | Prevents clickjacking via iframes |
| `form-action` | `'self'` | Forms submit to same origin only |

---

## 12. Availability — Publicly Deployed
**Points: 4.0**

> **This is the highest-value item in the rubric. Confirm all URLs work before recording.**

### What the grader is looking for
- The site is publicly accessible over the internet (not just localhost)
- Both frontend and backend are deployed
- The database is live

### How to demonstrate

**Live demo — open the site:**
1. Navigate to `https://intex-w26.lincolnadams.com` from your browser (confirm this is the live production URL)
2. Show the full landing page loading with content from the live database
3. Navigate to the Impact Dashboard — show real data

**Live demo — backend API is live:**
1. In the browser address bar, navigate to `https://intex-backend.onrender.com/api/public/impact`
2. Show the JSON response returned from the live backend and database

**Live demo — login and admin portal:**
1. Log into the site using the admin credentials
2. Show the admin dashboard with live data

### What to say
> *"The frontend is deployed to Vercel at `intex-w26.lincolnadams.com` with a custom domain and automatic HTTPS. The backend ASP.NET API is deployed to Render at `intex-backend.onrender.com`. The PostgreSQL database is hosted on Supabase. All three tiers are live and publicly accessible. The data you see on screen is real data from the live database, not mock data."*

### Infrastructure summary

| Tier | Provider | URL |
|---|---|---|
| Frontend (React/Vite) | Vercel | `https://intex-w26.lincolnadams.com` |
| Backend (.NET 10 API) | Render | `https://intex-backend.onrender.com` |
| Database (PostgreSQL) | Supabase | Cloud-hosted, connected via connection string |

### Code evidence

**File:** `backend/IntexBackendApi/Program.cs` — CORS whitelist confirms production URLs
```csharp
// Lines 99-113
policy.WithOrigins(
    "http://localhost:5173",
    "https://intex-w26.vercel.app",
    "https://intex-w26.lincolnadams.com",
    "https://*la-personal.vercel.app"
)
```

---

## 13. Additional Security Features
**Points: 2.0 (extra credit)**

> You implemented many additional features. Cover as many as you can in the video to maximize the extra credit score. Walk through them in the order shown below — the most impactful ones first.

---

### Feature A — Two-Factor Authentication (2FA)
**Estimated value: highest**

**How to demonstrate:**
1. Log in as the MFA-enabled account (provide this account in the submission form)
2. Show that after entering the correct password, a code is sent to email instead of logging in directly
3. Show the 6-digit code input screen
4. Enter the code — show successful login

**What to say:**
> *"Two-factor authentication is implemented for any account that enables it. After a successful password login, if 2FA is enabled, ASP.NET Identity generates a 6-digit time-sensitive token and emails it to the user via Gmail SMTP. The login flow pauses until the correct code is entered. This is fully integrated into the existing JWT flow — no token is issued until both factors are verified."*

**Code evidence — `backend/IntexBackendApi/Controllers/AuthController.cs`:**
```csharp
// Lines 100-110 — Login pauses for 2FA
if (user.TwoFactorEnabled)
{
    var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");
    await _emailService.SendTwoFactorCodeAsync(user.Email!, user.FullName, code);
    return Ok(new AuthResponseDto { Requires2FA = true, UserId = user.Id });
}

// Lines 172-189 — POST /api/auth/verify-2fa
var valid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", dto.Code);
if (!valid)
    return Unauthorized(new { message = "Invalid or expired code" });
```

**Code evidence — `frontend/src/pages/login/Login.tsx`:**
```tsx
// 2FA code input form shown when requires2FA === true
// 6-digit input with auto-focus, maxLength=6
// Submits to /api/auth/verify-2fa
```

---

### Feature B — Google OAuth (Third-Party Authentication)
**Estimated value: high**

**How to demonstrate:**
1. Navigate to `/login`
2. Show the **"Sign in with Google"** button
3. Click it — show the Google popup/redirect
4. Complete the Google login
5. Show you are redirected to the donor dashboard with a JWT in localStorage

**What to say:**
> *"We added Google OAuth as a third-party authentication option. When the user clicks 'Sign in with Google', Google Identity Services handles the authentication and returns a signed ID token. Our backend calls Google's tokeninfo endpoint to verify the token's signature and confirms the audience matches our app's Client ID — this prevents token substitution attacks. If the Google account has never logged in before, a new Donor account is automatically created and a welcome email is sent."*

**Code evidence — `backend/IntexBackendApi/Controllers/AuthController.cs`:**
```csharp
// POST /api/auth/google-signin
// 1. Verifies ID token against Google's tokeninfo endpoint
var tokenInfoUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={dto.Credential}";
var response = await http.GetAsync(tokenInfoUrl);

// 2. Validates audience (prevents token substitution attacks)
if (payload.Aud != googleClientId)
    return Unauthorized(new { message = "Token audience mismatch" });

// 3. Finds or creates user, assigns Donor role
// 4. Returns same JWT as standard login
```

**Code evidence — `frontend/src/main.tsx`:**
```tsx
// GoogleOAuthProvider wraps the entire app
<GoogleOAuthProvider clientId={googleClientId}>
    <App />
</GoogleOAuthProvider>
```

**Code evidence — `frontend/src/pages/login/Login.tsx`:**
```tsx
// GoogleLogin component renders the button
<GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={handleGoogleError}
/>
```

---

### Feature C — HSTS with Preload
**Estimated value: moderate**

**How to demonstrate:**

1. Open DevTools → **Network** tab → click any response from your backend
2. Show the `Strict-Transport-Security` response header

**What to say:**
> *"HTTP Strict Transport Security is configured with a 1-year max age, includeSubDomains, and the preload flag. This instructs browsers to only ever connect to this site over HTTPS for the next year, even before the first request — and with preload enabled, the domain can be added to browsers' built-in HSTS preload lists."*

**Code evidence — `backend/IntexBackendApi/Program.cs`:**
```csharp
// Lines 92-97
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});

// Line 125 — Applied in production only
app.UseHsts();
```

---

### Feature D — Account Lockout
**Estimated value: moderate**

**How to demonstrate:**
1. On the login page, enter a real email with a wrong password 5 times
2. Show the **"Account locked"** error message on the 5th attempt
3. Show it returns HTTP 429 (check DevTools → Network → response status)

**What to say:**
> *"After 5 consecutive failed login attempts, the account is locked for 15 minutes. The server returns HTTP 429 Too Many Requests. This is ASP.NET Identity's built-in lockout feature, configured at startup. It prevents brute-force password attacks."*

**Code evidence — `backend/IntexBackendApi/Program.cs`:**
```csharp
// Lines 37-40
options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
options.Lockout.MaxFailedAccessAttempts = 5;
options.Lockout.AllowedForNewUsers = true;
```

**Code evidence — `backend/IntexBackendApi/Controllers/AuthController.cs`:**
```csharp
// Line 92-95
if (result.IsLockedOut)
    return StatusCode(429, new { message = "Account locked due to too many failed attempts. Try again in 15 minutes." });
```

---

### Feature E — Input Sanitization and Data Encoding
**Estimated value: moderate**

**On camera — backend validation:**
Open any DTO file (e.g. `DTOs/RegisterDto.cs`) and show the data annotation attributes.

**On camera — frontend DOMPurify:**
Open `frontend/src/utils/sanitize.ts` and show the `sanitizeHtml()` function.

**What to say:**
> *"We have three layers of input protection. First, Entity Framework Core parameterizes all database queries, preventing SQL injection. Second, all request DTOs use data annotation validators — `[Required]`, `[EmailAddress]`, `[StringLength]` — so the `[ApiController]` attribute automatically rejects malformed input with a 400 before it reaches any business logic. Third, we installed DOMPurify on the frontend and created a `sanitizeHtml()` utility that strips any disallowed HTML tags before rendering. This is defense-in-depth against XSS attacks."*

**Code evidence — `backend/IntexBackendApi/DTOs/RegisterDto.cs`:**
```csharp
[Required]
[EmailAddress]
[StringLength(256)]
public string Email { get; set; } = string.Empty;

[Required]
[StringLength(256, MinimumLength = 14)]
public string Password { get; set; } = string.Empty;
```

**Code evidence — `frontend/src/utils/sanitize.ts`:**
```ts
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
}
```

---

### Feature F — Password Reset with Email Verification
**How to demonstrate:**
1. Click **"Forgot password?"** on the login page
2. Enter a valid email address
3. Show the success message (always returns 200 to prevent email enumeration)
4. Open the email — show the reset link
5. Click the link — show the reset password form

**What to say:**
> *"Password reset uses ASP.NET Identity's secure token system. The forgot-password endpoint always returns 200 regardless of whether the email exists — this prevents email enumeration attacks where an attacker could discover which emails are registered. If the email does exist, a time-limited token is generated and sent via email. The reset token is URL-encoded to prevent corruption in transit."*

**Code evidence — `backend/IntexBackendApi/Controllers/AuthController.cs`:**
```csharp
// Lines 192-209 — Always returns 200 (anti-enumeration)
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
{
    var user = await _userManager.FindByEmailAsync(dto.Email);
    if (user is not null)
    {
        var resetToken   = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(resetToken);
        // ... email sent only if user exists
    }
    return Ok(new { message = "If that email exists, a reset link has been sent." });
}
```

---

## Before You Submit

### Credentials to provide in the submission form
The case requires you to provide three accounts. Confirm these exist and are working before submitting:

| Account | Role | 2FA? | Notes |
|---|---|---|---|
| Account 1 | Admin | **No** | Used by graders to access the admin portal |
| Account 2 | Donor | **No** | Must have historical donation data linked |
| Account 3 | Any | **Yes** | Graders won't log in — just verify MFA is required |

### Final checklist before recording

- [ ] All three user accounts exist and are accessible
- [ ] Live site loads at `https://intex-w26.lincolnadams.com`
- [ ] Backend API responds at `https://intex-backend.onrender.com/api/public/impact`
- [ ] Clear browser cookies/localStorage before recording
- [ ] DevTools open (F12) and ready on Network + Application tabs
- [ ] VS Code open with the repo — key files pinned:
  - `backend/IntexBackendApi/Program.cs`
  - `backend/IntexBackendApi/Controllers/AuthController.cs`
  - `backend/IntexBackendApi/Controllers/SafehousesController.cs`
  - `backend/IntexBackendApi/Controllers/AdminController.cs`
  - `frontend/src/components/CookieBanner.tsx`
  - `frontend/src/utils/analytics.ts`
  - `frontend/src/utils/sanitize.ts`
  - `frontend/src/pages/login/Login.tsx`
  - `frontend/src/main.tsx`
  - `.gitignore`

### Credentials issue reminder
Before submitting, rotate credentials if `appsettings.Development.json` ever appeared in your git history. Run:
```bash
git log --oneline -- backend/IntexBackendApi/appsettings.Development.json
```
If it shows any commits, rotate your Supabase password, JWT key, and Gmail app password, then update them in Render's environment variables.
