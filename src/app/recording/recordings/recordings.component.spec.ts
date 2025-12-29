import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingsComponent } from './recordings.component';

describe('Recordings', () => {
  let component: RecordingsComponent;
  let fixture: ComponentFixture<RecordingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
