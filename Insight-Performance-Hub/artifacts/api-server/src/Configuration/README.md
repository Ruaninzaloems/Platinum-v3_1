# Configuration

Strongly-typed configuration classes. Currently configuration is read
directly from environment variables (`DATABASE_URL`, `PORT`, etc.) in
`../app.ts` and `../index.ts`. As the project grows, individual settings
classes (e.g. `JwtSettings.ts`, `DatabaseSettings.ts`) should live here.
