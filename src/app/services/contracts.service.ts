import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ContractApi } from '../core/api/contracts.api';
import { ContractDto, ContractFilter, ContractStatsDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly api = inject(ContractApi);

  readonly loading = signal(false);
  readonly contracts = signal<ContractDto[]>([]);
  readonly stats = signal<ContractStatsDto | null>(null);
  readonly selected = signal<ContractDto | null>(null);
  readonly documents = signal<{ id: string; title: string; url: string; size: string }[]>([]);
  readonly statusOptions = signal<{ id: string; label: string }[]>([]);
readonly typeOptions = signal<{ id: string; label: string }[]>([]);


  /** Charge tout (liste + stats) */
 async loadAll() {
  this.loading.set(true);
  try {
    const [list, stats] = await Promise.all([
      firstValueFrom(this.api.getAll()),
      firstValueFrom(this.api.getStats())
    ]);
    this.contracts.set(list);
    this.stats.set(stats);

    // simulation ou futur appel dédié /contracts/filters
    const filters = {
      statuses: [
        { id: 'all', label: 'CONTRACTS.FILTERS.ALL_STATUS' },
        { id: 'active', label: 'CONTRACTS.FILTERS.ACTIVE' },
        { id: 'expiringSoon', label: 'CONTRACTS.FILTERS.EXPIRING' }
      ],
      types: [
        { id: 'all', label: 'CONTRACTS.FILTERS.ALL_TYPES' },
        { id: 'furnished', label: 'CONTRACTS.FILTERS.FURNISHED' },
        { id: 'unfurnished', label: 'CONTRACTS.FILTERS.UNFURNISHED' }
      ]
    };

    this.statusOptions.set(filters.statuses);
    this.typeOptions.set(filters.types);
  }
   finally {
    this.loading.set(false);
  }
}

  /** Charge un contrat spécifique */
  async loadById(id: string) {
    this.loading.set(true);
    try {
      const c = await firstValueFrom(this.api.getById(id));
      this.selected.set(c);
      return c;
    } finally {
      this.loading.set(false);
    }
  }

  /** Création */
  async create(contract: ContractDto) {
    const created = await firstValueFrom(this.api.create(contract));
    this.contracts.update(list => [created, ...list]);
    return created;
  }

  /** Mise à jour */
  async update(contract: ContractDto, etag: string) {
    const updated = await firstValueFrom(this.api.update(contract.id, contract, etag));
    this.contracts.update(list => list.map(c => (c.id === contract.id ? updated : c)));
    this.selected.set(updated);
    return updated;
  }

  /** Suppression */
  async delete(id: string, etag?: string) {
    await firstValueFrom(this.api.delete(id, etag));
    this.contracts.update(list => list.filter(c => c.id !== id));
  }

  /** Récupère les documents d’un contrat */
  async loadDocuments(id: string) {
    const docs = await firstValueFrom(this.api.getDocuments(id));
    this.documents.set(docs);
    return docs;
  }
   async filterContracts(filter: ContractFilter): Promise<ContractDto[]> {
    const local = this.contracts();

    if (local.length > 0) {
      const filtered = local.filter(c => {
        if (filter.status && c.status !== filter.status) return false;
        if (filter.type && c.type !== filter.type) return false;
        if (filter.tenant && !c.tenantNames.toLowerCase().includes(filter.tenant.toLowerCase())) return false;
        if (filter.propertyName && !c.propertyName.toLowerCase().includes(filter.propertyName.toLowerCase())) return false;
        if (filter.startAfter && new Date(c.startDate) < new Date(filter.startAfter)) return false;
        if (filter.endBefore && new Date(c.endDate) > new Date(filter.endBefore)) return false;
        if (filter.minRent && c.rent < filter.minRent) return false;
        if (filter.maxRent && c.rent > filter.maxRent) return false;
        return true;
      });

      if (filtered.length > 0) {
        this.contracts.set(filtered);
        return filtered;
      }
    }

    // fallback backend
    this.loading.set(true);
    try {
      const result = await firstValueFrom(this.api.getFilteredContracts(filter));
      this.contracts.set(result ?? []);
      return result ?? [];
    } finally {
      this.loading.set(false);
    }
  }
}
