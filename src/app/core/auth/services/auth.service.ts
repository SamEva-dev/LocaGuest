import { inject, Injectable, signal } from '@angular/core';
import { AuthApi } from '../../api/auth.api';
import { TokenService } from './token/token.service';
import { AuthState } from '../auth.state';
import { LoginRequest, LoginResponse, MfaLoginRequest, RegisterRequest, RegisterResponse, UserDto } from '../auth.models';
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

  private getBackendErrorMessage(err: any): string | null {
    const body = err?.error;
    if (!body) return null;
    if (typeof body === 'string') return body;
    if (typeof body.error === 'string' && body.error.trim().length > 0) return body.error;
    if (typeof body.message === 'string' && body.message.trim().length > 0) return body.message;
    if (typeof body.title === 'string' && body.title.trim().length > 0) return body.title;
    return null;
  }

  // Computed signals

  private normalizeToArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(v => typeof v === 'string') as string[];
    if (typeof value === 'string') return [value];
    return [];
  }

  private buildUserFromAccessToken(accessToken: string, res?: LoginResponse): UserDto | null {
    const payload = this.tokens.decode(accessToken);
    if (!payload || typeof payload !== 'object') return null;

    const organizationId = (payload.organization_id ?? payload.tenant_id) as string | undefined;
    if (!organizationId) return null;

    const roleClaim = payload.role ?? payload.roles;
    const permClaim = payload.permission ?? payload.permissions;

    const roles = this.normalizeToArray(roleClaim);
    const permissions = this.normalizeToArray(permClaim);

    const mfaEnabledRaw = payload.mfa_enabled ?? payload.mfa;
    const mfaEnabled = mfaEnabledRaw === true || mfaEnabledRaw === 'true';

    return {
      id: payload.sub,
      email: payload.email,
      fullName: res?.user?.fullName || `${payload.email}`,
      organizationId,
      roles,
      permissions,
      mfaEnabled,
    };
  }

  bootstrapFromStorage() {
    const t = this.tokens.load();
    if (t) {
      this.state.tokens.set(t);

      const user = this.buildUserFromAccessToken(t.accessToken);
      if (user) {
        this.state.user.set(user);
      } else {
        // Token invalide/incomplet => repartir clean
        this.logout();
      }
    }
  }

  setRememberMe(value: boolean) { this.tokens.setRememberMe(value); }

   async login(email: string, password: string): Promise<void> {
    try {
      const res = await this.api.login({ email, password } as LoginRequest).toPromise();
      if (!res) throw new Error('No response from API');
      if (res.requiresMfa) {
      this.mfaPendingUser.set(res.user || null);
      throw new Error('MFA required');
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

  async register(request: RegisterRequest): Promise<void> {
    try {
      const res = await this.api.register(request).toPromise();
      if (!res) throw new Error('No response from API');
      void res;
    } catch (err: any) {
      console.error('❌ Register error:', err);
      const backendMessage = this.getBackendErrorMessage(err);
      if (backendMessage) {
        this.toast.errorDirect(backendMessage);
      } else {
        this.toast.error('AUTH.REGISTER_FAILED');
      }
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
    throw new Error('Deprecated MFA flow: use verify2FA/verifyRecoveryCode from login page flow.');
  }

  logout() {
    this.tokens.clear();
    this.state.tokens.set(null);
    this.state.user.set(null);
    this.mfaPendingUser.set(null);
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

  /**
   * Check if user is authenticated (for guards)
   */
  async checkAuth(): Promise<boolean> {
    // Vérifier si on a des tokens
    const tokens = this.state.tokens();
    if (!tokens?.accessToken) return false;
    
    // Vérifier si le token n'est pas expiré
    if (tokens.expiresAtUtc) {
      const expiry = new Date(tokens.expiresAtUtc);
      if (expiry < new Date()) {
        // Token expiré, essayer de rafraîchir
        return await this.refreshIfNeeded();
      }
    }
    
    // Vérifier si on a un user
    const user = this.state.user();
    return !!user;
  }

  applyLogin(res: LoginResponse) {
    // Créer l'objet AuthTokens attendu par TokenService
    const authTokens = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAtUtc: new Date(Date.now() + (res.expiresIn * 1000)).toISOString()
    };
    
    this.tokens.save(authTokens);
    this.state.tokens.set(authTokens);

    // Reset persisted internal tab so post-login defaults to Dashboard (summary)
    try {
      localStorage.removeItem('lg.internal.activeTab');
    } catch {}

    const user = this.buildUserFromAccessToken(res.accessToken, res);
    if (!user) {
      this.logout();
      return;
    }
    this.state.user.set(user);
  }
}
