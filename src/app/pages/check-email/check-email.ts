import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-check-email',
  imports: [TranslatePipe],
  templateUrl: './check-email.html',
  styleUrl: './check-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckEmail {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  type = signal<'verify' | 'reset'>('verify');

  constructor(private translate: TranslateService) {
    translate.setDefaultLang('fr');
    translate.use('fr');

    const email = (this.route.snapshot.queryParamMap.get('email') ?? '').trim();
    const type = (this.route.snapshot.queryParamMap.get('type') ?? '').trim().toLowerCase();

    if (email) this.email.set(email);
    if (type === 'reset') this.type.set('reset');
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
