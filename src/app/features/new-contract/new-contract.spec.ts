import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewContract } from './new-contract';

describe('NewContract', () => {
  let component: NewContract;
  let fixture: ComponentFixture<NewContract>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewContract]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewContract);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
