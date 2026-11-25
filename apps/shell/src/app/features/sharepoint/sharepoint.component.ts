import {
  Component, signal, computed, inject, OnInit, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GraphService, SharePointSite, Drive, DriveItem, DocumentHit, ListColumn } from '@platinumv3/shared/graph';
import { MsAuthService } from '@platinumv3/shared/auth';
import { PinnedLibrariesService } from './pinned-libraries.service';

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

type EditColumnType = 'text' | 'note' | 'choice' | 'boolean' | 'number' | 'dateTime';
interface EditColumn {
  name        : string;   // SharePoint internal name (used for read/write)
  displayName : string;
  type        : EditColumnType;
  choices    ?: string[];
}

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

          </aside>

          <!-- ── Main area ─────────────────────────────────────────────── -->
          <main class="main-area">

            <!-- Document search (searches FILES across all libraries, not sites) -->
            <div class="doc-search">
              <mat-icon class="ds-icon">search</mat-icon>
              <input type="text" class="ds-input"
                     placeholder="Search documents across all libraries…"
                     [ngModel]="docQuery()" (ngModelChange)="onDocQueryChange($event)"
                     (keydown.enter)="runDocSearch()">
              <select class="ds-scope" [ngModel]="docScope()" (ngModelChange)="onDocScopeChange($event)"
                      aria-label="Search scope">
                @if (selectedSite() && selectedDrive()) {
                  <option value="library">This library ({{ selectedDrive()?.name }})</option>
                }
                @if (selectedSite()) {
                  <option value="site">This site — all libraries ({{ selectedSite()?.displayName || selectedSite()?.name }})</option>
                }
                <option value="all">All sites</option>
              </select>
              @if (docQuery()) {
                <button mat-icon-button (click)="clearDocSearch()" matTooltip="Clear search">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>

            @if (docSearchActive()) {
              <!-- ── Search results ─────────────────────────────────────── -->
              @if (docSearching()) {
                <div class="spinner-wrap"><mat-spinner diameter="40"></mat-spinner></div>
              } @else {
                <div class="ds-summary">
                  {{ docResults().length }} result{{ docResults().length === 1 ? '' : 's' }}
                  for “{{ docQueryRan() }}” in
                  {{ docScopeRan() === 'library' ? 'this library' : docScopeRan() === 'site' ? 'this site' : 'all sites' }}
                  @if (docResults().length >= 50) { <span> (showing the first 50 — refine your search)</span> }
                </div>
                <div class="file-grid">
                  @for (hit of docResults(); track hit.driveId + hit.id) {
                    <div class="file-card" (dblclick)="openHit(hit)"
                         [matTooltip]="hit.name + ' — ' + formatSize(hit.size)">
                      <div class="file-icon"><mat-icon>{{ getFileIcon(hit.name) }}</mat-icon></div>
                      <div class="file-meta">
                        <div class="file-name">{{ hit.name }}</div>
                        <div class="file-info">
                          {{ formatSize(hit.size) }} · {{ hit.lastModifiedDateTime | date:'dd MMM yyyy' }}
                          @if (!hit.nameMatch) { · <em>content match</em> }
                        </div>
                        <div class="file-loc">{{ hit.location }}</div>
                      </div>
                      <div class="file-actions">
                        <button mat-icon-button matTooltip="Open in SharePoint"
                                (click)="openHit(hit); $event.stopPropagation()">
                          <mat-icon>open_in_new</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Download"
                                (click)="downloadHit(hit); $event.stopPropagation()">
                          <mat-icon>download</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                  @if (docResults().length === 0) {
                    <div class="empty-folder">
                      <mat-icon>search_off</mat-icon>
                      <p>No documents found for “{{ docQueryRan() }}”.</p>
                      <p class="ds-hint">Search matches the start of words (e.g. “screen” finds “Screenshot…”). Newly uploaded files can take a few minutes to appear.</p>
                    </div>
                  }
                </div>
              }
            } @else {

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
                <button class="pin-lib" [class.on]="isLibraryPinned()"
                        [matTooltip]="isLibraryPinned() ? 'Remove from Pinned Libraries' : 'Pin this library to the sidebar'"
                        (click)="togglePinLibrary()">
                  <mat-icon>push_pin</mat-icon> {{ isLibraryPinned() ? 'Pinned' : 'Pin library' }}
                </button>
                <span class="drive-url">{{ selectedSite()?.webUrl }}</span>
              </div>
            }

            <!-- Shared hidden file picker: used by the toolbar Upload and the empty-folder Upload buttons -->
            <input #fileInput type="file" multiple hidden (change)="onFilesSelected($event)">

            <!-- Edit dialog: rename + the library's editable metadata columns -->
            @if (editOpen()) {
              <div class="modal-backdrop" (click)="closeEdit()">
                <div class="modal" (click)="$event.stopPropagation()">
                  <div class="modal-head">
                    <h2>Edit {{ editItem()?.folder ? 'folder' : 'document' }}</h2>
                    <button mat-icon-button (click)="closeEdit()"><mat-icon>close</mat-icon></button>
                  </div>
                  <div class="modal-body">
                    <div class="field">
                      <label>Name</label>
                      <input type="text" [ngModel]="editName()" (ngModelChange)="editName.set($event)">
                      <small class="hint">Renaming changes the item's URL in SharePoint.</small>
                    </div>
                    @if (editLoading()) {
                      <div class="meta-loading"><mat-spinner diameter="20"></mat-spinner> Loading details…</div>
                    }
                    @for (col of editColumns(); track col.name) {
                      <div class="field">
                        <label>{{ col.displayName }}</label>
                        @switch (col.type) {
                          @case ('choice') {
                            <select [ngModel]="editValues()[col.name]" (ngModelChange)="setEditValue(col.name, $event)">
                              <option value="">— None —</option>
                              @for (c of col.choices; track c) { <option [value]="c">{{ c }}</option> }
                            </select>
                          }
                          @case ('note') {
                            <textarea rows="3" [ngModel]="editValues()[col.name]"
                                      (ngModelChange)="setEditValue(col.name, $event)"></textarea>
                          }
                          @case ('boolean') {
                            <label class="check">
                              <input type="checkbox" [ngModel]="!!editValues()[col.name]"
                                     (ngModelChange)="setEditValue(col.name, $event)"> Yes
                            </label>
                          }
                          @case ('number') {
                            <input type="number" [ngModel]="editValues()[col.name]"
                                   (ngModelChange)="setEditValue(col.name, $event)">
                          }
                          @case ('dateTime') {
                            <input type="date" [ngModel]="editValues()[col.name]"
                                   (ngModelChange)="setEditValue(col.name, $event)">
                          }
                          @default {
                            <input type="text" [ngModel]="editValues()[col.name]"
                                   (ngModelChange)="setEditValue(col.name, $event)">
                          }
                        }
                      </div>
                    }
                  </div>
                  <div class="modal-foot">
                    <button mat-stroked-button (click)="closeEdit()" [disabled]="editSaving()">Cancel</button>
                    <button mat-raised-button color="primary" (click)="saveEdit()"
                            [disabled]="editSaving() || !editName().trim()">
                      {{ editSaving() ? 'Saving…' : 'Save changes' }}
                    </button>
                  </div>
                </div>
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
                  <div class="file-card" [class.is-folder]="!!item.folder" (click)="item.folder && openItem(item)"
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
                        · Modified {{ timeAgo(item.lastModifiedDateTime) }}
                        @if (item.lastModifiedBy?.user?.displayName) {
                          · Modified by {{ item.lastModifiedBy?.user?.displayName }}
                        }
                      </div>
                    </div>
                    <div class="file-actions">
                      <button mat-icon-button matTooltip="Edit (rename / details)"
                              (click)="openEdit(item); $event.stopPropagation()">
                        <mat-icon>edit</mat-icon>
                      </button>
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
                    <button mat-raised-button color="primary" (click)="fileInput.click()">
                      <mat-icon>upload</mat-icon> Upload a file
                    </button>
                  </div>
                }
              </div>
            }

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
    .file-card.is-folder { cursor: pointer; }
    .file-card.is-folder:hover { border-color: #93c5fd; background: #f8fbff; }
    .file-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #64748b; }
    .file-icon.folder-icon mat-icon { color: #f59e0b; }
    .file-meta { flex: 1; min-width: 0; }
    .file-name { font-size: .9rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-info { font-size: .75rem; color: #94a3b8; margin-top: .15rem; }
    .file-actions { display: flex; gap: .25rem; }
    .pin-lib {
      display: inline-flex; align-items: center; gap: .25rem; margin-left: .5rem;
      padding: .25rem .65rem; border: 1px solid #cbd5e1; border-radius: 999px;
      background: #fff; color: #475569; font-size: .8rem; cursor: pointer;
    }
    .pin-lib mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .pin-lib:hover { background: #eef2ff; border-color: #3f51b5; color: #3f51b5; }
    .pin-lib.on { background: #e0e7ff; border-color: #3f51b5; color: #3f51b5; font-weight: 600; }
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15, 23, 42, .45);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal {
      width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
      background: #fff; border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, .25);
      display: flex; flex-direction: column;
    }
    .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.5rem .5rem; }
    .modal-head h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a; }
    .modal-body { padding: .5rem 1.5rem 1rem; display: flex; flex-direction: column; gap: 1.1rem; }
    .field { display: flex; flex-direction: column; gap: .35rem; }
    .field label { font-size: .85rem; font-weight: 700; color: #0f172a; }
    .field input, .field textarea, .field select {
      width: 100%; box-sizing: border-box; padding: .55rem .7rem;
      border: 1px solid #cbd5e1; border-radius: 8px; font-size: .9rem;
      color: #0f172a; background: #fff; outline: none; font-family: inherit;
    }
    .field input:focus, .field textarea:focus, .field select:focus { border-color: #3f51b5; }
    .field textarea { resize: vertical; min-height: 70px; }
    .field .hint { font-size: .75rem; color: #94a3b8; }
    .field .check { flex-direction: row; align-items: center; gap: .5rem; font-weight: 500; font-size: .9rem; color: #0f172a; }
    .field .check input { width: auto; }
    .meta-loading { display: flex; align-items: center; gap: .6rem; font-size: .85rem; color: #64748b; }
    .modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: .6rem; padding: .75rem 1.5rem 1.25rem; }

    /* Document search */
    .doc-search {
      display: flex; align-items: center; gap: .5rem;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: .35rem .5rem .35rem .8rem;
    }
    .doc-search:focus-within { border-color: #3f51b5; box-shadow: 0 0 0 2px rgba(63,81,181,.15); }
    .ds-icon { color: #94a3b8; }
    .ds-input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: .95rem; padding: .35rem 0; }
    .ds-scope {
      border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc;
      font-size: .8rem; padding: .3rem .4rem; color: #334155; max-width: 240px;
    }
    .search-docs-link { color: #3f51b5; cursor: pointer; text-align: left; align-items: center; gap: .4rem; }
    .search-docs-link:hover { background: #eef2ff; }
    .search-docs-link mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .ds-summary { font-size: .85rem; color: #475569; }
    .ds-hint { font-size: .8rem; max-width: 460px; text-align: center; margin: 0; }
    .file-loc { font-size: .72rem; color: #64748b; margin-top: .1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
  private route  = inject(ActivatedRoute);
  pinnedLibs = inject(PinnedLibrariesService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ── Pinned sites ──────────────────────────────────────────────────────────
  pinnedSites   = signal<PinnedSite[]>(PINNED_SITES);
  pinnedLoading = signal(false);

  // ── Document search (files across all libraries) ──────────────────────────
  docQuery      = signal('');
  docScope      = signal<'library' | 'site' | 'all'>('site');
  docSearching  = signal(false);
  docResults    = signal<DocumentHit[]>([]);
  docQueryRan   = signal('');
  docScopeRan   = signal<'library' | 'site' | 'all'>('site');
  /** The document library currently open in the picker (for the "This library" scope). */
  selectedDrive = computed(() => this.drives().find(d => d.id === this.selectedDriveId()) ?? null);
  /** True while a (non-blank) document search is shown instead of the folder view. */
  docSearchActive = computed(() => this.docQuery().trim().length >= 2);
  private docTimer: ReturnType<typeof setTimeout> | null = null;
  private docSeq = 0;

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
    // Re-runs whenever the sidebar navigates here with a different pinned library (?site=&library=).
    this.route.queryParamMap.subscribe(() => {
      if (this.msAuth.isSignedIn()) {
        // Already signed in — load immediately
        this.loadFromRoute();
      } else if (!this.signingIn()) {
        // Not signed in — auto-trigger Microsoft sign-in popup
        this.signIn();
      }
    });
  }

  /** Open the pinned library named in the URL, or the default pinned site when none is given. */
  private loadFromRoute(): void {
    const q = this.route.snapshot.queryParamMap;
    const sitePath = q.get('site');
    const library = q.get('library');
    if (sitePath && library) {
      const host = q.get('host') || PINNED_SITES[0].hostname;
      this.selectPinned({
        hostname: host, sitePath, displayName: q.get('name') || sitePath, defaultLibrary: library,
      });
    } else {
      this.selectPinned(PINNED_SITES[0]);
    }
  }

  async signIn(): Promise<void> {
    this.signingIn.set(true);
    try {
      await this.msAuth.signIn();
      this.loadFromRoute();
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

  // ── Document search ───────────────────────────────────────────────────────

  onDocQueryChange(value: string): void {
    this.docQuery.set(value ?? '');
    if (this.docTimer) clearTimeout(this.docTimer);
    if (!this.docSearchActive()) { this.docSeq++; this.docResults.set([]); this.docSearching.set(false); return; }
    this.docSearching.set(true);
    this.docTimer = setTimeout(() => this.runDocSearch(), 450); // debounce while typing
  }

  onDocScopeChange(scope: 'library' | 'site' | 'all'): void {
    this.docScope.set(scope);
    if (this.docSearchActive()) this.runDocSearch();
  }

  async runDocSearch(): Promise<void> {
    if (this.docTimer) { clearTimeout(this.docTimer); this.docTimer = null; }
    const q = this.docQuery().trim();
    if (q.length < 2) return;
    // Narrow scopes only make sense once a site/library is selected; otherwise search everything.
    let scope: 'library' | 'site' | 'all' = this.docScope();
    if (scope === 'library' && !this.selectedDrive()) scope = this.selectedSite() ? 'site' : 'all';
    if (scope === 'site' && !this.selectedSite()) scope = 'all';
    const scopeUrl = scope === 'library' ? this.selectedDrive()!.webUrl
                   : scope === 'site' ? this.selectedSite()!.webUrl
                   : null;
    const seq = ++this.docSeq; // ignore out-of-order responses from earlier keystrokes
    this.docSearching.set(true);
    try {
      // The search index lags a few minutes behind new uploads, so for a library/site scope also
      // walk the folders live and merge the two result sets (live hits first, de-duplicated).
      let indexError: any = null;
      const [indexHits, liveHits] = await Promise.all([
        this.graph.searchDocuments(q, scopeUrl).catch(e => { indexError = e; return [] as DocumentHit[]; }),
        this.liveSearch(q, scope),
      ]);
      if (seq !== this.docSeq) return;
      const seen = new Set<string>();
      const merged = [...liveHits, ...indexHits].filter(h => {
        const key = `${h.driveId}|${h.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const ordered = merged
        .map((h, i) => ({ h, i }))
        .sort((a, b) => Number(b.h.nameMatch) - Number(a.h.nameMatch) || a.i - b.i)
        .map(x => x.h);
      this.docResults.set(ordered);
      this.docQueryRan.set(q);
      this.docScopeRan.set(scope);
      if (indexError && ordered.length === 0) {
        this.snack.open(indexError?.message ?? 'Document search failed', 'Close', { duration: 6000 });
      }
    } catch (e: any) {
      if (seq !== this.docSeq) return;
      this.docResults.set([]);
      this.docQueryRan.set(q);
      this.docScopeRan.set(scope);
      this.snack.open(e?.message ?? 'Document search failed', 'Close', { duration: 6000 });
    } finally {
      if (seq === this.docSeq) this.docSearching.set(false);
    }
  }

  /** Live (index-free) name search for the library or site in scope; empty for "all sites". */
  private async liveSearch(q: string, scope: 'library' | 'site' | 'all'): Promise<DocumentHit[]> {
    try {
      if (scope === 'library') {
        const id = this.selectedDriveId();
        return id ? (await this.graph.searchDriveByName(id, q)).hits : [];
      }
      if (scope === 'site') {
        const ids = this.drives().map(d => d.id);
        const results = await Promise.all(ids.map(id => this.graph.searchDriveByName(id, q)));
        return results.flatMap(r => r.hits);
      }
    } catch {
      /* fall back to the index results */
    }
    return [];
  }

  clearDocSearch(): void {
    this.docSeq++;
    if (this.docTimer) { clearTimeout(this.docTimer); this.docTimer = null; }
    this.docQuery.set('');
    this.docResults.set([]);
    this.docSearching.set(false);
  }

  openHit(hit: DocumentHit): void {
    if (hit.webUrl) window.open(hit.webUrl, '_blank', 'noopener');
  }

  async downloadHit(hit: DocumentHit): Promise<void> {
    try {
      this.snack.open('Preparing download…', undefined, { duration: 2000 });
      await this.graph.triggerDownload(hit.driveId, hit.id, hit.name);
    } catch (e: any) {
      this.snack.open('Download failed: ' + (e?.message ?? e), 'Close', { duration: 4000 });
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

  // ── Pin library ───────────────────────────────────────────────────────────

  /** Host + site path of the open site, derived from its web URL. */
  private currentSiteRef(): { hostname: string; sitePath: string; siteName: string } | null {
    const site = this.selectedSite();
    if (!site?.webUrl) return null;
    try {
      const u = new URL(site.webUrl);
      return {
        hostname: u.hostname,
        sitePath: u.pathname.replace(/\/+$/, ''),
        siteName: site.displayName || site.name || u.pathname.split('/').filter(Boolean).pop() || 'Site',
      };
    } catch {
      return null;
    }
  }

  isLibraryPinned(): boolean {
    const ref = this.currentSiteRef();
    const lib = this.selectedDrive();
    return !!ref && !!lib && this.pinnedLibs.isPinned(ref.hostname, ref.sitePath, lib.name);
  }

  togglePinLibrary(): void {
    const ref = this.currentSiteRef();
    const lib = this.selectedDrive();
    if (!ref || !lib) return;
    const nowPinned = this.pinnedLibs.toggle({ ...ref, libraryName: lib.name });
    this.snack.open(
      nowPinned ? `"${lib.name}" pinned to the sidebar.` : `"${lib.name}" removed from Pinned Libraries.`,
      'Close', { duration: 2500 });
  }

  // ── Edit (rename + metadata) ──────────────────────────────────────────────

  editOpen    = signal(false);
  editItem    = signal<DriveItem | null>(null);
  editName    = signal('');
  editColumns = signal<EditColumn[]>([]);
  editValues  = signal<Record<string, any>>({});
  editLoading = signal(false);
  editSaving  = signal(false);
  private editOriginal: Record<string, any> = {};
  private columnCache = new Map<string, EditColumn[]>();

  /** Map a raw Graph column to an editable column, or null if it should be hidden. */
  private toEditColumn(c: ListColumn): EditColumn | null {
    if (c.readOnly || c.hidden || c.calculated) return null;
    if (!c.name || c.name.startsWith('_')) return null;
    if (new Set(['Title', 'ContentType', 'FileLeafRef']).has(c.name)) return null;
    const base = { name: c.name, displayName: c.displayName || c.name };
    if (c.choice)               return { ...base, type: 'choice', choices: c.choice.choices ?? [] };
    if (c.boolean)              return { ...base, type: 'boolean' };
    if (c.number || c.currency) return { ...base, type: 'number' };
    if (c.dateTime)             return { ...base, type: 'dateTime' };
    if (c.note)                 return { ...base, type: 'note' };
    if (c.text)                 return { ...base, type: c.text.allowMultipleLines ? 'note' : 'text' };
    return null; // person, lookup and other complex types are not editable here
  }

  private seedEditValue(col: EditColumn, raw: any): any {
    if (raw === null || raw === undefined) return col.type === 'boolean' ? false : '';
    if (col.type === 'boolean') return !!raw;
    if (col.type === 'dateTime') {
      const d = new Date(raw);
      return isNaN(+d) ? '' : d.toISOString().slice(0, 10);
    }
    return raw;
  }

  private async editColumnsFor(driveId: string): Promise<EditColumn[]> {
    const cached = this.columnCache.get(driveId);
    if (cached) return cached;
    try {
      const cols = (await this.graph.getDriveColumns(driveId))
        .map(c => this.toEditColumn(c))
        .filter((c): c is EditColumn => c !== null);
      this.columnCache.set(driveId, cols);
      return cols;
    } catch {
      return [];
    }
  }

  setEditValue(name: string, val: any): void {
    this.editValues.update(v => ({ ...v, [name]: val }));
  }

  async openEdit(item: DriveItem): Promise<void> {
    this.editItem.set(item);
    this.editName.set(item.name);
    this.editColumns.set([]);
    this.editValues.set({});
    this.editOriginal = {};
    this.editOpen.set(true);
    this.editLoading.set(true);
    try {
      const driveId = this.selectedDriveId();
      const [cols, fields] = await Promise.all([
        this.editColumnsFor(driveId),
        this.graph.getItemFields(driveId, item.id).catch(() => item.listItem?.fields ?? {}),
      ]);
      const values: Record<string, any> = {};
      for (const c of cols) values[c.name] = this.seedEditValue(c, (fields as Record<string, any>)?.[c.name]);
      this.editColumns.set(cols);
      this.editValues.set(values);
      this.editOriginal = { ...values };
    } finally {
      this.editLoading.set(false);
    }
  }

  closeEdit(): void {
    if (this.editSaving()) return;
    this.editOpen.set(false);
    this.editItem.set(null);
  }

  async saveEdit(): Promise<void> {
    const item = this.editItem();
    const newName = this.editName().trim();
    if (!item || !newName) return;
    const driveId = this.selectedDriveId();

    // Only send columns whose value actually changed.
    const payload: Record<string, any> = {};
    for (const c of this.editColumns()) {
      const now = this.editValues()[c.name];
      if (now === this.editOriginal[c.name]) continue;
      const blank = now === '' || now === null || now === undefined;
      switch (c.type) {
        case 'boolean':  payload[c.name] = !!now; break;
        case 'number':   payload[c.name] = blank ? null : Number(now); break;
        case 'dateTime': {
          const ms = blank ? NaN : Date.parse(now);
          payload[c.name] = isNaN(ms) ? null : new Date(ms).toISOString();
          break;
        }
        case 'choice':   payload[c.name] = now || null; break;
        default:         payload[c.name] = blank ? '' : String(now).trim();
      }
    }

    this.editSaving.set(true);
    try {
      if (newName !== item.name) await this.graph.renameItem(driveId, item.id, newName);
      if (Object.keys(payload).length) await this.graph.updateItemFields(driveId, item.id, payload);
      this.snack.open(`"${newName}" updated.`, 'Close', { duration: 3000 });
      this.editOpen.set(false);
      this.editItem.set(null);
      await this.reload();
    } catch (e: any) {
      this.snack.open('Save failed: ' + (e?.message ?? e), 'Close', { duration: 5000 });
    } finally {
      this.editSaving.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Relative time like SharePoint's Modified column ("About a minute ago", "3 days ago"). */
  timeAgo(iso: string | null | undefined): string {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const secs = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (secs < 45) return 'a few seconds ago';
    const mins = Math.round(secs / 60);
    if (mins < 2) return 'about a minute ago';
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs === 1 ? 'about an hour ago' : `${hrs} hours ago`;
    const days = Math.round(hrs / 24);
    if (days < 7) return days === 1 ? 'yesterday' : `${days} days ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

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
