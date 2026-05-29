import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MsAuthService } from '@platinumv3/shared/auth';

const GRAPH = 'https://graph.microsoft.com/v1.0';

export interface GraphUser {
  id                : string;
  displayName       : string;
  mail              : string;
  userPrincipalName : string;
  jobTitle          : string | null;
  department        : string | null;
  officeLocation    : string | null;
  mobilePhone       : string | null;
  businessPhones    : string[];
}

export interface SharePointSite {
  id          : string;
  name        : string;
  displayName : string;
  webUrl      : string;
  description : string | null;
}

export interface DriveItem {
  id              : string;
  name            : string;
  webUrl          : string;
  size            : number | null;
  lastModifiedDateTime : string;
  createdDateTime : string;
  file            ?: { mimeType: string };
  folder          ?: { childCount: number };
  parentReference ?: { driveId: string; id: string };
  '@microsoft.graph.downloadUrl'?: string;
}

export interface Drive {
  id          : string;
  name        : string;
  driveType   : string;
  webUrl      : string;
}

export interface ListColumn {
  name        : string;
  displayName : string;
  readOnly   ?: boolean;
  hidden     ?: boolean;
  choice     ?: { choices: string[] };
  text       ?: unknown;
}

@Injectable({ providedIn: 'root' })
export class GraphService {
  private http    = inject(HttpClient);
  private msAuth  = inject(MsAuthService);

  // ── Auth helper ────────────────────────────────────────────────────────────

  private async headers(): Promise<HttpHeaders> {
    const token = await this.msAuth.getGraphToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private async get<T>(path: string): Promise<T> {
    const headers = await this.headers();
    return firstValueFrom(this.http.get<T>(`${GRAPH}${path}`, { headers }));
  }

  // ── User Profile ───────────────────────────────────────────────────────────

  /** Read the signed-in user's profile. */
  async getProfile(): Promise<GraphUser> {
    return this.get<GraphUser>('/me');
  }

  /** Download the signed-in user's profile photo as a blob URL. */
  async getProfilePhoto(): Promise<string | null> {
    try {
      const headers = await this.headers();
      const blob = await firstValueFrom(
        this.http.get(`${GRAPH}/me/photo/$value`, { headers, responseType: 'blob' })
      );
      return URL.createObjectURL(blob);
    } catch {
      return null; // No photo set — caller shows a fallback avatar
    }
  }

  // ── SharePoint Sites ───────────────────────────────────────────────────────

  /** Search SharePoint sites (empty query returns top sites). */
  async searchSites(query: string = ''): Promise<SharePointSite[]> {
    const q = query.trim() || '*'; // '*' returns all accessible sites
    const resp = await this.get<{ value: SharePointSite[] }>(`/sites?search=${encodeURIComponent(q)}`);
    return resp.value;
  }

  /** Get a specific site by ID. */
  async getSite(siteId: string): Promise<SharePointSite> {
    return this.get<SharePointSite>(`/sites/${siteId}`);
  }

  /**
   * Resolve a SharePoint site by its hostname + relative path.
   * e.g. getSiteByPath('zamicromega.sharepoint.com', '/sites/Sebata2')
   * Calls GET /sites/{hostname}:{sitePath}
   */
  async getSiteByPath(hostname: string, sitePath: string): Promise<SharePointSite> {
    return this.get<SharePointSite>(`/sites/${hostname}:${sitePath}`);
  }

  /** List document libraries (drives) for a site. */
  async getDrives(siteId: string): Promise<Drive[]> {
    const resp = await this.get<{ value: Drive[] }>(`/sites/${siteId}/drives`);
    return resp.value;
  }

  // ── Files & Folders ────────────────────────────────────────────────────────

  /** List files/folders in a drive root or specific folder. */
  async getChildren(driveId: string, folderId: string = 'root'): Promise<DriveItem[]> {
    const path = folderId === 'root'
      ? `/drives/${driveId}/root/children`
      : `/drives/${driveId}/items/${folderId}/children`;
    const resp = await this.get<{ value: DriveItem[] }>(path);
    return resp.value;
  }

  /** Get a single drive item (file or folder) by ID. */
  async getItem(driveId: string, itemId: string): Promise<DriveItem> {
    return this.get<DriveItem>(`/drives/${driveId}/items/${itemId}`);
  }

  /**
   * Upload a file to a specific folder in a drive.
   * Uses the simple upload endpoint (≤4 MB).
   */
  async uploadFile(driveId: string, folderId: string, file: File): Promise<DriveItem> {
    if (!driveId) throw new Error('Drive ID is not set — library may still be loading. Please wait and try again.');

    const token   = await this.msAuth.getGraphToken();
    const headers = new HttpHeaders({
      Authorization : `Bearer ${token}`,
      'Content-Type': file.type || 'application/octet-stream',
    });

    // Build the upload path
    const encodedName = encodeURIComponent(file.name);
    const path = folderId === 'root'
      ? `/drives/${driveId}/root:/${encodedName}:/content`
      : `/drives/${driveId}/items/${folderId}:/${encodedName}:/content`;

    console.log('[GraphService] uploadFile →', `${GRAPH}${path}`);

    try {
      return await firstValueFrom(
        this.http.put<DriveItem>(`${GRAPH}${path}`, file, { headers })
      );
    } catch (err: any) {
      // Extract the Graph API error message from the response body
      const body = err?.error;
      const graphMsg = body?.error?.message ?? body?.message ?? null;
      const status   = err?.status ?? '';
      throw new Error(
        graphMsg
          ? `Graph API error ${status}: ${graphMsg}`
          : `Upload failed (HTTP ${status}). Check that the app has Files.ReadWrite.All permission and admin consent has been granted.`
      );
    }
  }

  /**
   * Download a file. Returns a blob URL the caller can use for
   * an <a download> element or direct programmatic download.
   */
  async downloadFile(driveId: string, itemId: string): Promise<string> {
    const headers = await this.headers();
    const blob = await firstValueFrom(
      this.http.get(`${GRAPH}/drives/${driveId}/items/${itemId}/content`, {
        headers,
        responseType: 'blob',
      })
    );
    return URL.createObjectURL(blob);
  }

  /**
   * Trigger a browser download for a drive item.
   * Call this from a component click handler.
   */
  async triggerDownload(driveId: string, itemId: string, fileName: string): Promise<void> {
    const blobUrl = await this.downloadFile(driveId, itemId);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
  }

  /** Create a new folder inside a drive folder. */
  async createFolder(driveId: string, parentId: string, name: string): Promise<DriveItem> {
    const token   = await this.msAuth.getGraphToken();
    const headers = new HttpHeaders({
      Authorization : `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    const path = parentId === 'root'
      ? `/drives/${driveId}/root/children`
      : `/drives/${driveId}/items/${parentId}/children`;

    return firstValueFrom(
      this.http.post<DriveItem>(`${GRAPH}${path}`, {
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }, { headers })
    );
  }

  /** Delete a drive item. */
  async deleteItem(driveId: string, itemId: string): Promise<void> {
    const headers = await this.headers();
    await firstValueFrom(
      this.http.delete(`${GRAPH}/drives/${driveId}/items/${itemId}`, { headers })
    );
  }

  // ── Metadata (SharePoint list columns) ───────────────────────────────────

  /** List the columns defined on a drive's underlying SharePoint list. */
  async getDriveColumns(driveId: string): Promise<ListColumn[]> {
    const resp = await this.get<{ value: ListColumn[] }>(`/drives/${driveId}/list/columns`);
    return resp.value;
  }

  /** Read the SharePoint metadata (list item fields) for a drive item. */
  async getItemFields(driveId: string, itemId: string): Promise<Record<string, any>> {
    return this.get<Record<string, any>>(`/drives/${driveId}/items/${itemId}/listItem/fields`);
  }

  /** Update the SharePoint metadata (list item fields) for a drive item. */
  async updateItemFields(
    driveId: string, itemId: string, fields: Record<string, any>
  ): Promise<Record<string, any>> {
    const token   = await this.msAuth.getGraphToken();
    const headers = new HttpHeaders({
      Authorization : `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    try {
      return await firstValueFrom(
        this.http.patch<Record<string, any>>(
          `${GRAPH}/drives/${driveId}/items/${itemId}/listItem/fields`, fields, { headers }
        )
      );
    } catch (err: any) {
      const body     = err?.error;
      const graphMsg = body?.error?.message ?? body?.message ?? null;
      const status   = err?.status ?? '';
      throw new Error(
        graphMsg
          ? `Graph API error ${status}: ${graphMsg}`
          : `Failed to update metadata (HTTP ${status}). Check that the app has Sites.ReadWrite.All permission.`
      );
    }
  }

  /** Rename a drive item (changes the file name and its SharePoint URL). */
  async renameItem(driveId: string, itemId: string, newName: string): Promise<DriveItem> {
    const token   = await this.msAuth.getGraphToken();
    const headers = new HttpHeaders({
      Authorization : `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return firstValueFrom(
      this.http.patch<DriveItem>(`${GRAPH}/drives/${driveId}/items/${itemId}`, { name: newName }, { headers })
    );
  }
}
