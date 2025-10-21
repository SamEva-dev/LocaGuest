import { Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ContractDto, ContractFilter } from '../../models/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contracts.service';
import { Router } from '@angular/router';
import { NewContract } from '../new-contract/new-contract';

@Component({
  selector: 'app-contracts',
  imports: [FormsModule, CommonModule, TranslatePipe, NewContract],
  templateUrl: './contracts.html',
  styleUrl: './contracts.scss'
})
export class Contracts {

   private readonly translate = inject(TranslateService);
  public readonly contractService = inject(ContractService);
  private readonly router = inject(Router);

  readonly search = signal('');
  readonly contracts = this.contractService.contracts;
  readonly stats = this.contractService.stats;
  readonly loading = this.contractService.loading;
  readonly documents = this.contractService.documents;
  readonly isNewContractOpen = signal(false);
  readonly selectedStatus = signal('all');
  readonly selectedType = signal('all');
  readonly filtersOpen = signal(false);
  readonly filter = signal<ContractFilter>({});

  async ngOnInit() {
    await this.contractService.loadAll();
  }

  // get filteredContracts() {
  //   const q = this.search().toLowerCase().trim();
  //   if (!q) return this.contracts();
  //   return this.contracts().filter(c =>
  //     c.propertyName.toLowerCase().includes(q) ||
  //     c.tenantNames.toLowerCase().includes(q)
  //   );
  // }

  /** 🔍 Voir contrat */
  async onView(contract: ContractDto) {
    try {
      const full = await this.contractService.loadById(contract.id);
      this.contractService.selected.set(full);
      alert(
        `${this.translate.instant('CONTRACTS.ACTIONS.VIEW')}:\n` +
        `${full.propertyName}\n${full.tenantNames}\n${full.startDate} - ${full.endDate}`
      );
      // futur : this.router.navigate(['/contracts', contract.id])
    } catch (e) {
      console.error(e);
    }
  }
    toggleFilters() {
      this.filtersOpen.update(v => !v);
    }

    get filteredContracts() {
    const searchValue = this.search().toLowerCase().trim();
    const status = this.selectedStatus();
    const type = this.selectedType();

    let filtered = this.contracts().filter(c => {
      const matchSearch =
        !searchValue ||
        c.propertyName.toLowerCase().includes(searchValue) ||
        c.tenantNames.toLowerCase().includes(searchValue);
      const matchStatus = status === 'all' || c.status === status;
      const matchType = type === 'all' || c.type === type;
      return matchSearch && matchStatus && matchType;
    });

    // fallback backend si vide
    if (filtered.length === 0 && this.contracts().length > 0) {
      this.contractService.filterContracts({
        status: status !== 'all' ? status : undefined,
        type: type !== 'all' ? type : undefined,
        tenant: searchValue
      });
    }

    return filtered;
  }

  async applyAdvancedFilters() {
    await this.contractService.filterContracts(this.filter());
    this.filtersOpen.set(false);
  }

  resetAdvancedFilters() {
    this.filter.set({});
    this.contractService.loadAll();
    this.filtersOpen.set(false);
  }

  openNewContract() {
    this.isNewContractOpen.set(true);
  }

  onContractSaved(contract: ContractDto) {
    this.contractService.contracts.update(list => [contract, ...list]);
    this.isNewContractOpen.set(false);
  }
  closeNewContract() {
    this.isNewContractOpen.set(false);
  }


  /** ✏️ Modifier contrat */
  async onEdit(contract: ContractDto) {
    try {
      const full = await this.contractService.loadById(contract.id);
      const updated: ContractDto = {
        ...full,
        rent: full.rent + 50 // exemple de modification
      };
      await this.contractService.update(updated, 'W/"etag-simulé"');
      alert(this.translate.instant('COMMON.SAVE_SUCCESS'));
    } catch (e) {
      console.error(e);
    }
  }

  /** 📄 Voir documents */
  async onDocs(contract: ContractDto) {
    try {
      const docs = await this.contractService.loadDocuments(contract.id);
      const docList = docs.map(d => `• ${d.title} (${d.size})`).join('\n');
      alert(
        `${this.translate.instant('CONTRACTS.ACTIONS.DOCS')}:\n\n${docList}`
      );
    } catch (e) {
      console.error(e);
    }
  }
}
