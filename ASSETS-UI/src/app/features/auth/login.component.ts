import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="login-container">
      <div class="login-left">
        <div class="login-brand">
          <div class="brand-shield">
            <mat-icon class="shield-icon">verified_user</mat-icon>
          </div>
          <h1 class="brand-title">Platinum ERP</h1>
          <p class="brand-subtitle">Municipal Management System</p>
          <div class="brand-divider"></div>
          <p class="brand-desc">
            Integrated asset management, supply chain, point of sale, payroll,
            IDP, budgeting, performance reporting and annual financial statements platform for South African local government.
          </p>
          <ul class="feature-list">
            <li><mat-icon class="feature-check">check_circle</mat-icon> mSCOA &amp; GRAP Compliant</li>
            <li><mat-icon class="feature-check">check_circle</mat-icon> MFMA &amp; SCM Regulation Compliant</li>
            <li><mat-icon class="feature-check">check_circle</mat-icon> End-to-End Municipal Lifecycle</li>
            <li><mat-icon class="feature-check">check_circle</mat-icon> Real-Time Audit Trail</li>
            <li><mat-icon class="feature-check">check_circle</mat-icon> Eight Integrated Modules</li>
          </ul>
          <div class="module-badges">
            <span class="module-badge">Assets</span>
            <span class="module-badge">SCM</span>
            <span class="module-badge">POS</span>
            <span class="module-badge">Payroll</span>
            <span class="module-badge">IDP</span>
            <span class="module-badge">Performance</span>
            <span class="module-badge">Budget</span>
            <span class="module-badge">AFS</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-form-container">
          <h2 class="form-title">Sign In</h2>
          <p class="form-subtitle">Enter your credentials to access the system</p>

          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-field">
              <mat-icon class="field-icon">person</mat-icon>
              <input
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="Username*"
                class="field-input"
                autocomplete="username"
                required
              />
            </div>

            <div class="form-field">
              <mat-icon class="field-icon">lock</mat-icon>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="Password*"
                class="field-input"
                autocomplete="current-password"
                required
              />
              <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
            </div>

            @if (error()) {
              <div class="error-msg">
                <mat-icon>error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button type="submit" class="login-btn" [disabled]="loading()">
              @if (loading()) {
                Signing in...
              } @else {
                Sign In
              }
            </button>
          </form>

          <div class="demo-credentials">
            <div class="demo-header">
              <mat-icon class="demo-icon">info</mat-icon>
              <span>Demo Credentials</span>
            </div>
            <div class="demo-card" (click)="fillDemo()">
              <div class="demo-role">SYSTEM ADMIN</div>
              <div class="demo-user">admin</div>
            </div>
            <div class="demo-pw">Password: <code>admin123</code></div>
          </div>
        </div>
      </div>
    </div>

    <footer class="login-footer">
      &copy; 2026 Platinum ERP Solutions. All rights reserved.
    </footer>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .login-container {
      display: flex;
      height: calc(100vh - 32px);
      min-height: 600px;
    }

    .login-left {
      flex: 1;
      background: linear-gradient(135deg, #0f2b46 0%, #1a3a5c 50%, #0f2b46 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #fff;
      position: relative;
      overflow: hidden;
    }

    .login-left::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: rgba(201, 168, 76, 0.05);
    }

    .login-left::after {
      content: '';
      position: absolute;
      bottom: -40%;
      left: -20%;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: rgba(201, 168, 76, 0.03);
    }

    .login-brand { position: relative; z-index: 1; max-width: 420px; }

    .brand-shield {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #c9a84c, #d4b85a);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(201, 168, 76, 0.3);
    }

    .shield-icon { font-size: 40px; width: 40px; height: 40px; color: #fff; }

    .brand-title {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 4px;
      letter-spacing: 0.5px;
    }

    .brand-subtitle {
      font-size: 16px;
      color: #c9a84c;
      font-weight: 500;
      margin: 0 0 20px;
    }

    .brand-divider {
      width: 60px;
      height: 3px;
      background: #c9a84c;
      border-radius: 2px;
      margin-bottom: 20px;
    }

    .brand-desc {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255,255,255,0.8);
      margin: 0 0 24px;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0 0 24px;
    }

    .feature-list li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      font-size: 14px;
      color: rgba(255,255,255,0.9);
    }

    .feature-check { color: #c9a84c !important; font-size: 20px; width: 20px; height: 20px; }

    .module-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .module-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(201, 168, 76, 0.15);
      color: #c9a84c;
      border: 1px solid rgba(201, 168, 76, 0.3);
    }

    .login-right {
      flex: 1;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .login-form-container { width: 100%; max-width: 400px; }

    .form-title {
      font-size: 28px;
      font-weight: 700;
      color: #1a2332;
      margin: 0 0 8px;
    }

    .form-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 32px;
    }

    .login-form { display: flex; flex-direction: column; gap: 16px; }

    .form-field {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-field:focus-within {
      border-color: #1a3a5c;
      box-shadow: 0 0 0 3px rgba(26, 58, 92, 0.1);
    }

    .field-icon { color: #9ca3af; font-size: 22px; width: 22px; height: 22px; }

    .field-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 15px;
      color: #1a2332;
      background: transparent;
    }

    .field-input::placeholder { color: #9ca3af; }

    .toggle-pw {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      color: #9ca3af;
    }

    .toggle-pw mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 13px;
    }

    .error-msg mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .login-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      background: linear-gradient(135deg, #1a3a5c, #0f2b46);
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s;
      margin-top: 8px;
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(15, 43, 70, 0.3);
    }

    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .demo-credentials {
      margin-top: 32px;
      padding: 16px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
    }

    .demo-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #1a3a5c;
      margin-bottom: 12px;
    }

    .demo-icon { color: #3b82f6; font-size: 18px; width: 18px; height: 18px; }

    .demo-card {
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      margin-bottom: 8px;
    }

    .demo-card:hover { background: #eef2ff; }

    .demo-role { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .demo-user { font-size: 14px; color: #1a2332; margin-top: 2px; }

    .demo-pw { font-size: 13px; color: #6b7280; }
    .demo-pw code {
      padding: 2px 6px;
      background: #f1f5f9;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      color: #1a2332;
    }

    .login-footer {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #9ca3af;
      background: #f5f7fa;
    }

    @media (max-width: 768px) {
      .login-container { flex-direction: column; }
      .login-left { padding: 32px 24px; }
      .brand-desc, .feature-list, .module-badges { display: none; }
      .login-right { padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  fillDemo(): void {
    this.username = 'admin';
    this.password = 'admin123';
    this.error.set('');
  }

  onLogin(): void {
    this.error.set('');
    if (!this.username || !this.password) {
      this.error.set('Please enter username and password');
      return;
    }

    this.loading.set(true);

    setTimeout(() => {
      const success = this.auth.login(this.username, this.password);
      this.loading.set(false);

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('Invalid username or password');
      }
    }, 500);
  }
}
