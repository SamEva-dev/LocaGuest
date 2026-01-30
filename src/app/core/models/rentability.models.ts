// Types de base
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'parking' | 'land';
export type PropertyStrategy = 'bare' | 'furnished' | 'seasonal' | 'coliving' | 'commercial';
export type PropertyState = 'new' | 'good' | 'toRenovate' | 'renovated';
export type InvestmentObjective = 'yield' | 'cashflow' | 'appreciation' | 'taxReduction';
export type TaxRegime = 'micro' | 'real' | 'lmnp' | 'lmp' | 'sci_is' | 'sci_ir';
export type LoanType = 'fixed' | 'variable' | 'mixed';

// Contexte du bien
export interface PropertyContext {
  type: PropertyType;
  location: string;
  surface: number;
  state: PropertyState;
  strategy: PropertyStrategy;
  horizon: number; // années
  objective: InvestmentObjective;
  purchasePrice: number;
  notaryFeesRate?: number;
  notaryFees: number;
  renovationCost: number;
  landValue?: number;
  furnitureCost?: number;
}

// Revenus
export interface RevenueAssumptions {
  monthlyRent: number;
  indexation: 'irl' | 'icc' | 'fixed';
  indexationRate: number; // %
  vacancyRate: number; // %
  seasonalityEnabled: boolean;
  highSeasonMonths?: number[];
  highSeasonMultiplier?: number;
  parkingRent?: number;
  storageRent?: number;
  otherRevenues?: number;
  guaranteedRent?: boolean;
  relocationIncrease?: number; // %
}

// Charges et CAPEX
export interface ChargesAssumptions {
  // Charges récurrentes mensuelles
  condoFees: number;
  insurance: number;
  propertyTax: number; // annuel
  managementFees: number; // % du loyer
  maintenanceRate: number; // % du loyer
  
  // Charges récupérables
  recoverableCharges: number;
  
  // CAPEX planifiés (par année)
  plannedCapex: Array<{
    year: number;
    amount: number;
    description: string;
  }>;
  
  // Augmentation annuelle des charges
  chargesIncrease: number; // %
}

// Financement
export interface FinancingAssumptions {
  loanAmount: number;
  loanType: LoanType;
  interestRate: number; // %
  duration: number; // mois
  insuranceRate: number; // % du capital
  deferredMonths: number;
  deferredType: 'total' | 'partial' | 'none';
  earlyRepaymentPenalty: number; // %
  includeNotaryInLoan: boolean;
  includeRenovationInLoan: boolean;
}

// Fiscalité
export interface TaxAssumptions {
  regime: TaxRegime;
  marginalTaxRate: number; // %
  socialContributions: number; // % (17.2% par défaut)
  
  // Pour LMNP
  depreciationYears?: number;
  furnitureDepreciationYears?: number;
  
  // Pour déficit foncier
  deficitCarryForward?: boolean;
  
  // CRL si applicable
  crlApplicable?: boolean;
}

// Sortie
export interface ExitAssumptions {
  method: 'capRate' | 'appreciation' | 'pricePerSqm';
  targetCapRate?: number;
  annualAppreciation?: number; // %
  targetPricePerSqm?: number;
  sellingCosts: number; // %
  capitalGainsTax: number; // %
  holdYears: number;
}

// Input complet
export interface RentabilityInput {
  context: PropertyContext;
  revenues: RevenueAssumptions;
  charges: ChargesAssumptions;
  financing: FinancingAssumptions;
  tax: TaxAssumptions;
  exit: ExitAssumptions;
  scenarioName?: string;
  scenarioId?: string;
}

// Résultats annuels
export interface YearlyResults {
  year: number;
  
  // Revenus
  grossRevenue: number;
  netRevenue: number;
  vacancyLoss: number;
  
  // Charges
  totalCharges: number;
  condoFees: number;
  propertyTax: number;
  insurance: number;
  management: number;
  maintenance: number;
  capex: number;
  
  // Financement
  loanPayment: number;
  interest: number;
  principal: number;
  loanInsurance: number;
  remainingDebt: number;
  
  // Fiscalité
  taxableIncome: number;
  depreciation: number;
  tax: number;
  
  // Cashflow
  cashflowBeforeTax: number;
  cashflowAfterTax: number;
  cumulativeCashflow: number;
}

// KPIs globaux
export interface GlobalKPIs {
  // Investissement initial
  totalInvestment: number;
  ownFunds: number;
  
  // Rendements
  grossYield: number; // %
  netYield: number; // %
  netNetYield: number; // %
  cashOnCash: number; // %
  
  // Ratios
  capRate: number; // %
  dscr: number;
  ltv: number; // %
  
  // TRI et VAN
  irr: number; // %
  npv: number;
  
  // Autres
  breakEvenRent: number;
  paybackYears: number;
  
  // À l'exit
  exitPrice: number;
  capitalGain: number;
  netCapitalGain: number;
  totalReturn: number; // %
  finalEquity: number;
}

// Résultat complet
export interface RentabilityResult {
  input: RentabilityInput;
  yearlyResults: YearlyResults[];
  kpis: GlobalKPIs;
  calculatedAt: Date;
}

// État du wizard
export type StepStatus = 'idle' | 'valid' | 'invalid' | 'locked';

export interface WizardState {
  currentStep: number;
  steps: {
    [key: number]: StepStatus;
  };
  inputData: Partial<RentabilityInput>;
  result: RentabilityResult | null;
  isDirty: boolean;
  lastSaved: Date | null;
}

// Scénario sauvegardé
export interface RentabilityScenario {
  id: string;
  name: string;
  input: RentabilityInput;
  result?: RentabilityResult;
  isBase: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
