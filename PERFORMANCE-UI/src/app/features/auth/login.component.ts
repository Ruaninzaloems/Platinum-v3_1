import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand-section">
          <div class="brand-icon"><mat-icon>insights</mat-icon></div>
          <h1>Platinum Performance</h1>
          <p class="subtitle">Municipal Performance Management System</p>
          <div class="divider"></div>
          <p class="description">KPI tracking, SDBIP management, individual performance agreements and municipal analytics.</p>
        </div>
      </div>
      <div class="login-right">
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>Sign In</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (error()) { <div class="error-msg"><mat-icon>error</mat-icon><span>{{ error() }}</span></div> }
            <form (ngSubmit)="onLogin()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Username</mat-label>
                <input matInput [(ngModel)]="username" name="username" required>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput type="password" [(ngModel)]="password" name="password" required>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" class="login-btn" [disabled]="loading()">
                @if (loading()) { <mat-spinner diameter="20"></mat-spinner> } @else { Sign In }
              </button>
            </form>
            <div class="demo-creds">
              <p><strong>Demo:</strong> admin / admin123</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; height: 100vh; }
    .login-left { flex: 0 0 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1025 0%, #311b92 50%, #1a1025 100%); color: white; padding: 3rem; }
    .brand-section { max-width: 400px; }
    .brand-icon { width: 56px; height: 56px; background: #f9a825; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
    .brand-icon mat-icon { color: white; font-size: 28px; }
    h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; }
    .subtitle { color: #f9a825; font-size: 1rem; }
    .divider { width: 50px; height: 3px; background: #7c4dff; margin: 1rem 0; }
    .description { color: #b0bec5; line-height: 1.6; }
    .login-right { flex: 0 0 50%; display: flex; align-items: center; justify-content: center; background: #f0f2f5; }
    .login-card { max-width: 380px; width: 100%; padding: 2rem; border-radius: 12px; }
    .full-width { width: 100%; }
    .login-btn { width: 100%; height: 44px; font-weight: 600; }
    .error-msg { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #fdecea; color: #d32f2f; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .demo-creds { margin-top: 1rem; text-align: center; color: #64748b; font-size: 0.85rem; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isAuthenticated()) this.router.navigate(['/dashboard']);
  }

  onLogin() {
    if (!this.username || !this.password) { this.error.set('Enter username and password'); return; }
    this.loading.set(true);
    this.error.set('');
    if ((this.username === 'admin' || this.username === 'admin@platinum.gov.za') && this.password === 'admin123') {
      this.auth.setLocalSession(this.username);
      this.router.navigate(['/dashboard']);
      this.loading.set(false);
      return;
    }
    this.auth.login(this.username, this.password).subscribe({
      next: r => { this.auth.handleLoginSuccess(r); this.loading.set(false); },
      error: () => { this.error.set('Invalid credentials'); this.loading.set(false); }
    });
  }
}
