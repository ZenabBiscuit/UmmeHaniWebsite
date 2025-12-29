import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prints } from './prints';

describe('Prints', () => {
  let component: Prints;
  let fixture: ComponentFixture<Prints>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prints]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Prints);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
