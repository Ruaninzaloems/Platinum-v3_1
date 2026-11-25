import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { FinancialYear } from '../models/budget.models';

@Injectable({ providedIn: 'root' })
export class ActiveYearService {
  private _activeYear = new BehaviorSubject<FinancialYear | null>(null);
  activeYear$ = this._activeYear.asObservable();

  get activeYear(): FinancialYear | null {
    return this._activeYear.value;
  }

  constructor(private http: HttpClient) {}

  init(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<FinancialYear>('/budget-app/api/financialyears/active').subscribe({
        next: fy => { this._activeYear.next(fy); resolve(); },
        error: () => resolve()
      });
    });
  }
}
