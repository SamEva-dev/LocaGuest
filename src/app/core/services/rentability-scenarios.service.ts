import { Injectable, inject, signal } from '@angular/core';
import { RentabilityScenariosApi, RentabilityScenarioDto, SaveScenarioCommand } from '../api/rentability-scenarios.api';
import { RentabilityInput, RentabilityResult } from '../models/rentability.models';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RentabilityScenariosService {
  private api = inject(RentabilityScenariosApi);

  // Signals
  scenarios = signal<RentabilityScenarioDto[]>([]);
  currentScenario = signal<RentabilityScenarioDto | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  /**
   * Charger tous les scénarios de l'utilisateur
   */
  loadUserScenarios() {
    this.isLoading.set(true);
    this.error.set(null);

    this.api.getUserScenarios()
      .pipe(
        tap(scenarios => {
          this.scenarios.set(scenarios);
          this.isLoading.set(false);
        }),
        catchError(err => {
          console.error('Error loading scenarios:', err);
          this.error.set('Erreur lors du chargement des scénarios');
          this.isLoading.set(false);
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Sauvegarder un scénario
   */
  saveScenario(
    input: Partial<RentabilityInput>,
    name: string,
    isBase: boolean = false,
    result?: RentabilityResult,
    scenarioId?: string
  ) {
    this.isLoading.set(true);
    this.error.set(null);

    const command: SaveScenarioCommand = {
      id: scenarioId,
      name,
      isBase,
      input: this.mapToInputDto(input),
      resultsJson: result ? JSON.stringify(result) : undefined
    };

    return this.api.saveScenario(command)
      .pipe(
        tap(scenario => {
          this.currentScenario.set(scenario);
          this.isLoading.set(false);
          
          // Mettre à jour la liste
          const currentScenarios = this.scenarios();
          const index = currentScenarios.findIndex(s => s.id === scenario.id);
          if (index >= 0) {
            currentScenarios[index] = scenario;
            this.scenarios.set([...currentScenarios]);
          } else {
            this.scenarios.set([scenario, ...currentScenarios]);
          }
        }),
        catchError(err => {
          console.error('Error saving scenario:', err);
          this.error.set('Erreur lors de la sauvegarde');
          this.isLoading.set(false);
          throw err;
        })
      );
  }

  /**
   * Supprimer un scénario
   */
  deleteScenario(id: string) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.api.deleteScenario(id)
      .pipe(
        tap(() => {
          const currentScenarios = this.scenarios();
          this.scenarios.set(currentScenarios.filter(s => s.id !== id));
          
          if (this.currentScenario()?.id === id) {
            this.currentScenario.set(null);
          }
          
          this.isLoading.set(false);
        }),
        catchError(err => {
          console.error('Error deleting scenario:', err);
          this.error.set('Erreur lors de la suppression');
          this.isLoading.set(false);
          throw err;
        })
      );
  }

  /**
   * Charger un scénario spécifique
   */
  loadScenario(scenarioDto: RentabilityScenarioDto): Partial<RentabilityInput> {
    this.currentScenario.set(scenarioDto);
    return this.mapFromDto(scenarioDto);
  }

  /**
   * Mapper de RentabilityInput vers DTO
   */
  private mapToInputDto(input: Partial<RentabilityInput>): any {
    return {
      context: {
        type: input.context?.type || 'apartment',
        location: input.context?.location || '',
        surface: input.context?.surface || 0,
        state: input.context?.state || 'good',
        strategy: input.context?.strategy || 'bare',
        horizon: input.context?.horizon || 10,
        objective: input.context?.objective || 'cashflow',
        purchasePrice: input.context?.purchasePrice || 0,
        notaryFees: input.context?.notaryFees || 0,
        renovationCost: input.context?.renovationCost || 0,
        landValue: input.context?.landValue,
        furnitureCost: input.context?.furnitureCost
      },
      revenues: {
        monthlyRent: input.revenues?.monthlyRent || 0,
        indexation: input.revenues?.indexation || 'irl',
        indexationRate: input.revenues?.indexationRate || 0,
        vacancyRate: input.revenues?.vacancyRate || 0,
        seasonalityEnabled: input.revenues?.seasonalityEnabled || false,
        highSeasonMultiplier: input.revenues?.highSeasonMultiplier,
        parkingRent: input.revenues?.parkingRent,
        storageRent: input.revenues?.storageRent,
        otherRevenues: input.revenues?.otherRevenues,
        guaranteedRent: input.revenues?.guaranteedRent || false,
        relocationIncrease: input.revenues?.relocationIncrease
      },
      charges: {
        condoFees: input.charges?.condoFees || 0,
        insurance: input.charges?.insurance || 0,
        propertyTax: input.charges?.propertyTax || 0,
        managementFees: input.charges?.managementFees || 0,
        maintenanceRate: input.charges?.maintenanceRate || 0,
        recoverableCharges: input.charges?.recoverableCharges || 0,
        chargesIncrease: input.charges?.chargesIncrease || 0,
        plannedCapex: input.charges?.plannedCapex || []
      },
      financing: {
        loanAmount: input.financing?.loanAmount || 0,
        loanType: input.financing?.loanType || 'fixed',
        interestRate: input.financing?.interestRate || 0,
        duration: input.financing?.duration || 240,
        insuranceRate: input.financing?.insuranceRate || 0,
        deferredMonths: input.financing?.deferredMonths || 0,
        deferredType: input.financing?.deferredType || 'none',
        earlyRepaymentPenalty: input.financing?.earlyRepaymentPenalty || 0,
        includeNotaryInLoan: input.financing?.includeNotaryInLoan || false,
        includeRenovationInLoan: input.financing?.includeRenovationInLoan || false
      },
      tax: {
        regime: input.tax?.regime || 'lmnp',
        marginalTaxRate: input.tax?.marginalTaxRate || 0,
        socialContributions: input.tax?.socialContributions || 17.2,
        depreciationYears: input.tax?.depreciationYears,
        furnitureDepreciationYears: input.tax?.furnitureDepreciationYears,
        deficitCarryForward: input.tax?.deficitCarryForward || false,
        crlApplicable: input.tax?.crlApplicable || false
      },
      exit: {
        method: input.exit?.method || 'appreciation',
        targetCapRate: input.exit?.targetCapRate,
        annualAppreciation: input.exit?.annualAppreciation,
        targetPricePerSqm: input.exit?.targetPricePerSqm,
        sellingCosts: input.exit?.sellingCosts || 8,
        capitalGainsTax: input.exit?.capitalGainsTax || 19,
        holdYears: input.exit?.holdYears || 10
      }
    };
  }

  /**
   * Mapper de DTO vers RentabilityInput
   */
  private mapFromDto(dto: RentabilityScenarioDto): Partial<RentabilityInput> {
    const input = dto.input;
    return {
      context: {
        type: input.context.type as any,
        location: input.context.location,
        surface: input.context.surface,
        state: input.context.state as any,
        strategy: input.context.strategy as any,
        horizon: input.context.horizon,
        objective: input.context.objective as any,
        purchasePrice: input.context.purchasePrice,
        notaryFees: input.context.notaryFees,
        renovationCost: input.context.renovationCost,
        landValue: input.context.landValue,
        furnitureCost: input.context.furnitureCost
      },
      revenues: {
        monthlyRent: input.revenues.monthlyRent,
        indexation: input.revenues.indexation as any,
        indexationRate: input.revenues.indexationRate,
        vacancyRate: input.revenues.vacancyRate,
        seasonalityEnabled: input.revenues.seasonalityEnabled,
        highSeasonMultiplier: input.revenues.highSeasonMultiplier,
        parkingRent: input.revenues.parkingRent,
        storageRent: input.revenues.storageRent,
        otherRevenues: input.revenues.otherRevenues,
        guaranteedRent: input.revenues.guaranteedRent,
        relocationIncrease: input.revenues.relocationIncrease
      },
      charges: {
        condoFees: input.charges.condoFees,
        insurance: input.charges.insurance,
        propertyTax: input.charges.propertyTax,
        managementFees: input.charges.managementFees,
        maintenanceRate: input.charges.maintenanceRate,
        recoverableCharges: input.charges.recoverableCharges,
        chargesIncrease: input.charges.chargesIncrease,
        plannedCapex: input.charges.plannedCapex || []
      },
      financing: {
        loanAmount: input.financing.loanAmount,
        loanType: input.financing.loanType as any,
        interestRate: input.financing.interestRate,
        duration: input.financing.duration,
        insuranceRate: input.financing.insuranceRate,
        deferredMonths: input.financing.deferredMonths,
        deferredType: input.financing.deferredType as any,
        earlyRepaymentPenalty: input.financing.earlyRepaymentPenalty,
        includeNotaryInLoan: input.financing.includeNotaryInLoan,
        includeRenovationInLoan: input.financing.includeRenovationInLoan
      },
      tax: {
        regime: input.tax.regime as any,
        marginalTaxRate: input.tax.marginalTaxRate,
        socialContributions: input.tax.socialContributions,
        depreciationYears: input.tax.depreciationYears,
        furnitureDepreciationYears: input.tax.furnitureDepreciationYears,
        deficitCarryForward: input.tax.deficitCarryForward,
        crlApplicable: input.tax.crlApplicable
      },
      exit: {
        method: input.exit.method as any,
        targetCapRate: input.exit.targetCapRate,
        annualAppreciation: input.exit.annualAppreciation,
        targetPricePerSqm: input.exit.targetPricePerSqm,
        sellingCosts: input.exit.sellingCosts,
        capitalGainsTax: input.exit.capitalGainsTax,
        holdYears: input.exit.holdYears
      }
    };
  }
}
