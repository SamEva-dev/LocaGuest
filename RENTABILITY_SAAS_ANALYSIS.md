# 📊 Analyse SaaS Compétitif — Onglet "Calcul et Rentabilité"

> **Date**: 17 janvier 2026  
> **Objectif**: Rendre le module de rentabilité compétitif face aux leaders du marché (Rendement Locatif, Horiz.io, Lybox, etc.)

---

## 1️⃣ État actuel — Ce qui existe

### ✅ Points forts

| Fonctionnalité | Implémentation | Qualité |
|----------------|----------------|---------|
| **Wizard 7 étapes** | Context → Revenus → Charges → Financement → Fiscalité → Résultats → Analyse | ⭐⭐⭐⭐ |
| **Calculs financiers** | IRR, NPV, DSCR, LTV, Cash-on-Cash, Payback | ⭐⭐⭐⭐ |
| **Régimes fiscaux** | Micro, Réel, LMNP, LMP, SCI IS/IR | ⭐⭐⭐⭐ |
| **Amortissements LMNP** | Bâti + mobilier avec durées paramétrables | ⭐⭐⭐⭐ |
| **Scénarios multiples** | Sauvegarde, versioning, partage | ⭐⭐⭐ |
| **Export** | PDF, Excel, JSON | ⭐⭐⭐ |
| **Pré-remplissage** | Depuis les biens existants du portfolio | ⭐⭐⭐⭐ |
| **AI Suggestions** | Analyse automatique avec recommandations | ⭐⭐⭐ |
| **What-If Analysis** | Ajustements rapides (loyer, taux, vacance) | ⭐⭐⭐ |

### ⚠️ Lacunes identifiées

| Manque | Impact | Priorité |
|--------|--------|----------|
| Pas de graphiques/charts visuels | UX faible vs concurrents | 🔴 Haute |
| Pas de comparaison multi-scénarios côte-à-côte | Analyse limitée | 🔴 Haute |
| Pas de données marché locales | Pas de benchmark | 🟠 Moyenne |
| Pas de simulation Monte Carlo | Pas d'analyse de risque | 🟠 Moyenne |
| Pas d'intégration annonces (SeLoger, LBC) | Workflow manuel | 🟡 Basse |
| Pas de mode "investisseur débutant" simplifié | Onboarding faible | 🟠 Moyenne |

---

## 2️⃣ Benchmark Concurrents

### Rendement Locatif (leader FR)
- ✅ Interface très visuelle avec graphiques interactifs
- ✅ Données marché intégrées (loyers moyens par ville)
- ✅ Comparaison de scénarios en grille
- ✅ Score de rentabilité global (notation 1-10)
- ✅ Intégration SeLoger/LeBonCoin

### Horiz.io
- ✅ Simulation Monte Carlo (distribution probabiliste)
- ✅ Calcul du "prix max à payer"
- ✅ Alertes email sur opportunités
- ✅ API publique

### Lybox
- ✅ Mode simplifié pour débutants
- ✅ Templates pré-configurés par ville
- ✅ Partage public de simulations

---

## 3️⃣ Recommandations — Quick Wins (Sprint 1-2)

### 3.1 📈 Graphiques interactifs (Priorité: HAUTE)

**Impact**: UX ++, différenciation visuelle immédiate

```
Graphiques à ajouter dans Step6-Results:
├── Line Chart: Évolution cashflow sur horizon (Chart.js / ngx-charts)
├── Stacked Bar: Décomposition charges/revenus par année
├── Pie Chart: Répartition investissement (apport, emprunt, frais)
├── Gauge: Score de rentabilité global (0-100)
└── Waterfall: Bridge prix achat → valeur finale
```

**Librairie recommandée**: `ngx-charts` (Angular native, responsive, dark mode)

### 3.2 🔄 Comparaison multi-scénarios (Priorité: HAUTE)

**Impact**: Valeur métier ++, aide à la décision

```typescript
// Nouveau composant: ScenarioComparisonComponent
interface ComparisonView {
  scenarios: RentabilityScenario[];  // 2-4 scénarios max
  highlightDifferences: boolean;
  kpisToCompare: string[];           // IRR, cashflow, NPV...
}

// Affichage en colonnes avec highlighting des deltas
```

### 3.3 🏆 Score de rentabilité global (Priorité: MOYENNE)

**Impact**: Gamification, compréhension simplifiée

```typescript
interface RentabilityScore {
  overall: number;        // 0-100
  breakdown: {
    cashflow: number;     // 0-25 pts
    yield: number;        // 0-25 pts  
    risk: number;         // 0-25 pts (DSCR, LTV)
    growth: number;       // 0-25 pts (IRR, appreciation)
  };
  rating: 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: string;        // "Excellent investissement" etc.
}
```

---

## 4️⃣ Recommandations — Moyen terme (Sprint 3-4)

### 4.1 📊 Données marché locales

**Source**: API data.gouv.fr (DVF - Demandes de Valeurs Foncières) + INSEE

```typescript
interface MarketData {
  city: string;
  averageRentPerSqm: number;
  averagePricePerSqm: number;
  grossYieldAverage: number;
  vacancyRateAverage: number;
  priceEvolution5Y: number;  // %
}

// Auto-complétion dans Step1 basée sur la localisation
```

### 4.2 🎲 Analyse de sensibilité / Monte Carlo

**Impact**: Analyse de risque professionnelle

```typescript
interface SensitivityAnalysis {
  baseCase: RentabilityResult;
  pessimistic: RentabilityResult;  // -20% loyer, +2% taux, +10% vacance
  optimistic: RentabilityResult;   // +10% loyer, -0.5% taux, -3% vacance
  
  // Monte Carlo (1000 simulations)
  irrDistribution: {
    p10: number;  // 10ème percentile
    p50: number;  // médiane
    p90: number;  // 90ème percentile
  };
  probabilityPositiveCashflow: number;  // %
}
```

### 4.3 💡 Mode simplifié "Débutant"

**Impact**: Acquisition utilisateurs, réduction friction

```
Mode Simplifié:
├── 3 étapes au lieu de 7
│   ├── Étape 1: Prix + Loyer + Localisation
│   ├── Étape 2: Financement (slider apport 0-100%)
│   └── Étape 3: Résultats avec score + verdict
├── Valeurs par défaut intelligentes
│   ├── Frais notaire: 8% auto-calculé
│   ├── Charges: 25% du loyer
│   ├── Régime fiscal: recommandation auto
│   └── Taux: taux moyen marché (API)
└── Bouton "Mode expert" pour basculer
```

---

## 5️⃣ Recommandations — Long terme (Sprint 5+)

### 5.1 🔗 Intégration annonces immobilières

```
Workflow:
1. User colle URL SeLoger/LeBonCoin/PAP
2. Scraping/API extrait: prix, surface, localisation, photos
3. Pré-remplissage automatique du wizard
4. Estimation loyer basée sur données marché
```

### 5.2 📱 Application mobile dédiée

- Scan de documents (taxe foncière, charges copro)
- OCR pour extraction automatique des montants
- Notifications push sur alertes scénarios

### 5.3 🤖 Assistant IA conversationnel

```
"Mon budget est de 200k€, je cherche 8% de rendement 
en LMNP dans une ville étudiante. Que me proposes-tu?"

→ Génération automatique de scénarios optimisés
```

---

## 6️⃣ Plan d'action priorisé

| Sprint | Fonctionnalité | Effort | Impact |
|--------|----------------|--------|--------|
| **S1** | Graphiques ngx-charts (cashflow, répartition) | 3j | ⭐⭐⭐⭐⭐ |
| **S1** | Score de rentabilité global | 1j | ⭐⭐⭐⭐ |
| **S2** | Comparaison multi-scénarios | 3j | ⭐⭐⭐⭐⭐ |
| **S2** | Mode simplifié "Débutant" | 2j | ⭐⭐⭐⭐ |
| **S3** | Données marché DVF/INSEE | 4j | ⭐⭐⭐⭐ |
| **S3** | Analyse de sensibilité | 2j | ⭐⭐⭐ |
| **S4** | Monte Carlo simulation | 3j | ⭐⭐⭐ |
| **S5** | Intégration annonces (scraping) | 5j | ⭐⭐⭐ |

---

## 7️⃣ Métriques de succès

| KPI | Baseline | Cible S1 | Cible S4 |
|-----|----------|----------|----------|
| Taux complétion wizard | ~40% | 55% | 70% |
| Scénarios sauvegardés/user | 1.2 | 2.0 | 3.5 |
| Time-to-first-result | 8 min | 5 min | 3 min |
| NPS module rentabilité | - | 35 | 50 |
| Conversion free→paid via rentabilité | - | 5% | 12% |

---

## 8️⃣ Fichiers à modifier

### Nouveaux composants à créer

```
src/app/pages/rentability/
├── components/
│   ├── charts/
│   │   ├── cashflow-chart.component.ts      # Line chart évolution
│   │   ├── investment-breakdown.component.ts # Pie chart
│   │   ├── yearly-breakdown.component.ts    # Stacked bar
│   │   └── rentability-gauge.component.ts   # Score gauge
│   ├── scenario-comparison.component.ts     # Comparaison côte-à-côte
│   └── simplified-wizard/
│       ├── simple-step1.component.ts
│       ├── simple-step2.component.ts
│       └── simple-results.component.ts
```

### Services à enrichir

```
src/app/core/services/
├── rentability-calculator.service.ts  # Ajouter calculateScore()
├── rentability-scenarios.service.ts   # Ajouter compareScenarios()
├── market-data.service.ts             # NOUVEAU: données DVF/INSEE
└── sensitivity-analysis.service.ts    # NOUVEAU: Monte Carlo
```

### Dépendances à ajouter

```bash
npm install @swimlane/ngx-charts --save
npm install d3 --save  # peer dependency
```

---

## 9️⃣ Conclusion

Le module actuel est **fonctionnellement solide** (calculs corrects, fiscalité complète) mais manque de **polish UX** pour rivaliser avec les leaders.

**Actions immédiates** (2 semaines):
1. Ajouter graphiques ngx-charts dans Step6
2. Implémenter score de rentabilité
3. Créer comparateur de scénarios

**ROI estimé**: Ces 3 features peuvent augmenter le taux de conversion de 20-30% selon les benchmarks SaaS B2C.
