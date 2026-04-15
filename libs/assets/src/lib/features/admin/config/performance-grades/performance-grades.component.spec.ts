import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerformanceGradesComponent } from './performance-grades.component';

describe('PerformanceGradesComponent', () => {
  let component: PerformanceGradesComponent;
  let fixture: ComponentFixture<PerformanceGradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceGradesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceGradesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
