import { db } from "@workspace/db";
import {
  usersTable,
  performanceCyclesTable,
  kpiGroupsTable,
  unitsOfMeasureTable,
  nkpaWeightingsTable,
  scorecardsTable,
  scorecardKpisTable,
  kpiQuarterTargetsTable,
  kpiQuarterActualsTable,
  kpiEvidenceDocumentsTable,
  deptScorecardsTable,
  deptScorecardKpisTable,
  remedialActionPlansTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function seedDemoData() {
  const [existingCycle] = await db
    .select()
    .from(performanceCyclesTable)
    .where(eq(performanceCyclesTable.financialYearLabel, "2025/2026"));
  if (existingCycle) {
    console.log("Seed: demo data already exists, skipping");
    return;
  }

  const [admin] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, "admin"));
  if (!admin) {
    console.log("Seed: admin user not found, skipping demo data");
    return;
  }

  console.log("Seed: inserting demo data…");

  await db.transaction(async (tx) => {
    await insertDemoData(tx, admin.id);
  });

  console.log("Seed: demo data inserted successfully");
}

async function insertDemoData(db: Parameters<Parameters<typeof import("@workspace/db").db.transaction>[0]>[0], adminId: number) {

  const deptUsers: { username: string; displayName: string; email: string; role: string; departmentId: number }[] = [
    { username: "jmolefe", displayName: "Jane Molefe", email: "jmolefe@municipality.gov.za", role: "hod", departmentId: 1 },
    { username: "tsibanda", displayName: "Thabo Sibanda", email: "tsibanda@municipality.gov.za", role: "hod", departmentId: 2 },
    { username: "nvanwyk", displayName: "Naledi van Wyk", email: "nvanwyk@municipality.gov.za", role: "hod", departmentId: 3 },
    { username: "mkhoza", displayName: "Mandla Khoza", email: "mkhoza@municipality.gov.za", role: "hod", departmentId: 4 },
    { username: "fmoosa", displayName: "Fatima Moosa", email: "fmoosa@municipality.gov.za", role: "hod", departmentId: 5 },
    { username: "dpretorius", displayName: "Danie Pretorius", email: "dpretorius@municipality.gov.za", role: "dept_coordinator", departmentId: 1 },
    { username: "lnaidoo", displayName: "Lerato Naidoo", email: "lnaidoo@municipality.gov.za", role: "dept_coordinator", departmentId: 2 },
    { username: "pgovender", displayName: "Pieter Govender", email: "pgovender@municipality.gov.za", role: "responsible_post", departmentId: 3 },
  ];

  const userIds: Record<string, number> = {};
  for (const u of deptUsers) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, u.username));
    if (existing) {
      userIds[u.username] = existing.id;
    } else {
      const [inserted] = await db.insert(usersTable).values({ ...u, isActive: true }).returning();
      userIds[u.username] = inserted.id;
    }
  }

  const [cycle] = await db
    .insert(performanceCyclesTable)
    .values({
      financialYearLabel: "2025/2026",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
      status: "Open",
    })
    .returning();

  const cycleId = cycle.id;

  const nkpaNames = [
    "Basic Service Delivery",
    "Local Economic Development",
    "Municipal Institutional Development & Transformation",
    "Municipal Financial Viability & Management",
    "Good Governance & Public Participation",
  ];

  const groupIds: Record<string, number> = {};
  for (let i = 0; i < nkpaNames.length; i++) {
    const [g] = await db
      .insert(kpiGroupsTable)
      .values({
        name: nkpaNames[i],
        code: `NKPA${i + 1}`,
        cycleId,
        isActive: true,
        sortOrder: i,
      })
      .returning();
    groupIds[nkpaNames[i]] = g.id;
  }

  const nkpaWeights = [30, 15, 20, 25, 10];
  for (let i = 0; i < nkpaNames.length; i++) {
    await db.insert(nkpaWeightingsTable).values({
      nkpaName: nkpaNames[i],
      weight: nkpaWeights[i],
      scope: "organisational",
      cycleId,
    });
  }

  const [uomPct] = await db.insert(unitsOfMeasureTable).values({ name: "Percentage", abbreviation: "%", cycleId, isActive: true }).returning();
  const [uomNum] = await db.insert(unitsOfMeasureTable).values({ name: "Number", abbreviation: "#", cycleId, isActive: true }).returning();
  const [uomRand] = await db.insert(unitsOfMeasureTable).values({ name: "Rand", abbreviation: "R", cycleId, isActive: true }).returning();
  const [uomDays] = await db.insert(unitsOfMeasureTable).values({ name: "Days", abbreviation: "d", cycleId, isActive: true }).returning();

  const [orgScorecard] = await db
    .insert(scorecardsTable)
    .values({
      name: "Municipal Organisational Scorecard 2025/26",
      cycleId,
      scorecardType: "organisational",
      status: "Approved",
      createdById: adminId,
      approvedById: adminId,
      approvedAt: new Date(),
    })
    .returning();

  const kpiDefs: {
    kpiNumber: string;
    description: string;
    nkpa: string;
    annualTarget: string;
    weighting: number;
    budget: number;
    uomId: number;
    strategicObjective: string;
    programme: string;
    q1Target: string; q2Target: string; q3Target: string; q4Target: string;
    q1Actual: string; q2Actual: string; q3Actual: string;
    q1Achieved: boolean; q2Achieved: boolean; q3Achieved: boolean;
    q1Budget: number; q2Budget: number; q3Budget: number; q4Budget: number;
  }[] = [
    {
      kpiNumber: "BSD-01", description: "Percentage of households with access to basic water supply",
      nkpa: "Basic Service Delivery", annualTarget: "98", weighting: 8, budget: 12000000, uomId: uomPct.id,
      strategicObjective: "Universal access to clean water", programme: "Water Services",
      q1Target: "92", q2Target: "94", q3Target: "96", q4Target: "98",
      q1Actual: "93", q2Actual: "95", q3Actual: "96",
      q1Achieved: true, q2Achieved: true, q3Achieved: true,
      q1Budget: 3000000, q2Budget: 3000000, q3Budget: 3000000, q4Budget: 3000000,
    },
    {
      kpiNumber: "BSD-02", description: "Number of water supply interruptions resolved within 48 hours",
      nkpa: "Basic Service Delivery", annualTarget: "200", weighting: 6, budget: 5000000, uomId: uomNum.id,
      strategicObjective: "Reliable water infrastructure", programme: "Water Maintenance",
      q1Target: "50", q2Target: "50", q3Target: "50", q4Target: "50",
      q1Actual: "42", q2Actual: "55", q3Actual: "38",
      q1Achieved: false, q2Achieved: true, q3Achieved: false,
      q1Budget: 1250000, q2Budget: 1250000, q3Budget: 1250000, q4Budget: 1250000,
    },
    {
      kpiNumber: "BSD-03", description: "Percentage of households with access to sanitation services",
      nkpa: "Basic Service Delivery", annualTarget: "95", weighting: 7, budget: 8000000, uomId: uomPct.id,
      strategicObjective: "Improved sanitation coverage", programme: "Sanitation Services",
      q1Target: "88", q2Target: "90", q3Target: "92", q4Target: "95",
      q1Actual: "89", q2Actual: "91", q3Actual: "91",
      q1Achieved: true, q2Achieved: true, q3Achieved: false,
      q1Budget: 2000000, q2Budget: 2000000, q3Budget: 2000000, q4Budget: 2000000,
    },
    {
      kpiNumber: "BSD-04", description: "Kilometres of new roads constructed",
      nkpa: "Basic Service Delivery", annualTarget: "25", weighting: 5, budget: 18000000, uomId: uomNum.id,
      strategicObjective: "Transport infrastructure expansion", programme: "Roads & Stormwater",
      q1Target: "5", q2Target: "7", q3Target: "7", q4Target: "6",
      q1Actual: "6", q2Actual: "4", q3Actual: "8",
      q1Achieved: true, q2Achieved: false, q3Achieved: true,
      q1Budget: 4500000, q2Budget: 4500000, q3Budget: 4500000, q4Budget: 4500000,
    },
    {
      kpiNumber: "BSD-05", description: "Average turnaround time for electricity fault resolution (days)",
      nkpa: "Basic Service Delivery", annualTarget: "3", weighting: 4, budget: 6000000, uomId: uomDays.id,
      strategicObjective: "Reliable electricity supply", programme: "Electrical Services",
      q1Target: "4", q2Target: "3.5", q3Target: "3", q4Target: "3",
      q1Actual: "3.8", q2Actual: "3.2", q3Actual: "2.9",
      q1Achieved: true, q2Achieved: true, q3Achieved: true,
      q1Budget: 1500000, q2Budget: 1500000, q3Budget: 1500000, q4Budget: 1500000,
    },
    {
      kpiNumber: "LED-01", description: "Number of SMME support programmes implemented",
      nkpa: "Local Economic Development", annualTarget: "12", weighting: 5, budget: 3000000, uomId: uomNum.id,
      strategicObjective: "SMME development and job creation", programme: "Economic Development",
      q1Target: "3", q2Target: "3", q3Target: "3", q4Target: "3",
      q1Actual: "3", q2Actual: "4", q3Actual: "2",
      q1Achieved: true, q2Achieved: true, q3Achieved: false,
      q1Budget: 750000, q2Budget: 750000, q3Budget: 750000, q4Budget: 750000,
    },
    {
      kpiNumber: "LED-02", description: "Number of jobs created through municipal projects",
      nkpa: "Local Economic Development", annualTarget: "500", weighting: 5, budget: 15000000, uomId: uomNum.id,
      strategicObjective: "Employment creation", programme: "Public Works & Job Creation",
      q1Target: "100", q2Target: "150", q3Target: "150", q4Target: "100",
      q1Actual: "110", q2Actual: "130", q3Actual: "160",
      q1Achieved: true, q2Achieved: false, q3Achieved: true,
      q1Budget: 3750000, q2Budget: 3750000, q3Budget: 3750000, q4Budget: 3750000,
    },
    {
      kpiNumber: "LED-03", description: "Percentage of procurement spend on local suppliers",
      nkpa: "Local Economic Development", annualTarget: "60", weighting: 5, budget: 0, uomId: uomPct.id,
      strategicObjective: "Local procurement preference", programme: "Supply Chain Management",
      q1Target: "50", q2Target: "55", q3Target: "57", q4Target: "60",
      q1Actual: "52", q2Actual: "54", q3Actual: "58",
      q1Achieved: true, q2Achieved: false, q3Achieved: true,
      q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0,
    },
    {
      kpiNumber: "MID-01", description: "Percentage of approved posts filled",
      nkpa: "Municipal Institutional Development & Transformation", annualTarget: "90", weighting: 5, budget: 2000000, uomId: uomPct.id,
      strategicObjective: "Capacitated workforce", programme: "Human Resources",
      q1Target: "82", q2Target: "85", q3Target: "87", q4Target: "90",
      q1Actual: "83", q2Actual: "85", q3Actual: "86",
      q1Achieved: true, q2Achieved: true, q3Achieved: false,
      q1Budget: 500000, q2Budget: 500000, q3Budget: 500000, q4Budget: 500000,
    },
    {
      kpiNumber: "MID-02", description: "Number of employees completing skills development training",
      nkpa: "Municipal Institutional Development & Transformation", annualTarget: "300", weighting: 5, budget: 4000000, uomId: uomNum.id,
      strategicObjective: "Skills development", programme: "Training & Development",
      q1Target: "60", q2Target: "80", q3Target: "80", q4Target: "80",
      q1Actual: "65", q2Actual: "75", q3Actual: "90",
      q1Achieved: true, q2Achieved: false, q3Achieved: true,
      q1Budget: 1000000, q2Budget: 1000000, q3Budget: 1000000, q4Budget: 1000000,
    },
    {
      kpiNumber: "MID-03", description: "Percentage of performance agreements signed by senior managers",
      nkpa: "Municipal Institutional Development & Transformation", annualTarget: "100", weighting: 5, budget: 0, uomId: uomPct.id,
      strategicObjective: "Performance accountability", programme: "Performance Management",
      q1Target: "100", q2Target: "100", q3Target: "100", q4Target: "100",
      q1Actual: "95", q2Actual: "100", q3Actual: "100",
      q1Achieved: false, q2Achieved: true, q3Achieved: true,
      q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0,
    },
    {
      kpiNumber: "MID-04", description: "Number of IT systems upgraded or deployed",
      nkpa: "Municipal Institutional Development & Transformation", annualTarget: "5", weighting: 5, budget: 8000000, uomId: uomNum.id,
      strategicObjective: "Digital transformation", programme: "ICT",
      q1Target: "1", q2Target: "2", q3Target: "1", q4Target: "1",
      q1Actual: "1", q2Actual: "1", q3Actual: "2",
      q1Achieved: true, q2Achieved: false, q3Achieved: true,
      q1Budget: 2000000, q2Budget: 2000000, q3Budget: 2000000, q4Budget: 2000000,
    },
    {
      kpiNumber: "FVM-01", description: "Percentage of revenue collected against billed amount",
      nkpa: "Municipal Financial Viability & Management", annualTarget: "95", weighting: 7, budget: 0, uomId: uomPct.id,
      strategicObjective: "Improved revenue collection", programme: "Revenue Management",
      q1Target: "90", q2Target: "92", q3Target: "93", q4Target: "95",
      q1Actual: "88", q2Actual: "91", q3Actual: "90",
      q1Achieved: false, q2Achieved: false, q3Achieved: false,
      q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0,
    },
    {
      kpiNumber: "FVM-02", description: "Percentage of operating budget spent",
      nkpa: "Municipal Financial Viability & Management", annualTarget: "95", weighting: 6, budget: 0, uomId: uomPct.id,
      strategicObjective: "Effective budget management", programme: "Budget & Treasury",
      q1Target: "22", q2Target: "48", q3Target: "72", q4Target: "95",
      q1Actual: "20", q2Actual: "46", q3Actual: "70",
      q1Achieved: false, q2Achieved: false, q3Achieved: false,
      q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0,
    },
    {
      kpiNumber: "FVM-03", description: "Percentage of capital budget spent",
      nkpa: "Municipal Financial Viability & Management", annualTarget: "90", weighting: 6, budget: 45000000, uomId: uomPct.id,
      strategicObjective: "Capital programme delivery", programme: "Capital Projects",
      q1Target: "15", q2Target: "40", q3Target: "65", q4Target: "90",
      q1Actual: "12", q2Actual: "35", q3Actual: "58",
      q1Achieved: false, q2Achieved: false, q3Achieved: false,
      q1Budget: 11250000, q2Budget: 11250000, q3Budget: 11250000, q4Budget: 11250000,
    },
    {
      kpiNumber: "FVM-04", description: "Number of days to pay suppliers from invoice date",
      nkpa: "Municipal Financial Viability & Management", annualTarget: "30", weighting: 6, budget: 0, uomId: uomDays.id,
      strategicObjective: "Timely supplier payment", programme: "Expenditure Management",
      q1Target: "35", q2Target: "33", q3Target: "31", q4Target: "30",
      q1Actual: "38", q2Actual: "34", q3Actual: "32",
      q1Achieved: false, q2Achieved: false, q3Achieved: false,
      q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0,
    },
    {
      kpiNumber: "GGP-01", description: "Number of community ward meetings held",
      nkpa: "Good Governance & Public Participation", annualTarget: "120", weighting: 5, budget: 1500000, uomId: uomNum.id,
      strategicObjective: "Community engagement", programme: "Public Participation",
      q1Target: "30", q2Target: "30", q3Target: "30", q4Target: "30",
      q1Actual: "32", q2Actual: "28", q3Actual: "35",
      q1Achieved: true, q2Achieved: false, q3Achieved: true,
      q1Budget: 375000, q2Budget: 375000, q3Budget: 375000, q4Budget: 375000,
    },
    {
      kpiNumber: "GGP-02", description: "Percentage of Batho Pele complaints resolved within 14 days",
      nkpa: "Good Governance & Public Participation", annualTarget: "90", weighting: 5, budget: 500000, uomId: uomPct.id,
      strategicObjective: "Responsive government", programme: "Customer Care",
      q1Target: "80", q2Target: "85", q3Target: "87", q4Target: "90",
      q1Actual: "82", q2Actual: "86", q3Actual: "84",
      q1Achieved: true, q2Achieved: true, q3Achieved: false,
      q1Budget: 125000, q2Budget: 125000, q3Budget: 125000, q4Budget: 125000,
    },
  ];

  const kpiIdMap: Record<string, number> = {};

  for (const kpi of kpiDefs) {
    const [inserted] = await db
      .insert(scorecardKpisTable)
      .values({
        scorecardId: orgScorecard.id,
        kpiNumber: kpi.kpiNumber,
        description: kpi.description,
        strategicObjective: kpi.strategicObjective,
        programme: kpi.programme,
        annualTarget: kpi.annualTarget,
        weighting: kpi.weighting,
        annualBudgetTarget: kpi.budget,
        unitOfMeasureId: kpi.uomId,
        kpiGroupId: groupIds[kpi.nkpa],
        status: "Approved",
        baseline: "0",
        responsiblePostId: adminId,
        custodianPostId: adminId,
        sortOrder: 0,
      })
      .returning();

    kpiIdMap[kpi.kpiNumber] = inserted.id;

    const targets = [
      { quarter: 1, targetValue: kpi.q1Target, budgetValue: kpi.q1Budget },
      { quarter: 2, targetValue: kpi.q2Target, budgetValue: kpi.q2Budget },
      { quarter: 3, targetValue: kpi.q3Target, budgetValue: kpi.q3Budget },
      { quarter: 4, targetValue: kpi.q4Target, budgetValue: kpi.q4Budget },
    ];

    for (const t of targets) {
      await db.insert(kpiQuarterTargetsTable).values({
        kpiId: inserted.id,
        quarter: t.quarter,
        targetValue: t.targetValue,
        budgetValue: t.budgetValue,
      });
    }

    const actuals = [
      { quarter: 1, actualValue: kpi.q1Actual, isAchieved: kpi.q1Achieved },
      { quarter: 2, actualValue: kpi.q2Actual, isAchieved: kpi.q2Achieved },
      { quarter: 3, actualValue: kpi.q3Actual, isAchieved: kpi.q3Achieved },
    ];

    for (const a of actuals) {
      await db.insert(kpiQuarterActualsTable).values({
        kpiId: inserted.id,
        quarter: a.quarter,
        actualValue: a.actualValue,
        isAchieved: a.isAchieved,
        submittedById: adminId,
        status: "Approved",
      });
    }
  }

  const departments = [
    { id: 1, name: "Infrastructure & Engineering", owner: "jmolefe", kpis: ["BSD-01", "BSD-02", "BSD-04", "BSD-05"] },
    { id: 2, name: "Community Services", owner: "tsibanda", kpis: ["BSD-03", "GGP-01", "GGP-02"] },
    { id: 3, name: "Corporate Services", owner: "nvanwyk", kpis: ["MID-01", "MID-02", "MID-03", "MID-04"] },
    { id: 4, name: "Finance", owner: "mkhoza", kpis: ["FVM-01", "FVM-02", "FVM-03", "FVM-04"] },
    { id: 5, name: "Economic Development & Planning", owner: "fmoosa", kpis: ["LED-01", "LED-02", "LED-03"] },
  ];

  for (const dept of departments) {
    const ownerId = userIds[dept.owner];
    const [deptSc] = await db
      .insert(deptScorecardsTable)
      .values({
        name: `${dept.name} Scorecard 2025/26`,
        cycleId,
        departmentId: dept.id,
        departmentName: dept.name,
        parentScorecardId: orgScorecard.id,
        ownerId,
        status: "Approved",
        createdById: ownerId,
        approvedById: adminId,
        approvedAt: new Date(),
      })
      .returning();

    for (let i = 0; i < dept.kpis.length; i++) {
      const kpiNum = dept.kpis[i];
      const parentKpiId = kpiIdMap[kpiNum];
      const parentDef = kpiDefs.find(k => k.kpiNumber === kpiNum)!;

      await db.insert(deptScorecardKpisTable).values({
        deptScorecardId: deptSc.id,
        parentKpiId,
        kpiNumber: kpiNum,
        description: parentDef.description,
        strategicObjective: parentDef.strategicObjective,
        annualTarget: parentDef.annualTarget,
        weighting: parentDef.weighting,
        annualBudgetTarget: parentDef.budget,
        unitOfMeasureId: parentDef.uomId,
        isInherited: true,
        sortOrder: i,
      });
    }
  }

  const evidenceStatuses: Record<string, string[]> = {
    "BSD-01": ["Verified", "Verified", "Verified"],
    "BSD-02": ["Verified", "Pending", "Rejected"],
    "BSD-03": ["Verified", "Verified", "Pending"],
    "BSD-05": ["Verified", "Verified", "Verified"],
    "LED-01": ["Verified", "Pending", "Rejected"],
    "MID-01": ["Pending", "Verified", "Pending"],
    "FVM-01": ["Rejected", "Pending", "Pending"],
    "GGP-01": ["Verified", "Verified", "Pending"],
    "GGP-02": ["Verified", "Verified", "Rejected"],
  };

  const evidenceKpis = Object.keys(evidenceStatuses);
  for (const kpiNum of evidenceKpis) {
    const kpiId = kpiIdMap[kpiNum];
    const statuses = evidenceStatuses[kpiNum];
    for (let q = 1; q <= 3; q++) {
      await db.insert(kpiEvidenceDocumentsTable).values({
        kpiId,
        quarter: q,
        fileName: `${kpiNum}_Q${q}_evidence.pdf`,
        fileSize: 150000 + q * 50000,
        mimeType: "application/pdf",
        filePath: `/evidence/${kpiNum}_Q${q}.pdf`,
        documentType: "Supporting Document",
        description: `Quarter ${q} evidence for ${kpiNum}`,
        uploadedById: adminId,
        verificationStatus: statuses[q - 1],
      });
    }
  }

  const noEvidenceKpis = [
    { kpi: "BSD-04", q: 1 }, { kpi: "LED-02", q: 2 }, { kpi: "LED-03", q: 1 },
    { kpi: "MID-02", q: 2 }, { kpi: "MID-03", q: 1 }, { kpi: "MID-04", q: 2 },
    { kpi: "FVM-02", q: 1 }, { kpi: "FVM-03", q: 2 }, { kpi: "FVM-04", q: 1 },
  ];
  for (const { kpi: kpiNum, q } of noEvidenceKpis) {
    const kpiId = kpiIdMap[kpiNum];
    await db.insert(kpiEvidenceDocumentsTable).values({
      kpiId,
      quarter: q,
      fileName: `${kpiNum}_Q${q}_report.pdf`,
      fileSize: 120000,
      mimeType: "application/pdf",
      filePath: `/evidence/${kpiNum}_Q${q}.pdf`,
      documentType: "Progress Report",
      description: `Quarter ${q} report for ${kpiNum}`,
      uploadedById: adminId,
      verificationStatus: "Pending",
    });
  }

  const remedialKpis = ["BSD-02", "FVM-01", "FVM-03", "FVM-04"];
  for (const kpiNum of remedialKpis) {
    await db.insert(remedialActionPlansTable).values({
      kpiId: kpiIdMap[kpiNum],
      quarter: 3,
      actionDescription: `Corrective action plan for ${kpiNum} underperformance in Q3`,
      actionOwnerIds: String(adminId),
      dueDate: "2026-03-31",
      status: kpiNum === "FVM-04" ? "In Progress" : "Open",
      createdById: adminId,
    });
  }
}
