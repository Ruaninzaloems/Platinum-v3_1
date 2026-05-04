import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { OvertimeConfigService } from '../../../../core/services/overtime-config.service';

@Component({
  selector: 'app-overtime-setup',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe,
    MatSlideToggleModule, MatSnackBarModule, MatIconModule
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
            <input class="form-control" type="text" inputmode="numeric"
                   placeholder="DD/MM/YYYY"
                   maxlength="10"
                   pattern="\\d{2}/\\d{2}/\\d{4}"
                   formControlName="startDateStr">
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
  `]
})
export class OvertimeSetupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private svc = inject(OvertimeConfigService);
  private snack = inject(MatSnackBar);

  saving = signal(false);
  lastUpdated = signal<string | null>(null);
  enabled = signal(false);

  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    allowOvertimeMultipleApproval: [false],
    startDateStr: [''],
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
    'startDateStr',
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
          startDateStr: OvertimeSetupComponent.toDisplayDate(cfg.startDate),
          countingPeriodStartDay: cfg.countingPeriodStartDay,
          countingPeriodEndDay: cfg.countingPeriodEndDay,
          maximumMonthlyOvertimeHours: cfg.maximumMonthlyOvertimeHours,
          exceptionalMaximumOvertimeHours: cfg.exceptionalMaximumOvertimeHours
        });
        this.lastUpdated.set(cfg.updatedAt ?? null);
      },
      error: () => this.snack.open('Failed to load configuration', 'Dismiss', { duration: 3000 })
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.svc.update({
      allowOvertimeMultipleApproval: v.allowOvertimeMultipleApproval ?? false,
      startDate: OvertimeSetupComponent.parseDisplayDate(v.startDateStr ?? ''),
      countingPeriodStartDay: Number(v.countingPeriodStartDay),
      countingPeriodEndDay: Number(v.countingPeriodEndDay),
      maximumMonthlyOvertimeHours: Number(v.maximumMonthlyOvertimeHours),
      exceptionalMaximumOvertimeHours: Number(v.exceptionalMaximumOvertimeHours)
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
