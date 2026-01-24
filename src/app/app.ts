import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SubscriptionService } from './core/services/subscription.service';
import { BrandingThemeService } from './core/services/branding-theme.service';
import { AuthService } from './core/auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('locaGuest');
  private subscriptionService = inject(SubscriptionService);
  private brandingThemeService = inject(BrandingThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private isInAppShell = signal(false);

  constructor() {
    this.isInAppShell.set(this.router.url.startsWith('/app'));
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        this.isInAppShell.set(evt.urlAfterRedirects.startsWith('/app'));
      }
    });

    // Initialiser les services authentifiés quand l'utilisateur se connecte
    effect(() => {
      if (this.isInAppShell() && this.authService.isAuthenticated()) {
        this.subscriptionService.initialize();
        this.brandingThemeService.loadBranding();
      }
    });
  }

  ngOnInit() {
    // Nothing to do here - initialization handled by effect when authenticated
  }
}
