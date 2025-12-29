import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecregistrationComponent } from './recregistration.component';

describe('Recregistration', () => {
  let component: RecregistrationComponent;
  let fixture: ComponentFixture<RecregistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecregistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecregistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
