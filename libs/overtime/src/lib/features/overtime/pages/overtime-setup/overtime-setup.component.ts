import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { OvertimeConfigService } from '../../../../core/services/overtime-config.service';
import { environment } from '../../../../environment';

interface PositionItem { id: string; description: string; }

@Component({
  selector: 'app-overtime-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe,
    MatSlideToggleModule, MatSnackBarModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="form-card">
      <div class="form-section">
        <div class="form-section-title">
          <mat-icon>tune</mat-icon>
          <span>Overtime Configuration</span>
          @if (lastUpdated()) {
            <span class="form-section-meta">Last updated {{ lastUpdated() | date:'dd/MM/yyyy HH:mm' }}</span>
          }
        </div>
        <p class="form-section-sub">
          Defaults applied across the overtime workflow
        </p>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="allowOvertimeMultipleApproval" color="primary">
            Allow Overtime Multiple Approval
          </mat-slide-toggle>
        </div>

        <div class="form-grid">
          <div class="form-group" [class.disabled]="!enabled()">
            <label>Start Date</label>
            <div class="date-field-wrap">
              <input class="form-control date-field" readonly
                     [matDatepicker]="startDatePicker"
                     formControlName="startDate"
                     placeholder="DD/MM/YYYY" />
              <mat-datepicker-toggle class="date-toggle" [for]="startDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #startDatePicker></mat-datepicker>
            </div>
          </div>
          <div class="form-group"><!-- spacer --></div>

          <div class="form-group" [class.disabled]="!enabled()">
            <label>Counting Period Start Day <span class="required">*</span></label>
            <input class="form-control" type="number" min="1" max="31" formControlName="countingPeriodStartDay">
          </div>
          <div class="form-group" [class.disabled]="!enabled()">
            <label>Counting Period End Day <span class="required">*</span></label>
            <input class="form-control" type="number" min="1" max="31" formControlName="countingPeriodEndDay">
          </div>

          <div class="form-group" [class.disabled]="!enabled()">
            <label>Maximum Monthly Overtime Hours <span class="required">*</span></label>
            <input class="form-control" type="number" min="0" step="0.25" formControlName="maximumMonthlyOvertimeHours">
          </div>
          <div class="form-group" [class.disabled]="!enabled()">
            <label>Exceptional Maximum Overtime Hours <span class="required">*</span></label>
            <input class="form-control" type="number" min="0" step="0.25" formControlName="exceptionalMaximumOvertimeHours">
          </div>
        </div>

        @if (form.errors?.['countingPeriodOrder']) {
          <div class="form-banner-error">Start day must be on or before end day.</div>
        }
        @if (form.errors?.['exceptionalLessThanMaximum']) {
          <div class="form-banner-error">Exceptional hours must be greater than or equal to maximum hours.</div>
        }
      </div>

      <!-- ── Override Position ─────────────────────────────────────────── -->
      <div class="form-section">
        <div class="form-section-title">
          <mat-icon>admin_panel_settings</mat-icon>
          <span>Master Approver Override</span>
        </div>
        <p class="form-section-sub">
          When set, the employee currently holding this position can recommend, approve,
          return, or reject <em>any</em> overtime transaction regardless of the normal
          approval chain. Leave blank to disable.
        </p>

        <div class="form-group override-group">
          <label>Override Position</label>

          @if (overridePositionId()) {
            <!-- Selected state: show name + clear button -->
            <div class="pos-selected">
              <mat-icon class="pos-icon">work_outline</mat-icon>
              <span class="pos-selected-name">{{ overridePositionDesc() || overridePositionId() }}</span>
              <button type="button" class="btn-icon pos-clear" title="Remove override position"
                      (click)="clearOverride()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          } @else {
            <!-- Search state: input + results dropdown -->
            <div class="pos-search-wrap">
              <input class="form-control" type="text"
                     placeholder="Search by position name or code…"
                     [value]="posSearch()"
                     (input)="onPosSearch($event)"
                     autocomplete="off" />
              @if (posSearching()) {
                <div class="pos-status">Searching…</div>
              } @else if (posSearch() && posResults().length === 0) {
                <div class="pos-status pos-none">No positions found</div>
              }
              @if (posResults().length > 0) {
                <ul class="pos-results">
                  @for (p of posResults(); track p.id) {
                    <li (click)="selectPos(p)">
                      <span class="pos-result-name">{{ p.description }}</span>
                      <span class="pos-result-id">{{ p.id }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>
      </div>

      <!-- ── User Permissions Cache ───────────────────────────────────────── -->
      <div class="form-section">
        <div class="form-section-title">
          <mat-icon>manage_accounts</mat-icon>
          <span>User Permissions Cache</span>
        </div>
        <p class="form-section-sub">
          Role and permission assignments are cached for performance. Use this to apply
          changes (new users, role updates, access removals) immediately without
          restarting the server.
        </p>

        <div class="flush-row">
          <button type="button" class="btn btn-secondary flush-btn"
                  [disabled]="flushing()"
                  (click)="flushPermissions()">
            <mat-icon>refresh</mat-icon>
            {{ flushing() ? 'Refreshing…' : 'Refresh Now' }}
          </button>

          @if (flushResult()) {
            <span class="flush-result">
              <mat-icon class="flush-ok-icon">check_circle</mat-icon>
              {{ flushResult()!.usersLoaded }} users loaded
              &nbsp;·&nbsp;
              refreshed at {{ flushResult()!.refreshedAt | date:'HH:mm:ss' }}
            </span>
          }
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn">
          <mat-icon>arrow_back</mat-icon>
          <span>Back</span>
        </button>
        <span class="spacer"></span>
        <button type="button" class="btn">Cancel</button>
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving…' : 'Submit' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form-section-meta {
      margin-left: auto;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: none;
      letter-spacing: 0;
    }
    .toggle-row {
      display: flex; align-items: center;
      padding: 10px 14px;
      background: #f3f4f6;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .form-group.disabled label { color: var(--text-muted); }
    .date-field-wrap { position: relative; display: flex; align-items: center; }
    .date-field { padding-right: 34px !important; cursor: pointer; }
    .date-toggle { position: absolute; right: 1px; top: 50%; transform: translateY(-50%); }
    .date-toggle button { width: 30px !important; height: 30px !important; padding: 0 !important; }

    /* Override position picker */
    .override-group { max-width: 480px; }

    .pos-selected {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #15803d;
    }
    .pos-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .pos-selected-name { flex: 1; }
    .btn-icon {
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer;
      width: 28px; height: 28px; border-radius: 50%;
      color: #15803d; padding: 0;
    }
    .btn-icon:hover { background: #dcfce7; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .pos-search-wrap { position: relative; }
    .pos-status {
      margin-top: 4px;
      font-size: 12px;
      color: var(--text-muted);
      padding: 4px 2px;
    }
    .pos-none { font-style: italic; }
    .pos-results {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,.08);
      max-height: 220px;
      overflow-y: auto;
    }
    .pos-results li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;
      cursor: pointer;
      font-size: 13px;
      border-bottom: 1px solid var(--border);
    }
    .pos-results li:last-child { border-bottom: none; }
    .pos-results li:hover { background: #f0f9ff; }
    .pos-result-name { color: var(--text-main, #111); font-weight: 500; }
    .pos-result-id   { color: var(--text-muted); font-size: 11px; margin-left: 8px; flex-shrink: 0; }

    /* Permissions cache flush */
    .flush-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .flush-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .flush-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .flush-result {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #15803d;
      font-weight: 500;
    }
    .flush-ok-icon { font-size: 16px; width: 16px; height: 16px; color: #16a34a; }
  `]
})
export class OvertimeSetupComponent implements OnInit {
  private fb    = inject(FormBuilder);
  private svc   = inject(OvertimeConfigService);
  private snack = inject(MatSnackBar);
  private http  = inject(HttpClient);

  saving      = signal(false);
  lastUpdated = signal<string | null>(null);
  enabled     = signal(false);

  flushing    = signal(false);
  flushResult = signal<{ usersLoaded: number; refreshedAt: Date } | null>(null);

  /** Override-position state — managed outside the reactive form */
  overridePositionId   = signal<string | null>(null);
  overridePositionDesc = signal<string | null>(null);

  /** Position search state */
  posSearch    = signal('');
  posResults   = signal<PositionItem[]>([]);
  posSearching = signal(false);
  private _posTimer: ReturnType<typeof setTimeout> | null = null;

  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    allowOvertimeMultipleApproval: [false],
    startDate: [null as Date | null],
    countingPeriodStartDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    countingPeriodEndDay: [31, [Validators.required, Validators.min(1), Validators.max(31)]],
    maximumMonthlyOvertimeHours: [40, [Validators.required, Validators.min(0)]],
    exceptionalMaximumOvertimeHours: [60, [Validators.required, Validators.min(0)]]
  }, {
    validators: [
      OvertimeSetupComponent.countingPeriodOrder,
      OvertimeSetupComponent.exceptionalGteMaximum
    ]
  });

  static countingPeriodOrder(group: AbstractControl): ValidationErrors | null {
    const start = Number(group.get('countingPeriodStartDay')?.value);
    const end = Number(group.get('countingPeriodEndDay')?.value);
    return start && end && start > end ? { countingPeriodOrder: true } : null;
  }

  /** Format an ISO/`yyyy-MM-dd` date string for display as `dd/MM/yyyy`. */
  static toDisplayDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const datePart = iso.length >= 10 ? iso.substring(0, 10) : iso;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
    if (!m) return '';
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  /** Parse a `dd/MM/yyyy` user input back to an ISO 8601 string (UTC midnight). */
  static parseDisplayDate(display: string): string | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  static exceptionalGteMaximum(group: AbstractControl): ValidationErrors | null {
    const max = Number(group.get('maximumMonthlyOvertimeHours')?.value);
    const exc = Number(group.get('exceptionalMaximumOvertimeHours')?.value);
    return exc < max ? { exceptionalLessThanMaximum: true } : null;
  }

  private dependentControls = [
    'startDate',
    'countingPeriodStartDay',
    'countingPeriodEndDay',
    'maximumMonthlyOvertimeHours',
    'exceptionalMaximumOvertimeHours'
  ] as const;

  private applyEnabledState(allow: boolean): void {
    this.enabled.set(allow);
    for (const name of this.dependentControls) {
      const ctrl = this.form.get(name);
      if (!ctrl) continue;
      if (allow) ctrl.enable({ emitEvent: false });
      else ctrl.disable({ emitEvent: false });
    }
  }

  ngOnInit(): void {
    this.applyEnabledState(false);

    this.form.get('allowOvertimeMultipleApproval')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.applyEnabledState(!!v));

    this.svc.get().subscribe({
      next: cfg => {
        this.form.patchValue({
          allowOvertimeMultipleApproval: cfg.allowOvertimeMultipleApproval,
          startDate: cfg.startDate ? new Date(cfg.startDate) : null,
          countingPeriodStartDay: cfg.countingPeriodStartDay,
          countingPeriodEndDay: cfg.countingPeriodEndDay,
          maximumMonthlyOvertimeHours: cfg.maximumMonthlyOvertimeHours,
          exceptionalMaximumOvertimeHours: cfg.exceptionalMaximumOvertimeHours
        });
        this.lastUpdated.set(cfg.updatedAt ?? null);
        // Load override position from saved config
        this.overridePositionId.set(cfg.overridePositionId ?? null);
        this.overridePositionDesc.set(cfg.overridePositionDescription ?? null);
      },
      error: () => this.snack.open('Failed to load configuration', 'Dismiss', { duration: 3000 })
    });
  }

  // ── Position search ────────────────────────────────────────────────────

  onPosSearch(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.posSearch.set(v);
    this.posResults.set([]);
    if (this._posTimer) clearTimeout(this._posTimer);
    if (!v.trim()) { this.posSearching.set(false); return; }
    this.posSearching.set(true);
    this._posTimer = setTimeout(() => {
      this.http.get<{ data: { items: PositionItem[] } }>(
        `${environment.apiBaseUrl}/positions/list?search=${encodeURIComponent(v.trim())}&pageSize=20`
      ).subscribe({
        next: r => {
          this.posResults.set(r.data?.items ?? []);
          this.posSearching.set(false);
        },
        error: () => {
          this.posSearching.set(false);
          this.posResults.set([]);
        }
      });
    }, 300);
  }

  selectPos(p: PositionItem): void {
    this.overridePositionId.set(p.id);
    this.overridePositionDesc.set(p.description);
    this.posSearch.set('');
    this.posResults.set([]);
    this.posSearching.set(false);
  }

  clearOverride(): void {
    this.overridePositionId.set(null);
    this.overridePositionDesc.set(null);
    this.posSearch.set('');
    this.posResults.set([]);
  }

  // ── Permissions cache flush ────────────────────────────────────────────

  flushPermissions(): void {
    this.flushing.set(true);
    this.flushResult.set(null);
    this.http.post<{ data: { usersLoaded: number; refreshedAt: string } }>(
      `${environment.apiBaseUrl}/admin/refresh-users`, {}
    ).subscribe({
      next: r => {
        this.flushing.set(false);
        this.flushResult.set({
          usersLoaded: r.data.usersLoaded,
          refreshedAt: new Date(r.data.refreshedAt),
        });
        this.snack.open(`Permissions refreshed — ${r.data.usersLoaded} users loaded`, 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.flushing.set(false);
        this.snack.open('Failed to refresh permissions cache', 'Dismiss', { duration: 4000 });
      }
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.svc.update({
      allowOvertimeMultipleApproval: v.allowOvertimeMultipleApproval ?? false,
      startDate: v.startDate ? v.startDate.toISOString() : null,
      countingPeriodStartDay: Number(v.countingPeriodStartDay),
      countingPeriodEndDay: Number(v.countingPeriodEndDay),
      maximumMonthlyOvertimeHours: Number(v.maximumMonthlyOvertimeHours),
      exceptionalMaximumOvertimeHours: Number(v.exceptionalMaximumOvertimeHours),
      overridePositionId: this.overridePositionId() || null,
      overridePositionDescription: this.overridePositionDesc() || null
    }).subscribe({
      next: cfg => {
        this.saving.set(false);
        this.lastUpdated.set(cfg.updatedAt ?? new Date().toISOString());
        this.snack.open('Saved', 'Dismiss', { duration: 2500 });
      },
      error: err => {
        this.saving.set(false);
        this.snack.open(err?.error?.message ?? 'Save failed', 'Dismiss', { duration: 4000 });
      }
    });
  }
}
