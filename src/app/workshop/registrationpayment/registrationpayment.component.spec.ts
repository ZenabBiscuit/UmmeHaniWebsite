import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationpaymentComponent } from './registrationpayment.component';

describe('Registrationpayment', () => {
  let component: RegistrationpaymentComponent;
  let fixture: ComponentFixture<RegistrationpaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationpaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationpaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
