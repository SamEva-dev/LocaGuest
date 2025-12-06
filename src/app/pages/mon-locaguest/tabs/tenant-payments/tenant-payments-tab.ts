import { Component, input, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsApi, Payment, PaymentStats } from '../../../../core/api/payments.api';
import { AddPaymentModal } from './add-payment-modal/add-payment-modal';

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
  
  // State
  payments = signal<Payment[]>([]);
  stats = signal<PaymentStats | null>(null);
  isLoading = signal(false);
  showAddModal = signal(false);
  
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
  
  downloadReceipt(payment: Payment) {
    if (payment.receiptId) {
      console.log('Download receipt:', payment.receiptId);
      // TODO: Implement receipt download
      alert('Téléchargement de la quittance - À implémenter');
    }
  }
}
