import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environnements/environment.prod';

/** Petit utilitaire pour corrélation */
function newCorrelationId() {
  // minimaliste, suffit pour tracer côté serveur
  return crypto?.randomUUID?.() ?? `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Options communes des appels */
export interface ApiOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  context?: HttpContext;
  etag?: string;          // If-Match / If-None-Match
  observeJson?: boolean;  // par défaut true
  withCredentials?: boolean; // par défaut false (Bearer)
}

/**
 * LocaGuestApi
 * - Centralise baseUrl, en-têtes, corrélation, ETag (If-Match / If-None-Match), retry backoff, mapping d'erreurs
 * - L’auth Bearer est gérée par l’interceptor (Authorization)
 * - Ajoute X-Correlation-Id, X-Client, X-App-Version
 * - Prépare X-Tenant-Id si tu es multi-tenant (ex: pris d’un state)
 */
@Injectable({ providedIn: 'root' })
export class LocaGuestApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.BASE_LOCAGUEST_API}/api/v1`;

  /** backoff exponentiel basique */
  private backoff<T>(maxRetry = 2, baseDelayMs = 300) {
    return retry<T>({
      count: maxRetry,
      delay: (err, retryIndex) => timer(baseDelayMs * Math.pow(2, retryIndex)),
      resetOnSuccess: true,
    });
  }

  private buildHeaders(opts?: ApiOptions): HttpHeaders {
    let h = new HttpHeaders({
      'Accept': 'application/json',
      'X-Correlation-Id': newCorrelationId(),
      'X-Client': 'locaguest-web',
      'X-App-Version': 'web-1.0.0',
      // 'X-Tenant-Id': 'default-tenant', // si multi-tenant, branche depuis un State
      ...(opts?.headers ?? {}),
    });
    if (opts?.etag) {
      // Si on a un etag : on préfère If-Match pour update conditionnel, If-None-Match pour cache
      // Ici on laisse le consommateur choisir via opts.headers s'il veut If-None-Match
      if (!h.has('If-Match') && !h.has('If-None-Match')) {
        h = h.set('If-Match', opts.etag);
      }
    }
    return h;
  }

  private buildParams(opts?: ApiOptions): HttpParams {
    let p = new HttpParams();
    if (opts?.params) {
      Object.entries(opts.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) p = p.set(k, String(v));
      });
    }
    return p;
  }

  private buildUrl(path: string) {
    if (!path) return this.base;
    return path.startsWith('http') ? path : `${this.base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private handleError(err: HttpErrorResponse) {
    // Mapping d’erreurs orienté sécurité
    if (err.status === 401) {
      // non authentifié → l’interceptor/guard gère souvent le refresh-then-logout
      return throwError(() => err);
    }
    if (err.status === 403) {
      // interdit → serveur applique bien l’ACL (bonne pratique)
      return throwError(() => err);
    }
    if (err.status === 409 || err.status === 412) {
      // Conflit / Precondition failed (ETag)
      return throwError(() => err);
    }
    return throwError(() => err);
  }

  get<T>(path: string, opts?: ApiOptions): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), {
      headers: this.buildHeaders(opts),
      params: this.buildParams(opts),
      withCredentials: opts?.withCredentials ?? false,
      context: opts?.context,
    }).pipe(this.backoff(), catchError(e => this.handleError(e)));
  }

  /** GET qui renvoie data + etag (si serveur renvoie ETag) */
  getWithETag<T>(path: string, opts?: ApiOptions): Observable<{ data: T; etag?: string }> {
    return this.http.get<T>(this.buildUrl(path), {
      headers: this.buildHeaders(opts),
      params: this.buildParams(opts),
      withCredentials: opts?.withCredentials ?? false,
      context: opts?.context,
      observe: 'response'
    }).pipe(
      this.backoff(),
      map(resp => {
        const etag = resp.headers.get('ETag') ?? undefined;
        return { data: resp.body as T, etag };
      }),
      catchError(e => this.handleError(e))
    );
  }

  post<T>(path: string, body: unknown, opts?: ApiOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body, {
      headers: this.buildHeaders(opts),
      params: this.buildParams(opts),
      withCredentials: opts?.withCredentials ?? false,
      context: opts?.context,
    }).pipe(this.backoff(), catchError(e => this.handleError(e)));
  }

  put<T>(path: string, body: unknown, opts?: ApiOptions): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body, {
      headers: this.buildHeaders(opts),
      params: this.buildParams(opts),
      withCredentials: opts?.withCredentials ?? false,
      context: opts?.context,
    }).pipe(this.backoff(), catchError(e => this.handleError(e)));
  }

   getFile(path: string): Observable<Blob> {
    return this.http.get(`${this.base}${path}`, {
      headers: this.buildHeaders(),
      responseType: 'blob'
    });
  }

  /** PUT conditionnel (concurrence optimiste) */
  putIfMatch<T>(path: string, body: unknown, etag: string, opts?: ApiOptions): Observable<T> {
    return this.put<T>(path, body, { ...(opts ?? {}), etag });
  }

  delete<T>(path: string, opts?: ApiOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path), {
      headers: this.buildHeaders(opts),
      params: this.buildParams(opts),
      withCredentials: opts?.withCredentials ?? false,
      context: opts?.context,
    }).pipe(this.backoff(), catchError(e => this.handleError(e)));
  }
}
