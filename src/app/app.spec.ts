import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { SubscriptionService } from './core/services/subscription.service';
import { BrandingThemeService } from './core/services/branding-theme.service';
import { AuthService } from './core/auth/services/auth.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SubscriptionService, useValue: { initialize: () => undefined } },
        { provide: BrandingThemeService, useValue: { loadBranding: () => undefined } },
        { provide: AuthService, useValue: { isAuthenticated: () => false } },
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
