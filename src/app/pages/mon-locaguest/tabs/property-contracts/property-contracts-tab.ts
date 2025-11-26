import { Component, input, output, signal, computed, inject } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertyDetail, Contract } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { ContractWizardModal } from './contract-wizard-modal/contract-wizard-modal';
import { ContractsApi } from '../../../../core/api/contracts.api';
import { DocumentsService } from '../../../../core/services/documents.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'property-contracts-tab',
  standalone: true,
  imports: [NgClass, DatePipe, TranslatePipe, ContractWizardModal],
  templateUrl: './property-contracts-tab.html'
})
export class PropertyContractsTab {
  property = input.required<PropertyDetail>();
  contracts = input<Contract[]>([]);
  associatedTenants = input<TenantListItem[]>([]);
  
  // Output pour notifier le parent de recharger les données
  contractCreated = output<void>();
  
  private propertiesService = inject(PropertiesService);
  private contractsApi = inject(ContractsApi);
  private documentsService = inject(DocumentsService);
  
  // Loading states
  isMarkingAsSigned = signal(false);
  isGeneratingPdf = signal(false);
  isSendingForSignature = signal(false);
  
  showWizard = signal(false);
  showPaperContractForm = signal(false);
  wizardMode = signal<'new' | 'paper'>('new');
  selectedContract = signal<Contract | null>(null);
  
  // Computed properties
  activeContract = computed(() => {
    return this.contracts().find(c => 
      c.status === 'Active' && new Date(c.endDate) > new Date()
    );
  });
  
  historicalContracts = computed(() => {
    return this.contracts().filter(c => 
      c.status === 'Terminated' || new Date(c.endDate) <= new Date()
    ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  });
  
  draftContracts = computed(() => {
    return this.contracts().filter(c => c.status === 'Draft');
  });
  
  canCreateContract = computed(() => {
    const prop = this.property();
    const isColocation = prop?.propertyUsageType?.toLowerCase() === 'colocation';
    
    // Pour colocation, on peut toujours créer (chambres multiples)
    if (isColocation) {
      const totalRooms = prop.totalRooms || 0;
      const occupiedRooms = prop.occupiedRooms || 0;
      return occupiedRooms < totalRooms;
    }
    
    // Pour location complète, pas de contrat actif requis
    return !this.activeContract();
  });
  
  // Status helpers - Cycle métier: Draft → Pending → Signed → Active → Terminated/Expired/Cancelled
  getContractStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Draft': 'Brouillon',
      'Pending': 'En attente de signature',
      'Signed': 'Signé (Réservé)',
      'Active': 'Actif',
      'Expiring': 'Expire bientôt',
      'Terminated': 'Résilié',
      'Expired': 'Expiré',
      'Cancelled': 'Annulé'
    };
    return labels[status] || status;
  }
  
  getContractStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Draft': 'slate',
      'Pending': 'amber',
      'Signed': 'blue',
      'Active': 'emerald',
      'Expiring': 'orange',
      'Terminated': 'red',
      'Expired': 'gray',
      'Cancelled': 'rose'
    };
    return colors[status] || 'slate';
  }
  
  getContractStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'Draft': 'ph-pencil-simple',
      'Pending': 'ph-clock',
      'Signed': 'ph-signature',
      'Active': 'ph-check-circle',
      'Expiring': 'ph-warning',
      'Terminated': 'ph-x-circle',
      'Expired': 'ph-calendar-x',
      'Cancelled': 'ph-prohibit'
    };
    return icons[status] || 'ph-file-text';
  }
  
  // Helpers pour badges spéciaux
  isContractInConflict(contract: Contract): boolean {
    return contract.isConflict === true;
  }
  
  getConflictTooltip(): string {
    return 'Ce contrat a été annulé car un autre contrat a été signé pour ce locataire';
  }
  
  // Actions
  openCreateContractWizard() {
    this.wizardMode.set('new');
    this.showWizard.set(true);
  }
  
  openPaperContractWizard() {
    this.wizardMode.set('paper');
    this.showWizard.set(true);
  }
  
  viewContractDetail(contract: Contract) {
    console.log('View contract detail:', contract.id);
    // TODO: Open contract detail view
  }
  
  editContract(contract: Contract) {
    this.selectedContract.set(contract);
    this.wizardMode.set('new');
    this.showWizard.set(true);
  }
  
  async generateContractPDF(contract: Contract) {
    if (this.isGeneratingPdf()) return;
    
    try {
      this.isGeneratingPdf.set(true);
      console.log('🔄 Génération PDF pour contrat:', contract.id);
      
      const request = {
        contractId: contract.id,
        tenantId: contract.tenantId,
        propertyId: this.property().id,
        contractType: 'Bail' as const
      };
      
      const pdfBlob = await firstValueFrom(
        this.documentsService.generateContractPdf(request)
      );
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrat_${this.getTenantName(contract.tenantId)}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF généré et téléchargé avec succès');
      alert('PDF généré avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }
  
  // Phase 2: Actions selon statut
  async markAsSigned(contract: Contract) {
    if (this.isMarkingAsSigned()) return;
    
    const confirmed = confirm(
      `Confirmer la signature du contrat ?\n\n` +
      `Cette action va :\n` +
      `- Marquer le contrat comme SIGNÉ\n` +
      `- Réserver le bien et le locataire (statut Reserved)\n` +
      `- Annuler les autres contrats Draft/Pending de ce locataire (conflit)\n` +
      `- Le contrat deviendra ACTIF automatiquement à la date de début\n\n` +
      `Continuer ?`
    );
    
    if (!confirmed) return;
    
    try {
      this.isMarkingAsSigned.set(true);
      console.log('🔄 Signature du contrat:', contract.id);
      
      const response = await firstValueFrom(
        this.contractsApi.markAsSigned(contract.id, {
          signedDate: new Date().toISOString()
        })
      );
      
      console.log('✅ Contrat signé avec succès:', response);
      alert(`Contrat signé avec succès !\n${response.message}`);
      
      // Recharger les données
      this.contractCreated.emit();
      
    } catch (error: any) {
      console.error('❌ Erreur signature contrat:', error);
      const errorMsg = error?.error?.message || 'Erreur lors de la signature du contrat';
      alert(`Erreur : ${errorMsg}`);
    } finally {
      this.isMarkingAsSigned.set(false);
    }
  }
  
  async sendForElectronicSignature(contract: Contract) {
    if (this.isSendingForSignature()) return;
    
    // Récupérer les infos du locataire
    const tenant = this.associatedTenants().find(t => t.id === contract.tenantId);
    if (!tenant || !tenant.email) {
      alert('Email du locataire introuvable. Impossible d\'envoyer pour signature.');
      return;
    }
    
    const confirmed = confirm(
      `Envoyer le contrat pour signature électronique ?\n\n` +
      `Destinataire : ${tenant.fullName} (${tenant.email})\n\n` +
      `Un email sera envoyé au locataire avec le lien de signature.`
    );
    
    if (!confirmed) return;
    
    try {
      this.isSendingForSignature.set(true);
      console.log('🔄 Envoi pour signature électronique:', contract.id);
      
      // 1. Générer le PDF si pas déjà fait
      const request = {
        contractId: contract.id,
        tenantId: contract.tenantId,
        propertyId: this.property().id,
        contractType: 'Bail' as const
      };
      
      const pdfBlob = await firstValueFrom(
        this.documentsService.generateContractPdf(request)
      );
      
      console.log('✅ PDF généré, taille:', pdfBlob.size);
      
      // 2. TODO: Upload et récupérer documentId
      // Pour l'instant, on simule avec un message
      alert(
        `Fonctionnalité en cours d'implémentation\n\n` +
        `Le PDF a été généré (${Math.round(pdfBlob.size / 1024)} KB).\n` +
        `L'intégration avec DocuSign/HelloSign/Yousign sera ajoutée prochainement.\n\n` +
        `Email : ${tenant.email}`
      );
      
      // TODO: Implémenter l'envoi réel
      // const signatureRequest = {
      //   recipients: [
      //     {
      //       email: tenant.email,
      //       name: tenant.fullName,
      //       signingOrder: 1
      //     }
      //   ],
      //   message: 'Merci de signer ce bail de location.',
      //   expirationDays: 30
      // };
      // 
      // const response = await firstValueFrom(
      //   this.documentsService.sendForElectronicSignature(documentId, signatureRequest)
      // );
      
    } catch (error: any) {
      console.error('❌ Erreur envoi signature électronique:', error);
      const errorMsg = error?.error?.message || 'Erreur lors de l\'envoi pour signature';
      alert(`Erreur : ${errorMsg}`);
    } finally {
      this.isSendingForSignature.set(false);
    }
  }
  
  uploadSignedVersion(contract: Contract) {
    console.log('Upload signed version:', contract.id);
    
    // Créer un input file invisible
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Veuillez sélectionner un fichier PDF.');
        return;
      }
      
      try {
        console.log('🔄 Upload du contrat signé:', file.name);
        
        const response = await firstValueFrom(
          this.documentsService.uploadDocument(
            file,
            'Bail',
            'Contrats',
            contract.id,
            contract.tenantId,
            this.property().id,
            'Contrat signé uploadé'
          )
        );
        
        console.log('✅ Document uploadé:', response);
        alert(`Document uploadé avec succès !\nCode: ${response.code}`);
        
        // Demander si on veut marquer comme signé maintenant
        const markSigned = confirm(
          'Document uploadé avec succès.\n\n' +
          'Voulez-vous maintenant marquer le contrat comme signé ?'
        );
        
        if (markSigned) {
          await this.markAsSigned(contract);
        }
        
      } catch (error: any) {
        console.error('❌ Erreur upload:', error);
        const errorMsg = error?.error?.message || 'Erreur lors de l\'upload';
        alert(`Erreur : ${errorMsg}`);
      }
    };
    
    input.click();
  }
  
  viewInventoryEntry(contract: Contract) {
    console.log('View entry inventory for contract:', contract.id);
    // TODO: Open inventory view
  }
  
  viewInventoryExit(contract: Contract) {
    console.log('View exit inventory for contract:', contract.id);
    // TODO: Open inventory view
  }
  
  createInventoryEntry(contract: Contract) {
    console.log('Create entry inventory for contract:', contract.id);
    // TODO: Open inventory creation
  }
  
  createInventoryExit(contract: Contract) {
    console.log('Create exit inventory for contract:', contract.id);
    // TODO: Open inventory creation
  }
  
  getTenantName(tenantId: string): string {
    const tenant = this.associatedTenants().find(t => t.id === tenantId);
    return tenant?.fullName || 'Locataire inconnu';
  }
  
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  getContractDuration(startDate: string | Date, endDate: string | Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 12) {
      return `${months} mois`;
    }
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return `${years} an${years > 1 ? 's' : ''}`;
    }
    
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  }
  
  onWizardClose() {
    this.showWizard.set(false);
    this.selectedContract.set(null);
  }
  
  onWizardSuccess() {
    this.showWizard.set(false);
    this.selectedContract.set(null);
    // Notifier le parent de recharger les contrats
    console.log('✅ Contrat créé avec succès - notification parent pour rechargement');
    this.contractCreated.emit();
  }
}
