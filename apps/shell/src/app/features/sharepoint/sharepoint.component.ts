import {
  Component, signal, computed, inject, OnInit, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GraphService, SharePointSite, Drive, DriveItem } from '@platinumv3/shared/graph';
import { MsAuthService } from '@platinumv3/shared/auth';

interface BreadcrumbItem { id: string; name: string; }

interface PinnedSite {
  hostname       : string;
  sitePath       : string;   // e.g. '/sites/Sebata2'
  displayName    : string;
  defaultLibrary : string;   // pre-select this drive by name
}

// ── Pre-configured pinned SharePoint sites ─────────────────────────────────
const PINNED_SITES: PinnedSite[] = [
  {
    hostname      : 'zamicromega.sharepoint.com',
    sitePath      : '/sites/Sebata2',
    displayName   : 'Sebata2',
    defaultLibrary: 'UatAssets',
  },
];

@Component({
  selector: 'app-sharepoint',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule,
  ],
  template: `
    <div class="sp-page">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="sp-header">
        <div class="sp-header-left">
          <mat-icon class="sp-icon">folder_special</mat-icon>
          <div>
            <h1>SharePoint Documents</h1>
            <p>Browse, upload and download files from your Microsoft 365 tenant</p>
          </div>
        </div>
        <div class="sp-header-right">
          @if (msAuth.msUser(); as u) {
            <div class="user-chip">
              <mat-icon>account_circle</mat-icon>
              <span>{{ u.name }}</span>
            </div>
          }
        </div>
      </div>

      <!-- ── Not signed in ───────────────────────────────────────────────── -->
      @if (!msAuth.isSignedIn()) {
        <div class="not-signed-in">
          @if (signingIn()) {
            <mat-spinner diameter="48"></mat-spinner>
            <h2>Opening Microsoft Sign-In…</h2>
            <p>A sign-in popup should have appeared. Allow popups if blocked.</p>
          } @else {
            <mat-icon class="big-icon">lock</mat-icon>
            <h2>Microsoft Sign-In Required</h2>
            <p>Allow the popup or click below to try again.</p>
            <button mat-raised-button color="primary" (click)="signIn()">
              <mat-icon>login</mat-icon> Sign in with Microsoft
            </button>
          }
        </div>
      } @else {

        <div class="sp-layout">

          <!-- ── Sites panel ────────────────────────────────────────────── -->
          <aside class="sites-panel">

            <!-- Pinned sites -->
            <div class="panel-section-header">
              <mat-icon>push_pin</mat-icon> Pinned Sites
            </div>
            <ul class="site-list">
              @for (p of pinnedSites(); track p.sitePath) {
                <li [class.active]="selectedSite()?.webUrl?.includes(p.sitePath)"
                    (click)="selectPinned(p)">
                  @if (pinnedLoading()) {
                    <mat-spinner diameter="16" style="flex-shrink:0"></mat-spinner>
                  } @else {
                    <mat-icon class="pin-icon">push_pin</mat-icon>
                  }
                  <div>
                    <div class="site-name">{{ p.displayName }}</div>
                    <div class="site-url">{{ p.hostname }}{{ p.sitePath }}</div>
                  </div>
                </li>
              }
            </ul>

            <!-- Divider -->
            <div class="panel-divider"></div>

            <!-- All sites search -->
            <div class="panel-section-header">
              <mat-icon>search</mat-icon> All Sites
            </div>
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input type="text" placeholder="Search sites…"
                     [(ngModel)]="siteQuery" (input)="searchSites()">
            </div>

            @if (sitesLoading()) {
              <div class="spinner-wrap"><mat-spinner diameter="32"></mat-spinner></div>
            } @else {
              <ul class="site-list scrollable">
                @for (s of sites(); track s.id) {
                  <li [class.active]="selectedSite()?.id === s.id"
                      (click)="selectSite(s)">
                    <mat-icon>language</mat-icon>
                    <div>
                      <div class="site-name">{{ s.displayName || s.name }}</div>
                      <div class="site-url">{{ s.webUrl | slice:8:50 }}…</div>
                    </div>
                  </li>
                }
                @if (sites().length === 0 && siteQuery) {
                  <li class="empty">No sites found</li>
                }
                @if (sites().length === 0 && !siteQuery) {
                  <li class="empty">Type to search sites</li>
                }
              </ul>
            }
          </aside>

          <!-- ── Main area ─────────────────────────────────────────────── -->
          <main class="main-area">

            <!-- Drive picker -->
            @if (selectedSite()) {
              <div class="drive-bar">
                <mat-icon>storage</mat-icon>
                <span>Document Library:</span>
                <select [(ngModel)]="selectedDriveId" (change)="onDriveChange()">
                  @for (d of drives(); track d.id) {
                    <option [value]="d.id">{{ d.name }}</option>
                  }
                </select>
                <span class="drive-url">{{ selectedSite()?.webUrl }}</span>
              </div>
            }

            <!-- Breadcrumb -->
            @if (breadcrumbs().length > 0) {
              <nav class="breadcrumb">
                <span class="bc-item bc-root" (click)="gotoRoot()">
                  <mat-icon>home</mat-icon>
                </span>
                @for (bc of breadcrumbs(); track bc.id; let last = $last) {
                  <mat-icon class="bc-sep">chevron_right</mat-icon>
                  <span class="bc-item" [class.bc-last]="last"
                        (click)="!last && gotoCrumb(bc)">
                    {{ bc.name }}
                  </span>
                }
              </nav>
            }

            <!-- Toolbar -->
            @if (selectedDriveId()) {
              <div class="toolbar">
                <button mat-stroked-button (click)="reload()" [disabled]="filesLoading()">
                  <mat-icon>refresh</mat-icon> Refresh
                </button>
                <button mat-stroked-button (click)="promptNewFolder()">
                  <mat-icon>create_new_folder</mat-icon> New Folder
                </button>
                <button mat-raised-button color="primary" (click)="fileInput.click()">
                  <mat-icon>upload</mat-icon> Upload
                </button>
                <input #fileInput type="file" multiple hidden
                       (change)="onFilesSelected($event)">
              </div>
            }

            <!-- File list -->
            @if (filesLoading()) {
              <div class="spinner-wrap"><mat-spinner diameter="40"></mat-spinner></div>
            } @else if (!selectedSite()) {
              <div class="placeholder">
                <mat-icon class="big-icon">folder_open</mat-icon>
                <p>Select a SharePoint site from the left panel</p>
              </div>
            } @else {
              <div class="file-grid">
                @for (item of sortedItems(); track item.id) {
                  <div class="file-card" (dblclick)="openItem(item)"
                       [matTooltip]="item.name + (item.folder ? ' (folder)' : ' — ' + formatSize(item.size))">
                    <div class="file-icon" [class.folder-icon]="item.folder">
                      <mat-icon>{{ item.folder ? 'folder' : getFileIcon(item.name) }}</mat-icon>
                    </div>
                    <div class="file-meta">
                      <div class="file-name">{{ item.name }}</div>
                      <div class="file-info">
                        {{ item.folder
                          ? (item.folder.childCount + ' items')
                          : formatSize(item.size) }}
                        · {{ item.lastModifiedDateTime | date:'dd MMM yyyy' }}
                      </div>
                    </div>
                    <div class="file-actions">
                      @if (!item.folder) {
                        <button mat-icon-button matTooltip="Download"
                                (click)="download(item); $event.stopPropagation()">
                          <mat-icon>download</mat-icon>
                        </button>
                      }
                      <button mat-icon-button matTooltip="Delete" color="warn"
                              (click)="deleteItem(item); $event.stopPropagation()">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }
                @if (items().length === 0) {
                  <div class="empty-folder">
                    <mat-icon>folder_open</mat-icon>
                    <p>This folder is empty</p>
                    <button mat-stroked-button (click)="fileInput.click()">Upload a file</button>
                  </div>
                }
              </div>
            }
          </main>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .sp-page { height: 100%; display: flex; flex-direction: column; background: #f8fafc; }

    /* Header */
    .sp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem; background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }
    .sp-header-left { display: flex; align-items: center; gap: 1rem; }
    .sp-icon { font-size: 36px; color: #3f51b5; width: 36px; height: 36px; }
    .sp-header h1 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    .sp-header p  { margin: 0; font-size: .8rem; color: #64748b; }
    .user-chip {
      display: flex; align-items: center; gap: .5rem;
      padding: .4rem .8rem; background: #e3f2fd; border-radius: 20px;
      font-size: .85rem; color: #1565c0;
    }

    /* Not signed in */
    .not-signed-in {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1rem; color: #64748b;
    }
    .not-signed-in h2 { margin: 0; color: #0f172a; }
    .not-signed-in p  { margin: 0; }
    .big-icon { font-size: 56px !important; width: 56px !important; height: 56px !important; color: #94a3b8; }

    /* Layout */
    .sp-layout { flex: 1; display: flex; overflow: hidden; }

    /* Sites panel */
    .sites-panel {
      width: 280px; flex-shrink: 0; background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .panel-section-header {
      display: flex; align-items: center; gap: .4rem;
      padding: .55rem 1rem; font-size: .75rem; font-weight: 700;
      color: #64748b; letter-spacing: .4px; text-transform: uppercase;
      background: #f8fafc; border-bottom: 1px solid #f1f5f9;
    }
    .panel-section-header mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .panel-divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
    .search-box {
      display: flex; align-items: center; gap: .5rem;
      margin: .4rem .75rem; padding: .4rem .6rem;
      border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc;
    }
    .search-box mat-icon { font-size: 18px; color: #94a3b8; }
    .search-box input { border: 0; outline: none; background: transparent; font-size: .85rem; flex: 1; }

    .site-list { list-style: none; margin: 0; padding: 0; }
    .site-list.scrollable { overflow-y: auto; flex: 1; }
    .site-list li {
      display: flex; align-items: flex-start; gap: .75rem;
      padding: .65rem 1rem; cursor: pointer; border-bottom: 1px solid #f1f5f9;
      transition: background .1s;
    }
    .site-list li:hover   { background: #f8fafc; }
    .site-list li.active  {
      background: #e8eaf6;
      border-left: 3px solid #3f51b5;
    }
    .site-list li.empty { color: #94a3b8; font-size: .85rem; justify-content: center; cursor: default; }
    .site-name { font-size: .85rem; font-weight: 600; color: #0f172a; }
    .site-url  { font-size: .72rem; color: #94a3b8; word-break: break-all; }
    .pin-icon  { font-size: 16px; width: 16px; height: 16px; color: #3f51b5; flex-shrink: 0; margin-top: 2px; }

    /* Main area */
    .main-area {
      flex: 1; display: flex; flex-direction: column;
      overflow: hidden; padding: 1rem; gap: .75rem;
    }

    /* Drive picker */
    .drive-bar {
      display: flex; align-items: center; gap: .6rem;
      font-size: .85rem; color: #475569; background: #fff;
      border: 1px solid #e2e8f0; border-radius: 8px; padding: .5rem 1rem;
      flex-wrap: wrap;
    }
    .drive-bar select {
      border: 0; outline: none; background: transparent;
      font-size: .9rem; font-weight: 600; color: #0f172a; cursor: pointer;
    }
    .drive-url {
      margin-left: auto; font-size: .75rem; color: #94a3b8;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 340px;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: .25rem;
      font-size: .85rem; color: #475569;
    }
    .bc-item {
      cursor: pointer; padding: .2rem .4rem; border-radius: 4px;
      transition: background .1s; display: flex; align-items: center;
    }
    .bc-item:hover { background: #e2e8f0; }
    .bc-last { color: #0f172a; font-weight: 600; cursor: default; }
    .bc-last:hover { background: transparent; }
    .bc-root mat-icon { font-size: 18px; }
    .bc-sep { font-size: 18px; color: #cbd5e1; }

    /* Toolbar */
    .toolbar { display: flex; gap: .5rem; align-items: center; }

    /* File grid */
    .file-grid { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .5rem; }
    .file-card {
      display: flex; align-items: center; gap: 1rem;
      padding: .65rem 1rem; background: #fff;
      border: 1px solid #e2e8f0; border-radius: 8px; cursor: default;
      transition: box-shadow .15s;
    }
    .file-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .file-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #64748b; }
    .file-icon.folder-icon mat-icon { color: #f59e0b; }
    .file-meta { flex: 1; min-width: 0; }
    .file-name { font-size: .9rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-info { font-size: .75rem; color: #94a3b8; margin-top: .15rem; }
    .file-actions { display: flex; gap: .25rem; }

    .spinner-wrap { display: flex; justify-content: center; padding: 2rem; }
    .placeholder {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: .75rem; color: #94a3b8;
    }
    .empty-folder {
      display: flex; flex-direction: column; align-items: center;
      gap: 1rem; padding: 3rem; color: #94a3b8;
    }
    .empty-folder mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class SharepointComponent implements OnInit {
  msAuth  = inject(MsAuthService);
  private graph  = inject(GraphService);
  private snack  = inject(MatSnackBar);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ── Pinned sites ──────────────────────────────────────────────────────────
  pinnedSites   = signal<PinnedSite[]>(PINNED_SITES);
  pinnedLoading = signal(false);

  // ── Search ────────────────────────────────────────────────────────────────
  siteQuery    = '';
  sites        = signal<SharePointSite[]>([]);
  sitesLoading = signal(false);

  // ── Selected site / drive ─────────────────────────────────────────────────
  selectedSite    = signal<SharePointSite | null>(null);
  drives          = signal<Drive[]>([]);
  selectedDriveId = signal('');

  // ── Files ─────────────────────────────────────────────────────────────────
  items        = signal<DriveItem[]>([]);
  filesLoading = signal(false);
  breadcrumbs  = signal<BreadcrumbItem[]>([]);

  sortedItems = computed(() => [
    ...this.items().filter(i =>  i.folder),
    ...this.items().filter(i => !i.folder),
  ]);

  // ─────────────────────────────────────────────────────────────────────────

  signingIn = signal(false);

  ngOnInit(): void {
    if (this.msAuth.isSignedIn()) {
      // Already signed in — load immediately
      this.selectPinned(PINNED_SITES[0]);
    } else {
      // Not signed in — auto-trigger Microsoft sign-in popup
      this.signIn();
    }
  }

  async signIn(): Promise<void> {
    this.signingIn.set(true);
    try {
      await this.msAuth.signIn();
      this.selectPinned(PINNED_SITES[0]);
    } catch (e: any) {
      // user_cancelled is fine — they closed the popup intentionally
      if (e?.errorCode !== 'user_cancelled') {
        this.snack.open(
          'Microsoft sign-in failed. Click "Sign in with Microsoft" to try again.',
          'Close', { duration: 6000 }
        );
      }
    } finally {
      this.signingIn.set(false);
    }
  }

  // ── Pinned site selection ─────────────────────────────────────────────────

  async selectPinned(pinned: PinnedSite): Promise<void> {
    this.pinnedLoading.set(true);
    this.breadcrumbs.set([]);
    this.items.set([]);
    try {
      const site = await this.graph.getSiteByPath(pinned.hostname, pinned.sitePath);
      this.selectedSite.set(site);

      const ds = await this.graph.getDrives(site.id);
      this.drives.set(ds);

      // Auto-select the named library (UatAssets), fall back to first drive
      const target = ds.find(d =>
        d.name.toLowerCase() === pinned.defaultLibrary.toLowerCase()
      ) ?? ds[0];

      if (target) {
        this.selectedDriveId.set(target.id);
        await this.loadRoot();
      }
    } catch (e: any) {
      this.snack.open(
        `Could not load "${pinned.displayName}": ${e?.message ?? e}`,
        'Close', { duration: 5000 }
      );
    } finally {
      this.pinnedLoading.set(false);
    }
  }

  // ── Search site selection ─────────────────────────────────────────────────

  async searchSites(): Promise<void> {
    if (!this.siteQuery.trim()) { this.sites.set([]); return; }
    this.sitesLoading.set(true);
    try {
      this.sites.set(await this.graph.searchSites(this.siteQuery));
    } catch (e: any) {
      this.snack.open('Failed to load sites: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    } finally {
      this.sitesLoading.set(false);
    }
  }

  async selectSite(site: SharePointSite): Promise<void> {
    this.selectedSite.set(site);
    this.breadcrumbs.set([]);
    this.items.set([]);
    try {
      const ds = await this.graph.getDrives(site.id);
      this.drives.set(ds);
      if (ds.length) {
        this.selectedDriveId.set(ds[0].id);
        await this.loadRoot();
      }
    } catch (e: any) {
      this.snack.open('Failed to load drives: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    }
  }

  // ── Drive / file navigation ───────────────────────────────────────────────

  async onDriveChange(): Promise<void> {
    this.breadcrumbs.set([]);
    await this.loadRoot();
  }

  async loadRoot(): Promise<void> {
    this.filesLoading.set(true);
    try {
      this.items.set(await this.graph.getChildren(this.selectedDriveId(), 'root'));
    } catch (e: any) {
      this.snack.open('Failed to load files: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    } finally {
      this.filesLoading.set(false);
    }
  }

  async openItem(item: DriveItem): Promise<void> {
    if (!item.folder) return;
    this.breadcrumbs.update(bc => [...bc, { id: item.id, name: item.name }]);
    this.filesLoading.set(true);
    try {
      this.items.set(await this.graph.getChildren(this.selectedDriveId(), item.id));
    } catch (e: any) {
      this.snack.open('Failed to open folder: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    } finally {
      this.filesLoading.set(false);
    }
  }

  async gotoCrumb(bc: BreadcrumbItem): Promise<void> {
    const idx = this.breadcrumbs().findIndex(b => b.id === bc.id);
    this.breadcrumbs.update(bcs => bcs.slice(0, idx + 1));
    this.filesLoading.set(true);
    try {
      this.items.set(await this.graph.getChildren(this.selectedDriveId(), bc.id));
    } catch {}
    finally { this.filesLoading.set(false); }
  }

  gotoRoot(): void { this.breadcrumbs.set([]); this.loadRoot(); }

  async reload(): Promise<void> {
    const bc = this.breadcrumbs();
    if (bc.length === 0) { await this.loadRoot(); return; }
    const last = bc[bc.length - 1];
    this.filesLoading.set(true);
    try { this.items.set(await this.graph.getChildren(this.selectedDriveId(), last.id)); }
    catch {} finally { this.filesLoading.set(false); }
  }

  // ── File actions ──────────────────────────────────────────────────────────

  async download(item: DriveItem): Promise<void> {
    try {
      this.snack.open('Preparing download…', undefined, { duration: 2000 });
      await this.graph.triggerDownload(this.selectedDriveId(), item.id, item.name);
    } catch (e: any) {
      this.snack.open('Download failed: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    }
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    const bc = this.breadcrumbs();
    const folderId = bc.length ? bc[bc.length - 1].id : 'root';

    for (const file of files) {
      this.snack.open(`Uploading ${file.name}…`, undefined, { duration: 99999 });
      try {
        await this.graph.uploadFile(this.selectedDriveId(), folderId, file);
        this.snack.open(`${file.name} uploaded`, 'Close', { duration: 3000 });
      } catch (e: any) {
        this.snack.open(`Upload failed: ${e?.message ?? e}`, 'Close', { duration: 4000 });
      }
    }
    input.value = '';
    await this.reload();
  }

  async promptNewFolder(): Promise<void> {
    const name = window.prompt('New folder name:');
    if (!name?.trim()) return;
    const bc = this.breadcrumbs();
    const parentId = bc.length ? bc[bc.length - 1].id : 'root';
    try {
      await this.graph.createFolder(this.selectedDriveId(), parentId, name.trim());
      await this.reload();
    } catch (e: any) {
      this.snack.open('Failed to create folder: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    }
  }

  async deleteItem(item: DriveItem): Promise<void> {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await this.graph.deleteItem(this.selectedDriveId(), item.id);
      this.items.update(list => list.filter(i => i.id !== item.id));
      this.snack.open(`"${item.name}" deleted.`, 'Close', { duration: 3000 });
    } catch (e: any) {
      this.snack.open('Delete failed: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatSize(bytes: number | null): string {
    if (bytes === null || bytes === undefined) return '';
    if (bytes < 1024)          return `${bytes} B`;
    if (bytes < 1_048_576)     return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }

  getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      pdf: 'picture_as_pdf', doc: 'description', docx: 'description',
      xls: 'table_chart',   xlsx: 'table_chart', csv: 'table_chart',
      ppt: 'slideshow',     pptx: 'slideshow',
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', svg: 'image',
      mp4: 'videocam', mov: 'videocam', avi: 'videocam',
      mp3: 'audio_file', wav: 'audio_file',
      zip: 'archive', rar: 'archive', gz: 'archive',
      txt: 'text_snippet', md: 'text_snippet',
    };
    return map[ext] ?? 'insert_drive_file';
  }
}
