import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubscriptionService } from './core/services/subscription.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('locaGuest');
  private subscriptionService = inject(SubscriptionService);

  constructor() {
    // Initialiser le service d'abonnement au démarrage
    this.subscriptionService.initialize();
  }
}
