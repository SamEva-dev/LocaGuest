import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Financial } from './financial';

describe('Financial', () => {
  let component: Financial;
  let fixture: ComponentFixture<Financial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Financial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Financial);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
