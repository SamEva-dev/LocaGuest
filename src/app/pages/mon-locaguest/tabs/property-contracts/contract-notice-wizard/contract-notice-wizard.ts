import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ContractsApi } from '../../../../../core/api/contracts.api';
import { ToastService } from '../../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../../core/ui/confirm.service';

export interface ContractNoticeData {
  contract: any;
  propertyName: string;
  tenantName: string;
  roomName?: string;
}

@Component({
  selector: 'contract-notice-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-notice-wizard.html'
})
export class ContractNoticeWizard {
  @Input() data!: ContractNoticeData;
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private contractsApi = inject(ContractsApi);
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);

  isSubmitting = signal(false);

  form = signal({
    noticeDate: new Date().toISOString().split('T')[0],
    noticeMonths: 3,
    reason: '',
    endDate: ''
  });

  calculatedEndDate = computed(() => {
    const f = this.form();
    if (!f.noticeDate || !f.noticeMonths) return '';
    const d = new Date(f.noticeDate);
    const end = new Date(d);
    end.setMonth(end.getMonth() + Number(f.noticeMonths));
    return end.toISOString().split('T')[0];
  });

  updateField<K extends keyof ReturnType<typeof this.form>>(key: K, value: any) {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  async submit() {
    const contractId = this.data?.contract?.id;
    if (!contractId) {
      this.toasts.errorDirect('Contrat introuvable');
      return;
    }

    const f = this.form();
    const endDate = this.calculatedEndDate();

    if (!f.reason?.trim()) {
      this.toasts.warningDirect('Veuillez saisir le motif');
      return;
    }

    const confirmed = await this.confirmService.info(
      'Donner préavis',
      `Confirmer l\'enregistrement du préavis (fin prévue: ${endDate}) ?`
    );
    if (!confirmed) return;

    this.isSubmitting.set(true);
    try {
      await firstValueFrom(
        this.contractsApi.giveNotice(contractId, {
          noticeDate: f.noticeDate,
          noticeEndDate: endDate,
          reason: f.reason
        })
      );

      this.toasts.successDirect('Préavis enregistré');
      this.completed.emit();
    } catch (err: any) {
      this.toasts.errorDirect(err?.error?.message || 'Erreur lors de l\'enregistrement du préavis');
      console.error('Notice error:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async cancel() {
    const confirmed = await this.confirmService.info('Annuler', 'Voulez-vous annuler ?');
    if (confirmed) this.cancelled.emit();
  }
}
