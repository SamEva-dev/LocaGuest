import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface AddendumDto {
  id: string;
  contractId: string;
  type: string;
  effectiveDate: string;
  reason: string;
  description: string;
  occupantChanges?: string | null;
  attachedDocumentIds: string[];
  signatureStatus: string;
  signedDate?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface GetAddendumsResponse {
  total: number;
  page: number;
  pageSize: number;
  data: AddendumDto[];
}

export interface MarkAddendumAsSignedRequest {
  signedDateUtc?: string;
  signedBy?: string;
}

export interface UpdateAddendumRequest {
  effectiveDate?: string;
  reason?: string;
  description?: string;
  attachedDocumentIds?: string[];
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AddendumsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/addendums`;

  getAddendum(addendumId: string): Observable<AddendumDto> {
    return this.http.get<AddendumDto>(`${this.baseUrl}/${addendumId}`);
  }

  getAddendums(params?: {
    contractId?: string;
    type?: string;
    signatureStatus?: string;
    page?: number;
    pageSize?: number;
  }): Observable<GetAddendumsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.contractId) httpParams = httpParams.set('contractId', params.contractId);
      if (params.type) httpParams = httpParams.set('type', params.type);
      if (params.signatureStatus) httpParams = httpParams.set('signatureStatus', params.signatureStatus);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<any>(this.baseUrl, { params: httpParams }).pipe(
      map((res: any) => {
        const data = res?.data ?? res?.items ?? res?.Items ?? [];
        const total = res?.total ?? res?.totalCount ?? res?.TotalCount ?? 0;
        const page = res?.page ?? res?.Page ?? 1;
        const pageSize = res?.pageSize ?? res?.PageSize ?? (Array.isArray(data) ? data.length : 0);
        return {
          data: Array.isArray(data) ? data : [],
          total: Number(total ?? 0),
          page: Number(page ?? 1),
          pageSize: Number(pageSize ?? 50)
        } satisfies GetAddendumsResponse;
      })
    );
  }

  markAddendumAsSigned(addendumId: string, request?: MarkAddendumAsSignedRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/${addendumId}/mark-signed`, request || {});
  }

  updateAddendum(addendumId: string, request: UpdateAddendumRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/${addendumId}`, request);
  }

  deleteAddendum(addendumId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${addendumId}`);
  }
}
