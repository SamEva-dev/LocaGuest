import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';
import { 
  DocumentDto, 
  MarkDocumentAsSignedRequest, 
  ContractDocumentsStatusDto 
} from '../models/documents.models';
import { ContractViewerDto } from '../models/contract-viewer.models';

// Re-export pour compatibilité avec le code existant
export type { DocumentDto, MarkDocumentAsSignedRequest, ContractDocumentsStatusDto };

export interface DocumentCategory {
  category: string;
  count: number;
  documents: DocumentDto[];
}

@Injectable({ providedIn: 'root' })
export class DocumentsApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Documents`;

  getAllDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(`${this.baseUrl}/all`);
  }

  getTenantDocuments(tenantId: string): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(`${this.baseUrl}/occupant/${tenantId}`);
  }

  getPropertyDocuments(propertyId: string): Observable<DocumentCategory[]> {
    return this.http.get<DocumentCategory[]>(`${this.baseUrl}/property/${propertyId}`);
  }

  uploadDocument(formData: FormData): Observable<DocumentDto> {
    return this.http.post<DocumentDto>(`${this.baseUrl}/upload`, formData);
  }

  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${documentId}`, {
      responseType: 'blob'
    });
  }

  getDownloadUrl(documentId: string): string {
    return `${this.baseUrl}/download/${documentId}`;
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
    return this.http.get(`${this.baseUrl}/occupant/${tenantId}/export-zip`, {
      responseType: 'blob'
    });
  }

  /**
   * Récupérer un document par son ID
   */
  getDocument(documentId: string): Observable<DocumentDto> {
    return this.http.get<DocumentDto>(`${this.baseUrl}/${documentId}`);
  }

  /**
   * Marquer un document comme signé
   */
  markDocumentAsSigned(
    documentId: string, 
    request?: MarkDocumentAsSignedRequest
  ): Observable<{ message: string; id: string; status: string; signedDate?: string }> {
    return this.http.put<{ message: string; id: string; status: string; signedDate?: string }>(
      `${this.baseUrl}/${documentId}/mark-signed`,
      request || {}
    );
  }

  /**
   * Récupérer le statut des documents d'un contrat
   */
  getContractDocumentsStatus(contractId: string): Observable<ContractDocumentsStatusDto> {
    return this.http.get<ContractDocumentsStatusDto>(
      `${this.baseUrl}/contract/${contractId}/status`
    );
  }

  getContractViewer(contractId: string): Observable<ContractViewerDto> {
    return this.http.get<ContractViewerDto>(
      `${this.baseUrl}/contract/${contractId}/viewer`
    );
  }

  downloadPropertySheet(propertyId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/property/${propertyId}/sheet`, {
      responseType: 'blob'
    });
  }

  downloadTenantSheet(tenantId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/occupant/${tenantId}/sheet`, {
      responseType: 'blob'
    });
  }
}
