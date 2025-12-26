import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MfaComponent } from './mfa';

describe('Mfa', () => {
  let component: MfaComponent;
  let fixture: ComponentFixture<MfaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MfaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MfaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
