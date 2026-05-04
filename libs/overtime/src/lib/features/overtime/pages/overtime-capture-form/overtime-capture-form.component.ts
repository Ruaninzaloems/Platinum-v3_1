import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

import { LookupService } from '../../../../core/services/lookup.service';
import { OvertimeTransactionsService } from '../../../../core/services/overtime-transactions.service';
import { WorkflowService } from '../../../../core/services/workflow.service';
import { UserContextService } from '../../../../core/services/user-context.service';
import {
  OvertimeTransactionDto,
  OvertimeTypeOption,
  WorkflowEventDto,
  WorkflowStatus
} from '../../../../core/models/overtime-workflow.model';
import { EmployeeLookup } from '../../../../core/models/position-approval.model';

@Component({
  selector: 'app-overtime-capture-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, DatePipe, DecimalPipe,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatTableModule, MatAutocompleteModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="page-content capture-page">
      <a routerLink="/overtime/capture" class="back-link">
        <mat-icon>arrow_back</mat-icon> Back to dashboard
      </a>

      <header class="page-header">
        <div class="page-header-text">
          <h1 class="page-title">{{ pageTitle() }}</h1>
          <p class="page-subtitle">{{ pageSubtitle() }}</p>
        </div>
        @if (editId() && currentStatusLabel()) {
          <span class="status-badge" [ngClass]="statusClass(currentStatus())">
            {{ currentStatusLabel() }}
          </span>
        }
      </header>

      <!-- Employee picker / employee card ------------------------------- -->
      <section class="form-card">
        <div class="form-section">
          <div class="form-section-title">
            <mat-icon>person</mat-icon><span>Employee</span>
          </div>

          @if (!editId()) {
            <div class="form-group" style="max-width: 520px;">
              <label>EMPLOYEE NUMBER <span class="required">*</span></label>
              <input class="form-control"
                     type="text"
                     [(ngModel)]="searchTerm"
                     (ngModelChange)="onSearch($event)"
                     [matAutocomplete]="auto"
                     placeholder="Search by employee number or name">
            </div>
            <mat-autocomplete #auto="matAutocomplete"
                              panelClass="picker-panel"
                              (optionSelected)="onEmployeePicked($event.option.value)">
              @for (e of suggestions(); track e.id) {
                <mat-option [value]="e">
                  <span class="opt-line">{{ e.employeeNumber }} - {{ e.fullName }}</span>
                </mat-option>
              }
            </mat-autocomplete>
          }

          @if (employee()) {
            <div class="emp-card">
              <div class="emp-line">
                <span class="emp-label">Employee</span>
                <span class="emp-val">{{ employee()!.fullName }}</span>
                <span class="emp-meta">#{{ employee()!.employeeNumber }}</span>
              </div>
              @if (employee()!.empCode) {
                <div class="emp-line">
                  <span class="emp-label">Emp Code</span>
                  <span class="emp-val">{{ employee()!.empCode }}</span>
                </div>
              }
              @if (employee()!.idNo) {
                <div class="emp-line">
                  <span class="emp-label">ID Number</span>
                  <span class="emp-val">{{ employee()!.idNo }}</span>
                </div>
              }
              <div class="emp-line">
                <span class="emp-label">Department</span>
                <span class="emp-val">{{ employee()!.departmentName || '—' }}</span>
              </div>
              @if (employee()!.divisionName) {
                <div class="emp-line">
                  <span class="emp-label">Division</span>
                  <span class="emp-val">{{ employee()!.divisionName }}</span>
                </div>
              }
              <div class="emp-line">
                <span class="emp-label">Position</span>
                <span class="emp-val">{{ employee()!.positionDescription || '—' }}</span>
              </div>
            </div>
          }
        </div>
      </section>

      @if (employee()) {
        <!-- Overtime details ---------------------------------------------- -->
        <section class="form-card">
          <div class="form-section">
            <div class="form-section-title">
              <mat-icon>schedule</mat-icon><span>Overtime details</span>
            </div>

            <div class="form-grid cols-4">
              <div class="form-group">
                <label>Overtime date</label>
                <div class="date-field-wrap">
                  <input class="form-control date-field" readonly
                         [matDatepicker]="overtimePicker"
                         [(ngModel)]="overtimeDateValue"
                         placeholder="dd/mm/yyyy"
                         [disabled]="viewOnly()" />
                  <mat-datepicker-toggle class="date-toggle" [for]="overtimePicker"></mat-datepicker-toggle>
                  <mat-datepicker #overtimePicker></mat-datepicker>
                </div>
              </div>

              <div class="form-group">
                <label>Start time</label>
                <input class="form-control" type="text"
                       placeholder="HH:MM" maxlength="5"
                       [(ngModel)]="startTime" [disabled]="viewOnly()"
                       (ngModelChange)="recalcHours()">
              </div>

              <div class="form-group">
                <label>End time</label>
                <input class="form-control" type="text"
                       placeholder="HH:MM" maxlength="5"
                       [(ngModel)]="endTime" [disabled]="viewOnly()"
                       (ngModelChange)="recalcHours()">
              </div>

              <div class="form-group">
                <label>Hours</label>
                <input class="form-control" type="number" min="0" step="0.25"
                       [(ngModel)]="hours" [disabled]="viewOnly()"
                       (ngModelChange)="onHoursChange()">
              </div>

              <div class="form-group full-width">
                <label>Overtime type (salary head)</label>
                <select class="form-control"
                        [(ngModel)]="salaryHeadId" [disabled]="viewOnly()"
                        (ngModelChange)="onTypeChange()">
                  <option [ngValue]="null" disabled>Select an overtime type</option>
                  @for (t of overtimeTypes(); track t.salaryHeadId) {
                    <option [ngValue]="t.salaryHeadId">
                      {{ t.salaryHeadId }} — {{ t.salaryHeadTitle || t.salaryHeadName }}{{ t.irp5Code ? ' · IRP5 ' + t.irp5Code : '' }}
                    </option>
                  }
                </select>
                @if (loadingTypes()) {
                  <span class="form-hint">Loading types…</span>
                }
              </div>

              <div class="form-group full-width">
                <label>Reason</label>
                <textarea class="form-control" rows="2"
                          [(ngModel)]="reason" [disabled]="viewOnly()"
                          placeholder="Briefly justify the overtime"></textarea>
              </div>
            </div>

            <div class="amount-tile">
              <div class="amount-left">
                <div class="amt-label">Calculated amount</div>
                <div class="amt-value">R {{ amountPreview()?.amount ?? 0 | number:'1.2-2' }}</div>
                <div class="amt-formula" *ngIf="amountPreview()?.formula">
                  <span class="amt-formula-label">Formula:</span>
                  <code>{{ amountPreview()!.formula }}</code>
                </div>
                <div class="amt-formula amt-formula-values" *ngIf="formulaWithValues()">
                  <span class="amt-formula-label">Values:</span>
                  <code>{{ formulaWithValues() }}</code>
                </div>
              </div>
              <div class="amount-right">
                <div class="amt-meta">
                  <span class="amt-key">Hours this month</span>
                  <span class="amt-val">{{ hoursThisMonth() | number:'1.2-2' }}</span>
                </div>
                @if (previewing()) { <mat-spinner diameter="20"></mat-spinner> }
              </div>
            </div>

            @if (!viewOnly()) {
              <div class="upload-area" [class.has-file]="!!pendingFile()"
                   role="button"
                   [attr.aria-label]="pendingFile() ? 'Replace attached document' : 'Attach supporting PDF document'"
                   (click)="fileInput.click()" tabindex="0"
                   (keydown.enter)="fileInput.click(); $event.preventDefault()"
                   (keydown.space)="fileInput.click(); $event.preventDefault()">
                <mat-icon>{{ pendingFile() ? 'description' : 'cloud_upload' }}</mat-icon>
                <div>
                  <strong>{{ pendingFile() ? pendingFile()!.name : 'Attach supporting document' }}</strong>
                </div>
                <div class="upload-hint">PDF only · max 5 MB</div>
                @if (pendingFile()) {
                  <button class="btn" type="button" style="margin-top:8px;"
                          (click)="$event.stopPropagation(); pendingFile.set(null)">
                    <mat-icon>close</mat-icon><span>Clear</span>
                  </button>
                }
              </div>
              <input #fileInput type="file" accept="application/pdf" hidden
                     (change)="onFile($event)">
            }
          </div>

          <div class="form-actions">
            <a class="btn" routerLink="/overtime/capture">
              {{ viewOnly() ? 'Back' : 'Cancel' }}
            </a>
            <span class="spacer"></span>
            @if (!viewOnly()) {
              <button class="btn"
                      type="button"
                      [disabled]="!canSave() || saving()"
                      (click)="save(false)">
                <mat-icon>save</mat-icon>
                <span>{{ editId() ? 'Save changes' : 'Save as draft' }}</span>
              </button>
              @if (canSubmit()) {
                <button class="btn btn-primary"
                        type="button"
                        [disabled]="!canSave() || saving()"
                        (click)="save(true)">
                  <mat-icon>send</mat-icon>
                  <span>Save &amp; submit</span>
                </button>
              }
            }
          </div>
        </section>

        <!-- Approvals -------------------------------------------------- -->
        @if (editId() && loadedTx()) {
          <section class="form-card">
            <div class="form-section">
              <div class="form-section-title">
                <mat-icon>verified_user</mat-icon><span>Approvals</span>
              </div>

              <div class="approvals-grid">
                @for (f of approvalFields(); track f.label) {
                  <div class="approval-field">
                    <div class="approval-label">{{ f.label }}</div>
                    <div class="approval-value" [class.muted]="f.muted">
                      {{ f.display }}
                    </div>
                    @if (f.subDisplay) {
                      <div class="approval-sub">{{ f.subDisplay }}</div>
                    }
                    @if (f.timestamp) {
                      <div class="approval-timestamp">
                        {{ f.timestampPrefix }} {{ f.timestamp | date:'dd/MM/yyyy HH:mm' }}
                      </div>
                    }
                    @if (f.comment) {
                      <div class="approval-comment">“{{ f.comment }}”</div>
                    }
                  </div>
                }
              </div>
            </div>
          </section>
        }

        <!-- Workflow History Timeline ----------------------------------- -->
        @if (editId() && loadedTx() && workflowTimeline().length) {
          <section class="form-card">
            <div class="form-section">
              <div class="form-section-title">
                <mat-icon>timeline</mat-icon><span>Workflow History</span>
              </div>

              <div class="wf-timeline">
                @for (ev of workflowTimeline(); track ev.id; let last = $last) {
                  <div class="wf-event">
                    <div class="wf-spine">
                      <div class="wf-dot" [ngClass]="'wf-dot--' + ev.statusClass"></div>
                      @if (!last) { <div class="wf-line"></div> }
                    </div>
                    <div class="wf-body">
                      <div class="wf-action" [ngClass]="'wf-action--' + ev.statusClass">
                        {{ ev.actionLabel }}
                      </div>
                      <div class="wf-actor">{{ ev.actorName }}</div>
                      <div class="wf-time">{{ ev.actionedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                      @if (ev.comment) {
                        <div class="wf-comment">"{{ ev.comment }}"</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </section>
        }

        <!-- Recent transactions ---------------------------------------- -->
        <section class="form-card">
          <div class="form-section">
            <div class="form-section-title">
              <mat-icon>history</mat-icon><span>Recent transactions for this employee</span>
            </div>

            @if (loadingHistory()) {
              <div class="empty-state"><mat-spinner diameter="24"></mat-spinner></div>
            } @else if (!history().length) {
              <div class="empty-state">
                <mat-icon>history</mat-icon>
                <span class="empty-title">No prior transactions.</span>
              </div>
            } @else {
              <div class="data-grid" style="margin: 0;">
                <table mat-table [dataSource]="history()">
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let r">{{ r.overtimeDate | date:'dd/MM/yyyy' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="hours">
                    <th mat-header-cell *matHeaderCellDef class="num">Hrs</th>
                    <td mat-cell *matCellDef="let r" class="num">{{ r.hours | number:'1.2-2' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef class="num">Amount</th>
                    <td mat-cell *matCellDef="let r" class="num">R {{ r.amount | number:'1.2-2' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let r">{{ r.salaryHeadName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let r">
                      <span class="status-badge" [ngClass]="statusClass(r.status)">
                        {{ r.statusLabel }}
                      </span>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="histCols"></tr>
                  <tr mat-row *matRowDef="let r; columns: histCols;"></tr>
                </table>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .capture-page { display: flex; flex-direction: column; gap: 0; max-width: 1100px; }
    .date-field-wrap { position: relative; display: flex; align-items: center; }
    .date-field { padding-right: 34px !important; cursor: pointer; }
    .date-toggle { position: absolute; right: 1px; top: 50%; transform: translateY(-50%); }
    .date-toggle button { width: 30px !important; height: 30px !important; padding: 0 !important; }

    .back-link {
      font-size: 12px;
      color: #64748b;
      display: inline-flex; align-items: center; gap: 4px;
      text-decoration: none;
      margin-bottom: 4px;
    }
    .back-link:hover { color: #1e293b; }
    .back-link mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .opt-line { font-weight: 500; color: #1e293b; font-size: 13px; }

    /* Employee card ------------------------------------------------ */
    .emp-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 8px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .emp-line {
      display: flex; gap: 8px; align-items: baseline; font-size: 13px;
    }
    .emp-label {
      width: 110px; color: #64748b;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .emp-val { color: #1e293b; font-weight: 600; }
    .emp-meta { color: #94a3b8; font-size: 11px; }

    /* Calculated amount tile -------------------------------------- */
    .amount-tile {
      margin-top: 12px;
      background: linear-gradient(135deg, #eef6ff 0%, #f0f9ff 100%);
      border: 1px solid #bae6fd; border-radius: 10px; padding: 14px 18px;
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .amt-label {
      font-size: 11px; color: #0369a1;
      text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
    }
    .amt-value {
      font-size: 24px; font-weight: 700; color: #0c4a6e; margin-top: 4px;
    }
    .amt-formula { color: #0369a1; font-size: 11px; margin-top: 6px; display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
    .amt-formula code { background: white; padding: 2px 6px; border-radius: 4px; }
    .amt-formula-label { font-weight: 600; color: #075985; flex-shrink: 0; }
    .amt-formula-values { margin-top: 3px; }
    .amt-formula-values code { background: #e0f2fe; color: #0c4a6e; font-weight: 500; }
    .amt-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .amt-key {
      font-size: 10px; color: #0369a1;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .amt-val { font-size: 18px; font-weight: 700; color: #0c4a6e; }

    /* Upload area extras ------------------------------------------ */
    .upload-area { margin-top: 12px; }
    .upload-hint { font-size: 11px; margin-top: 4px; }

    /* Payroll classification subtitle ----------------------------- */
    .form-section-subtitle {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    /* Approvals panel --------------------------------------------- */
    /* auto-fit + minmax keeps the grid responsive at desktop / tablet /
       mobile widths without a hand-counted spacer or hard breakpoints. */
    .approvals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px 24px;
    }
    .approval-field {
      display: flex; flex-direction: column; gap: 4px;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      min-height: 52px;
      min-width: 0;
    }
    .approval-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .approval-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .approval-value.muted {
      color: #94a3b8;
      font-weight: 400;
    }
    .approval-sub {
      font-size: 12px;
      color: #64748b;
      font-weight: 400;
    }
    .approval-timestamp {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 400;
      margin-top: 2px;
    }
    .approval-comment {
      font-size: 12px;
      font-style: italic;
      color: #475569;
      line-height: 1.35;
      margin-top: 4px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    /* Workflow History Timeline ------------------------------------ */
    .wf-timeline {
      display: flex;
      flex-direction: column;
      padding: 4px 0;
      max-height: 480px;
      overflow-y: auto;
    }
    .wf-event {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .wf-spine {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 18px;
    }
    .wf-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      background: #fff;
      flex-shrink: 0;
      margin-top: 3px;
    }
    .wf-dot--approved  { border-color: #16a34a; background: #dcfce7; }
    .wf-dot--pending   { border-color: #2563eb; background: #dbeafe; }
    .wf-dot--returned  { border-color: #d97706; background: #fef3c7; }
    .wf-dot--rejected  { border-color: #dc2626; background: #fee2e2; }
    .wf-dot--neutral   { border-color: #94a3b8; background: #f1f5f9; }
    .wf-line {
      width: 2px;
      flex: 1;
      min-height: 20px;
      background: #e2e8f0;
      margin: 3px 0;
    }
    .wf-body {
      padding-bottom: 18px;
      min-width: 0;
    }
    .wf-action {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.3;
    }
    .wf-action--approved { color: #15803d; }
    .wf-action--pending  { color: #1d4ed8; }
    .wf-action--returned { color: #b45309; }
    .wf-action--rejected { color: #dc2626; }
    .wf-actor {
      font-size: 12px;
      color: #334155;
      font-weight: 500;
      margin-top: 1px;
    }
    .wf-time {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .wf-comment {
      font-size: 12px;
      font-style: italic;
      color: #475569;
      line-height: 1.35;
      margin-top: 5px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
  `]
})
export class OvertimeCaptureFormComponent implements OnInit {
  private lookups = inject(LookupService);
  private txService = inject(OvertimeTransactionsService);
  private wf = inject(WorkflowService);
  private user = inject(UserContextService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  histCols = ['date','hours','amount','type','status'];

  editId = signal<string | null>(null);
  currentStatus = signal<WorkflowStatus | null>(null);
  currentStatusLabel = signal<string>('');
  loadedTx = signal<OvertimeTransactionDto | null>(null);
  loadingTx = signal(false);
  // viewOnly: false when Requested or Returned (always editable), and also
  // false when Recommended and the current user is the original capturer
  // (allows recall-and-correct before the recommender has acted).
  viewOnly = computed(() => {
    const s = this.currentStatus();
    if (s === null) return false;
    if (s === WorkflowStatus.Requested || s === WorkflowStatus.Returned) return false;
    if (s === WorkflowStatus.Recommended) {
      const tx = this.loadedTx();
      const me = this.user.me()?.userId ?? '';
      if (tx && me && tx.capturedBy === me) return false;
    }
    return true;
  });
  pageTitle = computed(() => {
    if (!this.editId()) return 'Capture Overtime';
    return this.viewOnly() ? 'View Overtime' : 'Edit Overtime';
  });
  pageSubtitle = computed(() => {
    if (!this.editId()) return 'Search for an employee, then enter the overtime details.';
    if (this.viewOnly()) return 'This transaction is no longer editable.';
    if (this.currentStatus() === WorkflowStatus.Recommended)
      return 'Saving will recall this transaction so the recommender must re-approve.';
    return 'Adjust the overtime details and save your changes.';
  });
  // Submit available at Requested (draft) and Returned (kicked back for correction).
  canSubmit = computed(() => {
    if (!this.editId()) return true;
    return this.currentStatus() === WorkflowStatus.Requested
        || this.currentStatus() === WorkflowStatus.Returned;
  });

  // Approval fields rendered in the Approvals panel. Defined as data so the
  // grid layout never depends on a hand-counted number of <div>s.
  // `timestamp` carries the per-role action time (Created for the capturer,
  // Signed for each approver) so cards can show when the row was actioned.
  // `comment` carries the free-text comment captured at that workflow step
  // so reviewers can see WHY a step was returned/approved without scrolling
  // into the workflow history table.
  approvalFields = computed<Array<{
    label: string;
    display: string;
    subDisplay: string | null;
    muted: boolean;
    timestamp: string | null;
    timestampPrefix: string;
    comment: string | null;
  }>>(() => {
    const tx = this.loadedTx();
    if (!tx) return [];
    const recommenderEv    = this.roleEvent('recommender');
    const approverEv       = this.roleEvent('approver');
    const excessApproverEv = this.roleEvent('excessApprover');

    const capturerName = tx.capturedByName || tx.capturedBy || '—';
    const capturerSub  = [tx.capturedByEmployeeName, tx.capturedByEmployeeId]
      .filter(Boolean).join(' · ') || null;

    return [
      { label: 'Capturer',        display: capturerName,                                                          subDisplay: capturerSub,  muted: !tx.capturedBy,               timestamp: tx.createdAt ?? null,              timestampPrefix: 'Created', comment: null },
      { label: 'Approval Status', display: tx.statusLabel || '—',                                                 subDisplay: null,          muted: !tx.statusLabel,              timestamp: null,                              timestampPrefix: '',        comment: null },
      { label: 'Recommender',     display: tx.recommenderEmployeeName || '—',                                     subDisplay: null,          muted: !tx.recommenderEmployeeName,  timestamp: recommenderEv?.actionedAt ?? null, timestampPrefix: 'Signed',  comment: recommenderEv?.comments ?? null },
      { label: 'Approver',        display: tx.approverEmployeeName || '—',                                        subDisplay: null,          muted: !tx.approverEmployeeName,     timestamp: approverEv?.actionedAt ?? null,    timestampPrefix: 'Signed',  comment: approverEv?.comments ?? null },
      { label: 'Excess Approver', display: tx.excessApproverEmployeeName || (tx.isExcess ? '—' : 'Not applicable'), subDisplay: null,        muted: !tx.excessApproverEmployeeName, timestamp: excessApproverEv?.actionedAt ?? null, timestampPrefix: 'Signed', comment: excessApproverEv?.comments ?? null },
    ];
  });

  workflowTimeline = computed<Array<{
    id: string;
    actionLabel: string;
    actorName: string;
    actionedAt: string;
    comment: string | null;
    statusClass: string;
  }>>(() => {
    const tx = this.loadedTx();
    if (!tx?.workflowHistory?.length) return [];
    const isExcess = !!tx.isExcess;
    return [...tx.workflowHistory]
      .sort((a, b) => new Date(a.actionedAt).getTime() - new Date(b.actionedAt).getTime())
      .map(ev => ({
        id: ev.id,
        actionLabel: this.historyEventLabel(ev, isExcess),
        actorName: this.historyEventActor(ev, tx, isExcess),
        actionedAt: ev.actionedAt,
        comment: ev.comments ?? null,
        statusClass: this.historyEventStatusClass(ev.toStatus)
      }));
  });

  private historyEventLabel(ev: WorkflowEventDto, isExcess: boolean): string {
    const { fromStatus: from, toStatus: to } = ev;
    if (to === WorkflowStatus.Returned)  return 'Returned';
    if (to === WorkflowStatus.Rejected)  return 'Rejected';
    if (to === WorkflowStatus.Recommended
        && (from === WorkflowStatus.Requested || from === WorkflowStatus.Returned)) return 'Submitted';
    if (from === WorkflowStatus.Recommended
        && to === WorkflowStatus.ApprovedForPayment) return 'Recommended';
    if (from === WorkflowStatus.ApprovedForPayment
        && to === WorkflowStatus.ApprovedForPayment) return 'Approved (first sign-off)';
    if (from === WorkflowStatus.ApprovedForPayment
        && to === WorkflowStatus.AwaitingPayrollApproval) return isExcess ? 'Approved (excess)' : 'Approved';
    if (from === WorkflowStatus.AwaitingPayrollApproval
        && to === WorkflowStatus.AwaitingPayrollApproval) return 'Captured by Payroll';
    if (from === WorkflowStatus.AwaitingPayrollApproval
        && to === WorkflowStatus.Processed) return 'Processed by Payroll';
    return 'Updated';
  }

  private historyEventActor(ev: WorkflowEventDto, tx: OvertimeTransactionDto, isExcess: boolean): string {
    const { fromStatus: from, toStatus: to } = ev;
    let resolved: string | null | undefined;
    if (to === WorkflowStatus.Recommended
        && (from === WorkflowStatus.Requested || from === WorkflowStatus.Returned))
      resolved = tx.capturedByName || tx.capturedBy;
    else if (from === WorkflowStatus.Recommended && to === WorkflowStatus.ApprovedForPayment)
      resolved = tx.recommenderEmployeeName;
    else if (from === WorkflowStatus.ApprovedForPayment && to === WorkflowStatus.ApprovedForPayment)
      resolved = tx.approverEmployeeName;
    else if (from === WorkflowStatus.ApprovedForPayment && to === WorkflowStatus.AwaitingPayrollApproval)
      resolved = isExcess ? tx.excessApproverEmployeeName : tx.approverEmployeeName;
    else if (from === WorkflowStatus.AwaitingPayrollApproval && to === WorkflowStatus.AwaitingPayrollApproval)
      resolved = tx.payrollCapturerEmployeeName;
    else if (from === WorkflowStatus.AwaitingPayrollApproval && to === WorkflowStatus.Processed)
      resolved = tx.payrollApproverEmployeeName;
    return resolved || ev.actionedBy || '—';
  }

  private historyEventStatusClass(status: WorkflowStatus): string {
    switch (status) {
      case WorkflowStatus.Processed:              return 'approved';
      case WorkflowStatus.Returned:               return 'returned';
      case WorkflowStatus.Rejected:               return 'rejected';
      case WorkflowStatus.Recommended:
      case WorkflowStatus.ApprovedForPayment:
      case WorkflowStatus.AwaitingPayrollApproval: return 'pending';
      default:                                    return 'neutral';
    }
  }

  searchTerm = '';
  private search$ = new Subject<string>();
  suggestions = toSignal(
    this.search$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(t => t && t.length >= 2 ? this.lookups.employees(t) : of([] as EmployeeLookup[]))
    ),
    { initialValue: [] as EmployeeLookup[] }
  );

  employee = signal<EmployeeLookup | null>(null);
  overtimeDate = signal(todayIso());
  startTime: string | null = null;
  endTime: string | null = null;
  hours = 0;
  salaryHeadId: number | null = null;
  reason = '';

  overtimeTypes = signal<OvertimeTypeOption[]>([]);
  loadingTypes = signal(false);
  history = signal<OvertimeTransactionDto[]>([]);
  loadingHistory = signal(false);
  hoursThisMonth = computed(() =>
    this.history()
      .filter(r => isSameMonth(r.overtimeDate, this.overtimeDate()))
      .reduce((s, r) => s + (r.hours || 0), 0)
  );

  amountPreview = signal<{
    amount: number;
    formula: string;
    salaryHeadName: string;
    inputs?: Record<string, number>;
  } | null>(null);

  /**
   * Returns the formula string with variable names replaced by their actual
   * numeric values, e.g. "4.25 * ((12 500.00 / 173.33) * 1.5)".
   * Only available when the amount was computed live (not from a stored snapshot).
   */
  formulaWithValues = computed(() => {
    const preview = this.amountPreview();
    if (!preview?.inputs || !preview.formula) return null;
    // Sort keys longest-first to avoid partial substitution (e.g. WHPM before WHPM_Monthly)
    const entries = Object.entries(preview.inputs)
      .sort((a, b) => b[0].length - a[0].length);
    let expr = preview.formula;
    for (const [key, val] of entries) {
      const fmt = val >= 1000
        ? val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : Number.isInteger(val) ? val.toString() : val.toFixed(2);
      expr = expr.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), fmt);
    }
    return expr;
  });
  previewing = signal(false);

  pendingFile = signal<File | null>(null);
  saving = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.loadForEdit(id);
    }
  }

  statusClass(status: number | null): string {
    switch (status) {
      case WorkflowStatus.Processed: return 'status-approved';
      case WorkflowStatus.Returned:  return 'status-returned';
      case WorkflowStatus.Rejected:  return 'status-rejected';
      case null:
      case undefined:                return '';
      default:                       return 'status-pending';
    }
  }

  /**
   * Returns the most recent workflow event timestamp for the given role,
   * or null if that role has not yet acted.
   *
   * Each WorkflowEventDto represents the action that *moved the row out*
   * of `fromStatus` and into `toStatus`. The role doing the action is
   * therefore identified by which transition we look at, not by the
   * status the row landed in:
   *
   *   Capturer (submit):   Requested/Returned → Recommended
   *   Recommender:         Recommended         → ApprovedForPayment
   *   Approver:            ApprovedForPayment  → ApprovedForPayment   (excess case)
   *                        ApprovedForPayment  → AwaitingPayrollApproval (non-excess)
   *   Excess Approver:     ApprovedForPayment  → AwaitingPayrollApproval (only when isExcess)
   *   Payroll Capturer:    AwaitingPayrollApproval → AwaitingPayrollApproval
   *   Payroll Approver:    AwaitingPayrollApproval → Processed
   */
  roleTimestamp(
    role: 'recommender' | 'approver' | 'excessApprover'
  ): string | null {
    return this.roleEvent(role)?.actionedAt ?? null;
  }

  /**
   * Returns the most recent workflow event for the given role, or null
   * if that role has not yet acted. Same matching logic as
   * `roleTimestamp` but returns the full event so callers can read
   * `comments` as well as `actionedAt`.
   */
  roleEvent(
    role: 'recommender' | 'approver' | 'excessApprover'
  ): WorkflowEventDto | null {
    const tx = this.loadedTx();
    if (!tx?.workflowHistory?.length) return null;
    const isExcess = !!tx.isExcess;

    const matches = tx.workflowHistory.filter(ev => {
      switch (role) {
        case 'recommender':
          return ev.fromStatus === WorkflowStatus.Recommended
              && ev.toStatus === WorkflowStatus.ApprovedForPayment;

        case 'approver':
          // Excess case: regular approver does the in-place 2→2 hop and
          // the excess approver finishes with 2→3.
          // Non-excess case: regular approver does the 2→3 hop directly.
          if (isExcess) {
            return ev.fromStatus === WorkflowStatus.ApprovedForPayment
                && ev.toStatus === WorkflowStatus.ApprovedForPayment;
          }
          return ev.fromStatus === WorkflowStatus.ApprovedForPayment
              && ev.toStatus === WorkflowStatus.AwaitingPayrollApproval;

        case 'excessApprover':
          // Only present in excess cases; the second 2→3 hop.
          if (!isExcess) return false;
          return ev.fromStatus === WorkflowStatus.ApprovedForPayment
              && ev.toStatus === WorkflowStatus.AwaitingPayrollApproval;

      }
    });

    if (!matches.length) return null;

    // Most recent action wins (handles re-submissions after a Return).
    // Sort by parsed time so we don't depend on string ordering of the
    // `actionedAt` format remaining ISO-8601-friendly forever.
    return matches
      .slice()
      .sort((a, b) => new Date(a.actionedAt).getTime() - new Date(b.actionedAt).getTime())
      .pop() ?? null;
  }

  private loadForEdit(id: string): void {
    this.loadingTx.set(true);
    this.txService.get(id).subscribe({
      next: tx => {
        this.loadingTx.set(false);
        this.prefillFromTx(tx);
      },
      error: e => {
        this.loadingTx.set(false);
        this.snack.open(`Failed to load transaction: ${e?.error?.message ?? e?.message}`,
          'OK', { duration: 4000 });
        this.router.navigateByUrl('/overtime/capture');
      }
    });
  }

  private prefillFromTx(tx: OvertimeTransactionDto): void {
    this.loadedTx.set(tx);
    this.currentStatus.set(tx.status);
    this.currentStatusLabel.set(tx.statusLabel);

    // Seed the card immediately with what the transaction already carries so
    // the UI isn't blank while the employee fetch is in flight.
    const partial: EmployeeLookup = {
      id: tx.employeeId,
      employeeNumber: tx.employeeId,
      fullName: tx.employeeName,
      empCode: '',
      idNo: '',
      departmentId: tx.departmentId,
      departmentName: tx.departmentName,
      divisionId: '',
      divisionName: '',
      positionId: tx.positionId,
      positionDescription: ''
    };
    this.employee.set(partial);

    // Fetch the full employee record so the card shows Division, Emp Code,
    // ID Number, and the correct Department name.
    this.lookups.employee(tx.employeeId).subscribe({
      next: full => { if (full) this.employee.set(full); },
      error: () => { /* non-fatal — partial card is acceptable */ }
    });

    this.overtimeDate.set((tx.overtimeDate || '').slice(0, 10));
    this.startTime    = (tx.startTime || '').slice(0, 5) || null;
    this.endTime      = (tx.endTime || '').slice(0, 5) || null;
    this.hours        = tx.hours;
    this.salaryHeadId = tx.salaryHeadId;
    this.reason       = tx.reason ?? '';

    this.amountPreview.set({
      amount: tx.amount,
      formula: tx.formulaSnapshot,
      salaryHeadName: tx.salaryHeadName
    });

    this.loadTypes(tx.employeeId);
    this.loadHistory(tx.employeeId);
  }

  onSearch(t: string): void { this.search$.next(t); }

  onEmployeePicked(e: EmployeeLookup | string): void {
    if (typeof e === 'string') return;
    this.employee.set(e);
    this.searchTerm = `${e.employeeNumber} - ${e.fullName}`;
    this.salaryHeadId = null;
    this.amountPreview.set(null);
    this.loadTypes(e.id);
    this.loadHistory(e.id);
  }

  private loadTypes(empId: string): void {
    this.loadingTypes.set(true);
    this.txService.overtimeTypesForEmployee(empId).subscribe({
      next: ts => { this.overtimeTypes.set(ts ?? []); this.loadingTypes.set(false); },
      error: e => { this.loadingTypes.set(false); this.snack.open(`Failed to load OT types: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 }); }
    });
  }

  private loadHistory(empId: string): void {
    this.loadingHistory.set(true);
    this.txService.listForEmployee(empId).subscribe({
      next: rs => { this.history.set(rs ?? []); this.loadingHistory.set(false); },
      error: () => { this.loadingHistory.set(false); }
    });
  }

  get overtimeDateValue(): Date | null {
    const iso = this.overtimeDate();
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  set overtimeDateValue(val: Date | null) {
    if (!val) return;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    this.overtimeDate.set(`${y}-${m}-${d}`);
  }

  recalcHours(): void {
    if (this.startTime && this.endTime) {
      const [sh, sm] = this.startTime.split(':').map(n => +n);
      const [eh, em] = this.endTime.split(':').map(n => +n);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60; // crossed midnight
      this.hours = Math.round((mins / 60) * 100) / 100;
      this.refreshAmount();
    }
  }

  onHoursChange(): void { this.refreshAmount(); }

  onTypeChange(): void { this.refreshAmount(); }

  private refreshAmount(): void {
    const emp = this.employee();
    if (!emp || !this.salaryHeadId || !this.hours || this.hours <= 0) {
      this.amountPreview.set(null);
      return;
    }
    this.previewing.set(true);
    this.txService.previewAmount({
      employeeId: emp.id,
      salaryHeadId: this.salaryHeadId,
      hours: this.hours
    }).subscribe({
      next: a => { this.amountPreview.set(a); this.previewing.set(false); },
      error: () => { this.previewing.set(false); this.amountPreview.set(null); }
    });
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      this.snack.open('Only PDF files are accepted.', 'OK', { duration: 3000 });
      input.value = ''; return;
    }
    if (f.size > 5 * 1024 * 1024) {
      this.snack.open('File exceeds 5 MB.', 'OK', { duration: 3000 });
      input.value = ''; return;
    }
    this.pendingFile.set(f);
    input.value = '';
  }

  canSave(): boolean {
    return !!this.employee()
        && !!this.salaryHeadId
        && this.hours > 0
        && !!this.overtimeDate();
  }

  save(submit: boolean): void {
    const emp = this.employee()!;
    this.saving.set(true);

    const id = this.editId();
    if (id) {
      this.txService.update(id, {
        overtimeDate: this.overtimeDate(),
        startTime: this.startTime,
        endTime: this.endTime,
        hours: this.hours,
        salaryHeadId: this.salaryHeadId!,
        reason: this.reason || null
      }).subscribe({
        next: tx => this.afterCreate(tx, submit),
        error: e => {
          this.saving.set(false);
          this.snack.open(`Save failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 });
        }
      });
      return;
    }

    this.txService.create({
      employeeId: emp.id,
      overtimeDate: this.overtimeDate(),
      startTime: this.startTime,
      endTime: this.endTime,
      hours: this.hours,
      salaryHeadId: this.salaryHeadId!,
      reason: this.reason || null
    }).subscribe({
      next: tx => this.afterCreate(tx, submit),
      error: e => {
        this.saving.set(false);
        this.snack.open(`Save failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 });
      }
    });
  }

  private afterCreate(tx: OvertimeTransactionDto, submit: boolean): void {
    const file = this.pendingFile();
    const finish = () => {
      if (submit) {
        this.wf.submit(tx.id).subscribe({
          next: () => this.done('Submitted for recommendation.'),
          error: e => { this.saving.set(false); this.snack.open(`Submit failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 }); }
        });
      } else {
        this.done('Saved as draft.');
      }
    };
    if (file) {
      this.txService.uploadDocument(tx.id, file).subscribe({
        next: () => finish(),
        error: e => { this.saving.set(false); this.snack.open(`Upload failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 }); }
      });
    } else {
      finish();
    }
  }

  private done(msg: string): void {
    this.saving.set(false);
    this.snack.open(msg, 'OK', { duration: 2500 });
    this.router.navigateByUrl('/overtime/capture');
  }
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function isSameMonth(a: string, b: string): boolean {
  return (a || '').slice(0, 7) === (b || '').slice(0, 7);
}
