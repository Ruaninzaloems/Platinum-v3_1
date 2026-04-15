import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { QuillModule } from 'ngx-quill';
import { QUILL_TOOLBAR_MODULES, QUILL_FORMATS, applyQuillTooltips, registerQuillClipboardMatchers, registerQuillSizeWhitelist, setupTableToolbar } from './quill-config';

@Component({
  selector: 'app-add-policy-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    QuillModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Custom Accounting Policy</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Policy Title</mat-label>
        <input matInput [(ngModel)]="title" maxlength="200" required>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Policy Area</mat-label>
        <mat-select [(ngModel)]="policyArea">
          @for (area of data.policyAreas; track area) {
            <mat-option [value]="area">{{ area }}</mat-option>
          }
          <mat-option value="__custom__">+ New Area...</mat-option>
        </mat-select>
      </mat-form-field>

      @if (policyArea === '__custom__') {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Policy Area Name</mat-label>
          <input matInput [(ngModel)]="customArea" maxlength="100">
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Paragraph Code</mat-label>
        <input matInput [(ngModel)]="paragraphCode" maxlength="20" placeholder="e.g. AP-036">
        <mat-hint>Suggested: {{ suggestedCode }}</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>GRAP Reference (optional)</mat-label>
        <input matInput [(ngModel)]="grapReference" maxlength="50">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>AFS Specimen Reference (optional)</mat-label>
        <input matInput [(ngModel)]="afsSpecimenReference" maxlength="100" placeholder="e.g. Section 1.15">
      </mat-form-field>

      <div class="editor-label">Policy Text</div>
      <quill-editor
        [(ngModel)]="editedText"
        [modules]="quillModules"
        [formats]="quillFormats"
        [styles]="{ 'min-height': '150px' }"
        placeholder="Enter policy text..."
        (onEditorCreated)="onEditorCreated($event)">
      </quill-editor>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-flat-button class="btn-primary" (click)="submit()" [disabled]="!isValid()">
        <mat-icon>add</mat-icon> Create Policy
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 8px; }
    .btn-primary { background: #2e7d32 !important; color: white !important; }
    .editor-label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
    mat-dialog-content { min-width: 500px; }
    ::ng-deep .ql-container { min-height: 150px; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { margin-top: 2px; }
    ::ng-deep .ql-editor table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    ::ng-deep .ql-editor table td,
    ::ng-deep .ql-editor table th { border: 1px solid #000000; padding: 4px 8px; min-width: 40px; vertical-align: top; }
    ::ng-deep .ql-editor table[data-border="none"] td,
    ::ng-deep .ql-editor table[data-border="none"] th { border: 1px dashed #ccc; }
    ::ng-deep .ql-editor table[data-border="thick"] td,
    ::ng-deep .ql-editor table[data-border="thick"] th { border: 2px solid #000000; }
    ::ng-deep .ql-table-picker-wrap {
      display: none; position: absolute; top: 100%; left: 0;
      background: white; border: 1px solid #e2e8f0; border-radius: 6px;
      padding: 8px; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      min-width: 160px;
    }
    ::ng-deep .ql-table-picker-label { font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 6px; text-align: center; }
    ::ng-deep .ql-table-picker-grid { display: grid; grid-template-columns: repeat(6, 22px); grid-template-rows: repeat(6, 22px); gap: 2px; }
    ::ng-deep .ql-table-picker-cell { width: 22px; height: 22px; border: 1px solid #cbd5e1; border-radius: 2px; cursor: pointer; background: #f8fafc; }
    ::ng-deep .ql-table-picker-cell:hover,
    ::ng-deep .ql-table-picker-cell.highlight { background: #bbdefb; border-color: #1976d2; }
    ::ng-deep .ql-table-picker-size { font-size: 11px; color: #64748b; text-align: center; margin-top: 4px; min-height: 16px; }
    ::ng-deep .ql-table-ops-menu {
      display: none; position: absolute; top: 100%; left: 0;
      background: white; border: 1px solid #e2e8f0; border-radius: 6px;
      padding: 4px 0; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      min-width: 160px;
    }
    ::ng-deep .ql-table-ops-item { padding: 6px 14px; font-size: 12px; color: #334155; cursor: pointer; white-space: nowrap; }
    ::ng-deep .ql-table-ops-item:hover { background: #f1f5f9; }
    ::ng-deep .ql-table-ops-item.danger { color: #dc2626; }
    ::ng-deep .ql-table-ops-item.danger:hover { background: #fef2f2; }
    ::ng-deep .ql-table-ops-divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
  `],
})
export class AddPolicyDialogComponent {
  private dialogRef = inject(MatDialogRef<AddPolicyDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  title = '';
  policyArea = '';
  customArea = '';
  paragraphCode = '';
  grapReference = '';
  afsSpecimenReference = '';
  editedText = '';
  suggestedCode = '';

  ngOnInit() {
    if (this.data.suggestedCode) {
      this.suggestedCode = this.data.suggestedCode;
      this.paragraphCode = this.data.suggestedCode;
    }
  }

  quillModules = QUILL_TOOLBAR_MODULES;
  quillFormats = QUILL_FORMATS;

  onEditorCreated(quill: any): void {
    registerQuillSizeWhitelist(quill);
    const container = quill.container?.closest('.ql-container')?.parentElement;
    if (container) {
      applyQuillTooltips(container);
      setupTableToolbar(quill, container);
    }
    registerQuillClipboardMatchers(quill);
  }

  isValid(): boolean {
    const area = this.policyArea === '__custom__' ? this.customArea.trim() : this.policyArea;
    return this.title.trim().length > 0 && area.length > 0;
  }

  submit() {
    if (!this.isValid()) return;
    const area = this.policyArea === '__custom__' ? this.customArea.trim() : this.policyArea;
    this.dialogRef.close({
      title: this.title.trim(),
      policyArea: area,
      paragraphCode: this.paragraphCode.trim() || null,
      grapReference: this.grapReference.trim() || null,
      afsSpecimenReference: this.afsSpecimenReference.trim() || null,
      editedText: this.editedText || null,
    });
  }
}
