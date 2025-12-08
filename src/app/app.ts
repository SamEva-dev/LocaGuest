import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubscriptionService } from './core/services/subscription.service';
import { BrandingThemeService } from './core/services/branding-theme.service';

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

  constructor() {
    // Initialiser le service d'abonnement au démarrage
    this.subscriptionService.initialize();
  }

  ngOnInit() {
    // Load branding theme on app startup
    this.brandingThemeService.loadBranding();
  }
}
