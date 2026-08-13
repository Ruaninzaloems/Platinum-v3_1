import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { TariffScenarioSummary, TariffScenario, ScenarioComparison, ServiceCategory, FinancialYear } from '../../../core/models/budget.models';

@Component({
  selector: 'app-scenarios-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tariff Scenario Modelling</h1>
          <p class="page-subtitle">Create and compare tariff increase scenarios (BILB1, BILB3, BILB10)</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="showCompare = true" [disabled]="scenarios.length < 2">
            <mat-icon>compare_arrows</mat-icon> Compare
          </button>
          <button class="btn-primary" (click)="showCreateDialog = true">
            <mat-icon>add</mat-icon> New Scenario
          </button>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" *ngFor="let kpi of kpiCards">
          <div class="kpi-icon-wrap" [ngClass]="kpi.colorClass">
            <mat-icon>{{kpi.icon}}</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">{{kpi.label}}</div>
            <div class="kpi-value">{{kpi.value}}</div>
            <div class="kpi-sub">{{kpi.subtitle}}</div>
          </div>
        </div>
      </div>

      <div class="card-container" *ngIf="!selectedScenario">
        <div class="card-title-bar">
          <h2><mat-icon>assessment</mat-icon> Tariff Scenarios</h2>
          <button class="btn-ghost" (click)="showArchived = !showArchived" [class.btn-ghost-active]="showArchived">
            <mat-icon>{{showArchived ? 'inventory' : 'inventory_2'}}</mat-icon> {{showArchived ? 'Hide Archived' : 'Show Archived'}}
          </button>
        </div>
        <div class="card-body" *ngIf="visibleScenarios.length; else noScenarios">
          <table class="data-table">
            <thead>
              <tr>
                <th>Scenario Name</th>
                <th>Increase %</th>
                <th class="text-right">Current Revenue</th>
                <th class="text-right">Projected Revenue</th>
                <th class="text-right">Variance</th>
                <th>Lines</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of visibleScenarios" [class.archived-row]="s.isArchived">
                <td class="fw-600">{{s.name}} <span *ngIf="s.isArchived" class="archived-badge">Archived</span></td>
                <td><span class="pct-badge">{{s.baseIncreasePercentage | number:'1.1-1'}}%</span></td>
                <td class="text-right mono">{{formatCurrency(s.totalCurrentRevenue)}}</td>
                <td class="text-right mono">{{formatCurrency(s.totalProjectedRevenue)}}</td>
                <td class="text-right mono" [ngClass]="s.totalVariance >= 0 ? 'text-green' : 'text-red'">{{formatCurrency(s.totalVariance)}}</td>
                <td>{{s.lineCount}}</td>
                <td><span class="status-badge" [ngClass]="'status-' + s.status.toLowerCase()">{{s.status}}</span></td>
                <td>
                  <div class="action-btns" *ngIf="confirmDeleteId !== s.id">
                    <button class="btn-icon" (click)="viewScenario(s.id)" title="View Details"><mat-icon>visibility</mat-icon></button>
                    <button class="btn-icon btn-icon-blue" (click)="openEdit(s.id)" title="Edit"><mat-icon>edit</mat-icon></button>
                    <button class="btn-icon" *ngIf="s.status === 'Draft' && !s.isArchived" (click)="submitScenario(s.id)" title="Submit"><mat-icon>send</mat-icon></button>
                    <button class="btn-icon" *ngIf="s.status === 'Submitted'" (click)="approveScenario(s.id)" title="Approve"><mat-icon>check_circle</mat-icon></button>
                    <button class="btn-icon btn-icon-amber" (click)="toggleArchive(s)" [title]="s.isArchived ? 'Unarchive' : 'Archive'">
                      <mat-icon>{{s.isArchived ? 'unarchive' : 'archive'}}</mat-icon>
                    </button>
                    <button class="btn-icon btn-icon-red" (click)="confirmDeleteId = s.id" title="Delete"><mat-icon>delete</mat-icon></button>
                  </div>
                  <div class="confirm-del" *ngIf="confirmDeleteId === s.id">
                    <span class="confirm-del-msg">Delete permanently?</span>
                    <button class="btn-confirm-yes" (click)="deleteScenario(s.id)">Yes, Delete</button>
                    <button class="btn-confirm-no" (click)="confirmDeleteId = null">Cancel</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noScenarios>
          <div class="empty-state"><mat-icon>info_outline</mat-icon><p>No scenarios {{showArchived ? '' : 'active'}} yet</p></div>
        </ng-template>
      </div>

      <div class="card-container" *ngIf="selectedScenario">
        <div class="card-title-bar">
          <div style="display:flex;align-items:center;gap:12px">
            <button class="btn-ghost" (click)="selectedScenario = null; pushToDraftResult = null" title="Back to list">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <h2 style="margin:0"><mat-icon>tune</mat-icon> {{selectedScenario.name}} - Detail</h2>
            <span class="status-badge" [ngClass]="'status-' + selectedScenario.status.toLowerCase()">{{selectedScenario.status}}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span *ngIf="pushToDraftResult" class="push-result-msg" [class.push-result-error]="pushToDraftResult.isError">
              <mat-icon>{{pushToDraftResult.isError ? 'error_outline' : 'check_circle'}}</mat-icon>
              {{pushToDraftResult.message}}
            </span>
            <button class="btn-push-draft" (click)="pushToDraft()" [disabled]="pushingToDraft">
              <mat-icon>{{pushingToDraft ? 'hourglass_empty' : 'upload'}}</mat-icon>
              {{pushingToDraft ? 'Pushing…' : 'Push to Draft'}}
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="scenario-meta">
            <span><strong>Base Increase:</strong> {{selectedScenario.baseIncreasePercentage}}%</span>
            <span><strong>Financial Year:</strong> {{selectedScenario.financialYear}}</span>
            <span *ngIf="selectedScenario.justification"><strong>Justification:</strong> {{selectedScenario.justification}}</span>
          </div>

          <!-- Electricity Project Budget Section -->
          <div class="wpb-section wpb-electricity" *ngIf="electricityProjectBudget">
            <div class="wpb-header">
              <mat-icon>bolt</mat-icon>
              <span>Electricity — Project Budgets (mSCOA A4/0300)</span>
              <span class="wpb-meta">SCOA v{{electricityProjectBudget.scoaVersion}} &bull; {{electricityProjectBudget.matchedScoaCodes}} SCOA codes &bull; {{electricityProjectBudget.matchedProjectItems}} project item(s)</span>
            </div>
            <div class="wpb-totals">
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 1</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(electricityProjectBudget.year1)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(electricityProjectBudget.year1 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 2</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(electricityProjectBudget.year2)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(electricityProjectBudget.year2 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 3</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(electricityProjectBudget.year3)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(electricityProjectBudget.year3 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
            </div>
            <table class="data-table" *ngIf="electricityProjectBudget.items?.length">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>SCOA Code</th>
                  <th>Description</th>
                  <th class="text-right">Year 1</th>
                  <th class="text-right">Year 2</th>
                  <th class="text-right">Year 3</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of electricityProjectBudget.items">
                  <td class="fw-600">{{item.projectName}}</td>
                  <td class="mono" style="font-size:11px">{{item.scoaCode}}</td>
                  <td>{{item.scoaDesc}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year1)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year2)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year3)}}</td>
                </tr>
              </tbody>
            </table>
            <div class="wpb-empty" *ngIf="!electricityProjectBudget.items?.length">
              <mat-icon>info_outline</mat-icon> No Plan_ProjectItem records found with matching SCOA Item IDs for this financial year.
            </div>
          </div>
          <div class="wpb-loading" *ngIf="electricityBudgetLoading">
            <mat-icon>hourglass_empty</mat-icon> Loading Electricity project budget…
          </div>

          <!-- Property Rates Project Budget Section -->
          <div class="wpb-section wpb-property-rates" *ngIf="propertyRatesProjectBudget">
            <div class="wpb-header">
              <mat-icon>home_work</mat-icon>
              <span>Property Rates — Project Budgets (mSCOA A4/1800)</span>
              <span class="wpb-meta">SCOA v{{propertyRatesProjectBudget.scoaVersion}} &bull; {{propertyRatesProjectBudget.matchedScoaCodes}} SCOA codes &bull; {{propertyRatesProjectBudget.matchedProjectItems}} project item(s)</span>
            </div>
            <div class="wpb-totals">
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 1</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(propertyRatesProjectBudget.year1)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(propertyRatesProjectBudget.year1 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 2</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(propertyRatesProjectBudget.year2)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(propertyRatesProjectBudget.year2 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 3</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(propertyRatesProjectBudget.year3)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(propertyRatesProjectBudget.year3 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
            </div>
            <table class="data-table" *ngIf="propertyRatesProjectBudget.items?.length">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>SCOA Code</th>
                  <th>Description</th>
                  <th class="text-right">Year 1</th>
                  <th class="text-right">Year 2</th>
                  <th class="text-right">Year 3</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of propertyRatesProjectBudget.items">
                  <td class="fw-600">{{item.projectName}}</td>
                  <td class="mono" style="font-size:11px">{{item.scoaCode}}</td>
                  <td>{{item.scoaDesc}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year1)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year2)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year3)}}</td>
                </tr>
              </tbody>
            </table>
            <div class="wpb-empty" *ngIf="!propertyRatesProjectBudget.items?.length">
              <mat-icon>info_outline</mat-icon> No Plan_ProjectItem records found with matching SCOA Item IDs for this financial year.
            </div>
          </div>
          <div class="wpb-loading" *ngIf="propertyRatesBudgetLoading">
            <mat-icon>hourglass_empty</mat-icon> Loading Property Rates project budget…
          </div>

          <!-- Refuse Project Budget Section -->
          <div class="wpb-section wpb-refuse" *ngIf="refuseProjectBudget">
            <div class="wpb-header">
              <mat-icon>delete_outline</mat-icon>
              <span>Refuse — Project Budgets (mSCOA A4/0600)</span>
              <span class="wpb-meta">SCOA v{{refuseProjectBudget.scoaVersion}} &bull; {{refuseProjectBudget.matchedScoaCodes}} SCOA codes &bull; {{refuseProjectBudget.matchedProjectItems}} project item(s)</span>
            </div>
            <div class="wpb-totals">
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 1</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(refuseProjectBudget.year1)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(refuseProjectBudget.year1 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 2</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(refuseProjectBudget.year2)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(refuseProjectBudget.year2 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 3</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(refuseProjectBudget.year3)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(refuseProjectBudget.year3 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
            </div>
            <table class="data-table" *ngIf="refuseProjectBudget.items?.length">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>SCOA Code</th>
                  <th>Description</th>
                  <th class="text-right">Year 1</th>
                  <th class="text-right">Year 2</th>
                  <th class="text-right">Year 3</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of refuseProjectBudget.items">
                  <td class="fw-600">{{item.projectName}}</td>
                  <td class="mono" style="font-size:11px">{{item.scoaCode}}</td>
                  <td>{{item.scoaDesc}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year1)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year2)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year3)}}</td>
                </tr>
              </tbody>
            </table>
            <div class="wpb-empty" *ngIf="!refuseProjectBudget.items?.length">
              <mat-icon>info_outline</mat-icon> No Plan_ProjectItem records found with matching SCOA Item IDs for this financial year.
            </div>
          </div>
          <div class="wpb-loading" *ngIf="refuseBudgetLoading">
            <mat-icon>hourglass_empty</mat-icon> Loading Refuse project budget…
          </div>

          <!-- Sanitation Project Budget Section -->
          <div class="wpb-section wpb-sanitation" *ngIf="sanitationProjectBudget">
            <div class="wpb-header">
              <mat-icon>water</mat-icon>
              <span>Sanitation — Project Budgets (mSCOA A4/0500)</span>
              <span class="wpb-meta">SCOA v{{sanitationProjectBudget.scoaVersion}} &bull; {{sanitationProjectBudget.matchedScoaCodes}} SCOA codes &bull; {{sanitationProjectBudget.matchedProjectItems}} project item(s)</span>
            </div>
            <div class="wpb-totals">
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 1</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(sanitationProjectBudget.year1)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(sanitationProjectBudget.year1 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 2</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(sanitationProjectBudget.year2)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(sanitationProjectBudget.year2 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 3</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(sanitationProjectBudget.year3)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(sanitationProjectBudget.year3 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
            </div>
            <table class="data-table" *ngIf="sanitationProjectBudget.items?.length">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>SCOA Code</th>
                  <th>Description</th>
                  <th class="text-right">Year 1</th>
                  <th class="text-right">Year 2</th>
                  <th class="text-right">Year 3</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of sanitationProjectBudget.items">
                  <td class="fw-600">{{item.projectName}}</td>
                  <td class="mono" style="font-size:11px">{{item.scoaCode}}</td>
                  <td>{{item.scoaDesc}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year1)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year2)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year3)}}</td>
                </tr>
              </tbody>
            </table>
            <div class="wpb-empty" *ngIf="!sanitationProjectBudget.items?.length">
              <mat-icon>info_outline</mat-icon> No Plan_ProjectItem records found with matching SCOA Item IDs for this financial year.
            </div>
          </div>
          <div class="wpb-loading" *ngIf="sanitationBudgetLoading">
            <mat-icon>hourglass_empty</mat-icon> Loading Sanitation project budget…
          </div>

          <!-- Water Project Budget Section -->
          <div class="wpb-section" *ngIf="waterProjectBudget">
            <div class="wpb-header">
              <mat-icon>water_drop</mat-icon>
              <span>Water — Project Budgets (mSCOA A4/0400)</span>
              <span class="wpb-meta">SCOA v{{waterProjectBudget.scoaVersion}} &bull; {{waterProjectBudget.matchedScoaCodes}} SCOA codes &bull; {{waterProjectBudget.matchedProjectItems}} project item(s)</span>
            </div>
            <div class="wpb-totals">
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 1</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(waterProjectBudget.year1)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(waterProjectBudget.year1 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 2</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(waterProjectBudget.year2)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(waterProjectBudget.year2 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
              <div class="wpb-total-card">
                <div class="wpb-total-label">Year 3</div>
                <div class="wpb-budget-row"><span class="wpb-budget-tag">Current</span><span class="wpb-total-value">{{formatCurrency(waterProjectBudget.year3)}}</span></div>
                <div class="wpb-budget-row wpb-projected"><span class="wpb-budget-tag">Projected</span><span class="wpb-total-value">{{formatCurrency(waterProjectBudget.year3 * (1 + selectedScenario!.baseIncreasePercentage / 100))}}</span></div>
              </div>
            </div>
            <table class="data-table" *ngIf="waterProjectBudget.items?.length">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>SCOA Code</th>
                  <th>Description</th>
                  <th class="text-right">Year 1</th>
                  <th class="text-right">Year 2</th>
                  <th class="text-right">Year 3</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of waterProjectBudget.items">
                  <td class="fw-600">{{item.projectName}}</td>
                  <td class="mono" style="font-size:11px">{{item.scoaCode}}</td>
                  <td>{{item.scoaDesc}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year1)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year2)}}</td>
                  <td class="text-right mono">{{formatCurrency(item.year3)}}</td>
                </tr>
              </tbody>
            </table>
            <div class="wpb-empty" *ngIf="!waterProjectBudget.items?.length">
              <mat-icon>info_outline</mat-icon> No Plan_ProjectItem records found with matching SCOA Item IDs for this financial year.
            </div>
          </div>
          <div class="wpb-loading" *ngIf="waterBudgetLoading">
            <mat-icon>hourglass_empty</mat-icon> Loading Water project budget…
          </div>
        </div>
      </div>

      <div class="card-container" *ngIf="comparison">
        <div class="card-title-bar">
          <h2><mat-icon>compare</mat-icon> Scenario Comparison</h2>
          <button class="btn-icon" (click)="comparison = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="card-body">
          <div class="comparison-summary">
            <div class="comp-card" *ngFor="let c of comparison.scenarios">
              <div class="comp-name">{{c.name}}</div>
              <div class="comp-pct">{{c.baseIncreasePercentage | number:'1.1-1'}}%</div>
              <div class="comp-revenue mono">{{formatCurrency(c.totalProjectedRevenue)}}</div>
              <div class="comp-variance" [ngClass]="c.totalVariancePercent >= 0 ? 'text-green' : 'text-red'">{{c.totalVariancePercent | number:'1.1-1'}}%</div>
            </div>
          </div>
          <table class="data-table" *ngIf="comparison.serviceComparisons?.length">
            <thead>
              <tr>
                <th>Service</th>
                <th class="text-right">Current Revenue</th>
                <th *ngFor="let s of comparison.scenarios" class="text-right">{{s.name}}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of comparison.serviceComparisons">
                <td class="fw-600">{{row.serviceCategoryName}}</td>
                <td class="text-right mono">{{formatCurrency(row.currentRevenue)}}</td>
                <td *ngFor="let sr of row.scenarioRevenues" class="text-right mono">
                  {{formatCurrency(sr.projectedRevenue)}}
                  <span class="variance-inline" [ngClass]="sr.variancePercent >= 0 ? 'text-green' : 'text-red'">({{sr.variancePercent | number:'1.1-1'}}%)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCreateDialog" (click)="closeCreateDialog()">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Create Tariff Scenario</h2>
            <button class="btn-icon" (click)="closeCreateDialog()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Scenario Name</label>
                <input [(ngModel)]="createForm.name" placeholder="e.g. CPI + 1% Scenario">
              </div>
              <div class="form-group full-width">
                <label>Description</label>
                <textarea [(ngModel)]="createForm.description" rows="2" placeholder="Scenario description"></textarea>
              </div>
              <div class="form-group">
                <label>Base Increase %</label>
                <input type="number" [(ngModel)]="createForm.baseIncreasePercentage" step="0.1" placeholder="e.g. 5.5">
              </div>
              <div class="form-group">
                <label>Financial Year</label>
                <select [(ngModel)]="createForm.financialYearId">
                  <option *ngFor="let fy of financialYears" [ngValue]="fy.id">{{fy.yearCode}}</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Per-Service Increase Rates %</label>
                <p class="si-hint">Override the base increase per service type and consumer category. Leave at 0 to use the base increase above.</p>
                <div class="si-table-wrap">
                  <table class="si-table">
                    <thead>
                      <tr>
                        <th class="si-svc-hdr">Service Type</th>
                        <th *ngFor="let ct of allConsumerTypes">{{ct}}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let svc of serviceIncreaseRows">
                        <td class="si-svc-label">{{svc.label}}</td>
                        <td *ngFor="let ct of allConsumerTypes" class="si-ct-cell">
                          <input *ngIf="hasCombo(svc.key, ct)" type="number" class="si-input"
                                 [ngModel]="getIncrease(svc.key, ct)"
                                 (ngModelChange)="setIncrease(svc.key, ct, $event)"
                                 step="0.1" min="0" max="100">
                          <span *ngIf="!hasCombo(svc.key, ct)" class="si-na">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="form-group full-width">
                <label>Justification</label>
                <textarea [(ngModel)]="createForm.justification" rows="3" placeholder="Motivation for this tariff increase"></textarea>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="closeCreateDialog()">Cancel</button>
            <button class="btn-primary" (click)="createScenario()" [disabled]="saving">{{saving ? 'Creating...' : 'Create Scenario'}}</button>
          </div>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showEditDialog" (click)="closeEditDialog()">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Edit Scenario</h2>
            <button class="btn-icon" (click)="closeEditDialog()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body" *ngIf="editForm">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Scenario Name</label>
                <input [(ngModel)]="editForm.name" placeholder="e.g. CPI + 1% Scenario">
              </div>
              <div class="form-group full-width">
                <label>Description</label>
                <textarea [(ngModel)]="editForm.description" rows="2" placeholder="Scenario description"></textarea>
              </div>
              <div class="form-group">
                <label>Base Increase %</label>
                <input type="number" [(ngModel)]="editForm.baseIncreasePercentage" step="0.1" placeholder="e.g. 5.5">
              </div>
              <div class="form-group">
                <label>Financial Year</label>
                <input [value]="editForm.financialYear" disabled style="background:#f8fafc;color:#94a3b8;cursor:not-allowed;">
              </div>
              <div class="form-group full-width">
                <label>Per-Service Increase Rates %</label>
                <p class="si-hint">Override the base increase per service type and consumer category. Leave at 0 to use the base increase above.</p>
                <div class="si-table-wrap">
                  <table class="si-table">
                    <thead>
                      <tr>
                        <th class="si-svc-hdr">Service Type</th>
                        <th *ngFor="let ct of allConsumerTypes">{{ct}}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let svc of serviceIncreaseRows">
                        <td class="si-svc-label">{{svc.label}}</td>
                        <td *ngFor="let ct of allConsumerTypes" class="si-ct-cell">
                          <input *ngIf="hasCombo(svc.key, ct)" type="number" class="si-input"
                                 [ngModel]="getEditIncrease(svc.key, ct)"
                                 (ngModelChange)="setEditIncrease(svc.key, ct, $event)"
                                 step="0.1" min="0" max="100">
                          <span *ngIf="!hasCombo(svc.key, ct)" class="si-na">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="form-group full-width">
                <label>Justification</label>
                <textarea [(ngModel)]="editForm.justification" rows="3" placeholder="Motivation for this tariff increase"></textarea>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="closeEditDialog()">Cancel</button>
            <button class="btn-primary" (click)="saveEdit()" [disabled]="editSaving">{{editSaving ? 'Saving...' : 'Save Changes'}}</button>
          </div>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCompare" (click)="showCompare = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Select Scenarios to Compare</h2>
            <button class="btn-icon" (click)="showCompare = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="compare-list">
              <label *ngFor="let s of scenarios" class="compare-item">
                <input type="checkbox" [checked]="compareIds.includes(s.id)" (change)="toggleCompare(s.id)">
                <span>{{s.name}} ({{s.baseIncreasePercentage}}%)</span>
              </label>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCompare = false">Cancel</button>
            <button class="btn-primary" (click)="runComparison()" [disabled]="compareIds.length < 2">Compare ({{compareIds.length}} selected)</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1440px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
    .header-actions { display: flex; gap: 10px; }

    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1a3a5c; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-secondary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: white; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-secondary:hover { background: #f8fafc; }
    .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
    .btn-icon:hover { background: #f1f5f9; color: #1e293b; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card { background: white; border: 1px solid #e8ecf1; border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); }
    .kpi-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon-wrap.icon-blue { background: #e3f2fd; color: #1565c0; }
    .kpi-icon-wrap.icon-green { background: #e8f5e9; color: #2e7d32; }
    .kpi-icon-wrap.icon-amber { background: #fff8e1; color: #e65100; }
    .kpi-icon-wrap.icon-teal { background: #e0f2f1; color: #00695c; }
    .kpi-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .kpi-content { min-width: 0; }
    .kpi-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 20px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', ui-monospace, monospace; }
    .kpi-sub { font-size: 11px; color: #94a3b8; }

    .card-container { background: white; border: 1px solid #e8ecf1; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); margin-bottom: 16px; overflow: hidden; }
    .card-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e8ecf1; }
    .card-title-bar h2 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px; }
    .card-title-bar h2 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #42a5f5; }
    .card-body { padding: 20px; overflow-x: auto; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .selected-row { background: #e3f2fd !important; }
    .text-right { text-align: right !important; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .text-green { color: #2e7d32; }
    .text-red { color: #c62828; }
    .text-amber { color: #e65100; }
    .pct-badge { background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; font-family: monospace; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .flag-icon { color: #e65100; font-size: 18px; width: 18px; height: 18px; }
    .material-shift { background: #fff8e1 !important; }
    .action-btns { display: flex; gap: 4px; }
    .variance-inline { font-size: 10px; display: block; }

    .scenario-meta { display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap; font-size: 13px; color: #475569; }

    .comparison-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .comp-card { background: #f8fafc; border: 1px solid #e8ecf1; border-radius: 10px; padding: 16px; text-align: center; }
    .comp-name { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    .comp-pct { font-size: 12px; color: #1565c0; font-weight: 600; margin-bottom: 8px; }
    .comp-revenue { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .comp-variance { font-size: 13px; font-weight: 600; }

    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
    .empty-state p { margin: 8px 0 0; font-size: 13px; }

    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .dialog-panel { background: white; border-radius: 16px; width: 780px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e8ecf1; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .dialog-body { padding: 24px; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e8ecf1; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #0f2b46; }

    .btn-ghost { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: none; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #64748b; cursor: pointer; }
    .btn-ghost:hover { background: #f8fafc; }
    .btn-ghost mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-ghost-active { background: #fff8e1; border-color: #f59e0b; color: #92400e; }
    .btn-icon-amber { color: #d97706 !important; }
    .btn-icon-amber:hover { background: #fff8e1 !important; }
    .btn-icon-red { color: #dc2626 !important; }
    .btn-icon-red:hover { background: #fef2f2 !important; }
    .btn-icon-blue { color: #2563eb !important; }
    .btn-icon-blue:hover { background: #eff6ff !important; }
    .archived-row { opacity: 0.55; }
    .archived-badge { display: inline-block; margin-left: 6px; padding: 1px 6px; background: #f1f5f9; color: #94a3b8; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .confirm-del { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .confirm-del-msg { font-size: 12px; color: #dc2626; font-weight: 600; }
    .btn-confirm-yes { padding: 4px 10px; background: #dc2626; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn-confirm-yes:hover { background: #b91c1c; }
    .btn-confirm-no { padding: 4px 10px; background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; cursor: pointer; }
    .btn-confirm-no:hover { background: #e2e8f0; }

    .compare-list { display: flex; flex-direction: column; gap: 10px; }
    .compare-item { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e8ecf1; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .compare-item:hover { background: #f8fafc; }
    .compare-item input { width: 16px; height: 16px; }

    .si-hint { font-size: 12px; color: #94a3b8; margin: 2px 0 8px 0; }
    .si-table-wrap { overflow-x: auto; border: 1px solid #e8ecf1; border-radius: 8px; }
    .si-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .si-table th { padding: 7px 10px; background: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-bottom: 1px solid #e8ecf1; text-align: center; white-space: nowrap; }
    .si-table th.si-svc-hdr { text-align: left; }
    .si-table td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
    .si-table tr:last-child td { border-bottom: none; }
    .si-svc-label { font-weight: 600; color: #334155; white-space: nowrap; font-size: 12px; }
    .si-ct-cell { text-align: center; }
    .si-input { width: 72px; padding: 4px 6px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; text-align: right; outline: none; color: #1e293b; background: white; }
    .si-input:focus { border-color: #0f2b46; }
    .si-na { color: #cbd5e1; font-size: 14px; display: block; text-align: center; }

    .wpb-section { margin-top: 24px; border-top: 2px solid #e0f2fe; padding-top: 16px; }
    .wpb-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .wpb-header mat-icon { color: #0284c7; font-size: 20px; width: 20px; height: 20px; }
    .wpb-header > span:first-of-type { font-size: 14px; font-weight: 700; color: #0f2b46; }
    .wpb-meta { font-size: 11px; color: #64748b; margin-left: auto; background: #f0f9ff; padding: 2px 8px; border-radius: 10px; border: 1px solid #bae6fd; }
    .wpb-totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .wpb-total-card { background: linear-gradient(135deg, #0f2b46 0%, #1e4976 100%); border-radius: 10px; padding: 14px 16px; text-align: left; }
    .wpb-total-label { font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .wpb-budget-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .wpb-budget-row.wpb-projected { margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12); }
    .wpb-budget-tag { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #93c5fd; min-width: 52px; flex-shrink: 0; }
    .wpb-projected .wpb-budget-tag { color: #c9a84c; }
    .wpb-total-value { font-size: 15px; font-weight: 700; color: white; font-family: monospace; }
    .wpb-projected .wpb-total-value { color: #fcd34d; }
    .wpb-empty { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; padding: 12px 0; }
    .wpb-empty mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .wpb-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; padding: 16px 0; margin-top: 12px; border-top: 1px solid #f1f5f9; }
    .wpb-loading mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; animation: spin 1.5s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .btn-push-draft { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: linear-gradient(135deg, #c9a84c 0%, #a8882e 100%); border: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; transition: opacity 0.15s; }
    .btn-push-draft:hover:not(:disabled) { opacity: 0.88; }
    .btn-push-draft:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-push-draft mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .push-result-msg { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #166534; background: #dcfce7; border: 1px solid #86efac; border-radius: 6px; padding: 4px 10px; }
    .push-result-msg mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .push-result-error { color: #991b1b; background: #fee2e2; border-color: #fca5a5; }
  `]
})
export class ScenariosPage implements OnInit {
  scenarios: TariffScenarioSummary[] = [];
  selectedScenario: TariffScenario | null = null;
  waterProjectBudget: any = null;
  waterBudgetLoading = false;
  electricityProjectBudget: any = null;
  electricityBudgetLoading = false;
  sanitationProjectBudget: any = null;
  sanitationBudgetLoading = false;
  refuseProjectBudget: any = null;
  refuseBudgetLoading = false;
  propertyRatesProjectBudget: any = null;
  propertyRatesBudgetLoading = false;
  pushingToDraft = false;
  pushToDraftResult: { message: string; isError: boolean } | null = null;
  comparison: ScenarioComparison | null = null;
  kpiCards: any[] = [];
  financialYears: FinancialYear[] = [];
  showCreateDialog = false;
  showCompare = false;
  saving = false;
  compareIds: number[] = [];
  showArchived = false;
  confirmDeleteId: number | null = null;
  showEditDialog = false;
  editSaving = false;
  editForm: any = null;

  get visibleScenarios(): TariffScenarioSummary[] {
    return this.showArchived ? this.scenarios : this.scenarios.filter(s => !s.isArchived);
  }

  readonly serviceIncreaseRows = [
    { key: 'Electricity', label: 'Electricity' },
    { key: 'RefuseRemoval', label: 'Refuse Removal' },
    { key: 'Sanitation', label: 'Sanitation' },
    { key: 'Water', label: 'Water' },
    { key: 'PropertyRates', label: 'Property Rates' },
  ];
  readonly allConsumerTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'NGO'];
  readonly validCombos: Record<string, string[]> = {
    Electricity: ['Residential', 'Commercial'],
    RefuseRemoval: ['Residential', 'Commercial'],
    Sanitation: ['Residential', 'Commercial'],
    Water: ['Residential', 'Commercial'],
    PropertyRates: ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'NGO'],
  };

  createForm: any = {
    financialYearId: 0,
    baseIncreasePercentage: 5.5,
    serviceIncreases: [
      { serviceType: 'Electricity', consumerType: 'Residential', increasePercentage: 0 },
      { serviceType: 'Electricity', consumerType: 'Commercial', increasePercentage: 0 },
      { serviceType: 'RefuseRemoval', consumerType: 'Residential', increasePercentage: 0 },
      { serviceType: 'RefuseRemoval', consumerType: 'Commercial', increasePercentage: 0 },
      { serviceType: 'Sanitation', consumerType: 'Residential', increasePercentage: 0 },
      { serviceType: 'Sanitation', consumerType: 'Commercial', increasePercentage: 0 },
      { serviceType: 'Water', consumerType: 'Residential', increasePercentage: 0 },
      { serviceType: 'Water', consumerType: 'Commercial', increasePercentage: 0 },
      { serviceType: 'PropertyRates', consumerType: 'Residential', increasePercentage: 0 },
      { serviceType: 'PropertyRates', consumerType: 'Commercial', increasePercentage: 0 },
      { serviceType: 'PropertyRates', consumerType: 'Industrial', increasePercentage: 0 },
      { serviceType: 'PropertyRates', consumerType: 'Agricultural', increasePercentage: 0 },
      { serviceType: 'PropertyRates', consumerType: 'NGO', increasePercentage: 0 },
    ]
  };

  hasCombo(svc: string, ct: string): boolean {
    return this.validCombos[svc]?.includes(ct) ?? false;
  }

  getIncrease(svc: string, ct: string): number {
    return this.createForm.serviceIncreases?.find(
      (i: any) => i.serviceType === svc && i.consumerType === ct
    )?.increasePercentage ?? 0;
  }

  setIncrease(svc: string, ct: string, val: number) {
    const item = this.createForm.serviceIncreases?.find(
      (i: any) => i.serviceType === svc && i.consumerType === ct
    );
    if (item) item.increasePercentage = +val;
  }

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadScenarios();
    this.api.getFinancialYears().subscribe(fys => {
      this.financialYears = fys;
      if (fys.length) this.createForm.financialYearId = fys[0].id;
      this.cdr.markForCheck();
    });
  }

  closeCreateDialog() {
    this.showCreateDialog = false;
    this.loadScenarios();
  }

  openEdit(id: number) {
    this.api.getTariffScenario(id).subscribe(s => {
      const allCombos = [
        { serviceType: 'Electricity', consumerType: 'Residential' },
        { serviceType: 'Electricity', consumerType: 'Commercial' },
        { serviceType: 'RefuseRemoval', consumerType: 'Residential' },
        { serviceType: 'RefuseRemoval', consumerType: 'Commercial' },
        { serviceType: 'Sanitation', consumerType: 'Residential' },
        { serviceType: 'Sanitation', consumerType: 'Commercial' },
        { serviceType: 'Water', consumerType: 'Residential' },
        { serviceType: 'Water', consumerType: 'Commercial' },
        { serviceType: 'PropertyRates', consumerType: 'Residential' },
        { serviceType: 'PropertyRates', consumerType: 'Commercial' },
        { serviceType: 'PropertyRates', consumerType: 'Industrial' },
        { serviceType: 'PropertyRates', consumerType: 'Agricultural' },
        { serviceType: 'PropertyRates', consumerType: 'NGO' },
      ];
      this.editForm = {
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        baseIncreasePercentage: s.baseIncreasePercentage,
        justification: s.justification ?? '',
        financialYear: s.financialYear,
        serviceIncreases: allCombos.map(c => ({
          serviceType: c.serviceType,
          consumerType: c.consumerType,
          increasePercentage: s.serviceIncreases?.find(si => si.serviceType === c.serviceType && si.consumerType === c.consumerType)?.increasePercentage ?? 0
        }))
      };
      this.showEditDialog = true;
      this.cdr.detectChanges();
    });
  }

  getEditIncrease(svc: string, ct: string): number {
    return this.editForm?.serviceIncreases?.find((i: any) => i.serviceType === svc && i.consumerType === ct)?.increasePercentage ?? 0;
  }

  setEditIncrease(svc: string, ct: string, val: number) {
    const item = this.editForm?.serviceIncreases?.find((i: any) => i.serviceType === svc && i.consumerType === ct);
    if (item) item.increasePercentage = +val;
  }

  saveEdit() {
    if (!this.editForm) return;
    this.editSaving = true;
    this.api.updateScenario(this.editForm.id, {
      name: this.editForm.name,
      description: this.editForm.description,
      baseIncreasePercentage: +this.editForm.baseIncreasePercentage,
      justification: this.editForm.justification,
      serviceIncreases: this.editForm.serviceIncreases
    }).subscribe({
      next: () => {
        this.editSaving = false;
        this.showEditDialog = false;
        this.editForm = null;
        this.loadScenarios();
      },
      error: () => { this.editSaving = false; this.cdr.detectChanges(); }
    });
  }

  closeEditDialog() {
    this.showEditDialog = false;
    this.editForm = null;
    this.cdr.detectChanges();
  }

  loadScenarios() {
    this.api.getTariffScenarios().subscribe(data => {
      this.scenarios = [...data];
      this.buildKpis();
      this.cdr.detectChanges();
    });
  }

  buildKpis() {
    const best = this.scenarios.length ? Math.max(...this.scenarios.map(s => s.totalProjectedRevenue)) : 0;
    const worst = this.scenarios.length ? Math.min(...this.scenarios.map(s => s.totalProjectedRevenue)) : 0;
    const current = this.scenarios.length ? this.scenarios[0]?.totalCurrentRevenue || 0 : 0;
    this.kpiCards = [
      { icon: 'assessment', label: 'Active Scenarios', value: this.scenarios.length.toString(), subtitle: 'Total scenarios', colorClass: 'icon-blue' },
      { icon: 'trending_up', label: 'Best Revenue', value: this.formatCurrency(best), subtitle: 'Highest projection', colorClass: 'icon-green' },
      { icon: 'trending_down', label: 'Worst Revenue', value: this.formatCurrency(worst), subtitle: 'Lowest projection', colorClass: 'icon-amber' },
      { icon: 'account_balance', label: 'Current Base', value: this.formatCurrency(current), subtitle: 'Baseline revenue', colorClass: 'icon-teal' },
    ];
  }

  viewScenario(id: number) {
    this.waterProjectBudget = null;
    this.waterBudgetLoading = true;
    this.electricityProjectBudget = null;
    this.electricityBudgetLoading = true;
    this.sanitationProjectBudget = null;
    this.sanitationBudgetLoading = true;
    this.refuseProjectBudget = null;
    this.refuseBudgetLoading = true;
    this.propertyRatesProjectBudget = null;
    this.propertyRatesBudgetLoading = true;
    this.api.getTariffScenario(id).subscribe(data => {
      this.selectedScenario = data;
      this.cdr.detectChanges();
    });
    this.api.getWaterProjectBudget(id).subscribe({
      next: data => {
        this.waterProjectBudget = data;
        this.waterBudgetLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.waterBudgetLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.api.getElectricityProjectBudget(id).subscribe({
      next: data => {
        this.electricityProjectBudget = data;
        this.electricityBudgetLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.electricityBudgetLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.api.getSanitationProjectBudget(id).subscribe({
      next: data => {
        this.sanitationProjectBudget = data;
        this.sanitationBudgetLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.sanitationBudgetLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.api.getRefuseProjectBudget(id).subscribe({
      next: data => {
        this.refuseProjectBudget = data;
        this.refuseBudgetLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.refuseBudgetLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.api.getPropertyRatesProjectBudget(id).subscribe({
      next: data => {
        this.propertyRatesProjectBudget = data;
        this.propertyRatesBudgetLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.propertyRatesBudgetLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createScenario() {
    this.saving = true;
    this.api.createTariffScenario(this.createForm).subscribe({
      next: () => {
          this.saving = false;
          this.showCreateDialog = false;
          this.createForm = {
            financialYearId: this.financialYears[0]?.id ?? 0,
            baseIncreasePercentage: 5.5,
            serviceIncreases: [
              { serviceType: 'Electricity', consumerType: 'Residential', increasePercentage: 0 },
              { serviceType: 'Electricity', consumerType: 'Commercial', increasePercentage: 0 },
              { serviceType: 'RefuseRemoval', consumerType: 'Residential', increasePercentage: 0 },
              { serviceType: 'RefuseRemoval', consumerType: 'Commercial', increasePercentage: 0 },
              { serviceType: 'Sanitation', consumerType: 'Residential', increasePercentage: 0 },
              { serviceType: 'Sanitation', consumerType: 'Commercial', increasePercentage: 0 },
              { serviceType: 'Water', consumerType: 'Residential', increasePercentage: 0 },
              { serviceType: 'Water', consumerType: 'Commercial', increasePercentage: 0 },
              { serviceType: 'PropertyRates', consumerType: 'Residential', increasePercentage: 0 },
              { serviceType: 'PropertyRates', consumerType: 'Commercial', increasePercentage: 0 },
              { serviceType: 'PropertyRates', consumerType: 'Industrial', increasePercentage: 0 },
              { serviceType: 'PropertyRates', consumerType: 'Agricultural', increasePercentage: 0 },
              { serviceType: 'PropertyRates', consumerType: 'NGO', increasePercentage: 0 },
            ]
          };
          this.loadScenarios();
        },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  submitScenario(id: number) {
    this.api.submitScenario(id).subscribe(() => this.loadScenarios());
  }

  approveScenario(id: number) {
    this.api.approveScenario(id).subscribe(() => this.loadScenarios());
  }

  deleteScenario(id: number) {
    this.api.deleteScenario(id).subscribe(() => {
      this.confirmDeleteId = null;
      if (this.selectedScenario?.id === id) this.selectedScenario = null;
      this.loadScenarios();
    });
  }

  toggleArchive(s: TariffScenarioSummary) {
    const action = s.isArchived ? this.api.unarchiveScenario(s.id) : this.api.archiveScenario(s.id);
    action.subscribe(() => this.loadScenarios());
  }

  pushToDraft() {
    if (!this.selectedScenario) return;
    this.pushingToDraft = true;
    this.pushToDraftResult = null;
    this.cdr.detectChanges();
    this.api.pushScenarioToDraft(this.selectedScenario.id).subscribe({
      next: (res: any) => {
        this.pushingToDraft = false;
        this.pushToDraftResult = {
          message: `${res.updated} project item(s) updated successfully.`,
          isError: false
        };
        this.viewScenario(this.selectedScenario!.id);
      },
      error: (err: any) => {
        this.pushingToDraft = false;
        this.pushToDraftResult = {
          message: err?.error || 'Push to Draft failed.',
          isError: true
        };
        this.cdr.detectChanges();
      }
    });
  }

  toggleCompare(id: number) {
    const idx = this.compareIds.indexOf(id);
    if (idx >= 0) this.compareIds.splice(idx, 1);
    else if (this.compareIds.length < 3) this.compareIds.push(id);
  }

  runComparison() {
    this.showCompare = false;
    this.api.compareScenarios(this.compareIds).subscribe(data => {
      this.comparison = data;
      this.cdr.markForCheck();
    });
  }

  formatCurrency(value: number): string {
    if (!value) return 'R 0';
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return sign + 'R ' + (abs / 1_000_000_000).toFixed(1) + 'B';
    if (abs >= 1_000_000) return sign + 'R ' + (abs / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return sign + 'R ' + (abs / 1_000).toFixed(0) + 'K';
    return sign + 'R ' + abs.toFixed(0);
  }
}
