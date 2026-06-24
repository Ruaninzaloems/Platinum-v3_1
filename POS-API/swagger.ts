import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

/**
 * Build a minimal OpenAPI 3 spec by introspecting the live Express route table,
 * so every registered /api/* endpoint appears in Swagger without hand-annotating
 * each route. Defensive across Express 4/5 router internals.
 */
function buildSpec(app: Express) {
  const paths: Record<string, any> = {};
  const router: any = (app as any).router ?? (app as any)._router;
  const stack: any[] = router?.stack ?? [];

  for (const layer of stack) {
    const route = layer?.route;
    const p: string | undefined = route?.path;
    if (!p || typeof p !== "string" || !p.startsWith("/api")) continue;

    const methodObj: Record<string, boolean> = route.methods ?? {};
    let methods = Object.keys(methodObj).filter((m) => methodObj[m]);
    if (methods.length === 0 && Array.isArray(route.stack)) {
      methods = route.stack.map((s: any) => s.method).filter(Boolean);
    }

    paths[p] ??= {};
    for (const m of methods) {
      if (!m || m === "_all") continue;
      paths[p][m.toLowerCase()] = {
        tags: [p.split("/")[2] || "api"],
        summary: `${m.toUpperCase()} ${p}`,
        responses: { "200": { description: "OK" } },
      };
    }
  }

  return {
    openapi: "3.0.0",
    info: {
      title: "Platinum ERP — POS API",
      version: "1.0.0",
      description:
        "POS receipting + EMS Azure (MSAL) authentication API. Paths are auto-generated from the live Express route table.",
    },
    paths,
  };
}

/** Mount Swagger UI at /swagger and the raw spec at /swagger.json. */
export function setupSwagger(app: Express): void {
  const spec = buildSpec(app);
  app.get("/swagger.json", (_req: Request, res: Response) => res.json(spec));
  app.use(
    "/swagger",
    swaggerUi.serve,
    swaggerUi.setup(spec, { customSiteTitle: "Platinum POS API" }),
  );
  console.log(
    `[swagger] UI available at /swagger — ${Object.keys(spec.paths).length} path(s) documented`,
  );
}
