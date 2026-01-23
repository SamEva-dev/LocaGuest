import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LanguageSwitch } from './language-switch';
import { TranslateService } from '@ngx-translate/core';

describe('LanguageSwitch', () => {
  let component: LanguageSwitch;
  let fixture: ComponentFixture<LanguageSwitch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitch],
      providers: [
        { provide: TranslateService, useValue: { setDefaultLang: () => undefined, use: () => of('fr'), get: (k: any) => of(k), stream: (k: any) => of(k), currentLang: 'fr' } },
      ]
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
