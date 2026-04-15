import { Component, OnInit, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  assets = signal<any[]>([]);
  filteredAssets = signal<any[]>([]);
  categories = signal<any[]>([]);
  locations = signal<any[]>([]);
  mapLoading = signal(true);
  categoryFilter = '';
  conditionFilter = '';
  statusFilter = '';
  clusteringEnabled = true;
  private map: any;
  private markers: any[] = [];
  private L: any;
  private resizeObserver: any;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getCategories().subscribe(c => this.categories.set(c));
    this.api.getLocations().subscribe(l => {
      const locsWithCounts = l.map((loc: any) => ({ ...loc, assetCount: 0 }));
      this.locations.set(locsWithCounts);
    });
    this.api.getAssets({ pageSize: 200 }).subscribe({
      next: (res) => {
        this.assets.set(res.data);
        this.filteredAssets.set(res.data);
        this.updateLocationCounts(res.data);
        this.plotMarkers();
      }
    });
  }

  async ngAfterViewInit() {
    try {
      this.L = await import('leaflet');
      const mapEl = document.getElementById('asset-map');
      if (!mapEl) return;

      this.map = this.L.map('asset-map', {
        center: [-32.33, 28.15],
        zoom: 11,
        zoomControl: true,
        attributionControl: true
      });

      this.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        tileSize: 256
      }).addTo(this.map);

      setTimeout(() => {
        this.map.invalidateSize();
        this.mapLoading.set(false);
        this.plotMarkers();
      }, 300);

      this.resizeObserver = new ResizeObserver(() => {
        if (this.map) this.map.invalidateSize();
      });
      this.resizeObserver.observe(mapEl);
    } catch (e) {
      console.warn('Map initialization failed:', e);
      this.mapLoading.set(false);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.map) this.map.remove();
  }

  filterAssets() {
    let filtered = this.assets();
    if (this.categoryFilter) filtered = filtered.filter(a => a.categoryName === this.categoryFilter);
    if (this.conditionFilter) filtered = filtered.filter(a => a.condition === this.conditionFilter);
    if (this.statusFilter) filtered = filtered.filter(a => a.status === this.statusFilter);
    this.filteredAssets.set(filtered);
    this.updateLocationCounts(filtered);
    this.plotMarkers();
  }

  updateLocationCounts(assets: any[]) {
    const locs = this.locations();
    const counts: Record<string, number> = {};
    assets.forEach(a => {
      if (a.locationName) counts[a.locationName] = (counts[a.locationName] || 0) + 1;
    });
    this.locations.set(locs.map(l => ({ ...l, assetCount: counts[l.name] || 0 })));
  }

  formatCurrency(val: any): string {
    if (val === null || val === undefined) return 'N/A';
    const num = parseFloat(val);
    if (isNaN(num)) return 'N/A';
    return 'R ' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  buildAssetInfoHtml(asset: any, color: string): string {
    return `
      <div style="font-weight:700;color:#1e293b;font-size:14px;margin-bottom:2px">${asset.assetId}</div>
      <div style="font-size:13px;color:#334155;margin-bottom:10px">${asset.description || ''}</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:12px;margin-bottom:10px">
        <div style="color:#64748b">Type:</div><div style="font-weight:500">${asset.assetTypeName || 'N/A'}</div>
        <div style="color:#64748b">Category:</div><div style="font-weight:500">${asset.categoryName || 'N/A'}</div>
        <div style="color:#64748b">Sub Category:</div><div style="font-weight:500">${asset.subCategoryName || 'N/A'}</div>
        <div style="color:#64748b">Measurement Type:</div><div style="font-weight:500">${asset.measurementType || 'N/A'}</div>
        <div style="color:#64748b">Status:</div><div style="font-weight:500;display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></div>${asset.status || 'N/A'}</div>
      </div>
    `;
  }

  buildFinancialSectionHtml(fin: any, loading: boolean, error: boolean): string {
    let inner = '';
    if (loading) {
      inner = '<div style="font-size:12px;color:#64748b">Loading...</div>';
    } else if (error) {
      inner = '<div style="font-size:12px;color:#ef4444">Failed to load financial data</div>';
    } else {
      const rows = [
        ['RUL', fin && fin.remainingUsefulLife !== undefined ? fin.remainingUsefulLife + ' months' : 'N/A'],
        ['Current Value', fin ? this.formatCurrency(fin.carryingAmount) : 'N/A'],
        ['Accum. Depreciation', fin ? this.formatCurrency(fin.depClosingBalance) : 'N/A'],
        ['Accum. Impairment', fin ? this.formatCurrency(fin.impClosingBalance) : 'N/A'],
        ['Accum. Impairment Reversal', fin ? this.formatCurrency(fin.impReversalClosingBalance) : 'N/A'],
        ['Cost Closing Balance', fin ? this.formatCurrency(fin.costClosingBalance) : 'N/A']
      ];
      inner = '<div style="display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:12px">';
      rows.forEach(function(row) {
        inner += '<div style="color:#64748b">' + row[0] + ':</div><div style="font-weight:500;text-align:right">' + row[1] + '</div>';
      });
      inner += '</div>';
    }
    return '<div style="border-top:1px solid #e2e8f0;padding-top:8px"><div style="font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Financial Information</div>' + inner + '</div>';
  }

  buildPopup(asset: any, color: string, fin: any, loading: boolean, error: boolean): string {
    return '<div style="font-family:Inter,sans-serif;min-width:240px;padding:12px">'
      + this.buildAssetInfoHtml(asset, color)
      + this.buildFinancialSectionHtml(fin, loading, error)
      + '</div>';
  }

  plotMarkers() {
    if (!this.map || !this.L) return;
    this.markers.forEach(m => m.remove());
    this.markers = [];
    const bounds: any[] = [];
    this.filteredAssets().forEach(asset => {
      if (asset.latitude && asset.longitude) {
        const color = asset.condition === 'Good' ? '#10b981' : asset.condition === 'Fair' ? '#f59e0b' : '#ef4444';
        const icon = this.L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:pointer"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        const marker = this.L.marker([asset.latitude, asset.longitude], { icon })
          .bindPopup(this.buildPopup(asset, color, null, true, false), { className: 'asset-popup', maxWidth: 300 })
          .addTo(this.map);
        marker.on('popupopen', () => {
          this.api.getAssetScheduleSummary(asset.assetId).subscribe({
            next: (res: any) => {
              const fin = res && res.hasData !== 0 ? res.closingBalances : null;
              marker.getPopup().setContent(this.buildPopup(asset, color, fin, false, false));
            },
            error: () => {
              marker.getPopup().setContent(this.buildPopup(asset, color, null, false, true));
            }
          });
        });
        this.markers.push(marker);
        bounds.push([asset.latitude, asset.longitude]);
      }
    });
    if (bounds.length > 0 && !this.mapLoading()) {
      try { this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 }); } catch (e) {}
    }
  }

  centerOnLocation(loc: any) {
    if (this.map && loc.lat && loc.lng) {
      this.map.flyTo([loc.lat, loc.lng], 14, { duration: 1 });
    }
  }

  resetView() {
    if (this.map) {
      this.categoryFilter = '';
      this.conditionFilter = '';
      this.statusFilter = '';
      this.filteredAssets.set(this.assets());
      this.updateLocationCounts(this.assets());
      this.plotMarkers();
      this.map.flyTo([-32.33, 28.15], 11, { duration: 1 });
    }
  }

  toggleClustering() {
    this.clusteringEnabled = !this.clusteringEnabled;
    this.plotMarkers();
  }
}
