import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentUserService, DEV_USERS, DevUser } from '../../core/services/current-user.service';

@Component({
  selector: 'app-user-switcher',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-switcher.component.html',
  styleUrl: './user-switcher.component.css'
})
export class UserSwitcherComponent {
  users = DEV_USERS;
  showDropdown = false;

  constructor(
    public userService: CurrentUserService,
    private cdr: ChangeDetectorRef
  ) {}

  get currentUser(): DevUser {
    return this.userService.getCurrentUser();
  }

  get initials(): string {
    return this.userService.getInitials();
  }

  get roleBadge(): string {
    const r = this.currentUser.roles[0];
    const labels: Record<string, string> = {
      admin: 'Admin',
      hr_manager: 'HR',
      payroll_admin: 'Payroll',
      supervisor: 'Supervisor',
      employee: 'Employee',
    };
    return labels[r] || r;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    this.cdr.detectChanges();
  }

  selectUser(user: DevUser): void {
    this.userService.setCurrentUser(user);
    this.showDropdown = false;
    this.cdr.detectChanges();
  }

  isSelected(user: DevUser): boolean {
    return user.userId === this.currentUser.userId;
  }

  getUserInitials(user: DevUser): string {
    return user.displayName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleTags(user: DevUser): string {
    return user.roles.map(r => {
      const labels: Record<string, string> = {
        admin: 'Admin',
        hr_manager: 'HR',
        payroll_admin: 'Payroll',
        supervisor: 'Sup',
        employee: 'Emp',
      };
      return labels[r] || r;
    }).join(', ');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('.user-switcher-wrapper')) {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }
  }
}
