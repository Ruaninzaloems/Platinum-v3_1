import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SiteInfo } from '@platinumv3/shared/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand-section">
          <div class="brand-icon">
            <span class="material-icons shield-icon">verified_user</span>
          </div>
          <h1>Platinum ERP</h1>
          <p class="subtitle">Municipal Management System</p>
          <div class="divider"></div>
          <p class="description">
            Integrated asset management, supply chain, point of sale, payroll, IDP, budgeting,
            performance reporting and annual financial statements platform for South African local government.
          </p>
          <div class="features">
            <div class="feature"><span class="material-icons check">check_circle</span><span>mSCOA &amp; GRAP Compliant</span></div>
            <div class="feature"><span class="material-icons check">check_circle</span><span>MFMA &amp; SCM Regulation Compliant</span></div>
            <div class="feature"><span class="material-icons check">check_circle</span><span>End-to-End Municipal Lifecycle</span></div>
            <div class="feature"><span class="material-icons check">check_circle</span><span>Real-Time Audit Trail</span></div>
            <div class="feature"><span class="material-icons check">check_circle</span><span>Eight Integrated Modules</span></div>
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
        <div class="login-card">
          <h2 class="card-title">Sign In</h2>
          <p class="card-subtitle">Enter your credentials to access the system</p>
          @if (errorMessage()) {
            <div class="error-banner">
              <span class="material-icons">error</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }
          <form (ngSubmit)="onLogin()" autocomplete="on">
            <div class="form-field">
              <label for="site">Site</label>
              <div class="input-wrap">
                <span class="material-icons input-icon">location_city</span>
                <select id="site" [(ngModel)]="selectedSite" name="site">
                  @for (s of sites(); track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                  @if (sites().length === 0) {
                    <option value="george">George Municipality</option>
                  }
                </select>
              </div>
            </div>
            <div class="form-field">
              <label for="username">Username</label>
              <div class="input-wrap">
                <span class="material-icons input-icon">person</span>
                <input id="username" type="text" [(ngModel)]="username" name="username" required autocomplete="username">
              </div>
            </div>
            <div class="form-field">
              <label for="password">Password</label>
              <div class="input-wrap">
                <span class="material-icons input-icon">lock</span>
                <input id="password" [type]="hidePassword() ? 'password' : 'text'" [(ngModel)]="password" name="password" required autocomplete="current-password">
                <button type="button" class="suffix-btn" (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'">
                  <span class="material-icons">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
            <button type="submit" class="login-btn" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner" aria-label="Signing in"></span>
              } @else {
                Sign In
              }
            </button>
          </form>
          <div class="demo-credentials">
            <div class="demo-header"><span class="material-icons">info</span><span>Demo Credentials</span></div>
            <div class="demo-body">
              <div class="cred-label">SYSTEM ADMIN</div>
              <div class="cred-value">admin</div>
              <div class="cred-label">Password: <strong>admin123</strong></div>
            </div>
          </div>
        </div>
        <div class="footer">&copy; 2026 Platinum ERP Solutions. All rights reserved.</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .login-page { display: flex; height: 100vh; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
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
    h1 { font-size: 2.5rem; font-weight: 700; margin: 0 0 0.25rem; }
    .subtitle { color: #f9a825; font-size: 1.1rem; font-weight: 500; margin: 0 0 1rem; }
    .divider { width: 60px; height: 3px; background: #3f51b5; margin-bottom: 1.5rem; }
    .description { color: #b0bec5; line-height: 1.6; margin-bottom: 2rem; }
    .features { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
    .feature { display: flex; align-items: center; gap: 0.75rem; }
    .check { color: #4caf50; font-size: 20px; }
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
    .login-card {
      max-width: 420px; width: 100%; padding: 2rem; border-radius: 12px;
      background: #ffffff; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
    }
    .card-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; color: #0f172a; }
    .card-subtitle { color: #64748b; margin: 0 0 1.5rem; font-size: 0.9rem; }
    .form-field { margin-bottom: 1rem; }
    .form-field label {
      display: block; font-size: 0.75rem; font-weight: 600; color: #475569;
      letter-spacing: 0.4px; margin-bottom: 0.35rem; text-transform: uppercase;
    }
    .input-wrap {
      position: relative; display: flex; align-items: center;
      border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .input-wrap:focus-within {
      border-color: #3f51b5;
      box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.15);
    }
    .input-icon {
      color: #94a3b8; font-size: 20px; padding-left: 12px;
    }
    .input-wrap input,
    .input-wrap select {
      flex: 1; border: 0; outline: none; background: transparent;
      padding: 12px 12px 12px 10px; font-size: 0.95rem; color: #0f172a;
      font-family: inherit;
    }
    .input-wrap select { appearance: none; padding-right: 32px; cursor: pointer; }
    .input-wrap:has(select)::after {
      content: ''; position: absolute; right: 14px; top: 50%;
      width: 8px; height: 8px; border-right: 2px solid #64748b;
      border-bottom: 2px solid #64748b;
      transform: translateY(-70%) rotate(45deg); pointer-events: none;
    }
    .suffix-btn {
      background: transparent; border: 0; padding: 6px 10px; cursor: pointer;
      color: #64748b; display: flex; align-items: center;
    }
    .suffix-btn:hover { color: #0f172a; }
    .login-btn {
      width: 100%; height: 48px; margin-top: 0.5rem;
      background: #3f51b5; color: white; border: 0; border-radius: 8px;
      font-size: 1rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background-color 0.15s;
    }
    .login-btn:hover:not(:disabled) { background: #303f9f; }
    .login-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
    .spinner {
      width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem; background: #fdecea; color: #d32f2f;
      border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem;
    }
    .error-banner .material-icons { font-size: 20px; }
    .demo-credentials {
      margin-top: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
    }
    .demo-header {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem; background: #e3f2fd; color: #1565c0;
      font-weight: 600; font-size: 0.875rem;
    }
    .demo-header .material-icons { font-size: 18px; }
    .demo-body { padding: 0.75rem 1rem; }
    .cred-label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
    .cred-value { font-size: 1rem; font-weight: 500; color: #0f172a; }
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
          this.bridgeScmAuth(this.username, this.password);
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
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

  /**
   * Fire-and-forget: best-effort attempt to also obtain a JWT from the Azure SCM
   * backend so SCM API calls work for the same session. Must never block the main
   * login flow — if Azure is slow/unreachable the user has already been navigated
   * to the dashboard, and the SCM scmBootstrapGuard will perform a silent admin
   * login on first navigation into /scm.
   */
  private bridgeScmAuth(username: string, password: string): void {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    fetch('https://rep-scm-api.azurewebsites.net/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : null)
      .then(resp => {
        const token = resp?.data?.token;
        if (token) localStorage.setItem('platinum_token', token);
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  }
}
