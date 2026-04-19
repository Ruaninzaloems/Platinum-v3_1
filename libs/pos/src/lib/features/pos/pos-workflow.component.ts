import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { CashierSetupComponent } from '../cashier/cashier-setup.component';
import { PosComponent } from './pos.component';
import { CashierDayEndComponent } from '../cashier/cashier-day-end.component';

type WorkflowTab = 'setup' | 'transact' | 'day-end';
type SessionState = 'loading' | 'no-session' | 'active' | 'pending-approval' | 'returned' | 'needs-reconcile';

@Component({
  selector: 'app-pos-workflow',
  standalone: true,
  imports: [CommonModule, CashierSetupComponent, PosComponent, CashierDayEndComponent],
  templateUrl: './pos-workflow.component.html',
  styleUrl: './pos-workflow.component.css'
})
export class PosWorkflowComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  activeTab = signal<WorkflowTab>('setup');
  sessionState = signal<SessionState>('loading');

  sessionReady = signal(false);
  sessionActive = signal(false);

  pendingMessage = signal('');
  pendingStatusLabel = signal('');
  returnReason = signal('');
  reconcileMessage = signal('');
  returnBannerDismissed = signal(false);

  user = this.auth.user;

  canAccessSetup = computed(() => this.sessionState() === 'no-session');
  canAccessTransact = computed(() => {
    return this.sessionState() === 'active';
  });
  canAccessDayEnd = computed(() => {
    const s = this.sessionState();
    return s === 'active' || s === 'returned' || s === 'needs-reconcile';
  });

  ngOnInit(): void {
    this.checkExistingSession();
  }

  ngOnDestroy(): void {}

  async checkExistingSession(): Promise<void> {
    this.sessionState.set('loading');
    try {
      const userId = this.user()?.user_ID;
      const finYear = this.user()?.finYear || '';
      if (!userId) {
        this.sessionState.set('no-session');
        return;
      }

      const [data, ensureData]: any[] = await Promise.all([
        firstValueFrom(
          this.api.get('/api/platinum/auth/active-cashier-by-userid', {
            userid: String(userId),
            finYear
          })
        ).catch(() => null),
        firstValueFrom(
          this.api.post('/api/platinum/auth/ensure-cashier', {})
        ).catch(() => null)
      ]);

      const hasPendingDayEnd = data?.hasPendingDayEnd === true || ensureData?.hasPendingDayEnd === true;
      const hasDayEndReturned = data?.hasDayEndReturned === true || ensureData?.hasDayEndReturned === true;
      const reconcileStatusId = data?.reconcileStatusId || ensureData?.reconcileStatusId || null;
      const reconcileStatusDesc = data?.reconcileStatusDesc || ensureData?.reconcileStatusDesc || '';
      const dayEndReturnReason = data?.dayEndReturnReason || ensureData?.dayEndReturnReason || '';

      if (hasDayEndReturned) {
        this.returnReason.set(dayEndReturnReason || 'No reason provided');
        this.returnBannerDismissed.set(false);
        this.sessionReady.set(true);
        this.sessionActive.set(true);
        this.sessionState.set('returned');
        this.activeTab.set('day-end');
        return;
      }

      if (hasPendingDayEnd) {
        let statusText = 'Pending Approval';
        if (reconcileStatusId === 174) {
          statusText = 'Submitted — Awaiting Supervisor Authorisation';
        } else if (reconcileStatusDesc) {
          statusText = reconcileStatusDesc;
        }
        this.pendingStatusLabel.set(statusText);
        this.pendingMessage.set(
          'Your day-end reconciliation has been submitted and is awaiting supervisor verification. You cannot start a new POS session until it has been approved or returned.'
        );
        this.sessionState.set('pending-approval');
        return;
      }

      const isActive = data?.isActive === true;
      const cashierId = data?.cashierId || data?.details?.id || ensureData?.cashierId || null;
      const officeId = data?.officeId || ensureData?.officeId || null;

      if (isActive && officeId) {
        if (cashierId) {
          try {
            const reconCheck: any = await firstValueFrom(
              this.api.get('/api/platinum/receipt-prepaid/validate-cashier-day-end-recon', {
                cashierId: String(cashierId),
                userId: String(userId)
              })
            );

            if (reconCheck === false) {
              this.reconcileMessage.set('You have reached the maximum number of days allowed before submitting your day-end reconciliation. Please complete your day-end before processing any new transactions.');
              this.sessionReady.set(true);
              this.sessionActive.set(true);
              this.sessionState.set('needs-reconcile');
              this.activeTab.set('day-end');
              return;
            } else if (typeof reconCheck === 'string') {
              if (reconCheck.toLowerCase().includes('reconcile')) {
                this.reconcileMessage.set(reconCheck);
                this.sessionReady.set(true);
                this.sessionActive.set(true);
                this.sessionState.set('needs-reconcile');
                this.activeTab.set('day-end');
                return;
              }
            } else if (reconCheck && !reconCheck._error) {
              const reconMsg = reconCheck.message || reconCheck.msg || reconCheck.validationMessage || '';
              const reconNeed = reconCheck.needsReconcile === true
                || reconCheck.requiresReconcile === true
                || reconCheck.isValid === false
                || (typeof reconMsg === 'string' && reconMsg.toLowerCase().includes('reconcile'));

              if (reconNeed) {
                this.reconcileMessage.set(reconMsg || 'You need to submit your day-end reconciliation before you can process transactions.');
                this.sessionReady.set(true);
                this.sessionActive.set(true);
                this.sessionState.set('needs-reconcile');
                this.activeTab.set('day-end');
                return;
              }
            }
          } catch {
            console.warn('[pos-workflow] validate-day-end-recon API error — treating as no reconciliation needed');
          }
        }

        this.sessionReady.set(true);
        this.sessionActive.set(true);
        this.sessionState.set('active');
        this.activeTab.set('transact');
      } else {
        this.sessionState.set('no-session');
      }
    } catch {
      this.sessionState.set('no-session');
    }
  }

  onSessionStarted(): void {
    this.sessionReady.set(true);
    this.sessionActive.set(true);
    this.sessionState.set('active');
    this.activeTab.set('transact');
  }

  onDayEndPendingDetected(message: string): void {
    this.pendingStatusLabel.set('Pending Approval');
    this.pendingMessage.set(
      message || 'Your day-end reconciliation is pending supervisor approval. You cannot start a new POS session until it has been reviewed.'
    );
    this.sessionState.set('pending-approval');
  }

  goToDayEnd(): void {
    this.activeTab.set('day-end');
  }

  navigateToSupervisor(): void {
    this.router.navigate(['/supervisor']);
  }

  dismissReturnBanner(): void {
    this.returnBannerDismissed.set(true);
  }

  setTab(tab: WorkflowTab): void {
    if (tab === 'setup' && !this.canAccessSetup()) return;
    if (tab === 'transact' && !this.canAccessTransact()) return;
    if (tab === 'day-end' && !this.canAccessDayEnd()) return;
    this.activeTab.set(tab);
  }

  getTabNumber(tab: WorkflowTab): number {
    switch (tab) {
      case 'setup': return 1;
      case 'transact': return 2;
      case 'day-end': return 3;
    }
  }

  isTabComplete(tab: WorkflowTab): boolean {
    if (tab === 'setup') return this.sessionReady();
    return false;
  }
}
