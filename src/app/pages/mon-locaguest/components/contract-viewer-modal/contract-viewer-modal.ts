import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal, computed, effect } from '@angular/core';
import { AddendumsApi, AddendumDto } from '../../../../core/api/addendums.api';
import { DocumentsApi } from '../../../../core/api/documents.api';
import { ContractViewerDto } from '../../../../core/models/contract-viewer.models';

@Component({
  selector: 'contract-viewer-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './contract-viewer-modal.html'
})
export class ContractViewerModal {
  @Input() visible = signal(false);
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() contractIdInput?: string;

  contractId = signal<string | null>(null);

  private readonly documentsApi = inject(DocumentsApi);
  private readonly addendumsApi = inject(AddendumsApi);

  isLoading = signal(false);
  error = signal<string | null>(null);
  data = signal<ContractViewerDto | null>(null);
  signedAddendums = signal<AddendumDto[]>([]);

  title = computed(() => {
    const d = this.data();
    if (!d) return 'Contrat';
    const code = d.contract.code ? ` • ${d.contract.code}` : '';
    return `Contrat${code}`;
  });

  open(contractId: string) {
    this.contractId.set(contractId);
    this.visible.set(true);
    this.visibleChange.emit(true);
  }

  close() {
    this.visible.set(false);
    this.visibleChange.emit(false);
  }

  constructor() {
    effect(() => {
      const inputId = this.contractIdInput;
      if (inputId) {
        this.contractId.set(inputId);
      }

      const isOpen = this.visible();
      const id = this.contractId();
      if (!isOpen || !id) return;

      this.isLoading.set(true);
      this.error.set(null);
      this.signedAddendums.set([]);

      this.documentsApi.getContractViewer(id).subscribe({
        next: (dto) => {
          this.data.set(dto as any);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Error loading contract viewer:', err);
          this.error.set('Erreur lors du chargement du contrat');
          this.isLoading.set(false);
        }
      });

      this.addendumsApi.getAddendums({ contractId: id, signatureStatus: 'Signed', page: 1, pageSize: 50 }).subscribe({
        next: (res) => {
          const items = (res?.data ?? [])
            .slice()
            .sort((a, b) => (a.effectiveDate || '').localeCompare(b.effectiveDate || ''));
          this.signedAddendums.set(items);
        },
        error: (err) => {
          console.error('❌ Error loading signed addendums for contract viewer:', err);
          this.signedAddendums.set([]);
        }
      });
    }, { allowSignalWrites: true });
  }

  onBackdropClick() {
    this.close();
  }
}
