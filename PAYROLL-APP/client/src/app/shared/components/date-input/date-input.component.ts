import { Component, forwardRef, Input, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="date-input-wrap" [class.readonly]="readonly">
      <input
        class="date-text-input"
        [placeholder]="placeholder"
        [value]="displayValue"
        (input)="onInput($event)"
        (blur)="onBlur($event)"
        maxlength="10"
        [readonly]="readonly">
      @if (!readonly) {
        <button type="button" class="date-picker-btn" (click)="openPicker()" tabindex="-1" title="Open calendar">
          <app-icon name="calendar" [size]="15"></app-icon>
        </button>
        <input
          #nativePicker
          type="date"
          class="date-native-input"
          [value]="isoValue"
          (change)="onNativeChange($event)"
          tabindex="-1">
      }
    </div>
  `,
  styles: [`
    .date-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: #fff;
      border: 1.5px solid #d1d9e6;
      border-radius: 8px;
      transition: border-color 0.2s, box-shadow 0.2s;
      overflow: hidden;
    }
    .date-input-wrap:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
    }
    .date-input-wrap.readonly {
      background: #f9fafb;
      border-color: #e5e7eb;
    }
    .date-text-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 9px 12px;
      font-size: 13.5px;
      font-family: inherit;
      color: #1e293b;
      min-width: 0;
    }
    .date-text-input::placeholder {
      color: #94a3b8;
    }
    .date-text-input[readonly] {
      cursor: default;
      color: #64748b;
    }
    .date-picker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      flex-shrink: 0;
      border-left: 1px solid #e5e7eb;
      transition: background 0.15s, color 0.15s;
    }
    .date-picker-btn:hover {
      background: #f0f7ff;
      color: #3b82f6;
    }
    .date-native-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
      right: 0;
      bottom: 0;
    }
  `],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DateInputComponent),
    multi: true
  }]
})
export class DateInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'dd/mm/yyyy';
  @Input() readonly = false;
  @ViewChild('nativePicker') nativePicker!: ElementRef<HTMLInputElement>;

  displayValue = '';
  isoValue = '';
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (!value) {
      this.displayValue = '';
      this.isoValue = '';
      return;
    }
    const str = String(value);
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      this.displayValue = `${match[3]}/${match[2]}/${match[1]}`;
      this.isoValue = `${match[1]}-${match[2]}-${match[3]}`;
    } else {
      this.displayValue = '';
      this.isoValue = '';
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  openPicker(): void {
    if (this.nativePicker?.nativeElement) {
      this.nativePicker.nativeElement.showPicker();
    }
  }

  onNativeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (!val) {
      this.displayValue = '';
      this.isoValue = '';
      this.onChange(null);
      return;
    }
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      this.isoValue = val;
      this.displayValue = `${match[3]}/${match[2]}/${match[1]}`;
      this.onChange(val);
    }
  }

  private parseAndEmit(formatted: string): void {
    if (formatted.length === 0) {
      this.isoValue = '';
      this.onChange(null);
      return;
    }
    const parts = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (parts) {
      const day = parseInt(parts[1], 10);
      const month = parseInt(parts[2], 10);
      const year = parseInt(parts[3], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 9999) {
        const iso = `${parts[3]}-${parts[2]}-${parts[1]}`;
        this.isoValue = iso;
        this.onChange(iso);
        return;
      }
    }
    this.onChange(null);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^\d]/g, '');
    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }

    this.displayValue = formatted;
    input.value = formatted;
    this.parseAndEmit(formatted);
  }

  onBlur(event: Event): void {
    this.onTouched();
    if (this.displayValue.length > 0 && this.displayValue.length < 10) {
      this.displayValue = '';
      this.isoValue = '';
      this.onChange(null);
    }
  }
}
