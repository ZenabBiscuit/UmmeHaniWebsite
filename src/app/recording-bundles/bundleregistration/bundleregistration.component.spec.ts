import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleregistrationComponent } from './bundleregistration.component';

describe('Bundleregistration', () => {
  let component: BundleregistrationComponent;
  let fixture: ComponentFixture<BundleregistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BundleregistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundleregistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
