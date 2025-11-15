import { Injectable } from '@angular/core';
import { RentabilityInput, RentabilityResult } from '../models/rentability.models';

export interface AISuggestion {
  id: string;
  category: 'revenue' | 'charge' | 'financing' | 'tax' | 'strategy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement: number; // % improvement in IRR
  details: string;
  actionItems: string[];
}

@Injectable({ providedIn: 'root' })
export class AISuggestionsService {

  /**
   * Analyse le scénario et génère des suggestions d'optimisation
   */
  analyzScenario(input: Partial<RentabilityInput>, result: RentabilityResult | null): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (!result) return suggestions;

    // 1. Analyse des revenus
    if (input.revenues) {
      if (input.revenues.vacancyRate > 10) {
        suggestions.push({
          id: 'vacancy-high',
          category: 'revenue',
          title: 'Taux de vacance élevé',
          description: `Votre taux de vacance (${input.revenues.vacancyRate}%) est supérieur à la moyenne du marché (5-8%).`,
          impact: 'high',
          estimatedImprovement: 2.5,
          details: 'Un taux de vacance élevé impacte directement vos revenus et votre cashflow. Considérez des stratégies pour réduire ce taux.',
          actionItems: [
            'Améliorer l\'attractivité du bien (rénovation, équipements)',
            'Revoir le prix du loyer par rapport au marché local',
            'Optimiser la gestion locative et le suivi des locataires',
            'Envisager la location meublée pour plus de flexibilité'
          ]
        });
      }

      if (!input.revenues.indexation) {
        suggestions.push({
          id: 'no-indexation',
          category: 'revenue',
          title: 'Pas d\'indexation des loyers',
          description: 'Vous n\'avez pas prévu d\'indexation des loyers. Cela peut réduire votre rentabilité à long terme.',
          impact: 'medium',
          estimatedImprovement: 1.5,
          details: 'L\'indexation IRL permet d\'ajuster les loyers à l\'inflation et de maintenir le pouvoir d\'achat de vos revenus locatifs.',
          actionItems: [
            'Activer l\'indexation IRL (Indice de Référence des Loyers)',
            'Prévoir une clause d\'indexation dans le bail',
            'Suivre l\'évolution de l\'IRL chaque année'
          ]
        });
      }
    }

    // 2. Analyse des charges
    if (input.charges) {
      const totalChargesYear1 = result.yearlyResults[0]?.totalCharges || 0;
      const revenueYear1 = result.yearlyResults[0]?.grossRevenue || 1;
      const chargesRatio = (totalChargesYear1 / revenueYear1) * 100;

      if (chargesRatio > 40) {
        suggestions.push({
          id: 'charges-high',
          category: 'charge',
          title: 'Charges élevées',
          description: `Vos charges représentent ${chargesRatio.toFixed(1)}% de vos revenus bruts. La moyenne est de 25-35%.`,
          impact: 'high',
          estimatedImprovement: 3.0,
          details: 'Des charges élevées réduisent votre rentabilité nette. Identifiez les postes de dépenses à optimiser.',
          actionItems: [
            'Analyser les charges de copropriété et leur évolution',
            'Comparer les contrats d\'assurance (PNO)',
            'Optimiser les frais de gestion locative',
            'Prévoir un budget d\'entretien réaliste mais maîtrisé'
          ]
        });
      }

      if ((input.charges.maintenanceRate || 0) < 0.5) {
        suggestions.push({
          id: 'maintenance-low',
          category: 'charge',
          title: 'Budget d\'entretien sous-évalué',
          description: 'Votre budget d\'entretien semble faible. Prévoyez au moins 0.5-1% de la valeur du bien par an.',
          impact: 'medium',
          estimatedImprovement: 0,
          details: 'Un budget d\'entretien insuffisant peut conduire à des surprises désagréables et dégrader le bien.',
          actionItems: [
            'Prévoir 0.5-1% de la valeur du bien en entretien annuel',
            'Constituer un fonds de réserve pour les gros travaux',
            'Anticiper les dépenses prévisibles (chaudière, toiture, etc.)'
          ]
        });
      }
    }

    // 3. Analyse du financement
    if (input.financing) {
      const loanToValue = ((input.financing.loanAmount || 0) / (input.context?.purchasePrice || 1)) * 100;

      if (loanToValue < 70 && result.kpis.cashOnCash < 10) {
        suggestions.push({
          id: 'leverage-low',
          category: 'financing',
          title: 'Effet de levier insuffisant',
          description: `Votre LTV est de ${loanToValue.toFixed(0)}%. Un levier plus élevé pourrait améliorer votre Cash-on-Cash.`,
          impact: 'medium',
          estimatedImprovement: 2.0,
          details: 'Augmenter l\'endettement peut améliorer la rentabilité sur fonds propres si le coût du crédit est inférieur au rendement.',
          actionItems: [
            'Évaluer la possibilité d\'augmenter l\'emprunt',
            'Comparer le taux d\'intérêt avec le rendement attendu',
            'Considérer un apport réduit pour investir ailleurs',
            'Attention au risque et à la capacité de remboursement'
          ]
        });
      }

      if ((input.financing.interestRate || 0) > 4.5) {
        suggestions.push({
          id: 'interest-high',
          category: 'financing',
          title: 'Taux d\'intérêt élevé',
          description: `Votre taux d\'intérêt (${input.financing.interestRate}%) semble élevé par rapport au marché actuel.`,
          impact: 'high',
          estimatedImprovement: 1.8,
          details: 'Un taux élevé impacte fortement votre cashflow. Envisagez une renégociation ou un rachat de crédit.',
          actionItems: [
            'Négocier le taux avec votre banque actuelle',
            'Comparer les offres de plusieurs établissements',
            'Considérer un rachat de crédit si pertinent',
            'Inclure les frais de dossier dans le calcul'
          ]
        });
      }
    }

    // 4. Analyse fiscale
    if (input.tax) {
      if (input.tax.regime === 'micro' && (input.context?.purchasePrice || 0) > 150000) {
        suggestions.push({
          id: 'regime-suboptimal',
          category: 'tax',
          title: 'Régime fiscal potentiellement sous-optimal',
          description: 'Le régime micro pourrait ne pas être le plus avantageux pour votre situation.',
          impact: 'high',
          estimatedImprovement: 4.0,
          details: 'Pour des investissements importants, le régime réel avec amortissements (LMNP) peut être plus intéressant.',
          actionItems: [
            'Comparer micro-foncier vs régime réel',
            'Évaluer le passage en LMNP avec amortissements',
            'Consulter un expert-comptable spécialisé',
            'Simuler les deux régimes sur plusieurs années'
          ]
        });
      }

      if (!input.tax.depreciationYears && input.tax.regime !== 'micro') {
        suggestions.push({
          id: 'no-depreciation',
          category: 'tax',
          title: 'Amortissements non utilisés',
          description: 'Vous ne profitez pas des amortissements en régime réel.',
          impact: 'high',
          estimatedImprovement: 3.5,
          details: 'Les amortissements permettent de réduire significativement votre base imposable en régime réel.',
          actionItems: [
            'Activer les amortissements du bâti (sur 25-30 ans)',
            'Amortir le mobilier si location meublée (sur 5-10 ans)',
            'Conserver les justificatifs de travaux',
            'Faire un point avec un comptable'
          ]
        });
      }
    }

    // 5. Stratégie globale
    if (result.kpis.irr < 8) {
      suggestions.push({
        id: 'irr-low',
        category: 'strategy',
        title: 'TRI inférieur aux attentes',
        description: `Votre TRI (${result.kpis.irr.toFixed(2)}%) est inférieur à la cible généralement recommandée (8-10%).`,
        impact: 'high',
        estimatedImprovement: 0,
        details: 'Un TRI faible peut indiquer que l\'investissement n\'est pas assez rentable par rapport au risque pris.',
        actionItems: [
          'Revoir le prix d\'achat à la baisse',
          'Augmenter les revenus (loyer, optimisation fiscale)',
          'Réduire les charges (négociation, optimisation)',
          'Considérer une stratégie de sortie différente'
        ]
      });
    }

    if (result.kpis.paybackYears > 15) {
      suggestions.push({
        id: 'payback-long',
        category: 'strategy',
        title: 'Période de récupération longue',
        description: `Il faudra ${result.kpis.paybackYears.toFixed(1)} ans pour récupérer votre investissement.`,
        impact: 'medium',
        estimatedImprovement: 0,
        details: 'Une période de récupération longue augmente le risque et réduit la liquidité.',
        actionItems: [
            'Évaluer si l\'horizon d\'investissement correspond',
            'Optimiser le cashflow dès les premières années',
            'Considérer des stratégies d\'accélération (rénovation, optimisation)',
            'Diversifier avec d\'autres investissements'
          ]
        });
      }

    return suggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Compare deux scénarios et identifie les différences clés
   */
  compareScenarios(scenario1: RentabilityResult, scenario2: RentabilityResult): string[] {
    const insights: string[] = [];

    const irrDiff = scenario2.kpis.irr - scenario1.kpis.irr;
    const cashflowDiff = scenario2.kpis.cashOnCash - scenario1.kpis.cashOnCash;

    if (Math.abs(irrDiff) > 0.5) {
      insights.push(`Le TRI varie de ${irrDiff > 0 ? '+' : ''}${irrDiff.toFixed(2)}% entre les deux scénarios.`);
    }

    if (Math.abs(cashflowDiff) > 1) {
      insights.push(`Le Cash-on-Cash diffère de ${cashflowDiff > 0 ? '+' : ''}${cashflowDiff.toFixed(2)}%.`);
    }

    return insights;
  }
}
