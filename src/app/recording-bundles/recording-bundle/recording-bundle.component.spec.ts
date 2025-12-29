import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingBundleComponent } from './recording-bundle.component';

describe('RecordingBundle', () => {
  let component: RecordingBundleComponent;
  let fixture: ComponentFixture<RecordingBundleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordingBundleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordingBundleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
