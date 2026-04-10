# IS 414 – Security: Requirements Analysis
*Generated: 2026-04-09 | Project: Pag-asa Sanctuary (intex-w26)*

> **Important note from the case:** Security features that are not documented in the submission video do not exist for grading purposes. Every item below should be clearly demonstrated in the IS 414 video walkthrough.

---

## Security Rubric (19 pts total)

| Objective | Points | Status | Assessment |
|---|---|---|---|
| Confidentiality - Use HTTPS/TLS | 1 | ✅ | Both frontend (Vercel) and backend (Render) provide TLS. |
| Confidentiality - Redirect HTTP to HTTPS | 0.5 | ✅ | `app.UseHttpsRedirection()` in `Program.cs`. |
| Auth - Authentication using username/password | 3 | ✅ | ASP.NET Identity + JWT; `CheckPasswordSignInAsync` with lockout. |
| Auth - Require better passwords | 1 | ✅ | `RequiredLength = 14`, all other complexity flags set to false (matches IS414 lab spec). |
| Auth - Pages and API endpoints require auth where needed | 1 | ✅ | `[Authorize(Policy = "...")]` on all controllers; `<ProtectedRoute>` on frontend routes. |
| Auth - RBAC: Only admin user can CUD (including endpoints) | 1.5 | ⚠️ | See note below. |
| Integrity - Confirmation to delete data | 1 | ✅ | `ConfirmDeleteModal` requires typing "DELETE"; backend also validates `?confirmed=true`. |
| Credentials - Stored securely, not in public repo | 1 | ✅ | `appsettings.json` has empty strings; actual secrets via env vars on Render. |
| Privacy - Privacy policy created and added to site | 1 | ✅ | Linked from site footer; customized content. |
| Privacy - GDPR cookie consent notification fully functional | 1 | ✅ | Functional accept/decline banner with persistent cookie. |
| Attack Mitigations - CSP header set properly | 2 | ✅ | Full CSP as HTTP header via middleware; specific directives for all source types. |
| Availability - Deployed publicly | 4 | ✅ | Frontend on Vercel, backend on Render, PostgreSQL on Supabase. |
| Additional security features | 2 | ✅ | Multiple features implemented (see below). |

---

## Detailed Findings

### Confidentiality (Encryption)

**HTTPS/TLS — ✅ Met (1 pt)**

Both deployment targets provide TLS:
- Backend on Render: TLS termination handled by Render (`RequireHttpsMetadata = false` in JWT config is correct here as the backend receives HTTP internally from Render's reverse proxy, not from the public internet).
- Frontend on Vercel: HTTPS enforced by Vercel's CDN.

**HTTP → HTTPS Redirect — ✅ Met (0.5 pts)**

`app.UseHttpsRedirection()` is present in the `Program.cs` middleware pipeline, called before all other middleware. This returns a 301/307 redirect for any HTTP request.

---

### Authentication

**Username/Password Authentication — ✅ Met (3 pts)**

Implemented via ASP.NET Identity + JWT Bearer (no cookies). Flow:
1. `POST /api/auth/login` — verifies credentials using `SignInManager.CheckPasswordSignInAsync` (lockout-aware)
2. On success (and 2FA not enabled): returns a signed JWT token
3. Token stored in `localStorage` on the client; `authFetch` wrapper attaches `Authorization: Bearer <token>` to all subsequent requests

**Lockout protection:** 5 failed attempts triggers a 15-minute lockout. Returns HTTP 429 with a user-facing message.

Additional auth pages: Register, Forgot Password (email-based), Reset Password (token-based).

**Better Passwords — ✅ Met (1 pt)**

```csharp
options.Password.RequiredLength = 14;
options.Password.RequireDigit = false;
options.Password.RequireLowercase = false;
options.Password.RequireUppercase = false;
options.Password.RequireNonAlphanumeric = false;
options.Password.RequiredUniqueChars = 0;
```

This matches the IS414 lab instruction: minimum length 14, complexity checks disabled. The comment in the code (`// Password policy: ONLY minimum length — matches IS414 lab requirement exactly`) confirms this was intentional.

**Pages and API Endpoints Require Auth Where Needed — ✅ Met (1 pt)**

Backend:
- `AdminController`: `[Authorize(Policy = "AdminOnly")]`
- `StaffController`: `[Authorize(Policy = "StaffOrAdmin")]`
- `DonationsController`: `[Authorize]`
- `AuthController` endpoints `/login`, `/register`, `/verify-2fa`, `/google-signin`: no auth required (correct — these are the entry points)
- `PublicImpactController`: no auth required (correct — public data)

Frontend:
- All `/admin/*` routes wrapped in `<ProtectedRoute allowedRoles={['Admin']}>`
- All `/staff/*` routes wrapped in `<ProtectedRoute allowedRoles={['Staff']}>`
- `/my-donations` wrapped in `<ProtectedRoute allowedRoles={['Donor', 'Admin', 'Staff']}>`
- `/`, `/impact`, `/privacy`, `/about`, `/donate`, `/login` are publicly accessible

**RBAC — ⚠️ Partially Met (1.5 pts — potential grader concern)**

Policies configured:
- `"AdminOnly"` — Admin role only
- `"StaffOrAdmin"` — Admin or Staff
- `"DonorOnly"` — Donor role only
- `"Authenticated"` — Any logged-in user

Admin-only operations (CUD):
- User management: PUT role, PUT activate/deactivate, DELETE user — all `AdminOnly`
- Adding process recordings and home visits via admin endpoints — `AdminOnly`

Staff operations (Create-only):
- Staff can CREATE residents, process recordings, and home visits (`StaffOrAdmin` policy)
- Staff cannot UPDATE or DELETE any records
- All staff endpoints are safehouse-scoped server-side (safehouseId derived from JWT, never trusted from request)

**Grader concern:** The rubric states "Only admin user can CUD (including endpoints)." Staff can Create data through the staff controller. This is intentional and necessary for the case (staff need to document counseling sessions), but a strict reading of the rubric could result in partial credit. The key mitigation is that only the C portion of CUD is granted to staff, and only for their own safehouse. Be explicit about this design decision in the video.

---

### Integrity

**Confirmation to Delete Data — ✅ Met (1 pt)**

`ConfirmDeleteModal.tsx` is a reusable component that requires the user to type the word "DELETE" before the confirm button becomes active. It is used in the admin Users page for user deletion. The component also documents that the backend should validate `?confirmed=true` on DELETE requests.

This is a strong implementation — typing confirmation is a higher bar than a simple "are you sure?" dialog.

---

### Credentials

**Stored Securely, Not in Public Repository — ✅ Met (1 pt)**

- `appsettings.json` contains only empty string placeholders for `ConnectionStrings:DefaultConnection`, `Jwt:Key`, `Email:AppPassword`, and `Google:ClientId` — no actual secrets committed.
- `appsettings.Development.json` is listed in `.gitignore`, meaning local development secrets are excluded from git.
- Production secrets (JWT key, DB connection string, Google Client ID) are set as environment variables in Render's dashboard.
- The code throws `InvalidOperationException` if `Jwt:Key` is missing, preventing silent misconfiguration.

**Make this clear in your video** — show the empty appsettings.json and briefly explain that actual values are set via Render environment variables.

---

### Privacy

**GDPR Privacy Policy — ✅ Met (1 pt)**

`PrivacyPolicy.tsx` covers all standard GDPR sections:
- What data is collected (name, email, donations, login info, cookies)
- How it's collected (registration, donation, interaction, cookies)
- How it's used (processing, improvement, communications, security)
- How it's stored (secured databases, retention policy)
- Marketing opt-in and unsubscribe rights
- User rights (access, correction, deletion, restriction, objection)
- Cookie types (essential, analytics)
- Contact information

Linked from the site footer under "Resources → Privacy Policy" (`/privacy`).

**Minor suggestion:** The "How do we store your data?" section is brief. Consider mentioning encrypted database storage or that data is hosted on Render/Supabase with standard security practices. This strengthens the policy's credibility.

**GDPR Cookie Consent — ✅ Fully Functional (1 pt)**

`CookieBanner.tsx` implementation:
- Renders a persistent bottom banner on first visit (no prior `cookie_consent` cookie)
- **Accept** button: sets `cookie_consent=accepted`, enables `analytics=true` cookie
- **Decline** button: sets `cookie_consent=declined`, removes `analytics` cookie with `Max-Age=0`
- Banner disappears after choice and does not re-appear (choice persists in browser)
- `App.tsx` reads the consent cookie before firing analytics page-view tracking

Be specific in your video: confirm that declining actually prevents analytics tracking (show the `analytics` cookie not being set after declining).

---

### Attack Mitigations

**CSP Header — ✅ Met (2 pts)**

The Content-Security-Policy is set as an HTTP response header (not a `<meta>` tag) via ASP.NET Core middleware:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://accounts.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://intex-backend.onrender.com https://oauth2.googleapis.com;
  frame-src https://accounts.google.com;
  frame-ancestors 'none';
  form-action 'self';
```

Sources are tightly specified: Google's Identity Services and tokeninfo endpoint are explicitly allowed; all others default to `'self'`. `frame-ancestors 'none'` prevents clickjacking.

**Note:** `style-src 'unsafe-inline'` is present (required for React's inline styles). This is a known trade-off and is acceptable for grading purposes — graders typically understand this is a practical necessity.

**Show this in DevTools in your video** — open Network tab → select any response → Headers → find `Content-Security-Policy`.

---

### Availability

**Deployed Publicly — ✅ Met (4 pts)**

- Frontend: Vercel (`https://intex-w26.vercel.app` and `https://intex-w26.lincolnadams.com`)
- Backend: Render (`https://intex-backend.onrender.com`)
- Database: PostgreSQL (Supabase or Render Postgres)

Both frontend and backend are accessible without any local setup.

---

### Additional Security Features — ✅ Multiple Features (2 pts)

The following additional security features have been implemented. Be sure to demonstrate each one in the video:

**1. Email-Based Two-Factor Authentication (2FA) — Strong implementation**

- `POST /api/auth/enable-2fa` — enables 2FA for the current user
- `POST /api/auth/disable-2fa` — disables 2FA
- `POST /api/auth/verify-2fa` — verifies the emailed 6-digit code after login
- When 2FA is enabled, login returns `{ requires2FA: true, userId }` instead of a token; the frontend prompts for the code; verification returns the JWT
- The 2FA token is generated using ASP.NET Identity's `GenerateTwoFactorTokenAsync` with the Email provider
- **The case requires:** at least one admin without 2FA, one donor without 2FA, and one account WITH 2FA. Make sure test credentials for all three are included in the submission form.

**2. Third-Party Authentication (Google OAuth)**

- `POST /api/auth/google-signin` — verifies a Google ID token by calling Google's tokeninfo endpoint
- Frontend uses `@react-oauth/google` to render a Google Sign-In button
- On success, finds or creates the user account and returns a JWT
- Google `ClientId` is stored as an environment variable (not committed)

**3. HTTP Strict Transport Security (HSTS)**

```csharp
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});
// Applied in production only:
app.UseHsts();
```

HSTS instructs browsers to only connect via HTTPS for 365 days. Applied only in non-development environments (correct — applying HSTS in dev would break local HTTP workflows).

**4. Browser-Accessible Cookie for User Preferences**

`cookie_consent` and `analytics` cookies are set without the `httponly` flag, making them intentionally readable by JavaScript. React reads the `cookie_consent` cookie via `getCookie()` to conditionally enable analytics tracking. This demonstrates a legitimate use of a browser-accessible cookie to drive page behavior.

**5. Data Sanitization**

- Frontend: `sanitize.ts` uses `DOMPurify` to sanitize HTML strings before rendering with `dangerouslySetInnerHTML`, with an explicit allow-list of safe tags and attributes.
- Backend: EF Core uses parameterized queries by default, preventing SQL injection on all database operations.

**6. Real DBMS (Not SQLite)**

PostgreSQL is used for both operational data and ASP.NET Identity tables. This satisfies the "deploy both operational and identity databases to a real DBMS" bonus feature.

---

## Summary for Video Walkthrough

| Feature | Where to show in video |
|---|---|
| HTTPS/TLS | Show site URL (https://...) in browser address bar |
| HTTP redirect | Navigate to `http://intex-w26.lincolnadams.com` and show redirect to HTTPS |
| Login with username/password | Log in with test credentials; show error on wrong password |
| Password policy (14 chars) | Try to register with a short password; show error message |
| Page/endpoint auth | Try to access `/admin` while logged out; show redirect to login |
| RBAC | Show that Staff can't access admin pages; donor can only see their own donations |
| Delete confirmation | Delete a user; show the "type DELETE" modal |
| Credentials not in repo | Show empty `appsettings.json` in GitHub; mention env vars on Render |
| Privacy policy | Show `/privacy` page linked from footer |
| Cookie consent | Show banner on first visit; show accept/decline behavior; show cookie in DevTools |
| CSP header | DevTools → Network → any request → Response Headers → Content-Security-Policy |
| 2FA | Enable 2FA on a user; log in; show email code prompt; enter code; get in |
| Google OAuth | Show "Sign in with Google" button; complete Google auth flow |
| HSTS | DevTools → Network → any response → Strict-Transport-Security header |
| Browser-accessible cookie | DevTools → Application → Cookies → show `cookie_consent` and `analytics` |
| Data sanitization | Mention DOMPurify in code or narrate briefly |
