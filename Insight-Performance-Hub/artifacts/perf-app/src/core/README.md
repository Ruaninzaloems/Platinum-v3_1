# Core

Singleton, app-wide concerns shared across every feature.

- `guards/` — Route-access checks (auth, role).
- `interceptors/` — HTTP request/response interceptors (e.g. attaching
  the user header, surfacing errors via toast).
- `models/` — Domain TypeScript interfaces, one file per domain.
- `services/` — Long-lived services such as the auth/session helper and
  per-domain API services. Generated API client wrappers also belong
  here.
- `hooks/` — App-wide React hooks (`useAuth`, `use-toast`, etc.).
- `lib/` — Small utility helpers (`cn` class merger, formatters).
