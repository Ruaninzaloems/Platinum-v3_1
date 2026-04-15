import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-maintenance-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './maintenance-request-detail.component.html',
  styleUrls: ['./maintenance-request-detail.component.css']
})
export class MaintenanceRequestDetailComponent implements OnInit {
  requestId = 0;
  loading = signal(true);
  request = signal<any>(null);
  activeTab = signal<'details' | 'workorders'>('details');

  serviceGroups = signal<any[]>([]);
  leadTimes = signal<any[]>([]);
  assetTypes = signal<any[]>([]);
  assetCategories = signal<any[]>([]);
  assetSubCategories = signal<any[]>([]);

  planProjects = signal<any[]>([]);
  debitScoaItems = signal<any[]>([]);
  creditScoaItems = signal<any[]>([]);
  commodities = signal<any[]>([]);

  form: any = {};

  workOrders = signal<any[]>([]);
  workOrdersLoading = signal(false);
  showWorkOrderForm = signal(false);
  editingWorkOrder = signal<any>(null);
  woForm: any = this.emptyWorkOrder();

  expandedWorkOrders = signal<Set<number>>(new Set());
  workOrderDetails = signal<Record<number, any[]>>({});
  detailsLoading = signal<Set<number>>(new Set());
  showDetailForm = signal<number | null>(null);
  editingDetail = signal<any>(null);
  detailForm: any = this.emptyDetail();

  assetSearchTerm = '';
  assetShowDropdown = false;
  assetFilteredResults = signal<any[]>([]);
  selectedAsset = signal<any>(null);
  private assetSearchDebounce: any = null;

  showMapModal = false;
  mapLoading = false;
  mapSelectedCount = 0;
  private pendingMapAssetId: number | null = null;
  private leafletMap: any = null;
  private L: any = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.requestId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRequest();
    this.loadLookups();
  }

  loadRequest() {
    this.loading.set(true);
    this.api.getMaintenanceRequest(this.requestId).subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) {
        this.request.set(res);
        this.form = { ...res };
        if (this.form.requestDate) {
          this.form.requestDate = new Date(this.form.requestDate).toISOString().split('T')[0];
        }
        if (res.assetId) {
          this.selectedAsset.set({ assetId: res.assetId, description: res.assetDescription, barcode: res.assetBarcode });
          this.assetSearchTerm = String(res.assetId);
        } else {
          this.selectedAsset.set(null);
          this.assetSearchTerm = '';
        }
        this.loading.set(false);
        this.loadWorkOrders();
      }.bind(this),
      error: function(this: MaintenanceRequestDetailComponent) {
        this.loading.set(false);
        this.snackBar.open('Failed to load maintenance request', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  loadLookups() {
    this.api.getMaintenanceServiceGroups().subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) { this.serviceGroups.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getMaintenanceLeadTimes().subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) { this.leadTimes.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getAssetTypes().subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) { this.assetTypes.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getAssetCategoriesList().subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) { this.assetCategories.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getAssetSubCategoriesList().subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) { this.assetSubCategories.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getPlanProjects().subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) { this.planProjects.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getCommodities().subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) { this.commodities.set(Array.isArray(res) ? res : []); }.bind(this)
    });
  }

  onDebitProjectChange() {
    this.woForm.debitPlanProjectItemId = null;
    this.debitScoaItems.set([]);
    if (!this.woForm.debitProjectId) return;
    var self = this;
    this.api.getPlanProjectItems(Number(this.woForm.debitProjectId)).subscribe({
      next: function(res: any) { self.debitScoaItems.set(Array.isArray(res) ? res : []); }
    });
  }

  onCreditProjectChange() {
    this.woForm.creditPlanProjectItemId = null;
    this.creditScoaItems.set([]);
    if (!this.woForm.creditProjectId) return;
    var self = this;
    this.api.getPlanProjectItems(Number(this.woForm.creditProjectId)).subscribe({
      next: function(res: any) { self.creditScoaItems.set(Array.isArray(res) ? res : []); }
    });
  }

  getProposedClosing(): string {
    if (this.form.leadTimeId && this.form.requestDate) {
      var ltId = Number(this.form.leadTimeId);
      var lt = this.leadTimes().find(function(l: any) { return l.leadTimeId === ltId; });
      if (lt) {
        var rd = new Date(this.form.requestDate);
        rd.setDate(rd.getDate() + lt.leadTimeDays);
        return rd.toISOString().split('T')[0];
      }
    }
    return '';
  }

  saveRequest() {
    if (this.form.isApproved === true && !this.form.assetId) {
      this.snackBar.open('An asset must be associated before the request can be approved.', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.api.updateMaintenanceRequest(this.requestId, this.form).subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) {
        this.request.set(res);
        this.form = { ...res };
        if (res.assetId) {
          this.selectedAsset.set({ assetId: res.assetId, description: res.assetDescription, barcode: res.assetBarcode });
          this.assetSearchTerm = String(res.assetId);
        }
        if (this.form.requestDate) {
          this.form.requestDate = new Date(this.form.requestDate).toISOString().split('T')[0];
        }
        this.snackBar.open('Request updated successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: MaintenanceRequestDetailComponent) {
        this.snackBar.open('Failed to update request', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  goBack() { this.router.navigate(['/maintenance/requests']); }

  setTab(tab: 'details' | 'workorders') { this.activeTab.set(tab); }

  loadWorkOrders() {
    this.workOrdersLoading.set(true);
    this.api.getMaintenanceWorkOrders(this.requestId).subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) {
        this.workOrders.set(Array.isArray(res) ? res : []);
        this.workOrdersLoading.set(false);
      }.bind(this),
      error: function(this: MaintenanceRequestDetailComponent) { this.workOrdersLoading.set(false); }.bind(this)
    });
  }

  emptyWorkOrder(): any {
    return {
      requestId: 0,
      workOrderDesc: '',
      assetRegisterItemId: 0,
      workOrderDate: new Date().toISOString().split('T')[0],
      requisitionNumber: null,
      amount: null,
      debitProjectId: null,
      debitPlanProjectItemId: null,
      creditProjectId: null,
      creditPlanProjectItemId: null,
      maintainerId: null,
      workOrderTypeId: null,
      workOrderStatusId: null
    };
  }

  openNewWorkOrder() {
    this.woForm = this.emptyWorkOrder();
    this.woForm.requestId = this.requestId;
    this.debitScoaItems.set([]);
    this.creditScoaItems.set([]);
    this.editingWorkOrder.set(null);
    this.showWorkOrderForm.set(true);
  }

  editWorkOrder(wo: any) {
    this.woForm = { ...wo };
    if (this.woForm.workOrderDate) {
      this.woForm.workOrderDate = new Date(this.woForm.workOrderDate).toISOString().split('T')[0];
    }
    this.debitScoaItems.set([]);
    this.creditScoaItems.set([]);
    this.editingWorkOrder.set(wo);
    this.showWorkOrderForm.set(true);
    if (this.woForm.debitProjectId) {
      var self = this;
      this.api.getPlanProjectItems(Number(this.woForm.debitProjectId)).subscribe({
        next: function(res: any) { self.debitScoaItems.set(Array.isArray(res) ? res : []); }
      });
    }
    if (this.woForm.creditProjectId) {
      var self2 = this;
      this.api.getPlanProjectItems(Number(this.woForm.creditProjectId)).subscribe({
        next: function(res: any) { self2.creditScoaItems.set(Array.isArray(res) ? res : []); }
      });
    }
  }

  saveWorkOrder() {
    if (!this.woForm.workOrderDesc) {
      this.snackBar.open('Work order description is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    const editing = this.editingWorkOrder();
    if (editing) {
      this.api.updateMaintenanceWorkOrder(editing.maintenanceWorksOrderId, this.woForm).subscribe({
        next: function(this: MaintenanceRequestDetailComponent) {
          this.showWorkOrderForm.set(false);
          this.loadWorkOrders();
          this.snackBar.open('Work order updated', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        }.bind(this)
      });
    } else {
      this.woForm.requestId = this.requestId;
      this.api.createMaintenanceWorkOrder(this.woForm).subscribe({
        next: function(this: MaintenanceRequestDetailComponent) {
          this.showWorkOrderForm.set(false);
          this.loadWorkOrders();
          this.snackBar.open('Work order created', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        }.bind(this)
      });
    }
  }

  cancelWorkOrderForm() { this.showWorkOrderForm.set(false); }

  deleteWorkOrder(wo: any) {
    if (!confirm('Delete this work order and all its details?')) return;
    this.api.deleteMaintenanceWorkOrder(wo.maintenanceWorksOrderId).subscribe({
      next: function(this: MaintenanceRequestDetailComponent) {
        this.loadWorkOrders();
        this.snackBar.open('Work order deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  toggleWorkOrderExpand(woId: number) {
    const s = new Set(this.expandedWorkOrders());
    if (s.has(woId)) {
      s.delete(woId);
    } else {
      s.add(woId);
      if (!this.workOrderDetails()[woId]) {
        this.loadDetails(woId);
      }
    }
    this.expandedWorkOrders.set(s);
  }

  isExpanded(woId: number): boolean {
    return this.expandedWorkOrders().has(woId);
  }

  loadDetails(woId: number) {
    const loadSet = new Set(this.detailsLoading());
    loadSet.add(woId);
    this.detailsLoading.set(loadSet);
    this.api.getMaintenanceWorkOrderDetails(woId).subscribe({
      next: function(this: MaintenanceRequestDetailComponent, res: any) {
        const current = { ...this.workOrderDetails() };
        current[woId] = Array.isArray(res) ? res : [];
        this.workOrderDetails.set(current);
        const ls = new Set(this.detailsLoading());
        ls.delete(woId);
        this.detailsLoading.set(ls);
      }.bind(this),
      error: function(this: MaintenanceRequestDetailComponent) {
        const ls = new Set(this.detailsLoading());
        ls.delete(woId);
        this.detailsLoading.set(ls);
      }.bind(this)
    });
  }

  getDetails(woId: number): any[] {
    return this.workOrderDetails()[woId] || [];
  }

  isDetailsLoading(woId: number): boolean {
    return this.detailsLoading().has(woId);
  }

  emptyDetail(): any {
    return {
      maintenanceWorksOrderId: 0,
      technicianNumber: '',
      lineItemNumber: '',
      itemType: '',
      commodityId: null,
      quantityOrdered: null,
      quantityReceived: null,
      value: null
    };
  }

  openNewDetail(woId: number) {
    this.detailForm = this.emptyDetail();
    this.detailForm.maintenanceWorksOrderId = woId;
    this.editingDetail.set(null);
    this.showDetailForm.set(woId);
  }

  editDetail(detail: any) {
    this.detailForm = { ...detail };
    this.editingDetail.set(detail);
    this.showDetailForm.set(detail.maintenanceWorksOrderId);
  }

  saveDetail() {
    const editing = this.editingDetail();
    const woId = this.detailForm.maintenanceWorksOrderId;
    const newValue = Number(this.detailForm.value) || 0;

    const wo = this.workOrders().find(function(w: any) { return w.maintenanceWorksOrderId === woId; });
    const woAmount = wo && wo.amount != null ? Number(wo.amount) : null;

    if (woAmount != null) {
      const existingDetails = this.getDetails(woId);
      var existingTotal = 0;
      for (var i = 0; i < existingDetails.length; i++) {
        const d = existingDetails[i];
        if (editing && d.maintenanceWorksOrderDetailsId === editing.maintenanceWorksOrderDetailsId) continue;
        existingTotal += Number(d.value) || 0;
      }
      if (existingTotal + newValue > woAmount) {
        const remaining = woAmount - existingTotal;
        this.snackBar.open(
          'Value exceeds Work Order budget. Remaining: R ' + remaining.toFixed(2),
          'OK',
          { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' }
        );
        return;
      }
    }

    if (editing) {
      this.api.updateMaintenanceWorkOrderDetail(editing.maintenanceWorksOrderDetailsId, this.detailForm).subscribe({
        next: function(this: MaintenanceRequestDetailComponent) {
          this.showDetailForm.set(null);
          this.loadDetails(this.detailForm.maintenanceWorksOrderId);
          this.snackBar.open('Detail updated', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        }.bind(this)
      });
    } else {
      this.api.createMaintenanceWorkOrderDetail(this.detailForm).subscribe({
        next: function(this: MaintenanceRequestDetailComponent) {
          const woId = this.detailForm.maintenanceWorksOrderId;
          this.showDetailForm.set(null);
          this.loadDetails(woId);
          this.snackBar.open('Detail added', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        }.bind(this)
      });
    }
  }

  cancelDetailForm() { this.showDetailForm.set(null); }

  deleteDetail(detail: any) {
    this.api.deleteMaintenanceWorkOrderDetail(detail.maintenanceWorksOrderDetailsId).subscribe({
      next: function(this: MaintenanceRequestDetailComponent) {
        this.loadDetails(detail.maintenanceWorksOrderId);
        this.snackBar.open('Detail removed', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-ZA');
  }

  formatDateInput(d: string): string {
    if (!d) return '';
    return new Date(d).toISOString().split('T')[0];
  }

  onAssetSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.assetSearchTerm = val;
    this.assetShowDropdown = true;
    if (this.assetSearchDebounce) clearTimeout(this.assetSearchDebounce);
    if (!val || val.length < 1) { this.assetFilteredResults.set([]); return; }
    var self = this;
    this.assetSearchDebounce = setTimeout(function() {
      var params: any = { search: val, pageSize: 20 };
      if (self.form.assetTypeId) params.type = self.form.assetTypeId;
      if (self.form.assetCategoryId) params.category = self.form.assetCategoryId;
      if (self.form.assetSubCategoryId) params.subCategory = self.form.assetSubCategoryId;
      self.api.getAssets(params).subscribe({
        next: function(resp: any) {
          var items = resp?.data || resp || [];
          self.assetFilteredResults.set(Array.isArray(items) ? items : []);
        },
        error: function() { self.assetFilteredResults.set([]); }
      });
    }, 250);
  }

  closeAssetDropdown() {
    var self = this;
    setTimeout(function() { self.assetShowDropdown = false; }, 150);
  }

  selectAsset(asset: any) {
    this.selectedAsset.set(asset);
    this.form.assetId = asset.assetId;
    this.assetSearchTerm = String(asset.assetId);
    this.assetShowDropdown = false;
    this.assetFilteredResults.set([]);
  }

  clearAsset() {
    this.selectedAsset.set(null);
    this.form.assetId = null;
    this.assetSearchTerm = '';
    this.assetFilteredResults.set([]);
  }

  openMapModal() {
    this.showMapModal = true;
    this.pendingMapAssetId = null;
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
    if (this.pendingMapAssetId != null) {
      var self = this;
      this.api.getAsset(this.pendingMapAssetId).subscribe({
        next: function(asset: any) { self.selectAsset(asset); }
      });
    }
    this.closeMapModal();
  }

  private initMap() {
    var self = this;
    var mapParams: any = { pageSize: 2000 };
    if (this.form.assetTypeId) mapParams.type = this.form.assetTypeId;
    if (this.form.assetCategoryId) mapParams.category = this.form.assetCategoryId;
    if (this.form.assetSubCategoryId) mapParams.subCategory = this.form.assetSubCategoryId;
    this.api.getAssets(mapParams).subscribe({
      next: function(resp: any) {
        var allItems = resp?.data || resp || [];
        var mapItems = (Array.isArray(allItems) ? allItems : []).filter(function(i: any) {
          return i.latitude != null && i.longitude != null && i.latitude !== '' && i.longitude !== '';
        });
        import('leaflet').then(function(leafletModule: any) {
          self.L = leafletModule.default || leafletModule;
          var L = self.L;
          var container = document.getElementById('maint-asset-map');
          if (!container) { self.mapLoading = false; return; }
          self.leafletMap = L.map(container, { preferCanvas: true }).setView([-31.5, 26.0], 6);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
          }).addTo(self.leafletMap);
          var bounds: any[] = [];
          for (var i = 0; i < mapItems.length; i++) {
            var item = mapItems[i];
            var lat = parseFloat(item.latitude);
            var lng = parseFloat(item.longitude);
            if (isNaN(lat) || isNaN(lng)) continue;
            bounds.push([lat, lng]);
            var assetNumId = item.assetRegisterItemId ?? item.assetId;
            var isPending = self.pendingMapAssetId === assetNumId;
            var costStr = item.purchaseAmount != null ? 'R ' + parseFloat(item.purchaseAmount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'N/A';
            var marker = L.circleMarker([lat, lng], {
              radius: 8, fillColor: isPending ? '#16a34a' : '#2563eb',
              color: isPending ? '#15803d' : '#1d4ed8', weight: 1.5, opacity: 1, fillOpacity: 0.8
            }).addTo(self.leafletMap);
            (function(capturedItem: any, capturedMarker: any, capturedId: any) {
              var popupContent = '<div style="font-family:Inter,sans-serif;min-width:220px;padding:4px">' +
                '<div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:2px">' + (capturedItem.description || 'Asset') + '</div>' +
                '<div style="font-size:11px;color:#64748b;margin-bottom:8px">Asset ID: ' + capturedId + '</div>' +
                '<div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px;margin-bottom:8px">' +
                  '<div style="color:#94a3b8">Type:</div><div style="font-weight:500">' + (capturedItem.assetTypeName || capturedItem.assetTypeDesc || 'N/A') + '</div>' +
                  '<div style="color:#94a3b8">Category:</div><div style="font-weight:500">' + (capturedItem.categoryName || capturedItem.assetCategoryDesc || 'N/A') + '</div>' +
                  '<div style="color:#94a3b8">Barcode:</div><div style="font-weight:500;font-family:monospace">' + (capturedItem.barcode || 'N/A') + '</div>' +
                  '<div style="color:#94a3b8">Status:</div><div style="font-weight:500">' + (capturedItem.statusDesc || 'N/A') + '</div>' +
                  '<div style="color:#94a3b8">Cost:</div><div style="font-weight:500;color:#0f2b46">' + costStr + '</div>' +
                '</div>' +
                '<button id="maint-map-sel-' + capturedId + '" style="margin-top:4px;padding:5px 14px;background:' + (self.pendingMapAssetId === capturedId ? '#16a34a' : '#2563eb') + ';color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:500">' + (self.pendingMapAssetId === capturedId ? '&#x2713; Selected' : 'Select') + '</button>' +
                '</div>';
              capturedMarker.bindPopup(popupContent);
              capturedMarker.on('popupopen', function() {
                var btn = document.getElementById('maint-map-sel-' + capturedId) as HTMLButtonElement;
                if (btn) {
                  btn.onclick = function() {
                    if (self.pendingMapAssetId === capturedId) {
                      self.pendingMapAssetId = null;
                      capturedMarker.setStyle({ fillColor: '#2563eb', color: '#1d4ed8' });
                      btn.textContent = 'Select';
                      btn.style.background = '#2563eb';
                    } else {
                      self.pendingMapAssetId = capturedId;
                      capturedMarker.setStyle({ fillColor: '#16a34a', color: '#15803d' });
                      btn.textContent = '\u2713 Selected';
                      btn.style.background = '#16a34a';
                    }
                    self.mapSelectedCount = self.pendingMapAssetId != null ? 1 : 0;
                  };
                }
              });
            })(item, marker, assetNumId);
          }
          if (bounds.length > 0) {
            self.leafletMap.fitBounds(bounds, { padding: [30, 30] });
          }
          self.mapLoading = false;
        }).catch(function() { self.mapLoading = false; });
      },
      error: function() { self.mapLoading = false; }
    });
  }

  private destroyMap() {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  printRequest() {
    var self = this;
    var req = this.request();
    var wos = this.workOrders();
    if (!req || wos.length === 0) {
      this.snackBar.open('No work orders to print.', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    var pending = wos.length;
    var detailsMap: Record<number, any[]> = {};
    for (var i = 0; i < wos.length; i++) {
      (function(wo: any) {
        var existing = self.getDetails(wo.maintenanceWorksOrderId);
        if (existing.length > 0) {
          detailsMap[wo.maintenanceWorksOrderId] = existing;
          pending--;
          if (pending === 0) { self.openPrintWindow(req, wos, detailsMap); }
        } else {
          self.api.getMaintenanceWorkOrderDetails(wo.maintenanceWorksOrderId).subscribe({
            next: function(res: any) {
              detailsMap[wo.maintenanceWorksOrderId] = Array.isArray(res) ? res : [];
              pending--;
              if (pending === 0) { self.openPrintWindow(req, wos, detailsMap); }
            },
            error: function() {
              detailsMap[wo.maintenanceWorksOrderId] = [];
              pending--;
              if (pending === 0) { self.openPrintWindow(req, wos, detailsMap); }
            }
          });
        }
      })(wos[i]);
    }
  }

  private openPrintWindow(req: any, wos: any[], detailsMap: Record<number, any[]>) {
    var self = this;
    var fmt = function(d: string) { return d ? new Date(d).toLocaleDateString('en-ZA') : '-'; };
    var fmtAmt = function(v: any) { return v != null ? 'R ' + parseFloat(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '-'; };

    var headerBlock = '<div class="req-header">' +
      '<div class="req-title">Maintenance Request MR-' + req.requestId + '</div>' +
      '<div class="req-grid">' +
        '<div class="rg-item"><span class="rg-label">Service Group</span><span class="rg-val">' + (req.serviceGroupDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Asset Type</span><span class="rg-val">' + (req.assetTypeDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Asset Category</span><span class="rg-val">' + (req.assetCategoryDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Sub-Category</span><span class="rg-val">' + (req.subCategoryDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Request Date</span><span class="rg-val">' + fmt(req.requestDate) + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Lead Time</span><span class="rg-val">' + (req.leadTimeDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Proposed Closing</span><span class="rg-val">' + fmt(req.proposedClosingTime) + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Status</span><span class="rg-val rg-approved">Approved</span></div>' +
        '<div class="rg-item"><span class="rg-label">Asset</span><span class="rg-val">' + (req.assetId ? req.assetId + (req.assetDescription ? ' — ' + req.assetDescription : '') : '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Date Captured</span><span class="rg-val">' + fmt(req.dateCaptured) + '</span></div>' +
      '</div>' +
      '<div class="rg-desc"><span class="rg-label">Description</span><span class="rg-val">' + (req.maintenanceDescription || '-') + '</span></div>' +
    '</div>';

    var pages = '';
    for (var i = 0; i < wos.length; i++) {
      var wo = wos[i];
      var details = detailsMap[wo.maintenanceWorksOrderId] || [];
      var lineRows = '';
      if (details.length === 0) {
        lineRows = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;font-style:italic">No line items</td></tr>';
      } else {
        for (var j = 0; j < details.length; j++) {
          var d = details[j];
          lineRows += '<tr>' +
            '<td>' + (d.technicianNumber || '-') + '</td>' +
            '<td>' + (d.lineItemNumber || '-') + '</td>' +
            '<td>' + (d.itemType || '-') + '</td>' +
            '<td>' + (d.commodityDesc || '-') + '</td>' +
            '<td>' + (d.quantityOrdered != null ? d.quantityOrdered : '-') + '</td>' +
            '<td>' + (d.quantityReceived != null ? d.quantityReceived : '-') + '</td>' +
            '<td>' + (d.value != null ? fmtAmt(d.value) : '-') + '</td>' +
          '</tr>';
        }
      }
      if (i > 0) pages += '<div style="page-break-before:always"></div>';
      pages += headerBlock +
        '<div class="wo-block">' +
          '<div class="wo-title">Work Order WO-' + wo.maintenanceWorksOrderId + ' — ' + (wo.workOrderDesc || '') + '</div>' +
          '<div class="wo-grid">' +
            '<div class="rg-item"><span class="rg-label">Date</span><span class="rg-val">' + fmt(wo.workOrderDate) + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Requisition #</span><span class="rg-val">' + (wo.requisitionNumber || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Amount</span><span class="rg-val">' + fmtAmt(wo.amount) + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Debit Project</span><span class="rg-val">' + (wo.debitProjectName || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Debit SCOA</span><span class="rg-val">' + (wo.debitScoaDesc || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Credit Project</span><span class="rg-val">' + (wo.creditProjectName || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Credit SCOA</span><span class="rg-val">' + (wo.creditScoaDesc || '-') + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="lines-block">' +
          '<div class="lines-title">Line Items</div>' +
          '<table class="lines-table">' +
            '<thead><tr><th>Technician #</th><th>Line Item #</th><th>Type</th><th>Commodity</th><th>Qty Ordered</th><th>Qty Received</th><th>Value</th></tr></thead>' +
            '<tbody>' + lineRows + '</tbody>' +
          '</table>' +
        '</div>';
    }

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>MR-' + req.requestId + ' Print</title>' +
      '<style>' +
        'body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:0;padding:20px}' +
        '.req-header{border:1.5px solid #1e40af;border-radius:6px;padding:14px 16px;margin-bottom:16px;background:#f0f7ff}' +
        '.req-title{font-size:16px;font-weight:700;color:#1e40af;margin-bottom:10px}' +
        '.req-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 16px;margin-bottom:8px}' +
        '.rg-item{display:flex;flex-direction:column;gap:2px}' +
        '.rg-label{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}' +
        '.rg-val{font-size:12px;font-weight:500;color:#1e293b}' +
        '.rg-approved{color:#166534;font-weight:700}' +
        '.rg-desc{display:flex;flex-direction:column;gap:2px;margin-top:8px;padding-top:8px;border-top:1px solid #bfdbfe}' +
        '.wo-block{border:1px solid #cbd5e1;border-radius:6px;padding:12px 16px;margin-bottom:12px;background:#fafbfc}' +
        '.wo-title{font-size:13px;font-weight:700;color:#334155;margin-bottom:8px}' +
        '.wo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px 16px}' +
        '.lines-block{margin-bottom:12px}' +
        '.lines-title{font-size:12px;font-weight:700;color:#475569;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}' +
        '.lines-table{width:100%;border-collapse:collapse;font-size:11px}' +
        '.lines-table th{background:#f1f5f9;padding:6px 8px;text-align:left;font-weight:700;color:#475569;border:1px solid #e2e8f0;font-size:10px;text-transform:uppercase}' +
        '.lines-table td{padding:5px 8px;border:1px solid #e2e8f0;color:#334155}' +
        '.lines-table tr:nth-child(even) td{background:#f8fafc}' +
        '@media print{body{padding:10px}@page{margin:15mm}}' +
      '</style></head><body>' + pages + '</body></html>';

    var win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      var w = win;
      setTimeout(function() { w.print(); }, 500);
    }
  }
}
