import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'plat-search-input',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" class="search-field">
      <mat-icon matPrefix>search</mat-icon>
      <input matInput placeholder="Search..." [(ngModel)]="query" (ngModelChange)="searchChange.emit($event)">
    </mat-form-field>
  `,
  styles: [`
    .search-field { width: 100%; max-width: 360px; }
    ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class SearchInputComponent {
  query = signal('');
  searchChange = output<string>();
}
