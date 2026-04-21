import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environment';

@Component({
  selector: 'app-supplier-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatCheckboxModule,
    MatStepperModule, MatProgressBarModule, MatDividerModule
  ],
  templateUrl: './supplier-login.component.html',
  styleUrl: './supplier-login.component.scss'
})
export class SupplierLoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  view = signal<'login' | 'register' | 'pending'>('login');
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  loginForm = {
    registrationNumber: '',
    idNumber: '',
    noRegistration: false
  };

  registerForm = {
    companyName: '',
    registrationNumber: '',
    idNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    csdNumber: '',
    vatNumber: '',
    physicalAddress: '',
    bankName: '',
    bankAccountNumber: '',
    bankBranchCode: '',
    accountType: '',
    beeLevel: null as number | null,
    noRegistration: false,
    acceptTerms: false
  };

  registerStep = signal(0);
  registrationResult = signal<any>(null);
  hideId = signal(true);

  bankOptions = [
    'ABSA', 'Capitec', 'FNB', 'Investec', 'Nedbank', 'Standard Bank', 'TymeBank', 'African Bank', 'Discovery Bank'
  ];

  accountTypes = [
    { value: 'cheque', label: 'Cheque/Current Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'transmission', label: 'Transmission Account' }
  ];

  demoCredentials = [
    { reg: '2018/123456/07', id: '8501015800083', name: 'Mzansi Civil Engineering' },
    { reg: '2015/098765/23', id: '9002025800084', name: 'Ubuntu Office Solutions' }
  ];

  fillDemo(cred: any): void {
    this.loginForm.registrationNumber = cred.reg;
    this.loginForm.idNumber = cred.id;
    this.loginForm.noRegistration = false;
    this.errorMessage.set('');
  }

  onLogin(): void {
    if (!this.loginForm.idNumber) {
      this.errorMessage.set('ID Number is required.');
      return;
    }
    if (!this.loginForm.noRegistration && !this.loginForm.registrationNumber) {
      this.errorMessage.set('Company Registration Number is required, or check "No company registration".');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.http.post<any>(`${this.apiUrl}/supplier-portal/auth`, {
      registrationNumber: this.loginForm.noRegistration ? null : this.loginForm.registrationNumber,
      idNumber: this.loginForm.idNumber
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        localStorage.setItem('platinum_token', res.token);
        localStorage.setItem('platinum_user', JSON.stringify(res.user));
        localStorage.setItem('supplier_session', JSON.stringify(res.supplier));
        this.router.navigate(['/scm/supplier-portal']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Authentication failed. Please check your credentials.');
      }
    });
  }

  onRegister(): void {
    if (!this.registerForm.companyName || !this.registerForm.idNumber || !this.registerForm.contactPerson || !this.registerForm.email || !this.registerForm.csdNumber) {
      this.errorMessage.set('Please complete all required fields.');
      return;
    }
    if (!this.registerForm.noRegistration && !this.registerForm.registrationNumber) {
      this.errorMessage.set('Company Registration Number is required, or check "No company registration".');
      return;
    }
    if (!this.registerForm.acceptTerms) {
      this.errorMessage.set('You must accept the terms and conditions.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.http.post<any>(`${this.apiUrl}/supplier-portal/register`, {
      companyName: this.registerForm.companyName,
      registrationNumber: this.registerForm.noRegistration ? null : this.registerForm.registrationNumber,
      idNumber: this.registerForm.idNumber,
      contactPerson: this.registerForm.contactPerson,
      email: this.registerForm.email,
      phone: this.registerForm.phone,
      csdNumber: this.registerForm.csdNumber,
      vatNumber: this.registerForm.vatNumber,
      physicalAddress: this.registerForm.physicalAddress,
      bankName: this.registerForm.bankName,
      bankAccountNumber: this.registerForm.bankAccountNumber,
      bankBranchCode: this.registerForm.bankBranchCode,
      accountType: this.registerForm.accountType,
      beeLevel: this.registerForm.beeLevel
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.registrationResult.set(res);
        this.view.set('pending');
        this.successMessage.set('Registration submitted successfully!');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Registration failed. Please try again.');
      }
    });
  }

  switchView(v: 'login' | 'register'): void {
    this.view.set(v);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.registerStep.set(0);
  }

  nextStep(): void {
    this.registerStep.update(s => Math.min(s + 1, 2));
  }

  prevStep(): void {
    this.registerStep.update(s => Math.max(s - 1, 0));
  }

  canProceedStep(): boolean {
    const step = this.registerStep();
    if (step === 0) {
      return !!this.registerForm.companyName && !!this.registerForm.idNumber && !!this.registerForm.contactPerson && !!this.registerForm.email && !!this.registerForm.csdNumber && (this.registerForm.noRegistration || !!this.registerForm.registrationNumber);
    }
    return true;
  }

  goToLogin(): void {
    this.view.set('login');
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
