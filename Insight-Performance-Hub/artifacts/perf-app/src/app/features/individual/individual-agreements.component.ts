import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle } from '@core/models/domain.model';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

interface Agreement {
  id: number;
  cycleId: number;
  employeeId: number;
  employeeName: string;
  postTitle: string;
  departmentId: number | null;
  departmentName: string;
  status: string;
  kpiWeightPct: number;
  competencyWeightPct: number;
  finalScore: number | null;
}

interface EmployeeKpa {
  id: number;
  agreementId: number;
  title: string;
  description: string | null;
  weighting: number;
}

interface EmployeeKpi {
  id: number;
  kpaId: number;
  agreementId: number;
  kpiNumber: string;
  description: string;
  annualTarget: string;
  weighting: number;
}

interface AgreementForm {
  employeeId: number;
  employeeName: string;
  postTitle: string;
  departmentId: number;
  departmentName: string;
}

interface KpaForm { title: string; description: string; weighting: number; }
interface KpiForm { kpaId: number; kpiNumber: string; description: string; annualTarget: string; weighting: number; }

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Draft: { bg: '#f1f5f9', fg: '#334155' },
  Submitted: { bg: '#dbeafe', fg: '#1d4ed8' },
  'Supervisor Review': { bg: '#cffafe', fg: '#0e7490' },
  Approved: { bg: '#dcfce7', fg: '#15803d' },
  'Quarterly Review': { bg: '#fef3c7', fg: '#b45309' },
  'Mid-Year Review': { bg: '#ffedd5', fg: '#c2410c' },
  'Annual Assessment': { bg: '#e0e7ff', fg: '#4338ca' },
  Moderation: { bg: '#fef9c3', fg: '#a16207' },
  'Final Score': { bg: '#d1fae5', fg: '#047857' },
  Locked: { bg: '#f3e8ff', fg: '#7e22ce' },
};

// ─── New Agreement Dialog ───────────────────────────────────────────────────
@Component({
  selector: 'app-new-agreement-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>New Performance Agreement</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Employee</mat-label>
        <mat-select [(ngModel)]="form.employeeId" name="emp" (ngModelChange)="onEmployee($event)">
          <mat-option *ngFor="let u of activeUsers" [value]="u.id">{{ u.displayName }} ({{ u.role }})</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Post Title</mat-label><input matInput [(ngModel)]="form.postTitle" name="post" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Department Name</mat-label><input matInput [(ngModel)]="form.departmentName" name="dept" /></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!form.employeeId || !form.postTitle.trim()"
              (click)="ref.close(form)">Create Agreement</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } mat-form-field { width: 100%; }`],
})
export class NewAgreementDialogComponent {
  form: AgreementForm = { employeeId: 0, employeeName: '', postTitle: '', departmentId: 0, departmentName: '' };
  activeUsers: User[];
  constructor(
    public ref: MatDialogRef<NewAgreementDialogComponent, AgreementForm | null>,
    @Inject(MAT_DIALOG_DATA) data: { users: User[] },
  ) { this.activeUsers = (data.users ?? []).filter((u) => u.isActive); }
  onEmployee(id: number) {
    const u = this.activeUsers.find((x) => x.id === id);
    if (u) { this.form.employeeName = u.displayName; this.form.departmentId = u.departmentId ?? 0; }
  }
}

// ─── KPA Dialog ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-kpa-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.editing ? 'Edit KPA' : 'Add Key Performance Area' }}</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput [(ngModel)]="form.title" name="title" required /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput [(ngModel)]="form.description" name="desc" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Weighting (%)</mat-label><input matInput type="number" [(ngModel)]="form.weighting" name="w" /></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!form.title.trim()" (click)="ref.close(form)">{{ data.editing ? 'Save Changes' : 'Add KPA' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } mat-form-field { width: 100%; }`],
})
export class KpaDialogComponent {
  form: KpaForm;
  constructor(
    public ref: MatDialogRef<KpaDialogComponent, KpaForm | null>,
    @Inject(MAT_DIALOG_DATA) public data: { editing: boolean; value: KpaForm },
  ) { this.form = { ...data.value }; }
}

// ─── KPI Dialog ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-kpi-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.editing ? 'Edit KPI' : 'Add Key Performance Indicator' }}</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>KPA</mat-label>
        <mat-select [(ngModel)]="form.kpaId" name="kpa">
          <mat-option *ngFor="let k of data.kpas" [value]="k.id">{{ k.title }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Number</mat-label><input matInput [(ngModel)]="form.kpiNumber" name="num" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput [(ngModel)]="form.description" name="desc" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Annual Target</mat-label><input matInput [(ngModel)]="form.annualTarget" name="tgt" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Weighting (%)</mat-label><input matInput type="number" [(ngModel)]="form.weighting" name="w" /></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!form.kpaId" (click)="ref.close(form)">{{ data.editing ? 'Save Changes' : 'Add KPI' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } mat-form-field { width: 100%; }`],
})
export class KpiDialogComponent {
  form: KpiForm;
  constructor(
    public ref: MatDialogRef<KpiDialogComponent, KpiForm | null>,
    @Inject(MAT_DIALOG_DATA) public data: { editing: boolean; value: KpiForm; kpas: EmployeeKpa[] },
  ) { this.form = { ...data.value }; }
}

// ─── Main Page ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-individual-agreements',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <ng-container *ngIf="detail() as ag; else listView">
        <!-- ── Detail View ── -->
        <div class="detail-head">
          <button mat-button (click)="back()"><mat-icon>arrow_back</mat-icon> Back</button>
          <div class="who">
            <h2>{{ ag.employeeName }}</h2>
            <p>{{ ag.postTitle }} — {{ ag.departmentName }}</p>
          </div>
          <span class="chip" [style.background]="color(ag.status).bg" [style.color]="color(ag.status).fg">{{ ag.status }}</span>
          <div class="actions">
            <ng-container [ngSwitch]="ag.status">
              <button *ngSwitchCase="'Draft'" mat-flat-button color="primary" (click)="transition('submit')"><mat-icon>send</mat-icon> Submit</button>
              <ng-container *ngSwitchCase="'Submitted'">
                <button mat-stroked-button (click)="transition('return_to_draft')">Return to Draft</button>
                <button mat-flat-button color="primary" (click)="transition('approve')"><mat-icon>check</mat-icon> Send to Supervisor</button>
              </ng-container>
              <ng-container *ngSwitchCase="'Supervisor Review'">
                <button mat-stroked-button (click)="transition('reject')">Return</button>
                <button mat-flat-button color="primary" (click)="transition('approve')"><mat-icon>check</mat-icon> Approve</button>
              </ng-container>
              <button *ngSwitchCase="'Approved'" mat-flat-button color="primary" (click)="transition('start_quarterly')">Start Quarterly Review</button>
              <ng-container *ngSwitchCase="'Quarterly Review'">
                <button mat-stroked-button (click)="transition('reject')">Return</button>
                <button mat-flat-button color="primary" (click)="transition('complete_quarterly')">Complete Quarterly</button>
              </ng-container>
              <ng-container *ngSwitchCase="'Mid-Year Review'">
                <button mat-stroked-button (click)="transition('reject')">Return</button>
                <button mat-flat-button color="primary" (click)="transition('complete_midyear')">Complete Mid-Year</button>
              </ng-container>
              <ng-container *ngSwitchCase="'Annual Assessment'">
                <button mat-stroked-button (click)="transition('reject')">Return</button>
                <button mat-flat-button color="primary" (click)="transition('complete_annual')">Complete Annual</button>
              </ng-container>
              <ng-container *ngSwitchCase="'Moderation'">
                <button mat-stroked-button (click)="transition('refer')">Refer Back</button>
                <button mat-flat-button color="primary" (click)="transition('accept')">Accept Score</button>
              </ng-container>
              <button *ngSwitchCase="'Final Score'" mat-flat-button color="primary" (click)="transition('lock')"><mat-icon>lock</mat-icon> Lock</button>
            </ng-container>
          </div>
        </div>

        <div class="stat-grid">
          <div class="plat-card stat"><p class="lbl">KPI Weight</p><p class="val">{{ ag.kpiWeightPct }}%</p></div>
          <div class="plat-card stat"><p class="lbl">Competency Weight</p><p class="val">{{ ag.competencyWeightPct }}%</p></div>
          <div class="plat-card stat"><p class="lbl">Final Score</p><p class="val">{{ ag.finalScore ?? '—' }}</p></div>
        </div>

        <div class="plat-card">
          <div class="card-head">
            <h3 class="title">Key Performance Areas</h3>
            <button *ngIf="ag.status === 'Draft'" mat-flat-button color="primary" (click)="openAddKpa()"><mat-icon>add</mat-icon> Add KPA</button>
          </div>
          <p *ngIf="!kpas().length" class="empty">No KPAs defined yet</p>
          <div class="row-list" *ngIf="kpas().length">
            <div class="row" *ngFor="let kpa of kpas()">
              <div>
                <p class="row-title">{{ kpa.title }}</p>
                <p *ngIf="kpa.description" class="row-sub">{{ kpa.description }}</p>
              </div>
              <div class="row-end">
                <span class="chip outline">{{ kpa.weighting }}%</span>
                <ng-container *ngIf="ag.status === 'Draft'">
                  <button mat-icon-button (click)="openEditKpa(kpa)"><mat-icon class="blue">edit</mat-icon></button>
                  <button mat-icon-button (click)="deleteKpa(kpa)"><mat-icon class="red">delete</mat-icon></button>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <div class="plat-card">
          <div class="card-head">
            <h3 class="title">Key Performance Indicators</h3>
            <button *ngIf="ag.status === 'Draft' && kpas().length" mat-flat-button color="primary" (click)="openAddKpi()"><mat-icon>add</mat-icon> Add KPI</button>
          </div>
          <p *ngIf="!kpis().length" class="empty">No KPIs defined yet</p>
          <table class="plat-table" *ngIf="kpis().length">
            <thead><tr><th>KPI #</th><th>Description</th><th>Target</th><th class="num">Weight</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let kpi of kpis()">
                <td class="bold">{{ kpi.kpiNumber }}</td>
                <td>{{ kpi.description }}</td>
                <td>{{ kpi.annualTarget }}</td>
                <td class="num">{{ kpi.weighting }}%</td>
                <td class="num">
                  <ng-container *ngIf="ag.status === 'Draft'">
                    <button mat-icon-button (click)="openEditKpi(kpi)"><mat-icon class="blue">edit</mat-icon></button>
                    <button mat-icon-button (click)="deleteKpi(kpi)"><mat-icon class="red">delete</mat-icon></button>
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>

      <ng-template #listView>
        <!-- ── List View ── -->
        <app-page-header title="Individual Performance Agreements" subtitle="Manage employee performance agreements, KPAs, and KPIs" icon="assignment_ind" tone="indigo">
          <mat-form-field appearance="outline" class="cycle-pick">
            <mat-label>Cycle</mat-label>
            <mat-select [ngModel]="cycleId()" (ngModelChange)="onCycle($event)">
              <mat-option [value]="null">All Cycles</mat-option>
              <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="openCreate()"><mat-icon>add</mat-icon> New Agreement</button>
        </app-page-header>

        <div class="plat-card empty-card" *ngIf="!agreements().length">No agreements found. Create one to get started.</div>

        <div class="ag-list" *ngIf="agreements().length">
          <div class="plat-card ag-row" *ngFor="let ag of agreements()" (click)="select(ag)">
            <div>
              <p class="row-title">{{ ag.employeeName }}</p>
              <p class="row-sub">{{ ag.postTitle }} — {{ ag.departmentName }}</p>
            </div>
            <div class="row-end">
              <span *ngIf="ag.finalScore !== null && ag.finalScore !== undefined" class="score">{{ ag.finalScore.toFixed(1) }}</span>
              <span class="chip" [style.background]="color(ag.status).bg" [style.color]="color(ag.status).fg">{{ ag.status }}</span>
              <mat-icon class="muted">chevron_right</mat-icon>
            </div>
          </div>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .cycle-pick { width: 220px; margin-right: 8px; }
    .plat-card { padding: 16px; margin-bottom: 16px; }
    .empty-card { text-align: center; color: #94a3b8; padding: 40px 0; }
    .ag-list { display: flex; flex-direction: column; gap: 12px; }
    .ag-row { display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin-bottom: 0; transition: box-shadow .15s; }
    .ag-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .detail-head { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .who h2 { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
    .who p { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .actions { margin-left: auto; display: flex; gap: 8px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat { margin-bottom: 16px; }
    .stat .lbl { margin: 0; font-size: 13px; color: #64748b; }
    .stat .val { margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #1e293b; }
    .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .title { margin: 0; font-size: 15px; font-weight: 600; }
    .empty { text-align: center; color: #94a3b8; padding: 16px 0; font-size: 13px; }
    .row-list { display: flex; flex-direction: column; gap: 12px; }
    .row { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .row-title { margin: 0; font-weight: 500; color: #1e293b; }
    .row-sub { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .row-end { display: flex; align-items: center; gap: 10px; }
    .score { font-size: 18px; font-weight: 700; color: #334155; }
    .num { text-align: right; }
    .bold { font-weight: 500; }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .chip.outline { background: transparent; border: 1px solid var(--plat-border); color: #475569; }
    .blue { color: #3b82f6; } .red { color: #f87171; } .muted { color: #94a3b8; }
  `],
})
export class IndividualAgreementsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  cycles = signal<Cycle[]>([]);
  users = signal<User[]>([]);
  cycleId = signal<number | null>(null);
  agreements = signal<Agreement[]>([]);
  selectedAgreementId = signal<number | null>(null);
  kpas = signal<EmployeeKpa[]>([]);
  kpis = signal<EmployeeKpi[]>([]);

  detail = computed<Agreement | null>(() => {
    const id = this.selectedAgreementId();
    return id === null ? null : (this.agreements().find((a) => a.id === id) ?? null);
  });

  color(status: string): { bg: string; fg: string } {
    return STATUS_COLORS[status] ?? { bg: '#f1f5f9', fg: '#334155' };
  }

  ngOnInit() {
    forkJoin({
      cycles: this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))),
      users: this.api.get<User[]>('/auth/users').pipe(catchError(() => of([] as User[]))),
    }).subscribe(({ cycles, users }) => {
      this.cycles.set(Array.isArray(cycles) ? cycles : []);
      this.users.set(Array.isArray(users) ? users : []);
    });
    this.loadAgreements();
  }

  onCycle(id: number | null) { this.cycleId.set(id); this.loadAgreements(); }

  loadAgreements() {
    this.api.get<Agreement[]>('/agreements', { cycleId: this.cycleId() ?? undefined })
      .pipe(catchError(() => of([] as Agreement[])))
      .subscribe((r) => this.agreements.set(Array.isArray(r) ? r : []));
  }

  select(ag: Agreement) {
    this.selectedAgreementId.set(ag.id);
    this.loadKpas();
    this.loadKpis();
  }

  back() {
    this.selectedAgreementId.set(null);
    this.kpas.set([]);
    this.kpis.set([]);
  }

  loadKpas() {
    const id = this.selectedAgreementId(); if (!id) return;
    this.api.get<EmployeeKpa[]>(`/agreements/${id}/kpas`).pipe(catchError(() => of([] as EmployeeKpa[])))
      .subscribe((r) => this.kpas.set(Array.isArray(r) ? r : []));
  }

  loadKpis() {
    const id = this.selectedAgreementId(); if (!id) return;
    this.api.get<EmployeeKpi[]>(`/agreements/${id}/kpis`).pipe(catchError(() => of([] as EmployeeKpi[])))
      .subscribe((r) => this.kpis.set(Array.isArray(r) ? r : []));
  }

  openCreate() {
    const cid = this.cycleId();
    if (!cid) { this.toast.error('Select a cycle first'); return; }
    this.dialog.open(NewAgreementDialogComponent, { panelClass: 'plat-dialog', autoFocus: false, data: { users: this.users() } })
      .afterClosed().subscribe((res: AgreementForm | undefined) => {
        if (!res || !res.employeeId) return;
        this.api.post<Agreement>('/agreements', {
          cycleId: cid,
          employeeId: res.employeeId,
          employeeName: res.employeeName,
          postTitle: res.postTitle,
          departmentId: res.departmentId,
          departmentName: res.departmentName,
        }).pipe(
          tap(() => { this.toast.success('Agreement created'); this.loadAgreements(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  transition(action: string) {
    const id = this.selectedAgreementId(); if (!id) return;
    this.api.post<Agreement>(`/agreements/${id}/transition`, { action }).pipe(
      tap(() => { this.toast.success(`Agreement ${action}ed`); this.loadAgreements(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  openAddKpa() {
    this.dialog.open(KpaDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: false,
      data: { editing: false, value: { title: '', description: '', weighting: 0 } as KpaForm },
    }).afterClosed().subscribe((res: KpaForm | undefined) => {
      const id = this.selectedAgreementId();
      if (!res || !id) return;
      this.api.post<EmployeeKpa>(`/agreements/${id}/kpas`, res).pipe(
        tap(() => { this.toast.success('KPA added'); this.loadKpas(); }),
        catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  openEditKpa(kpa: EmployeeKpa) {
    this.dialog.open(KpaDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: false,
      data: { editing: true, value: { title: kpa.title ?? '', description: kpa.description ?? '', weighting: kpa.weighting ?? 0 } as KpaForm },
    }).afterClosed().subscribe((res: KpaForm | undefined) => {
      if (!res) return;
      this.api.put<EmployeeKpa>(`/employee-kpas/${kpa.id}`, res).pipe(
        tap(() => { this.toast.success('KPA updated'); this.loadKpas(); }),
        catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  deleteKpa(kpa: EmployeeKpa) {
    this.api.delete(`/employee-kpas/${kpa.id}`).pipe(
      tap(() => { this.toast.success('KPA deleted'); this.loadKpas(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  openAddKpi() {
    this.dialog.open(KpiDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: false,
      data: { editing: false, value: { kpaId: 0, kpiNumber: '', description: '', annualTarget: '', weighting: 0 } as KpiForm, kpas: this.kpas() },
    }).afterClosed().subscribe((res: KpiForm | undefined) => {
      const id = this.selectedAgreementId();
      if (!res || !id || !res.kpaId) return;
      this.api.post<EmployeeKpi>(`/agreements/${id}/kpis`, res).pipe(
        tap(() => { this.toast.success('KPI added'); this.loadKpis(); }),
        catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  openEditKpi(kpi: EmployeeKpi) {
    this.dialog.open(KpiDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: false,
      data: {
        editing: true,
        value: { kpaId: kpi.kpaId ?? 0, kpiNumber: kpi.kpiNumber ?? '', description: kpi.description ?? '', annualTarget: kpi.annualTarget ?? '', weighting: kpi.weighting ?? 0 } as KpiForm,
        kpas: this.kpas(),
      },
    }).afterClosed().subscribe((res: KpiForm | undefined) => {
      if (!res) return;
      this.api.put<EmployeeKpi>(`/employee-kpis/${kpi.id}`, res).pipe(
        tap(() => { this.toast.success('KPI updated'); this.loadKpis(); }),
        catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  deleteKpi(kpi: EmployeeKpi) {
    this.api.delete(`/employee-kpis/${kpi.id}`).pipe(
      tap(() => { this.toast.success('KPI deleted'); this.loadKpis(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }
}
