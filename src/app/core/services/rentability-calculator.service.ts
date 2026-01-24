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

  private readonly DEFAULT_DISCOUNT_RATE = 6; // %
  readonly calcVersion = 'front-1.1.0';

  /**
   * Calcul principal de la rentabilité
   */
  calculate(input: RentabilityInput): RentabilityResult {
    const yearlyResults = this.calculateYearlyResults(input);
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

    const horizon = this.clampInt(input.exit?.holdYears ?? input.context?.horizon ?? 10, 1, 60);

    const loan = this.computeLoanSchedule({
      principal: this.money(input.financing?.loanAmount ?? 0),
      annualRatePct: this.clampPct(input.financing?.interestRate ?? 0),
      totalMonths: this.clampInt(input.financing?.duration ?? 0, 0, 1200),
      annualInsuranceRatePct: this.clampPct(input.financing?.insuranceRate ?? 0),
      yearsToCompute: horizon,
    });

    let cumulativeCashflow = this.money(0);

    for (let year = 1; year <= horizon; year++) {
      const yr = this.calculateYear(input, year, loan, cumulativeCashflow);
      results.push(yr);
      cumulativeCashflow = yr.cumulativeCashflow;
    }

    return results;
  }

  /**
   * Calcul pour une année donnée
   */
  private calculateYear(
    input: RentabilityInput,
    year: number,
    loan: { yearly: Array<{ payment: number; insurance: number; interest: number; principal: number; remainingDebt: number }> },
    previousCumulativeCashflow: number
  ): YearlyResults {
    const annualIndexFactor = Math.pow(1 + this.clampPct(input.revenues?.indexationRate ?? 0) / 100, year - 1);

    const monthlyRent = this.money(input.revenues?.monthlyRent ?? 0) * annualIndexFactor;
    const otherMonthly = this.money(
      (input.revenues?.parkingRent ?? 0) + (input.revenues?.storageRent ?? 0) + (input.revenues?.otherRevenues ?? 0)
    ) * annualIndexFactor;

    const grossRevenue = this.money((monthlyRent + otherMonthly) * 12);
    const vacancyRate = this.clampPct(input.revenues?.vacancyRate ?? 0);
    const vacancyLoss = this.money(grossRevenue * (vacancyRate / 100));
    const netRevenue = this.money(grossRevenue - vacancyLoss);

    const chargesIncrease = this.clampPct(input.charges?.chargesIncrease ?? 0);
    const opexFactor = Math.pow(1 + chargesIncrease / 100, year - 1);

    const condoFees = this.money((input.charges?.condoFees ?? 0) * 12 * opexFactor);
    const insurance = this.money((input.charges?.insurance ?? 0) * 12 * opexFactor);
    const propertyTax = this.money((input.charges?.propertyTax ?? 0) * opexFactor);

    const managementFeesRate = this.clampPct(input.charges?.managementFees ?? 0);
    const maintenanceRate = this.clampPct(input.charges?.maintenanceRate ?? 0);

    const management = this.money(netRevenue * (managementFeesRate / 100));
    const maintenance = this.money(netRevenue * (maintenanceRate / 100));

    const recoverableCharges = this.money((input.charges?.recoverableCharges ?? 0) * 12 * opexFactor);

    const capex = this.money(
      (input.charges?.plannedCapex ?? [])
        .filter(c => c?.year === year)
        .reduce((sum, c) => sum + (c?.amount ?? 0), 0)
    );

    const totalCharges = this.money(
      condoFees + insurance + propertyTax + management + maintenance + capex - recoverableCharges
    );

    const loanLine = loan.yearly[year - 1] ?? {
      payment: 0,
      insurance: 0,
      interest: 0,
      principal: 0,
      remainingDebt: 0,
    };

    const loanPayment = this.money(loanLine.payment);
    const loanInsurance = this.money(loanLine.insurance);
    const interest = this.money(loanLine.interest);
    const principal = this.money(loanLine.principal);
    const remainingDebt = this.money(loanLine.remainingDebt);

    const taxResults = this.calculateTax(input, netRevenue, totalCharges, interest);

    const cashflowBeforeTax = this.money(netRevenue - totalCharges - loanPayment - loanInsurance);
    const cashflowAfterTax = this.money(cashflowBeforeTax - taxResults.tax);
    const cumulativeCashflow = this.money(previousCumulativeCashflow + cashflowAfterTax);

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

      loanPayment,
      interest,
      principal,
      loanInsurance,
      remainingDebt,

      taxableIncome: this.money(taxResults.taxableIncome),
      depreciation: this.money(taxResults.depreciation),
      tax: this.money(taxResults.tax),

      cashflowBeforeTax,
      cashflowAfterTax,
      cumulativeCashflow,
    };
  }

  /**
   * Calcul de la fiscalité
   */
  private calculateTax(
    input: RentabilityInput,
    netRevenue: number,
    totalCharges: number,
    interest: number
  ): {
    taxableIncome: number;
    depreciation: number;
    tax: number;
  } {
    const regime = (input.tax?.regime ?? 'real').toLowerCase();
    const marginalTaxRate = this.clampPct(input.tax?.marginalTaxRate ?? 0);
    const socialContrib = this.clampPct(input.tax?.socialContributions ?? 0);
    const deficitCarryForward = !!input.tax?.deficitCarryForward;

    let taxableIncome = this.money(netRevenue - totalCharges - interest);
    let depreciation = 0;

    if (regime === 'micro') {
      taxableIncome = this.money(netRevenue * 0.5);
      depreciation = 0;
    } else if (regime === 'lmnp') {
      const depreciationYears = this.clampInt(input.tax?.depreciationYears ?? 25, 1, 60);
      const furnitureDepYears = this.clampInt(input.tax?.furnitureDepreciationYears ?? 7, 1, 60);
      const landValue = this.money(input.context?.landValue ?? 0);
      const purchasePrice = this.money(input.context?.purchasePrice ?? 0);
      const furnitureCost = this.money(input.context?.furnitureCost ?? 0);

      const buildingBase = this.money(Math.max(0, purchasePrice - landValue));
      const buildingDepAnnual = depreciationYears > 0 ? this.money(buildingBase / depreciationYears) : 0;
      const furnitureDepAnnual = furnitureDepYears > 0 ? this.money(furnitureCost / furnitureDepYears) : 0;

      depreciation = this.money(buildingDepAnnual + furnitureDepAnnual);

      // Cap LMNP : ne pas créer un taxable négatif via amortissement
      taxableIncome = this.money(Math.max(0, taxableIncome - depreciation));
    } else {
      if (!deficitCarryForward) {
        taxableIncome = this.money(Math.max(0, taxableIncome));
      }
    }

    const tax = this.money(
      taxableIncome <= 0 ? 0 : taxableIncome * ((marginalTaxRate + socialContrib) / 100)
    );

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
    const purchasePrice = this.money(input.context?.purchasePrice ?? 0);
    const notaryFees = this.money(input.context?.notaryFees ?? 0);
    const renovationCost = this.money(input.context?.renovationCost ?? 0);
    const furnitureCost = this.money(input.context?.furnitureCost ?? 0);

    const totalInvestment = this.money(purchasePrice + notaryFees + renovationCost + furnitureCost);
    const loanAmount = this.money(input.financing?.loanAmount ?? 0);
    const ownFunds = this.money(totalInvestment - loanAmount);

    const year1 = yearlyResults[0];

    const grossYield = totalInvestment > 0 ? this.round((year1.grossRevenue / totalInvestment) * 100, 2) : 0;
    const netYield = totalInvestment > 0 ? this.round((year1.netRevenue / totalInvestment) * 100, 2) : 0;
    const netNetYield = totalInvestment > 0
      ? this.round(((year1.netRevenue - year1.totalCharges - year1.loanInsurance) / totalInvestment) * 100, 2)
      : 0;
    const cashOnCash = Math.abs(ownFunds) < 1e-12 ? 0 : this.round((year1.cashflowAfterTax / ownFunds) * 100, 2);

    // NOI (hors dette, hors capex) et DSCR
    const recoverableCharges = this.money((input.charges?.recoverableCharges ?? 0) * 12);
    const noi = this.money(
      year1.netRevenue - (year1.condoFees + year1.insurance + year1.propertyTax + year1.management + year1.maintenance - recoverableCharges)
    );
    const debtService = this.money(year1.loanPayment + year1.loanInsurance);
    const dscr = debtService > 0 ? this.round(noi / debtService, 2) : 0;

    const capRate = grossYield;
    const ltv = purchasePrice > 0 ? this.round((loanAmount / purchasePrice) * 100, 2) : 0;

    const cashflows: number[] = [];
    cashflows.push(this.money(-Math.max(0, ownFunds))); // t0 : apport
    for (const y of yearlyResults) cashflows.push(this.money(y.cashflowAfterTax));

    const exitPrice = this.money(this.calculateExitPrice(input, yearlyResults));
    const lastYear = yearlyResults[yearlyResults.length - 1];

    const sellingCostsAmount = this.money(exitPrice * (this.clampPct(input.exit?.sellingCosts ?? 0) / 100));
    const capitalGain = this.money(Math.max(0, exitPrice - purchasePrice));
    const capitalGainsTax = this.money(capitalGain * (this.clampPct(input.exit?.capitalGainsTax ?? 0) / 100));
    const terminalNet = this.money(exitPrice - sellingCostsAmount - capitalGainsTax - this.money(lastYear.remainingDebt));

    cashflows[cashflows.length - 1] = this.money(cashflows[cashflows.length - 1] + terminalNet);

    const irr = this.round(this.irr(cashflows) * 100, 2);
    const npv = this.money(this.npv(this.DEFAULT_DISCOUNT_RATE / 100, cashflows));

    const breakEvenRent = this.money((year1.totalCharges + year1.loanPayment + year1.loanInsurance + year1.tax) / 12);
    const paybackYears = this.computePayback(Math.max(0, ownFunds), yearlyResults.map(y => y.cashflowAfterTax));

    const exitNetOfAllCosts = this.money(exitPrice - sellingCostsAmount - capitalGainsTax);
    const netCapitalGain = this.money(exitNetOfAllCosts - purchasePrice);

    const totalCashflow = this.money(yearlyResults.reduce((sum, y) => sum + this.money(y.cashflowAfterTax), 0));
    const totalReturn = Math.abs(ownFunds) < 1e-12
      ? 0
      : this.round(((totalCashflow + terminalNet + Math.max(0, ownFunds)) / Math.max(0, ownFunds)) * 100 - 100, 2);

    const finalEquity = this.money(exitNetOfAllCosts - this.money(lastYear.remainingDebt));

    const safeIrr = Number.isFinite(irr) ? irr : 0;
    const safeNpv = Number.isFinite(npv) ? npv : 0;

    return {
      totalInvestment: this.money(totalInvestment),
      ownFunds: this.money(ownFunds),

      grossYield,
      netYield,
      netNetYield,
      cashOnCash,

      capRate,
      dscr: Number.isFinite(dscr) ? dscr : 0,
      ltv,

      irr: safeIrr,
      npv: safeNpv,

      breakEvenRent,
      paybackYears,

      exitPrice,
      capitalGain,
      netCapitalGain,
      totalReturn,
      finalEquity,
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


  private computeLoanSchedule(args: {
    principal: number;
    annualRatePct: number;
    totalMonths: number;
    annualInsuranceRatePct: number;
    yearsToCompute: number;
  }) {
    const P0 = this.money(args.principal);
    const rMonthly = (args.annualRatePct / 100) / 12;
    const n = this.clampInt(args.totalMonths, 0, 1200);

    const monthlyPayment = this.money(this.monthlyPayment(P0, rMonthly, n));

    const annualInsurance = this.money(P0 * (args.annualInsuranceRatePct / 100));
    const monthlyInsurance = this.money(annualInsurance / 12);

    let balance = P0;

    const yearly = Array.from({ length: args.yearsToCompute }, () => ({
      payment: 0,
      insurance: 0,
      interest: 0,
      principal: 0,
      remainingDebt: 0,
    }));

    const monthsToCompute = Math.min(n, args.yearsToCompute * 12);

    for (let m = 1; m <= monthsToCompute; m++) {
      const yIndex = Math.floor((m - 1) / 12);
      if (yIndex >= yearly.length) break;

      const interest = this.money(balance * rMonthly);
      const principalPart = this.money(Math.min(monthlyPayment - interest, balance));
      balance = this.money(balance - principalPart);

      yearly[yIndex].payment = this.money(yearly[yIndex].payment + monthlyPayment);
      yearly[yIndex].insurance = this.money(yearly[yIndex].insurance + monthlyInsurance);
      yearly[yIndex].interest = this.money(yearly[yIndex].interest + interest);
      yearly[yIndex].principal = this.money(yearly[yIndex].principal + principalPart);
      yearly[yIndex].remainingDebt = balance;
    }

    for (let y = 0; y < yearly.length; y++) {
      yearly[y].remainingDebt = this.money(yearly[y].remainingDebt);
    }

    return { monthlyPayment, yearly };
  }

  private monthlyPayment(principal: number, rMonthly: number, nMonths: number) {
    if (principal <= 0 || nMonths <= 0) return 0;
    if (Math.abs(rMonthly) < 1e-12) return principal / nMonths;
    const pow = Math.pow(1 + rMonthly, nMonths);
    return principal * (rMonthly * pow) / (pow - 1);
  }

  private computePayback(ownFunds: number, yearlyCashflows: number[]): number {
    if (ownFunds <= 0) return 0;

    let cum = -ownFunds;
    for (let i = 0; i < yearlyCashflows.length; i++) {
      const cf = this.money(yearlyCashflows[i]);
      const prev = cum;
      cum = this.money(cum + cf);

      if (cum >= 0) {
        const needed = -prev;
        if (Math.abs(cf) < 1e-9) return this.round(i + 1, 2);
        const frac = needed / cf;
        return this.round(i + frac, 2);
      }
    }

    return Infinity;
  }

  private npv(rate: number, cashflows: number[]): number {
    let total = 0;
    for (let t = 0; t < cashflows.length; t++) {
      total += cashflows[t] / Math.pow(1 + rate, t);
    }
    return total;
  }

  private irr(cashflows: number[]): number {
    let guess = 0.10;
    for (let i = 0; i < 50; i++) {
      const { f, df } = this.irrFn(cashflows, guess);
      if (Math.abs(df) < 1e-12) break;
      const next = guess - f / df;
      if (!Number.isFinite(next)) break;
      if (Math.abs(next - guess) < 1e-10) return next;
      guess = next;
    }

    let low = -0.99;
    let high = 5.0;
    let fLow = this.irrFn(cashflows, low).f;
    let fHigh = this.irrFn(cashflows, high).f;

    if (fLow * fHigh > 0) return NaN;

    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const fMid = this.irrFn(cashflows, mid).f;
      if (Math.abs(fMid) < 1e-10) return mid;
      if (fLow * fMid < 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }

    return (low + high) / 2;
  }

  private irrFn(cashflows: number[], r: number) {
    let f = 0;
    let df = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const denom = Math.pow(1 + r, t);
      f += cashflows[t] / denom;
      if (t > 0) {
        df += -t * cashflows[t] / (denom * (1 + r));
      }
    }
    return { f, df };
  }

  private clampInt(v: any, min: number, max: number) {
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  private clampPct(v: any) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(-100, Math.min(1000, n));
  }

  private money(v: any) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return this.round(n, 2);
  }

  private round(v: number, digits: number) {
    const p = Math.pow(10, digits);
    return Math.round(v * p) / p;
  }
}
