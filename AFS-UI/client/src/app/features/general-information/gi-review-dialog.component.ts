import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApiService } from '../../core/services/api.service';

interface TenantUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Recipient {
  recipientType: 'internal' | 'external';
  userId?: string;
  email: string;
  displayName: string;
}

@Component({
  selector: 'app-gi-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatChipsModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatTabsModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>Submit General Information for Review</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Review Type</mat-label>
          <mat-select [(ngModel)]="requestType">
            <mat-option value="review_only">Review Only</mat-option>
            <mat-option value="comment">Request Comments</mat-option>
            <mat-option value="input_requested">Input Requested</mat-option>
            <mat-option value="factual_verification">Factual Verification</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Message (optional)</mat-label>
          <textarea matInput [(ngModel)]="message" rows="3" placeholder="Add a note for the reviewer..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Due Date (optional)</mat-label>
          <input matInput [matDatepicker]="duePicker" [(ngModel)]="dueDate">
          <mat-datepicker-toggle matIconSuffix [for]="duePicker"></mat-datepicker-toggle>
          <mat-datepicker #duePicker></mat-datepicker>
        </mat-form-field>

        <mat-divider></mat-divider>

        <h3 class="recipients-title">Recipients</h3>

        <mat-tab-group [(selectedIndex)]="recipientTabIndex" class="recipient-tabs">
          <mat-tab label="Internal Users">
            <div class="tab-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Search users</mat-label>
                <input matInput [(ngModel)]="userSearchQuery" (ngModelChange)="filterUsers()" [matAutocomplete]="userAuto" placeholder="Type to search...">
                <mat-autocomplete #userAuto="matAutocomplete" (optionSelected)="addInternalRecipient($event.option.value)">
                  @for (user of filteredUsers; track user.id) {
                    <mat-option [value]="user">
                      {{ user.firstName }} {{ user.lastName }} ({{ user.email }})
                    </mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>
          </mat-tab>
          <mat-tab label="External Email">
            <div class="tab-content">
              <div class="external-add-row">
                <mat-form-field appearance="outline" class="recipient-name-field">
                  <mat-label>Name</mat-label>
                  <input matInput [(ngModel)]="newExternalName" placeholder="Reviewer name">
                </mat-form-field>
                <mat-form-field appearance="outline" class="recipient-email-field">
                  <mat-label>Email</mat-label>
                  <input matInput [(ngModel)]="newExternalEmail" type="email" placeholder="reviewer@example.com">
                </mat-form-field>
                <button mat-icon-button color="primary" (click)="addExternalRecipient()" [disabled]="!newExternalEmail || !newExternalEmail.includes('@')" class="add-ext-btn">
                  <mat-icon>add_circle</mat-icon>
                </button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>

        @if (recipients.length > 0) {
          <div class="recipients-list">
            @for (r of recipients; track $index; let i = $index) {
              <div class="recipient-chip">
                <mat-icon class="chip-icon">{{ r.recipientType === 'internal' ? 'person' : 'email' }}</mat-icon>
                <span class="chip-label">{{ r.displayName }}</span>
                @if (r.recipientType === 'external') {
                  <span class="chip-email">({{ r.email }})</span>
                }
                <button mat-icon-button class="chip-remove" (click)="removeRecipient(i)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!canSubmit()" class="submit-btn">
        <mat-icon>send</mat-icon> Send for Review
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 480px; }
    .full-width { width: 100%; }
    .recipients-title { margin: 8px 0 4px; font-size: 15px; font-weight: 600; color: #1e293b; }
    .recipient-tabs { margin-bottom: 8px; }
    .tab-content { padding: 12px 0 0; }
    .external-add-row { display: flex; gap: 8px; align-items: flex-start; }
    .recipient-name-field { flex: 1; }
    .recipient-email-field { flex: 1.5; }
    .add-ext-btn { margin-top: 8px; }
    .recipients-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .recipient-chip {
      display: flex; align-items: center; gap: 4px;
      background: #e3f2fd; border-radius: 20px; padding: 4px 8px 4px 12px;
      font-size: 13px;
    }
    .chip-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    .chip-label { font-weight: 500; color: #1e293b; }
    .chip-email { color: #64748b; font-size: 12px; }
    .chip-remove { width: 24px !important; height: 24px !important; line-height: 24px !important; }
    .chip-remove mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .submit-btn { background: #1565c0 !important; color: white !important; }
    mat-dialog-content { max-height: 70vh; }
  `],
})
export class GiReviewDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GiReviewDialogComponent>);
  private api = inject(ApiService);

  requestType = 'review_only';
  message = '';
  dueDate: Date | null = null;
  recipients: Recipient[] = [];

  tenantUsers: TenantUser[] = [];
  filteredUsers: TenantUser[] = [];
  userSearchQuery = '';
  recipientTabIndex = 0;

  newExternalName = '';
  newExternalEmail = '';

  ngOnInit() {
    this.loadTenantUsers();
  }

  loadTenantUsers() {
    this.api.get<any[]>('/general-information/tenant-users').subscribe({
      next: (users) => {
        this.tenantUsers = users.map(u => ({
          id: u.id,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
        }));
        this.filteredUsers = [...this.tenantUsers];
      },
      error: () => {
        this.tenantUsers = [];
        this.filteredUsers = [];
      },
    });
  }

  filterUsers() {
    const q = this.userSearchQuery.toLowerCase();
    const addedIds = new Set(this.recipients.filter(r => r.recipientType === 'internal').map(r => r.userId));
    this.filteredUsers = this.tenantUsers.filter(u =>
      !addedIds.has(u.id) &&
      (`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
    );
  }

  addInternalRecipient(user: TenantUser) {
    if (this.recipients.some(r => r.recipientType === 'internal' && r.userId === user.id)) return;
    this.recipients.push({
      recipientType: 'internal',
      userId: user.id,
      email: user.email,
      displayName: `${user.firstName} ${user.lastName}`.trim() || user.email,
    });
    this.userSearchQuery = '';
    this.filterUsers();
  }

  addExternalRecipient() {
    if (!this.newExternalEmail || !this.newExternalEmail.includes('@')) return;
    this.recipients.push({
      recipientType: 'external',
      email: this.newExternalEmail.trim(),
      displayName: this.newExternalName?.trim() || this.newExternalEmail.trim(),
    });
    this.newExternalName = '';
    this.newExternalEmail = '';
  }

  removeRecipient(index: number) {
    this.recipients.splice(index, 1);
    this.filterUsers();
  }

  canSubmit(): boolean {
    return this.recipients.length > 0;
  }

  submit() {
    if (this.recipients.length === 0) return;

    const validRecipients = this.recipients.map(r => ({
      recipientType: r.recipientType,
      ...(r.userId ? { userId: r.userId } : {}),
      email: r.email?.trim() || '',
      displayName: r.displayName?.trim() || r.email?.trim() || '',
    }));

    let dueDateStr: string | undefined;
    if (this.dueDate) {
      const d = this.dueDate;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dueDateStr = `${y}-${m}-${day}`;
    }

    this.dialogRef.close({
      requestType: this.requestType,
      message: this.message || undefined,
      dueDate: dueDateStr,
      recipients: validRecipients,
    });
  }
}
