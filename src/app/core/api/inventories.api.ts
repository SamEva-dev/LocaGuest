import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

/**
 * Condition d'un élément dans l'EDL
 */
export type InventoryCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged';

/**
 * Item dans un EDL d'entrée
 */
export interface InventoryItemDto {
  roomName: string;
  elementName: string;
  category: string;
  condition: InventoryCondition;
  comment?: string;
  photoUrls: string[];
}

/**
 * Comparaison entre entrée et sortie
 */
export interface InventoryComparisonDto {
  roomName: string;
  elementName: string;
  entryCondition: InventoryCondition;
  exitCondition: InventoryCondition;
  hasDegradation: boolean;
  comment?: string;
  photoUrls: string[];
}

/**
 * Dégradation constatée
 */
export interface DegradationDto {
  roomName: string;
  elementName: string;
  description: string;
  isImputedToTenant: boolean;
  estimatedCost: number;
  photoUrls: string[];
}

/**
 * EDL d'entrée complet
 */
export interface InventoryEntryDto {
  id: string;
  propertyId: string;
  roomId?: string;
  contractId: string;
  tenantId: string;
  inspectionDate: string;
  agentName: string;
  tenantPresent: boolean;
  representativeName?: string;
  generalObservations?: string;
  items: InventoryItemDto[];
  photoUrls: string[];
  status: string;
  createdAt: string;
}

/**
 * EDL de sortie complet
 */
export interface InventoryExitDto {
  id: string;
  propertyId: string;
  roomId?: string;
  contractId: string;
  tenantId: string;
  inventoryEntryId: string;
  inspectionDate: string;
  agentName: string;
  tenantPresent: boolean;
  representativeName?: string;
  generalObservations?: string;
  comparisons: InventoryComparisonDto[];
  degradations: DegradationDto[];
  photoUrls: string[];
  totalDeductionAmount: number;
  ownerCoveredAmount?: number;
  financialNotes?: string;
  status: string;
  createdAt: string;
}

/**
 * EDL d'un contrat (entrée + sortie)
 */
export interface ContractInventoriesDto {
  entry?: InventoryEntryDto;
  exit?: InventoryExitDto;
  hasEntry: boolean;
  hasExit: boolean;
}

/**
 * Requête création EDL entrée
 */
export interface CreateInventoryEntryRequest {
  propertyId: string;
  roomId?: string;
  contractId: string;
  inspectionDate: string;
  agentName: string;
  tenantPresent: boolean;
  representativeName?: string;
  generalObservations?: string;
  items: InventoryItemDto[];
  photoUrls: string[];
}

/**
 * Requête création EDL sortie
 */
export interface CreateInventoryExitRequest {
  propertyId: string;
  roomId?: string;
  contractId: string;
  inventoryEntryId: string;
  inspectionDate: string;
  agentName: string;
  tenantPresent: boolean;
  representativeName?: string;
  generalObservations?: string;
  comparisons: InventoryComparisonDto[];
  degradations: DegradationDto[];
  photoUrls: string[];
  ownerCoveredAmount?: number;
  financialNotes?: string;
}

/**
 * Service API pour les États des Lieux
 */
@Injectable({
  providedIn: 'root'
})
export class InventoriesApiService {
  private apiUrl = `${environment.BASE_LOCAGUEST_API}/api/inventories`;

  constructor(private http: HttpClient) {}

  /**
   * Créer un EDL d'entrée
   */
  createEntry(request: CreateInventoryEntryRequest): Observable<InventoryEntryDto> {
    return this.http.post<InventoryEntryDto>(`${this.apiUrl}/entry`, request);
  }

  /**
   * Créer un EDL de sortie
   */
  createExit(request: CreateInventoryExitRequest): Observable<InventoryExitDto> {
    return this.http.post<InventoryExitDto>(`${this.apiUrl}/exit`, request);
  }

  /**
   * Récupérer un EDL d'entrée par ID
   */
  getEntry(id: string): Observable<InventoryEntryDto> {
    return this.http.get<InventoryEntryDto>(`${this.apiUrl}/entry/${id}`);
  }

  /**
   * Récupérer un EDL de sortie par ID
   */
  getExit(id: string): Observable<InventoryExitDto> {
    return this.http.get<InventoryExitDto>(`${this.apiUrl}/exit/${id}`);
  }

  /**
   * Récupérer les EDL d'un contrat
   */
  getByContract(contractId: string): Observable<ContractInventoriesDto> {
    return this.http.get<ContractInventoriesDto>(`${this.apiUrl}/contract/${contractId}`);
  }

  /**
   * Supprimer un EDL d'entrée
   */
  deleteEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/entry/${id}`);
  }

  /**
   * Supprimer un EDL de sortie
   */
  deleteExit(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/exit/${id}`);
  }

  /**
   * Générer le PDF d'un EDL
   */
  generatePdf(id: string, type: 'entry' | 'exit'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf/${type}/${id}`, { 
      responseType: 'blob' 
    });
  }

  /**
   * Envoyer l'EDL par email
   */
  sendEmail(request: {
    inventoryId: string;
    inventoryType: 'Entry' | 'Exit';
    recipientEmail: string;
    recipientName: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/send-email`, request);
  }

  /**
   * Signer électroniquement un EDL
   */
  signInventory(request: {
    inventoryId: string;
    inventoryType: 'Entry' | 'Exit';
    signerRole: 'Tenant' | 'Agent';
    signerName: string;
    signatureData: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/sign`, request);
  }
}
