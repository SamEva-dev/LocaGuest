import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth {

  
private auth = inject(AuthService);
  private router = inject(Router);

  tab = signal<'login' | 'register'>('login');
  showPassword = signal(false);
  isLoading = signal(false);


  async login(email: string, password: string) {
    console.log(email, password);
    this.isLoading.set(true);
   // await this.auth.login(email, password);
    this.router.navigate(['/dashboard']);
    this.isLoading.set(false);
  }

  async register(name: string, email: string, password: string) {
    this.isLoading.set(true);
    await this.auth.register(name, email, password);
    this.router.navigate(['/dashboard']);
    this.isLoading.set(false);
  }
}
