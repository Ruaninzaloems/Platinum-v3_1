import { Component, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import {
  PriorityFramework,
  PriorityCriteria,
  PriorityScoringScale,
  PriorityProjectScore,
  ProjectRanking,
  BudgetSimulationResult,
  IdpProject,
} from '../../core/models/idp.models';

@Component({
  selector: 'app-prioritisation',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 data-testid="text-page-title">Project Prioritisation</h1>
          <p class="page-subtitle">Score, rank, and simulate budget impact for IDP projects</p>
        </div>
        <div class="header-actions">
          <select [(ngModel)]="selectedFrameworkId" (ngModelChange)="onFrameworkChange($event)" data-testid="select-framework" class="fw-select">
            <option [ngValue]="0">-- Select Framework --</option>
            <option *ngFor="let fw of frameworks()" [ngValue]="fw.id">{{ fw.name }} v{{ fw.version }} ({{ fw.status }})</option>
          </select>
        </div>
      </div>

      <div *ngIf="!selectedFrameworkId" class="empty-state" data-testid="text-no-framework">
        <span class="material-icon" style="font-size:48px;color:var(--platinum-text-muted);">assessment</span>
        <p>Select a prioritisation framework to begin scoring projects</p>
      </div>

      <ng-container *ngIf="activeFramework()">
        <div class="kpi-row" data-testid="kpi-strip">
          <div class="kpi-tile"><div class="kpi-num" data-testid="text-projects-scored">{{ scoredProjectCount() }}</div><div class="kpi-lab">Projects Scored</div></div>
          <div class="kpi-tile"><div class="kpi-num" data-testid="text-avg-score">{{ averageScore() | number:'1.2-2' }}</div><div class="kpi-lab">Average Score</div></div>
          <div class="kpi-tile"><div class="kpi-num" data-testid="text-top-project">{{ topProjectName() || 'N/A' }}</div><div class="kpi-lab">Top Project</div></div>
          <div class="kpi-tile"><div class="kpi-num" data-testid="text-budget-coverage">{{ budgetCoverage() | number:'1.0-0' }}%</div><div class="kpi-lab">Budget Coverage</div></div>
        </div>

        <div class="tab-bar" data-testid="tab-bar">
          <button *ngFor="let tab of tabs" class="tab-btn" [class.active]="activeTab() === tab.key"
            (click)="activeTab.set(tab.key)" [attr.data-testid]="'tab-' + tab.key">
            <span class="material-icon" style="font-size:18px;">{{ tab.icon }}</span> {{ tab.label }}
          </button>
        </div>

        <!-- Tab 1: Scoring Board -->
        <div *ngIf="activeTab() === 'scoring'" class="tab-content" data-testid="panel-scoring">
          <div class="scoring-layout">
            <div class="project-selector-panel card">
              <div class="card-header"><h2>Projects</h2>
                <div class="batch-nav" *ngIf="projects().length > 0">
                  <button class="icon-btn" (click)="prevProject()" [disabled]="currentProjectIndex() <= 0" data-testid="button-prev-project">
                    <span class="material-icon" style="font-size:18px;">chevron_left</span>
                  </button>
                  <span class="batch-counter" data-testid="text-batch-counter">{{ currentProjectIndex() + 1 }}/{{ projects().length }}</span>
                  <button class="icon-btn" (click)="nextProject()" [disabled]="currentProjectIndex() >= projects().length - 1" data-testid="button-next-project">
                    <span class="material-icon" style="font-size:18px;">chevron_right</span>
                  </button>
                </div>
              </div>
              <div class="card-body project-list">
                <div *ngFor="let p of projects(); let i = index"
                  class="project-card-item" [class.selected]="selectedProjectId === p.id"
                  (click)="selectProject(p, i)" [attr.data-testid]="'card-project-' + p.id">
                  <div class="proj-name">{{ p.name }}</div>
                  <div class="proj-meta">
                    <span class="class-badge" [class.capital]="p.classification==='Capital'">{{ p.classification }}</span>
                    <span class="priority-dot" [attr.data-p]="p.priority?.toLowerCase()"></span>
                    <span class="proj-score" *ngIf="getProjectComposite(p.id) > 0" data-testid="text-project-score">{{ getProjectComposite(p.id) | number:'1.2-2' }}</span>
                  </div>
                </div>
                <div *ngIf="!projects().length" class="empty">No projects in this cycle</div>
              </div>
            </div>

            <div class="scoring-main" *ngIf="selectedProjectId">
              <div class="card">
                <div class="card-header">
                  <h2><span class="material-icon card-icon" style="font-size:18px;">tune</span> Score: {{ selectedProjectName() }}</h2>
                  <div class="header-actions">
                    <button class="btn btn-secondary btn-sm" (click)="aiRecommendProject()" data-testid="button-ai-recommend">
                      <span class="material-icon" style="font-size:16px;">auto_awesome</span> AI Recommend
                    </button>
                    <button class="btn btn-primary btn-sm" (click)="saveAllScores()" data-testid="button-save-scores">
                      <span class="material-icon" style="font-size:16px;">save</span> Save Scores
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div class="composite-display" data-testid="text-composite-score">
                    <span class="comp-label">Composite Score</span>
                    <span class="comp-value">{{ liveComposite() | number:'1.2-2' }}</span>
                    <span class="comp-max">/ {{ activeFramework()!.scaleMax }}</span>
                  </div>

                  <div class="score-breakdown-bar" data-testid="chart-score-breakdown">
                    <div *ngFor="let c of activeCriteria()" class="breakdown-segment"
                      [style.width.%]="getWeightedContribution(c) / (activeFramework()!.scaleMax || 5) * 100"
                      [style.background]="getCategoryColor(c.category)"
                      [title]="c.name + ': ' + (getWeightedContribution(c) | number:'1.2-2')">
                    </div>
                  </div>
                  <div class="breakdown-legend">
                    <span *ngFor="let cat of categories" class="legend-item">
                      <span class="legend-dot" [style.background]="getCategoryColor(cat)"></span> {{ cat }}
                    </span>
                  </div>

                  <div class="criteria-groups">
                    <div *ngFor="let cat of categories" class="criteria-group">
                      <h3 class="group-title" [style.border-color]="getCategoryColor(cat)">{{ cat }}</h3>
                      <div *ngFor="let c of getCriteriaByCategory(cat)" class="criterion-slider-row" [attr.data-testid]="'slider-row-' + c.code">
                        <div class="crit-info">
                          <span class="crit-name">{{ c.name }}</span>
                          <span class="crit-weight">{{ c.weight }}%</span>
                        </div>
                        <div class="slider-wrap">
                          <input type="range" [min]="activeFramework()!.scaleMin" [max]="activeFramework()!.scaleMax" [step]="1"
                            [ngModel]="getScoreValue(c.id)" (ngModelChange)="setScoreValue(c.id, $event)"
                            class="score-slider" [style.--slider-color]="getCategoryColor(c.category)"
                            [attr.data-testid]="'input-score-' + c.code" />
                          <div class="slider-labels">
                            <span>{{ activeFramework()!.scaleMin }}</span>
                            <span class="score-val" [attr.data-testid]="'text-score-val-' + c.code">{{ getScoreValue(c.id) }}</span>
                            <span>{{ activeFramework()!.scaleMax }}</span>
                          </div>
                          <div class="scale-label" *ngIf="getScaleLabel(getScoreValue(c.id))" data-testid="text-scale-label">{{ getScaleLabel(getScoreValue(c.id)) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="scoring-main" *ngIf="!selectedProjectId">
              <div class="empty-state">
                <span class="material-icon" style="font-size:36px;color:var(--platinum-text-muted);">touch_app</span>
                <p>Select a project from the list to begin scoring</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Drag-and-Rank Board -->
        <div *ngIf="activeTab() === 'ranking'" class="tab-content" data-testid="panel-ranking">
          <div class="card">
            <div class="card-header">
              <h2><span class="material-icon card-icon" style="font-size:18px;">format_list_numbered</span> Project Rankings</h2>
              <div class="header-actions">
                <button class="btn btn-secondary btn-sm" (click)="resetRanks()" data-testid="button-reset-ranks">
                  <span class="material-icon" style="font-size:16px;">restart_alt</span> Reset to Calculated
                </button>
                <button class="btn btn-primary btn-sm" (click)="saveRanks()" data-testid="button-save-ranks">
                  <span class="material-icon" style="font-size:16px;">save</span> Save Ranks
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="rank-list" data-testid="list-rankings">
                <div *ngFor="let r of rankingsList(); let i = index"
                  class="rank-card" draggable="true"
                  (dragstart)="onDragStart($event, i)"
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event, i)"
                  (dragend)="onDragEnd()"
                  [class.dragging]="dragIndex === i"
                  [class.drag-over]="dragOverIndex === i && dragIndex !== i"
                  [attr.data-testid]="'rank-card-' + r.projectId">
                  <div class="rank-num" [class.override]="r.overrideRank">
                    <span class="material-icon" style="font-size:14px;cursor:grab;">drag_indicator</span>
                    {{ i + 1 }}
                  </div>
                  <div class="rank-info">
                    <div class="rank-name">{{ r.projectName }}</div>
                    <div class="rank-meta">
                      <span class="class-badge" [class.capital]="r.classification==='Capital'">{{ r.classification }}</span>
                      <span class="priority-dot" [attr.data-p]="r.priority?.toLowerCase()"></span>
                      <span>{{ r.department }}</span>
                    </div>
                  </div>
                  <div class="rank-score" data-testid="text-rank-score">{{ r.compositeScore | number:'1.2-2' }}</div>
                  <div class="rank-budget">R{{ (r.budgetAmount || 0) | number:'1.0-0' }}</div>
                  <div class="rank-override" *ngIf="r.overrideRank" data-testid="badge-override">
                    <span class="material-icon" style="font-size:14px;">swap_vert</span> Override
                  </div>
                </div>
                <div *ngIf="!rankingsList().length" class="empty">No ranked projects yet. Score projects first.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Budget Impact Simulator -->
        <div *ngIf="activeTab() === 'budget'" class="tab-content" data-testid="panel-budget">
          <div class="budget-summary-cards">
            <div class="kpi-tile budget-kpi">
              <div class="kpi-num" data-testid="text-total-budget">R{{ (budgetData()?.totalBudget || 0) / 1000000 | number:'1.1-1' }}M</div>
              <div class="kpi-lab">Total Budget</div>
            </div>
            <div class="kpi-tile budget-kpi allocated">
              <div class="kpi-num" data-testid="text-allocated-budget">R{{ (budgetData()?.selectedBudget || 0) / 1000000 | number:'1.1-1' }}M</div>
              <div class="kpi-lab">Budget Allocated</div>
            </div>
            <div class="kpi-tile budget-kpi remaining">
              <div class="kpi-num" data-testid="text-remaining-budget">R{{ (((budgetData()?.totalBudget || 0) - (budgetData()?.selectedBudget || 0)) / 1000000) | number:'1.1-1' }}M</div>
              <div class="kpi-lab">Budget Remaining</div>
            </div>
            <div class="kpi-tile budget-kpi">
              <div class="kpi-num" data-testid="text-funded-count">{{ budgetData()?.selectedCount || 0 }}</div>
              <div class="kpi-lab">Projects Funded</div>
            </div>
            <div class="kpi-tile budget-kpi excluded-kpi">
              <div class="kpi-num" data-testid="text-unfunded-count">{{ budgetData()?.excludedCount || 0 }}</div>
              <div class="kpi-lab">Projects Unfunded</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2><span class="material-icon card-icon" style="font-size:18px;">account_balance</span> Budget Threshold</h2>
            </div>
            <div class="card-body">
              <div class="budget-slider-row">
                <label>Budget Threshold</label>
                <input type="range" [min]="0" [max]="budgetData()?.totalBudget || 0" [step]="100000"
                  [(ngModel)]="budgetThreshold" (ngModelChange)="onBudgetThresholdChange($event)"
                  class="budget-slider" data-testid="input-budget-threshold" />
                <span class="budget-val" data-testid="text-threshold-val">R{{ (budgetThreshold / 1000000) | number:'1.1-1' }}M</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h2>Projects by Rank</h2></div>
            <div class="card-body">
              <div class="table-scroll">
                <table class="data-table" data-testid="table-budget-projects">
                  <thead>
                    <tr><th>#</th><th>Project</th><th>Score</th><th>Budget</th><th>Running Total</th><th>Status</th><th>Toggle</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of budgetProjects(); let i = index"
                      [class.budget-excluded]="!p.included"
                      [attr.data-testid]="'row-budget-' + p.ranking.projectId">
                      <td>{{ i + 1 }}</td>
                      <td><strong>{{ p.ranking.projectName }}</strong></td>
                      <td>{{ p.ranking.compositeScore | number:'1.2-2' }}</td>
                      <td>R{{ (p.ranking.budgetAmount || 0) | number:'1.0-0' }}</td>
                      <td>R{{ p.runningTotal | number:'1.0-0' }}</td>
                      <td>
                        <span class="status-pill" [attr.data-status]="p.included ? 'completed' : 'overdue'">
                          {{ p.included ? 'Funded' : 'Excluded' }}
                        </span>
                      </td>
                      <td>
                        <button class="icon-btn" (click)="toggleBudgetProject(p.ranking.projectId)" [attr.data-testid]="'button-toggle-' + p.ranking.projectId">
                          <span class="material-icon" style="font-size:18px;">{{ p.toggled ? 'toggle_on' : 'toggle_off' }}</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: AI Recommendations -->
        <div *ngIf="activeTab() === 'ai'" class="tab-content" data-testid="panel-ai">
          <div class="card">
            <div class="card-header">
              <h2><span class="material-icon card-icon" style="font-size:18px;">auto_awesome</span> AI Recommendations</h2>
              <div class="header-actions">
                <span class="ai-mode-badge" [attr.data-mode]="activeFramework()!.aiMode.toLowerCase()" data-testid="text-ai-mode">
                  Mode: {{ activeFramework()!.aiMode }}
                </span>
                <button class="btn btn-primary btn-sm" (click)="generateAllAi()" [disabled]="aiLoading()" data-testid="button-generate-ai-all">
                  <span class="material-icon spin" style="font-size:16px;" *ngIf="aiLoading()">refresh</span>
                  <span class="material-icon" style="font-size:16px;" *ngIf="!aiLoading()">auto_awesome</span>
                  Generate AI Recommendations
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="ai-explanation" data-testid="text-ai-explanation">
                <span class="material-icon" style="font-size:18px;color:var(--platinum-info);">info</span>
                <span *ngIf="activeFramework()!.aiMode === 'Disabled'">AI recommendations are currently disabled. Enable them in Framework Configuration.</span>
                <span *ngIf="activeFramework()!.aiMode === 'Advisory'">AI provides advisory scores for comparison. Human scores are used for final ranking. Human weight: {{ activeFramework()!.humanWeight }}%, AI weight: {{ activeFramework()!.aiWeight }}%</span>
                <span *ngIf="activeFramework()!.aiMode === 'Blended'">AI and human scores are blended using configured weights (Human: {{ activeFramework()!.humanWeight }}%, AI: {{ activeFramework()!.aiWeight }}%). The blended score determines final ranking.</span>
              </div>

              <div *ngIf="aiSuccess()" class="alert alert-success" data-testid="alert-ai-success">
                <span class="material-icon" style="font-size:18px;">check_circle</span> {{ aiSuccess() }}
              </div>

              <div class="ai-project-select">
                <label>Select project to compare scores:</label>
                <select [(ngModel)]="aiSelectedProjectId" (ngModelChange)="loadAiComparison($event)" data-testid="select-ai-project">
                  <option [ngValue]="0">-- Select Project --</option>
                  <option *ngFor="let p of projects()" [ngValue]="p.id">{{ p.name }}</option>
                </select>
              </div>

              <div *ngIf="aiSelectedProjectId && aiComparisonScores().length" class="ai-comparison" data-testid="panel-ai-comparison">
                <div class="table-scroll">
                  <table class="data-table">
                    <thead>
                      <tr><th>Criterion</th><th>Category</th><th>Weight</th><th>Human Score</th><th>AI Score</th><th>Blended</th><th>Reasoning</th><th>Accept AI</th></tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let s of aiComparisonScores()" [attr.data-testid]="'row-ai-' + s.criteriaId">
                        <td><strong>{{ s.criteriaName }}</strong></td>
                        <td><span class="category-tag" [style.background]="getCategoryColor(s.category)">{{ s.category }}</span></td>
                        <td>{{ s.weight }}%</td>
                        <td>
                          <span class="score-chip human">{{ s.humanScore !== null && s.humanScore !== undefined ? s.humanScore : '-' }}</span>
                        </td>
                        <td>
                          <span class="score-chip ai">{{ s.aiScore !== null && s.aiScore !== undefined ? s.aiScore : '-' }}</span>
                        </td>
                        <td>
                          <span class="score-chip blended">{{ s.blendedScore | number:'1.2-2' }}</span>
                        </td>
                        <td class="reasoning-cell">{{ getAiReasoning(s.criteriaCode) }}</td>
                        <td>
                          <button class="btn btn-sm btn-outline" (click)="acceptAiScore(s)"
                            [disabled]="s.aiScore === null || s.aiScore === undefined"
                            [attr.data-testid]="'button-accept-ai-' + s.criteriaId">
                            <span class="material-icon" style="font-size:14px;">check</span> Accept
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="ai-blended-summary" *ngIf="activeFramework()!.aiMode === 'Blended'" data-testid="text-blended-summary">
                  <span class="material-icon" style="font-size:18px;color:var(--platinum-accent);">functions</span>
                  Blended Composite Score: <strong>{{ aiBlendedComposite() | number:'1.2-2' }}</strong>
                </div>
              </div>

              <div *ngIf="aiSelectedProjectId && !aiComparisonScores().length" class="empty">
                No scores available. Generate AI recommendations first.
              </div>
            </div>
          </div>
        </div>

        <!-- Ranked Results Summary (always visible) -->
        <div class="card results-summary" *ngIf="rankingsList().length" data-testid="panel-results-summary">
          <div class="card-header">
            <h2><span class="material-icon card-icon" style="font-size:18px;">emoji_events</span> Final Ranked Results</h2>
          </div>
          <div class="card-body">
            <div class="table-scroll">
              <table class="data-table" data-testid="table-final-rankings">
                <thead>
                  <tr><th>Rank</th><th>Project</th><th>Classification</th><th>Department</th><th>Composite Score</th><th>Budget</th><th>Priority</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of rankingsList()" [attr.data-testid]="'row-final-' + r.projectId">
                    <td><strong>{{ r.rank }}</strong></td>
                    <td>{{ r.projectName }}</td>
                    <td><span class="class-badge" [class.capital]="r.classification==='Capital'">{{ r.classification }}</span></td>
                    <td>{{ r.department }}</td>
                    <td><strong>{{ r.compositeScore | number:'1.2-2' }}</strong></td>
                    <td>R{{ (r.budgetAmount || 0) | number:'1.0-0' }}</td>
                    <td><span class="priority-dot" [attr.data-p]="r.priority?.toLowerCase()"></span> {{ r.priority }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .fw-select { min-width: 280px; }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--platinum-text-muted); }
    .empty-state p { margin-top: 12px; font-size: 14px; }

    .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .kpi-tile { background: white; border: 1px solid var(--platinum-border); border-radius: 10px; padding: 12px 20px; flex: 1; min-width: 100px; text-align: center; }
    .kpi-num { font-size: 18px; font-weight: 700; color: var(--platinum-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
    .kpi-lab { font-size: 11px; color: var(--platinum-text-muted); text-transform: uppercase; }

    .tab-bar { display: flex; gap: 4px; margin-bottom: 16px; background: white; border: 1px solid var(--platinum-border); border-radius: 10px; padding: 4px; flex-wrap: wrap; }
    .tab-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; background: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--platinum-text-secondary); cursor: pointer; transition: all 0.15s; font-family: inherit; white-space: nowrap; }
    .tab-btn:hover { background: var(--platinum-surface-alt); color: var(--platinum-text); }
    .tab-btn.active { background: var(--platinum-primary); color: white; }

    .scoring-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
    @media (max-width: 900px) { .scoring-layout { grid-template-columns: 1fr; } }

    .project-list { max-height: 500px; overflow-y: auto; padding: 8px; }
    .project-card-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; transition: background 0.15s; border: 1px solid transparent; }
    .project-card-item:hover { background: var(--platinum-surface-alt); }
    .project-card-item.selected { background: #e3f2fd; border-color: #90caf9; }
    .proj-name { font-size: 13px; font-weight: 600; color: var(--platinum-text); margin-bottom: 4px; }
    .proj-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .proj-score { font-size: 12px; font-weight: 700; color: var(--platinum-primary); background: var(--platinum-surface-alt); padding: 1px 6px; border-radius: 4px; }

    .class-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #64748b; display: inline-block; white-space: nowrap; }
    .class-badge.capital { background: #e3f2fd; color: #1565c0; }
    .priority-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
    .priority-dot[data-p="critical"] { background: #b71c1c; }
    .priority-dot[data-p="high"] { background: #ef5350; }
    .priority-dot[data-p="medium"] { background: #f59e0b; }
    .priority-dot[data-p="low"] { background: #4caf50; }

    .batch-nav { display: flex; align-items: center; gap: 4px; }
    .batch-counter { font-size: 12px; font-weight: 600; color: var(--platinum-text-secondary); min-width: 40px; text-align: center; }

    .composite-display { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding: 12px 16px; background: var(--platinum-surface); border-radius: 10px; }
    .comp-label { font-size: 13px; font-weight: 600; color: var(--platinum-text-secondary); }
    .comp-value { font-size: 28px; font-weight: 700; color: var(--platinum-primary); }
    .comp-max { font-size: 14px; color: var(--platinum-text-muted); }

    .score-breakdown-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px; background: var(--platinum-surface-alt); }
    .breakdown-segment { height: 100%; min-width: 2px; transition: width 0.3s; }
    .breakdown-legend { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--platinum-text-secondary); }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    .criteria-groups { display: flex; flex-direction: column; gap: 16px; }
    .group-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--platinum-text-secondary); padding-bottom: 6px; border-bottom: 2px solid var(--platinum-border); margin-bottom: 8px; }

    .criterion-slider-row { display: flex; align-items: flex-start; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--platinum-border-light); }
    @media (max-width: 640px) { .criterion-slider-row { flex-direction: column; } }
    .crit-info { min-width: 160px; flex-shrink: 0; }
    .crit-name { font-size: 13px; font-weight: 600; color: var(--platinum-text); display: block; }
    .crit-weight { font-size: 11px; color: var(--platinum-text-muted); }
    .slider-wrap { flex: 1; min-width: 200px; }
    .score-slider { width: 100%; height: 6px; -webkit-appearance: none; appearance: none; border-radius: 3px; background: var(--platinum-surface-alt); outline: none; cursor: pointer; }
    .score-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--slider-color, var(--platinum-primary)); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    .score-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: var(--slider-color, var(--platinum-primary)); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    .slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--platinum-text-muted); margin-top: 2px; }
    .score-val { font-weight: 700; color: var(--platinum-primary); font-size: 14px; }
    .scale-label { font-size: 11px; color: var(--platinum-text-secondary); font-style: italic; margin-top: 2px; }

    .rank-list { display: flex; flex-direction: column; gap: 4px; }
    .rank-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--platinum-border); background: white; cursor: grab; transition: all 0.15s; flex-wrap: wrap; }
    .rank-card:hover { border-color: #90caf9; background: var(--platinum-surface-warm); }
    .rank-card.dragging { opacity: 0.4; }
    .rank-card.drag-over { border-color: var(--platinum-accent); border-style: dashed; background: #fffde7; }
    .rank-num { font-size: 16px; font-weight: 700; color: var(--platinum-text-muted); min-width: 48px; display: flex; align-items: center; gap: 4px; }
    .rank-num.override { color: var(--platinum-accent); }
    .rank-info { flex: 1; min-width: 150px; }
    .rank-name { font-size: 13px; font-weight: 600; color: var(--platinum-text); }
    .rank-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; font-size: 12px; color: var(--platinum-text-secondary); flex-wrap: wrap; }
    .rank-score { font-size: 16px; font-weight: 700; color: var(--platinum-primary); min-width: 60px; text-align: right; }
    .rank-budget { font-size: 12px; color: var(--platinum-text-secondary); min-width: 100px; text-align: right; }
    .rank-override { font-size: 11px; color: var(--platinum-accent); display: flex; align-items: center; gap: 2px; }

    .budget-summary-cards { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .budget-kpi { flex: 1; min-width: 120px; }
    .budget-kpi.allocated .kpi-num { color: var(--platinum-success); }
    .budget-kpi.remaining .kpi-num { color: var(--platinum-info); }
    .budget-kpi.excluded-kpi .kpi-num { color: var(--platinum-danger); }

    .budget-slider-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .budget-slider-row label { font-size: 13px; font-weight: 600; color: var(--platinum-text-secondary); min-width: 120px; }
    .budget-slider { flex: 1; min-width: 200px; height: 6px; -webkit-appearance: none; appearance: none; border-radius: 3px; background: linear-gradient(to right, var(--platinum-success), var(--platinum-warning), var(--platinum-danger)); outline: none; }
    .budget-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; border: 3px solid var(--platinum-primary); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    .budget-val { font-size: 14px; font-weight: 700; color: var(--platinum-primary); min-width: 80px; }

    .budget-excluded { opacity: 0.5; }
    .budget-excluded td { text-decoration: line-through; }
    .budget-excluded td:last-child, .budget-excluded td:nth-last-child(2) { text-decoration: none; }

    .ai-explanation { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; background: var(--platinum-info-light); border-radius: 8px; font-size: 13px; color: #0d47a1; margin-bottom: 16px; border: 1px solid var(--platinum-info-pastel); }
    .ai-mode-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .ai-mode-badge[data-mode="disabled"] { background: #f1f5f9; color: #64748b; }
    .ai-mode-badge[data-mode="advisory"] { background: #fff3e0; color: #ef6c00; }
    .ai-mode-badge[data-mode="blended"] { background: #e8f5e9; color: #1b5e20; }

    .ai-project-select { margin-bottom: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .ai-project-select label { font-size: 13px; font-weight: 600; color: var(--platinum-text-secondary); }
    .ai-project-select select { min-width: 260px; }

    .score-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; padding: 3px 8px; border-radius: 6px; font-size: 13px; font-weight: 700; }
    .score-chip.human { background: #e3f2fd; color: #1565c0; }
    .score-chip.ai { background: #ede7f6; color: #5e35b1; }
    .score-chip.blended { background: #e8f5e9; color: #2e7d32; }
    .category-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; color: white; }
    .reasoning-cell { font-size: 12px; color: var(--platinum-text-secondary); max-width: 200px; }

    .ai-blended-summary { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 12px 16px; background: var(--platinum-surface); border-radius: 8px; font-size: 14px; color: var(--platinum-text); }

    .results-summary { margin-top: 20px; }

    .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    app-prioritisation .data-table { min-width: 700px; }
  `]
})
export class PrioritisationComponent implements OnInit {
  frameworks = signal<PriorityFramework[]>([]);
  activeFramework = signal<PriorityFramework | null>(null);
  projects = signal<IdpProject[]>([]);
  rankingsList = signal<ProjectRanking[]>([]);
  scales = signal<PriorityScoringScale[]>([]);
  activeTab = signal<string>('scoring');
  aiLoading = signal(false);
  aiSuccess = signal<string>('');
  aiComparisonScores = signal<AiComparisonRow[]>([]);

  selectedFrameworkId = 0;
  selectedProjectId = 0;
  currentProjectIndex = signal(0);
  aiSelectedProjectId = 0;

  localScores: Map<number, number> = new Map();
  budgetData = signal<BudgetSimulationResult | null>(null);
  budgetThreshold = 0;
  budgetToggles: Set<number> = new Set();

  dragIndex: number | null = null;
  dragOverIndex: number | null = null;

  tabs = [
    { key: 'scoring', label: 'Scoring Board', icon: 'tune' },
    { key: 'ranking', label: 'Drag & Rank', icon: 'format_list_numbered' },
    { key: 'budget', label: 'Budget Simulator', icon: 'account_balance' },
    { key: 'ai', label: 'AI Recommendations', icon: 'auto_awesome' },
  ];

  categories = ['Strategic', 'Community', 'Financial', 'Delivery'];

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.api.getFrameworks().subscribe(fws => {
      this.frameworks.set(fws);
      const active = fws.find(f => f.status === 'Active');
      if (active) {
        this.selectedFrameworkId = active.id;
        this.onFrameworkChange(active.id);
      }
    });
  }

  onFrameworkChange(id: number) {
    if (!id) {
      this.activeFramework.set(null);
      return;
    }
    this.api.getFramework(id).subscribe(fw => {
      this.activeFramework.set(fw);
      this.loadScale(id);
      this.loadProjects(fw);
      this.loadRankings(id);
      this.loadBudget(id);
    });
  }

  private loadScale(fwId: number) {
    this.api.getScale(fwId).subscribe(s => this.scales.set(s));
  }

  private loadProjects(fw: PriorityFramework) {
    if (!fw.cycleId) {
      this.cycleState.ensureActiveCycle().then(c => {
        if (c) this.api.getProjects(c.id).subscribe(p => this.projects.set(p));
      });
    } else {
      this.api.getProjects(fw.cycleId).subscribe(p => this.projects.set(p));
    }
  }

  private loadRankings(fwId: number) {
    this.api.getRankings(fwId).subscribe(r => this.rankingsList.set(r));
  }

  private loadBudget(fwId: number, threshold?: number) {
    this.api.getBudgetSimulation(fwId, threshold).subscribe(b => {
      this.budgetData.set(b);
      if (!threshold && threshold !== 0) {
        this.budgetThreshold = b.totalBudget;
      }
    });
  }

  activeCriteria(): PriorityCriteria[] {
    return (this.activeFramework()?.criteria || []).filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getCriteriaByCategory(cat: string): PriorityCriteria[] {
    return this.activeCriteria().filter(c => c.category === cat);
  }

  selectProject(p: IdpProject, index: number) {
    this.selectedProjectId = p.id;
    this.currentProjectIndex.set(index);
    this.localScores.clear();
    this.api.getProjectScores(this.selectedFrameworkId, p.id).subscribe(scores => {
      scores.forEach(s => {
        this.localScores.set(s.criteriaId, s.humanScore ?? 0);
      });
    });
  }

  selectedProjectName(): string {
    return this.projects().find(p => p.id === this.selectedProjectId)?.name || '';
  }

  prevProject() {
    const idx = this.currentProjectIndex();
    if (idx > 0) {
      const p = this.projects()[idx - 1];
      this.selectProject(p, idx - 1);
    }
  }

  nextProject() {
    const idx = this.currentProjectIndex();
    if (idx < this.projects().length - 1) {
      const p = this.projects()[idx + 1];
      this.selectProject(p, idx + 1);
    }
  }

  getScoreValue(criteriaId: number): number {
    return this.localScores.get(criteriaId) ?? 0;
  }

  setScoreValue(criteriaId: number, val: number) {
    this.localScores.set(criteriaId, val);
  }

  getScaleLabel(val: number): string {
    const scale = this.scales().find(s => s.scoreValue === val);
    return scale?.label || '';
  }

  liveComposite(): number {
    const fw = this.activeFramework();
    if (!fw) return 0;
    return this.activeCriteria().reduce((sum, c) => {
      const score = this.localScores.get(c.id) ?? 0;
      return sum + (c.weight * score / 100);
    }, 0);
  }

  getWeightedContribution(c: PriorityCriteria): number {
    const score = this.localScores.get(c.id) ?? 0;
    return c.weight * score / 100;
  }

  getCategoryColor(cat: string): string {
    switch (cat) {
      case 'Strategic': return '#1565c0';
      case 'Community': return '#2e7d32';
      case 'Financial': return '#ef6c00';
      case 'Delivery': return '#7e57c2';
      default: return '#64748b';
    }
  }

  saveAllScores() {
    const scores: any[] = [];
    this.activeCriteria().forEach(c => {
      scores.push({
        criteriaId: c.id,
        humanScore: this.localScores.get(c.id) ?? 0,
        scoredBy: 'User',
      });
    });
    this.api.scoreProjectAll(this.selectedFrameworkId, this.selectedProjectId, scores).subscribe({
      next: () => {
        this.loadRankings(this.selectedFrameworkId);
        this.loadBudget(this.selectedFrameworkId, this.budgetThreshold);
      },
      error: (err: any) => alert('Failed to save scores: ' + (err.error || 'Unknown error'))
    });
  }

  aiRecommendProject() {
    this.api.aiRecommend(this.selectedFrameworkId, this.selectedProjectId).subscribe({
      next: (scores) => {
        scores.forEach(s => {
          if (s.aiScore !== null && s.aiScore !== undefined) {
            this.localScores.set(s.criteriaId, s.humanScore ?? this.localScores.get(s.criteriaId) ?? 0);
          }
        });
        this.loadRankings(this.selectedFrameworkId);
      },
      error: (err: any) => alert('AI recommendation failed: ' + (err.error || 'Unknown error'))
    });
  }

  getProjectComposite(projectId: number): number {
    const r = this.rankingsList().find(r => r.projectId === projectId);
    return r?.compositeScore ?? 0;
  }

  scoredProjectCount(): number {
    return this.rankingsList().filter(r => r.compositeScore > 0).length;
  }

  averageScore(): number {
    const scored = this.rankingsList().filter(r => r.compositeScore > 0);
    if (!scored.length) return 0;
    return scored.reduce((s, r) => s + r.compositeScore, 0) / scored.length;
  }

  topProjectName(): string {
    if (!this.rankingsList().length) return '';
    const top = this.rankingsList().reduce((best, r) => r.compositeScore > best.compositeScore ? r : best, this.rankingsList()[0]);
    return top.compositeScore > 0 ? top.projectName : '';
  }

  budgetCoverage(): number {
    const data = this.budgetData();
    if (!data || !data.totalBudget) return 0;
    return (data.selectedBudget / data.totalBudget) * 100;
  }

  // Drag and Rank
  onDragStart(event: DragEvent, index: number) {
    this.dragIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const target = (event.target as HTMLElement).closest('.rank-card');
    if (target) {
      const cards = Array.from(target.parentElement!.children);
      this.dragOverIndex = cards.indexOf(target);
    }
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.dragIndex === null || this.dragIndex === index) return;
    const list = [...this.rankingsList()];
    const [moved] = list.splice(this.dragIndex, 1);
    list.splice(index, 0, moved);
    list.forEach((r, i) => {
      r.rank = i + 1;
      r.overrideRank = i + 1;
    });
    this.rankingsList.set(list);
    this.dragIndex = null;
    this.dragOverIndex = null;
  }

  onDragEnd() {
    this.dragIndex = null;
    this.dragOverIndex = null;
  }

  saveRanks() {
    const ranks = this.rankingsList().map((r, i) => ({
      projectId: r.projectId,
      rank: i + 1,
    }));
    this.api.saveRanks(this.selectedFrameworkId, ranks).subscribe({
      next: () => this.loadRankings(this.selectedFrameworkId),
      error: (err: any) => alert('Failed to save ranks: ' + (err.error || 'Unknown error'))
    });
  }

  resetRanks() {
    this.loadRankings(this.selectedFrameworkId);
  }

  // Budget
  onBudgetThresholdChange(val: number) {
    this.budgetThreshold = val;
    this.loadBudget(this.selectedFrameworkId, val);
  }

  budgetProjects(): BudgetProjectRow[] {
    const data = this.budgetData();
    if (!data) return [];
    let runningTotal = 0;
    return data.projects.map(r => {
      const budget = r.budgetAmount || 0;
      const toggled = this.budgetToggles.has(r.projectId);
      const included = toggled ? !this.isWithinBudget(r, data) : this.isWithinBudget(r, data);
      if (included) runningTotal += budget;
      return { ranking: r, runningTotal, included, toggled };
    });
  }

  private isWithinBudget(r: ProjectRanking, data: BudgetSimulationResult): boolean {
    let total = 0;
    for (const p of data.projects) {
      if (p.projectId === r.projectId) {
        return total + (p.budgetAmount || 0) <= this.budgetThreshold;
      }
      if (!this.budgetToggles.has(p.projectId)) {
        total += p.budgetAmount || 0;
      }
    }
    return false;
  }

  toggleBudgetProject(projectId: number) {
    if (this.budgetToggles.has(projectId)) {
      this.budgetToggles.delete(projectId);
    } else {
      this.budgetToggles.add(projectId);
    }
  }

  // AI
  generateAllAi() {
    this.aiLoading.set(true);
    this.aiSuccess.set('');
    this.api.aiRecommendAll(this.selectedFrameworkId).subscribe({
      next: () => {
        this.aiLoading.set(false);
        this.aiSuccess.set('AI recommendations generated for all projects');
        this.loadRankings(this.selectedFrameworkId);
        this.loadBudget(this.selectedFrameworkId, this.budgetThreshold);
        if (this.aiSelectedProjectId) {
          this.loadAiComparison(this.aiSelectedProjectId);
        }
      },
      error: (err: any) => {
        this.aiLoading.set(false);
        alert('AI generation failed: ' + (err.error || 'Unknown error'));
      }
    });
  }

  loadAiComparison(projectId: number) {
    if (!projectId) {
      this.aiComparisonScores.set([]);
      return;
    }
    this.api.getProjectScores(this.selectedFrameworkId, projectId).subscribe(scores => {
      const criteria = this.activeCriteria();
      const rows: AiComparisonRow[] = criteria.map(c => {
        const s = scores.find(sc => sc.criteriaId === c.id);
        return {
          criteriaId: c.id,
          criteriaName: c.name,
          criteriaCode: c.code,
          category: c.category,
          weight: c.weight,
          humanScore: s?.humanScore ?? null,
          aiScore: s?.aiScore ?? null,
          blendedScore: s?.blendedScore ?? 0,
        };
      });
      this.aiComparisonScores.set(rows);
    });
  }

  acceptAiScore(row: AiComparisonRow) {
    if (row.aiScore === null || row.aiScore === undefined) return;
    this.api.scoreProject({
      frameworkId: this.selectedFrameworkId,
      projectId: this.aiSelectedProjectId,
      criteriaId: row.criteriaId,
      humanScore: row.aiScore,
      scoredBy: 'User (accepted AI)',
    } as any).subscribe({
      next: () => {
        this.loadAiComparison(this.aiSelectedProjectId);
        this.loadRankings(this.selectedFrameworkId);
      }
    });
  }

  aiBlendedComposite(): number {
    const scores = this.aiComparisonScores();
    if (!scores.length) return 0;
    return scores.reduce((sum, s) => sum + (s.weight * s.blendedScore / 100), 0);
  }

  getAiReasoning(code: string): string {
    const reasons: Record<string, string> = {
      'STRATEGIC_ALIGNMENT': 'Based on number of linked strategic objectives',
      'SERVICE_DELIVERY_IMPACT': 'Based on project classification (Capital/Operational)',
      'COMMUNITY_NEED': 'Based on assigned priority level',
      'LEGISLATIVE_COMPLIANCE': 'Based on critical priority status',
      'FINANCIAL_FEASIBILITY': 'Based on budget allocation and funding source',
      'IMPLEMENTATION_READINESS': 'Based on current project status',
      'DELIVERY_RISK': 'Based on budget size risk assessment',
    };
    return reasons[code] || 'Rule-based scoring analysis';
  }
}

interface AiComparisonRow {
  criteriaId: number;
  criteriaName: string;
  criteriaCode: string;
  category: string;
  weight: number;
  humanScore: number | null;
  aiScore: number | null;
  blendedScore: number;
}

interface BudgetProjectRow {
  ranking: ProjectRanking;
  runningTotal: number;
  included: boolean;
  toggled: boolean;
}
