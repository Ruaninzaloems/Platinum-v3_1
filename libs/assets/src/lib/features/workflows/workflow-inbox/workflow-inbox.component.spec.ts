import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowInboxComponent } from './workflow-inbox.component';

describe('WorkflowInboxComponent', () => {
  let component: WorkflowInboxComponent;
  let fixture: ComponentFixture<WorkflowInboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowInboxComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowInboxComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
