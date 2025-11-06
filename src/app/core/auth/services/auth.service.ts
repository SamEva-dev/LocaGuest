import { inject, Injectable, signal } from '@angular/core';
import { AuthApi } from '../../api/auth.api';
import { TokenService } from './token/token.service';
import { AuthState } from '../auth.state';
import { LoginRequest, LoginResponse, MfaLoginRequest, RegisterRequest, UserDto } from '../auth.models';
import { ToastService } from '../../ui/toast.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(AuthApi);
  private state = inject(AuthState);
  private tokens = inject(TokenService);
    private toast = inject(ToastService);
    mfaPendingUser = signal<UserDto | null>(null);
   private router = inject(Router);
  user = this.state.user.asReadonly();
  isAuthenticated = this.state.isAuthenticated;

  bootstrapFromStorage() {
    const t = this.tokens.load();
    if (t) this.state.tokens.set(t);
  }

  setRememberMe(value: boolean) { this.tokens.setRememberMe(value); }

   async login(email: string, password: string): Promise<void> {
    try {
      const res = await this.api.login({ email, password } as LoginRequest).toPromise();
      if (!res) throw new Error('No response from API');
      if (res.requiresMfa) {
      this.mfaPendingUser.set(res.user || null);
      this.router.navigate(['/mfa']);
    } else {
      this.applyLogin(res);
    }
      this.toast.success('AUTH.LOGIN_SUCCESS');
    } catch (err: any) {
      if (err.status === 401) {
        this.toast.error('AUTH.INVALID_CREDENTIALS');
      } else if (err.status === 423) {
        this.toast.error('AUTH.ACCOUNT_LOCKED');
      } else {
        this.toast.error('COMMON.ERROR');
      }
      throw err; // permet au composant de gérer aussi s’il le souhaite
    }
  }

  async register(fullName: string, email: string, password: string): Promise<void> {
    try {
      const res = await this.api
        .register({ fullName, email, password } as RegisterRequest)
        .toPromise();
      if (!res) throw new Error('No response from API');
      this.applyLogin(res);
      this.toast.success('AUTH.REGISTER_SUCCESS');
    } catch (err: any) {
      this.toast.error('AUTH.REGISTER_FAILED');
      throw err;
    }
  }

  async refreshIfNeeded(): Promise<boolean> {
    const current = this.state.tokens();
    if (!current?.refreshToken) return false;
    try {
      const res = await this.api.refresh(current.refreshToken).toPromise();
      if (!res) return false;
      this.applyLogin(res);
      return true;
    } catch {
      this.toast.error('AUTH.SESSION_EXPIRED');
      this.logout();
      return false;
    }
  }

   async forgotPassword(email: string): Promise<void> {
    try {
      await this.api.forgotPassword(email).toPromise();
      this.toast.success('AUTH.RESET_LINK_SENT');
    } catch {
      this.toast.error('AUTH.RESET_LINK_FAILED');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.api.resetPassword(token, newPassword).toPromise();
      this.toast.success('AUTH.RESET_SUCCESS');
    } catch {
      this.toast.error('AUTH.RESET_FAILED');
    }
  }

   async validateEmail(token: string): Promise<void> {
    try {
      await this.api.validateEmail(token).toPromise();
      this.toast.success('AUTH.EMAIL_VALIDATED');
    } catch {
      this.toast.error('AUTH.EMAIL_VALIDATION_FAILED');
    }
  }

  async verifyMfa(req: MfaLoginRequest) {
    try {
      const res = await this.api.verifyMfa(req).toPromise();
      if (!res) throw new Error('No response from API');  
      this.applyLogin(res);
      this.mfaPendingUser.set(null);
      this.toast.success('AUTH.LOGIN_SUCCESS');
    } catch (err: any) {
      if (err.status === 401) {
        this.toast.error('AUTH.INVALID_MFA_CODE');
      } else {
        this.toast.error('COMMON.ERROR');
      }
      throw err;
    }
  }

  logout() {
    this.tokens.clear();
    this.state.tokens.set(null);
    this.state.user.set(null);
    this.mfaPendingUser.set(null);
    localStorage.clear();
   // this.router.navigate(['/login']);
    this.toast.info('AUTH.LOGOUT_SUCCESS');
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.state.tokens()?.accessToken ?? null;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.state.user();
    if (!user) return false;
    return user.permissions?.includes(permission) ?? false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.state.user();
    if (!user) return false;
    return user.roles?.includes(role) ?? false;
  }

  private applyLogin(res: LoginResponse) {
    // Créer l'objet AuthTokens attendu par TokenService
    const authTokens = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAtUtc: new Date(Date.now() + (res.expiresIn * 1000)).toISOString()
    };
    
    this.tokens.save(authTokens);
    this.state.tokens.set(authTokens);

    try {
      const token = res.accessToken;
      const parts = token.split('.');
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 === 2 ? '==' : b64.length % 4 === 3 ? '=' : '';
      const json = atob(b64 + pad);
      const payload = JSON.parse(json);

      const roleClaim = payload.role ?? payload.roles;
      const permClaim = payload.permission ?? payload.permissions;
      const roles = Array.isArray(roleClaim) ? roleClaim : (roleClaim ? [roleClaim] : []);
      const permissions = Array.isArray(permClaim) ? permClaim : (permClaim ? [permClaim] : []);

      const user = {
        id: payload.sub,
        email: payload.email,
        fullName: res.user?.fullName || `${payload.email}`,
        roles,
        permissions,
        mfaEnabled: payload.mfa_enabled === 'true'
      };
      this.state.user.set(user);
      console.log('JWT payload', payload);
    } catch {
      // En cas d'erreur de décodage, créer un utilisateur minimal
      const fallbackUser = {
        id: 'unknown',
        email: res.user?.email || 'unknown@example.com',
        fullName: res.user?.fullName || 'Unknown User',
        roles: [],
        permissions: [],
        mfaEnabled: false
      };
      this.state.user.set(fallbackUser);
    }
  }
}
