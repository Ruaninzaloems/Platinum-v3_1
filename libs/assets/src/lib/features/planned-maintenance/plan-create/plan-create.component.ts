import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-plan-create',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './plan-create.component.html',
  styleUrls: ['./plan-create.component.css']
})
export class PlanCreateComponent implements OnInit, OnDestroy {
  step = signal<1 | 2>(1);

  form: any = {
    planName: '',
    maintenanceTypeId: '',
    frequencyId: '',
    startDate: new Date().toISOString().split('T')[0],
    estimatedCost: null,
    description: '',
    debitProjectId: null,
    planProjectItemId: null,
    isActive: true
  };

  maintTypes = signal<any[]>([]);
  frequencies = signal<any[]>([]);
  planProjects = signal<any[]>([]);
  planProjectItems = signal<any[]>([]);

  assetSearch = '';
  assetSearchDebounce: any = null;
  assetResults = signal<any[]>([]);
  assetLoading = signal(false);
  assetFilterType = '';
  assetFilterCategory = '';
  assetTypes = signal<any[]>([]);
  assetCategories = signal<any[]>([]);

  selectedAssets = signal<any[]>([]);
  selectedAssetIds = new Set<number>();

  saving = signal(false);

  csvImportMsg = '';
  csvImportError = false;
  csvImporting = false;

  showMapModal = false;
  mapLoading = false;
  mapSelectedCount = 0;
  private pendingMapIds = new Set<number>();
  private leafletMap: any = null;
  private L: any = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    var self = this;
    this.api.getMaintTypes().subscribe({ next: function(res: any) { self.maintTypes.set(Array.isArray(res) ? res : []); } });
    this.api.getMaintFrequencies().subscribe({ next: function(res: any) { self.frequencies.set(Array.isArray(res) ? res : []); } });
    this.api.getPlanProjects().subscribe({ next: function(res: any) { self.planProjects.set(Array.isArray(res) ? res : []); } });
    this.api.getAssetTypes().subscribe({ next: function(res: any) { self.assetTypes.set(Array.isArray(res) ? res : []); } });
    this.api.getAssetCategoriesList().subscribe({ next: function(res: any) { self.assetCategories.set(Array.isArray(res) ? res : (res?.data || [])); } });
    this.loadAssets();
  }

  onProjectChange() {
    this.form.planProjectItemId = null;
    this.planProjectItems.set([]);
    if (!this.form.debitProjectId) return;
    var self = this;
    this.api.getPlanProjectItems(Number(this.form.debitProjectId)).subscribe({
      next: function(res: any) { self.planProjectItems.set(Array.isArray(res) ? res : []); }
    });
  }

  validateStep1(): boolean {
    if (!this.form.planName) {
      this.snackBar.open('Plan name is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return false;
    }
    if (!this.form.maintenanceTypeId) {
      this.snackBar.open('Maintenance type is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return false;
    }
    if (!this.form.frequencyId) {
      this.snackBar.open('Frequency is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return false;
    }
    return true;
  }

  goToStep2() {
    if (!this.validateStep1()) return;
    this.step.set(2);
  }

  goToStep1() {
    this.step.set(1);
  }

  loadAssets() {
    this.assetLoading.set(true);
    var self = this;
    var params: any = {};
    if (this.assetSearch) params.search = this.assetSearch;
    if (this.assetFilterType) params.assetTypeId = Number(this.assetFilterType);
    if (this.assetFilterCategory) params.categoryId = Number(this.assetFilterCategory);
    this.api.getPlannedMaintPreviewAssets(params).subscribe({
      next: function(res: any) { self.assetResults.set(Array.isArray(res) ? res : []); self.assetLoading.set(false); },
      error: function() { self.assetLoading.set(false); }
    });
  }

  onAssetSearch() {
    if (this.assetSearchDebounce) clearTimeout(this.assetSearchDebounce);
    var self = this;
    this.assetSearchDebounce = setTimeout(function() { self.loadAssets(); }, 300);
  }

  onAssetFilterChange() {
    this.loadAssets();
  }

  isSelected(asset: any): boolean {
    return this.selectedAssetIds.has(asset.assetRegisterItemId);
  }

  toggleAsset(asset: any) {
    var id = asset.assetRegisterItemId;
    if (this.selectedAssetIds.has(id)) {
      this.selectedAssetIds.delete(id);
      this.selectedAssets.set(this.selectedAssets().filter(function(a: any) { return a.assetRegisterItemId !== id; }));
    } else {
      this.selectedAssetIds.add(id);
      this.selectedAssets.set([...this.selectedAssets(), asset]);
    }
  }

  removeSelected(asset: any) {
    var id = asset.assetRegisterItemId;
    this.selectedAssetIds.delete(id);
    this.selectedAssets.set(this.selectedAssets().filter(function(a: any) { return a.assetRegisterItemId !== id; }));
  }

  selectAll() {
    var results = this.assetResults();
    var self = this;
    results.forEach(function(a: any) {
      if (!self.selectedAssetIds.has(a.assetRegisterItemId)) {
        self.selectedAssetIds.add(a.assetRegisterItemId);
        self.selectedAssets.set([...self.selectedAssets(), a]);
      }
    });
  }

  clearAll() {
    this.selectedAssetIds.clear();
    this.selectedAssets.set([]);
  }

  save() {
    if (!this.validateStep1()) { this.step.set(1); return; }
    if (this.selectedAssets().length === 0) {
      this.snackBar.open('Please select at least one asset for this plan', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.saving.set(true);
    var payload: any = {
      planName: this.form.planName,
      maintenanceTypeId: Number(this.form.maintenanceTypeId),
      frequencyId: Number(this.form.frequencyId),
      startDate: this.form.startDate,
      estimatedCost: this.form.estimatedCost != null ? Number(this.form.estimatedCost) : null,
      description: this.form.description || null,
      planProjectItemId: this.form.planProjectItemId ? Number(this.form.planProjectItemId) : null,
      isActive: true,
      assetIds: this.selectedAssets().map(function(a: any) { return a.assetRegisterItemId; })
    };
    var self = this;
    this.api.createPlannedMaintPlan(payload).subscribe({
      next: function(res: any) {
        self.saving.set(false);
        self.snackBar.open('Plan created', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        self.router.navigate(['/assets/maintenance/planned', res.planId]);
      },
      error: function(err: any) {
        self.saving.set(false);
        var msg = err?.error?.error || 'Failed to create plan';
        self.snackBar.open(msg, 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  triggerCsvUpload() {
    var el = document.getElementById('plan-csv-upload-input') as HTMLInputElement;
    if (el) { el.value = ''; el.click(); }
  }

  onCsvFileSelected(event: Event) {
    var input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var self = this;
    self.csvImporting = true;
    self.csvImportMsg = 'Reading CSV...';
    self.csvImportError = false;
    var reader = new FileReader();
    reader.onload = function(e: any) {
      var content: string = e.target.result;
      var lines = content.split('\n').map(function(l: string) { return l.replace(/\r$/, ''); });
      if (lines.length < 2) {
        self.csvImportMsg = 'CSV must have a header row and at least one data row.';
        self.csvImportError = true;
        self.csvImporting = false;
        return;
      }
      var values: string[] = [];
      for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var firstCell = '';
        if (line.startsWith('"')) {
          var end = line.indexOf('"', 1);
          firstCell = end > 0 ? line.substring(1, end) : line.substring(1);
        } else {
          firstCell = line.split(',')[0];
        }
        firstCell = firstCell.trim();
        if (firstCell) values.push(firstCell);
      }
      if (values.length === 0) {
        self.csvImportMsg = 'No asset IDs/barcodes found in the first column.';
        self.csvImportError = true;
        self.csvImporting = false;
        return;
      }
      self.api.matchCsvAssets(values).subscribe({
        next: function(matched: any[]) {
          var added = 0;
          var currentResults = self.assetResults();
          matched.forEach(function(m: any) {
            var id = m.assetRegisterItemId;
            if (!self.selectedAssetIds.has(id)) {
              self.selectedAssetIds.add(id);
              var fullAsset = currentResults.find(function(a: any) { return a.assetRegisterItemId === id; });
              var assetObj = fullAsset || { assetRegisterItemId: id, description: m.description || '', barcode: m.barcode || '' };
              self.selectedAssets.set([...self.selectedAssets(), assetObj]);
              added++;
            }
          });
          self.csvImportMsg = 'CSV matched ' + matched.length + ' asset(s); ' + added + ' newly added to selection. ' + (values.length - matched.length) + ' not found.';
          self.csvImportError = false;
          self.csvImporting = false;
        },
        error: function() {
          self.csvImportMsg = 'Failed to match CSV assets. Please try again.';
          self.csvImportError = true;
          self.csvImporting = false;
        }
      });
    };
    reader.readAsText(file);
  }

  openMapModal() {
    this.showMapModal = true;
    this.pendingMapIds = new Set<number>();
    this.mapSelectedCount = 0;
    this.mapLoading = true;
    var self = this;
    setTimeout(function() { self.initMap(); }, 100);
  }

  closeMapModal() {
    this.showMapModal = false;
    this.destroyMap();
  }

  confirmMapSelection() {
    var added = 0;
    var currentResults = this.assetResults();
    var pendingArr = Array.from(this.pendingMapIds);
    for (var i = 0; i < pendingArr.length; i++) {
      var id = pendingArr[i];
      if (!this.selectedAssetIds.has(id)) {
        this.selectedAssetIds.add(id);
        var fullAsset = currentResults.find(function(a: any) { return a.assetRegisterItemId === id; });
        var assetObj = fullAsset || { assetRegisterItemId: id, description: '', barcode: '' };
        this.selectedAssets.set([...this.selectedAssets(), assetObj]);
        added++;
      }
    }
    this.closeMapModal();
    if (added > 0) {
      this.csvImportMsg = added + ' asset(s) added from map selection.';
      this.csvImportError = false;
    }
  }

  private initMap() {
    var self = this;
    var mapItems = this.assetResults().filter(function(i: any) {
      return i.latitude != null && i.longitude != null &&
             i.latitude !== '' && i.longitude !== '';
    });

    import('leaflet').then(function(leafletModule: any) {
      self.L = leafletModule.default || leafletModule;
      var L = self.L;
      var container = document.getElementById('plan-create-map');
      if (!container) { self.mapLoading = false; return; }

      self.leafletMap = L.map(container, { preferCanvas: true }).setView([-31.5, 26.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
      }).addTo(self.leafletMap);

      var bounds: any[] = [];
      mapItems.forEach(function(item: any) {
        var lat = parseFloat(item.latitude);
        var lng = parseFloat(item.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        bounds.push([lat, lng]);
        var isPending = self.pendingMapIds.has(item.assetRegisterItemId);
        var isSelected = self.selectedAssetIds.has(item.assetRegisterItemId);
        var color = isSelected ? '#16a34a' : (isPending ? '#2563eb' : '#94a3b8');
        var marker = L.circleMarker([lat, lng], {
          radius: 8, color: color, fillColor: color, fillOpacity: 0.8, weight: 2
        }).addTo(self.leafletMap);
        marker.bindPopup('<strong>#' + item.assetRegisterItemId + '</strong><br>' + (item.description || '') + (item.barcode ? '<br>' + item.barcode : ''));
        marker.on('click', function() {
          var id = item.assetRegisterItemId;
          if (self.pendingMapIds.has(id)) {
            self.pendingMapIds.delete(id);
            marker.setStyle({ color: isSelected ? '#16a34a' : '#94a3b8', fillColor: isSelected ? '#16a34a' : '#94a3b8' });
          } else {
            self.pendingMapIds.add(id);
            marker.setStyle({ color: '#2563eb', fillColor: '#2563eb' });
          }
          self.mapSelectedCount = self.pendingMapIds.size;
        });
      });

      if (bounds.length > 0) {
        self.leafletMap.fitBounds(bounds, { padding: [40, 40] });
      }
      self.mapLoading = false;
    });
  }

  private destroyMap() {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  cancel() {
    this.router.navigate(['/assets/maintenance/planned']);
  }

  formatCost(v: any): string {
    if (v == null) return '—';
    return 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
