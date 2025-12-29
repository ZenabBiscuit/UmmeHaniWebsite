import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingdetailComponent } from './recordingdetail.component';

describe('Recordingdetail', () => {
  let component: RecordingdetailComponent;
  let fixture: ComponentFixture<RecordingdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordingdetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordingdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
