import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RentabilityInput, RentabilityResult } from '../models/rentability.models';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportToPDF(scenarioName: string, input: Partial<RentabilityInput>, result: RentabilityResult | null) {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Analyse de Rentabilité`, 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(scenarioName, 105, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Context
    if (input.context) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Contexte du bien', 14, yPosition);
      yPosition += 8;
      
      const contextData = [
        ['Type', input.context.type || '-'],
        ['Localisation', input.context.location || '-'],
        ['Surface', `${input.context.surface || 0} m²`],
        ['État', input.context.state || '-'],
        ['Stratégie', input.context.strategy || '-'],
        ['Horizon', `${input.context.horizon || 0} ans`],
        ['Prix d\'achat', `${this.formatCurrency(input.context.purchasePrice || 0)}`],
        ['Frais de notaire', `${this.formatCurrency(input.context.notaryFees || 0)}`],
        ['Travaux', `${this.formatCurrency(input.context.renovationCost || 0)}`],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Paramètre', 'Valeur']],
        body: contextData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // KPIs
    if (result) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Indicateurs Clés', 14, yPosition);
      yPosition += 8;

      const kpisData = [
        ['Rendement Net-Net', `${result.kpis.netNetYield.toFixed(2)}%`],
        ['Rendement Brut', `${result.kpis.grossYield.toFixed(2)}%`],
        ['TRI (IRR)', `${result.kpis.irr.toFixed(2)}%`],
        ['VAN (NPV)', this.formatCurrency(result.kpis.npv)],
        ['Cash on Cash', `${result.kpis.cashOnCash.toFixed(2)}%`],
        ['Payback', `${result.kpis.paybackYears.toFixed(1)} ans`],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Indicateur', 'Valeur']],
        body: kpisData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 185, 129] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Yearly Results
      if (result.yearlyResults && result.yearlyResults.length > 0) {
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Résultats Annuels', 14, yPosition);
        yPosition += 8;

        const yearlyData = result.yearlyResults.slice(0, 10).map(yr => [
          `Année ${yr.year}`,
          this.formatCurrency(yr.grossRevenue),
          this.formatCurrency(yr.totalCharges),
          this.formatCurrency(yr.cashflowAfterTax),
          this.formatCurrency(yr.cumulativeCashflow),
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Année', 'Revenus', 'Charges', 'Cashflow', 'Cumulé']],
          body: yearlyData,
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [99, 102, 241] },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Exit scenario
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Scénario de Sortie', 14, yPosition);
      yPosition += 8;

      const exitData = [
        ['Prix de vente estimé', this.formatCurrency(result.kpis.exitPrice)],
        ['Plus-value', this.formatCurrency(result.kpis.capitalGain)],
        ['Plus-value nette', this.formatCurrency(result.kpis.netCapitalGain)],
        ['Equity finale', this.formatCurrency(result.kpis.finalEquity)],
        ['Retour total', `${result.kpis.totalReturn.toFixed(2)}%`],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Élément', 'Valeur']],
        body: exitData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    // Save
    doc.save(`rentability-${scenarioName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
  }

  exportToExcel(scenarioName: string, input: Partial<RentabilityInput>, result: RentabilityResult | null) {
    const workbook = XLSX.utils.book_new();

    // Context Sheet
    if (input.context) {
      const contextData = [
        ['CONTEXTE DU BIEN'],
        [''],
        ['Type', input.context.type || '-'],
        ['Localisation', input.context.location || '-'],
        ['Surface (m²)', input.context.surface || 0],
        ['État', input.context.state || '-'],
        ['Stratégie', input.context.strategy || '-'],
        ['Horizon (années)', input.context.horizon || 0],
        ['Objectif', input.context.objective || '-'],
        [''],
        ['INVESTISSEMENT INITIAL'],
        ['Prix d\'achat', input.context.purchasePrice || 0],
        ['Frais de notaire', input.context.notaryFees || 0],
        ['Travaux', input.context.renovationCost || 0],
        ['Valeur terrain', input.context.landValue || 0],
        ['Ameublement', input.context.furnitureCost || 0],
        ['Total', (input.context.purchasePrice || 0) + (input.context.notaryFees || 0) + (input.context.renovationCost || 0) + (input.context.furnitureCost || 0)],
      ];

      const wsContext = XLSX.utils.aoa_to_sheet(contextData);
      XLSX.utils.book_append_sheet(workbook, wsContext, 'Contexte');
    }

    // Revenues Sheet
    if (input.revenues) {
      const revenuesData = [
        ['REVENUS LOCATIFS'],
        [''],
        ['Loyer mensuel', input.revenues.monthlyRent || 0],
        ['Indexation', input.revenues.indexation || '-'],
        ['Taux d\'indexation (%)', input.revenues.indexationRate || 0],
        ['Taux de vacance (%)', input.revenues.vacancyRate || 0],
        ['Parking', input.revenues.parkingRent || 0],
        ['Cave/Garage', input.revenues.storageRent || 0],
        ['Autres revenus', input.revenues.otherRevenues || 0],
      ];

      const wsRevenues = XLSX.utils.aoa_to_sheet(revenuesData);
      XLSX.utils.book_append_sheet(workbook, wsRevenues, 'Revenus');
    }

    // KPIs Sheet
    if (result) {
      const kpisData = [
        ['INDICATEURS CLÉS DE PERFORMANCE'],
        [''],
        ['Rendement Brut (%)', result.kpis.grossYield],
        ['Rendement Net (%)', result.kpis.netYield],
        ['Rendement Net-Net (%)', result.kpis.netNetYield],
        ['Cash on Cash (%)', result.kpis.cashOnCash],
        ['TRI - IRR (%)', result.kpis.irr],
        ['VAN - NPV (€)', result.kpis.npv],
        ['Cap Rate (%)', result.kpis.capRate],
        ['Payback (années)', result.kpis.paybackYears],
        ['Equity finale (€)', result.kpis.finalEquity],
        ['Retour total (%)', result.kpis.totalReturn],
      ];

      const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
      XLSX.utils.book_append_sheet(workbook, wsKPIs, 'KPIs');

      // Yearly Results Sheet
      if (result.yearlyResults && result.yearlyResults.length > 0) {
        const yearlyHeaders = [
          'Année',
          'Revenus Bruts',
          'Revenus Nets',
          'Charges Totales',
          'Intérêts',
          'Amortissement',
          'Résultat Fiscal',
          'Impôt',
          'Cashflow Avant Impôt',
          'Cashflow Après Impôt',
          'Cumulé',
        ];

        const yearlyData = result.yearlyResults.map(yr => [
          yr.year,
          yr.grossRevenue,
          yr.netRevenue,
          yr.totalCharges,
          yr.interest,
          yr.depreciation,
          yr.taxableIncome,
          yr.tax,
          yr.cashflowBeforeTax,
          yr.cashflowAfterTax,
          yr.cumulativeCashflow,
        ]);

        const wsYearly = XLSX.utils.aoa_to_sheet([yearlyHeaders, ...yearlyData]);
        XLSX.utils.book_append_sheet(workbook, wsYearly, 'Résultats Annuels');
      }
    }

    // Save
    XLSX.writeFile(workbook, `rentability-${scenarioName.replace(/\s+/g, '-')}-${Date.now()}.xlsx`);
  }

  exportToJSON(scenarioName: string, input: Partial<RentabilityInput>, result: RentabilityResult | null) {
    const data = {
      scenarioName,
      exportDate: new Date().toISOString(),
      input,
      result,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rentability-${scenarioName.replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
