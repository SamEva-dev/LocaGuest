import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment.prod';

export interface GenerateContractRequest {
  contractId?: string;
  tenantId: string;
  propertyId: string;
  contractType: 'Bail' | 'Avenant' | 'Colocation' | 'EtatDesLieuxEntree' | 'EtatDesLieuxSortie';
  // ✅ Champs obligatoires pour la génération
  startDate: string | Date;
  endDate: string | Date;
  rent: number;
  deposit?: number | null;
  charges?: number | null;
  additionalClauses?: string;
  isThirdPartyLandlord?: boolean;
  landlordInfo?: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    siret?: string;
    email?: string;
    phone?: string;
  };
}

export interface SendForSignatureRequest {
  recipients: SignatureRecipient[];
  message?: string;
  expirationDays?: number;
}

export interface SignatureRecipient {
  email: string;
  name: string;
  signingOrder?: number;
}

export interface DocumentUploadResponse {
  id: string;
  code: string;
  fileName: string;
  fileSizeBytes: number;
}

export interface SignatureResponse {
  message: string;
  documentId: string;
  fileName: string;
  recipients: number;
  status: string;
  envelopeId?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/documents`;

  /**
   * Génère le PDF d'un contrat
   * @param request Informations du contrat à générer
   * @returns Le fichier PDF en Blob
   */
  generateContractPdf(request: GenerateContractRequest): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/generate-contract`, request, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }

  /**
   * Upload un document PDF (contrat papier signé par exemple)
   * @param file Le fichier PDF à uploader
   * @param type Type du document (ex: "Bail")
   * @param category Catégorie (ex: "Contrats")
   * @param contractId ID du contrat associé (optionnel)
   * @param tenantId ID du locataire (optionnel)
   * @param propertyId ID du bien (optionnel)
   * @param description Description du document
   * @returns Informations sur le document uploadé
   */
  uploadDocument(
    file: File,
    type: string,
    category: string,
    contractId?: string,
    tenantId?: string,
    propertyId?: string,
    description?: string
  ): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('category', category);
    
    if (contractId) formData.append('contractId', contractId);
    if (tenantId) formData.append('tenantId', tenantId);
    if (propertyId) formData.append('propertyId', propertyId);
    if (description) formData.append('description', description);

    return this.http.post<DocumentUploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Envoie un document pour signature électronique
   * @param documentId ID du document à signer
   * @param request Informations des destinataires
   * @returns Statut de l'envoi
   */
  sendForElectronicSignature(
    documentId: string,
    request: SendForSignatureRequest
  ): Observable<SignatureResponse> {
    return this.http.post<SignatureResponse>(
      `${this.baseUrl}/${documentId}/send-for-signature`,
      request
    );
  }

  /**
   * Télécharge un document
   * @param documentId ID du document
   * @returns Le fichier en Blob
   */
  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${documentId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Récupère les documents d'un contrat
   * @param contractId ID du contrat
   * @returns Liste des documents du contrat
   */
  getContractDocuments(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contract/${contractId}/status`);
  }

  /**
   * Marque un document comme signé
   * @param documentId ID du document
   * @param signedDate Date de signature (optionnelle)
   * @param signedBy Nom du signataire (optionnel)
   * @returns Confirmation
   */
  markDocumentAsSigned(
    documentId: string,
    signedDate?: string,
    signedBy?: string
  ): Observable<{ message: string; id: string; status: string; signedDate?: string }> {
    return this.http.put<any>(`${this.baseUrl}/${documentId}/mark-signed`, {
      signedDate,
      signedBy
    });
  }
}
