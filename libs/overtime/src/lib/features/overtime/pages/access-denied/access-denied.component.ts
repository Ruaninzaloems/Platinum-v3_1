import { Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { UserContextService } from '../../../../core/services/user-context.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="access-denied-wrapper">
      <div class="access-denied-card">
        <div class="access-denied-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>

        <h1 class="access-denied-title">Access Denied</h1>

        <p class="access-denied-message">
          You don't have permission to access
          <strong>{{ pageName() }}</strong>.
        </p>

        <p class="access-denied-detail">
          This page requires a Platinum permission that hasn't been assigned to
          your account. Please contact your system administrator if you believe
          this is an error.
        </p>

        <div class="access-denied-actions">
          <button class="btn-back" type="button" (click)="goBack()">&#8592; Go Back</button>

          @if (me()?.canAccessCapture) {
            <a routerLink="/overtime/capture" class="btn-primary">Go to Overtime Capture</a>
          } @else if (me()?.canAccessConfig) {
            <a routerLink="/overtime/setup" class="btn-primary">Go to Configuration</a>
          } @else {
            <span class="no-access-note">You currently have no access to any pages in this module.</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 64px);
      padding: 2rem;
      background: var(--surface-ground, #f8f9fa);
    }

    .access-denied-card {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .access-denied-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;

      svg {
        width: 64px;
        height: 64px;
        color: #dc3545;
        opacity: 0.85;
      }
    }

    .access-denied-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #212529;
      margin: 0 0 0.75rem;
    }

    .access-denied-message {
      font-size: 1rem;
      color: #495057;
      margin: 0 0 0.75rem;

      strong {
        color: #212529;
      }
    }

    .access-denied-detail {
      font-size: 0.875rem;
      color: #6c757d;
      line-height: 1.6;
      margin: 0 0 2rem;
    }

    .access-denied-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-back {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      background: transparent;
      color: #495057;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;

      &:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
      }
    }

    .btn-primary {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: #007bff;
      color: #fff;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.15s ease;

      &:hover {
        background: #0056b3;
        color: #fff;
        text-decoration: none;
      }
    }

    .no-access-note {
      font-size: 0.875rem;
      color: #6c757d;
      font-style: italic;
    }
  `]
})
export class AccessDeniedComponent {
  private route    = inject(ActivatedRoute);
  private userCtx  = inject(UserContextService);
  private location = inject(Location);

  readonly pageName = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('page') ?? 'this page')),
    { initialValue: 'this page' }
  );

  readonly me = computed(() => this.userCtx.me());

  goBack(): void {
    this.location.back();
  }
}
