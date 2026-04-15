import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CriticalityGradesComponent } from './criticality-grades.component';

describe('CriticalityGradesComponent', () => {
  let component: CriticalityGradesComponent;
  let fixture: ComponentFixture<CriticalityGradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriticalityGradesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CriticalityGradesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
