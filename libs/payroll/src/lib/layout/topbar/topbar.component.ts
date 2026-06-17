import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UiService } from '../../core/services/ui.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import { ApprovalsService, ApprovalCounts } from '../../core/services/approvals.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { UserSwitcherComponent } from '../user-switcher/user-switcher.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, UserSwitcherComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent implements OnInit {
  breadcrumb = 'Executive Dashboard';
  notifications$;
  showNotifications = false;
  activeTaxYear: string = '';
  approvalCounts$;

  private routeLabels: Record<string, string> = {
    '/dashboard': 'Executive Dashboard',
    '/employees': 'Employees',
    '/organogram': 'Organogram',
    '/job-profiles': 'Job Profiles',
    '/positions': 'Staff Establishment',
    '/departments': 'Departments',
    '/leave': 'Leave Management',
    '/benefits': 'Benefits',
    '/time': 'Time & Attendance',
    '/reports': 'Reports & Exports',
    '/disciplinary': 'Disciplinary',
    '/skills': 'Skills & Training',
    '/recruitment': 'Recruitment',
    '/ess': 'Employee Self-Service',
    '/approvals': 'My Approvals',
  };

  constructor(
    private router: Router,
    private ui: UiService,
    private notificationService: NotificationService,
    private api: ApiService,
    private approvals: ApprovalsService,
    private currentUser: CurrentUserService
  ) {
    this.notifications$ = this.notificationService.notifications$;
    this.approvalCounts$ = this.approvals.counts$;
    effect(() => {
      this.currentUser.currentUser();
      this.approvals.refreshCounts();
    });
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = e.urlAfterRedirects || e.url;
      if (url.startsWith('/settings')) {
        this.breadcrumb = this.getSettingsBreadcrumb(url);
      } else {
        this.breadcrumb = this.routeLabels[url] || 'HR & Payroll';
      }
    });

    this.notificationService.loadNotifications();
    this.notificationService.startPolling();

    this.approvals.refreshCounts();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.approvals.refreshCounts();
    });

    this.api.get<{ tax_year: number | null }>('/settings/active-tax-year').subscribe({
      next: (data) => {
        this.activeTaxYear = data.tax_year ? `Tax Year ${data.tax_year}` : '';
      },
      error: () => {
        this.activeTaxYear = '';
      }
    });
  }

  private getSettingsBreadcrumb(url: string): string {
    const parts = url.replace('/settings/', '').split('/');
    const labels: Record<string, string> = {
      'municipality': 'Municipality Details',
      'employee-types': 'Employee Sub Types',
      'task-grades': 'Task Grades & Notches',
      'conditions': 'Conditions of Service',
      'tax': 'Tax Tables',
      'leave-types': 'Leave Types',
      'salary-heads': 'Salary Heads',
      'salary-trans-groups': 'Salary Trans Groups',
      'upper-limits': 'Upper Limits',
      'leave-policies': 'Leave Policies',
      'bank': 'Bank & Payments',
      'security': 'Security & RBAC',
      'workflows': 'Workflows',
    };
    return labels[parts[0]] || 'Settings';
  }

  get unreadCount(): number {
    return 0;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  markRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  refresh(): void {
    window.location.reload();
  }

  toggleSidebar(): void {
    this.ui.toggleSidebar();
  }

  goToApprovals(): void {
    this.router.navigate(['/payroll/approvals']);
  }
}
