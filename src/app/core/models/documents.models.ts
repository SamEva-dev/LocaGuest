/**
 * Models pour la gestion des documents locatifs
 */

export interface TenantDocument {
  id?: string;
  tenantId: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  expiryDate?: Date;
  url?: string;
  description?: string;
  status?: DocumentStatus;
}

export interface GenerateContractDto {
  tenantId: string;
  propertyId: string;
  contractType: DocumentType;
  startDate: string;
  endDate: string;
  rent: number;
  deposit?: number;
  charges?: number;
  additionalClauses?: string;
  isThirdPartyLandlord: boolean;
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

export type DocumentType = 
  | 'CNI' 
  | 'PASSPORT' 
  | 'ASSURANCE' 
  | 'BAIL' 
  | 'AVENANT' 
  | 'ETAT_LIEUX_ENTREE' 
  | 'ETAT_LIEUX_SORTIE'
  | 'ATTESTATION_EMPLOI'
  | 'BULLETIN_SALAIRE'
  | 'AVIS_IMPOSITION'
  | 'OTHER';

/**
 * Statut d'un document
 */
export type DocumentStatus = 
  | 'Draft'      // Brouillon, peut être modifié
  | 'Validated'  // Validé, modifications limitées
  | 'Signed'     // Signé, modifications interdites
  | 'Completed'  // Terminé
  | 'Archived';  // Archivé

/**
 * Statut d'un contrat
 */
export type ContractStatus = 
  | 'Draft'          // Brouillon, documents non créés ou non signés
  | 'PartialSigned'  // Certains documents signés mais pas tous
  | 'FullySigned'    // Tous les documents requis signés
  | 'Active'         // Actif
  | 'Expiring'       // Expire bientôt
  | 'Terminated'     // Résilié
  | 'Completed'      // Terminé (legacy)
  | 'Archived'       // Archivé
  | 'Cancelled';     // Annulé

/**
 * Rôles utilisateurs pour la gestion des permissions
 * TODO: À implémenter lors de l'ajout du système de rôles dans l'UI
 */
export type UserRole = 
  | 'SuperAdmin'      // Accès complet
  | 'TenantOwner'     // Propriétaire
  | 'PropertyManager' // Gestionnaire
  | 'Agent'          // Agent
  | 'Viewer'         // Lecture seule
  | 'Tenant';        // Locataire

export interface DocumentTemplate {
  type: DocumentType;
  label: string;
  icon: string;
  color: string;
  requiresExpiry: boolean;
}

export interface TenantInfo {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  propertyId?: string;
  propertyCode?: string;
  contracts?: ContractInfo[];
}

export interface ContractInfo {
  id: string;
  tenantId: string;
  propertyId: string;
  propertyName?: string;
  propertyCode?: string;
  type: string;
  startDate: Date | string;
  endDate: Date | string;
  rent: number;
  deposit?: number;
  charges?: number;
  status: ContractStatus;
  signedDate?: Date | string;
  createdAt: Date | string;
}

export interface ContractType {
  value: DocumentType;
  label: string;
  icon: string;
  description: string;
}

export interface UploadForm {
  type: DocumentType | '';
  file: File | null;
  expiryDate: string;
  description: string;
}

export interface ContractForm {
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  charges: number;
  additionalClauses: string;
  isThirdPartyLandlord: boolean;
  landlordCompanyName: string;
  landlordFirstName: string;
  landlordLastName: string;
  landlordAddress: string;
  landlordSiret: string;
  landlordEmail: string;
  landlordPhone: string;
}

export interface DocumentCategory {
  type: DocumentType[];
  label: string;
  icon: string;
  showEmpty: boolean;
}

/**
 * Document DTO complet avec statut de signature
 */
export interface DocumentDto {
  id: string;
  code: string;
  fileName: string;
  filePath?: string;
  type: DocumentType | string;
  category: string;
  status: DocumentStatus;
  fileSizeBytes: number;
  contractId?: string;
  tenantId?: string;
  tenantName?: string;
  propertyId?: string;
  propertyName?: string;
  description?: string;
  expiryDate?: string | Date;
  signedDate?: string;
  signedBy?: string;
  createdAt: string | Date;
  isArchived: boolean;
}

/**
 * Request pour marquer un document comme signé
 */
export interface MarkDocumentAsSignedRequest {
  signedDate?: string;
  signedBy?: string;
}

/**
 * Document requis pour un contrat
 */
export interface RequiredDocumentDto {
  type: DocumentType;
  isRequired: boolean;
  isProvided: boolean;
  isSigned: boolean;
  documentInfo?: {
    id: string;
    fileName: string;
    status: DocumentStatus;
    signedDate?: string;
    createdAt: string;
  };
}

/**
 * Statut des documents d'un contrat
 */
export interface ContractDocumentsStatusDto {
  contractId: string;
  contractStatus: ContractStatus;
  requiredDocuments: RequiredDocumentDto[];
  allRequiredSigned: boolean;
}
