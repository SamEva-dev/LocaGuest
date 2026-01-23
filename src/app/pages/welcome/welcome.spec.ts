import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Welcome } from './welcome';
import { TranslateService } from '@ngx-translate/core';

describe('Welcome', () => {
  let component: Welcome;
  let fixture: ComponentFixture<Welcome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Welcome],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: { setDefaultLang: () => undefined, use: () => of('fr'), get: (k: any) => of(k), stream: (k: any) => of(k) } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Welcome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
