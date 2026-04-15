import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiService } from '../../core/services/ui.service';

interface NavItem {
  label: string;
  route?: string;
  svgIcon: string;
  children?: NavItem[];
  toggleKey?: string;
  subgroups?: NavSubgroup[];
}

interface NavSubgroup {
  label: string;
  toggleKey: string;
  svgIcon: string;
  children: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  collapsed$;
  expandedGroups: Record<string, boolean> = { 'hr': true, 'payroll': false, 'config': true, 'company': false, 'hrStructure': false, 'payrollSetup': false, 'benefits': false, 'payStructure': false, 'other': false, 'payrollTransactions': false, };

  navItems: NavItem[] = [
    {
      label: 'Dashboard', route: '/dashboard',
      svgIcon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
    },
    {
      label: 'Employee Self-Service', route: '/ess',
      svgIcon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/>'
    },
    {
      label: 'HR Management', toggleKey: 'hr',
      svgIcon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      children: [
        {
          label: 'Job Profiles', route: '/job-profiles',
          svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'
        },
        {
          label: 'Positions', route: '/positions',
          svgIcon: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>'
        },
        {
          label: 'Organogram', route: '/organogram',
          svgIcon: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="5" y2="14"/><line x1="12" y1="12" x2="19" y2="14"/>'
        },
        {
          label: 'Employees', route: '/employees',
          svgIcon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
        },
        {
          label: 'Salary Structure', route: '/salary-structure',
          svgIcon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
        }
      ]
    },
    {
      label: 'Payroll', toggleKey: 'payroll',
      svgIcon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      children: [
        {
          label: 'Payslips', route: '/payroll/payslip-view',
          svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'
        },
        {
          label: 'Payroll Run', route: '/payroll/run',
          svgIcon: '<polygon points="5 3 19 12 5 21 5 3"/>'
        }
      ],
      subgroups: [
        {
          label: 'Transactions', toggleKey: 'payrollTransactions',
          svgIcon: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
          children: [
            {
              label: 'Wages', route: '/payroll/wages',
              svgIcon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'
            },
            {
              label: 'Claims', route: '/payroll/claims',
              svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
            }
          ]
        }
      ]
    },
    {
      label: 'Reports', route: '/reports',
      svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
    },
    {
      label: 'Configuration', toggleKey: 'config',
      svgIcon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      subgroups: [
        {
          label: 'Company', toggleKey: 'company',
          svgIcon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
          children: [
            {
              label: 'Municipality Details', route: '/settings/municipality',
              svgIcon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
            },
            {
              label: 'Constants', route: '/settings/constants',
              svgIcon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'
            }
          ]
        },
        {
          label: 'HR Structure', toggleKey: 'hrStructure',
          svgIcon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
          children: [
            {
              label: 'Employee Sub Types', route: '/settings/employee-types',
              svgIcon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
            },
            {
              label: 'Conditions of Service', route: '/settings/conditions',
              svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
            },
            {
              label: 'Task Grades & Notches', route: '/settings/task-grades',
              svgIcon: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
            },
            {
              label: 'Upper Limits', route: '/settings/upper-limits',
              svgIcon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
            },
            {
              label: 'Employment Change Reasons', route: '/settings/employment-changes',
              svgIcon: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22V8"/><path d="M21 3l-9 9"/><path d="M3 3l9 9"/>'
            }
          ]
        },
        {
          label: 'Payroll Setup', toggleKey: 'payrollSetup',
          svgIcon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
          children: [
            {
              label: 'Tax Tables', route: '/settings/tax',
              svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
            },
            {
              label: 'IRP5 Source Codes', route: '/settings/irp5-source-codes',
              svgIcon: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>'
            },
            {
              label: 'Payroll Cycles', route: '/settings/payroll-cycles',
              svgIcon: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'
            },
            {
              label: 'Tax Year Setup', route: '/settings/tax-year-setup',
              svgIcon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
            },
            {
              label: 'Payroll Periods', route: '/payroll',
              svgIcon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
            }
          ]
        },
        {
          label: 'Benefits', toggleKey: 'benefits',
          svgIcon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
          children: [
            {
              label: 'Medical Aid Schemes', route: '/medical-aid-schemes',
              svgIcon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
            },
            {
              label: 'Retirement Funds', route: '/retirement-funds',
              svgIcon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
            },
            {
              label: 'Trade Unions', route: '/trade-unions',
              svgIcon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
            }
          ]
        },
        {
          label: 'Pay Structure', toggleKey: 'payStructure',
          svgIcon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
          children: [
            {
              label: 'Pay Points', route: '/pay-points',
              svgIcon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'
            },
            {
              label: 'Salary Transactions', route: '/settings/salary-heads',
              svgIcon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
            },
            {
              label: 'Salary Transaction Groups', route: '/settings/salary-trans-groups',
              svgIcon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>'
            },
            {
              label: 'Payroll Constants', route: '/payroll',
              svgIcon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09"/>'
            },
            {
              label: 'Claim Rates', route: '/settings/claim-rates',
              svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'
            },
            {
              label: 'Claim Types', route: '/settings/claim-configurations',
              svgIcon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
            },
            {
              label: 'GL Integration', route: '/settings/gl-integration',
              svgIcon: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 10h8"/><path d="M8 14h4"/>'
            }
          ]
        },
        {
          label: 'Other', toggleKey: 'other',
          svgIcon: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
          children: [
            {
              label: 'Leave Management', route: '/leave',
              svgIcon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
            },
            {
              label: 'Time & Attendance', route: '/time',
              svgIcon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
            },
            {
              label: 'Staff Performance', route: '/performance',
              svgIcon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'
            },
            {
              label: 'Disciplinary', route: '/disciplinary',
              svgIcon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
            },
            {
              label: 'Skills & Training', route: '/skills',
              svgIcon: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>'
            },
            {
              label: 'Recruitment', route: '/recruitment',
              svgIcon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
            },
            {
              label: 'Leave Types', route: '/settings/leave-types',
              svgIcon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
            },
            {
              label: 'Leave Policies', route: '/settings/leave-policies',
              svgIcon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
            },
            {
              label: 'Bank & Payments', route: '/settings/bank',
              svgIcon: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>'
            },
            {
              label: 'Security & RBAC', route: '/settings/security',
              svgIcon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
            },
            {
              label: 'Workflows', route: '/settings/workflows',
              svgIcon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'
            },
            {
              label: 'Data Conversion', route: '/settings/data-conversion',
              svgIcon: '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>'
            }
          ]
        }
      ]
    }
  ];

  private iconCache = new Map<string, SafeHtml>();

  constructor(private ui: UiService, private sanitizer: DomSanitizer) {
    this.collapsed$ = this.ui.sidebarCollapsed$;
  }

  svgHtml(iconContent: string): SafeHtml {
    let cached = this.iconCache.get(iconContent);
    if (!cached) {
      cached = this.sanitizer.bypassSecurityTrustHtml(
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${iconContent}</svg>`
      );
      this.iconCache.set(iconContent, cached);
    }
    return cached;
  }

  toggleGroup(key: string): void {
    this.expandedGroups[key] = !this.expandedGroups[key];
  }

  toggleSidebar(): void {
    this.ui.toggleSidebar();
  }
}
