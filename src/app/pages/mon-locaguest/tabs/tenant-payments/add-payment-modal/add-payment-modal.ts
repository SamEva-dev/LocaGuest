import { Component, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsApi, CreatePaymentRequest, PaymentMethod } from '../../../../../core/api/payments.api';
import { ContractsApi } from '../../../../../core/api/contracts.api';
import { ToastService } from '../../../../../core/ui/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';

interface ContractOption {
  id: string;
  propertyId: string;
  propertyName: string;
  startDate: Date;
  endDate: Date;
  rent: number;
  charges: number;
}

@Component({
  selector: 'add-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './add-payment-modal.html'
})
export class AddPaymentModal implements OnInit {
  // Inputs
  tenantId = input.required<string>();
  tenantName = input<string>('');
  
  // Outputs
  paymentCreated = output<void>();
  close = output<void>();
  
  // Services
  private paymentsApi = inject(PaymentsApi);
  private contractsApi = inject(ContractsApi);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  
  // State
  contracts = signal<ContractOption[]>([]);
  isLoadingContracts = signal(false);
  isSaving = signal(false);
  
  // Form
  form = signal({
    contractId: '',
    propertyId: '',
    paymentType: 'Rent' as 'Rent' | 'Deposit',
    amountDue: 0,
    amountPaid: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    expectedDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    paymentMethod: 'BankTransfer' as PaymentMethod,
    note: ''
  });
  
  // Expose Math for template
  Math = Math;
  
  // Payment methods
  paymentMethods: Array<{value: PaymentMethod, label: string}> = [
    { value: 'BankTransfer', label: 'PAYMENTS.METHODS.BANK_TRANSFER' },
    { value: 'Cash', label: 'PAYMENTS.METHODS.CASH' },
    { value: 'Check', label: 'PAYMENTS.METHODS.CHECK' },
    { value: 'Other', label: 'PAYMENTS.METHODS.OTHER' }
  ];
  
  // Computed
  selectedContract = computed(() => {
    const contractId = this.form().contractId;
    return this.contracts().find(c => c.id === contractId);
  });
  
  totalAmount = computed(() => {
    const contract = this.selectedContract();
    if (!contract) return 0;
    return contract.rent + (contract.charges || 0);
  });
  
  canSubmit = computed(() => {
    const f = this.form();
    return (
      f.contractId &&
      f.amountPaid > 0 &&
      f.paymentDate &&
      f.expectedDate &&
      !this.isSaving()
    );
  });
  
  ngOnInit() {
    this.loadContracts();
  }
  
  loadContracts() {
    this.isLoadingContracts.set(true);
    
    this.contractsApi.getContractsByTenant(this.tenantId()).subscribe({
      next: (contracts: any) => {
        const activeContracts = contracts
          .filter((c: any) => c.status === 'Active' || c.status === 'Signed')
          .map((c: any) => ({
            id: c.id,
            propertyId: c.propertyId,
            propertyName: c.propertyName || this.translate.instant('COMMON.UNKNOWN_PROPERTY'),
            startDate: new Date(c.startDate),
            endDate: new Date(c.endDate),
            rent: c.rent,
            charges: c.charges || 0
          }));
        
        this.contracts.set(activeContracts);
        
        if (activeContracts.length === 1) {
          this.selectContract(activeContracts[0].id);
        }
        
        this.isLoadingContracts.set(false);
      },
      error: (err: any) => {
        console.error('Error loading contracts:', err);
        this.toastService.error('PAYMENTS.ERRORS.LOAD_CONTRACTS');
        this.isLoadingContracts.set(false);
      }
    });
  }
  
  selectContract(contractId: string) {
    const contract = this.contracts().find(c => c.id === contractId);
    if (!contract) return;
    
    this.form.update(f => ({
      ...f,
      contractId: contract.id,
      propertyId: contract.propertyId,
      amountDue: contract.rent + contract.charges
    }));
    
    // Auto-fill amountPaid if empty
    if (this.form().amountPaid === 0) {
      this.form.update(f => ({
        ...f,
        amountPaid: f.amountDue
      }));
    }
  }
  
  onContractChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectContract(select.value);
  }
  
  fillFullAmount() {
    this.form.update(f => ({
      ...f,
      amountPaid: f.amountDue
    }));
  }
  
  handleSubmit() {
    if (!this.canSubmit()) return;
    
    const f = this.form();
    
    const request: CreatePaymentRequest = {
      tenantId: this.tenantId(),
      propertyId: f.propertyId,
      contractId: f.contractId,
      paymentType: f.paymentType,
      amountDue: f.amountDue,
      amountPaid: f.amountPaid,
      paymentDate: f.paymentDate ? new Date(f.paymentDate) : undefined,
      expectedDate: new Date(f.expectedDate),
      paymentMethod: f.paymentMethod,
      note: f.note || undefined
    };
    
    this.isSaving.set(true);
    this.paymentsApi.createPayment(request).subscribe({
      next: (payment) => {
        this.toastService.success('PAYMENTS.SUCCESS.CREATED');
        this.paymentCreated.emit();
      },
      error: (err) => {
        console.error('Error creating payment:', err);
        this.toastService.errorDirect(
          err.error?.message || this.translate.instant('PAYMENTS.ERRORS.CREATE')
        );
        this.isSaving.set(false);
      }
    });
  }
  
  handleClose() {
    this.close.emit();
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}
