import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ContractDto } from '../../models/models';
import { ContractService } from '../../services/contracts.service';

@Component({
  selector: 'new-contract',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './new-contract.html',
  styleUrl: './new-contract.scss',
})
export class NewContract {
  private readonly translate = inject(TranslateService);
  private readonly contractService = inject(ContractService);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ContractDto>();

  loading = signal(false);

  contract: ContractDto = {
    id: '',
    propertyName: '',
    tenantNames: '',
    startDate: '',
    endDate: '',
    type: 'unfurnished',
    duration: '',
    rent: 0,
    status: 'active'
  };

  typeOptions = [
    { id: 'furnished', label: 'NEW_CONTRACT.TYPE_OPTIONS.FURNISHED' },
    { id: 'unfurnished', label: 'NEW_CONTRACT.TYPE_OPTIONS.UNFURNISHED' }
  ];

  statusOptions = [
    { id: 'active', label: 'NEW_CONTRACT.STATUS_OPTIONS.ACTIVE' },
    { id: 'expiringSoon', label: 'NEW_CONTRACT.STATUS_OPTIONS.EXPIRING' },
    { id: 'terminated', label: 'NEW_CONTRACT.STATUS_OPTIONS.TERMINATED' }
  ];

  async saveContract() {
    if (!this.contract.propertyName || !this.contract.tenantNames || !this.contract.startDate || !this.contract.endDate) {
      alert(this.translate.instant('COMMON.FILL_REQUIRED_FIELDS'));
      return;
    }

    try {
      this.loading.set(true);
      const created = await this.contractService.create(this.contract);
      this.saved.emit(created);
      this.close.emit();
    } catch (err) {
      console.error('Erreur création contrat :', err);
      alert(this.translate.instant('COMMON.ERROR'));
    } finally {
      this.loading.set(false);
    }
  }
}
