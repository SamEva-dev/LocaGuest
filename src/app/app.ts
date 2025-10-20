import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { Welcome } from './pages/welcome/welcome';
import { AuthService } from './core/auth/services/auth.service';
import { TokenExpirationService } from './core/auth/services/token/token-expiration.service';
import { SessionMonitorService } from './core/auth/services/session-monitor.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('locaGuest');

  private readonly auth = inject(AuthService);
  private readonly tokenWatcher = inject(TokenExpirationService);
  private readonly sessionMonitor = inject(SessionMonitorService);


  ngOnInit() {
    this.auth.bootstrapFromStorage();
    //this.tokenWatcher.startMonitor();
    this.sessionMonitor.start();
  }

  
}
