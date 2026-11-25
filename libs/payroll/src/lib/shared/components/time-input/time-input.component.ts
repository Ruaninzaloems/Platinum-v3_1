import { Component, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="time-input-wrap">
      <input
        class="time-text-input"
        placeholder="HH:mm"
        [value]="displayValue"
        (input)="onInput($event)"
        (blur)="onBlur()"
        maxlength="5">
      <button type="button" class="time-picker-btn" (click)="openPicker()" tabindex="-1" title="Open time picker">
        <app-icon name="clock" [size]="15"></app-icon>
      </button>
      <input
        #nativePicker
        type="time"
        class="time-native-input"
        [value]="displayValue"
        (change)="onNativeChange($event)"
        tabindex="-1">
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .time-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: #fff;
      border: 1.5px solid #d1d9e6;
      border-radius: 8px;
      transition: border-color 0.2s, box-shadow 0.2s;
      overflow: hidden;
    }
    .time-input-wrap:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
    }
    .time-text-input {
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
    .time-text-input::placeholder {
      color: #94a3b8;
    }
    .time-picker-btn {
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
    .time-picker-btn:hover {
      background: #f0f7ff;
      color: #3b82f6;
    }
    .time-native-input {
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
    useExisting: forwardRef(() => TimeInputComponent),
    multi: true
  }]
})
export class TimeInputComponent implements ControlValueAccessor {
  @ViewChild('nativePicker') nativePicker!: ElementRef<HTMLInputElement>;

  displayValue = '';
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (!value) { this.displayValue = ''; return; }
    const str = String(value).trim();
    const match = str.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      this.displayValue = `${h}:${m}`;
    } else {
      this.displayValue = '';
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  openPicker(): void {
    if (this.nativePicker?.nativeElement) {
      this.nativePicker.nativeElement.showPicker?.();
    }
  }

  onNativeChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!val) { this.displayValue = ''; this.onChange(null); return; }
    const match = val.match(/^(\d{2}):(\d{2})/);
    if (match) {
      this.displayValue = `${match[1]}:${match[2]}`;
      this.onChange(`${match[1]}:${match[2]}`);
    }
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^\d]/g, '');
    let formatted = '';
    for (let i = 0; i < digits.length && i < 4; i++) {
      if (i === 2) formatted += ':';
      formatted += digits[i];
    }
    this.displayValue = formatted;
    input.value = formatted;
    this.emitIfValid(formatted);
  }

  onBlur(): void {
    this.onTouched();
    this.emitIfValid(this.displayValue);
  }

  private emitIfValid(val: string): void {
    const match = val.match(/^(\d{2}):(\d{2})$/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        this.onChange(`${match[1]}:${match[2]}`);
        return;
      }
    }
    if (val.length < 5) this.onChange(null);
  }
}
