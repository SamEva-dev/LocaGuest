import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
 constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }
 private auth = inject(AuthService);
 private router = inject(Router);

 showPassword = signal(false);
  isLoading = signal(false);

  async register(name: string, email: string, password: string) {
    this.isLoading.set(true);
    try {
      await this.auth.register(name, email, password);
      this.router.navigate(['/dashboard']);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
  this.router.navigate(['/login']);
}

}
