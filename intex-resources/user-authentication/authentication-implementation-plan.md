# User Authentication & Authorization — Implementation Plan

> **Project:** INTEX W26 (Lighthouse-inspired nonprofit platform)
> **Date:** April 7, 2026
> **Stack:** ASP.NET Core 10 + React/TypeScript (Vite) + PostgreSQL (Supabase)
> **Target:** Full IS414 Security rubric compliance + IS413 auth requirements

---

## Summary of Decisions

| Decision | Choice |
|---|---|
| Auth system | Migrate to ASP.NET Identity |
| Roles | Admin, Staff, Donor |
| Identity database | Same Supabase PostgreSQL instance |
| Password policy | Minimum 14 characters, no other constraints |
| 2FA | Email-based or TOTP (optional per-user) |
| Additional security | HSTS header, CSP header |
| Frontend auth pattern | React AuthContext with role-based rendering |
| Staff permissions | Read + Create + Update (no delete) |

---

## Phase 1 — ASP.NET Identity Migration (Backend)

This phase replaces the current custom `User` table and `AuthService` with the built-in ASP.NET Identity system. Identity gives us role management, password hashing, claims, and token management out of the box, while still using our existing Supabase PostgreSQL database.

### 1.1 Install NuGet Packages

Add these packages to `backend.csproj`:

```
Microsoft.AspNetCore.Identity.EntityFrameworkCore
Microsoft.AspNetCore.Authentication.JwtBearer  (already installed)
```

Remove `BCrypt.Net-Next` once migration is complete — Identity handles password hashing internally.

### 1.2 Create the Identity User Model

Create a new `ApplicationUser` class that extends `IdentityUser`:

```csharp
// Models/ApplicationUser.cs
using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
    // Custom fields beyond what IdentityUser provides
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
```

**Why extend IdentityUser?** — It already provides `Id`, `Email`, `UserName`, `PasswordHash`, `EmailConfirmed`, `TwoFactorEnabled`, and more. We only add fields specific to our domain.

### 1.3 Update AppDbContext

Change `AppDbContext` to inherit from `IdentityDbContext<ApplicationUser>` instead of plain `DbContext`:

```csharp
// Data/AppDbContext.cs
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    // Keep all existing DbSets (Residents, Donations, etc.)
    // Remove the old DbSet<User> Users
    // Identity tables (AspNetUsers, AspNetRoles, etc.) are added automatically
}
```

This will generate the standard Identity tables (`asp_net_users`, `asp_net_roles`, `asp_net_user_roles`, `asp_net_user_claims`, `asp_net_role_claims`, `asp_net_user_logins`, `asp_net_user_tokens`) alongside the existing 18 tables in Supabase. The snake_case naming convention already configured via `EFCore.NamingConventions` will apply to these tables too.

### 1.4 Configure Identity in Program.cs

Replace the current manual JWT setup with Identity's built-in services, then layer JWT on top:

```csharp
// In Program.cs

// 1. Add Identity services with custom password policy
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password policy: ONLY minimum length of 14, no other constraints
    // (Matches IS414 lab requirements — do NOT use defaults)
    options.Password.RequiredLength = 14;
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredUniqueChars = 0;

    // Lockout settings (good security practice)
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// 2. Keep JWT bearer authentication (same as current, but now works with Identity)
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Same JWT config as current — key from appsettings, HMAC-SHA256, 1hr expiry
});

// 3. Add authorization policies for RBAC
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOrAdmin", policy => policy.RequireRole("Admin", "Staff"));
    options.AddPolicy("DonorOnly", policy => policy.RequireRole("Donor"));
    options.AddPolicy("Authenticated", policy => policy.RequireAuthenticatedUser());
});
```

### 1.5 Run EF Core Migration

Generate and apply a migration to create the Identity tables in Supabase:

```bash
dotnet ef migrations add AddAspNetIdentity
dotnet ef database update
```

### 1.6 Migrate Existing User Data

Write a one-time migration script (or seed method) that:
1. Reads any existing rows from the old `users` table.
2. Creates corresponding `ApplicationUser` records via `UserManager<ApplicationUser>`.
3. Assigns them appropriate roles.
4. Drops the old `users` table after verification.

### 1.7 Seed Roles and Default Accounts

Create a `DbInitializer` or seed method in `Program.cs` that runs on startup:

```csharp
// Seed the three roles
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    string[] roles = { "Admin", "Staff", "Donor" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    // Create a default admin account for grading (no 2FA)
    // Create a default non-admin account for grading (no 2FA)
    // Credentials stored in appsettings, NOT hardcoded
}
```

**Important for grading:** The rubric requires at least one admin and one non-admin account *without* 2FA so graders can log in without needing your phone.

---

## Phase 2 — Rewrite Auth Controller & Service (Backend)

### 2.1 Rewrite AuthController

Replace the current `AuthController` to use `UserManager`, `SignInManager`, and `RoleManager` instead of the custom `AuthService`:

**Endpoints to implement:**

| Method | Route | Auth Required | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user (default role: Donor) |
| POST | `/api/auth/login` | No | Authenticate, return JWT with role claims |
| POST | `/api/auth/logout` | Yes | Invalidate session (client-side token removal) |
| GET | `/api/auth/me` | Yes | Return current user profile + role |
| POST | `/api/auth/enable-2fa` | Yes | Generate 2FA setup (TOTP secret or email code) |
| POST | `/api/auth/verify-2fa` | Yes | Verify 2FA code during login |

**Key implementation details:**

- **Registration:** Use `UserManager.CreateAsync()` with password validation. Assign "Donor" role by default. Admin can later promote users via an admin endpoint.
- **Login:** Use `SignInManager.CheckPasswordSignInAsync()`. If valid, generate a JWT that includes the user's role as a claim. If 2FA is enabled, return a partial token and require a second verification step.
- **JWT claims:** Include `ClaimTypes.Role` so that `[Authorize(Roles = "Admin")]` works on controllers.

```csharp
// Example: generating JWT with role claims
private async Task<string> GenerateJwtToken(ApplicationUser user)
{
    var roles = await _userManager.GetRolesAsync(user);

    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Name, user.FullName),
    };

    // Add each role as a claim so [Authorize(Roles = "Admin")] works
    foreach (var role in roles)
    {
        claims.Add(new Claim(ClaimTypes.Role, role));
    }

    // ... sign and return token (same HMAC-SHA256 approach as current)
}
```

### 2.2 Remove Old AuthService

Once the controller is rewritten:
1. Delete `Services/AuthService.cs` and `Services/IAuthService.cs`.
2. Delete `Models/User.cs`, `Models/LoginRequest.cs`, `Models/RegisterRequest.cs` (replace with DTOs).
3. Create clean DTOs in a `DTOs/` folder:

```
DTOs/
  LoginDto.cs         // Email, Password
  RegisterDto.cs      // Email, FullName, Password, ConfirmPassword
  AuthResponseDto.cs  // Token, User info, Roles, Requires2FA flag
  UserProfileDto.cs   // Id, Email, FullName, Role, CreatedAt
```

### 2.3 Add Admin User Management Endpoints

Create an `AdminController` (or extend the auth controller) for role management:

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users with roles |
| PUT | `/api/admin/users/{id}/role` | Admin | Change a user's role |
| PUT | `/api/admin/users/{id}/deactivate` | Admin | Deactivate a user account |

---

## Phase 3 — Protect All API Endpoints (Backend RBAC)

This is critical for the IS414 rubric item: "All APIs should have the appropriate authentication/authorization."

### 3.1 Authorization Matrix

Apply `[Authorize]` attributes to every controller based on this matrix:

| Controller / Endpoint | Public | Donor | Staff | Admin |
|---|---|---|---|---|
| `GET /api/safehouses` (list) | Yes | Yes | Yes | Yes |
| `GET /api/publicimpact/*` | Yes | Yes | Yes | Yes |
| `POST /api/auth/login` | Yes | — | — | — |
| `POST /api/auth/register` | Yes | — | — | — |
| **Donor-specific endpoints** | | | | |
| `GET /api/donors/my-history` | — | Yes | — | — |
| `GET /api/donors/my-impact` | — | Yes | — | — |
| **Staff + Admin endpoints** | | | | |
| `GET /api/residents` | — | — | Yes | Yes |
| `POST /api/residents` | — | — | Yes | Yes |
| `PUT /api/residents/{id}` | — | — | Yes | Yes |
| `DELETE /api/residents/{id}` | — | — | **No** | Yes |
| `GET /api/donations` (admin view) | — | — | Yes | Yes |
| `POST /api/donations` | — | — | Yes | Yes |
| `DELETE /api/donations/{id}` | — | — | **No** | Yes |
| **Admin-only endpoints** | | | | |
| `GET /api/admin/users` | — | — | — | Yes |
| `PUT /api/admin/users/{id}/role` | — | — | — | Yes |
| `DELETE /api/*/any-resource` | — | — | — | Yes |

### 3.2 Implementation Pattern

```csharp
// Example: ResidentsController.cs

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "StaffOrAdmin")]  // All endpoints require Staff or Admin
public class ResidentsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() { /* Staff + Admin */ }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ResidentDto dto) { /* Staff + Admin */ }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentDto dto) { /* Staff + Admin */ }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]  // Override: only Admin can delete
    public async Task<IActionResult> Delete(int id)
    {
        // Rubric: "confirmation required to delete data"
        // The frontend will send a confirmation flag; backend verifies it
    }
}
```

### 3.3 Delete Confirmation (Integrity Requirement)

For all DELETE endpoints, require a confirmation parameter:

```csharp
[HttpDelete("{id}")]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> Delete(int id, [FromQuery] bool confirmed = false)
{
    if (!confirmed)
        return BadRequest("Deletion must be confirmed. Pass ?confirmed=true");

    // proceed with deletion
}
```

The frontend will show a confirmation modal before sending the request with `confirmed=true`.

---

## Phase 4 — React AuthContext (Frontend)

### 4.1 Create AuthContext Provider

Build a React Context that wraps the entire app and provides auth state to all components:

```
frontend/src/
  contexts/
    AuthContext.tsx    // The context provider
  hooks/
    useAuth.ts        // Convenience hook: const { user, role, isAdmin, ... } = useAuth()
```

**AuthContext responsibilities:**
- Store the JWT token (in memory, NOT localStorage for better security — or keep localStorage if simplicity is preferred, since the rubric doesn't penalize it).
- Decode the JWT on load to extract user info and role.
- Provide `login()`, `logout()`, `register()` functions.
- Expose `user`, `role`, `isAuthenticated`, `isAdmin`, `isStaff`, `isDonor` flags.
- Auto-redirect to login on 401 responses.
- Attach the JWT to all API requests via an Axios interceptor or fetch wrapper.

### 4.2 AuthContext Shape

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: "Admin" | "Staff" | "Donor" | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isDonor: boolean;
  isLoading: boolean;  // true while checking stored token on mount
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => void;
}
```

### 4.3 Wrap App with AuthProvider

```typescript
// main.tsx
<AuthProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</AuthProvider>
```

### 4.4 Protected Route Component

Create a `ProtectedRoute` wrapper that checks auth status and role before rendering:

```typescript
// components/ProtectedRoute.tsx
function ProtectedRoute({ children, allowedRoles }: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role!)) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
}
```

### 4.5 Update App.tsx Routes

```typescript
// App.tsx — route structure
<Routes>
  {/* Public routes — no auth needed */}
  <Route path="/" element={<Landing />} />
  <Route path="/impact" element={<ImpactDashboard />} />
  <Route path="/donors" element={<Donors />} />
  <Route path="/privacy" element={<PrivacyPolicy />} />
  <Route path="/login" element={<Login />} />

  {/* Donor routes — requires Donor role */}
  <Route path="/my-donations" element={
    <ProtectedRoute allowedRoles={["Donor", "Admin"]}>
      <MyDonationsPage />
    </ProtectedRoute>
  } />

  {/* Admin portal — requires Staff or Admin */}
  <Route path="/admin" element={
    <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
      <AdminLayout />
    </ProtectedRoute>
  }>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="donors" element={<DonorsPage />} />
    <Route path="residents" element={<ResidentsPage />} />
    <Route path="social" element={<SocialPage />} />
    <Route path="ml" element={<MLPage />} />
  </Route>

  {/* Unauthorized page */}
  <Route path="/unauthorized" element={<Unauthorized />} />
</Routes>
```

### 4.6 Role-Based UI Rendering

Components use `useAuth()` to conditionally render content:

```typescript
// Example: AdminLayout.tsx sidebar
const { isAdmin } = useAuth();

// Show "Manage Users" link only for Admin
{isAdmin && <NavLink to="/admin/users">Manage Users</NavLink>}

// Show delete buttons only for Admin
{isAdmin && <button onClick={handleDelete}>Delete</button>}
```

---

## Phase 5 — Two-Factor Authentication (2FA)

### 5.1 Approach: Email-Based 2FA

Use ASP.NET Identity's built-in 2FA token providers. When a user enables 2FA, login requires a second step where they enter a code sent to their email.

**Why email-based?** — Simpler than TOTP (no authenticator app needed), and the project already has user emails. If you prefer TOTP (authenticator app), Identity supports that too with minimal changes.

### 5.2 Backend Flow

1. **Enable 2FA:** `POST /api/auth/enable-2fa` — sets `TwoFactorEnabled = true` on the user.
2. **Login with 2FA:**
   - Step 1: User submits email + password → backend validates credentials.
   - If 2FA is enabled, return `{ requires2FA: true, userId: "..." }` instead of a token.
   - Backend generates a 6-digit code via `UserManager.GenerateTwoFactorTokenAsync()` and sends it to the user's email.
   - Step 2: User submits the code → `POST /api/auth/verify-2fa` → backend verifies via `UserManager.VerifyTwoFactorTokenAsync()` → returns JWT.
3. **Disable 2FA:** `POST /api/auth/disable-2fa` — for the grader accounts.

### 5.3 Frontend Flow

The Login page handles 2FA as a two-step form:
1. Email + password form → submit.
2. If response says `requires2FA: true`, switch to a code input form.
3. User enters the code from their email → submit → receive JWT → redirect.

### 5.4 Grader Accounts

Per the rubric: "You must have at least one admin and one non-admin user account without 2FA or MFA for grading purposes." Ensure the seeded grader accounts have `TwoFactorEnabled = false`.

---

## Phase 6 — Security Headers (HSTS + CSP)

### 6.1 HSTS (HTTP Strict Transport Security)

Add to `Program.cs`:

```csharp
// In Program.cs, after app is built
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();  // Sends Strict-Transport-Security header
}
app.UseHttpsRedirection();  // Already present — redirects HTTP → HTTPS
```

Also configure HSTS options:

```csharp
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});
```

### 6.2 Content-Security-Policy (CSP) Header

Add CSP as middleware in `Program.cs`. This is worth **2 points** on the rubric and must appear as an HTTP header (not a `<meta>` tag):

```csharp
// Custom middleware or inline
app.Use(async (context, next) =>
{
    context.Response.Headers.Append(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +  // Tailwind may need unsafe-inline
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' https://your-backend.onrender.com; " +
        "frame-ancestors 'none'; " +
        "form-action 'self';"
    );
    await next();
});
```

**Important:** Test this thoroughly — a CSP that's too restrictive will break your site. Start permissive and tighten. The graders will check for this header in browser DevTools.

---

## Phase 7 — Remaining IS414 Rubric Items

These items aren't strictly about authentication but are part of the security rubric and should be addressed alongside the auth work.

### 7.1 HTTPS/TLS (1 pt) + HTTP→HTTPS Redirect (0.5 pt)

Already handled by Vercel (frontend) and Render (backend) — both provide automatic TLS certificates. Verify that:
- Both deployed URLs use `https://`.
- HTTP requests redirect to HTTPS.
- `app.UseHttpsRedirection()` is in `Program.cs` (already present).

### 7.2 Credentials Storage (1 pt)

- JWT secret key is in `appsettings.Development.json` (gitignored) — good.
- Database connection string is in `appsettings.Development.json` (gitignored) — good.
- For production on Render, use environment variables instead of config files.
- Verify `.gitignore` includes `appsettings.Development.json` and any `.env` files.
- **Never commit secrets to the repo.**

### 7.3 Privacy Policy (1 pt)

Already exists at `PrivacyPolicy.tsx` and linked from footer. Verify it is customized to the organization (not generic boilerplate) and mentions data collection, cookie usage, and user rights.

### 7.4 GDPR Cookie Consent (1 pt)

Already exists via `CookieBanner.tsx`. Verify it is *fully functional* (not just cosmetic) — i.e., it actually controls whether cookies are set. The rubric says to "be specific in your video about whether this is cosmetic or fully functional."

### 7.5 Data Sanitization (Additional Security)

- **Backend:** Use parameterized queries (EF Core does this by default — never concatenate user input into SQL).
- **Frontend:** Encode any user-provided data before rendering. React does this by default with JSX (`{}` expressions are escaped). Avoid `dangerouslySetInnerHTML`.

### 7.6 Browser-Accessible Cookie (Additional Security)

The rubric requires "a browser-accessible cookie (NOT httponly) that saves a user setting used by React to change the page." Your existing dark mode / theme preference cookie in `cookies.ts` likely covers this. Verify it is:
- Set as a regular cookie (not httponly).
- Read by React to change the UI (e.g., dark mode toggle, language preference).

---

## Phase 8 — Data Integrity: Delete Confirmations

The rubric requires: "Data should only be changed or deleted by an authorized user and there must be confirmation required to delete data."

### Frontend Implementation

Create a reusable `ConfirmDeleteModal` component:

```typescript
// components/ConfirmDeleteModal.tsx
// Shows: "Are you sure you want to delete [item]? This action cannot be undone."
// Two buttons: "Cancel" and "Delete" (red, requires typing "DELETE" or clicking confirm)
```

Use this modal on every delete action in the admin portal (residents, donations, supporters, etc.).

### Backend Implementation

Every DELETE endpoint requires the `?confirmed=true` query parameter (see Phase 3.3). If missing, return 400.

---

## Implementation Order (Suggested)

This is the recommended sequence for implementing the above phases. Each step builds on the previous one.

| Step | Phase | Description | Estimated Effort |
|---|---|---|---|
| 1 | Phase 1 | Install Identity packages, create ApplicationUser, update DbContext, run migration | 2–3 hours |
| 2 | Phase 1 | Seed roles (Admin, Staff, Donor) and grader accounts | 1 hour |
| 3 | Phase 2 | Rewrite AuthController with Identity's UserManager/SignInManager | 2–3 hours |
| 4 | Phase 2 | Create DTOs, remove old AuthService/User model | 1 hour |
| 5 | Phase 4 | Build React AuthContext, useAuth hook, ProtectedRoute | 2–3 hours |
| 6 | Phase 4 | Update App.tsx routes and Login.tsx to use AuthContext | 1–2 hours |
| 7 | Phase 3 | Add [Authorize] attributes to all existing controllers | 1–2 hours |
| 8 | Phase 8 | Add delete confirmation modals + backend confirmation check | 1–2 hours |
| 9 | Phase 5 | Implement email-based 2FA (backend + frontend) | 3–4 hours |
| 10 | Phase 6 | Add HSTS and CSP headers | 1 hour |
| 11 | Phase 7 | Audit remaining rubric items (credentials, cookies, sanitization) | 1–2 hours |
| 12 | — | End-to-end testing of all auth flows | 2–3 hours |

**Total estimated effort: ~18–26 hours**

---

## IS414 Security Rubric Checklist

Use this to verify you've hit every graded item before submission.

| Rubric Item | Points | Covered In | Status |
|---|---|---|---|
| Confidentiality — HTTPS/TLS | 1 | Phase 7.1 | ☐ |
| Confidentiality — Redirect HTTP → HTTPS | 0.5 | Phase 7.1 | ☐ |
| Auth — Username/password authentication | 3 | Phase 1 + 2 | ☐ |
| Auth — Require better passwords (min 14 chars) | 1 | Phase 1.4 | ☐ |
| Auth — Pages + API endpoints require auth | 1 | Phase 3 + 4 | ☐ |
| Auth — RBAC: only admin can CUD (incl. endpoints) | 1.5 | Phase 3 | ☐ |
| Integrity — Confirmation to delete data | 1 | Phase 8 | ☐ |
| Credentials — Stored securely, not in repo | 1 | Phase 7.2 | ☐ |
| Privacy — GDPR privacy policy, customized | 1 | Phase 7.3 | ☐ |
| Privacy — GDPR cookie consent, fully functional | 1 | Phase 7.4 | ☐ |
| Attack Mitigations — CSP header set properly | 2 | Phase 6.2 | ☐ |
| Availability — Deployed publicly | 4 | Already on Vercel/Render | ☐ |
| Additional Security Features (2FA, HSTS, cookies, sanitization) | 2 | Phase 5 + 6.1 + 7.5 + 7.6 | ☐ |
| **Total** | **20** | | |

---

## Files That Will Be Created or Modified

### New Files
- `Models/ApplicationUser.cs` — Identity user model
- `DTOs/LoginDto.cs` — Login request shape
- `DTOs/RegisterDto.cs` — Registration request shape
- `DTOs/AuthResponseDto.cs` — Login/register response shape
- `DTOs/UserProfileDto.cs` — User profile response
- `Controllers/AdminController.cs` — User/role management (admin only)
- `frontend/src/contexts/AuthContext.tsx` — React auth context provider
- `frontend/src/hooks/useAuth.ts` — Auth convenience hook
- `frontend/src/components/ProtectedRoute.tsx` — Route guard component
- `frontend/src/components/ConfirmDeleteModal.tsx` — Delete confirmation
- `frontend/src/pages/Unauthorized.tsx` — 403 page

### Modified Files
- `Data/AppDbContext.cs` — Change base class to IdentityDbContext
- `Program.cs` — Add Identity, update JWT config, add authorization policies, add HSTS/CSP
- `Controllers/AuthController.cs` — Full rewrite to use Identity
- `Controllers/SafehousesController.cs` — Add [Authorize] attributes
- `Controllers/PublicImpactController.cs` — Keep public (no auth needed)
- `frontend/src/App.tsx` — Wrap routes with ProtectedRoute
- `frontend/src/pages/Login.tsx` — Use AuthContext, add 2FA step
- `frontend/src/main.tsx` — Wrap app with AuthProvider
- `frontend/src/pages/(admin)/AdminLayout.tsx` — Role-based sidebar items
- `frontend/src/lib/api.ts` — Add auth header interceptor
- `appsettings.Development.json` — Add Identity-related config
- `backend.csproj` — Add Identity NuGet package

### Deleted Files
- `Services/AuthService.cs` — Replaced by Identity's UserManager
- `Services/IAuthService.cs` — No longer needed
- `Models/User.cs` — Replaced by ApplicationUser
- `Models/LoginRequest.cs` — Replaced by LoginDto
- `Models/RegisterRequest.cs` — Replaced by RegisterDto

---

## Important Reminders

1. **Video documentation:** The IS414 rubric says features that aren't documented in your video "don't exist." Plan to demo every security feature clearly.
2. **Password policy:** Follow what was taught in class (min 14 chars only). The rubric explicitly warns against using AI-suggested or default ASP.NET Identity policies.
3. **Grader accounts:** Provide at least one admin and one non-admin account without 2FA. Include credentials in your submission (not in the repo — in the video or a separate doc).
4. **CSP header:** Must be an HTTP header, not a `<meta>` tag. Graders check DevTools.
5. **Code comments:** Keep code well-commented, especially security-related logic, so it's clear during code review what each piece does and why.
