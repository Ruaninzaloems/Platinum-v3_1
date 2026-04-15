import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import {
  PriorityFramework,
  PriorityCriteria,
  PriorityFrameworkAudit,
} from '../../core/models/idp.models';

@Component({
  selector: 'app-priority-config',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 data-testid="text-page-title">Priority Framework Configuration</h1>
          <p class="page-subtitle">Configure scoring frameworks, criteria weights, and AI settings</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="showCreateForm()" *ngIf="!creatingFramework()" data-testid="button-create-framework">
            <span class="material-icon">add</span> New Framework
          </button>
        </div>
      </div>

      <div class="toast-msg" *ngIf="toastMsg()" [class.toast-error]="toastType() === 'error'" [class.toast-success]="toastType() === 'success'" data-testid="text-toast">
        {{ toastMsg() }}
        <button class="toast-close" (click)="toastMsg.set('')">&times;</button>
      </div>

      <div class="card" data-testid="card-framework-selector">
        <div class="card-header">
          <h2><span class="material-icon card-icon">settings</span> Framework Management</h2>
        </div>
        <div class="card-body">
          <div class="fw-selector-row">
            <div class="field" style="flex:1;min-width:200px;">
              <label>Select Framework</label>
              <select [(ngModel)]="selectedFrameworkId" (ngModelChange)="onFrameworkSelected($event)" data-testid="select-framework">
                <option [ngValue]="0">-- Choose Framework --</option>
                <option *ngFor="let fw of frameworks()" [ngValue]="fw.id">
                  {{ fw.name }} v{{ fw.version }} ({{ fw.status }})
                </option>
              </select>
            </div>
            <div class="fw-actions" *ngIf="selectedFramework()">
              <span class="status-pill" [attr.data-status]="selectedFramework()!.status.toLowerCase()" data-testid="text-framework-status">{{ selectedFramework()!.status }}</span>
              <span class="version-pill" data-testid="text-framework-version">v{{ selectedFramework()!.version }}</span>
              <span class="cycle-pill" *ngIf="linkedCycleName()" data-testid="text-framework-cycle">{{ linkedCycleName() }}</span>
              <button class="btn btn-sm btn-secondary" (click)="startEditFramework()" data-testid="button-edit-framework">
                <span class="material-icon">edit</span> Edit
              </button>
              <button class="btn btn-sm btn-secondary" (click)="cloneFramework()" data-testid="button-clone-framework">
                <span class="material-icon">content_copy</span> Clone
              </button>
              <button class="btn btn-sm btn-success" (click)="showActivateConfirm.set(true)"
                *ngIf="selectedFramework()!.status !== 'Active'"
                data-testid="button-activate-framework">
                <span class="material-icon">check_circle</span> Activate
              </button>
              <button class="btn btn-sm btn-danger" (click)="showArchiveConfirm.set(true)"
                *ngIf="selectedFramework()!.status === 'Active'"
                data-testid="button-archive-framework">
                <span class="material-icon">archive</span> Archive
              </button>
            </div>
          </div>

          <div class="create-fw-form" *ngIf="creatingFramework()" data-testid="form-create-framework">
            <div class="divider"></div>
            <h3>Create New Framework</h3>
            <div class="form-grid">
              <div class="field"><label>Name</label><input [(ngModel)]="newFw.name" data-testid="input-fw-name" placeholder="e.g. George Municipality FY2025 Framework" /></div>
              <div class="field"><label>Scale Min</label><input type="number" [(ngModel)]="newFw.scaleMin" data-testid="input-fw-scale-min" /></div>
              <div class="field"><label>Scale Max</label><input type="number" [(ngModel)]="newFw.scaleMax" data-testid="input-fw-scale-max" /></div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" (click)="creatingFramework.set(false)" data-testid="button-cancel-create">Cancel</button>
              <button class="btn btn-primary" (click)="createFramework()" [disabled]="!newFw.name" data-testid="button-save-framework">Create</button>
            </div>
          </div>

          <div class="edit-fw-form" *ngIf="editingFramework()" data-testid="form-edit-framework">
            <div class="divider"></div>
            <h3>Edit Framework</h3>
            <div class="form-grid">
              <div class="field"><label>Name</label><input [(ngModel)]="editFw.name" data-testid="input-edit-fw-name" /></div>
              <div class="field"><label>Scale Min</label><input type="number" [(ngModel)]="editFw.scaleMin" data-testid="input-edit-fw-scale-min" /></div>
              <div class="field"><label>Scale Max</label><input type="number" [(ngModel)]="editFw.scaleMax" data-testid="input-edit-fw-scale-max" /></div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" (click)="editingFramework.set(false)" data-testid="button-cancel-edit-fw">Cancel</button>
              <button class="btn btn-primary" (click)="saveFrameworkEdit()" [disabled]="!editFw.name" data-testid="button-save-edit-fw">Save Changes</button>
            </div>
          </div>

          <div class="alert alert-warning" *ngIf="showActivateConfirm()">
            <span class="material-icon">warning</span>
            Activating this framework will archive the currently active one. Continue?
            <button class="btn btn-sm btn-success" (click)="activateFramework()" data-testid="button-confirm-activate">Yes, Activate</button>
            <button class="btn btn-sm btn-secondary" (click)="showActivateConfirm.set(false)" data-testid="button-cancel-activate">Cancel</button>
          </div>

          <div class="alert alert-warning" *ngIf="showArchiveConfirm()">
            <span class="material-icon">warning</span>
            Archive this framework? It will no longer be the active scoring framework.
            <button class="btn btn-sm btn-danger" (click)="archiveFramework()" data-testid="button-confirm-archive">Yes, Archive</button>
            <button class="btn btn-sm btn-secondary" (click)="showArchiveConfirm.set(false)" data-testid="button-cancel-archive">Cancel</button>
          </div>
        </div>
      </div>

      <div class="config-tabs" *ngIf="selectedFramework()" data-testid="config-tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'criteria'" (click)="activeTab.set('criteria')" data-testid="tab-criteria">
          <span class="material-icon">list_alt</span> Criteria
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'weights'" (click)="activeTab.set('weights')" data-testid="tab-weights">
          <span class="material-icon">tune</span> Weights
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'scale'" (click)="activeTab.set('scale')" data-testid="tab-scale">
          <span class="material-icon">linear_scale</span> Scoring Scale
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'ai'" (click)="activeTab.set('ai')" data-testid="tab-ai">
          <span class="material-icon">psychology</span> AI Config
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'audit'" (click)="activeTab.set('audit'); loadAudit()" data-testid="tab-audit">
          <span class="material-icon">history</span> Audit Trail
        </button>
      </div>

      <div class="card" *ngIf="selectedFramework() && activeTab() === 'criteria'" data-testid="card-criteria">
        <div class="card-header">
          <h2><span class="material-icon card-icon">list_alt</span> Criteria Management</h2>
          <button class="btn btn-sm btn-primary" (click)="showCriterionForm.set(true)" *ngIf="!showCriterionForm()" data-testid="button-add-criterion">
            <span class="material-icon">add</span> Add Criterion
          </button>
        </div>
        <div class="card-body">
          <div class="criterion-form" *ngIf="showCriterionForm()" data-testid="form-criterion">
            <h4 style="margin-bottom:12px;">{{ editingCriterionId ? 'Edit Criterion' : 'Add New Criterion' }}</h4>
            <div class="form-grid">
              <div class="field"><label>Code</label><input [(ngModel)]="cf.code" placeholder="e.g. STRATEGIC_ALIGNMENT" data-testid="input-criterion-code" /></div>
              <div class="field"><label>Name</label><input [(ngModel)]="cf.name" placeholder="e.g. Strategic Alignment" data-testid="input-criterion-name" /></div>
              <div class="field"><label>Category</label>
                <select [(ngModel)]="cf.category" data-testid="select-criterion-category">
                  <option value="Strategic">Strategic</option>
                  <option value="Community">Community</option>
                  <option value="Financial">Financial</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>
              <div class="field"><label>Weight (%)</label><input type="number" [(ngModel)]="cf.weight" min="0" max="100" step="1" data-testid="input-criterion-weight" /></div>
              <div class="field"><label>Sort Order</label><input type="number" [(ngModel)]="cf.sortOrder" data-testid="input-criterion-sort" /></div>
              <div class="field"><label>Active</label>
                <select [ngModel]="cf.isActive ? 'true' : 'false'" (ngModelChange)="cf.isActive = $event === 'true'" data-testid="select-criterion-active">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div class="field full"><label>Description</label><textarea [(ngModel)]="cf.description" rows="2" data-testid="input-criterion-desc" placeholder="Describe how this criterion should be evaluated"></textarea></div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" (click)="cancelCriterion()" data-testid="button-cancel-criterion">Cancel</button>
              <button class="btn btn-primary" (click)="saveCriterion()" [disabled]="!cf.code || !cf.name" data-testid="button-save-criterion">
                {{ editingCriterionId ? 'Update Criterion' : 'Add Criterion' }}
              </button>
            </div>
          </div>

          <div class="weight-total-strip" *ngIf="criteria().length > 0">
            <span class="weight-total-badge" [class.valid]="weightTotal() === 100" [class.invalid]="weightTotal() !== 100">
              <span class="material-icon">balance</span> Weight Total: {{ weightTotal() | number:'1.0-1' }}%
            </span>
            <span class="weight-hint" *ngIf="weightTotal() !== 100">Active criteria weights must total 100% before activation</span>
          </div>

          <div *ngFor="let cat of categories" class="category-group" data-testid="group-category">
            <div class="category-header" (click)="toggleCategory(cat)">
              <span class="material-icon">{{ collapsedCategories[cat] ? 'expand_more' : 'expand_less' }}</span>
              <span class="category-label" [attr.data-cat]="cat.toLowerCase()">{{ cat }}</span>
              <span class="category-count">{{ criteriaByCategory(cat).length }} criteria</span>
              <span class="category-weight">{{ categoryWeight(cat) | number:'1.0-1' }}%</span>
            </div>
            <div class="table-scroll" *ngIf="!collapsedCategories[cat]">
              <table class="data-table compact">
                <thead>
                  <tr><th>Code</th><th>Name</th><th>Weight</th><th>Active</th><th>Order</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of criteriaByCategory(cat)" [attr.data-testid]="'row-criterion-' + c.id" [class.inactive-row]="!c.isActive">
                    <td><code>{{ c.code }}</code></td>
                    <td>
                      <strong>{{ c.name }}</strong>
                      <br *ngIf="c.description"><span class="text-muted" style="font-size:11px;" *ngIf="c.description">{{ c.description }}</span>
                    </td>
                    <td><span class="weight-badge">{{ c.weight }}%</span></td>
                    <td>
                      <span class="active-indicator" [class.active]="c.isActive" [class.inactive]="!c.isActive">
                        {{ c.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>{{ c.sortOrder }}</td>
                    <td>
                      <div class="action-btns">
                        <button class="icon-btn" (click)="editCriterion(c)" title="Edit criterion" [attr.data-testid]="'button-edit-criterion-' + c.id">
                          <span class="material-icon">edit</span>
                        </button>
                        <button class="icon-btn" (click)="toggleCriterionActive(c)" [title]="c.isActive ? 'Deactivate' : 'Reactivate'" [attr.data-testid]="'button-toggle-criterion-' + c.id">
                          <span class="material-icon">{{ c.isActive ? 'visibility_off' : 'visibility' }}</span>
                        </button>
                        <button class="icon-btn danger" (click)="deleteCriterion(c)" title="Delete criterion" [attr.data-testid]="'button-delete-criterion-' + c.id">
                          <span class="material-icon">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="!criteriaByCategory(cat).length"><td colspan="6" class="empty">No criteria in this category</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="selectedFramework() && activeTab() === 'weights'" data-testid="card-weights">
        <div class="card-header">
          <h2><span class="material-icon card-icon">tune</span> Weight Configuration</h2>
          <div class="weight-total-header">
            <span class="weight-total-badge" [class.valid]="weightTotal() === 100" [class.invalid]="weightTotal() !== 100" data-testid="text-weight-total">
              Total: {{ weightTotal() | number:'1.0-1' }}%
            </span>
            <button class="btn btn-sm btn-secondary" (click)="autoRedistribute()" data-testid="button-redistribute">
              <span class="material-icon">balance</span> Auto-redistribute
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="weight-progress-bar">
            <div class="weight-fill" [style.width.%]="weightTotal()" [class.over]="weightTotal() > 100" [class.valid]="weightTotal() === 100"></div>
          </div>
          <div class="weight-sliders">
            <div *ngFor="let c of activeCriteria(); let i = index" class="weight-slider-row" [attr.data-testid]="'slider-weight-' + c.id">
              <div class="slider-info">
                <span class="slider-category" [attr.data-cat]="c.category.toLowerCase()">{{ c.category }}</span>
                <span class="slider-name">{{ c.name }}</span>
              </div>
              <div class="slider-control">
                <input type="range" min="0" max="100" step="1"
                  [ngModel]="c.weight" (ngModelChange)="updateWeight(c, $event)"
                  class="weight-range"
                  [attr.data-testid]="'range-weight-' + c.id" />
                <div class="slider-value">
                  <input type="number" min="0" max="100" step="1"
                    [ngModel]="c.weight" (ngModelChange)="updateWeight(c, $event)"
                    class="weight-num-input"
                    [attr.data-testid]="'input-weight-' + c.id" />
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="saveWeights()" [disabled]="weightTotal() !== 100" data-testid="button-save-weights">
              <span class="material-icon">save</span> Save Weights
            </button>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="selectedFramework() && activeTab() === 'scale'" data-testid="card-scale">
        <div class="card-header">
          <h2><span class="material-icon card-icon">linear_scale</span> Scoring Scale Configuration</h2>
        </div>
        <div class="card-body">
          <div class="scale-presets">
            <label>Scale Preset:</label>
            <button class="filter-chip" [class.active]="scalePreset() === '3'" (click)="applyPreset('3')" data-testid="button-preset-3">3-Point</button>
            <button class="filter-chip" [class.active]="scalePreset() === '5'" (click)="applyPreset('5')" data-testid="button-preset-5">5-Point</button>
            <button class="filter-chip" [class.active]="scalePreset() === '10'" (click)="applyPreset('10')" data-testid="button-preset-10">10-Point</button>
            <button class="filter-chip" [class.active]="scalePreset() === 'custom'" (click)="applyPreset('custom')" data-testid="button-preset-custom">Custom</button>
          </div>

          <div class="scale-editor">
            <div *ngFor="let s of scaleItems; let i = index" class="scale-item" [attr.data-testid]="'scale-item-' + s.scoreValue">
              <div class="scale-value-badge">{{ s.scoreValue }}</div>
              <input [(ngModel)]="s.label" placeholder="Label for this score" class="scale-label-input" [attr.data-testid]="'input-scale-label-' + s.scoreValue" />
              <button class="icon-btn" (click)="removeScaleItem(i)" *ngIf="scalePreset() === 'custom'" [attr.data-testid]="'button-remove-scale-' + s.scoreValue">
                <span class="material-icon">close</span>
              </button>
            </div>
            <button class="btn btn-sm btn-secondary" (click)="addScaleItem()" *ngIf="scalePreset() === 'custom'" data-testid="button-add-scale-item">
              <span class="material-icon">add</span> Add Value
            </button>
          </div>

          <div class="scale-preview">
            <label>Preview:</label>
            <div class="scale-chips">
              <span *ngFor="let s of scaleItems" class="scale-chip" [attr.data-testid]="'chip-scale-' + s.scoreValue">
                <strong>{{ s.scoreValue }}</strong> {{ s.label }}
              </span>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" (click)="saveScale()" data-testid="button-save-scale">
              <span class="material-icon">save</span> Save Scale
            </button>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="selectedFramework() && activeTab() === 'ai'" data-testid="card-ai-config">
        <div class="card-header">
          <h2><span class="material-icon card-icon">psychology</span> AI Configuration</h2>
        </div>
        <div class="card-body">
          <div class="ai-mode-section">
            <label>AI Mode</label>
            <div class="ai-mode-options">
              <button class="ai-mode-btn" [class.selected]="aiConfig.aiMode === 'Disabled'" (click)="aiConfig.aiMode = 'Disabled'" data-testid="button-ai-disabled">
                <span class="material-icon ai-mode-icon">block</span>
                <strong>Disabled</strong>
                <span class="ai-mode-desc">AI scoring is turned off. Only human scores are used.</span>
              </button>
              <button class="ai-mode-btn" [class.selected]="aiConfig.aiMode === 'Advisory'" (click)="aiConfig.aiMode = 'Advisory'" data-testid="button-ai-advisory">
                <span class="material-icon ai-mode-icon">lightbulb</span>
                <strong>Advisory</strong>
                <span class="ai-mode-desc">AI provides recommendations but human scores determine rankings.</span>
              </button>
              <button class="ai-mode-btn" [class.selected]="aiConfig.aiMode === 'Blended'" (click)="aiConfig.aiMode = 'Blended'" data-testid="button-ai-blended">
                <span class="material-icon ai-mode-icon">merge</span>
                <strong>Blended</strong>
                <span class="ai-mode-desc">Final score blends human and AI scores based on weight split below.</span>
              </button>
            </div>
          </div>

          <div class="ai-weight-section" *ngIf="aiConfig.aiMode !== 'Disabled'">
            <label>Human vs AI Weight Split</label>
            <div class="ai-split-slider">
              <span class="split-label">Human: {{ aiConfig.humanWeight }}%</span>
              <input type="range" min="0" max="100" step="5" [(ngModel)]="aiConfig.humanWeight" (ngModelChange)="aiConfig.aiWeight = 100 - $event" class="weight-range" data-testid="range-ai-split" />
              <span class="split-label">AI: {{ aiConfig.aiWeight }}%</span>
            </div>
            <div class="ai-split-bar">
              <div class="human-bar" [style.width.%]="aiConfig.humanWeight"></div>
              <div class="ai-bar" [style.width.%]="aiConfig.aiWeight"></div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" (click)="saveAiConfig()" data-testid="button-save-ai-config">
              <span class="material-icon">save</span> Save AI Configuration
            </button>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="selectedFramework() && activeTab() === 'audit'" data-testid="card-audit">
        <div class="card-header">
          <h2><span class="material-icon card-icon">history</span> Audit Trail</h2>
        </div>
        <div class="card-body">
          <div class="audit-timeline" *ngIf="auditLogs().length; else noAudit">
            <div *ngFor="let log of auditLogs()" class="audit-entry" [attr.data-testid]="'audit-entry-' + log.id">
              <div class="audit-dot" [attr.data-type]="log.changeType.toLowerCase()"></div>
              <div class="audit-content">
                <div class="audit-header-row">
                  <span class="audit-type-badge" [attr.data-type]="log.changeType.toLowerCase()">{{ log.changeType }}</span>
                  <span class="audit-date">{{ log.changedDate | date:'medium' }}</span>
                </div>
                <div class="audit-details">
                  <span *ngIf="log.fieldName" class="audit-field">{{ log.fieldName }}</span>
                  <span *ngIf="log.oldValue" class="audit-old">{{ log.oldValue }}</span>
                  <span *ngIf="log.oldValue && log.newValue" class="audit-arrow">&rarr;</span>
                  <span *ngIf="log.newValue" class="audit-new">{{ log.newValue }}</span>
                </div>
                <div class="audit-by">by {{ log.changedBy }}</div>
              </div>
            </div>
          </div>
          <ng-template #noAudit>
            <div class="empty">No audit entries for this framework</div>
          </ng-template>
        </div>
      </div>

      <div class="card" *ngIf="!selectedFramework() && activeFrameworkSummary()" data-testid="card-framework-summary">
        <div class="card-header">
          <h2><span class="material-icon card-icon">assessment</span> Current Prioritisation Framework</h2>
        </div>
        <div class="card-body">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Framework</span>
              <span class="summary-value" data-testid="text-summary-name">{{ activeFrameworkSummary()!.name }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Version</span>
              <span class="summary-value" data-testid="text-summary-version">v{{ activeFrameworkSummary()!.version }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Active Criteria</span>
              <span class="summary-value" data-testid="text-summary-criteria">{{ activeFrameworkSummary()!.criteria?.length || 0 }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">AI Mode</span>
              <span class="summary-value" data-testid="text-summary-ai-mode">{{ activeFrameworkSummary()!.aiMode }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Scale</span>
              <span class="summary-value" data-testid="text-summary-scale">{{ activeFrameworkSummary()!.scaleMin }} - {{ activeFrameworkSummary()!.scaleMax }}</span>
            </div>
          </div>
          <div class="form-actions" style="margin-top:12px;">
            <button class="btn btn-primary" (click)="selectActiveFramework()" data-testid="button-select-active">
              <span class="material-icon">edit</span> Edit Active Framework
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fw-selector-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .fw-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-bottom: 5px; }
    .version-pill {
      display: inline-flex; padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; background: #e8eaf6; color: #283593;
    }
    .cycle-pill {
      display: inline-flex; padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; background: #e8f5e9; color: #1b5e20;
    }
    .create-fw-form, .edit-fw-form { padding-top: 16px; }
    .create-fw-form h3, .edit-fw-form h3 { margin-bottom: 12px; }

    .toast-msg {
      padding: 10px 16px; border-radius: 8px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500;
    }
    .toast-success { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .toast-error { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
    .toast-close { background: none; border: none; font-size: 18px; cursor: pointer; margin-left: auto; color: inherit; }

    .config-tabs {
      display: flex; gap: 4px; margin-bottom: 0; background: white;
      border: 1px solid var(--platinum-border); border-bottom: none;
      border-radius: var(--platinum-card-radius) var(--platinum-card-radius) 0 0;
      padding: 8px 8px 0; flex-wrap: wrap;
    }
    .tab-btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px;
      border: none; background: transparent; cursor: pointer; font-size: 13px;
      font-weight: 500; color: var(--platinum-text-secondary); border-radius: 8px 8px 0 0;
      transition: all 0.15s ease; font-family: inherit; white-space: nowrap;
    }
    .tab-btn:hover { background: var(--platinum-surface-alt); color: var(--platinum-text); }
    .tab-btn.active {
      background: var(--platinum-surface); color: var(--platinum-primary);
      font-weight: 600; border-bottom: 2px solid var(--platinum-primary);
    }
    .tab-btn .material-icon { font-size: 18px; }
    .config-tabs + .card { border-top-left-radius: 0; border-top-right-radius: 0; }

    .criterion-form {
      background: var(--platinum-surface); border: 1px solid var(--platinum-border);
      border-radius: 8px; padding: 16px; margin-bottom: 16px;
    }
    .criterion-form h4 { font-size: 14px; color: var(--platinum-text); }

    .weight-total-strip {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
      padding: 8px 12px; background: var(--platinum-surface); border-radius: 8px;
    }
    .weight-total-strip .weight-total-badge { display: inline-flex; align-items: center; gap: 4px; }
    .weight-total-strip .material-icon { font-size: 16px; }
    .weight-hint { font-size: 11px; color: var(--platinum-text-muted); }

    .category-group { margin-bottom: 12px; }
    .category-header {
      display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      background: var(--platinum-surface); border-radius: 8px; cursor: pointer;
      margin-bottom: 4px; transition: background 0.15s;
    }
    .category-header .material-icon { font-size: 16px; }
    .category-header:hover { background: var(--platinum-surface-alt); }
    .category-label {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 2px 8px; border-radius: 4px;
    }
    .category-label[data-cat="strategic"] { background: #e3f2fd; color: #1565c0; }
    .category-label[data-cat="community"] { background: #e8f5e9; color: #2e7d32; }
    .category-label[data-cat="financial"] { background: #fff3e0; color: #e65100; }
    .category-label[data-cat="delivery"] { background: #f3e5f5; color: #6a1b9a; }
    .category-count { font-size: 11px; color: var(--platinum-text-muted); }
    .category-weight { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--platinum-text); }
    .inactive-row { opacity: 0.5; }

    .weight-badge {
      display: inline-flex; padding: 2px 8px; border-radius: 12px;
      font-size: 11px; font-weight: 700; background: #f0f4ff; color: #3b5998;
    }
    .active-indicator {
      display: inline-flex; padding: 2px 8px; border-radius: 12px;
      font-size: 11px; font-weight: 600;
    }
    .active-indicator.active { background: #e8f5e9; color: #2e7d32; }
    .active-indicator.inactive { background: #ffebee; color: #c62828; }

    code { font-size: 11px; background: var(--platinum-surface-alt); padding: 1px 5px; border-radius: 3px; font-family: monospace; }

    .action-btns { display: flex; gap: 4px; }
    .icon-btn .material-icon { font-size: 16px; }
    .icon-btn.danger { color: #c62828; }
    .icon-btn.danger:hover { background: #ffebee; }

    .weight-total-header { display: flex; align-items: center; gap: 8px; }
    .weight-total-badge {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 20px;
      font-size: 13px; font-weight: 700;
    }
    .weight-total-badge .material-icon { font-size: 16px; }
    .weight-total-badge.valid { background: #e8f5e9; color: #2e7d32; }
    .weight-total-badge.invalid { background: #ffebee; color: #c62828; }

    .weight-progress-bar {
      height: 6px; background: #e2e8f0; border-radius: 3px;
      overflow: hidden; margin-bottom: 20px;
    }
    .weight-fill {
      height: 100%; background: #3b82f6; border-radius: 3px;
      transition: width 0.3s ease, background 0.3s;
    }
    .weight-fill.valid { background: #4caf50; }
    .weight-fill.over { background: #ef5350; }

    .weight-sliders { display: flex; flex-direction: column; gap: 12px; }
    .weight-slider-row {
      display: flex; align-items: center; gap: 16px; padding: 10px 12px;
      background: var(--platinum-surface); border-radius: 8px; flex-wrap: wrap;
    }
    .slider-info { display: flex; align-items: center; gap: 8px; min-width: 200px; flex: 0 0 auto; }
    .slider-category {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      padding: 1px 6px; border-radius: 3px;
    }
    .slider-category[data-cat="strategic"] { background: #e3f2fd; color: #1565c0; }
    .slider-category[data-cat="community"] { background: #e8f5e9; color: #2e7d32; }
    .slider-category[data-cat="financial"] { background: #fff3e0; color: #e65100; }
    .slider-category[data-cat="delivery"] { background: #f3e5f5; color: #6a1b9a; }
    .slider-name { font-size: 13px; font-weight: 500; color: var(--platinum-text); }

    .slider-control { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 200px; }
    .weight-range {
      flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
      background: #e2e8f0; border-radius: 2px; outline: none;
    }
    .weight-range::-webkit-slider-thumb {
      -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
      background: var(--platinum-primary); cursor: pointer; border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .slider-value { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
    .weight-num-input {
      width: 50px; text-align: right; padding: 4px 6px; font-size: 13px;
      font-weight: 600; border: 1px solid var(--platinum-border); border-radius: 6px;
    }

    .scale-presets { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .scale-presets label { margin-right: 4px; }
    .scale-editor { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .scale-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 12px;
      background: var(--platinum-surface); border-radius: 8px;
    }
    .scale-value-badge {
      width: 32px; height: 32px; border-radius: 50%; background: var(--platinum-primary);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    .scale-label-input { flex: 1; }
    .scale-preview { margin-bottom: 16px; }
    .scale-preview label { margin-bottom: 8px; display: block; }
    .scale-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .scale-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
      background: white; border: 1px solid var(--platinum-border); border-radius: 20px;
      font-size: 12px; color: var(--platinum-text);
    }
    .scale-chip strong { color: var(--platinum-primary); }

    .ai-mode-section { margin-bottom: 24px; }
    .ai-mode-section > label { display: block; margin-bottom: 10px; }
    .ai-mode-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 800px) { .ai-mode-options { grid-template-columns: 1fr; } }
    .ai-mode-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 20px 16px; border: 2px solid var(--platinum-border); border-radius: 10px;
      background: white; cursor: pointer; text-align: center; transition: all 0.15s;
      font-family: inherit;
    }
    .ai-mode-btn:hover { border-color: var(--platinum-primary); }
    .ai-mode-btn.selected {
      border-color: var(--platinum-primary); background: #f0f4ff;
    }
    .ai-mode-icon { font-size: 24px; color: var(--platinum-text-muted); }
    .ai-mode-btn.selected .ai-mode-icon { color: var(--platinum-primary); }
    .ai-mode-btn strong { font-size: 14px; color: var(--platinum-text); }
    .ai-mode-desc { font-size: 11px; color: var(--platinum-text-muted); line-height: 1.4; }

    .ai-weight-section { margin-bottom: 20px; }
    .ai-weight-section > label { display: block; margin-bottom: 10px; }
    .ai-split-slider {
      display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
    }
    .split-label { font-size: 13px; font-weight: 600; color: var(--platinum-text); white-space: nowrap; min-width: 90px; }
    .ai-split-bar {
      display: flex; height: 8px; border-radius: 4px; overflow: hidden; width: 100%;
    }
    .human-bar { background: var(--platinum-primary); transition: width 0.3s; }
    .ai-bar { background: var(--platinum-accent); transition: width 0.3s; }

    .audit-timeline { display: flex; flex-direction: column; gap: 0; padding-left: 20px; border-left: 2px solid var(--platinum-border); }
    .audit-entry {
      display: flex; gap: 12px; padding: 12px 0; position: relative;
    }
    .audit-dot {
      width: 10px; height: 10px; border-radius: 50%; background: #94a3b8;
      position: absolute; left: -26px; top: 16px; border: 2px solid white;
    }
    .audit-dot[data-type="created"] { background: #4caf50; }
    .audit-dot[data-type="activated"] { background: #2196f3; }
    .audit-dot[data-type="updated"], .audit-dot[data-type="weightchanged"] { background: #ff9800; }
    .audit-dot[data-type="cloned"] { background: #9c27b0; }
    .audit-dot[data-type="criterionadded"] { background: #4caf50; }
    .audit-dot[data-type="criteriondeactivated"] { background: #ef5350; }
    .audit-dot[data-type="scaleupdated"] { background: #00bcd4; }
    .audit-dot[data-type="aiconfigtupdated"] { background: #673ab7; }
    .audit-content { flex: 1; }
    .audit-header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
    .audit-type-badge {
      display: inline-flex; padding: 2px 8px; border-radius: 4px;
      font-size: 11px; font-weight: 600; text-transform: uppercase; background: #f1f5f9; color: #64748b;
    }
    .audit-type-badge[data-type="created"] { background: #e8f5e9; color: #2e7d32; }
    .audit-type-badge[data-type="activated"] { background: #e3f2fd; color: #1565c0; }
    .audit-type-badge[data-type="cloned"] { background: #f3e5f5; color: #6a1b9a; }
    .audit-date { font-size: 11px; color: var(--platinum-text-muted); }
    .audit-details { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 2px; flex-wrap: wrap; }
    .audit-field { font-weight: 600; color: var(--platinum-text); }
    .audit-old { color: #ef5350; text-decoration: line-through; }
    .audit-arrow { color: var(--platinum-text-muted); }
    .audit-new { color: #4caf50; font-weight: 500; }
    .audit-by { font-size: 11px; color: var(--platinum-text-muted); }

    .summary-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
    }
    .summary-item {
      display: flex; flex-direction: column; gap: 4px; padding: 12px;
      background: var(--platinum-surface); border-radius: 8px;
    }
    .summary-label { font-size: 10px; font-weight: 600; color: var(--platinum-text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
    .summary-value { font-size: 16px; font-weight: 700; color: var(--platinum-text); }

    .btn .material-icon { font-size: 16px; vertical-align: middle; margin-right: 2px; }
    .btn-sm .material-icon { font-size: 14px; }
    .card-icon { font-size: 20px; }
    .fw-actions .material-icon { font-size: 14px; }
  `]
})
export class PriorityConfigComponent implements OnInit {
  frameworks = signal<PriorityFramework[]>([]);
  criteria = signal<PriorityCriteria[]>([]);
  auditLogs = signal<PriorityFrameworkAudit[]>([]);
  creatingFramework = signal(false);
  editingFramework = signal(false);
  showCriterionForm = signal(false);
  showActivateConfirm = signal(false);
  showArchiveConfirm = signal(false);
  activeTab = signal<'criteria' | 'weights' | 'scale' | 'ai' | 'audit'>('criteria');
  scalePreset = signal<string>('');
  loading = signal(false);
  toastMsg = signal('');
  toastType = signal<'success' | 'error'>('success');

  selectedFrameworkId = 0;
  editingCriterionId = 0;
  categories = ['Strategic', 'Community', 'Financial', 'Delivery'];
  collapsedCategories: Record<string, boolean> = {};

  newFw: any = { name: '', scaleMin: 0, scaleMax: 5 };
  editFw: any = { name: '', scaleMin: 0, scaleMax: 5 };
  cf: any = this.emptyCriterion();
  scaleItems: { scoreValue: number; label: string }[] = [];
  aiConfig = { humanWeight: 80, aiWeight: 20, aiMode: 'Disabled' };

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.loadFrameworks();
    this.cycleState.ensureActiveCycle();
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMsg.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMsg.set(''), 4000);
  }

  loadFrameworks() {
    this.api.getFrameworks().subscribe(fws => {
      this.frameworks.set(fws);
      if (!this.selectedFrameworkId) {
        const active = fws.find(f => f.status === 'Active');
        if (active) {
          this.selectedFrameworkId = active.id;
          this.loadFrameworkDetails(active.id);
        } else if (fws.length > 0) {
          this.selectedFrameworkId = fws[0].id;
          this.loadFrameworkDetails(fws[0].id);
        }
      } else {
        this.loadFrameworkDetails(this.selectedFrameworkId);
      }
    });
  }

  onFrameworkSelected(id: number) {
    this.selectedFrameworkId = id;
    this.editingFramework.set(false);
    if (id) {
      this.loadFrameworkDetails(id);
    }
  }

  loadFrameworkDetails(id: number) {
    this.api.getFramework(id).subscribe(fw => {
      const fws = this.frameworks();
      const idx = fws.findIndex(f => f.id === id);
      if (idx >= 0) {
        const updated = [...fws];
        updated[idx] = fw;
        this.frameworks.set(updated);
      }
      this.criteria.set(fw.criteria || []);
      this.scaleItems = (fw.scoringScales || []).map(s => ({ scoreValue: s.scoreValue, label: s.label }));
      this.aiConfig = { humanWeight: fw.humanWeight, aiWeight: fw.aiWeight, aiMode: fw.aiMode };
      this.detectPreset();
    });
  }

  selectedFramework(): PriorityFramework | null {
    return this.frameworks().find(f => f.id === this.selectedFrameworkId) || null;
  }

  activeFrameworkSummary(): PriorityFramework | null {
    return this.frameworks().find(f => f.status === 'Active') || null;
  }

  selectActiveFramework() {
    const active = this.activeFrameworkSummary();
    if (active) {
      this.selectedFrameworkId = active.id;
      this.loadFrameworkDetails(active.id);
    }
  }

  linkedCycleName(): string {
    const fw = this.selectedFramework();
    if (!fw?.cycleId) return '';
    const cycle = this.cycleState.activeCycle();
    if (cycle && cycle.id === fw.cycleId) return cycle.name;
    return 'Linked to cycle';
  }

  emptyCriterion() {
    return { code: '', name: '', description: '', category: 'Strategic', weight: 0, isActive: true, sortOrder: 0 };
  }

  showCreateForm() {
    this.newFw = { name: '', scaleMin: 0, scaleMax: 5 };
    this.creatingFramework.set(true);
    this.editingFramework.set(false);
  }

  startEditFramework() {
    const fw = this.selectedFramework();
    if (!fw) return;
    this.editFw = { name: fw.name, scaleMin: fw.scaleMin, scaleMax: fw.scaleMax };
    this.editingFramework.set(true);
    this.creatingFramework.set(false);
  }

  saveFrameworkEdit() {
    if (!this.selectedFrameworkId) return;
    this.api.updateFramework(this.selectedFrameworkId, {
      name: this.editFw.name,
      scaleMin: this.editFw.scaleMin,
      scaleMax: this.editFw.scaleMax,
    }).subscribe({
      next: () => {
        this.editingFramework.set(false);
        this.showToast('Framework updated successfully');
        this.loadFrameworks();
      },
      error: (err: any) => this.showToast('Failed to update framework: ' + (err.error || 'Unknown error'), 'error')
    });
  }

  createFramework() {
    this.api.createFramework({
      name: this.newFw.name,
      scaleMin: this.newFw.scaleMin,
      scaleMax: this.newFw.scaleMax,
      humanWeight: 80,
      aiWeight: 20,
      aiMode: 'Disabled',
      version: 1,
    }).subscribe({
      next: (fw) => {
        this.creatingFramework.set(false);
        this.selectedFrameworkId = fw.id;
        this.showToast('Framework created successfully');
        this.loadFrameworks();
      },
      error: (err: any) => this.showToast('Failed to create framework: ' + (err.error || 'Unknown error'), 'error')
    });
  }

  cloneFramework() {
    if (!this.selectedFrameworkId) return;
    this.api.cloneFramework(this.selectedFrameworkId).subscribe({
      next: (fw) => {
        this.selectedFrameworkId = fw.id;
        this.showToast('Framework cloned as new version');
        this.loadFrameworks();
      },
      error: (err: any) => this.showToast('Failed to clone: ' + (err.error || 'Unknown error'), 'error')
    });
  }

  activateFramework() {
    if (!this.selectedFrameworkId) return;
    const cycleId = this.cycleState.activeCycleId();
    this.api.activateFramework(this.selectedFrameworkId, cycleId).subscribe({
      next: () => {
        this.showActivateConfirm.set(false);
        this.showToast('Framework activated and linked to current cycle');
        this.loadFrameworks();
      },
      error: (err: any) => {
        this.showToast('Activation failed: ' + (err.error || 'Unknown error'), 'error');
        this.showActivateConfirm.set(false);
      }
    });
  }

  archiveFramework() {
    if (!this.selectedFrameworkId) return;
    this.api.updateFramework(this.selectedFrameworkId, { status: 'Archived' }).subscribe({
      next: () => {
        this.showArchiveConfirm.set(false);
        this.showToast('Framework archived');
        this.loadFrameworks();
      },
      error: (err: any) => {
        this.showToast('Archive failed: ' + (err.error || 'Unknown error'), 'error');
        this.showArchiveConfirm.set(false);
      }
    });
  }

  criteriaByCategory(category: string): PriorityCriteria[] {
    return this.criteria().filter(c => c.category === category);
  }

  categoryWeight(category: string): number {
    return this.criteria().filter(c => c.category === category && c.isActive).reduce((s, c) => s + c.weight, 0);
  }

  toggleCategory(cat: string) {
    this.collapsedCategories[cat] = !this.collapsedCategories[cat];
  }

  editCriterion(c: PriorityCriteria) {
    this.cf = { code: c.code, name: c.name, description: c.description || '', category: c.category, weight: c.weight, isActive: c.isActive, sortOrder: c.sortOrder };
    this.editingCriterionId = c.id;
    this.showCriterionForm.set(true);
  }

  cancelCriterion() {
    this.cf = this.emptyCriterion();
    this.editingCriterionId = 0;
    this.showCriterionForm.set(false);
  }

  saveCriterion() {
    if (this.editingCriterionId) {
      this.api.updateCriterion(this.editingCriterionId, this.cf).subscribe({
        next: () => {
          this.showToast('Criterion updated');
          this.cancelCriterion();
          this.loadFrameworkDetails(this.selectedFrameworkId);
        },
        error: (err: any) => this.showToast('Failed to update criterion: ' + (err.error || 'Unknown error'), 'error')
      });
    } else {
      this.api.addCriterion(this.selectedFrameworkId, this.cf).subscribe({
        next: () => {
          this.showToast('Criterion added');
          this.cancelCriterion();
          this.loadFrameworkDetails(this.selectedFrameworkId);
        },
        error: (err: any) => this.showToast('Failed to add criterion: ' + (err.error || 'Unknown error'), 'error')
      });
    }
  }

  toggleCriterionActive(c: PriorityCriteria) {
    this.api.updateCriterion(c.id, { isActive: !c.isActive }).subscribe({
      next: () => {
        this.showToast(c.isActive ? 'Criterion deactivated' : 'Criterion reactivated');
        this.loadFrameworkDetails(this.selectedFrameworkId);
      },
      error: (err: any) => this.showToast('Failed to toggle criterion: ' + (err.error || 'Unknown error'), 'error')
    });
  }

  deleteCriterion(c: PriorityCriteria) {
    if (!confirm(`Delete criterion "${c.name}"? This cannot be undone.`)) return;
    this.api.deleteCriterion(c.id).subscribe({
      next: () => {
        this.showToast('Criterion deleted');
        this.loadFrameworkDetails(this.selectedFrameworkId);
      },
      error: (err: any) => this.showToast('Failed to delete criterion: ' + (err.error || 'Unknown error'), 'error')
    });
  }

  activeCriteria(): PriorityCriteria[] {
    return this.criteria().filter(c => c.isActive);
  }

  weightTotal(): number {
    return this.activeCriteria().reduce((s, c) => s + c.weight, 0);
  }

  updateWeight(criterion: PriorityCriteria, value: number) {
    const updated = this.criteria().map(c => c.id === criterion.id ? { ...c, weight: +value } : c);
    this.criteria.set(updated);
  }

  autoRedistribute() {
    const active = this.activeCriteria();
    if (active.length === 0) return;
    const each = Math.floor(100 / active.length);
    const remainder = 100 - each * active.length;
    const activeIds = new Set(active.map(c => c.id));
    let i = 0;
    const updated = this.criteria().map(c => {
      if (!activeIds.has(c.id)) return c;
      const w = each + (i < remainder ? 1 : 0);
      i++;
      return { ...c, weight: w };
    });
    this.criteria.set(updated);
  }

  saveWeights() {
    const saves = this.activeCriteria().map(c =>
      this.api.updateCriterion(c.id, { weight: c.weight }).subscribe()
    );
    this.showToast('Saving weights...');
    setTimeout(() => {
      this.loadFrameworkDetails(this.selectedFrameworkId);
      this.showToast('Weights saved successfully');
    }, 500);
  }

  detectPreset() {
    const len = this.scaleItems.length;
    if (len === 3) this.scalePreset.set('3');
    else if (len === 5 || len === 6) this.scalePreset.set('5');
    else if (len === 10 || len === 11) this.scalePreset.set('10');
    else this.scalePreset.set('custom');
  }

  applyPreset(preset: string) {
    this.scalePreset.set(preset);
    switch (preset) {
      case '3':
        this.scaleItems = [
          { scoreValue: 0, label: 'No impact' },
          { scoreValue: 1, label: 'Moderate impact' },
          { scoreValue: 2, label: 'High impact' },
        ];
        break;
      case '5':
        this.scaleItems = [
          { scoreValue: 0, label: 'No impact' },
          { scoreValue: 1, label: 'Very low' },
          { scoreValue: 2, label: 'Low' },
          { scoreValue: 3, label: 'Moderate' },
          { scoreValue: 4, label: 'High' },
          { scoreValue: 5, label: 'Very high' },
        ];
        break;
      case '10':
        this.scaleItems = Array.from({ length: 11 }, (_, i) => ({
          scoreValue: i,
          label: i === 0 ? 'No impact' : i <= 3 ? 'Low' : i <= 6 ? 'Moderate' : i <= 9 ? 'High' : 'Maximum',
        }));
        break;
      case 'custom':
        break;
    }
  }

  addScaleItem() {
    const maxVal = this.scaleItems.length > 0 ? Math.max(...this.scaleItems.map(s => s.scoreValue)) + 1 : 0;
    this.scaleItems.push({ scoreValue: maxVal, label: '' });
  }

  removeScaleItem(i: number) {
    this.scaleItems.splice(i, 1);
  }

  saveScale() {
    this.api.updateScale(this.selectedFrameworkId, this.scaleItems.map(s => ({
      scoreValue: s.scoreValue,
      label: s.label,
    }))).subscribe({
      next: () => {
        this.showToast('Scoring scale saved');
        this.loadFrameworkDetails(this.selectedFrameworkId);
      },
      error: (err: any) => this.showToast('Failed to save scale: ' + (err.error || 'Unknown error'), 'error')
    });
  }

  saveAiConfig() {
    this.api.updateAiConfig(this.selectedFrameworkId, {
      humanWeight: this.aiConfig.humanWeight,
      aiWeight: this.aiConfig.aiWeight,
      aiMode: this.aiConfig.aiMode,
    }).subscribe({
      next: () => {
        this.showToast('AI configuration saved');
        this.loadFrameworkDetails(this.selectedFrameworkId);
      },
      error: (err: any) => this.showToast('Failed to save AI config: ' + (err.error || 'Unknown error'), 'error')
    });
  }

  loadAudit() {
    if (!this.selectedFrameworkId) return;
    this.api.getFrameworkAudit(this.selectedFrameworkId).subscribe(logs => this.auditLogs.set(logs));
  }
}
