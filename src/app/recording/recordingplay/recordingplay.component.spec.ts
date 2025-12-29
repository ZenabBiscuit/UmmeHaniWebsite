import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingplayComponent } from './recordingplay.component';

describe('Recordingplay', () => {
  let component: RecordingplayComponent;
  let fixture: ComponentFixture<RecordingplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordingplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordingplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
