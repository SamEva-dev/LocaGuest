import { computed, Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _currentUser = signal<User | null>(null);

  // Exposition en lecture seule
  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => !!this._currentUser());

  login(email: string, password: string): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user: User = {
          id: '1',
          email,
          name: 'John Doe'
        };
        this._currentUser.set(user);
        resolve(user);
      }, 1000); // simulate API delay
    });
  }

  register(name: string, email: string, password: string): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user: User = {
          id: Date.now().toString(),
          email,
          name
        };
        this._currentUser.set(user);
        resolve(user);
      }, 1500);
    });
  }

  logout(): void {
    this._currentUser.set(null);
  }
}
