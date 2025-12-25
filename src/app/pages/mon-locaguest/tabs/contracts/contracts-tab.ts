import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ContractsApi, ContractDto, ContractStats, CreateContractRequest, TerminateContractRequest, RecordPaymentRequest } from '../../../../core/api/contracts.api';
import { TenantsApi } from '../../../../core/api/tenants.api';
import { PropertiesApi } from '../../../../core/api/properties.api';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';


@Component({
  selector: 'contracts-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl:'contracts-tab.html'
})
export class ContractsTab implements OnInit {
  private contractsApi = inject(ContractsApi);
  private tenantsApi = inject(TenantsApi);
  private propertiesApi = inject(PropertiesApi);
  private fb = inject(FormBuilder);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  stats = signal<ContractStats | null>(null);
  contracts = signal<ContractDto[]>([]);
  isLoading = signal(false);
  
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';

  // Modals
  showCreateModal = signal(false);
  showPaymentModal = signal(false);
  showTerminateModal = signal(false);
  showViewModal = signal(false);
  selectedContract = signal<ContractDto | null>(null);

  // Forms
  createForm = this.fb.group({
    propertyId: ['', Validators.required],
    tenantId: ['', Validators.required],
    type: ['Furnished', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    rent: [0, [Validators.required, Validators.min(0)]],
    deposit: [0, Validators.min(0)]
  });

  paymentForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0)]],
    paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
    method: ['BankTransfer', Validators.required]
  });

  terminateForm = this.fb.group({
    terminationDate: [new Date().toISOString().split('T')[0], Validators.required],
    reason: [''],
    markPropertyVacant: [true]
  });

  ngOnInit() {
    this.loadStats();
    this.loadContracts();
  }

  loadStats() {
    this.contractsApi.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('❌ Error loading contract stats:', err)
    });
  }

  loadContracts() {
    this.isLoading.set(true);
    this.contractsApi.getAllContracts(this.searchTerm, this.statusFilter, this.typeFilter).subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.isLoading.set(false);
        console.log('✅ Contracts loaded:', data.length);
      },
      error: (err) => {
        console.error('❌ Error loading contracts:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange() {
    this.loadContracts();
  }

  onFilterChange() {
    this.loadContracts();
  }

  // View contract details
  viewContract(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.showViewModal.set(true);
  }

  // Create contract
  openCreateModal() {
    this.createForm.reset({
      type: 'Furnished',
      rent: 0,
      deposit: 0
    });
    this.showCreateModal.set(true);
  }

  submitCreate() {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.value;
    const request: CreateContractRequest = {
      propertyId: formValue.propertyId!,
      tenantId: formValue.tenantId!,
      type: formValue.type as 'Furnished' | 'Unfurnished',
      startDate: formValue.startDate!,
      endDate: formValue.endDate!,
      rent: formValue.rent!,
      deposit: formValue.deposit || 0
    };

    this.contractsApi.createContract(request).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.loadContracts();
        this.loadStats();
        this.toasts.successDirect('Contrat créé avec succès !');
      },
      error: (err) => {
        console.error('❌ Error creating contract:', err);
        this.toasts.errorDirect('Erreur lors de la création du contrat');
      }
    });
  }

  // Record payment
  openPaymentModal(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.paymentForm.reset({
      amount: contract.rent,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'BankTransfer'
    });
    this.showPaymentModal.set(true);
  }

  submitPayment() {
    if (this.paymentForm.invalid) return;

    const contract = this.selectedContract();
    if (!contract) return;

    const formValue = this.paymentForm.value;
    const request: RecordPaymentRequest = {
      amount: formValue.amount!,
      paymentDate: formValue.paymentDate!,
      method: formValue.method as any
    };

    this.contractsApi.recordPayment(contract.id, request).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.loadContracts();
        this.toasts.successDirect('Paiement enregistré avec succès !');
      },
      error: (err) => {
        console.error('❌ Error recording payment:', err);
        this.toasts.errorDirect('Erreur lors de l\'enregistrement du paiement');
      }
    });
  }

  // Terminate contract
  openTerminateModal(contract: ContractDto) {
    this.selectedContract.set(contract);
    this.terminateForm.reset({
      terminationDate: new Date().toISOString().split('T')[0],
      reason: '',
      markPropertyVacant: true
    });
    this.showTerminateModal.set(true);
  }

  async submitTerminate() {
    if (this.terminateForm.invalid) return;
    const confirmed = await this.confirmService.danger(
      'Résilier le contrat',
      'Êtes-vous sûr de vouloir résilier ce contrat ?',
      'Résilier'
    );
    if (!confirmed) return;

    const contract = this.selectedContract();
    console.log('contract to resilier',contract)
    if (!contract) return;

    const formValue = this.terminateForm.value;
    const request: TerminateContractRequest = {
      terminationDate: formValue.terminationDate!,
      contractId: contract.id,
      reason: formValue.reason || ''
    };

    this.contractsApi.terminateContract(contract.id, request).subscribe({
      next: () => {
        this.showTerminateModal.set(false);
        this.loadContracts();
        this.loadStats();
        this.toasts.successDirect('Contrat résilié avec succès');
      },
      error: (err) => {
        console.error('❌ Error terminating contract:', err);
        this.toasts.errorDirect('Erreur lors de la résiliation du contrat');
      }
    });
  }

  closeModals() {
    this.showCreateModal.set(false);
    this.showPaymentModal.set(false);
    this.showTerminateModal.set(false);
    this.showViewModal.set(false);
    this.selectedContract.set(null);
  }
}
