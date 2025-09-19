import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Profitability } from './profitability';

describe('Profitability', () => {
  let component: Profitability;
  let fixture: ComponentFixture<Profitability>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profitability]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Profitability);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
