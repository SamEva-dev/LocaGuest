import { Component, input, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsApi, Payment, PaymentStats } from '../../../../core/api/payments.api';
import { AddPaymentModal } from './add-payment-modal/add-payment-modal';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'tenant-payments-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, AddPaymentModal],
  templateUrl: './tenant-payments-tab.html'
})
export class TenantPaymentsTab implements OnInit {
  // Inputs
  tenantId = input.required<string>();
  tenantName = input<string>('');
  
  // Services
  private paymentsApi = inject(PaymentsApi);
  
  // Expose Math for template
  Math = Math;
  
  // State
  payments = signal<Payment[]>([]);
  stats = signal<PaymentStats | null>(null);
  isLoading = signal(false);
  showAddModal = signal(false);

  downloadingQuittancePaymentId = signal<string | null>(null);
  
  // Filters
  filterYear = signal<number>(new Date().getFullYear());
  filterStatus = signal<string>('all');
  
  // Computed
  filteredPayments = computed(() => {
    let filtered = this.payments();
    
    // Filter by year
    const year = this.filterYear();
    if (year) {
      filtered = filtered.filter(p => p.year === year);
    }
    
    // Filter by status
    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(p => p.status === status);
    }
    
    return filtered.sort((a, b) => {
      // Sort by year desc, then month desc
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  });
  
  availableYears = computed(() => {
    const years = new Set(this.payments().map(p => p.year));
    return Array.from(years).sort((a, b) => b - a);
  });
  
  ngOnInit() {
    this.loadPayments();
    this.loadStats();
  }
  
  loadPayments() {
    this.isLoading.set(true);
    this.paymentsApi.getPaymentsByTenant(this.tenantId()).subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.isLoading.set(false);
      }
    });
  }
  
  loadStats() {
    const year = this.filterYear();
    this.paymentsApi.getPaymentStats({ 
      tenantId: this.tenantId(),
      year: year || undefined
    }).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }
  
  openAddPaymentModal() {
    this.showAddModal.set(true);
  }
  
  handlePaymentCreated() {
    this.showAddModal.set(false);
    this.loadPayments();
    this.loadStats();
  }
  
  handleModalClose() {
    this.showAddModal.set(false);
  }
  
  getStatusBadgeClass(status: string): string {
    return this.paymentsApi.getStatusBadgeClass(status as any);
  }
  
  getStatusLabel(status: string): string {
    return this.paymentsApi.getStatusLabel(status as any);
  }
  
  getMethodLabel(method: string): string {
    return this.paymentsApi.getMethodLabel(method as any);
  }
  
  getMonthName(month: number): string {
    return this.paymentsApi.getMonthName(month);
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
  
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR');
  }
  
  async downloadQuittance(payment: Payment) {
    if (!payment?.id) return;

    if (payment.status !== 'Paid' && payment.status !== 'PaidLate') {
      alert('La quittance est disponible uniquement pour les paiements payés.');
      return;
    }

    this.downloadingQuittancePaymentId.set(payment.id);
    try {
      const blob = await firstValueFrom(this.paymentsApi.getPaymentQuittance(payment.id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quittance_${payment.year}${String(payment.month).padStart(2, '0')}_${payment.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading quittance:', err);
      alert('Erreur lors du téléchargement de la quittance');
    } finally {
      this.downloadingQuittancePaymentId.set(null);
    }
  }
}
