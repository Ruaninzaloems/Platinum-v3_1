import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  hidePassword = signal(true);
  loading = signal(false);
  errorMessage = signal('');

  fillCredentials(username: string, password: string): void {
    this.username = username;
    this.password = password;
    this.errorMessage.set('');
  }

  onLogin(): void {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set('');

    // normalize username on client side to avoid case-sensitivity issues
    const normalizedUsername = (this.username || '').trim().toLowerCase();

    this.authService.login(normalizedUsername, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          // server returns { error: 'Invalid credentials' }
          err.error?.error || 'Invalid credentials. Please try again.'
        );
      }
    });
  }
}
