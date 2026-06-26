import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AccessManagementService, AmUser, AmRole } from './access-management.service';

/**
 * Settings → Access Management.
 *
 * Lists users (GET /george-app/api/User) with their assigned roles, and lets an admin
 * edit a user's role assignment against the role catalogue (GET /george-app/api/usermodules/roles).
 * Routed at /settings/access-management and /admin-settings/access-management.
 */
@Component({
  selector: 'app-access-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatPaginatorModule, MatProgressBarModule, MatTooltipModule, MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="am-page">
      <div class="am-toolbar">
        <button class="am-circle" mat-icon-button matTooltip="Filter" (click)="showFilter.set(!showFilter())">
          <mat-icon>filter_list</mat-icon>
        </button>
        <button class="am-circle" mat-icon-button matTooltip="Refresh" (click)="reload()">
          <mat-icon>refresh</mat-icon>
        </button>
        @if (showFilter()) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="am-search">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Search by name, email, role…" [(ngModel)]="search" (ngModelChange)="onSearch()">
          </mat-form-field>
        }
        <span class="am-count">{{ filtered().length }} user{{ filtered().length === 1 ? '' : 's' }}</span>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }

      @if (error()) {
        <div class="am-error">
          <mat-icon>error_outline</mat-icon>
          <div>
            <strong>Could not load users.</strong>
            <div>{{ error() }}</div>
          </div>
        </div>
      }

      <div class="am-table-wrap">
        <table class="am-table">
          <thead>
            <tr>
              <th style="width:90px">User ID</th>
              <th style="width:180px">Name</th>
              <th style="width:240px">Email</th>
              <th style="width:90px">Enabled</th>
              <th>Assigned Roles</th>
              <th style="width:90px;text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of pageRows(); track u.userId) {
              <tr>
                <td>{{ u.userId }}</td>
                <td>{{ u.name || '—' }}</td>
                <td class="am-email">{{ u.email || '—' }}</td>
                <td><span class="am-pill" [class.on]="u.enabled">{{ u.enabled ? 'Yes' : 'No' }}</span></td>
                <td class="am-roles">{{ u.roles.length ? u.roles.join(', ') : '—' }}</td>
                <td style="text-align:right">
                  <button mat-icon-button class="am-edit" matTooltip="Edit access" (click)="edit(u)">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </tr>
            }
            @if (!loading() && !pageRows().length) {
              <tr><td colspan="6" class="am-empty">No users to display.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <mat-paginator
        [length]="filtered().length"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="[5, 10, 25, 50]"
        (page)="onPage($event)">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .am-page { padding: 16px 24px; }
    .am-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .am-circle { background:#e8eef7; border-radius:50%; }
    .am-search { width:340px; }
    .am-count { margin-left:auto; font-size:12px; color:#64748b; }
    .am-error { display:flex; gap:10px; align-items:flex-start; background:#fef2f2; border:1px solid #fecaca;
                color:#b91c1c; padding:12px 14px; border-radius:8px; margin-bottom:12px; font-size:13px; }
    .am-table-wrap { background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:auto; }
    .am-table { width:100%; border-collapse:collapse; font-size:13px; }
    .am-table thead th { text-align:left; padding:14px 16px; color:#475569; font-weight:600; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
    .am-table tbody td { padding:14px 16px; border-bottom:1px solid #f1f5f9; color:#1e293b; vertical-align:top; }
    .am-table tbody tr:last-child td { border-bottom:none; }
    .am-email { color:#475569; }
    .am-roles { color:#334155; line-height:1.5; }
    .am-pill { display:inline-block; padding:3px 12px; border-radius:999px; background:#e2e8f0; color:#475569; font-weight:600; font-size:12px; }
    .am-pill.on { background:#dcfce7; color:#166534; }
    .am-edit { color:#ea8b35; }
    .am-empty { text-align:center; color:#94a3b8; padding:32px; }
    mat-paginator { background:transparent; margin-top:8px; }
  `]
})
export class AccessManagementComponent implements OnInit {
  private svc = inject(AccessManagementService);
  private dialog = inject(MatDialog);

  users = signal<AmUser[]>([]);
  roles = signal<AmRole[]>([]);
  loading = signal(false);
  error = signal('');
  showFilter = signal(false);
  search = '';
  private searchTerm = signal('');
  pageIndex = signal(0);
  pageSize = signal(5);

  filtered = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      u.roles.join(',').toLowerCase().includes(q));
  });

  pageRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getRoles().subscribe({ next: (r) => this.roles.set(r), error: () => { /* roles are best-effort */ } });
    this.svc.getUsers().subscribe({
      next: (u) => { this.users.set(u); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.msg(err));
      },
    });
  }

  onSearch() { this.searchTerm.set(this.search); this.pageIndex.set(0); }
  onPage(e: PageEvent) { this.pageIndex.set(e.pageIndex); this.pageSize.set(e.pageSize); }

  edit(user: AmUser) {
    const ref = this.dialog.open(EditAccessDialogComponent, {
      width: '520px',
      data: { user, roles: this.roles() },
    });
    ref.afterClosed().subscribe((selected: string[] | undefined) => {
      if (!selected) return;
      this.svc.saveUserRoles(user, selected).subscribe({
        next: () => this.reload(),
        error: (err) => this.error.set('Saving roles failed: ' + this.msg(err)),
      });
    });
  }

  private msg(err: any): string {
    if (err?.status === 401) return 'Not authorised (401). The George API needs its own Bearer token — see notes.';
    return err?.error?.message || err?.message || `Request failed (HTTP ${err?.status ?? '?'}).`;
  }
}

/** Edit-roles dialog: check/uncheck the roles assigned to a user. */
@Component({
  selector: 'app-edit-access-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px;color:#ea8b35">manage_accounts</mat-icon>
      Edit Access — {{ data.user.name || data.user.userId }}
    </h2>
    <mat-dialog-content>
      <p style="color:#64748b;font-size:13px;margin:0 0 12px">Assign the roles this user should have.</p>
      @if (!data.roles.length) {
        <p style="color:#b91c1c;font-size:13px">No role catalogue loaded (could not read the roles API).</p>
      }
      <div class="role-grid">
        @for (r of data.roles; track r.id) {
          <mat-checkbox [checked]="isOn(r.name)" (change)="toggle(r.name, $event.checked)">{{ r.name }}</mat-checkbox>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="ref.close(current())">
        <mat-icon>save</mat-icon> Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .role-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; max-height:340px; overflow:auto; }
  `]
})
export class EditAccessDialogComponent {
  ref = inject(MatDialogRef<EditAccessDialogComponent>);
  data = inject<{ user: AmUser; roles: AmRole[] }>(MAT_DIALOG_DATA);
  private selected = signal<Set<string>>(new Set(this.data.user.roles));

  isOn(name: string) { return this.selected().has(name); }
  toggle(name: string, on: boolean) {
    const next = new Set(this.selected());
    if (on) next.add(name); else next.delete(name);
    this.selected.set(next);
  }
  current() { return Array.from(this.selected()); }
}
