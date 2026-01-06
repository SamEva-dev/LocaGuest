import { Component, signal, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesApi } from '../../../../core/api/properties.api';
import { TenantsApi } from '../../../../core/api/tenants.api';
import { ContractsApi } from '../../../../core/api/contracts.api';
import { DocumentsApi } from '../../../../core/api/documents.api';

interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
}

interface ContractFormData {
  tenantId: string;
  propertyId: string;
  type: 'Furnished' | 'Unfurnished';
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  charges?: number;
}

@Component({
  selector: 'app-contract-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-wizard.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ContractWizardComponent {
  private propertiesApi = inject(PropertiesApi);
  private tenantsApi = inject(TenantsApi);
  private contractsApi = inject(ContractsApi);
  private documentsApi = inject(DocumentsApi);

  closed = output<void>();
  contractCreated = output<string>(); // contractId

  currentStep = signal(1);
  isGenerating = signal(false);
  
  tenants = signal<any[]>([]);
  properties = signal<any[]>([]);
  
  // Convertir en signal pour la réactivité
  formData = signal<ContractFormData>({
    tenantId: '',
    propertyId: '',
    type: 'Unfurnished',
    startDate: '',
    endDate: '',
    rent: 0,
    deposit: 0
  });

  createdContractId = signal<string>('');
  createdContractCode = signal<string>('');
  generatedDocuments = signal<Array<{type: string, signed: boolean, id?: string}>>([]);

  steps: WizardStep[] = [
    { id: 1, title: 'Informations', subtitle: 'Détails du contrat', icon: 'ph-info' },
    { id: 2, title: 'Documents', subtitle: 'Génération', icon: 'ph-files' },
    { id: 3, title: 'Signature', subtitle: 'Validation', icon: 'ph-pen' },
    { id: 4, title: 'Terminé', subtitle: 'Succès', icon: 'ph-check' }
  ];

  allDocumentsSigned = computed(() => {
    const docs = this.generatedDocuments();
    return docs.length > 0 && docs.every(d => d.signed);
  });

  // Computed signal pour la validation du formulaire
  canProceed = computed(() => {
    const data = this.formData();
    const step = this.currentStep();
    
    switch (step) {
      case 1:
        return !!(data.tenantId && data.propertyId && 
                  data.startDate && data.endDate && 
                  data.rent > 0 && data.deposit >= 0);
      case 2:
        return this.generatedDocuments().length > 0;
      case 3:
        return this.allDocumentsSigned();
      default:
        return true;
    }
  });

  constructor() {
    this.loadData();
  }

  updateFormData(key: keyof ContractFormData, value: any) {
    this.formData.update(data => {
      const newData = { ...data, [key]: value };
      return newData;
    });
  }

  loadData() {
    // Load tenants
    this.tenantsApi.getTenants().subscribe({
      next: (result) => {
        this.tenants.set(result.items || []);
      },
      error: (err) => console.error('Error loading tenants:', err)
    });

    // Load properties (vacant only)
    this.propertiesApi.getProperties().subscribe({
      next: (result) => {
        const vacantProperties = (result.items || []).filter((p: any) => p.status === 'Vacant');
        this.properties.set(vacantProperties);
      },
      error: (err) => console.error('Error loading properties:', err)
    });
  }

  nextStep() {
    if (!this.canProceed()) return;

    if (this.currentStep() === 1) {
      // Create contract first
      this.createContract();
    } else if (this.currentStep() === 3) {
      // Finalize
      this.finalizeContract();
    } else {
      this.currentStep.update(v => v + 1);
    }
  }

  previousStep() {
    this.currentStep.update(v => Math.max(1, v - 1));
  }

  createContract() {
    const data = this.formData();
    
    // Ensure proper types for backend
    // Convert dates from YYYY-MM-DD to ISO 8601 format
    const startDateISO = data.startDate ? new Date(data.startDate + 'T00:00:00Z').toISOString() : '';
    const endDateISO = data.endDate ? new Date(data.endDate + 'T00:00:00Z').toISOString() : '';
    
    const payload = {
      propertyId: data.propertyId,
      tenantId: data.tenantId,
      type: data.type,
      startDate: startDateISO,
      endDate: endDateISO,
      rent: Number(data.rent) || 0,
      deposit: Number(data.deposit) || 0
    };

    this.contractsApi.createContract(payload).subscribe({
      next: (response: any) => {
        this.createdContractId.set(response.id);
        this.createdContractCode.set(response.code || 'CTR-XXX');
        this.currentStep.set(2);
      },
      error: (err) => {
        console.error('❌ Error creating contract:', err);
        alert('Erreur lors de la création du contrat');
      }
    });
  }

  generateDocuments() {
    this.isGenerating.set(true);
    const contractId = this.createdContractId();
    const data = this.formData();

    // Generate Bail
    this.documentsApi.generateContract({
      contractId,
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      contractType: 'Bail',
      startDate: data.startDate,
      endDate: data.endDate,
      rent: data.rent,
      deposit: data.deposit,
      charges: data.charges
    }).subscribe({
      next: () => {
        this.generatedDocuments.update(docs => [...docs, { type: 'Bail', signed: false }]);
        
        // Generate État des lieux
        this.documentsApi.generateContract({
          contractId,
          tenantId: data.tenantId,
          propertyId: data.propertyId,
          contractType: 'EtatDesLieuxEntree',
          startDate: data.startDate,
          endDate: data.endDate,
          rent: data.rent
        }).subscribe({
          next: () => {
            this.generatedDocuments.update(docs => [...docs, { type: 'État des lieux d\'entrée', signed: false }]);
            this.isGenerating.set(false);
          },
          error: (err) => {
            console.error('❌ Error generating état des lieux:', err);
            this.isGenerating.set(false);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error generating bail:', err);
        this.isGenerating.set(false);
        alert('Erreur lors de la génération des documents');
      }
    });
  }

  markAsSigned(doc: any) {
    // TODO: Call API to mark document as signed
    const index = this.generatedDocuments().findIndex(d => d.type === doc.type);
    if (index >= 0) {
      this.generatedDocuments.update(docs => {
        const newDocs = [...docs];
        newDocs[index] = { ...newDocs[index], signed: true };
        return newDocs;
      });
    }
  }

  finalizeContract() {
    this.currentStep.set(4);
    this.contractCreated.emit(this.createdContractId());
  }

  close() {
    this.closed.emit();
  }
}
