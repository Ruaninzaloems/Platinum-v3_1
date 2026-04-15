import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from './api.service';

export interface LookupItem {
  id: number | string;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  private api = inject(ApiService);
  private cache = new Map<string, Observable<LookupItem[]>>();

  getLookup(apiPrefix: string, endpoint: string): Observable<LookupItem[]> {
    const key = `${apiPrefix}${endpoint}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.api.get<LookupItem[]>(`${apiPrefix}/api/${endpoint}`).pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }

  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
