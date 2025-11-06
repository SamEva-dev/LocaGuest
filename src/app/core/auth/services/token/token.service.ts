// core/auth/token.service.ts
import { Injectable, signal } from '@angular/core';
import { AuthTokens } from '../../auth.models';

const ACCESS = 'lg.access';
const REFRESH = 'lg.refresh';
const EXPIRES = 'lg.expires';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private _persist = signal<boolean>(false); // rememberMe

  setRememberMe(value: boolean) { this._persist.set(value); }

  save(tokens: AuthTokens) {
    console.log("save tokens", tokens); 
    if (this._persist()) {
      localStorage.setItem(ACCESS, tokens.accessToken);
      tokens.refreshToken && localStorage.setItem(REFRESH, tokens.refreshToken);
      tokens.expiresAtUtc && localStorage.setItem(EXPIRES, tokens.expiresAtUtc);
    }
    // garde en session aussi (optionnel)
    sessionStorage.setItem(ACCESS, tokens.accessToken);
    if (tokens.refreshToken) sessionStorage.setItem(REFRESH, tokens.refreshToken);
    if (tokens.expiresAtUtc) sessionStorage.setItem(EXPIRES, tokens.expiresAtUtc);
  }

  load(): AuthTokens | null {
    const source = sessionStorage.getItem(ACCESS) ? sessionStorage : localStorage;
    const accessToken = source.getItem(ACCESS);
    if (!accessToken) return null;
    return {
      accessToken,
      refreshToken: source.getItem(REFRESH) || undefined,
      expiresAtUtc: source.getItem(EXPIRES) || undefined,
    };
  }

  clear() {
    [localStorage, sessionStorage].forEach(s => {
      s.removeItem(ACCESS); s.removeItem(REFRESH); s.removeItem(EXPIRES);
    });
  }

  get accessToken(): string | null {
    return sessionStorage.getItem(ACCESS) ?? localStorage.getItem(ACCESS);
  }

  decode(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 === 2 ? '==' : b64.length % 4 === 3 ? '=' : '';
      const json = atob(b64 + pad);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
