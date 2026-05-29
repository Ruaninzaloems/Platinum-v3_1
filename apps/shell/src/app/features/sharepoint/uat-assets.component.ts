import {
  Component, signal, computed, inject, effect, OnInit,
  ViewChild, ElementRef, HostListener
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { GraphService, DriveItem, Drive, SharePointSite } from '@platinumv3/shared/graph';
import { MsAuthService } from '@platinumv3/shared/auth';
import { FormsModule } from '@angular/forms';

const HOSTNAME   = 'zamicromega.sharepoint.com';
const SITE_PATH  = '/sites/Sebata2';
const LIBRARY    = 'UatAssets';

interface BreadcrumbItem { id: string; name: string; }

@Component({
  selector: 'app-uat-assets',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule,
  ],
  template: `
    <div class="page">

      <!-- ── Page header ─────────────────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/sharepoint" class="back-btn" matTooltip="Back to SharePoint">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <mat-icon class="lib-icon">folder_special</mat-icon>
          <div>
            <h1>UatAssets</h1>
            <p>{{ HOSTNAME }}/sites/Sebata2 · Document Library</p>
          </div>
        </div>
        <div class="header-right">
          @if (msAuth.msUser(); as u) {
            <div class="user-chip">
              <mat-icon>account_circle</mat-icon>
              <span>{{ u.name }}</span>
            </div>
          }
          @if (driveId()) {
            <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="uploading()">
              <mat-icon>upload_file</mat-icon>
              {{ uploading() ? 'Uploading…' : 'Upload Files' }}
            </button>
          }
          <input #fileInput type="file" multiple hidden (change)="onFilesSelected($event)">
        </div>
      </div>

      <!-- ── Not signed in ───────────────────────────────────────────────── -->
      @if (!msAuth.isSignedIn()) {
        <div class="center-state">
          @if (signingIn()) {
            <mat-spinner diameter="48"></mat-spinner>
            <h2>Opening Microsoft Sign-In…</h2>
            <p>A sign-in popup should appear. Allow popups if blocked.</p>
          } @else {
            <mat-icon class="state-icon">lock</mat-icon>
            <h2>Microsoft Sign-In Required</h2>
            <p>Click below to sign in with your Microsoft 365 account.</p>
            <button mat-raised-button color="primary" (click)="signIn()">
              <mat-icon>login</mat-icon> Sign in with Microsoft
            </button>
          }
        </div>

      <!-- ── Loading library ─────────────────────────────────────────────── -->
      } @else if (initialising()) {
        <div class="center-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading UatAssets library…</p>
        </div>

      <!-- ── Error ───────────────────────────────────────────────────────── -->
      } @else if (initError()) {
        <div class="center-state">
          <mat-icon class="state-icon error-icon">error_outline</mat-icon>
          <h2>Could not load library</h2>
          <p>{{ initError() }}</p>
          <button mat-raised-button color="primary" (click)="init()">
            <mat-icon>refresh</mat-icon> Retry
          </button>
        </div>

      <!-- ── Main content ────────────────────────────────────────────────── -->
      } @else {

        <!-- Drag-and-drop zone (only active once driveId is resolved) -->
        <div class="drop-zone"
             [class.drag-over]="dragOver() && !!driveId()"
             [class.not-ready]="!driveId()"
             (dragover)="driveId() && onDragOver($event)"
             (dragleave)="dragOver.set(false)"
             (drop)="driveId() && onDrop($event)">
          @if (!driveId()) {
            <mat-icon>hourglass_empty</mat-icon>
            <span>Loading library…</span>
          } @else if (dragOver()) {
            <mat-icon>cloud_upload</mat-icon>
            <span>Drop files to upload</span>
          } @else {
            <mat-icon>upload_file</mat-icon>
            <span>Drag &amp; drop files here, or use the <strong>Upload Files</strong> button above</span>
          }
        </div>

        <!-- Upload progress -->
        @if (uploadQueue().length > 0) {
          <div class="upload-queue">
            @for (item of uploadQueue(); track item.name) {
              <div class="upload-item">
                <mat-icon>{{ item.done ? 'check_circle' : item.error ? 'error' : 'upload' }}</mat-icon>
                <span class="uq-name">{{ item.name }}</span>
                @if (!item.done && !item.error) {
                  <mat-spinner diameter="16"></mat-spinner>
                }
                <span class="uq-status" [class.ok]="item.done" [class.err]="item.error">
                  {{ item.done ? 'Uploaded' : item.error ? item.error : 'Uploading…' }}
                </span>
              </div>
            }
          </div>
        }

        <!-- Breadcrumb -->
        <div class="breadcrumb-bar">
          <span class="bc-root" (click)="gotoRoot()">
            <mat-icon>home</mat-icon> UatAssets
          </span>
          @for (bc of breadcrumbs(); track bc.id; let last = $last) {
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span class="bc-item" [class.bc-last]="last"
                  (click)="!last && gotoCrumb(bc)">{{ bc.name }}</span>
          }
        </div>

        <!-- Toolbar -->
        <div class="list-toolbar">
          <div class="file-count">
            @if (filesLoading()) {
              <mat-spinner diameter="16"></mat-spinner> Loading…
            } @else {
              {{ sortedItems().length }} item{{ sortedItems().length !== 1 ? 's' : '' }}
            }
          </div>
          <button mat-icon-button matTooltip="New folder" (click)="promptNewFolder()">
            <mat-icon>create_new_folder</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Refresh" (click)="reload()" [disabled]="filesLoading()">
            <mat-icon>refresh</mat-icon>
          </button>
          <!-- Search -->
          <div class="search-wrap">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Filter files…"
                   [ngModel]="filterText()" (ngModelChange)="onFilterChange($event)">
            @if (filterText()) {
              <button mat-icon-button (click)="onFilterChange('')" style="height:24px;width:24px;line-height:24px">
                <mat-icon style="font-size:16px">close</mat-icon>
              </button>
            }
          </div>
        </div>

        <!-- File list -->
        @if (filesLoading()) {
          <div class="center-state" style="flex:1">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (filteredItems().length === 0) {
          <div class="center-state" style="flex:1">
            <mat-icon class="state-icon">folder_open</mat-icon>
            <p>{{ filterText() ? 'No files match your filter' : 'This folder is empty' }}</p>
            @if (!filterText()) {
              <button mat-stroked-button (click)="fileInput.click()">Upload the first file</button>
            }
          </div>
        } @else {
          <div class="list-container">
            <!-- Header row -->
            <div class="list-row header-row">
              <div class="col-icon"></div>
              <div class="col-name">Name</div>
              <div class="col-size">Size</div>
              <div class="col-modified">Modified</div>
              <div class="col-actions"></div>
            </div>

            <!-- Data rows -->
            @for (item of pagedItems(); track item.id) {
              <div class="list-row" [class.folder-row]="item.folder"
                   (dblclick)="openItem(item)">
                <div class="col-icon">
                  <mat-icon [class.folder-color]="item.folder"
                            [class.file-color]="!item.folder">
                    {{ item.folder ? 'folder' : getFileIcon(item.name) }}
                  </mat-icon>
                </div>
                <div class="col-name">
                  <span class="item-name" [matTooltip]="item.name">{{ item.name }}</span>
                  @if (item.folder) {
                    <span class="folder-count">{{ item.folder.childCount }} items</span>
                  } @else {
                    <span class="file-ext">{{ getExt(item.name) }}</span>
                  }
                </div>
                <div class="col-size">
                  {{ item.folder ? '—' : formatSize(item.size) }}
                </div>
                <div class="col-modified">
                  {{ item.lastModifiedDateTime | date:'dd MMM yyyy HH:mm' }}
                </div>
                <div class="col-actions">
                  <button mat-icon-button class="kebab-btn" matTooltip="Actions"
                          [matMenuTriggerFor]="rowMenu"
                          (click)="$event.stopPropagation()">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #rowMenu="matMenu" class="row-actions-menu" xPosition="before">
                    @if (item.folder) {
                      <button mat-menu-item (click)="openItem(item)">
                        <mat-icon>folder_open</mat-icon>
                        <span>Open folder</span>
                      </button>
                    } @else {
                      <button mat-menu-item (click)="openInBrowser(item)">
                        <mat-icon>open_in_new</mat-icon>
                        <span>Open in SharePoint</span>
                      </button>
                      <button mat-menu-item (click)="download(item)">
                        <mat-icon>download</mat-icon>
                        <span>Download</span>
                      </button>
                    }
                    <button mat-menu-item class="menu-danger" (click)="deleteItem(item)">
                      <mat-icon>delete_outline</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          <div class="pagination-bar">
            <div class="page-size">
              <label>Per page:</label>
              <select [ngModel]="pageSize()" (ngModelChange)="setPageSize(+$event)">
                @for (opt of pageSizeOptions; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </div>
            <div class="page-nav">
              <button mat-icon-button matTooltip="First page"
                      [disabled]="currentPage() === 1" (click)="firstPage()">
                <mat-icon>first_page</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Previous page"
                      [disabled]="currentPage() === 1" (click)="prevPage()">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
              <button mat-icon-button matTooltip="Next page"
                      [disabled]="currentPage() >= totalPages()" (click)="nextPage()">
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Last page"
                      [disabled]="currentPage() >= totalPages()" (click)="lastPage()">
                <mat-icon>last_page</mat-icon>
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .page {
      height: 100%; display: flex; flex-direction: column;
      background: #f8fafc; gap: 0;
    }

    /* ── Header ─────────────────────────────────────────────────────────── */
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1.5rem; background: #fff;
      border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
    }
    .header-left  { display: flex; align-items: center; gap: .75rem; }
    .header-right { display: flex; align-items: center; gap: .75rem; }
    .back-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      color: #475569; text-decoration: none; transition: background .15s;
    }
    .back-btn:hover { background: #f1f5f9; }
    .lib-icon { font-size: 32px; width: 32px; height: 32px; color: #3f51b5; }
    .page-header h1 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a; }
    .page-header p  { margin: 0; font-size: .75rem; color: #64748b; }
    .user-chip {
      display: flex; align-items: center; gap: .4rem;
      padding: .35rem .75rem; background: #e3f2fd; border-radius: 20px;
      font-size: .82rem; color: #1565c0;
    }

    /* ── Centre states ───────────────────────────────────────────────────── */
    .center-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1rem; padding: 3rem; color: #64748b;
      flex: 1;
    }
    .center-state h2 { margin: 0; color: #0f172a; font-size: 1.1rem; }
    .center-state p  { margin: 0; text-align: center; }
    .state-icon { font-size: 52px !important; width: 52px !important; height: 52px !important; color: #cbd5e1; }
    .error-icon { color: #fca5a5 !important; }

    /* ── Drop zone ───────────────────────────────────────────────────────── */
    .drop-zone {
      display: flex; align-items: center; justify-content: center; gap: .6rem;
      margin: 1rem 1.5rem .25rem; padding: .75rem 1.5rem;
      border: 2px dashed #cbd5e1; border-radius: 10px;
      color: #94a3b8; font-size: .875rem; cursor: default;
      transition: border-color .15s, background .15s; flex-shrink: 0;
    }
    .drop-zone mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .drop-zone.drag-over {
      border-color: #3f51b5; background: #e8eaf6; color: #3f51b5;
    }
    .drop-zone.not-ready {
      opacity: .5; cursor: not-allowed;
    }

    /* ── Upload queue ────────────────────────────────────────────────────── */
    .upload-queue {
      margin: .5rem 1.5rem; background: #fff;
      border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; flex-shrink: 0;
    }
    .upload-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .5rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: .85rem;
    }
    .upload-item:last-child { border-bottom: 0; }
    .uq-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .uq-status { font-size: .78rem; }
    .uq-status.ok  { color: #16a34a; }
    .uq-status.err { color: #dc2626; }

    /* ── Breadcrumb ──────────────────────────────────────────────────────── */
    .breadcrumb-bar {
      display: flex; align-items: center; gap: .25rem; flex-wrap: wrap;
      padding: .5rem 1.5rem; font-size: .85rem; color: #475569; flex-shrink: 0;
    }
    .bc-root {
      display: flex; align-items: center; gap: .25rem;
      cursor: pointer; padding: .2rem .4rem; border-radius: 4px;
      transition: background .1s; font-weight: 600;
    }
    .bc-root:hover { background: #e2e8f0; }
    .bc-root mat-icon { font-size: 18px; }
    .bc-item {
      cursor: pointer; padding: .2rem .4rem; border-radius: 4px;
      transition: background .1s;
    }
    .bc-item:hover { background: #e2e8f0; }
    .bc-last { color: #0f172a; font-weight: 600; cursor: default; }
    .bc-last:hover { background: transparent; }
    .bc-sep { font-size: 18px; color: #cbd5e1; }

    /* ── Toolbar ─────────────────────────────────────────────────────────── */
    .list-toolbar {
      display: flex; align-items: center; gap: .5rem;
      padding: .25rem 1.5rem .5rem; flex-shrink: 0;
    }
    .file-count {
      display: flex; align-items: center; gap: .4rem;
      font-size: .82rem; color: #64748b; margin-right: auto;
    }
    .search-wrap {
      display: flex; align-items: center; gap: .4rem;
      padding: .3rem .6rem; border: 1px solid #e2e8f0; border-radius: 6px;
      background: #fff; font-size: .85rem;
    }
    .search-wrap mat-icon { font-size: 18px; color: #94a3b8; }
    .search-wrap input { border: 0; outline: none; background: transparent; width: 160px; font-size: .85rem; }

    /* ── File list ───────────────────────────────────────────────────────── */
    .list-container {
      flex: 1; overflow-y: auto; margin: 0 1.5rem 1rem;
      border: 1px solid #e2e8f0; border-radius: 10px;
      background: #fff; display: flex; flex-direction: column;
    }
    .list-row {
      display: grid;
      grid-template-columns: 40px 1fr 90px 160px 130px;
      align-items: center; border-bottom: 1px solid #f1f5f9;
      padding: 0 .5rem; min-height: 46px;
    }
    .list-row:last-child { border-bottom: 0; }
    .header-row {
      background: #f8fafc; font-size: .75rem; font-weight: 700;
      color: #64748b; letter-spacing: .3px; text-transform: uppercase;
      border-radius: 10px 10px 0 0; min-height: 36px;
    }
    .list-row:not(.header-row):hover { background: #f8fafc; }
    .list-row.folder-row { cursor: pointer; }

    .col-icon { display: flex; align-items: center; justify-content: center; }
    .col-name { display: flex; flex-direction: column; gap: 1px; overflow: hidden; padding: .4rem 0; }
    .col-size { font-size: .82rem; color: #64748b; }
    .col-modified { font-size: .82rem; color: #64748b; }
    .col-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0; }

    .item-name {
      font-size: .875rem; font-weight: 600; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .folder-count { font-size: .72rem; color: #94a3b8; }
    .file-ext {
      font-size: .7rem; color: #94a3b8; text-transform: uppercase;
      letter-spacing: .3px;
    }
    .folder-color { color: #f59e0b !important; font-size: 22px; }
    .file-color   { color: #3f51b5 !important; font-size: 22px; }
    .kebab-btn { color: #64748b; }

    /* ── Pagination ──────────────────────────────────────────────────────── */
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap;
      margin: 0 1.5rem 1rem; padding: .5rem .75rem;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
      flex-shrink: 0;
    }
    .page-size {
      display: flex; align-items: center; gap: .5rem;
      font-size: .82rem; color: #64748b;
    }
    .page-size select {
      padding: .3rem 1.6rem .3rem .6rem; border: 1px solid #cbd5e1;
      border-radius: 6px; background: #fff; font-size: .82rem; color: #0f172a;
      cursor: pointer; outline: none;
    }
    .page-size select:focus { border-color: #3f51b5; }
    .page-nav { display: flex; align-items: center; gap: .15rem; }
    .page-info {
      font-size: .85rem; color: #334155; font-weight: 600;
      padding: 0 .75rem; white-space: nowrap;
    }

    /* ── Row actions menu ────────────────────────────────────────────────── */
    .menu-danger { color: #dc2626; }
    .menu-danger mat-icon { color: #dc2626; }
  `]
})
export class UatAssetsComponent implements OnInit {
  readonly HOSTNAME = HOSTNAME;

  msAuth  = inject(MsAuthService);
  private graph = inject(GraphService);
  private snack = inject(MatSnackBar);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ── State ─────────────────────────────────────────────────────────────────
  signingIn   = signal(false);
  initialising = signal(false);
  initError   = signal('');

  driveId     = signal('');
  items       = signal<DriveItem[]>([]);
  filesLoading = signal(false);
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  dragOver    = signal(false);
  uploading   = signal(false);
  filterText  = signal('');

  // ── Pagination ──────────────────────────────────────────────────────────
  pageSizeOptions = [10, 25, 50, 100];
  pageSize    = signal(10);
  currentPage = signal(1);

  uploadQueue = signal<{ name: string; done: boolean; error: string }[]>([]);

  sortedItems = computed(() => [
    ...this.items().filter(i =>  i.folder),
    ...this.items().filter(i => !i.folder),
  ]);

  filteredItems = computed(() => {
    const q = this.filterText().toLowerCase().trim();
    return q ? this.sortedItems().filter(i => i.name.toLowerCase().includes(q)) : this.sortedItems();
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize())));

  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredItems().slice(start, start + this.pageSize());
  });

  constructor() {
    // Keep current page within bounds when the result set shrinks
    effect(() => {
      const tp = this.totalPages();
      if (this.currentPage() > tp) this.currentPage.set(tp);
    });
  }

  // ── Pagination controls ───────────────────────────────────────────────────
  onFilterChange(value: string): void {
    this.filterText.set(value);
    this.currentPage.set(1);
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  firstPage(): void { this.currentPage.set(1); }
  prevPage():  void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage():  void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }
  lastPage():  void { this.currentPage.set(this.totalPages()); }

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (this.msAuth.isSignedIn()) {
      this.init();
    } else {
      this.signIn();
    }
  }

  async signIn(): Promise<void> {
    this.signingIn.set(true);
    try {
      await this.msAuth.signIn();
      await this.init();
    } catch (e: any) {
      if (e?.errorCode !== 'user_cancelled') {
        this.snack.open('Microsoft sign-in failed. Click "Sign in with Microsoft" to try again.', 'Close', { duration: 6000 });
      }
    } finally {
      this.signingIn.set(false);
    }
  }

  async init(): Promise<void> {
    this.initialising.set(true);
    this.initError.set('');
    try {
      console.log('[UatAssets] Resolving site:', HOSTNAME, SITE_PATH);
      const site   = await this.graph.getSiteByPath(HOSTNAME, SITE_PATH);
      console.log('[UatAssets] Site ID:', site.id);

      const drives = await this.graph.getDrives(site.id);
      console.log('[UatAssets] Drives:', drives.map(d => ({ name: d.name, id: d.id })));

      const drive  = drives.find(d => d.name.toLowerCase() === LIBRARY.toLowerCase()) ?? drives[0];
      if (!drive) throw new Error(`Library "${LIBRARY}" not found. Available: ${drives.map(d => d.name).join(', ')}`);

      console.log('[UatAssets] Using drive:', drive.name, drive.id);
      this.driveId.set(drive.id);
      await this.loadFolder('root');
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.error('[UatAssets] init error:', msg, e);
      this.initError.set(msg);
    } finally {
      this.initialising.set(false);
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async loadFolder(folderId: string): Promise<void> {
    this.filesLoading.set(true);
    this.currentPage.set(1);
    try {
      this.items.set(await this.graph.getChildren(this.driveId(), folderId));
    } catch (e: any) {
      const body    = (e as any)?.error;
      const graphMsg = body?.error?.message ?? body?.message ?? null;
      const msg = graphMsg
        ? `Graph API: ${graphMsg}`
        : (e?.message ?? String(e));
      console.error('[UatAssets] loadFolder error:', msg, e);
      this.snack.open('Failed to load files: ' + msg, 'Close', { duration: 6000 });
    } finally {
      this.filesLoading.set(false);
    }
  }

  async openItem(item: DriveItem): Promise<void> {
    if (!item.folder) return;
    this.breadcrumbs.update(bc => [...bc, { id: item.id, name: item.name }]);
    await this.loadFolder(item.id);
  }

  async gotoCrumb(bc: BreadcrumbItem): Promise<void> {
    const idx = this.breadcrumbs().findIndex(b => b.id === bc.id);
    this.breadcrumbs.update(bcs => bcs.slice(0, idx + 1));
    await this.loadFolder(bc.id);
  }

  gotoRoot(): void {
    this.breadcrumbs.set([]);
    this.loadFolder('root');
  }

  async reload(): Promise<void> {
    const bc = this.breadcrumbs();
    await this.loadFolder(bc.length ? bc[bc.length - 1].id : 'root');
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(true);
  }

  async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) await this.uploadFiles(files);
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) await this.uploadFiles(files);
  }

  private async uploadFiles(files: File[]): Promise<void> {
    if (!this.driveId()) {
      this.snack.open('Library not ready — please wait for it to finish loading.', 'Close', { duration: 4000 });
      return;
    }

    const bc       = this.breadcrumbs();
    const folderId = bc.length ? bc[bc.length - 1].id : 'root';

    console.log('[UatAssets] uploadFiles — driveId:', this.driveId(), 'folderId:', folderId);

    this.uploading.set(true);
    this.uploadQueue.set(files.map(f => ({ name: f.name, done: false, error: '' })));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await this.graph.uploadFile(this.driveId(), folderId, file);
        this.uploadQueue.update(q => q.map((item, idx) =>
          idx === i ? { ...item, done: true } : item
        ));
      } catch (e: any) {
        this.uploadQueue.update(q => q.map((item, idx) =>
          idx === i ? { ...item, error: e?.message ?? 'Upload failed' } : item
        ));
      }
    }

    this.uploading.set(false);
    await this.reload();

    // Clear queue after 4 s
    setTimeout(() => this.uploadQueue.set([]), 4000);
  }

  // ── File actions ──────────────────────────────────────────────────────────

  async download(item: DriveItem): Promise<void> {
    try {
      this.snack.open('Preparing download…', undefined, { duration: 2000 });
      await this.graph.triggerDownload(this.driveId(), item.id, item.name);
    } catch (e: any) {
      this.snack.open('Download failed: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    }
  }

  openInBrowser(item: DriveItem): void {
    window.open(item.webUrl, '_blank');
  }

  async promptNewFolder(): Promise<void> {
    const name = window.prompt('New folder name:');
    if (!name?.trim()) return;
    const bc       = this.breadcrumbs();
    const parentId = bc.length ? bc[bc.length - 1].id : 'root';
    try {
      await this.graph.createFolder(this.driveId(), parentId, name.trim());
      await this.reload();
    } catch (e: any) {
      this.snack.open('Failed to create folder: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    }
  }

  async deleteItem(item: DriveItem): Promise<void> {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await this.graph.deleteItem(this.driveId(), item.id);
      this.items.update(list => list.filter(i => i.id !== item.id));
      this.snack.open(`"${item.name}" deleted.`, 'Close', { duration: 3000 });
    } catch (e: any) {
      this.snack.open('Delete failed: ' + (e?.message ?? e), 'Close', { duration: 4000 });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getExt(name: string): string {
    return name.split('.').pop()?.toUpperCase() ?? '';
  }

  formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024)          return `${bytes} B`;
    if (bytes < 1_048_576)     return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }

  getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      pdf : 'picture_as_pdf',
      doc : 'description', docx: 'description',
      xls : 'table_chart',  xlsx: 'table_chart', csv: 'table_chart',
      ppt : 'slideshow',    pptx: 'slideshow',
      jpg : 'image', jpeg: 'image', png: 'image', gif: 'image', svg: 'image',
      mp4 : 'videocam', mov: 'videocam', avi: 'videocam',
      mp3 : 'audio_file', wav: 'audio_file',
      zip : 'archive', rar: 'archive', gz: 'archive',
      txt : 'text_snippet', md: 'text_snippet',
    };
    return map[ext] ?? 'insert_drive_file';
  }
}
