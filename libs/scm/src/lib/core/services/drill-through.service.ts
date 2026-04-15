import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DrillThroughService {
  private router = inject(Router);

  navigate(route: string, params?: Record<string, string>): void {
    if (!route) return;
    const queryParams = params && Object.keys(params).length > 0 ? params : undefined;
    this.router.navigate([route], { queryParams });
  }

  navigateToRequisitions(filter?: string): void {
    this.navigate('/requisitions', filter ? { status: filter } : undefined);
  }

  navigateToOrders(filter?: string): void {
    this.navigate('/orders', filter ? { status: filter } : undefined);
  }

  navigateToInvoices(filter?: string): void {
    this.navigate('/invoices', filter ? { status: filter } : undefined);
  }

  navigateToPayments(filter?: string): void {
    this.navigate('/payments', filter ? { status: filter } : undefined);
  }

  navigateToSuppliers(filter?: string): void {
    this.navigate('/suppliers', filter ? { status: filter } : undefined);
  }

  navigateToContracts(filter?: string): void {
    this.navigate('/contracts', filter ? { status: filter } : undefined);
  }

  navigateToTenders(filter?: string): void {
    this.navigate('/tenders', filter ? { status: filter } : undefined);
  }

  navigateToInventory(filter?: string): void {
    this.navigate('/inventory', filter ? { status: filter } : undefined);
  }

  navigateToIfwRegister(): void {
    this.navigate('/ifw-register');
  }

  navigateToAuditTrail(): void {
    this.navigate('/audit-trail');
  }

  navigateToDelegations(): void {
    this.navigate('/delegations');
  }

  kpiToRoute(kpiId: string): string {
    const map: Record<string, string> = {
      'requisitions': '/requisitions',
      'orders': '/orders',
      'payments': '/payments',
      'invoices': '/invoices',
      'commitments': '/orders',
      'budget': '/reports',
      'suppliers': '/suppliers',
      'contracts': '/contracts',
      'tenders': '/tenders',
      'inventory': '/inventory',
      'grn': '/grn',
      'compliance': '/ifw-register'
    };
    return map[kpiId] || '/dashboard';
  }
}
