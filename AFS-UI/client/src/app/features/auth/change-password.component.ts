import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  template: `
    <div class="change-password-container">
      <div class="change-password-card">
        <div class="card-header">
          <div class="logo-section">
            <div class="logo-icon">
              <mat-icon style="font-size: 36px; width: 36px; height: 36px; color: #c5a55a;">account_balance</mat-icon>
            </div>
            <h1>PLATINUM</h1>
            <p class="subtitle">Annual Financial Statements</p>
          </div>
        </div>

        <div class="card-body">
          <h2>Change Your Password</h2>
          <p class="description">
            For security reasons, you must change your temporary password before continuing.
          </p>

          <div class="form-group">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Current Password</mat-label>
              <input matInput [type]="showCurrent ? 'text' : 'password'" [(ngModel)]="currentPassword">
              <button mat-icon-button matSuffix (click)="showCurrent = !showCurrent" type="button">
                <mat-icon>{{ showCurrent ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input matInput [type]="showNew ? 'text' : 'password'" [(ngModel)]="newPassword">
              <button mat-icon-button matSuffix (click)="showNew = !showNew" type="button">
                <mat-icon>{{ showNew ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm New Password</mat-label>
              <input matInput [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="confirmPassword">
              <button mat-icon-button matSuffix (click)="showConfirm = !showConfirm" type="button">
                <mat-icon>{{ showConfirm ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
            </mat-form-field>
          </div>

          @if (errorMessage) {
            <div class="error-message">{{ errorMessage }}</div>
          }

          @if (successMessage) {
            <div class="success-message">{{ successMessage }}</div>
          }

          <button mat-flat-button class="submit-btn" (click)="onSubmit()" [disabled]="loading || !isValid()">
            @if (loading) {
              Changing Password...
            } @else {
              Change Password & Continue
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .change-password-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a2332 0%, #2a3f5f 100%);
      padding: 24px;
    }
    .change-password-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .card-header {
      background: #1a2332;
      padding: 32px;
      text-align: center;
    }
    .logo-icon {
      width: 64px;
      height: 64px;
      background: rgba(197,165,90,0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
    }
    .card-header h1 {
      color: #fff;
      margin: 0;
      font-size: 22px;
      letter-spacing: 6px;
      font-weight: 300;
    }
    .subtitle {
      color: #7eb8da;
      margin: 4px 0 0;
      font-size: 12px;
    }
    .card-body {
      padding: 32px;
    }
    .card-body h2 {
      color: #1a2332;
      margin: 0 0 8px;
      font-size: 20px;
    }
    .description {
      color: #666;
      margin: 0 0 24px;
      font-size: 14px;
      line-height: 1.5;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .full-width {
      width: 100%;
    }
    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 13px;
      border-left: 3px solid #dc2626;
    }
    .success-message {
      background: #f0fdf4;
      color: #16a34a;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 13px;
      border-left: 3px solid #16a34a;
    }
    .submit-btn {
      width: 100%;
      padding: 12px;
      background: #3b82f6;
      color: #fff;
      font-size: 15px;
      font-weight: 500;
      border-radius: 6px;
    }
    .submit-btn:disabled {
      background: #94a3b8;
    }
  `],
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  isValid(): boolean {
    return this.currentPassword.length > 0
      && this.newPassword.length >= 8
      && this.newPassword === this.confirmPassword;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New passwords do not match.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'New password must be at least 8 characters.';
      return;
    }

    if (this.newPassword === this.currentPassword) {
      this.errorMessage = 'New password must be different from your current password.';
      return;
    }

    this.loading = true;
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Password changed successfully. Redirecting...';
        this.authService.clearMustResetPassword();
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to change password. Please check your current password and try again.';
      },
    });
  }
}
