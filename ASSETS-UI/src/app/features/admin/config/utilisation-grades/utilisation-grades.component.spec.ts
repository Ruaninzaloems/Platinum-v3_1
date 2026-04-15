import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UtilisationGradesComponent } from './utilisation-grades.component';

describe('UtilisationGradesComponent', () => {
  let component: UtilisationGradesComponent;
  let fixture: ComponentFixture<UtilisationGradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilisationGradesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UtilisationGradesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
