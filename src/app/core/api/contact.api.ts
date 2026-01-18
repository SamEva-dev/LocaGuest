import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.dev';

export interface SendContactMessageRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface SendContactMessageResponse {
  success: boolean;
  messageId: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Contact`;

  sendMessage(request: SendContactMessageRequest): Observable<SendContactMessageResponse> {
    return this.http.post<SendContactMessageResponse>(this.baseUrl, request);
  }
}
