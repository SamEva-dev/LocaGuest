import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';
import { TenantListItem } from './tenants.api';

export type PropertyUsageType = 'complete' | 'colocation' | 'airbnb';

export interface PropertyListItem {
  id: string;
  code: string;  // T0001-APP0001
  name: string;
  address: string;
  city: string;
  type: string;
  status: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  surface?: number;
  imageUrl?: string;
  // Nouveau: Type d'utilisation
  propertyUsageType: PropertyUsageType;
  // Pour les colocations
  totalRooms?: number;  // Nombre total de chambres disponibles
  occupiedRooms?: number;  // Nombre de chambres occupées
}

export interface PropertyDetail extends PropertyListItem {
  zipCode?: string;
  country?: string;
  hasElevator: boolean;
  hasParking: boolean;
  floor?: number;
  isFurnished: boolean;
  charges?: number;
  deposit?: number;
  notes?: string;
  imageUrls: string[];
  createdAt: Date;
  createdBy: string;
  // Airbnb specifics
  minimumStay?: number;  // Durée minimum de séjour en jours
  maximumStay?: number;  // Durée maximum de séjour en jours
  pricePerNight?: number;  // Prix par nuit pour Airbnb
  
  // Diagnostics obligatoires
  dpeRating?: string;  // A, B, C, D, E, F, G
  dpeValue?: number;  // kWh/m²/an
  gesRating?: string;  // A, B, C, D, E, F, G
  electricDiagnosticDate?: Date;
  electricDiagnosticExpiry?: Date;
  gasDiagnosticDate?: Date;
  gasDiagnosticExpiry?: Date;
  hasAsbestos?: boolean;
  asbestosDiagnosticDate?: Date;
  erpZone?: string;  // Zone de risques (ERP)
  
  // Informations financières complémentaires
  propertyTax?: number;  // Taxe foncière annuelle
  condominiumCharges?: number;  // Charges de copropriété annuelles
  
  // Informations administratives
  cadastralReference?: string;  // Référence cadastrale
  lotNumber?: string;  // Numéro de lot
  acquisitionDate?: Date;  // Date d'acquisition
  totalWorksAmount?: number;  // Montant total des travaux réalisés
  
  // ✅ NOUVEAU: Chambres pour les colocations
  rooms?: PropertyRoom[];
}

// ✅ NOUVEAU: Interface pour une chambre de colocation
export interface PropertyRoom {
  id: string;
  propertyId: string;
  name: string;
  surface?: number;
  rent: number;
  charges?: number;
  description?: string;
  status: 'Available' | 'Reserved' | 'Occupied';
  currentContractId?: string;
}

// ✅ NOUVEAU: Interface pour créer une chambre
export interface CreatePropertyRoom {
  name: string;
  surface?: number;
  rent: number;
  charges?: number;
  description?: string;
}

export interface Payment {
  id: string;
  code: string;  // T0001-PAY0001
  amount: number;
  paymentDate: Date;
  method: string;
  status: string;
  contractId: string;
}

export interface Contract {
  id: string;
  code: string;  // T0001-CTR0001
  tenantId: string;
  tenantName?: string;
  type: string;
  startDate: Date;
  endDate: Date;
  rent: number;
  charges: number;          // ✅ NOUVEAU - Charges mensuelles
  deposit?: number;
  status: string;           // Draft | Pending | Signed | Active | Expiring | Terminated | Expired | Cancelled
  roomId?: string;          // ✅ NOUVEAU - Pour colocation individuelle
  isConflict: boolean;      // ✅ NOUVEAU - Marqueur conflit
  paymentsCount?: number;
  
  // Informations administratives
  contractType?: string;    // Meublé, Vide, Étudiant, Mobilité, etc.
  noticeEndDate?: Date;     // Date de fin du préavis si congé donné
  
  // Informations financières
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  totalArrears?: number;    // Montant total en retard
  rentDueThisMonth?: number; // Loyer dû ce mois-ci
  paymentMethod?: string;   // Virement, Prélèvement, Carte, Espèces
  
  // État des lieux
  hasInventoryEntry?: boolean;  // EDL entrée réalisé
  hasInventoryExit?: boolean;   // EDL sortie réalisé
  inventoryEntryId?: string;    // ID de l'EDL entrée
  inventoryExitId?: string;     // ID de l'EDL sortie
}

export interface FinancialSummary {
  propertyId: string;
  totalRevenue: number;
  monthlyRent: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Date;
  occupancyRate: number;
  totalPayments: number;
  activeContracts: number;
}

export interface CreateContractDto {
  propertyId: string;  // Sera converti en Guid côté backend
  tenantId: string;    // Sera converti en Guid côté backend
  type: string;
  startDate: string;   // Format ISO 8601 pour l'API
  endDate: string;     // Format ISO 8601 pour l'API
  rent: number;
  deposit?: number;
  notes?: string;
}

export interface CreatePropertyDto {
  name: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
  type: string;
  surface: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number | null;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  rent: number;
  charges?: number;
  description?: string;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  energyClass?: string;
  constructionYear?: number | null;
  // Nouveau: Type d'utilisation
  propertyUsageType: PropertyUsageType;
  // Pour les colocations
  totalRooms?: number;
  rooms?: CreatePropertyRoom[];  // ✅ NOUVEAU: Liste des chambres pour colocation
  // Pour Airbnb
  minimumStay?: number;
  maximumStay?: number;
  pricePerNight?: number;
}

export interface UpdatePropertyDto extends Partial<CreatePropertyDto> {}

export interface PaginatedResult<T> {
  totalCount: number;
  page: number;
  pageSize: number;
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class PropertiesApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/properties`;

  getProperties(params?: {
    status?: string;
    city?: string;
    search?: string;
    propertyUsageType?: PropertyUsageType;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<PropertyListItem>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.city) httpParams = httpParams.set('city', params.city);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.propertyUsageType) httpParams = httpParams.set('propertyUsageType', params.propertyUsageType);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    return this.http.get<PaginatedResult<PropertyListItem>>(this.baseUrl, { params: httpParams });
  }

  getProperty(id: string): Observable<PropertyDetail> {
    console.log('Fetching property with ID:', id);
    return this.http.get<PropertyDetail>(`${this.baseUrl}/${id}`);
  }

  getPropertyPayments(id: string, from?: Date, to?: Date): Observable<Payment[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from.toISOString());
    if (to) params = params.set('to', to.toISOString());
    return this.http.get<Payment[]>(`${this.baseUrl}/${id}/payments`, { params });
  }

  getPropertyContracts(id: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/${id}/contracts`);
  }

  getFinancialSummary(id: string): Observable<FinancialSummary> {
    return this.http.get<FinancialSummary>(`${this.baseUrl}/${id}/financial-summary`);
  }

  createProperty(dto: CreatePropertyDto): Observable<PropertyDetail> {
    return this.http.post<PropertyDetail>(`${environment.BASE_LOCAGUEST_API}/api/properties`, dto);
  }

  updateProperty(id: string, dto: UpdatePropertyDto): Observable<PropertyDetail> {
    return this.http.put<PropertyDetail>(`${environment.BASE_LOCAGUEST_API}/api/properties/${id}`, { ...dto, id });
  }

  updatePropertyStatus(id: string, status: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.baseUrl}/${id}/status`, { propertyId: id, status });
  }

  deleteProperty(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.BASE_LOCAGUEST_API}/api/properties/${id}`);
  }

  getAvailableTenants(propertyId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${propertyId}/available-tenants`);
  }

  assignTenant(propertyId: string, contractDto: CreateContractDto): Observable<Contract> {
    return this.http.post<Contract>(`${this.baseUrl}/${propertyId}/assign-tenant`, contractDto);
  }

  dissociateTenant(propertyId: string, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${propertyId}/dissociate-tenant/${tenantId}`);
  }

  getAssociatedTenants(propertyId: string): Observable<TenantListItem[]> {
    return this.http.get<TenantListItem[]>(`${this.baseUrl}/${propertyId}/associated-tenants`);
  }
}
