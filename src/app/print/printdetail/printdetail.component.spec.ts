import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintdetailComponent } from './printdetail.component';

describe('Printdetail', () => {
  let component: PrintdetailComponent;
  let fixture: ComponentFixture<PrintdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintdetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
