import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

// DTOs matching backend
export interface RentabilityScenarioDto {
  id: string;
  name: string;
  isBase: boolean;
  createdAt: string;
  lastModifiedAt?: string;
  input: RentabilityInputDto;
  resultsJson?: string;
}

export interface RentabilityInputDto {
  context: PropertyContextDto;
  revenues: RevenueAssumptionsDto;
  charges: ChargesAssumptionsDto;
  financing: FinancingAssumptionsDto;
  tax: TaxAssumptionsDto;
  exit: ExitAssumptionsDto;
}

export interface PropertyContextDto {
  type: string;
  location: string;
  surface: number;
  state: string;
  strategy: string;
  horizon: number;
  objective: string;
  purchasePrice: number;
  notaryFees: number;
  renovationCost: number;
  landValue?: number;
  furnitureCost?: number;
}

export interface RevenueAssumptionsDto {
  monthlyRent: number;
  indexation: string;
  indexationRate: number;
  vacancyRate: number;
  seasonalityEnabled: boolean;
  highSeasonMultiplier?: number;
  parkingRent?: number;
  storageRent?: number;
  otherRevenues?: number;
  guaranteedRent: boolean;
  relocationIncrease?: number;
}

export interface ChargesAssumptionsDto {
  condoFees: number;
  insurance: number;
  propertyTax: number;
  managementFees: number;
  maintenanceRate: number;
  recoverableCharges: number;
  chargesIncrease: number;
  plannedCapex?: PlannedCapexDto[];
}

export interface PlannedCapexDto {
  year: number;
  amount: number;
  description: string;
}

export interface FinancingAssumptionsDto {
  loanAmount: number;
  loanType: string;
  interestRate: number;
  duration: number;
  insuranceRate: number;
  deferredMonths: number;
  deferredType: string;
  earlyRepaymentPenalty: number;
  includeNotaryInLoan: boolean;
  includeRenovationInLoan: boolean;
}

export interface TaxAssumptionsDto {
  regime: string;
  marginalTaxRate: number;
  socialContributions: number;
  depreciationYears?: number;
  furnitureDepreciationYears?: number;
  deficitCarryForward: boolean;
  crlApplicable: boolean;
}

export interface ExitAssumptionsDto {
  method: string;
  targetCapRate?: number;
  annualAppreciation?: number;
  targetPricePerSqm?: number;
  sellingCosts: number;
  capitalGainsTax: number;
  holdYears: number;
}

export interface SaveScenarioCommand {
  id?: string;
  name: string;
  isBase: boolean;
  input: RentabilityInputDto;
  resultsJson?: string;
}

@Injectable({ providedIn: 'root' })
export class RentabilityScenariosApi {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_LOCAGUEST_API}/api/rentabilityscenarios`;

  getUserScenarios(): Observable<RentabilityScenarioDto[]> {
    return this.http.get<RentabilityScenarioDto[]>(this.baseUrl);
  }

  saveScenario(command: SaveScenarioCommand): Observable<RentabilityScenarioDto> {
    return this.http.post<RentabilityScenarioDto>(this.baseUrl, command);
  }

  deleteScenario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
