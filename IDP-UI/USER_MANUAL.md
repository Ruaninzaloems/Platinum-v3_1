# Platinum ERP — IDP Management Module
# User Manual

**George Municipality**
**Version 1.0 — March 2026**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [IDP Cycle Management](#3-idp-cycle-management)
4. [Process Plan](#4-process-plan)
5. [Strategic Objectives](#5-strategic-objectives)
6. [Projects](#6-projects)
7. [Public Participation](#7-public-participation)
8. [Draft IDP Compilation](#8-draft-idp-compilation)
9. [Approval Workflows](#9-approval-workflows)
10. [Final IDP](#10-final-idp)
11. [GoMuni Submission](#11-gomuni-submission)
12. [Status Reference](#12-status-reference)
13. [Glossary](#13-glossary)

---

## 1. Getting Started

### 1.1 Accessing the System

Open the Platinum IDP module in your web browser. The system loads with a **sidebar** on the left for navigation and a **main content area** on the right.

### 1.2 Navigation

The sidebar is organised into four groups:

| Group | Pages |
|---|---|
| **Planning** | Dashboard, IDP Cycles, Process Plan |
| **Content** | Strategic Objectives, Projects |
| **Participation** | Public Participation |
| **Documents** | Draft IDP, Final IDP |
| **Governance** | Approvals, GoMuni Submissions |

Click any link in the sidebar to navigate to that page. The active page is highlighted.

### 1.3 Active Cycle

Most pages operate within the context of the **Active IDP Cycle**. You must set a cycle as active before working with phases, projects, comments, or documents. See Section 3 for how to set the active cycle.

---

## 2. Dashboard

The Dashboard provides a read-only overview of the current IDP cycle's progress.

### What You See

- **KPI Tiles** — Key metrics at a glance:
  - Total Projects
  - Capital Projects count
  - Operational Projects count
  - Strategic Objectives count
  - Public Comments count
  - Comments pending response
  - Milestones completed vs overdue
  - Total budget
  - Document versions generated
  - GoMuni submissions logged

- **IDP Lifecycle Status** — Shows the current state of the active cycle (e.g. Draft, In Review, Adopted).

- **Process Plan Progress** — Visual pipeline of the five IDP phases with completion percentages.

- **Public Participation Summary** — Breakdown of comments by status (Received, Under Review, Responded, Closed, Escalated).

- **Recent Activity** — Audit trail of the most recent actions taken in the system.

- **Quick Actions** — Shortcut links to:
  - Generate Draft IDP
  - Review Approvals
  - GoMuni Submission

### Actions Available

The Dashboard is read-only. Click the quick action links to navigate to the relevant workflow page.

---

## 3. IDP Cycle Management

An IDP Cycle represents a five-year Integrated Development Plan period. This is the foundation — all other data (phases, objectives, projects, comments, documents) belongs to a cycle.

### 3.1 Creating a New Cycle

1. Click **"New Cycle"** on the IDP Cycles page.
2. Fill in the required fields:

| Field | Description | Example |
|---|---|---|
| **Cycle Name** | Descriptive name for the IDP period | 2024/2025 – 2028/2029 IDP Cycle |
| **Municipality** | Municipality name | George Municipality |
| **Start Year** | First financial year | 2024 |
| **End Year** | Final financial year | 2029 |
| **Description** | Purpose and alignment summary | Five-year IDP aligned to NDP Vision 2030 |

3. Click **"Save Cycle"**.

The new cycle is created with status **Draft** and revision number **1**.

### 3.2 Setting the Active Cycle

Click the **radio button icon** next to a cycle in the table to set it as active. The active cycle is highlighted and all other pages will work within this cycle's context.

### 3.3 Editing a Cycle

Click the **edit icon** next to a cycle (only available when the cycle is not locked). Update any fields and click **"Save Cycle"**.

### 3.4 Cycle Status Workflow

The cycle progresses through these statuses:

```
Draft → In Review → Approved for Distribution → Adopted → Revised
```

| Action | Button | What Happens |
|---|---|---|
| Submit for Review | **Send icon** (visible when status is Draft) | Status changes to "In Review" |
| Start Revision | **Replay icon** (visible when status is Adopted) | Status changes to "Revised", revision number increases by 1, cycle unlocks for editing |

**Important:** When a cycle reaches **Adopted** status, it becomes **locked**. No edits are permitted until a revision is started. The lock is shown by a padlock icon.

### 3.5 Cycle Data Table Columns

| Column | Description |
|---|---|
| Name | Cycle name |
| Period | Start year – End year |
| Status | Current lifecycle status (with colour badge) |
| Rev | Revision number |
| Municipality | Municipality name |
| Locked | Padlock icon if locked |
| Actions | Edit, Submit for Review, Start Revision, Set Active |

---

## 4. Process Plan

The Process Plan tracks the five mandatory IDP preparation phases and their milestones per MSCOA specification.

### 4.1 The Five Phases

| Phase | Order | Description |
|---|---|---|
| **Analysis** | 1 | Situational analysis and community needs assessment |
| **Strategy** | 2 | Vision, mission, and strategic framework development |
| **Projects** | 3 | Project identification, prioritisation, and costing |
| **Integration** | 4 | Sector plan integration and alignment |
| **Approval** | 5 | Governance review and council adoption |

Click a **phase step** at the top of the page to view its details and milestones.

### 4.2 Phase Details

Each phase displays:
- **Name** and **Owner** (responsible person/department)
- **Start Date** and **End Date**
- **Progress** percentage (auto-calculated from milestones)
- **Status** (Not Started / In Progress / Completed)

### 4.3 Adding a Milestone

1. Select a phase by clicking its step.
2. Click **"Add"** to open the milestone form.
3. Fill in:

| Field | Description | Required |
|---|---|---|
| **Title** | Short name for the milestone | Yes |
| **Assigned To** | Person responsible | Yes |
| **Due Date** | Deadline for completion | Yes |
| **Mandatory** | Check if this milestone must be completed before the phase can progress | No (default unchecked) |
| **Evidence URL** | Link to supporting evidence document | No (but required for mandatory milestones before completion) |

4. Click **"Save"**.

### 4.4 Updating Milestone Status

Use the **status dropdown** next to each milestone to change its status:

| Status | Meaning |
|---|---|
| **Not Started** | Work has not begun |
| **In Progress** | Work is underway |
| **Completed** | Work is finished (progress auto-set to 100%) |

**Validation Rules:**
- A **mandatory** milestone cannot be marked "Completed" without an **Evidence URL** attached.
- A phase cannot progress to the next step until all **mandatory** milestones are completed with evidence.
- Milestones past their due date that are not completed are flagged as **overdue** (shown in red).

---

## 5. Strategic Objectives

Strategic objectives define the high-level development goals aligned with the National Development Plan (NDP) and Provincial Growth and Development Strategy (PGDS).

### 5.1 Adding an Objective

1. Click **"Add Objective"**.
2. Fill in:

| Field | Description | Example |
|---|---|---|
| **Code** | Unique short code | SO1 |
| **Description** | Full objective description | Sustainable and inclusive economic growth and job creation |
| **NDP Alignment** | Link to NDP chapter/goal | NDP Chapter 3: Economy and Employment |
| **Provincial Alignment** | Link to provincial strategy | PGDS Priority 1: Economic Growth |
| **Alignment Tags** | Comma-separated keywords | economy, employment, growth |

3. Click **"Save"**.

### 5.2 Editing an Objective

Click the **edit icon** on any objective card. Update the fields and click **"Update"**.

### 5.3 Linked Projects

Each objective card displays chips showing the projects linked to it. Projects are linked via the Projects page (Section 6).

---

## 6. Projects

Projects are the delivery vehicles for achieving strategic objectives. Each project is classified as **Capital** or **Operational** and must have Key Performance Indicators (KPIs) attached.

### 6.1 KPI Summary Strip

At the top of the Projects page, four tiles display:
- **Total Projects** count
- **Capital** projects count
- **Operational** projects count
- **Total Budget** (sum of all project budgets)

### 6.2 Adding a Project

1. Click **"Add Project"**.
2. Fill in:

| Field | Description | Example |
|---|---|---|
| **Name** | Project title | George Bulk Water Supply Upgrade |
| **Classification** | Capital or Operational | Capital |
| **Department** | Responsible department | Infrastructure & Engineering |
| **Ward** | Ward number | Ward 12 |
| **Region** | Geographic region | George CBD |
| **Priority** | High / Medium / Low | High |
| **Priority Ranking** | Numeric ranking (1 = highest) | 1 |
| **Budget Amount** | Total project budget (Rands) | 15000000 |
| **Funding Source** | Primary funding source | MIG (Municipal Infrastructure Grant) |
| **Funding Source Summary** | Detailed funding breakdown | MIG R10m, Own Revenue R5m |
| **Start Date** | Project start date | 2024-07-01 |
| **End Date** | Project completion date | 2027-06-30 |
| **Objective** | Linked strategic objective (dropdown) | SO1: Economic Growth |
| **Description** | Detailed project scope | Upgrade bulk water pipeline from Garden Route Dam |

3. Click **"Save Project"**.

### 6.3 Editing and Deleting Projects

- Click the **edit icon** to modify a project.
- Click the **delete icon** to remove a project.

### 6.4 Managing KPIs (Key Performance Indicators)

Each project must have at least one KPI. **A Draft IDP cannot be generated if any project is missing KPIs.**

1. Click the **bar chart icon** next to a project to open its KPI panel.
2. Click **"Add KPI"**.
3. Fill in:

| Field | Description | Example |
|---|---|---|
| **Indicator Name** | What is being measured | Number of households with access to clean water |
| **Baseline** | Current/starting value | 12,500 households |
| **Target Y1** | Year 1 target | 14,000 |
| **Target Y2** | Year 2 target | 16,000 |
| **Target Y3** | Year 3 target | 18,000 |
| **Target Y4** | Year 4 target | 20,000 |
| **Target Y5** | Year 5 target | 22,000 |
| **Responsible Official** | Person accountable | Mr J. van der Merwe, Director: Infrastructure |
| **Evidence Link** | URL to supporting evidence | https://docs.george.gov.za/evidence/water-kpi |

4. Click **"Save KPI"**.

### 6.5 KPI Validation

Before a Draft IDP can be generated, the system checks that **every project** has at least one KPI. If any project is missing KPIs, a validation warning is displayed listing the affected projects.

---

## 7. Public Participation

The Public Participation page captures community feedback from various channels and tracks municipal responses.

### 7.1 Capturing a Comment

1. Click **"Capture Comment"**.
2. Fill in:

| Field | Description | Example |
|---|---|---|
| **Source Channel** | How the comment was received | Public Meeting |
| **Category** | Topic category | Service Delivery |
| **Ward** | Ward where comment originated | Ward 5 |
| **Region** | Geographic area | Pacaltsdorp |
| **Submitter Name** | Name of the person | Mrs A. Pieterse |
| **Submission Date** | Date the comment was received | 2025-02-15 |
| **Comment Text** | Full text of the comment | Request for additional streetlights on Main Road between 3rd and 7th Avenue |

3. Click **"Submit Comment"**.

The comment is saved with status **Received**.

**Source Channel Options:**
- Public Meeting
- Website
- Ward Committee
- Email
- Walk-in
- Telephone

### 7.2 Comment Status Workflow

Comments progress through the following statuses:

```
Received → Under Review → Responded → Closed
                                    ↘ Escalated
```

Use the **status dropdown** on each comment card to change its status:

| Status | Meaning |
|---|---|
| **Received** | Comment has been captured but not yet reviewed |
| **Under Review** | Comment is being assessed by the relevant department |
| **Responded** | An official response has been provided (set automatically when a response is submitted) |
| **Closed** | Matter is resolved and closed |
| **Escalated** | Matter requires attention from senior management or council |

### 7.3 Filtering Comments

Click the **status filter chips** at the top of the page to filter comments by status. Click **"All"** to show all comments.

### 7.4 Responding to a Comment

1. Click the **"Respond"** button on a comment card.
2. Fill in:

| Field | Description | Example |
|---|---|---|
| **Response Text** | Official municipal response | Streetlight installation has been included in the 2025/26 capital programme. Expected completion: December 2025. |
| **Responsible Official** | Person providing the response | Ms B. Jacobs, Director: Electrical Services |

3. Click **"Submit Response"**.

The comment status automatically changes to **Responded**.

---

## 8. Draft IDP Compilation

The Draft IDP page compiles all captured data into a structured document for internal review and distribution.

### 8.1 Generating a Draft IDP

1. Navigate to **Draft IDP** in the sidebar.
2. Click **"Generate Draft IDP"**.

The system automatically compiles:
- Cycle information (municipality, period, description)
- Process plan (all phases and milestones)
- Strategic objectives
- Projects with KPI tables
- Public participation summary (comment register)

**Validation:** The system will block generation if any project is missing KPIs. You will see a warning message. Go to the Projects page to add the missing KPIs first.

### 8.2 Viewing Draft Versions

Each generated draft appears as a version card showing:
- **Version number**
- **Status** (Draft / In Review / Approved for Distribution / Locked)
- **Date created**
- **Whether it is locked** (padlock icon)

Click a version card to view its content sections.

### 8.3 Submitting for Review

Click **"Submit for Review"** on a Draft version to start the approval workflow. This creates a sequential approval chain (see Section 9). The document status changes to **In Review**.

### 8.4 Locking a Document

Click **"Lock Document"** to make a version permanently read-only. This is typically done automatically when all approvals are completed, but can be done manually if needed.

---

## 9. Approval Workflows

The Approvals page manages the sequential approval routing for both Draft and Final IDP documents.

### 9.1 Understanding the Approval Chain

When a document is submitted for review, three sequential approval tasks are created:

| Sequence | Role | Responsibility |
|---|---|---|
| 1 | **IDP Manager** | Technical review of content completeness |
| 2 | **Director** | Strategic alignment and policy review |
| 3 | **Municipal Manager** | Final governance sign-off |

Each task must be completed **in order** — a task only becomes actionable once all preceding tasks are approved.

### 9.2 Viewing Active Workflows

The page shows:
- **Document chips** at the top — click a chip to switch between different documents awaiting approval.
- **Workflow steps** — each step shows the assigned role, status, and any comments.

### 9.3 Approving a Task

1. Select the document chip at the top.
2. Find the task that is **Pending** and ready for your action (all prior tasks must be "Approved").
3. Enter any **comments** in the text field.
4. Click **"Approve"**.

When all three tasks are approved:
- **Draft IDP** → Status becomes "Approved for Distribution" and the document is locked.
- **Final IDP** → Status becomes "Adopted", the document is locked, and the parent IDP Cycle status changes to "Adopted".

### 9.4 Rejecting a Task

1. Enter your **reason for rejection** in the comments field.
2. Click **"Reject"**.

The document status reverts to **Draft** and the document is unlocked for further editing.

### 9.5 Approval Task Statuses

| Status | Meaning |
|---|---|
| **Pending** | Waiting for action |
| **Approved** | This step has been approved |
| **Rejected** | This step was rejected — document returned to Draft |

---

## 10. Final IDP

The Final IDP page creates the adopted version of the IDP by consolidating the approved Draft with council resolution metadata.

### 10.1 Generating a Final IDP

1. Navigate to **Final IDP** in the sidebar.
2. Fill in the generation form:

| Field | Description | Example |
|---|---|---|
| **Approved Draft** | Select from the dropdown (only drafts with status "Approved for Distribution" appear) | Draft v1 |
| **Resolution Number** | Council resolution reference number | RES/2025/142 |
| **Resolution Date** | Date the council resolution was passed | 2025-05-29 |
| **Council Meeting Reference** | Council meeting identifier | Special Council Meeting 2025-05-29 |

3. Click **"Generate Final IDP"**.

The system creates a Final IDP version with status **Generated**, inheriting all content from the approved draft plus the resolution metadata.

### 10.2 Submitting for Adoption

Click **"Submit for Adoption"** to start the final approval workflow. This follows the same sequential approval chain as the Draft (Section 9).

When all approvals are completed:
- The Final IDP status becomes **Adopted** and is locked.
- The parent IDP Cycle status automatically changes to **Adopted** and is locked.

### 10.3 Locking a Final Version

Click **"Lock"** to manually lock a final version if needed.

---

## 11. GoMuni Submission

The GoMuni page manages the submission of the adopted IDP pack to the provincial/national GoMuni portal for compliance reporting.

### 11.1 Pre-Submission Checklist

Before creating a submission, the system validates:

| Requirement | Description |
|---|---|
| **Adopted IDP** | An adopted Final IDP document must exist |
| **Council Resolution** | Resolution document file name must be provided |
| **Council Minutes** | Minutes document file name must be provided |
| **Cycle Status** | The IDP Cycle must be in "Adopted" status |

Each item shows a green tick (met) or red cross (not met). **All items must be met before submission is permitted.**

### 11.2 Creating a Submission

1. Fill in the submission form:

| Field | Description | Example |
|---|---|---|
| **Adopted IDP Document** | File name of the adopted IDP | George_IDP_2024-2029_Final_v1.pdf |
| **Council Resolution** | File name of the resolution document | Resolution_RES2025142.pdf |
| **Council Minutes** | File name of the council minutes | Minutes_Special_Council_20250529.pdf |
| **Submission Type** | Type of submission | Initial / Revision / Amended |

2. Click **"Submit to GoMuni"**.

The submission is logged with the current date and a status of **Submitted**.

### 11.3 Recording the Reference Number

After submitting to the GoMuni portal externally, record the reference number:

1. Find the submission in the history list.
2. Enter the **reference number** received from GoMuni.
3. Click **"Save Ref"**.

### 11.4 Submission History

All submissions are displayed in a history list showing:
- Submission type
- Date submitted
- Validation status
- Reference number (if captured)
- File names

---

## 12. Status Reference

### IDP Cycle Statuses

| Status | Meaning | Editable? |
|---|---|---|
| **Draft** | Cycle is being prepared | Yes |
| **In Review** | Cycle submitted for internal review | Yes |
| **Approved for Distribution** | Cycle approved for public distribution | Yes |
| **Adopted** | Council has adopted the IDP | No (locked) |
| **Revised** | A new revision has been initiated | Yes |

### Milestone Statuses

| Status | Meaning |
|---|---|
| **Not Started** | Work has not begun |
| **In Progress** | Work is underway |
| **Completed** | Work is finished and evidence attached |

### Comment Statuses

| Status | Meaning |
|---|---|
| **Received** | Comment captured, awaiting review |
| **Under Review** | Being assessed by the relevant department |
| **Responded** | Official response has been provided |
| **Closed** | Matter resolved |
| **Escalated** | Requires senior management attention |

### Document Statuses

| Status | Applies To | Meaning |
|---|---|---|
| **Draft** | Draft IDP | Document is being compiled |
| **In Review** | Draft IDP | Submitted for approval |
| **Approved for Distribution** | Draft IDP | All approvals completed, locked |
| **Generated** | Final IDP | Final version created |
| **Adopted** | Final IDP | Council has adopted, locked |

### Approval Task Statuses

| Status | Meaning |
|---|---|
| **Pending** | Awaiting action |
| **Approved** | Step completed successfully |
| **Rejected** | Step rejected, document returned to Draft |

---

## 13. Glossary

| Term | Definition |
|---|---|
| **IDP** | Integrated Development Plan — a five-year strategic plan required for all South African municipalities |
| **MSCOA** | Municipal Standard Chart of Accounts — national framework for municipal financial and non-financial reporting |
| **NDP** | National Development Plan — South Africa's long-term development vision (Vision 2030) |
| **PGDS** | Provincial Growth and Development Strategy — provincial-level development framework |
| **KPI** | Key Performance Indicator — measurable target for tracking project delivery |
| **GoMuni** | Government portal for municipalities to submit IDP and related documents for compliance |
| **MIG** | Municipal Infrastructure Grant — national government funding for infrastructure projects |
| **Capital Project** | A project involving the construction or acquisition of physical infrastructure assets |
| **Operational Project** | A project involving recurring service delivery or operational improvements |
| **Ward** | A geographic subdivision of a municipality for electoral and service delivery purposes |
| **Council Resolution** | A formal decision recorded by the municipal council |

---

## End-to-End Workflow Summary

The complete IDP lifecycle follows this sequence:

```
1. Create IDP Cycle (Section 3)
        ↓
2. Set up Process Plan phases & milestones (Section 4)
        ↓
3. Define Strategic Objectives (Section 5)
        ↓
4. Register Projects with KPIs (Section 6)
        ↓
5. Capture Public Participation comments & responses (Section 7)
        ↓
6. Generate Draft IDP (Section 8)
        ↓
7. Submit Draft for Approval (Section 9)
        ↓
8. Generate Final IDP with resolution metadata (Section 10)
        ↓
9. Submit Final for Adoption (Section 9)
        ↓
10. Submit to GoMuni portal (Section 11)
```

---

*Platinum ERP — IDP Management Module*
*George Municipality*
*Document Version 1.0*
