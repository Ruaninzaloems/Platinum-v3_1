import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sdbipFieldConfigsTable, scorecardKpisTable, deptScorecardKpisTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  ListSdbipFieldConfigsQueryParams,
  SaveSdbipFieldConfigsParams,
  GetSdbipFieldUsageParams,
  SaveSdbipFieldConfigsBody,
} from "@workspace/api-zod";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";

const router: IRouter = Router();

type SdbipType = "original" | "revised" | "departmental" | "quarterly" | "midyear" | "annual";

interface DefaultField {
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isIncluded?: boolean;
  isRequired?: boolean;
  isLocked?: boolean;
}

const ORG_DEFAULTS: DefaultField[] = [
  { fieldKey: "kpiNumber", fieldLabel: "Number", fieldType: "text", isRequired: true, isLocked: true },
  { fieldKey: "description", fieldLabel: "Indicator Description", fieldType: "textarea", isRequired: true, isLocked: true },
  { fieldKey: "idpReference", fieldLabel: "IDP Reference", fieldType: "text" },
  { fieldKey: "strategicObjective", fieldLabel: "Strategic Objective", fieldType: "textarea" },
  { fieldKey: "programme", fieldLabel: "Programme", fieldType: "text" },
  { fieldKey: "responsiblePostId", fieldLabel: "Responsible Post", fieldType: "select" },
  { fieldKey: "custodianPostId", fieldLabel: "Custodian Post", fieldType: "select" },
  { fieldKey: "baseline", fieldLabel: "Baseline", fieldType: "text" },
  { fieldKey: "annualTarget", fieldLabel: "Annual Target", fieldType: "text", isRequired: true, isLocked: true },
  { fieldKey: "annualBudgetTarget", fieldLabel: "Financial Baseline (R)", fieldType: "number" },
  { fieldKey: "fundingSource", fieldLabel: "Funding Source", fieldType: "text" },
  { fieldKey: "unitOfMeasureId", fieldLabel: "Unit of Measure", fieldType: "select" },
  { fieldKey: "budgetDescription", fieldLabel: "Budget Description", fieldType: "textarea" },
  { fieldKey: "evidenceSource", fieldLabel: "POE Source", fieldType: "text" },
];

// Departmental defaults mirror the legacy Add KPI dialog: only kpiNumber,
// description, annualTarget and weighting are included out of the box. The
// remaining fields are seeded as excluded so behaviour is unchanged until an
// admin enables them in the Scorecard Wizard.
const DEPT_DEFAULTS: DefaultField[] = [
  { fieldKey: "kpiNumber", fieldLabel: "Number", fieldType: "text", isRequired: true, isLocked: true },
  { fieldKey: "description", fieldLabel: "KPI Description", fieldType: "textarea", isRequired: true, isLocked: true },
  { fieldKey: "strategicObjective", fieldLabel: "Strategic Objective", fieldType: "textarea", isIncluded: false },
  { fieldKey: "nkpaLink", fieldLabel: "NKPA Link", fieldType: "text", isIncluded: false },
  { fieldKey: "responsiblePostId", fieldLabel: "Responsible Post", fieldType: "select", isIncluded: false },
  { fieldKey: "baseline", fieldLabel: "Baseline", fieldType: "text", isIncluded: false },
  { fieldKey: "annualTarget", fieldLabel: "Annual Target", fieldType: "text", isRequired: true, isLocked: true },
  { fieldKey: "annualBudgetTarget", fieldLabel: "Annual Budget (R)", fieldType: "number", isIncluded: false },
  { fieldKey: "unitOfMeasureId", fieldLabel: "Unit of Measure", fieldType: "select", isIncluded: false },
];

export const SDBIP_DEFAULTS: Record<SdbipType, DefaultField[]> = {
  original: ORG_DEFAULTS,
  revised: ORG_DEFAULTS,
  departmental: DEPT_DEFAULTS,
  quarterly: ORG_DEFAULTS,
  midyear: ORG_DEFAULTS,
  annual: ORG_DEFAULTS,
};

async function ensureSeeded(sdbipType: SdbipType) {
  const existing = await db.select().from(sdbipFieldConfigsTable)
    .where(eq(sdbipFieldConfigsTable.sdbipType, sdbipType));
  if (existing.length > 0) return existing;
  const defaults = SDBIP_DEFAULTS[sdbipType].map((f, i) => ({
    sdbipType,
    fieldKind: "primary",
    fieldKey: f.fieldKey,
    fieldLabel: f.fieldLabel,
    fieldType: f.fieldType,
    isIncluded: f.isIncluded !== false,
    isRequired: !!f.isRequired,
    isLocked: !!f.isLocked,
    sortOrder: i,
  }));
  return db.insert(sdbipFieldConfigsTable).values(defaults).returning();
}

const SDBIP_TYPES: SdbipType[] = ["original", "revised", "departmental", "quarterly", "midyear", "annual"];

router.get("/sdbip-field-configs", async (req, res, next) => {
  try {
    const query = ListSdbipFieldConfigsQueryParams.parse(req.query);
    if (query.sdbipType) {
      const rows = await ensureSeeded(query.sdbipType as SdbipType);
      res.json([...rows].sort((a, b) => a.sortOrder - b.sortOrder));
      return;
    }
    const all: unknown[] = [];
    for (const t of SDBIP_TYPES) {
      const rows = await ensureSeeded(t);
      all.push(...[...rows].sort((a, b) => a.sortOrder - b.sortOrder));
    }
    res.json(all);
  } catch (err) { next(err); }
});

function hasValue(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "" && v !== false;
}

router.get("/sdbip-field-configs/:sdbipType/usage", async (req, res, next) => {
  try {
    const { sdbipType } = GetSdbipFieldUsageParams.parse(req.params);
    const configs = await ensureSeeded(sdbipType as SdbipType);
    const kpis = sdbipType === "departmental"
      ? await db.select().from(deptScorecardKpisTable)
      : await db.select().from(scorecardKpisTable);
    const usage: Record<string, number> = {};
    for (const f of configs) {
      let count = 0;
      for (const kpi of kpis) {
        const value = f.fieldKind === "custom"
          ? (kpi.customFields ?? {})[f.fieldKey]
          : (kpi as unknown as Record<string, unknown>)[f.fieldKey];
        if (hasValue(value)) count++;
      }
      usage[`${f.fieldKind}:${f.fieldKey}`] = count;
    }
    res.json({ usage });
  } catch (err) { next(err); }
});

router.put("/sdbip-field-configs/:sdbipType", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { sdbipType } = SaveSdbipFieldConfigsParams.parse(req.params);
    const body = SaveSdbipFieldConfigsBody.parse(req.body);
    const lockedKeys = new Set(
      SDBIP_DEFAULTS[sdbipType as SdbipType].filter(f => f.isLocked).map(f => f.fieldKey),
    );
    for (const key of lockedKeys) {
      if (!body.fields.some(f => f.fieldKind === "primary" && f.fieldKey === key)) {
        res.status(400).json({ error: `Core field '${key}' cannot be removed` });
        return;
      }
    }
    const seenKeys = new Set<string>();
    for (const f of body.fields) {
      const compound = `${f.fieldKind}:${f.fieldKey}`;
      if (seenKeys.has(compound)) {
        res.status(400).json({ error: `Duplicate field key '${f.fieldKey}'` });
        return;
      }
      seenKeys.add(compound);
    }
    const rows = await db.transaction(async (tx) => {
      const [before] = [await tx.select().from(sdbipFieldConfigsTable).where(eq(sdbipFieldConfigsTable.sdbipType, sdbipType))];
      await tx.delete(sdbipFieldConfigsTable).where(eq(sdbipFieldConfigsTable.sdbipType, sdbipType));
      const values = body.fields.map((f, i) => {
        const locked = f.fieldKind === "primary" && lockedKeys.has(f.fieldKey);
        return {
          sdbipType,
          fieldKind: f.fieldKind,
          fieldKey: f.fieldKey,
          fieldLabel: f.fieldLabel,
          fieldType: f.fieldType ?? "text",
          isIncluded: locked ? true : (f.isIncluded ?? true),
          isRequired: locked ? true : (f.isRequired ?? false),
          isLocked: locked,
          sortOrder: f.sortOrder ?? i,
        };
      });
      const inserted = await tx.insert(sdbipFieldConfigsTable).values(values).returning();
      return { before, inserted };
    });
    await logAudit(req, "update", "sdbip_field_config", 0,
      { fields: rows.before } as unknown as Record<string, unknown>,
      { fields: rows.inserted } as unknown as Record<string, unknown>);
    res.json([...rows.inserted].sort((a, b) => a.sortOrder - b.sortOrder));
  } catch (err) { next(err); }
});

export default router;
