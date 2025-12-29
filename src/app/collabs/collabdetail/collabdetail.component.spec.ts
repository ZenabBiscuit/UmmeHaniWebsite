import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollabdetailComponent } from './collabdetail.component';

describe('CollabdetailComponent', () => {
  let component: CollabdetailComponent;
  let fixture: ComponentFixture<CollabdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollabdetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollabdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
