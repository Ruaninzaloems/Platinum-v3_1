import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';

export interface SmsSendRequest {
  to: string;
  message: string;
  accountId?: string | number;
  accountNumber?: string;
  accountHolder?: string;
  context?: string;
}

export interface SmsSendResponse {
  success: boolean;
  messageId?: string;
  to?: string;
  costInCredits?: number;
  message?: string;
  provider?: string;
}

export interface SmsBulkRequest {
  messages: SmsSendRequest[];
  context?: string;
}

export interface SmsBulkResponse {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: SmsSendResponse[];
}

export interface SmsCredits {
  credits: number;
  error?: string;
}

export interface SmsStatus {
  configured: boolean;
  provider?: string;
  credits?: number;
  error?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class SmsService {
  private api = inject(ApiService);

  sendSms(request: SmsSendRequest): Observable<SmsSendResponse> {
    return this.api.post<SmsSendResponse>('/api/sms/send', request);
  }

  sendBulk(messages: SmsSendRequest[], context?: string): Observable<SmsBulkResponse> {
    return this.api.post<SmsBulkResponse>('/api/sms/send-bulk', { messages, context });
  }

  getCredits(): Observable<SmsCredits> {
    return this.api.get<SmsCredits>('/api/sms/credits');
  }

  getStatus(): Observable<SmsStatus> {
    return this.api.get<SmsStatus>('/api/sms/status');
  }
}
