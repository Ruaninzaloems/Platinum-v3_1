import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

interface CompetencyTemplate {
  id: number;
  name: string;
  description: string | null;
  postLevel: string | null;
  isActive: boolean;
}

interface CompetencyItem {
  id: number;
  templateId: number;
  competencyName: string;
  description: string | null;
  weighting: number;
}

interface TemplateForm { name: string; description: string; postLevel: string; }
interface ItemForm { competencyName: string; description: string; weighting: number; }

// ─── Template Dialog (create / edit) ────────────────────────────────────────
@Component({
  selector: 'app-competency-template-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.editing ? 'Edit Competency Template' : 'New Competency Template' }}</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="form.name" name="name" required /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput [(ngModel)]="form.description" name="desc" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Post Level</mat-label><input matInput [(ngModel)]="form.postLevel" name="post" placeholder="e.g., Senior Manager" /></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!form.name.trim()" (click)="ref.close(form)">{{ data.editing ? 'Save Changes' : 'Create' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } mat-form-field { width: 100%; }`],
})
export class CompetencyTemplateDialogComponent {
  form: TemplateForm;
  constructor(
    public ref: MatDialogRef<CompetencyTemplateDialogComponent, TemplateForm | null>,
    @Inject(MAT_DIALOG_DATA) public data: { editing: boolean; value: TemplateForm },
  ) { this.form = { ...data.value }; }
}

// ─── Item Dialog ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-competency-item-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Add Competency</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline"><mat-label>Competency Name</mat-label><input matInput [(ngModel)]="form.competencyName" name="name" required /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput [(ngModel)]="form.description" name="desc" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Weighting (%)</mat-label><input matInput type="number" [(ngModel)]="form.weighting" name="w" /></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!form.competencyName.trim()" (click)="ref.close(form)">Add</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } mat-form-field { width: 100%; }`],
})
export class CompetencyItemDialogComponent {
  form: ItemForm = { competencyName: '', description: '', weighting: 0 };
  constructor(public ref: MatDialogRef<CompetencyItemDialogComponent, ItemForm | null>) {}
}

// ─── Main Page ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-competency-templates',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <ng-container *ngIf="detail() as t; else listView">
        <!-- ── Detail View ── -->
        <div class="detail-head">
          <button mat-button (click)="back()"><mat-icon>arrow_back</mat-icon> Back</button>
          <div class="who">
            <h2>{{ t.name }}</h2>
            <p *ngIf="t.postLevel">Post Level: {{ t.postLevel }}</p>
          </div>
          <span class="chip" [style.background]="t.isActive ? '#dcfce7' : '#f1f5f9'" [style.color]="t.isActive ? '#15803d' : '#475569'">{{ t.isActive ? 'Active' : 'Inactive' }}</span>
          <div class="actions">
            <button mat-stroked-button (click)="openEditTemplate(t)"><mat-icon>edit</mat-icon> Edit Template</button>
            <button mat-flat-button color="primary" (click)="openAddItem()"><mat-icon>add</mat-icon> Add Competency</button>
          </div>
        </div>

        <div class="plat-card">
          <h3 class="title">Competencies</h3>
          <p *ngIf="!items().length" class="empty">No competencies defined</p>
          <div class="row-list" *ngIf="items().length">
            <div class="row" *ngFor="let item of items()">
              <div>
                <p class="row-title">{{ item.competencyName }}</p>
                <p *ngIf="item.description" class="row-sub">{{ item.description }}</p>
              </div>
              <div class="row-end">
                <span class="chip outline">{{ item.weighting }}%</span>
                <button mat-icon-button (click)="deleteItem(item)"><mat-icon class="red">delete</mat-icon></button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #listView>
        <!-- ── List View ── -->
        <app-page-header title="Competency Templates" subtitle="Define competency frameworks by post level" icon="menu_book" tone="indigo">
          <button mat-flat-button color="primary" (click)="openCreate()"><mat-icon>add</mat-icon> New Template</button>
        </app-page-header>

        <div class="plat-card empty-card" *ngIf="!templates().length">No templates defined yet</div>

        <div class="grid" *ngIf="templates().length">
          <div class="plat-card t-card" *ngFor="let t of templates()" (click)="select(t)">
            <div class="t-head"><mat-icon class="muted">menu_book</mat-icon><p class="row-title">{{ t.name }}</p></div>
            <p *ngIf="t.description" class="row-sub">{{ t.description }}</p>
            <div class="t-tags">
              <span *ngIf="t.postLevel" class="chip outline">{{ t.postLevel }}</span>
              <span class="chip" [style.background]="t.isActive ? '#dcfce7' : '#f1f5f9'" [style.color]="t.isActive ? '#15803d' : '#475569'">{{ t.isActive ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .plat-card { padding: 16px; margin-bottom: 16px; }
    .empty-card { text-align: center; color: #94a3b8; padding: 40px 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .t-card { cursor: pointer; margin-bottom: 0; transition: box-shadow .15s; }
    .t-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .t-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .t-tags { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .detail-head { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .who h2 { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
    .who p { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .actions { margin-left: auto; display: flex; gap: 8px; }
    .title { margin: 0 0 12px; font-size: 15px; font-weight: 600; }
    .empty { text-align: center; color: #94a3b8; padding: 16px 0; font-size: 13px; }
    .row-list { display: flex; flex-direction: column; gap: 12px; }
    .row { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .row-title { margin: 0; font-weight: 500; color: #1e293b; }
    .row-sub { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .row-end { display: flex; align-items: center; gap: 10px; }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .chip.outline { background: transparent; border: 1px solid var(--plat-border); color: #475569; }
    .red { color: #f87171; } .muted { color: #94a3b8; }
  `],
})
export class CompetencyTemplatesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  templates = signal<CompetencyTemplate[]>([]);
  items = signal<CompetencyItem[]>([]);
  selectedTemplateId = signal<number | null>(null);

  detail = computed<CompetencyTemplate | null>(() => {
    const id = this.selectedTemplateId();
    return id === null ? null : (this.templates().find((t) => t.id === id) ?? null);
  });

  ngOnInit() { this.loadTemplates(); }

  loadTemplates() {
    this.api.get<CompetencyTemplate[]>('/competency-templates').pipe(catchError(() => of([] as CompetencyTemplate[])))
      .subscribe((r) => this.templates.set(Array.isArray(r) ? r : []));
  }

  loadItems() {
    const id = this.selectedTemplateId(); if (!id) return;
    this.api.get<CompetencyItem[]>(`/competency-templates/${id}/items`).pipe(catchError(() => of([] as CompetencyItem[])))
      .subscribe((r) => this.items.set(Array.isArray(r) ? r : []));
  }

  select(t: CompetencyTemplate) { this.selectedTemplateId.set(t.id); this.loadItems(); }
  back() { this.selectedTemplateId.set(null); this.items.set([]); }

  openCreate() {
    this.dialog.open(CompetencyTemplateDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: false,
      data: { editing: false, value: { name: '', description: '', postLevel: '' } as TemplateForm },
    }).afterClosed().subscribe((res: TemplateForm | undefined) => {
      if (!res) return;
      this.api.post<CompetencyTemplate>('/competency-templates', {
        name: res.name,
        description: res.description || undefined,
        postLevel: res.postLevel || undefined,
      }).pipe(
        tap(() => { this.toast.success('Template created'); this.loadTemplates(); }),
        catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  openEditTemplate(t: CompetencyTemplate) {
    this.dialog.open(CompetencyTemplateDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: false,
      data: { editing: true, value: { name: t.name ?? '', description: t.description ?? '', postLevel: t.postLevel ?? '' } as TemplateForm },
    }).afterClosed().subscribe((res: TemplateForm | undefined) => {
      if (!res) return;
      this.api.put<CompetencyTemplate>(`/competency-templates/${t.id}`, {
        name: res.name,
        description: res.description || undefined,
        postLevel: res.postLevel || undefined,
      }).pipe(
        tap(() => { this.toast.success('Template updated'); this.loadTemplates(); }),
        catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  openAddItem() {
    this.dialog.open(CompetencyItemDialogComponent, { panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((res: ItemForm | undefined) => {
        const id = this.selectedTemplateId();
        if (!res || !id) return;
        this.api.post<CompetencyItem>(`/competency-templates/${id}/items`, res).pipe(
          tap(() => { this.toast.success('Competency added'); this.loadItems(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  deleteItem(item: CompetencyItem) {
    this.api.delete(`/competency-items/${item.id}`).pipe(
      tap(() => { this.toast.success('Competency deleted'); this.loadItems(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }
}
