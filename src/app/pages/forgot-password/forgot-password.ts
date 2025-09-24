import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [TranslatePipe],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
private translate = inject(TranslateService)
   private auth = inject(AuthService);
  private router = inject(Router);

  isLoading = () => false;

  sendResetLink(email: string) {
    console.log('Envoi du lien de réinitialisation à:', email);
    // TODO: Appeler ton backend ou Firebase Auth pour envoyer le mail
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
