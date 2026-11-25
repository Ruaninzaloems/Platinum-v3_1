# DTOs (Data Transfer Objects)

- `Requests/` — Inbound request shapes (currently sourced from
  `@workspace/api-zod`, generated from the OpenAPI spec).
- `Responses/` — Outbound response shapes returned by controllers.

DTOs are deliberately decoupled from domain models so that API contracts
can evolve independently from the database schema.
