import { Component, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractsApi } from '../../../../../core/api/contracts.api';
import { DepositsApi, DepositDto } from '../../../../../core/api/deposits.api';
import { ToastService } from '../../../../../core/ui/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
  selector: 'add-deposit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './add-deposit-modal.html'
})
export class AddDepositModal implements OnInit {
  tenantId = input.required<string>();
  tenantName = input<string>('');

  depositRecorded = output<void>();
  close = output<void>();

  private contractsApi = inject(ContractsApi);
  private depositsApi = inject(DepositsApi);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  contracts = signal<ContractOption[]>([]);
  isLoadingContracts = signal(false);
  isLoadingDeposit = signal(false);
  isSaving = signal(false);

  deposit = signal<DepositDto | null>(null);

  allowInstallments = computed(() => this.deposit()?.allowInstallments ?? true);

  form = signal({
    contractId: '',
    amount: 0,
    dateUtc: new Date().toISOString().split('T')[0],
    reference: ''
  });

  selectedContract = computed(() => {
    const id = this.form().contractId;
    return this.contracts().find(c => c.id === id);
  });

  outstanding = computed(() => this.deposit()?.outstanding ?? 0);

  maxPayableAmount = computed(() => {
    const d = this.deposit();
    if (!d) return 0;
    const expected = d.amountExpected ?? 0;
    const outstanding = d.outstanding ?? 0;
    return Math.max(0, Math.min(expected, outstanding));
  });

  canSubmit = computed(() => {
    const f = this.form();
    return !!f.contractId && f.amount > 0 && !!f.dateUtc && !this.isSaving();
  });

  ngOnInit() {
    this.loadContracts();
  }

  setAmount(value: unknown) {
    const num = typeof value === 'number' ? value : Number(value);
    const max = this.maxPayableAmount();
    const raw = Number.isFinite(num) ? num : 0;
    const clamped = Math.max(0, Math.min(raw, max > 0 ? max : raw));
    this.form.update(current => ({ ...current, amount: clamped }));
  }

  setDateUtc(value: unknown) {
    this.form.update(current => ({ ...current, dateUtc: String(value ?? '') }));
  }

  setReference(value: unknown) {
    this.form.update(current => ({ ...current, reference: String(value ?? '') }));
  }

  loadContracts() {
    this.isLoadingContracts.set(true);

    this.contractsApi.getContractsByTenant(this.tenantId()).subscribe({
      next: (contracts: any) => {
        const activeContracts = (contracts || [])
          .filter((c: any) => c.status === 'Active' || c.status === 'Signed' || c.status === 'Draft')
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
        this.toastService.error('DEPOSITS.PAY.ERRORS.LOAD_CONTRACTS');
        this.isLoadingContracts.set(false);
      }
    });
  }

  selectContract(contractId: string) {
    this.form.update(f => ({ ...f, contractId }));
    this.loadDeposit(contractId);
  }

  loadDeposit(contractId: string) {
    this.isLoadingDeposit.set(true);
    this.deposit.set(null);

    this.depositsApi.getByContract(contractId).subscribe({
      next: (deposit) => {
        this.deposit.set(deposit);
        const max = Math.max(0, Math.min(deposit.amountExpected ?? 0, deposit.outstanding ?? 0));
        this.form.update(f => ({ ...f, amount: max }));
        this.isLoadingDeposit.set(false);
      },
      error: (err) => {
        console.error('Error loading deposit:', err);
        this.toastService.error('DEPOSITS.PAY.ERRORS.LOAD_DEPOSIT');
        this.isLoadingDeposit.set(false);
      }
    });
  }

  submit() {
    if (!this.canSubmit()) return;

    const f = this.form();
    this.isSaving.set(true);

    const max = this.maxPayableAmount();
    const amount = Math.max(0, Math.min(Number(f.amount) || 0, max > 0 ? max : Number(f.amount) || 0));

    if (!this.allowInstallments() && max > 0 && amount !== max) {
      this.toastService.errorDirect(
        this.translate.instant('DEPOSITS.PAY.ERRORS.INSTALLMENTS_NOT_ALLOWED')
      );
      this.isSaving.set(false);
      return;
    }

    const dateUtcIso = new Date(f.dateUtc + 'T00:00:00Z').toISOString();

    this.depositsApi.receiveByContract(f.contractId, {
      amount: amount,
      dateUtc: dateUtcIso,
      reference: f.reference?.trim() || null
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.depositRecorded.emit();
      },
      error: (err) => {
        console.error('Error recording deposit:', err);
        this.isSaving.set(false);
        this.toastService.error('DEPOSITS.PAY.ERRORS.RECORD');
      }
    });
  }

  closeModal() {
    this.close.emit();
  }
}
