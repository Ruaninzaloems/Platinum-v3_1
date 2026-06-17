/**
 * Approval Workflow Service Tests
 * Covers ALL locked business rules from .agents/skills/approval-workflow-rules/SKILL.md
 *
 * Strategy: mock the database query function so no real DB connection is needed.
 * Each test replaces the mock with the minimal data needed to exercise the rule.
 *
 * DB call sequence for actionStep (APPROVE, unassigned step, no next step):
 *  1. SELECT workflow_steps + join (step fetch)
 *  2. SELECT delegations (delegation check)
 *  3. [NO role check — assigned_role is null]
 *  4. UPDATE workflow_steps SET status = 'APPROVED'
 *  5. SELECT next workflow_step (WAITING)
 *  6. UPDATE workflow_instances SET status = 'APPROVED'
 *  7. sendNotification → mocked, NO DB call
 *  8. SELECT workflow_steps + join (final fetch)  ← returns updated row
 *
 * DB call sequence for actionStep (APPROVE, assigned to user, no next step):
 *  Same as above. isInLevelList = true → no extra role query.
 */

jest.mock('../config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../services/notification.service', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
  logNotification: jest.fn().mockResolvedValue(undefined),
  getUserNotifications: jest.fn().mockResolvedValue([]),
  markNotificationRead: jest.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: jest.fn().mockResolvedValue(undefined),
}));

const db = require('../config/database');
const { actionStep, autoAdvanceInitiatorSteps } = require('../services/workflow.service');
const { handleApproval, handleRejection, handleReturn } = require('../services/transaction-approval.service');

// ---------------------------------------------------------------------------
// Helper to create a workflow step row
// ---------------------------------------------------------------------------
function makeStep(overrides = {}) {
  return {
    id: 1,
    instance_id: 10,
    step_number: 1,
    status: 'PENDING',
    assigned_users: [],
    assigned_to: null,
    assigned_role: null,
    entity_type: 'CLAIM',
    entity_id: 100,
    initiated_by: 99,
    instance_status: 'PENDING',
    definition_id: 5,
    sla_deadline: null,
    escalated: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Rule: No workflow definition → any authenticated user can approve
// ---------------------------------------------------------------------------
describe('No workflow definition → any user can approve', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  test('handleApproval: no workflow config → direct approval succeeds', async () => {
    db.query
      // 1. entity fetch
      .mockResolvedValueOnce({ rows: [{ id: 100, status: 'PENDING', employee_id: 5, created_by: 88 }] })
      // 2. findPendingWorkflowStep → none
      .mockResolvedValueOnce({ rows: [] })
      // 3. resolveWorkflowDefinition (no definition)
      .mockResolvedValueOnce({ rows: [] })
      // 4. UPDATE entity status → APPROVED
      .mockResolvedValueOnce({ rows: [] })
      // 5. writeHistory / audit
      .mockResolvedValueOnce({ rows: [] });

    const result = await handleApproval('CLAIM', 100, 1, [], 'Approved');
    expect(result.success).toBe(true);
    expect(result.finalApproval).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rule: self-approval blocked
// ---------------------------------------------------------------------------
describe('Self-approval blocked', () => {
  beforeEach(() => db.query.mockReset());

  test('handleApproval returns 403 when approver is creator', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 100, status: 'PENDING', employee_id: 5, created_by: 42 }],
    });

    const result = await handleApproval('CLAIM', 100, 42, [], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/cannot approve your own/i);
  });

  test('handleRejection: different user can reject (no-workflow path)', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 100, status: 'PENDING', employee_id: 5, created_by: 42 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await handleRejection('CLAIM', 100, 99, [], 'Not valid');
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rule: handleRejection requires comments
// ---------------------------------------------------------------------------
describe('handleRejection requires comments', () => {
  test('returns 400 when comments are empty', async () => {
    const result = await handleRejection('CLAIM', 100, 99, [], '');
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/reason|comment/i);
  });

  test('returns 400 when comments are whitespace only', async () => {
    const result = await handleRejection('CLAIM', 100, 99, [], '   ');
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Rule: handleReturn requires comments
// ---------------------------------------------------------------------------
describe('handleReturn requires comments', () => {
  test('returns 400 when comments are empty', async () => {
    const result = await handleReturn('CLAIM', 100, 99, [], '');
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Rule: entity must be PENDING to approve/reject/return
// ---------------------------------------------------------------------------
describe('Entity must be PENDING to action', () => {
  beforeEach(() => db.query.mockReset());

  test('handleApproval on APPROVED entity returns 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 100, status: 'APPROVED', employee_id: 5, created_by: 42 }] });
    const result = await handleApproval('CLAIM', 100, 99, [], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });

  test('handleApproval on non-existent entity returns 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await handleApproval('CLAIM', 999, 99, [], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Rule: actionStep — unassigned step allows any user
// DB call sequence (APPROVE, no next step):
//   1. step fetch  2. delegation check  [no role check]
//   3. UPDATE step  4. next step check  5. UPDATE instance APPROVED
//   [sendNotification → mocked]  6. final fetch
// ---------------------------------------------------------------------------
describe('actionStep — unassigned step', () => {
  beforeEach(() => db.query.mockReset());

  test('user can action a step with no assignment restrictions', async () => {
    const step = makeStep({ assigned_users: [], assigned_to: null, assigned_role: null });
    const updatedStep = { ...step, status: 'APPROVED', instance_status: 'APPROVED' };

    db.query
      .mockResolvedValueOnce({ rows: [step] })       // 1: step fetch
      .mockResolvedValueOnce({ rows: [] })             // 2: delegation check
      // [no role check — assigned_role is null]
      .mockResolvedValueOnce({ rows: [] })             // 3: UPDATE step
      .mockResolvedValueOnce({ rows: [] })             // 4: next step check → none
      .mockResolvedValueOnce({ rows: [] })             // 5: UPDATE instance APPROVED
      // [sendNotification(99) → mocked, no DB call]
      .mockResolvedValueOnce({ rows: [updatedStep] }); // 6: final fetch

    const result = await actionStep(1, 'APPROVE', 77, null, []);
    expect(result).toBeDefined();
    expect(result.status).toBe('APPROVED');
    expect(result.instance_status).toBe('APPROVED');
  });
});

// ---------------------------------------------------------------------------
// Rule: actionStep — assigned step blocks unauthorized user
// ---------------------------------------------------------------------------
describe('actionStep — assigned step', () => {
  beforeEach(() => db.query.mockReset());

  test('unauthorized user on assigned step throws error', async () => {
    const step = makeStep({
      assigned_users: [10],
      assigned_to: null,
      assigned_role: null,
    });

    db.query
      .mockResolvedValueOnce({ rows: [step] }) // 1: step fetch
      .mockResolvedValueOnce({ rows: [] })     // 2: delegation check
      // [no role check — assigned_role is null]
      // isAuthorized = false, hasAssignment = true → throws
    ;

    await expect(actionStep(1, 'APPROVE', 99, null, [])).rejects.toThrow(/not assigned/i);
  });

  test('assigned user can action the step (same DB sequence as unassigned)', async () => {
    const step = makeStep({ assigned_users: [77], assigned_role: null });
    const updatedStep = { ...step, status: 'APPROVED', instance_status: 'APPROVED' };

    db.query
      .mockResolvedValueOnce({ rows: [step] })       // 1: step fetch
      .mockResolvedValueOnce({ rows: [] })             // 2: delegation check
      // [no role check — assigned_role is null]
      .mockResolvedValueOnce({ rows: [] })             // 3: UPDATE step
      .mockResolvedValueOnce({ rows: [] })             // 4: next step check → none
      .mockResolvedValueOnce({ rows: [] })             // 5: UPDATE instance APPROVED
      // [sendNotification → mocked]
      .mockResolvedValueOnce({ rows: [updatedStep] }); // 6: final fetch

    const result = await actionStep(1, 'APPROVE', 77, null, []);
    expect(result).toBeDefined();
    expect(result.status).toBe('APPROVED');
  });

  test('user assigned via role can action the step', async () => {
    const step = makeStep({
      assigned_users: [],
      assigned_to: null,
      assigned_role: 'hr_manager',
    });
    const updatedStep = { ...step, status: 'APPROVED', instance_status: 'APPROVED' };

    db.query
      .mockResolvedValueOnce({ rows: [step] })       // 1: step fetch
      .mockResolvedValueOnce({ rows: [] })             // 2: delegation check
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] })    // 3: role check → matches
      .mockResolvedValueOnce({ rows: [] })             // 4: UPDATE step
      .mockResolvedValueOnce({ rows: [] })             // 5: next step check → none
      .mockResolvedValueOnce({ rows: [] })             // 6: UPDATE instance APPROVED
      .mockResolvedValueOnce({ rows: [updatedStep] }); // 7: final fetch

    const result = await actionStep(1, 'APPROVE', 99, null, ['hr_manager']);
    expect(result).toBeDefined();
    expect(result.status).toBe('APPROVED');
  });
});

// ---------------------------------------------------------------------------
// Rule: actionStep — step must be PENDING
// ---------------------------------------------------------------------------
describe('actionStep — step status check', () => {
  beforeEach(() => db.query.mockReset());

  test('throws when step is not PENDING', async () => {
    const step = makeStep({ status: 'APPROVED' });
    db.query.mockResolvedValueOnce({ rows: [step] });
    await expect(actionStep(1, 'APPROVE', 77, null, [])).rejects.toThrow(/not pending/i);
  });

  test('throws when step not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(actionStep(999, 'APPROVE', 77, null, [])).rejects.toThrow(/not found/i);
  });
});

// ---------------------------------------------------------------------------
// Rule: invalid action is rejected
// ---------------------------------------------------------------------------
describe('actionStep — invalid action', () => {
  beforeEach(() => db.query.mockReset());

  test('throws for unknown action', async () => {
    const step = makeStep({ assigned_users: [] });
    db.query
      .mockResolvedValueOnce({ rows: [step] }) // 1: step fetch
      .mockResolvedValueOnce({ rows: [] })     // 2: delegation check
    ; // no role check, then authorization passes, then action check fails

    await expect(actionStep(1, 'INVALIDACTION', 77, null, [])).rejects.toThrow(/invalid action/i);
  });
});

// ---------------------------------------------------------------------------
// Rule: autoAdvanceInitiatorSteps — cascades through consecutive capturer steps
// DB call sequence (initiator 42, step1 assigned to 42, step2 assigned to 99):
//  Iter 1:
//   1. SELECT pending step → step1 (assigned to 42) → isInitiatorAssigned = true
//   2. UPDATE workflow_steps step1 → APPROVED
//   3. SELECT next step (step2, status WAITING)
//   4. UPDATE workflow_steps step2 → PENDING
//   5. UPDATE workflow_instances current_step = 2, status = IN_PROGRESS
//   [notifyLevelUsers([99]) → sendNotification → mocked]
//  Iter 2:
//   6. SELECT pending step → step2 (assigned to 99) → isInitiatorAssigned = false → BREAK
//  Post-loop (autoApprovedSteps.length > 0):
//   7. SELECT remaining pending steps → step2
//   [notifyLevelUsers([99]) → sendNotification → mocked]
//   8. SELECT workflow_instances (status, current_step, total_steps)
// ---------------------------------------------------------------------------
describe('autoAdvanceInitiatorSteps', () => {
  beforeEach(() => db.query.mockReset());

  test('stops cascade when next step is not assigned to initiator', async () => {
    const step1 = makeStep({ id: 1, step_number: 1, status: 'PENDING', assigned_users: [42], entity_type: 'WAGE', entity_id: 200, initiated_by: 42, instance_status: 'PENDING' });
    const step2 = makeStep({ id: 2, step_number: 2, status: 'WAITING', assigned_users: [99], entity_type: 'WAGE', entity_id: 200, initiated_by: 42, instance_status: 'IN_PROGRESS' });

    db.query
      .mockResolvedValueOnce({ rows: [step1] }) // 1: iter1 — pending step → step1
      .mockResolvedValueOnce({ rows: [] })       // 2: UPDATE step1 APPROVED
      .mockResolvedValueOnce({ rows: [step2] }) // 3: next step (step2 WAITING)
      .mockResolvedValueOnce({ rows: [] })       // 4: UPDATE step2 PENDING
      .mockResolvedValueOnce({ rows: [] })       // 5: UPDATE instance IN_PROGRESS
      // [notifyLevelUsers([99]) → mocked]
      .mockResolvedValueOnce({ rows: [step2] }) // 6: iter2 — pending step → step2 (not assigned to 42 → BREAK)
      // post-loop:
      .mockResolvedValueOnce({ rows: [step2] }) // 7: remaining pending check
      // [notifyLevelUsers([99]) → mocked]
      .mockResolvedValueOnce({ rows: [{ status: 'IN_PROGRESS', current_step: 2, total_steps: '2' }] }); // 8: instance result

    const result = await autoAdvanceInitiatorSteps(10, 42);
    expect(result).not.toBeNull();
    expect(result.autoApprovedSteps).toHaveLength(1);
    expect(result.autoApprovedSteps[0].stepNumber).toBe(1);
  });

  test('returns null when capturer is not in any pending step (no auto-advance)', async () => {
    // Iter 1: pending step assigned to user 99, not capturer 42 → BREAK immediately
    const step2 = makeStep({ id: 2, step_number: 1, status: 'PENDING', assigned_users: [99] });
    db.query
      .mockResolvedValueOnce({ rows: [step2] }); // pending step not assigned to 42 → BREAK

    const result = await autoAdvanceInitiatorSteps(10, 42);
    // autoApprovedSteps is empty → returns null
    expect(result).toBeNull();
  });

  test('returns null when there are no pending steps at all', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] }); // no pending step → BREAK immediately

    const result = await autoAdvanceInitiatorSteps(10, 42);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ENTITY_CONFIG — unknown entity type throws
// ---------------------------------------------------------------------------
describe('ENTITY_CONFIG coverage', () => {
  test('handleApproval for unknown entity type throws', async () => {
    await expect(handleApproval('UNKNOWN_TYPE', 1, 99, [], null)).rejects.toThrow(/Unknown entity type/i);
  });
});
