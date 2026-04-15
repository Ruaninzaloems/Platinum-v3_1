import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/services/api.service';

interface TemplateStyle {
  id?: string;
  templateId?: string;
  tenantId?: string;
  logoPath: string | null;
  logoPosition: string;
  logoMaxHeight: number;
  secondaryLogoPath: string | null;
  secondaryLogoPosition: string;
  primaryColor: string;
  secondaryColor: string;
  headerBgColor: string;
  headerTextColor: string;
  footerBgColor: string;
  footerTextColor: string;
  tableBorderColor: string;
  tableHeaderBgColor: string;
  totalRowBgColor: string;
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: number;
  headingFontSize: number;
  lineHeight: number;
  coverLayout: string;
  coverBgColor: string;
  coverTextColor: string;
  coverAccentColor: string;
  showCoverBorder: boolean;
  coverBorderStyle: string;
  coverSubtitleText: string;
  headerLayout: string;
  footerLayout: string;
  showPageNumbers: boolean;
  headerLeftText: string | null;
  headerRightText: string | null;
  footerLeftText: string | null;
  footerRightText: string | null;
  draftWatermarkText: string;
  draftWatermarkOpacity: number;
  showWatermark: boolean;
  pageMarginTop: number;
  pageMarginBottom: number;
  pageMarginSides: number;
}

const DEFAULT_STYLE: TemplateStyle = {
  logoPath: null,
  logoPosition: 'left',
  logoMaxHeight: 80,
  secondaryLogoPath: null,
  secondaryLogoPosition: 'right',
  primaryColor: '#0f2b46',
  secondaryColor: '#c9a84c',
  headerBgColor: '#0f2b46',
  headerTextColor: '#ffffff',
  footerBgColor: '#0f2b46',
  footerTextColor: '#ffffff',
  tableBorderColor: '#dee2e6',
  tableHeaderBgColor: '#f8f9fa',
  totalRowBgColor: '#f0f4f8',
  fontFamily: 'Inter, sans-serif',
  headingFontFamily: 'Inter, sans-serif',
  baseFontSize: 10,
  headingFontSize: 14,
  lineHeight: 1.4,
  coverLayout: 'centered',
  coverBgColor: '#0f2b46',
  coverTextColor: '#ffffff',
  coverAccentColor: '#c9a84c',
  showCoverBorder: true,
  coverBorderStyle: 'double',
  coverSubtitleText: 'Annual Financial Statements',
  headerLayout: 'standard',
  footerLayout: 'standard',
  showPageNumbers: true,
  headerLeftText: null,
  headerRightText: null,
  footerLeftText: null,
  footerRightText: null,
  draftWatermarkText: 'DRAFT',
  draftWatermarkOpacity: 0.06,
  showWatermark: true,
  pageMarginTop: 40,
  pageMarginBottom: 40,
  pageMarginSides: 48,
};

const PRESETS: Record<string, Partial<TemplateStyle>> = {
  'Platinum Default': {
    primaryColor: '#0f2b46',
    secondaryColor: '#c9a84c',
    headerBgColor: '#0f2b46',
    headerTextColor: '#ffffff',
    footerBgColor: '#0f2b46',
    footerTextColor: '#ffffff',
    tableBorderColor: '#dee2e6',
    tableHeaderBgColor: '#f8f9fa',
    totalRowBgColor: '#f0f4f8',
    coverBgColor: '#0f2b46',
    coverTextColor: '#ffffff',
    coverAccentColor: '#c9a84c',
  },
  'Municipal Blue': {
    primaryColor: '#1565c0',
    secondaryColor: '#42a5f5',
    headerBgColor: '#1565c0',
    headerTextColor: '#ffffff',
    footerBgColor: '#0d47a1',
    footerTextColor: '#ffffff',
    tableBorderColor: '#bbdefb',
    tableHeaderBgColor: '#e3f2fd',
    totalRowBgColor: '#e8eaf6',
    coverBgColor: '#1565c0',
    coverTextColor: '#ffffff',
    coverAccentColor: '#42a5f5',
  },
  'Professional Grey': {
    primaryColor: '#37474f',
    secondaryColor: '#78909c',
    headerBgColor: '#37474f',
    headerTextColor: '#ffffff',
    footerBgColor: '#455a64',
    footerTextColor: '#ffffff',
    tableBorderColor: '#cfd8dc',
    tableHeaderBgColor: '#eceff1',
    totalRowBgColor: '#f5f5f5',
    coverBgColor: '#37474f',
    coverTextColor: '#ffffff',
    coverAccentColor: '#78909c',
  },
};

@Component({
  selector: 'app-template-style-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  templateUrl: './template-style-editor.component.html',
  styleUrl: './template-style-editor.component.css',
})
export class TemplateStyleEditorComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  templateId = '';
  saving = signal(false);
  style = signal<TemplateStyle>({ ...DEFAULT_STYLE });

  styleData: TemplateStyle = { ...DEFAULT_STYLE };

  fontOptions = [
    'Inter, sans-serif',
    'Arial, sans-serif',
    'Times New Roman, serif',
    'Calibri, sans-serif',
    'Roboto, sans-serif',
  ];

  presetNames = Object.keys(PRESETS);

  coverLayouts = [
    { value: 'centered', label: 'Centered', icon: 'align_horizontal_center' },
    { value: 'left-aligned', label: 'Left Aligned', icon: 'align_horizontal_left' },
    { value: 'split', label: 'Split', icon: 'vertical_split' },
  ];

  ngOnInit() {
    this.templateId = this.route.snapshot.paramMap.get('id') || '';
    if (this.templateId) {
      this.loadStyle();
    }
  }

  loadStyle() {
    this.api.get<TemplateStyle>(`/template-styles/${this.templateId}`).subscribe({
      next: (data) => {
        if (data && data.id) {
          this.styleData = { ...DEFAULT_STYLE, ...data };
        } else {
          this.styleData = { ...DEFAULT_STYLE };
        }
        this.style.set({ ...this.styleData });
      },
      error: () => {
        this.styleData = { ...DEFAULT_STYLE };
        this.style.set({ ...this.styleData });
      },
    });
  }

  onStyleChange() {
    this.style.set({ ...this.styleData });
  }

  saveStyle() {
    this.saving.set(true);
    this.api.put<TemplateStyle>(`/template-styles/${this.templateId}`, this.styleData).subscribe({
      next: (data) => {
        this.saving.set(false);
        if (data && data.id) {
          this.styleData = { ...DEFAULT_STYLE, ...data };
          this.style.set({ ...this.styleData });
        }
        this.snackBar.open('Style saved successfully', 'Close', { duration: 3000, panelClass: 'snack-success' });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save style', 'Close', { duration: 3000, panelClass: 'snack-error' });
      },
    });
  }

  resetToDefaults() {
    if (confirm('Reset all styles to defaults? This will discard unsaved changes.')) {
      this.styleData = { ...DEFAULT_STYLE };
      this.style.set({ ...this.styleData });
      this.api.post(`/template-styles/${this.templateId}/reset`).subscribe({
        next: () => {
          this.snackBar.open('Style reset to defaults', 'Close', { duration: 3000 });
          this.loadStyle();
        },
        error: () => {
          this.snackBar.open('Failed to reset style', 'Close', { duration: 3000, panelClass: 'snack-error' });
        },
      });
    }
  }

  applyPreset(name: string) {
    const preset = PRESETS[name];
    if (preset) {
      Object.assign(this.styleData, preset);
      this.onStyleChange();
    }
  }

  uploadLogo(event: Event, type: 'primary' | 'secondary') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const endpoint = type === 'primary'
      ? `/template-styles/${this.templateId}/upload-logo`
      : `/template-styles/${this.templateId}/upload-secondary-logo`;
    this.api.upload<any>(endpoint, file).subscribe({
      next: (res) => {
        if (type === 'primary') {
          this.styleData.logoPath = res.logoPath || res.path;
        } else {
          this.styleData.secondaryLogoPath = res.secondaryLogoPath || res.path;
        }
        this.onStyleChange();
        this.snackBar.open('Logo uploaded', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to upload logo', 'Close', { duration: 3000, panelClass: 'snack-error' });
      },
    });
    input.value = '';
  }

  removeLogo(type: 'primary' | 'secondary') {
    if (type === 'primary') {
      this.api.delete(`/template-styles/${this.templateId}/logo`).subscribe({
        next: () => {
          this.styleData.logoPath = null;
          this.onStyleChange();
        },
      });
    } else {
      this.styleData.secondaryLogoPath = null;
      this.onStyleChange();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropLogo(event: DragEvent, type: 'primary' | 'secondary') {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const endpoint = type === 'primary'
      ? `/template-styles/${this.templateId}/upload-logo`
      : `/template-styles/${this.templateId}/upload-secondary-logo`;
    this.api.upload<any>(endpoint, file).subscribe({
      next: (res) => {
        if (type === 'primary') {
          this.styleData.logoPath = res.logoPath || res.path;
        } else {
          this.styleData.secondaryLogoPath = res.secondaryLogoPath || res.path;
        }
        this.onStyleChange();
        this.snackBar.open('Logo uploaded', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to upload logo', 'Close', { duration: 3000, panelClass: 'snack-error' });
      },
    });
  }

  goBack() {
    this.router.navigate(['/templates', this.templateId]);
  }
}
