import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class WorkflowDesignerService {
  private api = inject(BaseApiService);

  getTemplates(): Observable<any[]> { return this.api.apiGet('/workflow-designer/templates'); }
  getTemplate(id: string): Observable<any> { return this.api.apiGet(`/workflow-designer/templates/${id}`); }
  createTemplate(data: any): Observable<any> { return this.api.apiPost('/workflow-designer/templates', data); }
  updateTemplate(id: string, data: any): Observable<any> { return this.api.apiPut(`/workflow-designer/templates/${id}`, data); }
  deleteTemplate(id: string): Observable<any> { return this.api.apiDelete(`/workflow-designer/templates/${id}`); }
  activateTemplate(id: string): Observable<any> { return this.api.apiPost(`/workflow-designer/templates/${id}/activate`, {}); }
  deactivateTemplate(id: string): Observable<any> { return this.api.apiPost(`/workflow-designer/templates/${id}/deactivate`, {}); }
  cloneTemplate(id: string): Observable<any> { return this.api.apiPost(`/workflow-designer/templates/${id}/clone`, {}); }
  simulate(id: string, data: any): Observable<any> { return this.api.apiPost(`/workflow-designer/templates/${id}/simulate`, data); }
  getVersionHistory(id: string): Observable<any[]> { return this.api.apiGet(`/workflow-designer/templates/${id}/versions`); }
  getConditionTypes(): Observable<any[]> { return this.api.apiGet('/workflow-designer/condition-types'); }
  getActionTypes(): Observable<any[]> { return this.api.apiGet('/workflow-designer/action-types'); }
  getSlaConfig(): Observable<any> { return this.api.apiGet('/workflow-designer/sla-config'); }
  updateSlaConfig(data: any): Observable<any> { return this.api.apiPut('/workflow-designer/sla-config', data); }
  getEscalationRules(): Observable<any[]> { return this.api.apiGet('/workflow-designer/escalation-rules'); }
  createEscalationRule(data: any): Observable<any> { return this.api.apiPost('/workflow-designer/escalation-rules', data); }
  updateEscalationRule(id: string, data: any): Observable<any> { return this.api.apiPut(`/workflow-designer/escalation-rules/${id}`, data); }
  deleteEscalationRule(id: string): Observable<any> { return this.api.apiDelete(`/workflow-designer/escalation-rules/${id}`); }
  getDashboard(): Observable<any> { return this.api.apiGet('/workflow-designer/dashboard'); }
}
