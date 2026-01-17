import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { GlobalKPIs } from '../../../../core/models/rentability.models';

export interface RentabilityScore {
  overall: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: string;
  breakdown: {
    cashflow: number;
    yield: number;
    risk: number;
    growth: number;
  };
}

@Component({
  selector: 'app-rentability-gauge',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-lg text-white">
      <h3 class="text-lg font-semibold mb-4 text-center">Score de Rentabilité</h3>
      
      <div class="flex items-center justify-center mb-4">
        <ngx-charts-gauge
          [view]="[280, 200]"
          [scheme]="colorScheme"
          [results]="gaugeData"
          [min]="0"
          [max]="100"
          [angleSpan]="240"
          [startAngle]="-120"
          [showAxis]="true"
          [bigSegments]="5"
          [smallSegments]="0"
          [units]="'pts'"
          [legend]="false">
        </ngx-charts-gauge>
      </div>

      <div class="text-center mb-4">
        <span class="text-5xl font-bold" [class]="getRatingColor()">{{ score.rating }}</span>
        <p class="text-slate-300 mt-2">{{ score.verdict }}</p>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex justify-between">
          <span class="text-slate-400">Cashflow</span>
          <span class="font-medium">{{ score.breakdown.cashflow }}/25</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Rendement</span>
          <span class="font-medium">{{ score.breakdown.yield }}/25</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Risque</span>
          <span class="font-medium">{{ score.breakdown.risk }}/25</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Croissance</span>
          <span class="font-medium">{{ score.breakdown.growth }}/25</span>
        </div>
      </div>
    </div>
  `
})
export class RentabilityGaugeComponent implements OnChanges {
  @Input() kpis?: GlobalKPIs;

  score: RentabilityScore = {
    overall: 0,
    rating: 'F',
    verdict: '',
    breakdown: { cashflow: 0, yield: 0, risk: 0, growth: 0 }
  };

  gaugeData: any[] = [];

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10b981']
  };

  ngOnChanges() {
    if (this.kpis) {
      this.calculateScore();
    }
  }

  private calculateScore() {
    if (!this.kpis) return;

    // Cashflow score (0-25)
    const monthlyCashflow = this.kpis.netNetYield > 0 ? this.kpis.cashOnCash : 0;
    const cashflowScore = Math.min(25, Math.max(0, monthlyCashflow * 2.5));

    // Yield score (0-25)
    const yieldScore = Math.min(25, Math.max(0, this.kpis.netYield * 2.5));

    // Risk score based on DSCR and LTV (0-25)
    let riskScore = 0;
    if (this.kpis.dscr >= 1.5) riskScore += 15;
    else if (this.kpis.dscr >= 1.25) riskScore += 10;
    else if (this.kpis.dscr >= 1) riskScore += 5;
    
    if (this.kpis.ltv <= 70) riskScore += 10;
    else if (this.kpis.ltv <= 80) riskScore += 7;
    else if (this.kpis.ltv <= 90) riskScore += 3;

    // Growth score based on IRR (0-25)
    const growthScore = Math.min(25, Math.max(0, this.kpis.irr * 2));

    const overall = Math.round(cashflowScore + yieldScore + riskScore + growthScore);

    let rating: RentabilityScore['rating'];
    let verdict: string;

    if (overall >= 80) {
      rating = 'A';
      verdict = 'Excellent investissement !';
      this.colorScheme.domain = ['#10b981'];
    } else if (overall >= 65) {
      rating = 'B';
      verdict = 'Bon investissement';
      this.colorScheme.domain = ['#3b82f6'];
    } else if (overall >= 50) {
      rating = 'C';
      verdict = 'Investissement moyen';
      this.colorScheme.domain = ['#f59e0b'];
    } else if (overall >= 35) {
      rating = 'D';
      verdict = 'Investissement risqué';
      this.colorScheme.domain = ['#f97316'];
    } else {
      rating = 'F';
      verdict = 'À éviter';
      this.colorScheme.domain = ['#ef4444'];
    }

    this.score = {
      overall,
      rating,
      verdict,
      breakdown: {
        cashflow: Math.round(cashflowScore),
        yield: Math.round(yieldScore),
        risk: Math.round(riskScore),
        growth: Math.round(growthScore)
      }
    };

    this.gaugeData = [{ name: 'Score', value: overall }];
  }

  getRatingColor(): string {
    switch (this.score.rating) {
      case 'A': return 'text-emerald-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-amber-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-slate-400';
    }
  }
}
