using IntexBackendApi.Data;
using IntexBackendApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ✅ Controllers + OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ✅ Database (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseSnakeCaseNamingConvention());

// 🔐 ASP.NET Identity (API-first: IdentityCore keeps cookie schemes out of the pipeline)
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    // Password policy: ONLY minimum length — matches IS414 lab requirement exactly
    options.Password.RequiredLength = 14;
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredUniqueChars = 0;

    // Lockout: 5 bad attempts → 15-minute lock
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // Email must be unique across all users
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders()   // Required for 2FA token generation
.AddSignInManager();          // Required for SignInManager (lockout-aware login)

// 🔐 JWT Bearer — sole authentication scheme (no cookie auth)
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key not configured. Set it via user-secrets locally or Jwt__Key env var in production.");
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Render handles TLS termination; set true if doing TLS end-to-end
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// 🛡️ Authorization policies — used via [Authorize(Policy = "...")] on controllers
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly",    policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOrAdmin", policy => policy.RequireRole("Admin", "Staff"));
    options.AddPolicy("DonorOnly",    policy => policy.RequireRole("Donor"));
    options.AddPolicy("Authenticated", policy => policy.RequireAuthenticatedUser());
});

// 🔒 HSTS configuration (production only — applied below in middleware pipeline)
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});

// ✅ CORS — allow deployed frontend + local dev
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://intex-w26.vercel.app",
                "https://intex-w26.lincolnadams.com",
                "https://*la-personal.vercel.app"
              )
              .SetIsOriginAllowedToAllowWildcardSubdomains()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ✅ Middleware pipeline — ORDER MATTERS
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // HSTS: instructs browsers to only use HTTPS for this domain for 1 year
    app.UseHsts();
}

app.UseHttpsRedirection();

// 🛡️ Content-Security-Policy header on every response
// Must be an HTTP header (not <meta> tag) — graders verify in DevTools
app.Use(async (context, next) =>
{
    context.Response.Headers.Append(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +   // unsafe-inline needed if Swagger UI is used
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' https://intex-backend.onrender.com; " +
        "frame-ancestors 'none'; " +
        "form-action 'self';"
    );
    await next();
});

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// 🌱 Seed roles and default accounts on every startup (idempotent)
using (var scope = app.Services.CreateScope())
{
    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

app.Run();
