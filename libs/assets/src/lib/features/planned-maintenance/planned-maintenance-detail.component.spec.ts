import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PlannedMaintenanceDetailComponent } from './planned-maintenance-detail.component';
import { ApiService } from '../../core/api.service';

/**
 * Smoke tests for the Planned Maintenance Plan detail form dropdowns.
 *
 * Verifies that:
 *  - ngOnInit calls getMaintTypes and getMaintFrequencies on the API service.
 *  - After successful API responses, the maintTypes and frequencies signals
 *    are non-empty, meaning the Maintenance Type and Frequency <select>
 *    elements in the template will render options rather than being empty.
 *
 * The mocked responses use the camelCase shape produced by
 * MaintTypeController and MaintFrequencyController in ASSETS-API, and
 * match the 5 types / 6 frequencies seeded in SCHEMA_MIGRATION.sql section P.
 */
describe('PlannedMaintenanceDetailComponent — dropdown population', () => {
  let apiSpy: jasmine.SpyObj<ApiService>;

  const SEEDED_MAINT_TYPES = [
    { maintTypeId: 1, maintTypeDesc: 'Preventive',      isCapex: false, enabled: true, sortOrder: 1 },
    { maintTypeId: 2, maintTypeDesc: 'Corrective',      isCapex: false, enabled: true, sortOrder: 2 },
    { maintTypeId: 3, maintTypeDesc: 'Statutory',       isCapex: false, enabled: true, sortOrder: 3 },
    { maintTypeId: 4, maintTypeDesc: 'Condition-Based', isCapex: false, enabled: true, sortOrder: 4 },
    { maintTypeId: 5, maintTypeDesc: 'Predictive',      isCapex: false, enabled: true, sortOrder: 5 },
  ];

  const SEEDED_FREQUENCIES = [
    { frequencyId: 1, frequencyDesc: 'Daily',       intervalDays: 1,   enabled: true, sortOrder: 1 },
    { frequencyId: 2, frequencyDesc: 'Weekly',      intervalDays: 7,   enabled: true, sortOrder: 2 },
    { frequencyId: 3, frequencyDesc: 'Monthly',     intervalDays: 30,  enabled: true, sortOrder: 3 },
    { frequencyId: 4, frequencyDesc: 'Quarterly',   intervalDays: 91,  enabled: true, sortOrder: 4 },
    { frequencyId: 5, frequencyDesc: 'Semi-Annual', intervalDays: 182, enabled: true, sortOrder: 5 },
    { frequencyId: 6, frequencyDesc: 'Annual',      intervalDays: 365, enabled: true, sortOrder: 6 },
  ];

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getMaintTypes',
      'getMaintFrequencies',
      'getPlanProjects',
      'getMaintenanceServiceGroups',
      'getPlannedMaintPlan',
      'getMaintenanceWorkOrdersByPlan',
    ]);

    apiSpy.getMaintTypes.and.returnValue(of(SEEDED_MAINT_TYPES));
    apiSpy.getMaintFrequencies.and.returnValue(of(SEEDED_FREQUENCIES));
    apiSpy.getPlanProjects.and.returnValue(of([]));
    apiSpy.getMaintenanceServiceGroups.and.returnValue(of([]));
    apiSpy.getMaintenanceWorkOrdersByPlan.and.returnValue(of([]));
    apiSpy.getPlannedMaintPlan.and.returnValue(of({ plan: null, schedule: [] }));

    await TestBed.configureTestingModule({
      imports: [PlannedMaintenanceDetailComponent],
      providers: [
        provideAnimations(),
        { provide: ApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
        {
          provide: MatSnackBar,
          useValue: { open: jasmine.createSpy('open') },
        },
      ],
    }).compileComponents();
  });

  it('should call getMaintTypes on init', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    expect(apiSpy.getMaintTypes).toHaveBeenCalledTimes(1);
  });

  it('should call getMaintFrequencies on init', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    expect(apiSpy.getMaintFrequencies).toHaveBeenCalledTimes(1);
  });

  it('should populate maintTypes signal with all 5 seeded types', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.maintTypes().length).toBe(5);
  });

  it('should populate frequencies signal with all 6 seeded frequencies', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.frequencies().length).toBe(6);
  });

  it('should include all 5 seeded maintenance type descriptions in the signal', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    const descs = comp.maintTypes().map((t: any) => t.maintTypeDesc);
    for (const expected of ['Preventive', 'Corrective', 'Statutory', 'Condition-Based', 'Predictive']) {
      expect(descs).toContain(expected);
    }
  });

  it('should include all 6 seeded frequency descriptions in the signal', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    const descs = comp.frequencies().map((f: any) => f.frequencyDesc);
    for (const expected of ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual']) {
      expect(descs).toContain(expected);
    }
  });

  it('maintTypes signal should be non-empty so Maintenance Type dropdown renders options', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.maintTypes().length).toBeGreaterThan(0);
  });

  it('frequencies signal should be non-empty so Frequency dropdown renders options', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.frequencies().length).toBeGreaterThan(0);
  });

  it('Maintenance Type <select> should render at least one <option> in the DOM', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const allOptions = Array.from(el.querySelectorAll<HTMLOptionElement>('option'));
    const typeOptions = allOptions.filter(o =>
      SEEDED_MAINT_TYPES.some(t => o.textContent?.trim() === t.maintTypeDesc)
    );
    expect(typeOptions.length).toBeGreaterThan(0);
  });

  it('Frequency <select> should render at least one <option> in the DOM', () => {
    const fixture = TestBed.createComponent(PlannedMaintenanceDetailComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const allOptions = Array.from(el.querySelectorAll<HTMLOptionElement>('option'));
    const freqOptions = allOptions.filter(o =>
      SEEDED_FREQUENCIES.some(f => o.textContent?.trim() === f.frequencyDesc)
    );
    expect(freqOptions.length).toBeGreaterThan(0);
  });
});
