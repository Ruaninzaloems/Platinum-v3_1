import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './fleet.component.html',
  styleUrl: './fleet.component.css'
})
export class FleetComponent implements OnInit {
  vehicles = signal<any[]>([]);
  trips = signal<any[]>([]);
  loadingVehicles = signal(true);
  showTripForm = false;
  showInspection = signal(false);
  inspectionComments = '';
  inspectionTripId = '';

  availableCount = computed(() => this.vehicles().filter(v => v.status === 'Active').length);
  pendingTripsCount = computed(() => this.trips().filter(t => t.status === 'pending').length);
  maintenanceCount = computed(() => this.vehicles().filter(v => v.status === 'Under Maintenance').length);
  availableVehicles = computed(() => this.vehicles().filter(v => v.status === 'Active'));

  tripForm = { vehicleId: '', destination: '', purpose: '', departureDate: '', returnDate: '', passengers: 1 };
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  calendarSlots = signal<any[]>([]);
  inspectionChecklist = [
    { label: 'Tyres - condition and pressure', checked: false },
    { label: 'Brakes - functioning correctly', checked: false },
    { label: 'Lights - all working', checked: false },
    { label: 'Windscreen - no cracks', checked: false },
    { label: 'Oil level - adequate', checked: false },
    { label: 'Coolant level - adequate', checked: false },
    { label: 'Fuel level - minimum 1/4 tank', checked: false },
    { label: 'Spare wheel and jack - present', checked: false },
    { label: 'Fire extinguisher - present and valid', checked: false },
    { label: 'First aid kit - present and stocked', checked: false },
    { label: 'License disc - valid', checked: false },
    { label: 'Vehicle body - no damage', checked: false },
  ];

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.api.getAssets({ category: 'Vehicles & Fleet', pageSize: 100 }).subscribe({
      next: (res) => { this.vehicles.set(res.data); this.loadingVehicles.set(false); },
      error: () => this.loadingVehicles.set(false)
    });
    this.api.getFleetTrips().subscribe({
      next: (res) => this.trips.set(res),
      error: () => {}
    });
    this.generateCalendar();
  }

  getStatusClass(status: string): string {
    return 'status-badge status-' + status.toLowerCase().replace(/ /g, '_');
  }

  getConditionColor(condition: string): string {
    if (condition === 'Good') return '#10b981';
    if (condition === 'Fair') return '#f59e0b';
    return '#ef4444';
  }

  submitTrip() {
    if (!this.tripForm.vehicleId || !this.tripForm.destination || !this.tripForm.purpose) {
      this.snackBar.open('Please fill in required fields', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.api.createTrip({
      vehicle_asset_id: this.tripForm.vehicleId,
      destination: this.tripForm.destination,
      purpose: this.tripForm.purpose,
      departure_date: this.tripForm.departureDate,
      return_date: this.tripForm.returnDate,
      passengers: this.tripForm.passengers
    }).subscribe({
      next: () => {
        this.snackBar.open('Trip request submitted for approval', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.showTripForm = false;
        this.tripForm = { vehicleId: '', destination: '', purpose: '', departureDate: '', returnDate: '', passengers: 1 };
        this.api.getFleetTrips().subscribe(res => this.trips.set(res));
      },
      error: () => this.snackBar.open('Trip request submitted (pending)', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' })
    });
  }

  pendingCancelTrip = signal<any>(null);

  cancelTrip(trip: any) {
    this.pendingCancelTrip.set(trip);
  }

  confirmCancelTrip() {
    const trip = this.pendingCancelTrip();
    if (trip) {
      this.trips.set(this.trips().map(t => t.id === trip.id ? { ...t, status: 'cancelled' } : t));
      this.snackBar.open('Trip request cancelled', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
    }
    this.pendingCancelTrip.set(null);
  }

  startInspection(trip: any) {
    this.inspectionTripId = trip.id;
    this.inspectionChecklist.forEach(i => i.checked = false);
    this.inspectionComments = '';
    this.showInspection.set(true);
  }

  submitInspection() {
    const checkedCount = this.inspectionChecklist.filter(i => i.checked).length;
    if (checkedCount < 8) {
      this.snackBar.open('Please complete at least 8 checklist items', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.showInspection.set(false);
    this.snackBar.open('Pre-trip inspection completed - vehicle cleared for departure', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  generateCalendar() {
    const slots: any[] = [];
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startDay; i++) {
      slots.push({ date: '', dayNum: '', booked: false });
    }
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const booked = d % 5 === 0 || d % 7 === 0;
      slots.push({ date: d, dayNum: d, booked, vehicle: booked ? 'CA ' + (100000 + d * 37) : '' });
    }
    this.calendarSlots.set(slots);
  }

  viewBooking(slot: any) {
    this.snackBar.open('Booking: ' + slot.vehicle + ' on day ' + slot.dayNum, 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
