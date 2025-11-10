import { Injectable } from '@angular/core';
import { 
  RentabilityInput, 
  RentabilityResult, 
  YearlyResults, 
  GlobalKPIs 
} from '../models/rentability.models';

@Injectable({
  providedIn: 'root'
})
export class RentabilityCalculatorService {

  /**
   * Calcul principal de la rentabilité
   */
  calculate(input: RentabilityInput): RentabilityResult {
    // Calculs annuels
    const yearlyResults = this.calculateYearlyResults(input);
    
    // KPIs globaux
    const kpis = this.calculateGlobalKPIs(input, yearlyResults);
    
    return {
      input,
      yearlyResults,
      kpis,
      calculatedAt: new Date()
    };
  }

  /**
   * Calcul des résultats année par année
   */
  private calculateYearlyResults(input: RentabilityInput): YearlyResults[] {
    const results: YearlyResults[] = [];
    const horizon = input.exit.holdYears;
    
    let remainingDebt = input.financing.loanAmount;
    let cumulativeCashflow = 0;
    
    for (let year = 1; year <= horizon; year++) {
      const yearResult = this.calculateYear(input, year, remainingDebt, cumulativeCashflow);
      results.push(yearResult);
      
      remainingDebt = yearResult.remainingDebt;
      cumulativeCashflow = yearResult.cumulativeCashflow;
    }
    
    return results;
  }

  /**
   * Calcul pour une année donnée
   */
  private calculateYear(
    input: RentabilityInput,
    year: number,
    previousDebt: number,
    previousCumulativeCashflow: number
  ): YearlyResults {
    
    // === REVENUS ===
    const monthlyRent = this.calculateRent(input.revenues, year);
    const grossAnnualRent = monthlyRent * 12;
    
    // Ajout des revenus complémentaires
    const parkingRevenue = (input.revenues.parkingRent || 0) * 12;
    const storageRevenue = (input.revenues.storageRent || 0) * 12;
    const otherRevenue = input.revenues.otherRevenues || 0;
    
    const grossRevenue = grossAnnualRent + parkingRevenue + storageRevenue + otherRevenue;
    
    // Vacance locative
    const vacancyLoss = grossRevenue * (input.revenues.vacancyRate / 100);
    const netRevenue = grossRevenue - vacancyLoss;
    
    // === CHARGES ===
    const condoFees = input.charges.condoFees * 12 * Math.pow(1 + input.charges.chargesIncrease / 100, year - 1);
    const insurance = input.charges.insurance * 12 * Math.pow(1 + input.charges.chargesIncrease / 100, year - 1);
    const propertyTax = input.charges.propertyTax * Math.pow(1 + input.charges.chargesIncrease / 100, year - 1);
    const management = grossRevenue * (input.charges.managementFees / 100);
    const maintenance = grossRevenue * (input.charges.maintenanceRate / 100);
    
    // CAPEX planifiés
    const capex = input.charges.plannedCapex
      .filter(c => c.year === year)
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalCharges = condoFees + insurance + propertyTax + management + maintenance + capex;
    
    // === FINANCEMENT ===
    const loanResults = this.calculateLoanPayment(input.financing, year, previousDebt);
    
    // === FISCALITÉ ===
    const taxResults = this.calculateTax(input, netRevenue, totalCharges, loanResults.interest, year);
    
    // === CASHFLOW ===
    const cashflowBeforeTax = netRevenue - totalCharges - loanResults.loanPayment;
    const cashflowAfterTax = cashflowBeforeTax - taxResults.tax;
    const cumulativeCashflow = previousCumulativeCashflow + cashflowAfterTax;
    
    return {
      year,
      grossRevenue,
      netRevenue,
      vacancyLoss,
      totalCharges,
      condoFees,
      propertyTax,
      insurance,
      management,
      maintenance,
      capex,
      loanPayment: loanResults.loanPayment,
      interest: loanResults.interest,
      principal: loanResults.principal,
      loanInsurance: loanResults.loanInsurance,
      remainingDebt: loanResults.remainingDebt,
      taxableIncome: taxResults.taxableIncome,
      depreciation: taxResults.depreciation,
      tax: taxResults.tax,
      cashflowBeforeTax,
      cashflowAfterTax,
      cumulativeCashflow
    };
  }

  /**
   * Calcul du loyer avec indexation
   */
  private calculateRent(revenues: RentabilityInput['revenues'], year: number): number {
    let rent = revenues.monthlyRent;
    
    // Indexation annuelle
    if (year > 1) {
      rent = rent * Math.pow(1 + revenues.indexationRate / 100, year - 1);
    }
    
    return rent;
  }

  /**
   * Calcul du remboursement de prêt
   */
  private calculateLoanPayment(
    financing: RentabilityInput['financing'],
    year: number,
    previousDebt: number
  ): {
    loanPayment: number;
    interest: number;
    principal: number;
    loanInsurance: number;
    remainingDebt: number;
  } {
    if (previousDebt <= 0) {
      return {
        loanPayment: 0,
        interest: 0,
        principal: 0,
        loanInsurance: 0,
        remainingDebt: 0
      };
    }
    
    const monthlyRate = financing.interestRate / 100 / 12;
    const totalMonths = financing.duration;
    
    // Mensualité (formule d'amortissement français)
    const monthlyPayment = previousDebt * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    // Assurance emprunteur (sur capital initial ou restant selon convention)
    const monthlyInsurance = financing.loanAmount * (financing.insuranceRate / 100) / 12;
    
    let annualInterest = 0;
    let annualPrincipal = 0;
    let debt = previousDebt;
    
    // Calcul mois par mois pour l'année
    for (let month = 1; month <= 12; month++) {
      const monthInterest = debt * monthlyRate;
      const monthPrincipal = monthlyPayment - monthInterest;
      
      annualInterest += monthInterest;
      annualPrincipal += monthPrincipal;
      debt -= monthPrincipal;
      
      if (debt < 0) debt = 0;
    }
    
    const annualInsurance = monthlyInsurance * 12;
    const annualPayment = monthlyPayment * 12;
    
    return {
      loanPayment: annualPayment,
      interest: annualInterest,
      principal: annualPrincipal,
      loanInsurance: annualInsurance,
      remainingDebt: debt
    };
  }

  /**
   * Calcul de la fiscalité
   */
  private calculateTax(
    input: RentabilityInput,
    netRevenue: number,
    totalCharges: number,
    interest: number,
    year: number
  ): {
    taxableIncome: number;
    depreciation: number;
    tax: number;
  } {
    let taxableIncome = netRevenue - totalCharges - interest;
    let depreciation = 0;
    
    // Amortissements LMNP
    if (input.tax.regime === 'lmnp' && input.tax.depreciationYears) {
      const propertyValue = input.context.purchasePrice - (input.context.landValue || 0);
      const annualDepreciation = propertyValue / input.tax.depreciationYears;
      
      let furnitureDepreciation = 0;
      if (input.context.furnitureCost && input.tax.furnitureDepreciationYears) {
        furnitureDepreciation = input.context.furnitureCost / input.tax.furnitureDepreciationYears;
      }
      
      depreciation = annualDepreciation + furnitureDepreciation;
      taxableIncome -= depreciation;
    }
    
    // Micro-BIC/Foncier
    if (input.tax.regime === 'micro') {
      // Abattement forfaitaire 50%
      taxableIncome = netRevenue * 0.5;
    }
    
    // Déficit foncier
    if (taxableIncome < 0 && input.tax.deficitCarryForward) {
      // Report du déficit (simplifié)
      taxableIncome = 0;
    }
    
    // Calcul de l'impôt
    let tax = 0;
    if (taxableIncome > 0) {
      tax = taxableIncome * (input.tax.marginalTaxRate / 100);
      tax += taxableIncome * (input.tax.socialContributions / 100);
    }
    
    return {
      taxableIncome,
      depreciation,
      tax
    };
  }

  /**
   * Calcul des KPIs globaux
   */
  private calculateGlobalKPIs(input: RentabilityInput, yearlyResults: YearlyResults[]): GlobalKPIs {
    // Investissement initial
    const totalInvestment = input.context.purchasePrice + 
                           input.context.notaryFees + 
                           input.context.renovationCost +
                           (input.context.furnitureCost || 0);
    
    const ownFunds = totalInvestment - input.financing.loanAmount;
    
    // Rendements
    const year1 = yearlyResults[0];
    const grossYield = (year1.grossRevenue / totalInvestment) * 100;
    const netYield = (year1.netRevenue / totalInvestment) * 100;
    const netNetYield = (year1.cashflowAfterTax / totalInvestment) * 100;
    const cashOnCash = (year1.cashflowAfterTax / ownFunds) * 100;
    
    // Ratios
    const capRate = grossYield; // Simplifié
    const dscr = year1.netRevenue / year1.loanPayment;
    const ltv = (input.financing.loanAmount / input.context.purchasePrice) * 100;
    
    // TRI (IRR) - Méthode de Newton
    const cashflows = [-ownFunds, ...yearlyResults.map(y => y.cashflowAfterTax)];
    
    // Valeur de sortie
    const exitPrice = this.calculateExitPrice(input, yearlyResults);
    const lastYear = yearlyResults[yearlyResults.length - 1];
    cashflows[cashflows.length - 1] += exitPrice - lastYear.remainingDebt;
    
    const irr = this.calculateIRR(cashflows);
    
    // VAN (NPV)
    const discountRate = 0.04; // 4% par défaut
    const npv = this.calculateNPV(cashflows, discountRate);
    
    // Break-even
    const breakEvenRent = (year1.totalCharges + year1.loanPayment + year1.tax) / 12;
    
    // Payback
    const paybackYears = this.calculatePayback(yearlyResults);
    
    // Exit
    const purchasePrice = input.context.purchasePrice;
    const capitalGain = exitPrice - purchasePrice;
    const capitalGainsTax = capitalGain * (input.exit.capitalGainsTax / 100);
    const netCapitalGain = capitalGain - capitalGainsTax;
    
    const totalCashflow = yearlyResults.reduce((sum, y) => sum + y.cashflowAfterTax, 0);
    const totalReturn = ((totalCashflow + netCapitalGain) / ownFunds) * 100;
    
    const finalEquity = exitPrice - lastYear.remainingDebt;
    
    return {
      totalInvestment,
      ownFunds,
      grossYield,
      netYield,
      netNetYield,
      cashOnCash,
      capRate,
      dscr,
      ltv,
      irr,
      npv,
      breakEvenRent,
      paybackYears,
      exitPrice,
      capitalGain,
      netCapitalGain,
      totalReturn,
      finalEquity
    };
  }

  /**
   * Calcul du prix de sortie
   */
  private calculateExitPrice(input: RentabilityInput, yearlyResults: YearlyResults[]): number {
    const lastYear = yearlyResults[yearlyResults.length - 1];
    
    switch (input.exit.method) {
      case 'capRate':
        return lastYear.grossRevenue / (input.exit.targetCapRate! / 100);
      
      case 'appreciation':
        return input.context.purchasePrice * 
               Math.pow(1 + input.exit.annualAppreciation! / 100, input.exit.holdYears);
      
      case 'pricePerSqm':
        return input.exit.targetPricePerSqm! * input.context.surface;
      
      default:
        return input.context.purchasePrice;
    }
  }

  /**
   * Calcul du TRI (IRR) par méthode de Newton
   */
  private calculateIRR(cashflows: number[]): number {
    let irr = 0.1; // Valeur initiale 10%
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;
      
      for (let t = 0; t < cashflows.length; t++) {
        npv += cashflows[t] / Math.pow(1 + irr, t);
        dnpv += (-t * cashflows[t]) / Math.pow(1 + irr, t + 1);
      }
      
      const newIrr = irr - npv / dnpv;
      
      if (Math.abs(newIrr - irr) < tolerance) {
        return newIrr * 100;
      }
      
      irr = newIrr;
    }
    
    return irr * 100;
  }

  /**
   * Calcul de la VAN (NPV)
   */
  private calculateNPV(cashflows: number[], discountRate: number): number {
    return cashflows.reduce((npv, cashflow, year) => {
      return npv + cashflow / Math.pow(1 + discountRate, year);
    }, 0);
  }

  /**
   * Calcul du payback (années)
   */
  private calculatePayback(yearlyResults: YearlyResults[]): number {
    let cumulative = 0;
    
    for (let i = 0; i < yearlyResults.length; i++) {
      cumulative += yearlyResults[i].cashflowAfterTax;
      if (cumulative >= 0) {
        return i + 1;
      }
    }
    
    return yearlyResults.length;
  }
}
