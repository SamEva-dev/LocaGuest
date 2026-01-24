import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface SubmitSatisfactionSurveyRequest {
  rating: number;
  comment?: string;
}

export interface SubmitSatisfactionSurveyResponse {
  success: boolean;
  responseId: string;
}

@Injectable({ providedIn: 'root' })
export class SatisfactionSurveyApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/SatisfactionSurvey`;

  submit(request: SubmitSatisfactionSurveyRequest): Observable<SubmitSatisfactionSurveyResponse> {
    return this.http.post<SubmitSatisfactionSurveyResponse>(this.baseUrl, request);
  }
}
