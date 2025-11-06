import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environnements/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  CurrentUserResponse,
  JwtPayload,
  AuthUser
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = environment.BASE_AUTH_API;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly REMEMBER_ME_KEY = 'remember_me';

  // Signals pour l'état d'authentification
  private _currentUser = signal<AuthUser | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);
  private _rememberMe = signal<boolean>(false);

  // Computed signals
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = this._isAuthenticated.asReadonly();
  isLoading = this._isLoading.asReadonly();
  
  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole = computed(() => (role: string) => {
    return this._currentUser()?.roles.includes(role) ?? false;
  });

  // Vérifier si l'utilisateur a une permission spécifique
  hasPermission = computed(() => (permission: string) => {
    return this._currentUser()?.permissions.includes(permission) ?? false;
  });

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialiser l'authentification au démarrage de l'application
   */
  private async initializeAuth(): Promise<void> {
    const token = this.getAccessToken();
    const rememberMe = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    this._rememberMe.set(rememberMe);

    if (token) {
      // Vérifier si le token est valide
      if (this.isTokenValid(token)) {
        try {
          await this.loadCurrentUser();
        } catch (error) {
          console.error('Failed to load current user:', error);
          this.clearAuth();
        }
      } else {
        // Token expiré, essayer de le rafraîchir
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          try {
            await this.refreshToken();
          } catch (error) {
            console.error('Failed to refresh token:', error);
            this.clearAuth();
          }
        } else {
          this.clearAuth();
        }
      }
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  async login(email: string, password: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const request: LoginRequest = { email, password };
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.API_URL}/api/auth/login`, request)
      );

      if (response.requiresMfa) {
        // TODO: Gérer le flux MFA
        throw new Error('MFA not implemented yet');
      }

      this.storeTokens(response.accessToken, response.refreshToken);
      await this.loadCurrentUser();
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    this._isLoading.set(true);
    try {
      return await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.API_URL}/api/register`, request)
      );
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      // Appeler l'endpoint de logout si disponible
      const token = this.getAccessToken();
      if (token) {
        await firstValueFrom(
          this.http.post(`${this.API_URL}/api/auth/logout`, {})
        ).catch(() => {
          // Ignorer les erreurs de logout côté serveur
        });
      }
    } finally {
      this.clearAuth();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const request: RefreshTokenRequest = { refreshToken };
    const response = await firstValueFrom(
      this.http.post<RefreshTokenResponse>(`${this.API_URL}/api/auth/refresh`, request)
    );

    this.storeTokens(response.accessToken, response.refreshToken);
  }

  /**
   * Charger les informations de l'utilisateur courant
   */
  private async loadCurrentUser(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<CurrentUserResponse>(`${this.API_URL}/api/auth/me`)
      );

      const user: AuthUser = {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        fullName: `${response.firstName} ${response.lastName}`,
        roles: response.roles,
        permissions: response.permissions,
        mfaEnabled: response.mfaEnabled
      };

      this._currentUser.set(user);
      this._isAuthenticated.set(true);
    } catch (error) {
      console.error('Failed to load current user:', error);
      throw error;
    }
  }

  /**
   * Stocker les tokens
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    const storage = this._rememberMe() ? localStorage : sessionStorage;
    storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Récupérer le token d'accès
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY) || 
           sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Récupérer le refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || 
           sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Décoder le JWT sans vérification de signature (côté client)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Vérifier si le token est valide (non expiré)
   */
  isTokenValid(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  /**
   * Obtenir le temps restant avant expiration (en secondes)
   */
  getTokenExpirationTime(token: string): number | null {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  /**
   * Définir le mode "Se souvenir de moi"
   */
  setRememberMe(remember: boolean): void {
    this._rememberMe.set(remember);
    localStorage.setItem(this.REMEMBER_ME_KEY, remember.toString());
  }

  /**
   * Nettoyer l'authentification
   */
  private clearAuth(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  /**
   * Vérifier si l'utilisateur est authentifié (pour les guards)
   */
  async checkAuth(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    if (this.isTokenValid(token)) {
      if (!this._currentUser()) {
        try {
          await this.loadCurrentUser();
        } catch {
          return false;
        }
      }
      return true;
    }

    // Token expiré, essayer de rafraîchir
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.refreshToken();
        await this.loadCurrentUser();
        return true;
      } catch {
        this.clearAuth();
        return false;
      }
    }

    this.clearAuth();
    return false;
  }
}
