/**
 * Statutory MFMA/OPMS compliance calendar derived from a performance cycle's
 * financial year dates. Pure date logic — kept separate for testability.
 */

export type MfmaMilestone = {
  key: string;
  title: string;
  description: string;
  icon: string;
  dueDate: string;
};

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
};

// Month-end safe: clamps the day to the target month's length (e.g. 31 Dec + 2 months → 28/29 Feb)
const addMonths = (d: Date, n: number): Date => {
  const totalMonths = d.getUTCFullYear() * 12 + d.getUTCMonth() + n;
  const year = Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const daysInTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d.getUTCDate(), daysInTarget)));
};

// Statutory "within N months of FY end" deadlines fall on the last day of the target month
const endOfMonth = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));

const iso = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Derive the statutory milestone list from FY start/end dates (ISO yyyy-mm-dd).
 * Returned list is sorted by due date.
 */
export function computeMfmaMilestones(startDate: string, endDate: string): MfmaMilestone[] {
  const fyStart = new Date(`${startDate}T00:00:00Z`);
  const fyEnd = new Date(`${endDate}T00:00:00Z`);
  const milestones: MfmaMilestone[] = [];

  // Quarterly performance data submissions — 30 days after each quarter end (MFMA s52(d) reporting basis)
  for (let q = 1; q <= 4; q++) {
    const quarterEnd = addDays(addMonths(fyStart, q * 3), -1);
    milestones.push({
      key: `q${q}-data-submission`,
      title: `Q${q} Performance Data Submission`,
      description: "All departments — 30 days after quarter end",
      icon: "monitoring",
      dueDate: iso(addDays(quarterEnd, 30)),
    });
  }

  // Mid-year budget & performance assessment — by 25 January (MFMA s72)
  const midYearEnd = addDays(addMonths(fyStart, 6), -1); // 31 Dec for a Jul–Jun FY
  milestones.push({
    key: "mid-year-assessment",
    title: "Mid-Year Budget & Performance Assessment",
    description: "MFMA s72 — assessment by 25 January",
    icon: "balance",
    dueDate: iso(addDays(midYearEnd, 25)),
  });

  // Annual Financial Statements to AGSA — within 2 months of FY end (MFMA s122/s126)
  milestones.push({
    key: "afs-to-agsa",
    title: "Annual Financial Statements to AGSA",
    description: "MFMA s122 — within 2 months of FY end",
    icon: "description",
    dueDate: iso(endOfMonth(addMonths(fyEnd, 2))),
  });

  // Annual performance report to Auditor-General (MFMA s46 / MSA)
  milestones.push({
    key: "s46-performance-report",
    title: "Performance Report to Auditor-General",
    description: "MFMA s46 — annual performance report submission",
    icon: "history_edu",
    dueDate: iso(endOfMonth(addMonths(fyEnd, 3))),
  });

  // Draft annual report finalisation — internal review before Council tabling
  milestones.push({
    key: "draft-annual-report",
    title: "Draft Annual Report Finalisation",
    description: "Internal review prior to Council tabling",
    icon: "folder_open",
    dueDate: iso(endOfMonth(addMonths(fyEnd, 4))),
  });

  // Annual report tabling to Council — within 7 months of FY end (MFMA s127)
  milestones.push({
    key: "annual-report-tabling",
    title: "Annual Report Tabling to Council",
    description: "MFMA s127 — within 7 months of financial year end",
    icon: "gavel",
    dueDate: iso(endOfMonth(addMonths(fyEnd, 7))),
  });

  return milestones.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export type SdbipComplianceRow = {
  label: string;
  value: string;
  /** Links a reference row to the dashboard milestone(s) it derives from. */
  milestoneKeys?: string[];
};

/**
 * Read-only SDBIP compliance reference (MFMA legislative requirements for
 * OPMS). Rows that correspond to a statutory milestone carry milestoneKeys so
 * the config page can show the exact due dates the dashboard calendar uses —
 * both derive from computeMfmaMilestones, keeping them aligned by design.
 */
export const SDBIP_COMPLIANCE_REFERENCE: SdbipComplianceRow[] = [
  {
    label: "SDBIP Submission",
    value: "Within 28 days of Council budget approval (MFMA s69(3)(a))",
  },
  {
    label: "Quarterly Reporting",
    value: "Q1–Q4 to Mayor within 30 days of quarter-end (MFMA s52(d))",
    milestoneKeys: ["q1-data-submission", "q2-data-submission", "q3-data-submission", "q4-data-submission"],
  },
  {
    label: "Mid-Year Review",
    value: "Q2 end — assessment by 25 January, submission to Council (MFMA s72)",
    milestoneKeys: ["mid-year-assessment"],
  },
  {
    label: "Annual Financial Statements",
    value: "To AGSA within 2 months of financial year-end (MFMA s122/s126)",
    milestoneKeys: ["afs-to-agsa"],
  },
  {
    label: "Annual Performance Report",
    value: "To Auditor-General within 3 months of financial year-end (MFMA s46 / s126)",
    milestoneKeys: ["s46-performance-report"],
  },
  {
    label: "Annual Report",
    value: "Tabled in Council within 7 months of financial year-end (MFMA s127)",
    milestoneKeys: ["draft-annual-report", "annual-report-tabling"],
  },
  {
    label: "Approval Workflow",
    value: "Draft → Submitted → Manager Approved → Approved (Finalised) → Audited (Optional)",
  },
  {
    label: "Performance Periods",
    value: "Q1 Jul–Sep · Q2 Oct–Dec · Q3 Jan–Mar · Q4 Apr–Jun",
  },
  {
    label: "KPI Source",
    value: "Original SDBIP / Revised SDBIP / Departmental SDBIP",
  },
  {
    label: "Minimum KPIs",
    value: "As prescribed per IDP strategic objectives",
  },
];
