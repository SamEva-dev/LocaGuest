import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface DocumentDto {
  id: string;
  code: string;
  fileName: string;
  filePath: string;
  type: string;
  category: string;
  fileSizeBytes: number;
  description?: string;
  expiryDate?: Date;
  tenantId?: string;
  tenantName?: string;
  propertyId?: string;
  propertyName?: string;
  isArchived: boolean;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class DocumentsApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/documents`;

  getAllDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(`${this.baseUrl}/all`);
  }

  getTenantDocuments(tenantId: string): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(`${this.baseUrl}/tenant/${tenantId}`);
  }

  uploadDocument(formData: FormData): Observable<DocumentDto> {
    return this.http.post<DocumentDto>(`${this.baseUrl}/upload`, formData);
  }

  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${documentId}`, {
      responseType: 'blob'
    });
  }

  dissociateDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${documentId}/dissociate`);
  }

  generateContract(dto: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/generate-contract`, dto, {
      responseType: 'blob'
    });
  }

  exportDocumentsZip(tenantId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/tenant/${tenantId}/export-zip`, {
      responseType: 'blob'
    });
  }
}
