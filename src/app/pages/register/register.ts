import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
 private translate = inject(TranslateService)
 private auth = inject(AuthService);
 private router = inject(Router);

 showPassword = signal(false);
  isLoading = signal(false);

  async register(name: string, email: string, password: string) {
    this.isLoading.set(true);
    await this.auth.register(name, email, password);
    this.router.navigate(['/dashboard']);
    this.isLoading.set(false);
  }

  goToLogin() {
  this.router.navigate(['/login']);
}

}
