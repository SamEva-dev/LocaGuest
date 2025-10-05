import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSwitch } from './language-switch';

describe('LanguageSwitch', () => {
  let component: LanguageSwitch;
  let fixture: ComponentFixture<LanguageSwitch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguageSwitch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
