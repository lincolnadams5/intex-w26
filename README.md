# Intex W26 — Safehouse Management System

### NOTE FOR GRADERS:

When using the site, if you notice that any processes are slow to load, please allow for ~2 min for the backend services to cold start. On the free tiers they pause when inactive, so it takes a couple minutes for them to start up again. This applies to any login/data processes, and the post prediction estimator on the admin social media page, which runs on a separate web service (FastApi).

A full-stack web application for managing and visualizing data across a network of safehouses that support survivors of human trafficking. The system provides an admin dashboard for internal staff and a public-facing donor impact dashboard.

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite (build tool & dev server)
- React Router DOM (client-side routing)
- Tailwind CSS (styling)
- Recharts (data visualization)

**Backend**
- ASP.NET Core (.NET 10) Web API
- Entity Framework Core 10 with Npgsql (PostgreSQL)
- JWT Bearer authentication
- BCrypt password hashing

**Database**
- PostgreSQL hosted on Supabase

**Deployment**
- Frontend: Vercel
- Backend: Render

## Project Layout

```
intex-w26/
├── frontend/                  # React + TypeScript app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── (admin)/       # Protected admin pages
│   │   │   ├── Landing.tsx    # Public landing page
│   │   │   ├── Login.tsx      # Auth page
│   │   │   └── ImpactDashboard.tsx  # Public donor dashboard
│   │   ├── lib/
│   │   │   └── api.ts         # API base URL config
│   │   └── App.tsx            # Routes
│   ├── .env.example           # Environment variable template
│   └── vite.config.ts         # Dev server + proxy config
│
├── backend/
│   └── IntexBackendApi/       # ASP.NET Core project
│       ├── Controllers/       # API endpoints
│       ├── Services/          # Business logic (auth)
│       ├── Models/            # EF Core entity models
│       ├── Data/              # AppDbContext
│       ├── Properties/        # launchSettings.json
│       ├── appsettings.json   # Base config (no secrets)
│       └── backend.csproj
│
├── intex-resources/           # Project spec and reference data
├── .env.example               # Frontend env template
└── intex-w26.sln
```

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0)

### 1. Clone the repository

```bash
git clone https://github.com/lincolnadams5/intex-w26.git
cd intex-w26
```

### 2. Configure the frontend environment

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

For local development, set `VITE_API_URL` to an empty string (the Vite proxy handles routing to the local backend):

```
VITE_API_URL=
```

### 3. Configure the backend

Create `backend/IntexBackendApi/appsettings.Development.json` (this file is gitignored — never commit it):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=<supabase-pooler-host>;Port=5432;Database=postgres;Username=postgres.<project-ref>;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true;No Reset On Close=true"
  },
  "Jwt": {
    "Key": "<strong-secret-at-least-32-chars>"
  }
}
```

Get your connection string from **Supabase Dashboard → Settings → Database → Connection string (URI tab)**. Use the **session pooler (port 5432)** — not the transaction pooler (6543).

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Start the backend

```bash
cd backend/IntexBackendApi
dotnet run
```

The API will be available at `http://localhost:5011`.

### 6. Start the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`. The Vite dev server automatically proxies all `/api/*` requests to `http://localhost:5011`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/safehouses` | — | List all safehouses |
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/secure` | JWT | Auth smoke test |
| GET | `/api/publicimpact/summary` | — | Donor dashboard summary metrics |
| GET | `/api/publicimpact/donations-by-type` | — | Donation breakdown by type |
| GET | `/api/publicimpact/donations-by-month` | — | Monthly donation trends |

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `dev` | Integration branch — merge feature branches here first |
