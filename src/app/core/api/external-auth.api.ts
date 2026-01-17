import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.dev';

export interface OAuthProviderInfo {
  name: string;
  displayName: string;
  enabled: boolean;
  iconUrl?: string;
}

export interface OAuthProvidersResponse {
  providers: OAuthProviderInfo[];
}

export interface OAuthConfig {
  clientId?: string;
  appId?: string;
  scope: string;
}

export interface ExternalTokenLoginRequest {
  provider: string;
  token: string;
  accessToken?: string;
}

export interface ExternalUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  pictureUrl?: string;
  provider: string;
  providerId: string;
  organizationId?: string;
  roles: string[];
}

export interface ExternalLoginResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: ExternalUserInfo;
  error?: string;
  isNewUser: boolean;
  requiresRegistration: boolean;
}

@Injectable({ providedIn: 'root' })
export class ExternalAuthApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_AUTH_API}/api/auth/external`;

  /**
   * Get available OAuth providers
   */
  getProviders(): Observable<OAuthProvidersResponse> {
    return this.http.get<OAuthProvidersResponse>(`${this.baseUrl}/providers`);
  }

  /**
   * Get Google OAuth configuration
   */
  getGoogleConfig(): Observable<OAuthConfig> {
    return this.http.get<OAuthConfig>(`${this.baseUrl}/google/config`);
  }

  /**
   * Get Facebook OAuth configuration
   */
  getFacebookConfig(): Observable<OAuthConfig> {
    return this.http.get<OAuthConfig>(`${this.baseUrl}/facebook/config`);
  }

  /**
   * Login with Google ID token
   */
  loginWithGoogle(idToken: string): Observable<ExternalLoginResponse> {
    return this.http.post<ExternalLoginResponse>(`${this.baseUrl}/google`, {
      provider: 'google',
      token: idToken
    });
  }

  /**
   * Login with Facebook access token
   */
  loginWithFacebook(accessToken: string): Observable<ExternalLoginResponse> {
    return this.http.post<ExternalLoginResponse>(`${this.baseUrl}/facebook`, {
      provider: 'facebook',
      token: accessToken,
      accessToken: accessToken
    });
  }
}
