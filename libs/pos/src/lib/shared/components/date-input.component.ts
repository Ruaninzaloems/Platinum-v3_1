import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

type PickerView = 'days' | 'months' | 'years';

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="date-input-wrapper" [class.disabled]="disabled">
      <input
        type="text"
        [class]="inputClass"
        [placeholder]="placeholder"
        [value]="displayValue()"
        (input)="onTextInput($event)"
        (blur)="onBlur()"
        (click)="togglePicker()"
        [attr.data-testid]="testId"
        [disabled]="disabled"
        maxlength="10"
      />
      <button type="button" class="date-input-calendar-btn" (click)="togglePicker()" [disabled]="disabled" tabindex="0" aria-label="Open calendar" [attr.aria-expanded]="pickerOpen()">
        <span class="material-icons">calendar_today</span>
      </button>

      @if (pickerOpen()) {
        <div class="date-picker-dropdown" (click)="$event.stopPropagation()" role="dialog" aria-label="Date picker">

          @if (pickerView() === 'days') {
            <div class="picker-header">
              <button type="button" class="picker-nav-btn" (click)="prevMonth()" aria-label="Previous month">
                <span class="material-icons">chevron_left</span>
              </button>
              <button type="button" class="picker-header-label" (click)="switchToMonths()" data-testid="picker-header-label">
                {{ monthNames[pickerMonth()] }} {{ pickerYear() }}
              </button>
              <button type="button" class="picker-nav-btn" (click)="nextMonth()" aria-label="Next month">
                <span class="material-icons">chevron_right</span>
              </button>
            </div>

            <div class="picker-weekdays">
              @for (d of weekdays; track d) {
                <span class="picker-weekday">{{ d }}</span>
              }
            </div>

            <div class="picker-days">
              @for (day of calendarDays(); track day.key) {
                <button
                  type="button"
                  class="picker-day"
                  [class.other-month]="day.otherMonth"
                  [class.today]="day.isToday"
                  [class.selected]="day.isSelected"
                  (click)="selectDay(day)"
                >{{ day.day }}</button>
              }
            </div>
          }

          @if (pickerView() === 'months') {
            <div class="picker-header">
              <button type="button" class="picker-nav-btn" (click)="prevYearInMonthView()" aria-label="Previous year">
                <span class="material-icons">chevron_left</span>
              </button>
              <button type="button" class="picker-header-label" (click)="switchToYears()" data-testid="picker-year-label">
                {{ pickerYear() }}
              </button>
              <button type="button" class="picker-nav-btn" (click)="nextYearInMonthView()" aria-label="Next year">
                <span class="material-icons">chevron_right</span>
              </button>
            </div>

            <div class="picker-month-grid">
              @for (m of monthsShort; track m.value) {
                <button
                  type="button"
                  class="picker-month-cell"
                  [class.selected]="m.value === pickerMonth() && pickerYear() === selectedYear()"
                  [class.current]="m.value === currentMonth && pickerYear() === currentYear"
                  (click)="selectMonth(m.value)"
                >{{ m.label }}</button>
              }
            </div>
          }

          @if (pickerView() === 'years') {
            <div class="picker-header">
              <button type="button" class="picker-nav-btn" (click)="prevDecade()" aria-label="Previous decade">
                <span class="material-icons">chevron_left</span>
              </button>
              <span class="picker-header-label picker-header-label-static">
                {{ decadeStart() }} &ndash; {{ decadeStart() + 11 }}
              </span>
              <button type="button" class="picker-nav-btn" (click)="nextDecade()" aria-label="Next decade">
                <span class="material-icons">chevron_right</span>
              </button>
            </div>

            <div class="picker-year-grid">
              @for (y of yearGridItems(); track y) {
                <button
                  type="button"
                  class="picker-year-cell"
                  [class.selected]="y === selectedYear()"
                  [class.current]="y === currentYear"
                  (click)="selectYear(y)"
                >{{ y }}</button>
              }
            </div>
          }

          <div class="picker-footer">
            <button type="button" class="picker-footer-btn" (click)="clearDate()">Clear</button>
            <button type="button" class="picker-footer-btn picker-today-btn" (click)="goToday()">Today</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .date-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .date-input-wrapper.disabled {
      opacity: 0.6;
      pointer-events: none;
    }
    .date-input-wrapper input[type="text"] {
      width: 100%;
      padding-right: 2.5rem;
    }
    .date-input-calendar-btn {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.35rem;
      color: #6b7280;
      display: flex;
      align-items: center;
      z-index: 3;
      border-radius: 4px;
      transition: all 0.15s ease;
    }
    .date-input-calendar-btn:hover {
      color: var(--platinum-primary, #0f2b46);
      background: rgba(15, 43, 70, 0.08);
    }
    .date-input-calendar-btn:active {
      background: rgba(15, 43, 70, 0.15);
    }
    .date-input-calendar-btn .material-icons {
      font-size: 1.1rem;
    }

    .date-picker-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 1000;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      padding: 0.75rem;
      width: 280px;
      font-size: 0.85rem;
    }

    .picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      gap: 0.25rem;
    }
    .picker-nav-btn {
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      padding: 0.2rem;
      display: flex;
      align-items: center;
      color: #374151;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .picker-nav-btn:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }
    .picker-nav-btn .material-icons {
      font-size: 1.1rem;
    }

    .picker-header-label {
      flex: 1;
      text-align: center;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--platinum-primary, #0f2b46);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.3rem 0.5rem;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .picker-header-label:hover {
      background: rgba(15, 43, 70, 0.06);
    }
    .picker-header-label-static {
      cursor: default;
    }
    .picker-header-label-static:hover {
      background: none;
    }

    .picker-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      margin-bottom: 0.25rem;
    }
    .picker-weekday {
      font-size: 0.7rem;
      font-weight: 600;
      color: #9ca3af;
      padding: 0.25rem 0;
      text-transform: uppercase;
    }

    .picker-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
    }
    .picker-day {
      background: none;
      border: none;
      border-radius: 6px;
      padding: 0.35rem 0;
      cursor: pointer;
      font-size: 0.8rem;
      color: #1f2937;
      text-align: center;
      transition: all 0.1s ease;
    }
    .picker-day:hover {
      background: #f3f4f6;
    }
    .picker-day.other-month {
      color: #d1d5db;
    }
    .picker-day.today {
      font-weight: 700;
      color: var(--platinum-accent, #c9a84c);
      border: 1px solid var(--platinum-accent, #c9a84c);
    }
    .picker-day.selected {
      background: var(--platinum-primary, #0f2b46);
      color: #fff;
      font-weight: 600;
    }
    .picker-day.selected:hover {
      background: var(--platinum-primary, #0f2b46);
      opacity: 0.9;
    }

    .picker-month-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      padding: 0.25rem 0;
    }
    .picker-month-cell {
      background: none;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 0.55rem 0.25rem;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 500;
      color: #374151;
      text-align: center;
      transition: all 0.15s ease;
    }
    .picker-month-cell:hover {
      background: #f3f4f6;
      border-color: #e5e7eb;
    }
    .picker-month-cell.current {
      color: var(--platinum-accent, #c9a84c);
      font-weight: 700;
      border-color: var(--platinum-accent, #c9a84c);
    }
    .picker-month-cell.selected {
      background: var(--platinum-primary, #0f2b46);
      color: #fff;
      font-weight: 600;
      border-color: var(--platinum-primary, #0f2b46);
    }
    .picker-month-cell.selected:hover {
      background: var(--platinum-primary, #0f2b46);
      opacity: 0.9;
    }

    .picker-year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      padding: 0.25rem 0;
    }
    .picker-year-cell {
      background: none;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 0.55rem 0.25rem;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 500;
      color: #374151;
      text-align: center;
      transition: all 0.15s ease;
    }
    .picker-year-cell:hover {
      background: #f3f4f6;
      border-color: #e5e7eb;
    }
    .picker-year-cell.current {
      color: var(--platinum-accent, #c9a84c);
      font-weight: 700;
      border-color: var(--platinum-accent, #c9a84c);
    }
    .picker-year-cell.selected {
      background: var(--platinum-primary, #0f2b46);
      color: #fff;
      font-weight: 600;
      border-color: var(--platinum-primary, #0f2b46);
    }
    .picker-year-cell.selected:hover {
      background: var(--platinum-primary, #0f2b46);
      opacity: 0.9;
    }

    .picker-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #f3f4f6;
    }
    .picker-footer-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 500;
      color: #6b7280;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: all 0.15s ease;
    }
    .picker-footer-btn:hover {
      color: var(--platinum-primary, #0f2b46);
      background: #f3f4f6;
    }
    .picker-today-btn {
      color: var(--platinum-accent, #c9a84c);
      font-weight: 600;
    }
    .picker-today-btn:hover {
      color: var(--platinum-primary, #0f2b46);
    }
  `]
})
export class DateInputComponent {
  @Input() value: string = '';
  @Input() inputClass: string = 'form-input';
  @Input() placeholder: string = 'dd/mm/yyyy';
  @Input() testId: string = '';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  private elRef = inject(ElementRef);

  displayValue = signal('');
  isoValue = signal('');
  pickerOpen = signal(false);
  pickerView = signal<PickerView>('days');
  pickerMonth = signal(new Date().getMonth());
  pickerYear = signal(new Date().getFullYear());
  calendarDays = signal<CalendarDay[]>([]);
  decadeStart = signal(Math.floor(new Date().getFullYear() / 12) * 12);
  yearGridItems = signal<number[]>([]);
  selectedYear = signal(new Date().getFullYear());

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  monthsShort = [
    { value: 0, label: 'Jan' }, { value: 1, label: 'Feb' }, { value: 2, label: 'Mar' },
    { value: 3, label: 'Apr' }, { value: 4, label: 'May' }, { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' }, { value: 7, label: 'Aug' }, { value: 8, label: 'Sep' },
    { value: 9, label: 'Oct' }, { value: 10, label: 'Nov' }, { value: 11, label: 'Dec' },
  ];

  ngOnChanges(): void {
    if (this.value) {
      const iso = this.value.split('T')[0];
      this.isoValue.set(iso);
      this.displayValue.set(this.isoToDisplay(iso));
    } else {
      this.isoValue.set('');
      this.displayValue.set('');
    }
  }

  onTextInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    let cleaned = raw.replace(/[^0-9/]/g, '');

    if (cleaned.length === 2 && !cleaned.includes('/')) cleaned += '/';
    if (cleaned.length === 5 && cleaned.split('/').length === 2) cleaned += '/';

    this.displayValue.set(cleaned);

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const iso = this.displayToIso(cleaned);
      if (iso) {
        this.isoValue.set(iso);
        this.valueChange.emit(iso);
      }
    }
  }

  onBlur(): void {
    const val = this.displayValue();
    if (val && !/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      this.displayValue.set('');
      this.isoValue.set('');
      this.valueChange.emit('');
    }
  }

  togglePicker(): void {
    if (this.disabled) return;
    if (this.pickerOpen()) {
      this.pickerOpen.set(false);
      return;
    }
    const iso = this.isoValue();
    if (iso) {
      const parts = iso.split('-');
      this.pickerYear.set(Number(parts[0]));
      this.pickerMonth.set(Number(parts[1]) - 1);
      this.selectedYear.set(Number(parts[0]));
    } else {
      const now = new Date();
      this.pickerYear.set(now.getFullYear());
      this.pickerMonth.set(now.getMonth());
      this.selectedYear.set(now.getFullYear());
    }
    this.pickerView.set('days');
    this.buildCalendar();
    this.pickerOpen.set(true);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.pickerOpen()) return;
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.pickerOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.pickerOpen.set(false);
  }

  switchToMonths(): void {
    this.pickerView.set('months');
  }

  switchToYears(): void {
    const yr = this.pickerYear();
    this.decadeStart.set(Math.floor(yr / 12) * 12);
    this.buildYearGrid();
    this.pickerView.set('years');
  }

  selectMonth(month: number): void {
    this.pickerMonth.set(month);
    this.pickerView.set('days');
    this.buildCalendar();
  }

  selectYear(year: number): void {
    this.pickerYear.set(year);
    this.selectedYear.set(year);
    this.pickerView.set('months');
  }

  prevDecade(): void {
    this.decadeStart.set(this.decadeStart() - 12);
    this.buildYearGrid();
  }

  nextDecade(): void {
    this.decadeStart.set(this.decadeStart() + 12);
    this.buildYearGrid();
  }

  prevYearInMonthView(): void {
    this.pickerYear.set(this.pickerYear() - 1);
  }

  nextYearInMonthView(): void {
    this.pickerYear.set(this.pickerYear() + 1);
  }

  prevMonth(): void {
    let m = this.pickerMonth();
    let y = this.pickerYear();
    m--;
    if (m < 0) { m = 11; y--; }
    this.pickerMonth.set(m);
    this.pickerYear.set(y);
    this.buildCalendar();
  }

  nextMonth(): void {
    let m = this.pickerMonth();
    let y = this.pickerYear();
    m++;
    if (m > 11) { m = 0; y++; }
    this.pickerMonth.set(m);
    this.pickerYear.set(y);
    this.buildCalendar();
  }

  selectDay(day: CalendarDay): void {
    const iso = `${String(day.year).padStart(4, '0')}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    this.isoValue.set(iso);
    this.displayValue.set(this.isoToDisplay(iso));
    this.valueChange.emit(iso);
    this.pickerOpen.set(false);
  }

  clearDate(): void {
    this.isoValue.set('');
    this.displayValue.set('');
    this.valueChange.emit('');
    this.pickerOpen.set(false);
  }

  goToday(): void {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    this.isoValue.set(iso);
    this.displayValue.set(this.isoToDisplay(iso));
    this.valueChange.emit(iso);
    this.pickerOpen.set(false);
  }

  private buildYearGrid(): void {
    const start = this.decadeStart();
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(start + i);
    }
    this.yearGridItems.set(years);
  }

  private buildCalendar(): void {
    const year = this.pickerYear();
    const month = this.pickerMonth();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const selectedIso = this.isoValue();
    let selectedStr = '';
    if (selectedIso) {
      const p = selectedIso.split('-');
      selectedStr = `${Number(p[0])}-${Number(p[1]) - 1}-${Number(p[2])}`;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const key = `${prevYear}-${prevMonth}-${d}`;
      days.push({ day: d, month: prevMonth, year: prevYear, otherMonth: true, isToday: key === todayStr, isSelected: key === selectedStr, key });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`;
      days.push({ day: d, month, year, otherMonth: false, isToday: key === todayStr, isSelected: key === selectedStr, key });
    }

    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const key = `${nextYear}-${nextMonth}-${d}`;
      days.push({ day: d, month: nextMonth, year: nextYear, otherMonth: true, isToday: key === todayStr, isSelected: key === selectedStr, key });
    }

    this.calendarDays.set(days);
  }

  private isoToDisplay(iso: string): string {
    const parts = iso.split('-');
    if (parts.length !== 3) return '';
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  private displayToIso(display: string): string {
    const parts = display.split('/');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (isNaN(d.getTime()) || d.getDate() !== Number(dd) || d.getMonth() !== Number(mm) - 1) return '';
    return `${yyyy}-${mm}-${dd}`;
  }
}

interface CalendarDay {
  day: number;
  month: number;
  year: number;
  otherMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  key: string;
}
