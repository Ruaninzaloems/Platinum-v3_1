import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, SiteInfo } from '@platinumv3/shared/auth';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand-section">
          <div class="brand-icon">
            <mat-icon class="shield-icon">verified_user</mat-icon>
          </div>
          <h1>Platinum ERP</h1>
          <p class="subtitle">Municipal Management System</p>
          <div class="divider"></div>
          <p class="description">
            Integrated asset management, supply chain, point of sale, payroll, IDP, budgeting,
            performance reporting and annual financial statements platform for South African local government.
          </p>
          <div class="features">
            <div class="feature"><mat-icon class="check">check_circle</mat-icon><span>mSCOA & GRAP Compliant</span></div>
            <div class="feature"><mat-icon class="check">check_circle</mat-icon><span>MFMA & SCM Regulation Compliant</span></div>
            <div class="feature"><mat-icon class="check">check_circle</mat-icon><span>End-to-End Municipal Lifecycle</span></div>
            <div class="feature"><mat-icon class="check">check_circle</mat-icon><span>Real-Time Audit Trail</span></div>
            <div class="feature"><mat-icon class="check">check_circle</mat-icon><span>Eight Integrated Modules</span></div>
          </div>
          <div class="module-badges">
            <span class="badge">ASSETS</span>
            <span class="badge">SCM</span>
            <span class="badge">POS</span>
            <span class="badge">PAYROLL</span>
            <span class="badge">IDP</span>
            <span class="badge">PERFORMANCE</span>
            <span class="badge">BUDGET</span>
            <span class="badge">AFS</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>Sign In</mat-card-title>
            <mat-card-subtitle>Enter your credentials to access the system</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (errorMessage()) {
              <div class="error-banner">
                <mat-icon>error</mat-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }
            <form (ngSubmit)="onLogin()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Site</mat-label>
                <mat-icon matPrefix>location_city</mat-icon>
                <mat-select [(ngModel)]="selectedSite" name="site">
                  @for (s of sites(); track s.id) {
                    <mat-option [value]="s.id">{{ s.name }}</mat-option>
                  }
                  @if (sites().length === 0) {
                    <mat-option value="george">George Municipality</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Username</mat-label>
                <mat-icon matPrefix>person</mat-icon>
                <input matInput [(ngModel)]="username" name="username" required autocomplete="username">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" [(ngModel)]="password" name="password" required autocomplete="current-password">
                <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" class="login-btn" [disabled]="loading()">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Sign In
                }
              </button>
            </form>
            <div class="demo-credentials">
              <div class="demo-header"><mat-icon>info</mat-icon><span>Demo Credentials</span></div>
              <div class="demo-body">
                <div class="cred-label">SYSTEM ADMIN</div>
                <div class="cred-value">admin</div>
                <div class="cred-label">Password: <strong>admin123</strong></div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <div class="footer">&copy; 2026 Platinum ERP Solutions. All rights reserved.</div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; height: 100vh; }
    .login-left {
      flex: 0 0 50%; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f1628 0%, #1a237e 50%, #0f1628 100%);
      color: white; padding: 3rem;
    }
    .brand-section { max-width: 500px; }
    .brand-icon {
      width: 64px; height: 64px; background: #f9a825; border-radius: 16px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;
    }
    .shield-icon { font-size: 32px; color: white; }
    h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .subtitle { color: #f9a825; font-size: 1.1rem; font-weight: 500; margin-bottom: 1rem; }
    .divider { width: 60px; height: 3px; background: #3f51b5; margin-bottom: 1.5rem; }
    .description { color: #b0bec5; line-height: 1.6; margin-bottom: 2rem; }
    .features { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
    .feature { display: flex; align-items: center; gap: 0.75rem; }
    .check { color: #4caf50; font-size: 20px; width: 20px; height: 20px; }
    .module-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .badge {
      padding: 0.35rem 0.75rem; background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2); border-radius: 20px;
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px;
    }
    .login-right {
      flex: 0 0 50%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 3rem; background: #f0f2f5;
    }
    .login-card { max-width: 420px; width: 100%; padding: 2rem; border-radius: 12px; }
    mat-card-title { font-size: 1.5rem !important; font-weight: 700 !important; }
    mat-card-subtitle { margin-top: 0.25rem !important; }
    .full-width { width: 100%; margin-bottom: 0.5rem; }
    .login-btn { width: 100%; height: 48px; font-size: 1rem; font-weight: 600; margin-top: 0.5rem; }
    .error-banner {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem; background: #fdecea; color: #d32f2f;
      border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem;
    }
    .demo-credentials {
      margin-top: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
    }
    .demo-header {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem; background: #e3f2fd; color: #1565c0;
      font-weight: 600; font-size: 0.875rem;
    }
    .demo-body { padding: 0.75rem 1rem; }
    .cred-label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
    .cred-value { font-size: 1rem; font-weight: 500; }
    .footer { margin-top: 2rem; color: #94a3b8; font-size: 0.8rem; }

    @media (max-width: 768px) {
      .login-page { flex-direction: column; }
      .login-left { flex: 0 0 auto; padding: 2rem; }
      .login-right { flex: 1; }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  selectedSite = 'george';
  sites = signal<SiteInfo[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.authService.loadSites().subscribe({
      next: (list) => this.sites.set(list || []),
      error: () => this.sites.set([{ id: 'george', name: 'George Municipality' }]),
    });
  }

  onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage.set('Please enter both username and password');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.username, this.password, this.selectedSite).subscribe({
      next: (response) => {
        if (response.success) {
          this.bridgeScmAuth(this.username, this.password).then(() => {
            this.router.navigate(['/dashboard']);
            this.loading.set(false);
          });
        } else {
          this.errorMessage.set(response.error || 'Invalid username or password');
          this.loading.set(false);
        }
      },
      error: () => {
        this.errorMessage.set('Login service unavailable. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private http = inject(HttpClient);

  /**
   * Best-effort: also obtain a JWT from the Azure SCM backend so SCM API
   * calls work for the same session. If it fails, SCM data calls will fall
   * back to the bootstrap guard's silent admin login.
   */
  private bridgeScmAuth(username: string, password: string): Promise<void> {
    return new Promise((resolve) => {
      this.http.post<any>(
        'https://rep-scm-api.azurewebsites.net/api/auth/login',
        { username, password }
      ).subscribe({
        next: (resp) => {
          const token = resp?.data?.token;
          if (token) localStorage.setItem('platinum_token', token);
          resolve();
        },
        error: () => resolve()
      });
    });
  }
}
