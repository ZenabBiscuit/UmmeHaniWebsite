import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bundles } from './bundles';

describe('Bundles', () => {
  let component: Bundles;
  let fixture: ComponentFixture<Bundles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bundles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bundles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
