import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HealthGradesComponent } from './health-grades.component';

describe('HealthGradesComponent', () => {
  let component: HealthGradesComponent;
  let fixture: ComponentFixture<HealthGradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthGradesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HealthGradesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
