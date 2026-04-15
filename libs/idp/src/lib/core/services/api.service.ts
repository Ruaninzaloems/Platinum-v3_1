import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import {
  IdpCycle,
  IdpProcessPhase,
  IdpMilestone,
  IdpStrategicObjective,
  IdpProject,
  IdpProjectIndicator,
  IdpPublicComment,
  IdpCommentResponse,
  IdpDocumentVersion,
  IdpWorkflowTask,
  IdpSubmissionLog,
  IdpAuditLog,
  DashboardData,
  MscoaSegment,
  ProjectObjectiveLink,
  PriorityFramework,
  PriorityCriteria,
  PriorityScoringScale,
  PriorityProjectScore,
  PriorityFrameworkAudit,
  ProjectRanking,
  BudgetSimulationResult,
} from '../models/idp.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = `${environment.apiPrefix}/api`;

  constructor(private http: HttpClient) {}

  getCycles(): Observable<IdpCycle[]> {
    return this.http.get<IdpCycle[]>(`${this.baseUrl}/cycles`);
  }

  getCycle(id: number): Observable<IdpCycle> {
    return this.http.get<IdpCycle>(`${this.baseUrl}/cycles/${id}`);
  }

  createCycle(cycle: Partial<IdpCycle>): Observable<IdpCycle> {
    return this.http.post<IdpCycle>(`${this.baseUrl}/cycles`, cycle);
  }

  updateCycle(id: number, cycle: Partial<IdpCycle>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/cycles/${id}`, cycle);
  }

  updateCycleStatus(id: number, status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/cycles/${id}/status`, { status });
  }

  getDashboard(cycleId: number): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/cycles/${cycleId}/dashboard`);
  }

  getPhases(cycleId: number): Observable<IdpProcessPhase[]> {
    return this.http.get<IdpProcessPhase[]>(`${this.baseUrl}/phases/cycle/${cycleId}`);
  }

  createPhase(phase: Partial<IdpProcessPhase>): Observable<IdpProcessPhase> {
    return this.http.post<IdpProcessPhase>(`${this.baseUrl}/phases`, phase);
  }

  updatePhase(id: number, phase: Partial<IdpProcessPhase>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/phases/${id}`, phase);
  }

  checkPhaseProgress(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/phases/${id}/can-progress`);
  }

  getMilestones(cycleId: number): Observable<IdpMilestone[]> {
    return this.http.get<IdpMilestone[]>(`${this.baseUrl}/milestones/cycle/${cycleId}`);
  }

  createMilestone(milestone: Partial<IdpMilestone>): Observable<IdpMilestone> {
    return this.http.post<IdpMilestone>(`${this.baseUrl}/milestones`, milestone);
  }

  updateMilestone(id: number, milestone: Partial<IdpMilestone>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/milestones/${id}`, milestone);
  }

  updateMilestoneStatus(id: number, status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/milestones/${id}/status`, { status });
  }

  getObjectives(cycleId: number): Observable<IdpStrategicObjective[]> {
    return this.http.get<IdpStrategicObjective[]>(`${this.baseUrl}/objectives/cycle/${cycleId}`);
  }

  createObjective(objective: Partial<IdpStrategicObjective>): Observable<IdpStrategicObjective> {
    return this.http.post<IdpStrategicObjective>(`${this.baseUrl}/objectives`, objective);
  }

  updateObjective(id: number, objective: Partial<IdpStrategicObjective>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/objectives/${id}`, objective);
  }

  getProjects(cycleId: number): Observable<IdpProject[]> {
    return this.http.get<IdpProject[]>(`${this.baseUrl}/projects/cycle/${cycleId}`);
  }

  getProject(id: number): Observable<IdpProject> {
    return this.http.get<IdpProject>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(project: Partial<IdpProject>): Observable<IdpProject> {
    return this.http.post<IdpProject>(`${this.baseUrl}/projects`, project);
  }

  updateProject(id: number, project: Partial<IdpProject>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/projects/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  validateProjectKpis(cycleId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects/cycle/${cycleId}/kpi-validation`);
  }

  getIndicators(projectId: number): Observable<IdpProjectIndicator[]> {
    return this.http.get<IdpProjectIndicator[]>(`${this.baseUrl}/indicators/project/${projectId}`);
  }

  createIndicator(indicator: Partial<IdpProjectIndicator>): Observable<IdpProjectIndicator> {
    return this.http.post<IdpProjectIndicator>(`${this.baseUrl}/indicators`, indicator);
  }

  updateIndicator(id: number, indicator: Partial<IdpProjectIndicator>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/indicators/${id}`, indicator);
  }

  deleteIndicator(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/indicators/${id}`);
  }

  getComments(cycleId: number): Observable<IdpPublicComment[]> {
    return this.http.get<IdpPublicComment[]>(`${this.baseUrl}/comments/cycle/${cycleId}`);
  }

  createComment(comment: Partial<IdpPublicComment>): Observable<IdpPublicComment> {
    return this.http.post<IdpPublicComment>(`${this.baseUrl}/comments`, comment);
  }

  updateCommentStatus(id: number, status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/comments/${id}/status`, { status });
  }

  respondToComment(id: number, response: Partial<IdpCommentResponse>): Observable<IdpCommentResponse> {
    return this.http.post<IdpCommentResponse>(`${this.baseUrl}/comments/${id}/respond`, response);
  }

  getDocumentVersions(cycleId: number): Observable<IdpDocumentVersion[]> {
    return this.http.get<IdpDocumentVersion[]>(`${this.baseUrl}/documents/cycle/${cycleId}`);
  }

  getDocumentVersion(id: number): Observable<IdpDocumentVersion> {
    return this.http.get<IdpDocumentVersion>(`${this.baseUrl}/documents/${id}`);
  }

  generateDraftIdp(cycleId: number): Observable<IdpDocumentVersion> {
    return this.http.post<IdpDocumentVersion>(`${this.baseUrl}/documents/cycle/${cycleId}/generate-draft`, {});
  }

  generateFinalIdp(documentId: number, request: any): Observable<IdpDocumentVersion> {
    return this.http.post<IdpDocumentVersion>(`${this.baseUrl}/documents/${documentId}/generate-final`, request);
  }

  lockDocument(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/documents/${id}/lock`, {});
  }

  submitForReview(documentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/workflow/${documentId}/submit-for-review`, {});
  }

  getWorkflowTasks(documentId: number): Observable<IdpWorkflowTask[]> {
    return this.http.get<IdpWorkflowTask[]>(`${this.baseUrl}/workflow/${documentId}/tasks`);
  }

  approveTask(taskId: number, comments: string, completedBy: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/workflow/task/${taskId}/approve`, { comments, completedBy });
  }

  rejectTask(taskId: number, comments: string, completedBy: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/workflow/task/${taskId}/reject`, { comments, completedBy });
  }

  getPendingTasks(): Observable<IdpWorkflowTask[]> {
    return this.http.get<IdpWorkflowTask[]>(`${this.baseUrl}/workflow/pending`);
  }

  getSubmissions(cycleId: number): Observable<IdpSubmissionLog[]> {
    return this.http.get<IdpSubmissionLog[]>(`${this.baseUrl}/submissions/cycle/${cycleId}`);
  }

  createSubmission(submission: Partial<IdpSubmissionLog>): Observable<IdpSubmissionLog> {
    return this.http.post<IdpSubmissionLog>(`${this.baseUrl}/submissions`, submission);
  }

  updateSubmission(id: number, update: any): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/submissions/${id}`, update);
  }

  getAuditLogs(limit: number = 50): Observable<IdpAuditLog[]> {
    return this.http.get<IdpAuditLog[]>(`${this.baseUrl}/audit?limit=${limit}`);
  }

  getEntityAuditLogs(entityType: string, entityId: number): Observable<IdpAuditLog[]> {
    return this.http.get<IdpAuditLog[]>(`${this.baseUrl}/audit/entity/${entityType}/${entityId}`);
  }

  getMscoaSegments(segmentType: string): Observable<MscoaSegment[]> {
    return this.http.get<MscoaSegment[]>(`${this.baseUrl}/mscoa/${segmentType}`);
  }

  getMscoaPostingLevels(segmentType: string): Observable<MscoaSegment[]> {
    return this.http.get<MscoaSegment[]>(`${this.baseUrl}/mscoa/${segmentType}/posting-levels`);
  }

  getObjectiveLinks(projectId: number): Observable<ProjectObjectiveLink[]> {
    return this.http.get<ProjectObjectiveLink[]>(`${this.baseUrl}/projects/${projectId}/objective-links`);
  }

  setObjectiveLinks(projectId: number, links: { objectiveId: number; percentage: number }[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/${projectId}/objective-links`, links);
  }

  getFrameworks(): Observable<PriorityFramework[]> {
    return this.http.get<PriorityFramework[]>(`${this.baseUrl}/priority/frameworks`);
  }

  getFramework(id: number): Observable<PriorityFramework> {
    return this.http.get<PriorityFramework>(`${this.baseUrl}/priority/frameworks/${id}`);
  }

  createFramework(fw: Partial<PriorityFramework>): Observable<PriorityFramework> {
    return this.http.post<PriorityFramework>(`${this.baseUrl}/priority/frameworks`, fw);
  }

  updateFramework(id: number, fw: Partial<PriorityFramework>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/priority/frameworks/${id}`, fw);
  }

  cloneFramework(id: number): Observable<PriorityFramework> {
    return this.http.post<PriorityFramework>(`${this.baseUrl}/priority/frameworks/${id}/clone`, {});
  }

  activateFramework(id: number, cycleId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/priority/frameworks/${id}/activate`, { cycleId });
  }

  getCriteria(frameworkId: number): Observable<PriorityCriteria[]> {
    return this.http.get<PriorityCriteria[]>(`${this.baseUrl}/priority/frameworks/${frameworkId}/criteria`);
  }

  addCriterion(frameworkId: number, criterion: Partial<PriorityCriteria>): Observable<PriorityCriteria> {
    return this.http.post<PriorityCriteria>(`${this.baseUrl}/priority/frameworks/${frameworkId}/criteria`, criterion);
  }

  updateCriterion(id: number, criterion: Partial<PriorityCriteria>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/priority/criteria/${id}`, criterion);
  }

  deleteCriterion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/priority/criteria/${id}`);
  }

  getScale(frameworkId: number): Observable<PriorityScoringScale[]> {
    return this.http.get<PriorityScoringScale[]>(`${this.baseUrl}/priority/frameworks/${frameworkId}/scale`);
  }

  updateScale(frameworkId: number, scales: Partial<PriorityScoringScale>[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/priority/frameworks/${frameworkId}/scale`, scales);
  }

  updateAiConfig(frameworkId: number, config: { humanWeight: number; aiWeight: number; aiMode: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/priority/frameworks/${frameworkId}/ai-config`, config);
  }

  getFrameworkAudit(frameworkId: number): Observable<PriorityFrameworkAudit[]> {
    return this.http.get<PriorityFrameworkAudit[]>(`${this.baseUrl}/priority/frameworks/${frameworkId}/audit`);
  }

  getProjectScores(frameworkId: number, projectId: number): Observable<PriorityProjectScore[]> {
    return this.http.get<PriorityProjectScore[]>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/project/${projectId}`);
  }

  getAllScores(frameworkId: number): Observable<ProjectRanking[]> {
    return this.http.get<ProjectRanking[]>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/all`);
  }

  scoreProject(score: Partial<PriorityProjectScore>): Observable<PriorityProjectScore> {
    return this.http.post<PriorityProjectScore>(`${this.baseUrl}/priority-scores/score`, score);
  }

  scoreProjectAll(frameworkId: number, projectId: number, scores: Partial<PriorityProjectScore>[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/project/${projectId}/score-all`, scores);
  }

  getCompositeScore(frameworkId: number, projectId: number): Observable<{ compositeScore: number }> {
    return this.http.get<{ compositeScore: number }>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/project/${projectId}/composite`);
  }

  aiRecommend(frameworkId: number, projectId: number): Observable<PriorityProjectScore[]> {
    return this.http.post<PriorityProjectScore[]>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/ai-recommend/${projectId}`, {});
  }

  aiRecommendAll(frameworkId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/ai-recommend-all`, {});
  }

  getRankings(frameworkId: number): Observable<ProjectRanking[]> {
    return this.http.get<ProjectRanking[]>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/rankings`);
  }

  saveRanks(frameworkId: number, ranks: { projectId: number; rank: number }[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/save-ranks`, ranks);
  }

  getBudgetSimulation(frameworkId: number, threshold?: number): Observable<BudgetSimulationResult> {
    const params = threshold !== undefined ? `?threshold=${threshold}` : '';
    return this.http.get<BudgetSimulationResult>(`${this.baseUrl}/priority-scores/framework/${frameworkId}/budget-simulation${params}`);
  }
}
