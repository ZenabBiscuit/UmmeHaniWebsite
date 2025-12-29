import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WsregistrationComponent } from './wsregistration.component';

describe('Wsregistration', () => {
  let component: WsregistrationComponent;
  let fixture: ComponentFixture<WsregistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WsregistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WsregistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
