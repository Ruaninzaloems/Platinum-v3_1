import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdvancedMappingComponent } from './advanced-mapping.component';
import { MappingWorkbenchService } from './mapping-workbench.service';

@Component({
  selector: 'app-mapping-studio-fullscreen',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule,
    AdvancedMappingComponent,
  ],
  template: `
    <div class="studio-fullscreen">
      <mat-toolbar color="primary" class="studio-toolbar">
        <mat-icon>hub</mat-icon>
        <span class="title">Mapping Studio</span>
        <span class="spacer"></span>
        <span class="run-info" *ngIf="run">
          Run: {{ run.name || run.id?.substring(0,8) }} &mdash; {{ run.status | uppercase }}
        </span>
        <button mat-icon-button matTooltip="Close" (click)="closeWindow()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-toolbar>
      <div class="studio-body">
        <app-advanced-mapping
          *ngIf="runId && runStatus"
          [runId]="runId"
          [runStatus]="runStatus"
          [fullscreen]="true"
          (mappingApplied)="onMappingApplied()">
        </app-advanced-mapping>
        <div *ngIf="!runId" class="no-run">
          <mat-icon>warning</mat-icon>
          <p>No run ID provided. Open Mapping Studio from the Mapping Workbench.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .studio-fullscreen {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
    .studio-toolbar {
      flex-shrink: 0;
      gap: 8px;
      font-size: 16px;
      .title { font-weight: 600; }
      .spacer { flex: 1; }
      .run-info {
        font-size: 13px;
        opacity: 0.9;
        margin-right: 16px;
      }
    }
    .studio-body {
      flex: 1;
      overflow: hidden;
      padding: 8px;
    }
    .no-run {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
    }
  `],
})
export class MappingStudioFullscreenComponent implements OnInit {
  runId = '';
  runStatus = '';
  run: any = null;

  constructor(
    private route: ActivatedRoute,
    private workbenchService: MappingWorkbenchService,
  ) {}

  ngOnInit(): void {
    this.runId = this.route.snapshot.queryParamMap.get('runId') || '';
    if (this.runId) {
      this.workbenchService.getRun(this.runId).subscribe({
        next: (run) => {
          this.run = run;
          this.runStatus = run.status;
        },
      });
    }
  }

  onMappingApplied(): void {
    if (this.runId) {
      this.workbenchService.getRun(this.runId).subscribe({
        next: (run) => {
          this.run = run;
          this.runStatus = run.status;
        },
      });
    }
  }

  closeWindow(): void {
    window.close();
  }
}
