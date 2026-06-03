import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-time-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="time-input-wrapper" [class.disabled]="disabled">
      <input
        #hourInput
        class="time-segment"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="2"
        [value]="hours"
        [disabled]="disabled"
        placeholder="HH"
        (focus)="onHourFocus($event)"
        (input)="onHourInput($event)"
        (keydown)="onHourKey($event)"
        (blur)="onHourBlur()"
      />
      <span class="time-colon">:</span>
      <input
        #minuteInput
        class="time-segment"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="2"
        [value]="minutes"
        [disabled]="disabled"
        placeholder="MM"
        (focus)="onMinuteFocus($event)"
        (input)="onMinuteInput($event)"
        (keydown)="onMinuteKey($event)"
        (blur)="onMinuteBlur()"
      />
    </div>
  `,
  styles: [`
    .time-input-wrapper {
      display: flex;
      align-items: center;
      border: 1px solid #ced4da;
      border-radius: 4px;
      background: #fff;
      padding: 0 8px;
      height: 38px;
      box-sizing: border-box;
      gap: 2px;
    }
    .time-input-wrapper.disabled {
      background: #e9ecef;
      opacity: 1;
    }
    .time-segment {
      border: none;
      outline: none;
      background: transparent;
      width: 36px;
      text-align: center;
      font-size: 14px;
      font-family: inherit;
      color: inherit;
      padding: 0;
      -moz-appearance: textfield;
    }
    .time-segment::-webkit-outer-spin-button,
    .time-segment::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .time-segment:disabled {
      color: #6c757d;
      cursor: not-allowed;
    }
    .time-colon {
      font-size: 14px;
      font-weight: 600;
      color: #495057;
      user-select: none;
    }
  `]
})
export class TimeInputComponent implements OnChanges {
  @Input() value: string | null = '';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('hourInput') hourInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('minuteInput') minuteInputRef!: ElementRef<HTMLInputElement>;

  hours: string = '';
  minutes: string = '';

  // While a segment has focus the user may be mid-way through typing a
  // two-digit value (e.g. just typed "1" on the way to "10"). Every emit()
  // call causes the parent to update [value] which triggers ngOnChanges.
  // ngOnChanges would then pad the single digit ("1" → "01") and push it
  // back into input.value via [value]="hours", corrupting the edit in
  // progress. These flags suppress the ngOnChanges update for the segment
  // that is currently focused.
  private _editingHours = false;
  private _editingMinutes = false;

  constructor(private ngZone: NgZone) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.parseValue(this.value);
    }
  }

  private parseValue(val: string | null): void {
    if (!val) {
      if (!this._editingHours)   this.hours   = '';
      if (!this._editingMinutes) this.minutes  = '';
      return;
    }
    const parts = val.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!this._editingHours) {
      this.hours   = isNaN(h) ? '' : String(Math.min(23, Math.max(0, h))).padStart(2, '0');
    }
    if (!this._editingMinutes) {
      this.minutes = isNaN(m) ? '' : String(Math.min(59, Math.max(0, m))).padStart(2, '0');
    }
  }

  private emit(): void {
    const h = this.hours   !== '' ? this.hours.padStart(2,   '0') : '00';
    const m = this.minutes !== '' ? this.minutes.padStart(2, '0') : '00';
    this.valueChange.emit(`${h}:${m}`);
  }

  private focusAndSelect(input: HTMLInputElement): void {
    // Pre-fill empty segments with "00" so select() has something to
    // highlight. blur/input/keydown handlers normalise the value from there.
    if (!input.value) {
      input.value = '00';
    }
    // Run outside Angular's zone: if the setTimeout ran inside the zone,
    // the post-task CD cycle would re-evaluate [value]="hours/minutes",
    // reassign input.value, and wipe out the selection we just made.
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => input.select(), 0);
    });
  }

  onHourFocus(event: FocusEvent): void {
    this._editingHours = true;
    this.focusAndSelect(event.target as HTMLInputElement);
  }

  onMinuteFocus(event: FocusEvent): void {
    this._editingMinutes = true;
    this.focusAndSelect(event.target as HTMLInputElement);
  }

  onHourInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 2);
    input.value = raw;
    let val = parseInt(raw, 10);
    if (isNaN(val)) { this.hours = ''; return; }
    if (val > 23) val = 23;
    if (val < 0)  val = 0;
    this.hours = String(val);
    this.emit();
    if (raw.length >= 2) {
      this.minuteInputRef?.nativeElement?.focus();
    }
  }

  onHourKey(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      this.commitHour(input);
      this.minuteInputRef?.nativeElement?.focus();
      return;
    }
    if (event.key === ':') {
      event.preventDefault();
      this.commitHour(input);
      this.minuteInputRef?.nativeElement?.focus();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      let val = parseInt(input.value, 10);
      val = isNaN(val) ? 0 : Math.min(23, val + 1);
      this.hours = String(val).padStart(2, '0');
      input.value = this.hours;
      this.emit();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      let val = parseInt(input.value, 10);
      val = isNaN(val) ? 23 : Math.max(0, val - 1);
      this.hours = String(val).padStart(2, '0');
      input.value = this.hours;
      this.emit();
    }
  }

  private commitHour(input: HTMLInputElement): void {
    this._editingHours = false;
    const val = parseInt(input.value, 10);
    if (!isNaN(val)) {
      this.hours = String(Math.min(23, Math.max(0, val))).padStart(2, '0');
      input.value = this.hours;
    }
    this.emit();
  }

  onHourBlur(): void {
    this._editingHours = false;
    const val = parseInt(this.hours, 10);
    if (!isNaN(val)) {
      this.hours = String(Math.min(23, Math.max(0, val))).padStart(2, '0');
    }
    this.emit();
  }

  onMinuteInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 2);
    input.value = raw;
    let val = parseInt(raw, 10);
    if (isNaN(val)) { this.minutes = ''; return; }
    if (val > 59) val = 59;
    if (val < 0)  val = 0;
    this.minutes = String(val);
    this.emit();
  }

  onMinuteKey(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      let val = parseInt(input.value, 10);
      val = isNaN(val) ? 0 : Math.min(59, val + 1);
      this.minutes = String(val).padStart(2, '0');
      input.value = this.minutes;
      this.emit();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      let val = parseInt(input.value, 10);
      val = isNaN(val) ? 59 : Math.max(0, val - 1);
      this.minutes = String(val).padStart(2, '0');
      input.value = this.minutes;
      this.emit();
    }
  }

  onMinuteBlur(): void {
    this._editingMinutes = false;
    const val = parseInt(this.minutes, 10);
    if (!isNaN(val)) {
      this.minutes = String(Math.min(59, Math.max(0, val))).padStart(2, '0');
    }
    this.emit();
  }
}
