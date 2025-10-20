// core/auth/auth.state.ts
import { Injectable, computed, signal } from '@angular/core';
import { UserDto, AuthTokens } from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthState {

  readonly user = signal<UserDto | null>(null);
  readonly tokens = signal<AuthTokens | null>(null);
  readonly isAuthenticated = computed(() => !!this.tokens()?.accessToken);
}
