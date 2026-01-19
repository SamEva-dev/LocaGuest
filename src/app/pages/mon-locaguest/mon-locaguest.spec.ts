import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonLocaGuest } from './mon-locaguest';

describe('MonLocaGuest', () => {
  let component: MonLocaGuest;
  let fixture: ComponentFixture<MonLocaGuest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonLocaGuest]
    }).compileComponents();

    fixture = TestBed.createComponent(MonLocaGuest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
