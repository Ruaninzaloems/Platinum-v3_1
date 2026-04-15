import { Component, OnInit, signal, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpProject } from '../../core/models/idp.models';

declare var L: any;

@Component({
  selector: 'app-spatial-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 data-testid="text-page-title">
          <span class="material-icon header-icon">map</span>
          Spatial Report
        </h1>
        <div class="header-actions">
          <div class="filter-group">
            <label>Classification</label>
            <select [(ngModel)]="filterClassification" (ngModelChange)="applyFilters()" data-testid="select-filter-classification">
              <option value="">All</option>
              <option value="Capital">Capital</option>
              <option value="Operational">Operational</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Priority</label>
            <select [(ngModel)]="filterPriority" (ngModelChange)="applyFilters()" data-testid="select-filter-priority">
              <option value="">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()" data-testid="select-filter-status">
              <option value="">All</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <span class="mapped-count" data-testid="text-mapped-count">
            <span class="material-icon" style="font-size:16px;">place</span>
            {{ mappedProjects().length }} / {{ allProjects().length }} mapped
          </span>
        </div>
      </div>

      <div class="kpi-row" data-testid="spatial-kpi-strip">
        <div class="kpi-tile">
          <div class="kpi-num">{{ allProjects().length }}</div>
          <div class="kpi-lab">Total Projects</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-num">{{ mappedProjects().length }}</div>
          <div class="kpi-lab">GPS Mapped</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-num">{{ unmappedProjects().length }}</div>
          <div class="kpi-lab">No Coordinates</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-num">R{{ (totalMappedBudget() / 1000000) | number:'1.1-1' }}M</div>
          <div class="kpi-lab">Mapped Budget</div>
        </div>
      </div>

      <div class="map-container card" data-testid="map-container">
        <div class="card-header">
          <h2><span class="material-icon" style="font-size:18px;margin-right:6px;">satellite_alt</span> George Municipality — Project Locations</h2>
          <div class="legend">
            <span class="legend-item"><span class="legend-dot" style="background:#1565c0;"></span> Capital</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ef6c00;"></span> Operational</span>
          </div>
        </div>
        <div id="spatial-map" data-testid="leaflet-map"></div>
      </div>

      <div class="card" data-testid="panel-selected-project" *ngIf="selectedProject() as sp">
        <div class="card-header">
          <h2><span class="material-icon" style="font-size:18px;margin-right:6px;">info</span> {{ sp.name }}</h2>
          <button class="btn btn-sm btn-secondary" (click)="selectedProject.set(null)" data-testid="button-close-detail">
            <span class="material-icon" style="font-size:14px;">close</span> Close
          </button>
        </div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Classification</span><span class="class-badge" [class.capital]="sp.classification==='Capital'">{{ sp.classification }}</span></div>
            <div class="detail-item"><span class="detail-label">Department</span><span>{{ sp.department }}</span></div>
            <div class="detail-item"><span class="detail-label">Ward</span><span>{{ sp.ward || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Region</span><span>{{ sp.region || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Priority</span><span><span class="priority-dot" [attr.data-p]="sp.priority?.toLowerCase()"></span> {{ sp.priority }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="status-pill" [attr.data-status]="sp.status?.toLowerCase()">{{ sp.status }}</span></div>
            <div class="detail-item"><span class="detail-label">Budget</span><span>R{{ (sp.budgetAmount || 0) | number:'1.0-0' }}</span></div>
            <div class="detail-item"><span class="detail-label">Funding Source</span><span>{{ sp.fundingSource || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Start Date</span><span>{{ sp.startDate ? (sp.startDate | date:'dd MMM yyyy') : '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">End Date</span><span>{{ sp.endDate ? (sp.endDate | date:'dd MMM yyyy') : '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Latitude</span><span>{{ sp.latitude | number:'1.6-6' }}</span></div>
            <div class="detail-item"><span class="detail-label">Longitude</span><span>{{ sp.longitude | number:'1.6-6' }}</span></div>
            <div class="detail-item full" *ngIf="sp.description"><span class="detail-label">Description</span><span>{{ sp.description }}</span></div>
            <div class="detail-item full" *ngIf="sp.fundingSourceSummary"><span class="detail-label">Funding Summary</span><span>{{ sp.fundingSourceSummary }}</span></div>
          </div>

          <div class="kpi-section" *ngIf="sp.indicators?.length">
            <h3>Key Performance Indicators</h3>
            <table class="data-table compact">
              <thead>
                <tr><th>Indicator</th><th>Baseline</th><th>Y1</th><th>Y2</th><th>Y3</th><th>Y4</th><th>Y5</th><th>Official</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let i of sp.indicators">
                  <td><strong>{{ i.name }}</strong></td>
                  <td>{{ i.baseline }}</td>
                  <td>{{ i.targetY1 }}</td><td>{{ i.targetY2 }}</td><td>{{ i.targetY3 }}</td><td>{{ i.targetY4 }}</td><td>{{ i.targetY5 }}</td>
                  <td>{{ i.responsibleOfficial }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card" data-testid="table-unmapped" *ngIf="unmappedProjects().length">
        <div class="card-header">
          <h2><span class="material-icon" style="font-size:18px;margin-right:6px;color:#ef5350;">warning</span> Projects Without GPS Coordinates</h2>
        </div>
        <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr><th>Name</th><th>Classification</th><th>Department</th><th>Ward</th><th>Region</th><th>Budget</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of unmappedProjects()" [attr.data-testid]="'row-unmapped-' + p.id">
              <td><strong>{{ p.name }}</strong></td>
              <td><span class="class-badge" [class.capital]="p.classification==='Capital'">{{ p.classification }}</span></td>
              <td>{{ p.department }}</td>
              <td>{{ p.ward || '—' }}</td>
              <td>{{ p.region || '—' }}</td>
              <td>R{{ (p.budgetAmount || 0) | number:'1.0-0' }}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-icon { font-size: 28px; color: #1565c0; }
    .header-actions { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 3px; }
    .filter-group label { font-size: 10px; }
    .filter-group select { padding: 5px 8px; border: 1px solid var(--platinum-border); border-radius: 6px; font-size: 12px; font-family: inherit; min-width: 100px; }
    .mapped-count { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #1565c0; background: var(--platinum-info-light); padding: 6px 12px; border-radius: 16px; white-space: nowrap; }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .kpi-tile { background: white; border: 1px solid var(--platinum-border); border-radius: 10px; padding: 12px 20px; flex: 1; text-align: center; }
    .kpi-num { font-size: 20px; font-weight: 700; color: var(--platinum-text); }
    .kpi-lab { font-size: 11px; color: var(--platinum-text-muted); text-transform: uppercase; }
    .legend { display: flex; gap: 16px; }
    .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; color: var(--platinum-text-secondary); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    #spatial-map { height: 480px; width: 100%; z-index: 1; }
    app-spatial-report .detail-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
    @media(max-width:900px){ app-spatial-report .detail-grid { grid-template-columns: repeat(2, 1fr); } }
    .detail-item { display: flex; flex-direction: column; gap: 3px; }
    .detail-item.full { grid-column: 1 / -1; }
    .detail-label { font-size: 10px; font-weight: 600; color: var(--platinum-text-muted); text-transform: uppercase; letter-spacing: .3px; }
    .class-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #64748b; display: inline-block; }
    .class-badge.capital { background: var(--platinum-info-light); color: #1565c0; }
    .priority-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .priority-dot[data-p="critical"] { background: #b71c1c; }
    .priority-dot[data-p="high"] { background: var(--platinum-danger); }
    .priority-dot[data-p="medium"] { background: var(--platinum-warning); }
    .priority-dot[data-p="low"] { background: var(--platinum-success); }
    .status-pill[data-status="planned"] { background: #f1f5f9; color: #64748b; }
    .kpi-section { margin-top: 16px; }
    .kpi-section h3 { font-size: 13px; font-weight: 600; margin: 0 0 8px; color: var(--platinum-text-secondary); }
  `]
})
export class SpatialReportComponent implements OnInit, AfterViewInit, OnDestroy {
  allProjects = signal<IdpProject[]>([]);
  filteredProjects = signal<IdpProject[]>([]);
  selectedProject = signal<IdpProject | null>(null);

  filterClassification = '';
  filterPriority = '';
  filterStatus = '';

  private map: any = null;
  private markerLayer: any = null;
  private mapReady = false;
  private dataReady = false;

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => {
      if (c) {
        this.api.getProjects(c.id).subscribe(projects => {
          this.allProjects.set(projects);
          this.filteredProjects.set(projects);
          this.dataReady = true;
          if (this.mapReady) this.plotMarkers();
        });
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    if (typeof L === 'undefined') return;

    this.map = L.map('spatial-map').setView([-33.9631, 22.4617], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.mapReady = true;

    if (this.dataReady) this.plotMarkers();
  }

  private plotMarkers() {
    if (!this.map || !this.markerLayer) return;
    this.markerLayer.clearLayers();

    const mapped = this.mappedFromFiltered();

    mapped.forEach(p => {
      const color = p.classification === 'Capital' ? '#1565c0' : '#ef6c00';
      const priorityColor = p.priority === 'Critical' ? '#b71c1c' : p.priority === 'High' ? '#ef5350' : p.priority === 'Medium' ? '#f59e0b' : '#4caf50';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%; border: 3px solid ${color};
          background: white; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25); position: relative;
        ">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${priorityColor};"></div>
        </div>
        <div style="
          position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
          width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
          border-top: 8px solid ${color};
        "></div>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36]
      });

      const budget = p.budgetAmount ? 'R' + (p.budgetAmount / 1000000).toFixed(1) + 'M' : 'N/A';
      const popup = `
        <div style="font-family:Inter,sans-serif;min-width:220px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#1e293b;">${p.name}</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:11px;">
            <span style="color:#94a3b8;font-weight:600;">Classification</span><span>${p.classification}</span>
            <span style="color:#94a3b8;font-weight:600;">Department</span><span>${p.department}</span>
            <span style="color:#94a3b8;font-weight:600;">Ward</span><span>${p.ward || '—'}</span>
            <span style="color:#94a3b8;font-weight:600;">Region</span><span>${p.region || '—'}</span>
            <span style="color:#94a3b8;font-weight:600;">Priority</span><span>${p.priority}</span>
            <span style="color:#94a3b8;font-weight:600;">Budget</span><span>${budget}</span>
            <span style="color:#94a3b8;font-weight:600;">Status</span><span>${p.status}</span>
            <span style="color:#94a3b8;font-weight:600;">Coordinates</span><span>${p.latitude?.toFixed(4)}, ${p.longitude?.toFixed(4)}</span>
          </div>
        </div>`;

      const marker = L.marker([p.latitude, p.longitude], { icon })
        .bindPopup(popup, { maxWidth: 300 })
        .addTo(this.markerLayer);

      marker.on('click', () => {
        this.selectedProject.set(p);
      });
    });

    if (mapped.length > 0) {
      const bounds = L.latLngBounds(mapped.map((p: IdpProject) => [p.latitude, p.longitude]));
      this.map.fitBounds(bounds.pad(0.15));
    }
  }

  mappedProjects() {
    return this.filteredProjects().filter(p => p.latitude != null && p.longitude != null);
  }

  unmappedProjects() {
    return this.filteredProjects().filter(p => p.latitude == null || p.longitude == null);
  }

  totalMappedBudget() {
    return this.mappedProjects().reduce((s, p) => s + (p.budgetAmount || 0), 0);
  }

  private mappedFromFiltered() {
    return this.filteredProjects().filter(p => p.latitude != null && p.longitude != null);
  }

  applyFilters() {
    let filtered = this.allProjects();
    if (this.filterClassification) filtered = filtered.filter(p => p.classification === this.filterClassification);
    if (this.filterPriority) filtered = filtered.filter(p => p.priority === this.filterPriority);
    if (this.filterStatus) filtered = filtered.filter(p => p.status === this.filterStatus);
    this.filteredProjects.set(filtered);
    this.plotMarkers();
  }
}
