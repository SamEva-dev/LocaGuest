import { Component, input, output, signal, inject } from '@angular/core';
import { Contract } from '../../../../../core/api/properties.api';
import { TenantListItem } from '../../../../../core/api/tenants.api';
import { ContractsApi } from '../../../../../core/api/contracts.api';
import { DocumentsService } from '../../../../../core/services/documents.service';
import { firstValueFrom } from 'rxjs';

type SignatureMethod = 'paper' | 'electronic';

@Component({
  selector: 'mark-signed-modal',
  standalone: true,
  imports: [],
  templateUrl: './mark-signed-modal.html'
})
export class MarkSignedModal {
  contract = input.required<Contract>();
  tenant = input.required<TenantListItem>();
  propertyId = input.required<string>();
  
  closed = output<void>();
  success = output<void>();
  
  private contractsApi = inject(ContractsApi);
  private documentsService = inject(DocumentsService);
  
  // États
  isSubmitting = signal(false);
  step = signal<'method' | 'upload' | 'confirm'>('method');
  signatureMethod = signal<SignatureMethod | null>(null);
  uploadedFile = signal<File | null>(null);
  signedDate = signal<string>(new Date().toISOString().split('T')[0]);
  
  // Méthodes
  selectMethod(method: SignatureMethod) {
    this.signatureMethod.set(method);
    
    if (method === 'paper') {
      // Pour papier, on peut directement aller à la confirmation
      this.step.set('confirm');
    } else {
      // Pour électronique, on demande l'upload du PDF signé
      this.step.set('upload');
    }
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Veuillez sélectionner un fichier PDF.');
        return;
      }
      
      this.uploadedFile.set(file);
      this.step.set('confirm');
    }
  }
  
  triggerFileInput() {
    const input = document.getElementById('signed-pdf-input') as HTMLInputElement;
    input?.click();
  }
  
  goBack() {
    if (this.step() === 'confirm') {
      if (this.signatureMethod() === 'electronic') {
        this.step.set('upload');
      } else {
        this.step.set('method');
      }
    } else if (this.step() === 'upload') {
      this.step.set('method');
    }
  }
  
  async confirmSignature() {
    if (this.isSubmitting()) return;
    
    try {
      this.isSubmitting.set(true);
      
      // 1. Upload du PDF signé si fourni
      if (this.uploadedFile()) {
        const uploadResponse = await firstValueFrom(
          this.documentsService.uploadDocument(
            this.uploadedFile()!,
            'Bail',
            'Contrats',
            this.contract().id,
            this.tenant().id,
            this.propertyId(),
            'Contrat signé'
          )
        );
        void uploadResponse;
      }
      
      // 2. Marquer comme signé
      const response = await firstValueFrom(
        this.contractsApi.markAsSigned(this.contract().id, {
          signedDate: this.signedDate(),
          contractId:this.contract().id
        })
      );
      void response;
      
      // Success
      this.success.emit();
      
    } catch (error: any) {
      console.error('❌ Erreur signature contrat:', error);
      const errorMsg = error?.error?.message || 'Erreur lors de la signature du contrat';
      alert(`Erreur : ${errorMsg}`);
    } finally {
      this.isSubmitting.set(false);
    }
  }
  
  close() {
    if (!this.isSubmitting()) {
      this.closed.emit();
    }
  }
  
  // Helper pour afficher les infos du contrat
  get contractSummary() {
    const c = this.contract();
    return {
      tenant: this.tenant().fullName,
      rent: c.rent,
      deposit: c.deposit,
      startDate: new Date(c.startDate).toLocaleDateString('fr-FR'),
      endDate: new Date(c.endDate).toLocaleDateString('fr-FR'),
      charges: c.charges || 0
    };
  }
}
