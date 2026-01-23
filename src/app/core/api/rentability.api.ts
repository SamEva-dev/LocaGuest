import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environnements/environment.dev';
import { RentabilityInput, RentabilityResult } from '../models/rentability.models';

export interface ComputeRentabilityRequest {
  inputs: RentabilityInput;
  clientCalcVersion?: string;
}

export interface ComputeRentabilityResponse {
  results: RentabilityResult;
  warnings: string[];
  calculationVersion: string;
  inputsHash: string;
  isCertified: boolean;
}

@Injectable({ providedIn: 'root' })
export class RentabilityApi {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/rentability`;

  compute(req: ComputeRentabilityRequest): Observable<ComputeRentabilityResponse> {
    return this.http.post<ComputeRentabilityResponse>(`${this.baseUrl}/compute`, req);
  }
}
