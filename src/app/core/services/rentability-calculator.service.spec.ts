import { RentabilityCalculatorService } from './rentability-calculator.service';
import { RentabilityInput } from '../models/rentability.models';

function closeTo(actual: number, expected: number, tol = 1e-2) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

function baseInput(overrides?: DeepPartial<RentabilityInput>): RentabilityInput {
  const input: RentabilityInput = {
    context: {
      type: 'apartment',
      location: 'Nice',
      surface: 40,
      state: 'good',
      strategy: 'bare',
      horizon: 10,
      objective: 'cashflow',
      purchasePrice: 200_000,
      notaryFees: 15_000,
      renovationCost: 10_000,
      landValue: 20_000,
      furnitureCost: 5_000
    },
    revenues: {
      monthlyRent: 1000,
      indexation: 'irl',
      indexationRate: 2,
      vacancyRate: 5,
      seasonalityEnabled: false,
      highSeasonMonths: [],
      highSeasonMultiplier: 1.2,
      parkingRent: 0,
      storageRent: 0,
      otherRevenues: 0,
      guaranteedRent: false,
      relocationIncrease: 0
    },
    charges: {
      condoFees: 1200,
      insurance: 240,
      propertyTax: 1200,
      managementFees: 7,
      maintenanceRate: 1,
      recoverableCharges: 0,
      plannedCapex: [],
      chargesIncrease: 2
    },
    financing: {
      loanAmount: 160_000,
      loanType: 'fixed',
      interestRate: 3,
      duration: 240,
      insuranceRate: 0.3,
      deferredMonths: 0,
      deferredType: 'none',
      earlyRepaymentPenalty: 0,
      includeNotaryInLoan: false,
      includeRenovationInLoan: false
    },
    tax: {
      regime: 'real',
      marginalTaxRate: 30,
      socialContributions: 17.2,
      depreciationYears: 25,
      furnitureDepreciationYears: 7,
      deficitCarryForward: true,
      crlApplicable: false
    },
    exit: {
      method: 'appreciation',
      annualAppreciation: 2,
      targetCapRate: 5,
      targetPricePerSqm: 6000,
      sellingCosts: 8,
      capitalGainsTax: 19,
      holdYears: 10
    }
  };

  return {
    ...input,
    ...(overrides as Partial<RentabilityInput>),
    context: { ...input.context, ...((overrides?.context as Partial<RentabilityInput['context']>) || {}) },
    revenues: { ...input.revenues, ...((overrides?.revenues as Partial<RentabilityInput['revenues']>) || {}) },
    charges: { ...input.charges, ...((overrides?.charges as Partial<RentabilityInput['charges']>) || {}) },
    financing: { ...input.financing, ...((overrides?.financing as Partial<RentabilityInput['financing']>) || {}) },
    tax: { ...input.tax, ...((overrides?.tax as Partial<RentabilityInput['tax']>) || {}) },
    exit: { ...input.exit, ...((overrides?.exit as Partial<RentabilityInput['exit']>) || {}) }
  };
}

describe('RentabilityCalculatorService (robust)', () => {
  let svc: RentabilityCalculatorService;

  beforeEach(() => {
    svc = new RentabilityCalculatorService();
  });

  it('returns yearlyResults length == holdYears', () => {
    const input = baseInput({ exit: { holdYears: 12 } });
    const res = svc.calculate(input);
    expect(res.yearlyResults.length).toBe(12);
  });

  it('applies indexationRate as compound yearly growth (year 2 rent > year 1)', () => {
    const input = baseInput({ revenues: { monthlyRent: 1000, indexationRate: 3 } });
    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0].grossRevenue;
    const y2 = res.yearlyResults[1].grossRevenue;
    expect(y2).toBeGreaterThan(y1);
  });

  it('vacancy loss equals grossRevenue * vacancyRate', () => {
    const input = baseInput({ revenues: { vacancyRate: 10 } });
    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0];
    closeTo(y1.vacancyLoss, y1.grossRevenue * 0.10, 1e-6);
    closeTo(y1.netRevenue, y1.grossRevenue - y1.vacancyLoss, 1e-6);
  });

  it('CAPEX is included in totalCharges for the matching year', () => {
    const input = baseInput({
      charges: {
        plannedCapex: [
          { year: 1, amount: 5000, description: 'Kitchen' },
          { year: 3, amount: 2000, description: 'Painting' }
        ]
      }
    });

    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0];
    const y3 = res.yearlyResults[2];

    expect(y1.totalCharges).toBeGreaterThanOrEqual(5000);
    expect(y3.totalCharges).toBeGreaterThanOrEqual(2000);
  });

  it('loan annual payment should stay constant across years for fixed-rate amortizing loan', () => {
    const input = baseInput({
      exit: { holdYears: 5 },
      financing: { loanAmount: 200_000, interestRate: 3, duration: 240 }
    });

    const res = svc.calculate(input);

    const p1 = res.yearlyResults[0].loanPayment;
    const p2 = res.yearlyResults[1].loanPayment;

    closeTo(p2, p1, 1);
  });

  it('cashflowBeforeTax should subtract loanInsurance (if any)', () => {
    const input = baseInput({
      financing: { loanAmount: 160_000, insuranceRate: 0.3 },
      exit: { holdYears: 1 }
    });

    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0];

    const expected = y1.netRevenue - y1.totalCharges - y1.loanPayment - y1.loanInsurance;
    closeTo(y1.cashflowBeforeTax, expected, 1e-6);
  });

  it('management fees should be zero when collected rent is zero (vacancy 100%)', () => {
    const input = baseInput({ revenues: { vacancyRate: 100 } });
    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0];

    expect(y1.management).toBe(0);
  });

  it('recoverableCharges should reduce totalCharges (tenant reimbursed)', () => {
    const input = baseInput({
      charges: { recoverableCharges: 100 }
    });

    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0];

    const base = svc.calculate(baseInput({ charges: { recoverableCharges: 0 } })).yearlyResults[0];

    expect(y1.totalCharges).toBeLessThan(base.totalCharges);
  });

  it('micro regime taxable income equals revenue * 50% and ignores charges/interest', () => {
    const input = baseInput({
      tax: { regime: 'micro', marginalTaxRate: 30, socialContributions: 17.2 },
      revenues: { vacancyRate: 0 },
      charges: { condoFees: 10_000 }
    });

    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0];

    closeTo(y1.taxableIncome, y1.netRevenue * 0.5, 1e-6);
  });

  it('lmnp depreciation should be capped to avoid negative taxable income (carry-forward)', () => {
    const input = baseInput({
      tax: { regime: 'lmnp', depreciationYears: 5, furnitureDepreciationYears: 2, deficitCarryForward: true },
      revenues: { monthlyRent: 500, vacancyRate: 0 },
      charges: {
        condoFees: 0,
        insurance: 0,
        propertyTax: 0,
        managementFees: 0,
        maintenanceRate: 0,
        plannedCapex: [],
        chargesIncrease: 0
      }
    });

    const res = svc.calculate(input);
    const y1 = res.yearlyResults[0];

    expect(y1.taxableIncome).toBeGreaterThanOrEqual(0);
  });

  it('paybackYears should consider initial ownFunds (negative cashflow at t0)', () => {
    const input = baseInput({
      context: { purchasePrice: 100_000, notaryFees: 0, renovationCost: 0, furnitureCost: 0 },
      financing: { loanAmount: 50_000, interestRate: 0, duration: 120, insuranceRate: 0 }
    });

    const res = svc.calculate(input);

    expect(res.kpis.paybackYears).toBeGreaterThan(1);
  });

  it('irr should decrease when sellingCosts increase (all else equal)', () => {
    const inputLow = baseInput({ exit: { sellingCosts: 0, holdYears: 10 } });
    const inputHigh = baseInput({ exit: { sellingCosts: 10, holdYears: 10 } });

    const rLow = svc.calculate(inputLow);
    const rHigh = svc.calculate(inputHigh);

    expect(rHigh.kpis.irr).toBeLessThan(rLow.kpis.irr);
  });

  it('no NaN or Infinity in main KPIs for a standard scenario', () => {
    const res = svc.calculate(baseInput());
    const k = res.kpis;

    const vals = [k.grossYield, k.netYield, k.netNetYield, k.irr, k.npv, k.totalReturn, k.dscr];

    for (const v of vals) {
      expect(Number.isFinite(v)).toBeTrue();
    }
  });
});
