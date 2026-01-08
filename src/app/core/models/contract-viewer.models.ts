export interface ContractViewerDto {
  contract: {
    id: string;
    code?: string;
    status: string;
    type: string;
    startDate: string;
    endDate: string;
    rent: number;
    charges?: number;
    deposit?: number;
    roomId?: string | null;
    notes?: string | null;
    terminationDate?: string | null;
    terminationReason?: string | null;
    createdAt?: string | null;
  };
  effective?: {
    contractId: string;
    dateUtc: string;
    rent: number;
    charges: number;
    startDate: string;
    endDate: string;
    roomId?: string | null;
    customClauses?: string | null;
    participants: Array<{
      renterTenantId: string;
      shareType: string;
      shareValue: number;
      startDate: string;
      endDate?: string | null;
    }>;
    appliedAddendumIds: string[];
  } | null;
  nextSignedChange?: {
    id: string;
    type: string;
    effectiveDate: string;
    newRent?: number | null;
    newCharges?: number | null;
    newEndDate?: string | null;
    newRoomId?: string | null;
  } | null;
  tenant: {
    id: string;
    code?: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
  };
  property: {
    id: string;
    code?: string;
    name: string;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
  };
  documentsStatus: {
    contractId: string;
    contractStatus: string;
    allRequiredSigned: boolean;
    requiredDocuments: Array<{
      type: string;
      isRequired: boolean;
      isProvided: boolean;
      isSigned: boolean;
      documentInfo?: {
        id: string;
        fileName: string;
        status: string;
        signedDate?: string;
        createdAt?: string;
      } | null;
    }>;
  };
}
