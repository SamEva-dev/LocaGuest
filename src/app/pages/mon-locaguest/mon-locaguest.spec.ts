import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MonLocaGuest } from './mon-locaguest';
import { InternalTabManagerService } from '../../core/services/internal-tab-manager.service';
import { MonLocaGuestTourService } from './mon-locaguest-tour.service';
import { TranslateService } from '@ngx-translate/core';

describe('MonLocaGuest', () => {
  let component: MonLocaGuest;
  let fixture: ComponentFixture<MonLocaGuest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonLocaGuest],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: { setDefaultLang: () => undefined, use: () => of('fr'), get: (k: any) => of(k), stream: (k: any) => of(k) } },
        { provide: InternalTabManagerService, useValue: { activeTab: () => null, setActiveTab: () => undefined, closeTab: () => undefined } },
        { provide: MonLocaGuestTourService, useValue: { start: () => undefined } },
      ]
    })
      .overrideTemplate(MonLocaGuest, '')
      .compileComponents();

    fixture = TestBed.createComponent(MonLocaGuest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
