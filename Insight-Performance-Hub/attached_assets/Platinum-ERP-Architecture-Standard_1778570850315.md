# Platinum ERP Architecture Standard

## Generic Development Standard for Angular + .NET Projects

**Version:** 1.0
**Date:** March 2026
**Applicable To:** All Platinum municipal ERP systems (SCM, Assets, Citizens Portal, etc.)

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Tech Stack](#2-tech-stack)
3. [Frontend Structure](#3-frontend-structure)
4. [Architecture Patterns](#4-architecture-patterns)

---

## 1. Repository Structure

Replace `{AppName}` with the project name (e.g., `SCM`, `Assets`, `CitizensPortal`, `Revenue`).

```
{AppName}/
│
├── {AppName}-API/                           .NET 10 Web API Backend
│   ├── Configuration/                       Strongly-typed config classes
│   │   └── JwtSettings.cs
│   │
│   ├── Controllers/                         API controllers (one per domain)
│   │   ├── AuthController.cs
│   │   ├── DashboardController.cs
│   │   └── {Domain}Controller.cs
│   │
│   ├── Data/                                Database context
│   │   └── ApplicationDbContext.cs          Central DbContext with Fluent API mappings
│   │
│   ├── DTOs/                                Data Transfer Objects
│   │   ├── Requests/                        Input/request models
│   │   │   └── {Domain}RequestDto.cs
│   │   └── Responses/                       Output/response models
│   │       └── {Domain}ResponseDto.cs
│   │
│   ├── Extensions/                          Extension methods
│   │   └── ServiceCollectionExtensions.cs   Modular DI registration
│   │
│   ├── Helpers/                             Utility classes
│   │   └── ClaimsHelper.cs                  JWT claim extraction
│   │
│   ├── Middleware/                           HTTP pipeline middleware
│   │   ├── ExceptionHandlingMiddleware.cs    Global exception handler
│   │   ├── CorrelationIdMiddleware.cs        Request correlation tracking
│   │   ├── RequestLoggingMiddleware.cs       HTTP request/response logging
│   │   └── PerformanceMonitoringMiddleware.cs  Slow request detection
│   │
│   ├── Models/                              Domain entities
│   │   ├── Domain/                          Entity classes mapped to DB tables
│   │   │   └── {Entity}.cs
│   │   └── Common/                          Shared response models
│   │       └── ApiResponse.cs
│   │
│   ├── Repositories/                        Data access layer (if using Repository Pattern)
│   │   ├── Interfaces/                      Repository contracts
│   │   │   └── I{Domain}Repository.cs
│   │   └── {Domain}Repository.cs
│   │
│   ├── Services/                            Business logic layer
│   │   ├── Interfaces/                      Service contracts
│   │   │   └── I{Domain}Service.cs
│   │   └── {Domain}Service.cs
│   │
│   ├── Migrations/                          Database migration scripts (if applicable)
│   │
│   ├── Properties/
│   │   └── launchSettings.json
│   │
│   ├── logs/                                Runtime log files (gitignored)
│   ├── Program.cs                           Entry point, DI, middleware pipeline
│   ├── {AppName}-API.csproj                 Project file with NuGet packages
│   └── appsettings.json                     Connection strings, JWT, logging config
│
├── {AppName}-UI/                            Angular 21 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                        Singleton services, guards, interceptors, models
│   │   │   │   ├── guards/
│   │   │   │   │   ├── auth.guard.ts        Redirects unauthenticated users
│   │   │   │   │   └── role.guard.ts        Restricts by user role
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── auth.interceptor.ts  Attaches JWT to requests
│   │   │   │   │   └── error.interceptor.ts Captures HTTP errors globally
│   │   │   │   ├── models/
│   │   │   │   │   └── {domain}.model.ts    One model file per domain
│   │   │   │   └── services/
│   │   │   │       ├── auth.service.ts      Authentication & user state
│   │   │   │       └── {domain}.service.ts  One service per domain
│   │   │   │
│   │   │   ├── features/                    Feature modules (one folder per domain)
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── dashboard.component.ts
│   │   │   │   │   ├── dashboard.component.html
│   │   │   │   │   └── dashboard.component.scss
│   │   │   │   ├── {feature-name}/
│   │   │   │   │   ├── {feature-name}.component.ts
│   │   │   │   │   ├── {feature-name}.component.html
│   │   │   │   │   └── {feature-name}.component.scss
│   │   │   │   └── auth/
│   │   │   │       ├── login/
│   │   │   │       └── register/
│   │   │   │
│   │   │   ├── layout/                      App shell (shared chrome)
│   │   │   │   ├── layout.component.ts      Sidebar + topbar + <router-outlet>
│   │   │   │   ├── layout.component.html
│   │   │   │   └── layout.component.scss
│   │   │   │
│   │   │   ├── app.component.ts             Root component
│   │   │   ├── app.config.ts                Providers (router, HTTP, interceptors)
│   │   │   └── app.routes.ts                Lazy-loaded route definitions
│   │   │
│   │   ├── assets/                          Static assets (images, icons, global styles)
│   │   │   └── styles/
│   │   │       └── {appname}-styles.scss    Global premium styling
│   │   ├── environments/
│   │   │   ├── environment.ts               Dev config
│   │   │   └── environment.prod.ts          Prod config
│   │   ├── styles.scss                      Global styles entry point
│   │   ├── index.html                       HTML entry point
│   │   └── main.ts                          Bootstrap entry point
│   │
│   ├── proxy.conf.json                      Dev proxy: /api → backend
│   ├── angular.json                         Angular CLI configuration
│   ├── package.json                         Dependencies
│   └── tsconfig.json                        TypeScript configuration
│
├── docs/                                    Project documentation
│   ├── api-specs/                           API specifications
│   ├── help-manuals/                        User manuals
│   └── STANDARDS.md                         Project-specific standards
│
├── server/                                  Launcher (if applicable)
│   └── index.js                             Node.js entry point (starts all services)
│
└── README.md                                Project overview
```

---

## 2. Tech Stack

### 2.1 Backend — .NET 10 Web API

| Package | Purpose |
|---------|---------|
| .NET SDK 10.0 | Runtime and framework |
| Microsoft.EntityFrameworkCore (SqlServer or Npgsql) | ORM provider |
| Microsoft.EntityFrameworkCore.Design | EF Core design-time tools |
| Microsoft.AspNetCore.Authentication.JwtBearer | JWT authentication |
| System.IdentityModel.Tokens.Jwt | JWT token creation/validation |
| Serilog.AspNetCore | Structured logging framework |
| Serilog.Sinks.File | File-based log output (rolling daily, 30-day retention) |
| Serilog.Enrichers.Environment | Environment context enrichment |
| Serilog.Enrichers.Thread | Thread context enrichment |
| Swashbuckle.AspNetCore | Swagger/OpenAPI documentation |
| Dapper *(optional)* | Raw SQL for performance-critical queries |
| ClosedXML *(optional)* | Excel export support |

### 2.2 Frontend — Angular 21

**Production Dependencies:**

| Package | Purpose |
|---------|---------|
| @angular/core ^21.x | Angular framework |
| @angular/common ^21.x | Common utilities and pipes |
| @angular/compiler ^21.x | Template compiler |
| @angular/forms ^21.x | Template and reactive forms |
| @angular/router ^21.x | Client-side routing |
| @angular/platform-browser ^21.x | Browser platform support |
| @angular/animations ^21.x | Animation framework |
| @angular/material ~21.x | Material Design UI components |
| @angular/cdk ~21.x | Component Dev Kit |
| chart.js ^4.x | Charting library |
| ng2-charts ^8.x+ | Angular Chart.js wrapper |
| rxjs ~7.8 | Reactive Extensions |
| tslib ^2.3 | TypeScript runtime helpers |
| Leaflet ^1.9 *(optional)* | Map visualisation |
| xlsx ^0.18 *(optional)* | Client-side Excel export |

**Dev Dependencies:**

| Package | Purpose |
|---------|---------|
| @angular/cli ^21.x | CLI tooling |
| @angular/build ^21.x | Build system |
| @angular/compiler-cli ^21.x | AOT compiler |
| typescript ~5.9 | TypeScript compiler |
| vitest ^4.x | Test runner |
| jsdom ^27.x | DOM simulation for tests |

### 2.3 Database

| Option | Engine | ORM | When to Use |
|--------|--------|-----|-------------|
| **Option A** | SQL Server (Azure SQL) | Entity Framework Core | Enterprise projects, existing EMS databases |
| **Option B** | PostgreSQL (Azure PostgreSQL) | Entity Framework Core (Npgsql) | New projects, cost-sensitive deployments |
| **Option C** | PostgreSQL | Dapper (raw SQL) | Performance-critical, legacy schema integration |

### 2.4 Infrastructure

| Component | Standard |
|-----------|----------|
| Frontend Port | 5000 |
| Backend Port | 3000 or 3001 |
| Package Manager (Frontend) | npm |
| CSS Preprocessor | SCSS |
| Code Formatting | Prettier (printWidth: 100, singleQuote: true) |
| API Documentation | Swagger UI (via Swashbuckle) |
| Logging | Serilog (Console + File sinks, rolling daily, 30-day retention) |
| Source Control | Git |

---

## 3. Frontend Structure

### 3.1 Feature Modules

Each feature module lives under `{AppName}-UI/src/app/features/` and represents a major business area. Every feature follows this structure:

```
features/{feature-name}/
├── {feature-name}.component.ts       # Main component
├── {feature-name}.component.html     # Template
├── {feature-name}.component.scss     # Styles
├── components/                       # Sub-components (if needed)
│   ├── {sub-component}.component.ts
│   ├── {sub-component}.component.html
│   └── {sub-component}.component.scss
└── dialogs/                          # Dialog components (if needed)
    ├── {dialog-name}.component.ts
    ├── {dialog-name}.component.html
    └── {dialog-name}.component.scss
```

### 3.2 Core Module

All shared, singleton services live under `core/`:

```
core/
├── guards/
│   ├── auth.guard.ts                 # Redirects unauthenticated users to login
│   └── role.guard.ts                 # Restricts routes based on user role
├── interceptors/
│   ├── auth.interceptor.ts           # Attaches JWT Bearer token to all API requests
│   └── error.interceptor.ts          # Captures and handles HTTP errors globally
├── models/
│   └── {domain}.model.ts             # One TypeScript interface file per domain
└── services/
    ├── auth.service.ts               # Authentication, JWT, user state
    └── {domain}.service.ts           # One service per domain area
```

### 3.3 Layout

The app shell provides the shared navigation chrome for all authenticated pages:

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (260px)  │  Topbar (60px)                  │
│                   │─────────────────────────────────│
│  Logo             │                                 │
│  Navigation       │  <router-outlet>                │
│  Links            │  (feature content renders here) │
│                   │                                 │
│  User Info        │                                 │
│  Logout           │                                 │
└─────────────────────────────────────────────────────┘
```

### 3.4 Routing

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: '{feature}', loadComponent: () => import('./features/{feature}/{feature}.component').then(m => m.{Feature}Component) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
```

**Routing Rules:**
- All feature routes are **lazy-loaded** via `loadComponent()`
- Public routes (login, register) are top-level
- All authenticated routes are children of the `LayoutComponent`
- Apply `canActivate: [authGuard]` to the layout parent route
- Use wildcard `**` as a catch-all redirect

### 3.5 Component Standards

| Rule | Standard |
|------|----------|
| Component style | **Standalone** (`standalone: true`) |
| State management | Angular **Signals** (`signal()`, `computed()`, `effect()`) |
| Control flow | `@if` / `@for` / `@switch` (NOT `*ngIf` / `*ngFor`) |
| Template typing | No `$any()` casts in templates |
| HTTP calls | Always through domain services in `core/services/` |
| Forms | Reactive Forms (`FormGroup`, `FormControl`) preferred |
| File structure | Split files: `.ts`, `.html`, `.scss` (no inline templates) |
| Styling | Component-scoped SCSS |
| Icons | Angular Material Icons |
| UI Components | Angular Material |

### 3.6 Service Standards

```typescript
// core/services/{domain}.service.ts
@Injectable({ providedIn: 'root' })
export class {Domain}Service {
  private apiUrl = '/api/{domain}';

  constructor(private http: HttpClient) {}

  getAll(): Observable<{Domain}[]> {
    return this.http.get<ApiResponse<{Domain}[]>>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<{Domain}> {
    return this.http.get<ApiResponse<{Domain}>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(item: Create{Domain}Request): Observable<{Domain}> {
    return this.http.post<ApiResponse<{Domain}>>(this.apiUrl, item)
      .pipe(map(res => res.data));
  }

  update(id: number, item: Update{Domain}Request): Observable<{Domain}> {
    return this.http.put<ApiResponse<{Domain}>>(`${this.apiUrl}/${id}`, item)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**Service Rules:**
- Use `@Injectable({ providedIn: 'root' })` for singleton services
- One service per domain — never a single monolithic API service
- Use relative API paths (`/api/...`) — the proxy handles routing
- Return `Observable<T>` from all HTTP methods
- Unwrap the `ApiResponse` wrapper in the service, not the component

### 3.7 Model Standards

```typescript
// core/models/{domain}.model.ts
export interface {Domain} {
  id: number;
  name: string;
  status: string;
  createdAt: string;    // ISO 8601 date string
  updatedAt: string;
}

export interface Create{Domain}Request {
  name: string;
}

export interface Update{Domain}Request {
  name: string;
  status: string;
}
```

### 3.8 Proxy Configuration

```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:{backend-port}",
    "secure": false,
    "changeOrigin": true
  }
}
```

### 3.9 Angular CLI Configuration

```json
// angular.json (key settings)
{
  "projects": {
    "{AppName}-UI": {
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/main.ts",
            "inlineStyleLanguage": "scss"
          }
        },
        "serve": {
          "options": {
            "allowedHosts": true,
            "proxyConfig": "proxy.conf.json"
          }
        }
      }
    }
  }
}
```

---

## 4. Architecture Patterns

### 4.1 Overall Architecture

```
{AppName}-UI (Angular 21)  ──REST/JSON──▶  {AppName}-API (.NET 10)  ──ORM──▶  Database
   Port 5000                                 Port 3000/3001                    Azure SQL / PostgreSQL
```

### 4.2 Backend Layers

```
┌──────────────────────────────────────────────────────────────┐
│                        Controllers                           │
│  Thin HTTP endpoints — route requests, return responses       │
│  [ApiController] + [Route("api/{domain}")] + [Authorize]     │
├──────────────────────────────────────────────────────────────┤
│                         Services                             │
│  Business logic — validation, calculations, orchestration     │
│  Interface (I{Domain}Service) + Implementation                │
├──────────────────────────────────────────────────────────────┤
│                       Repositories                           │
│  Data access — queries, commands, projections                 │
│  Interface (I{Domain}Repository) + Implementation             │
│  (Optional — services can access DbContext directly)          │
├──────────────────────────────────────────────────────────────┤
│                     DbContext / Dapper                        │
│  ORM layer — entity mapping, connection management            │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Program.cs Pattern

```csharp
var builder = WebApplication.CreateBuilder(args);

// JSON serialisation
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// Application services (extension method)
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);

// Serilog
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

var app = builder.Build();

// Middleware pipeline (ORDER MATTERS)
app.UseMiddleware<CorrelationIdMiddleware>();         // 1. Correlation ID
app.UseMiddleware<RequestLoggingMiddleware>();         // 2. Request logging
app.UseMiddleware<ExceptionHandlingMiddleware>();      // 3. Exception handling
app.UseMiddleware<PerformanceMonitoringMiddleware>();  // 4. Performance monitoring

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Run($"http://0.0.0.0:{port}");
```

### 4.4 Controller Pattern

```csharp
[ApiController]
[Route("api/{domain}")]
[Authorize]
public class {Domain}Controller : ControllerBase
{
    private readonly I{Domain}Service _{domain}Service;

    public {Domain}Controller(I{Domain}Service {domain}Service)
    {
        _{domain}Service = {domain}Service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<{Domain}Dto>>>> GetAll()
    {
        var result = await _{domain}Service.GetAllAsync(User.GetUserId());
        return Ok(ApiResponse<List<{Domain}Dto>>.Success(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<{Domain}Dto>>> GetById(int id)
    {
        var result = await _{domain}Service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<{Domain}Dto>.Fail("Not found"));
        return Ok(ApiResponse<{Domain}Dto>.Success(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<{Domain}Dto>>> Create([FromBody] Create{Domain}Request request)
    {
        var result = await _{domain}Service.CreateAsync(request, User.GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<{Domain}Dto>.Success(result));
    }
}
```

**Controller Rules:**
- One controller per domain
- `[ApiController]` attribute on every controller
- `[Route("api/{domain}")]` explicit lowercase route
- `[Authorize]` at class level, `[AllowAnonymous]` for public endpoints
- Inject service interfaces, never implementations
- Extract user ID via `User.GetUserId()` extension method
- Always return `ActionResult<ApiResponse<T>>`
- Controllers are thin — delegate ALL logic to services

### 4.5 Service Pattern

```csharp
// Interface
public interface I{Domain}Service
{
    Task<List<{Domain}Dto>> GetAllAsync(int userId);
    Task<{Domain}Dto?> GetByIdAsync(int id);
    Task<{Domain}Dto> CreateAsync(Create{Domain}Request request, int userId);
    Task<{Domain}Dto> UpdateAsync(int id, Update{Domain}Request request);
    Task DeleteAsync(int id);
}

// Implementation
public class {Domain}Service : I{Domain}Service
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<{Domain}Service> _logger;

    public {Domain}Service(ApplicationDbContext context, ILogger<{Domain}Service> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<{Domain}Dto>> GetAllAsync(int userId)
    {
        return await _context.{Domain}s
            .Where(x => x.UserId == userId)
            .Select(x => new {Domain}Dto { /* projection */ })
            .ToListAsync();
    }
}
```

**Service Rules:**
- Always define interface + implementation
- Inject `DbContext` and `ILogger`
- All methods are `async Task<T>`
- Project entities to DTOs before returning (never expose raw entities)
- Use `.Select()` projections for read queries
- Use `.Include()` / `.ThenInclude()` for eager loading
- Register as `Scoped` in DI

### 4.6 API Response Wrapper

```csharp
public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> Success(T data, string message = "Success")
        => new() { IsSuccess = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string error)
        => new() { IsSuccess = false, Message = error, Errors = new() { error } };
}
```

**Response Format:**
```json
{
  "isSuccess": true,
  "data": { },
  "message": "Success",
  "errors": [],
  "timestamp": "2026-03-18T10:00:00Z"
}
```

### 4.7 DTO Pattern

```csharp
// DTOs/Responses/{Domain}Dto.cs
public class {Domain}Dto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// DTOs/Requests/Create{Domain}Request.cs
public class Create{Domain}Request
{
    public string Name { get; set; } = string.Empty;
}
```

**DTO Rules:**
- Separate Request and Response DTOs into folders
- Use `string.Empty` as default for string properties
- Use `new()` as default for collection properties
- Use `decimal` for all monetary values
- Never expose navigation properties

### 4.8 Authentication Pattern

```
┌─────────────────┐   POST /api/auth/login    ┌────────────────┐
│   Angular App   │ ─────────────────────────> │   .NET API     │
│                 │                            │                │
│ Stores JWT in   │ <───────────────────────── │ Validates      │
│ localStorage    │   { token, user }          │ credentials    │
│                 │                            │ Returns JWT    │
│                 │   Authorization: Bearer    │                │
│ AuthInterceptor │ ─────────────────────────> │ Validates JWT  │
│ attaches token  │                            │ Extracts claims│
│ to all requests │ <───────────────────────── │ Returns data   │
└─────────────────┘                            └────────────────┘
```

**JWT Claims:**
- `userId` — unique user identifier
- `ClaimTypes.Email` — user email
- `ClaimTypes.Role` — user role

**Token Storage:**
- Key: `{appname}_token` in `localStorage`
- Attached by: `AuthInterceptor` on every HTTP request
- Cleared on: Logout

### 4.9 Middleware Stack

| Order | Middleware | Purpose |
|:-----:|-----------|---------|
| 1 | CorrelationIdMiddleware | Assigns a unique ID to each request for tracing |
| 2 | RequestLoggingMiddleware | Logs HTTP method, path, status code, duration |
| 3 | ExceptionHandlingMiddleware | Catches unhandled exceptions, returns JSON error |
| 4 | PerformanceMonitoringMiddleware | Flags requests slower than threshold (e.g., 500ms) |

### 4.10 Dependency Injection Registration

```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString));  // or UseNpgsql()

        // Services (one line per domain)
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<I{Domain}Service, {Domain}Service>();

        return services;
    }
}
```

### 4.11 Database Naming Conventions

**SQL Server:**
| Element | Convention | Example |
|---------|-----------|---------|
| Table | PascalCase with prefix | `SCM_Requisition` |
| Column | PascalCase | `RequisitionId` |
| Primary Key | `{Table}Id` or `Id` | `RequisitionId` |
| Foreign Key | `{ReferencedTable}Id` | `VendorId` |

**PostgreSQL:**
| Element | Convention | Example |
|---------|-----------|---------|
| Table | snake_case, plural | `forum_topics` |
| Column | snake_case | `first_name` |
| Primary Key | `id` | `id` |
| Foreign Key | `{referenced_table}_id` | `user_id` |

### 4.12 EF Core Configuration

```csharp
// Always use Fluent API (not Data Annotations)
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<{Entity}>(e =>
    {
        e.ToTable("{table_name}");
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasColumnName("{id_column}");
        e.Property(x => x.Name).HasColumnName("{name_column}");

        // Unique indexes on business keys
        e.HasIndex(x => x.Email).IsUnique();

        // Relationships
        e.HasMany(x => x.Children)
         .WithOne(x => x.Parent)
         .HasForeignKey(x => x.ParentId);

        // Ignore unmapped properties
        e.Ignore(x => x.CalculatedField);
    });
}
```

---

## Quick Reference — New Feature Checklist

When adding a new domain feature (e.g., "Payments"):

### Backend
- [ ] `Models/Domain/Payment.cs` — entity class
- [ ] `DbSet<Payment>` in `ApplicationDbContext` + Fluent API mapping
- [ ] `DTOs/Responses/PaymentDto.cs` — response DTO
- [ ] `DTOs/Requests/CreatePaymentRequest.cs` — request DTO
- [ ] `Services/Interfaces/IPaymentService.cs` — service interface
- [ ] `Services/PaymentService.cs` — service implementation
- [ ] Register in `ServiceCollectionExtensions.AddApplicationServices()`
- [ ] `Controllers/PaymentController.cs` with `[Authorize]`

### Frontend
- [ ] `core/models/payment.model.ts` — TypeScript interfaces
- [ ] `core/services/payment.service.ts` — HTTP service
- [ ] `features/payments/payments.component.ts` + `.html` + `.scss`
- [ ] Add lazy-loaded route in `app.routes.ts`
- [ ] Add sidebar navigation link in `layout.component.html`
- [ ] Add sub-components/dialogs in `features/payments/components/` or `dialogs/` if needed

### Database
- [ ] Create table with correct naming convention
- [ ] Add appropriate indexes
- [ ] Seed reference/lookup data if needed

---

*This document is the definitive architecture standard for all Platinum municipal ERP systems.*
