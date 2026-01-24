import { Component, input, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpEventType } from '@angular/common/http';
import { DocumentsApi, DocumentDto } from '../../../../core/api/documents.api';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { TenantsApi } from '../../../../core/api/tenants.api';
import { Contract } from '../../../../core/api/properties.api';
import { DocumentTemplate, TenantDocument, TenantInfo, GenerateContractDto, DocumentType } from '../../../../core/models/documents.models';
import { DocumentViewerService } from '../../../../core/services/document-viewer.service';

@Component({
  selector: 'documents-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './documents-manager.html',
  styles: []
})
export class DocumentsManagerComponent {
  tenantInfo = input.required<TenantInfo>();
  private documentsApi = inject(DocumentsApi);
  private tenantsApi = inject(TenantsApi);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private documentViewer = inject(DocumentViewerService);
  
  // Documents from API
  realDocuments = signal<DocumentDto[]>([]);
  isLoading = signal(false);
  
  // Search & Filter
  searchQuery = signal('');
  selectedCategory = signal('');
  filteredDocuments = computed(() => {
    let docs = this.documents();
    
    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      docs = docs.filter(d => 
        d.fileName.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (this.selectedCategory()) {
      const categoryTypes = this.documentCategories
        .find(c => c.label === this.selectedCategory())?.type || [];
      docs = docs.filter(d => categoryTypes.includes(d.type));
    }
    
    return docs;
  });

  viewDocument(doc: TenantDocument) {
    if (!doc.id) {
      this.toasts.errorDirect('Document introuvable');
      return;
    }

    void this.documentViewer.open(doc.id, {
      fileName: doc.fileName
    });
  }
  
  tenantId = input.required<string>();
  // Mock documents for demo - will be replaced with real API calls
  documents = signal<TenantDocument[]>([]);
  
  showUploadModal = signal(false);
  showContractModal = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  
  // File preview
  filePreviewUrl = signal<string | null>(null);
  isDragging = signal(false);

  uploadForm = {
    type: '' as DocumentType | '',
    file: null as File | null,
    expiryDate: '',
    description: ''
  };

  // Signal pour le type de contrat (réactif)
  contractFormType = signal<DocumentType>('BAIL');

  // Signal pour la checkbox "Modifier"
  allowEditContractFields = signal<boolean>(false);

  contractForm = {
    startDate: '',
    endDate: '',
    rent: 0,
    deposit: 0,
    charges: 0,
    additionalClauses: '',
    isThirdPartyLandlord: false,
    landlordCompanyName: '',
    landlordFirstName: '',
    landlordLastName: '',
    landlordAddress: '',
    landlordSiret: '',
    landlordEmail: '',
    landlordPhone: ''
  };

  // Computed: Les champs sont en lecture seule si type = BAIL, ETAT_LIEUX_ENTREE ou ETAT_LIEUX_SORTIE ET que la checkbox n'est pas cochée
  isContractFieldsReadonly = computed(() => {
    const protectedTypes: DocumentType[] = ['BAIL', 'ETAT_LIEUX_ENTREE', 'ETAT_LIEUX_SORTIE'];
    return protectedTypes.includes(this.contractFormType()) && !this.allowEditContractFields();
  });

  // Types de documents uniques (1 seul par locataire)
  uniqueDocumentTypes: DocumentType[] = ['BAIL', 'ETAT_LIEUX_ENTREE', 'ETAT_LIEUX_SORTIE'];

  documentTemplates: DocumentTemplate[] = [
    { type: 'CNI', label: 'Carte d\'identité', icon: 'ph-identification-card', color: 'bg-blue-100 text-blue-600', requiresExpiry: true },
    { type: 'PASSPORT', label: 'Passeport', icon: 'ph-identification-badge', color: 'bg-indigo-100 text-indigo-600', requiresExpiry: true },
    { type: 'ASSURANCE', label: 'Assurance habitation', icon: 'ph-shield-check', color: 'bg-emerald-100 text-emerald-600', requiresExpiry: true },
    { type: 'BAIL', label: 'Bail de location', icon: 'ph-file-text', color: 'bg-purple-100 text-purple-600', requiresExpiry: false },
    { type: 'AVENANT', label: 'Avenant au bail', icon: 'ph-file-plus', color: 'bg-violet-100 text-violet-600', requiresExpiry: false },
    { type: 'ETAT_LIEUX_ENTREE', label: 'État des lieux d\'entrée', icon: 'ph-clipboard-text', color: 'bg-teal-100 text-teal-600', requiresExpiry: false },
    { type: 'ETAT_LIEUX_SORTIE', label: 'État des lieux de sortie', icon: 'ph-clipboard', color: 'bg-cyan-100 text-cyan-600', requiresExpiry: false },
    { type: 'ATTESTATION_EMPLOI', label: 'Attestation d\'emploi', icon: 'ph-briefcase', color: 'bg-amber-100 text-amber-600', requiresExpiry: false },
    { type: 'BULLETIN_SALAIRE', label: 'Bulletin de salaire', icon: 'ph-currency-eur', color: 'bg-lime-100 text-lime-600', requiresExpiry: false },
    { type: 'AVIS_IMPOSITION', label: 'Avis d\'imposition', icon: 'ph-receipt', color: 'bg-orange-100 text-orange-600', requiresExpiry: false },
    { type: 'OTHER', label: 'Autre document', icon: 'ph-file', color: 'bg-slate-100 text-slate-600', requiresExpiry: false }
  ];

  documentCategories = [
    { type: ['CNI', 'PASSPORT'], label: 'Identité', icon: 'ph-identification-card', showEmpty: true },
    { type: ['ASSURANCE'], label: 'Assurances', icon: 'ph-shield-check', showEmpty: true },
    { type: ['BAIL', 'AVENANT'], label: 'Contrats', icon: 'ph-file-text', showEmpty: true },
    { type: ['ETAT_LIEUX_ENTREE', 'ETAT_LIEUX_SORTIE'], label: 'États des lieux', icon: 'ph-clipboard-text', showEmpty: false },
    { type: ['ATTESTATION_EMPLOI', 'BULLETIN_SALAIRE', 'AVIS_IMPOSITION'], label: 'Documents financiers', icon: 'ph-currency-eur', showEmpty: false },
    { type: ['OTHER'], label: 'Autres', icon: 'ph-folder', showEmpty: false }
  ];

  contractTypes: Array<{value: DocumentType, label: string, icon: string, description: string}> = [
    { value: 'BAIL' as DocumentType, label: 'Bail de location', icon: 'ph-house', description: 'Contrat de location principal' },
    { value: 'AVENANT' as DocumentType, label: 'Avenant', icon: 'ph-file-plus', description: 'Modification du contrat existant' },
    { value: 'ETAT_LIEUX_ENTREE' as DocumentType, label: 'État des lieux d\'entrée', icon: 'ph-clipboard-text', description: 'Constat d\'entrée dans le logement' },
    { value: 'ETAT_LIEUX_SORTIE' as DocumentType, label: 'État des lieux de sortie', icon: 'ph-clipboard', description: 'Constat de sortie du logement' }
  ];

  constructor() {
    // Load documents when tenantId is available
    effect(() => {
      const id = this.tenantId();
      if (id) {
        this.loadDocuments();
      }
    });

    // Debug tenant info and contracts
    effect(() => {
      const info = this.tenantInfo();
      void info;
    });
  }

  loadDocuments() {
    const id = this.tenantId();
    if (!id) return;

    this.isLoading.set(true);
    
    // Load from API
    this.documentsApi.getTenantDocuments(id).subscribe({
      next: (docs) => {
        this.realDocuments.set(docs);
        
        // Convert API documents to TenantDocument format for existing UI
        const converted: TenantDocument[] = docs.map(doc => ({
          id: doc.id,
          tenantId: id,
          type: this.mapCategoryToType(doc.category, doc.type),
          fileName: doc.fileName,
          fileSize: doc.fileSizeBytes,
          uploadDate: new Date(doc.createdAt),
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
          url: this.documentsApi.getDownloadUrl(doc.id),
          description: doc.description
        }));
        
        this.documents.set(converted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading documents:', err);
        this.isLoading.set(false);
        this.documents.set([]);
      }
    });
  }
  
  // Map backend category/type to frontend DocumentType
  mapCategoryToType(category: string, type: string): DocumentType {
    // Map backend types to frontend types
    const typeMap: Record<string, DocumentType> = {
      'Bail': 'BAIL',
      'Colocation': 'BAIL',
      'EtatDesLieuxEntree': 'ETAT_LIEUX_ENTREE',
      'EtatDesLieuxSortie': 'ETAT_LIEUX_SORTIE',
      'PieceIdentite': 'CNI',
      'Assurance': 'ASSURANCE',
      'JustificatifDomicile': 'OTHER',
      'BulletinSalaire': 'BULLETIN_SALAIRE',
      'AvisImposition': 'AVIS_IMPOSITION',
      'Quittance': 'OTHER',
      'Avenant': 'AVENANT',
      'Autre': 'OTHER'
    };
    
    return typeMap[type] || 'OTHER';
  }

  getDocumentsByType(types: string[] | DocumentType[]): TenantDocument[] {
    return this.documents().filter(doc => types.includes(doc.type));
  }
  
  getFilteredDocumentsByType(types: string[] | DocumentType[]): TenantDocument[] {
    return this.filteredDocuments().filter(doc => types.includes(doc.type));
  }
  
  onSearchChange() {
    // Signal is already bound with [(ngModel)], no need to do anything
  }
  
  onCategoryChange() {
    // Signal will automatically update filteredDocuments
  }

  getDocumentIcon(type: DocumentType): string {
    return this.documentTemplates.find(t => t.type === type)?.icon || 'ph-file';
  }

  getDocumentColor(type: DocumentType): string {
    return this.documentTemplates.find(t => t.type === type)?.color || 'bg-slate-100 text-slate-600';
  }

  requiresExpiryDate(type: DocumentType | ''): boolean {
    if (!type) return false;
    return this.documentTemplates.find(t => t.type === type)?.requiresExpiry || false;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isExpiringSoon(expiryDate: Date): boolean {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return new Date(expiryDate) <= thirtyDaysFromNow;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }
  
  processFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      this.toasts.warningDirect('Le fichier ne doit pas dépasser 10MB');
      return;
    }
    
    this.uploadForm.file = file;
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      this.filePreviewUrl.set('pdf');
    } else {
      this.filePreviewUrl.set(null);
    }
  }
  
  clearFile() {
    this.uploadForm.file = null;
    this.filePreviewUrl.set(null);
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  canUpload(): boolean {
    return !!(this.uploadForm.type && this.uploadForm.file);
  }

  uploadDocument() {
    if (!this.canUpload()) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);

    const formData = new FormData();
    formData.append('file', this.uploadForm.file!);
    formData.append('tenantId', this.tenantId());
    
    const tenant = this.tenantInfo();
    if (tenant?.propertyId) {
      formData.append('propertyId', tenant.propertyId);
    }
    
    // Map frontend type to backend type and category
    const typeInfo = this.mapFrontendTypeToBackend(this.uploadForm.type as DocumentType);
    formData.append('type', typeInfo.type);
    formData.append('category', typeInfo.category);
    
    if (this.uploadForm.expiryDate) {
      formData.append('expiryDate', this.uploadForm.expiryDate);
    }
    if (this.uploadForm.description) {
      formData.append('description', this.uploadForm.description);
    }

    this.documentsApi.uploadDocument(formData).subscribe({
      next: (doc) => {
        void doc;
        this.uploading.set(false);
        this.uploadProgress.set(100);
        this.showUploadModal.set(false);
        this.resetUploadForm();
        this.loadDocuments(); // Refresh list
      },
      error: (err) => {
        console.error('❌ Upload error:', err);
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.toasts.errorDirect('Erreur lors de l\'upload du document');
      }
    });
  }
  
  // Map frontend DocumentType to backend type and category
  mapFrontendTypeToBackend(frontendType: DocumentType): { type: string, category: string } {
    const mapping: Record<DocumentType, { type: string, category: string }> = {
      'CNI': { type: 'PieceIdentite', category: 'Identite' },
      'PASSPORT': { type: 'PieceIdentite', category: 'Identite' },
      'ASSURANCE': { type: 'Assurance', category: 'Justificatifs' },
      'BAIL': { type: 'Bail', category: 'Contrats' },
      'AVENANT': { type: 'Avenant', category: 'Contrats' },
      'ETAT_LIEUX_ENTREE': { type: 'EtatDesLieuxEntree', category: 'EtatsDesLieux' },
      'ETAT_LIEUX_SORTIE': { type: 'EtatDesLieuxSortie', category: 'EtatsDesLieux' },
      'ATTESTATION_EMPLOI': { type: 'Autre', category: 'Justificatifs' },
      'BULLETIN_SALAIRE': { type: 'BulletinSalaire', category: 'Justificatifs' },
      'AVIS_IMPOSITION': { type: 'AvisImposition', category: 'Justificatifs' },
      'OTHER': { type: 'Autre', category: 'Autres' }
    };
    
    return mapping[frontendType] || { type: 'Autre', category: 'Autres' };
  }

  resetUploadForm() {
    this.uploadForm = {
      type: '',
      file: null,
      expiryDate: '',
      description: ''
    };
    this.uploadProgress.set(0);
  }

  /**
   * Vérifie si un type de document unique existe déjà pour le locataire
   */
  hasDocumentType(type: DocumentType): boolean {
    return this.documents().some(doc => doc.type === type);
  }

  /**
   * Vérifie si un type de document peut être uploadé
   * (retourne false si c'est un document unique qui existe déjà)
   */
  canUploadDocumentType(type: DocumentType): boolean {
    if (this.uniqueDocumentTypes.includes(type)) {
      return !this.hasDocumentType(type);
    }
    return true; // Les documents non-uniques peuvent toujours être uploadés
  }

  /**
   * Vérifie si on doit afficher l'avertissement pour document unique
   */
  showUniqueDocumentWarning(): boolean {
    if (!this.uploadForm.type) return false;
    const type = this.uploadForm.type as DocumentType;
    return !this.canUploadDocumentType(type);
  }

  hasActiveContract(): boolean {
    const tenant = this.tenantInfo();
    // ✅ Vérifier l'association Tenant ↔ Property au lieu du contrat
    return !!(tenant?.propertyId);
  }

  getActiveContract(): any | null {
    const tenant = this.tenantInfo();
    if (!tenant?.propertyId) {
      return null;
    }
    // Retourner le premier contrat s'il existe, sinon un objet simulé avec le propertyId
    if (tenant.contracts && tenant.contracts.length > 0) {
      const contract = tenant.contracts[0];
      return {
        id: contract.id,
        propertyId: tenant.propertyId,
        propertyCode: tenant.propertyCode,
        propertyName: contract.propertyName || tenant.propertyCode,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rent: contract.rent,
        deposit: contract.deposit,
        type: contract.type
      };
    }
    return {
      propertyId: tenant.propertyId,
      propertyCode: tenant.propertyCode
    };
  }

  // Ouvrir le modal et pré-remplir les champs depuis l'API
  openContractModal() {
    const tenantId = this.tenantId();
    if (!tenantId) {
      this.toasts.warningDirect('Aucun locataire sélectionné');
      return;
    }

    // Réinitialiser le type par défaut et la checkbox
    this.contractFormType.set('BAIL');
    this.allowEditContractFields.set(false);

    // Charger les contrats depuis l'API
    this.tenantsApi.getTenantContracts(tenantId).subscribe({
      next: (contracts: Contract[]) => {
        // Prendre le premier contrat actif s'il existe
        const activeContract = contracts.find(c => c.status === 'Active') || contracts[0];
        
        if (activeContract) {
          // Pré-remplir les champs
          this.contractForm.startDate = new Date(activeContract.startDate).toISOString().split('T')[0];
          this.contractForm.endDate = new Date(activeContract.endDate).toISOString().split('T')[0];
          this.contractForm.rent = activeContract.rent || 0;
          this.contractForm.deposit = activeContract.deposit || 0;
        } else {
          // Pas de contrat trouvé, réinitialiser
          this.contractForm.startDate = '';
          this.contractForm.endDate = '';
          this.contractForm.rent = 0;
          this.contractForm.deposit = 0;
        }
        
        this.showContractModal.set(true);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des contrats:', err);
        // Ouvrir quand même le modal avec des champs vides
        this.contractForm.startDate = '';
        this.contractForm.endDate = '';
        this.contractForm.rent = 0;
        this.contractForm.deposit = 0;
        this.showContractModal.set(true);
      }
    });
  }

  canGenerateContract(): boolean {
    const basicValidation = !!(
      this.contractFormType() &&
      this.contractForm.startDate &&
      this.contractForm.endDate &&
      this.contractForm.rent > 0
    );

    // If third party landlord, validate landlord info
    if (this.contractForm.isThirdPartyLandlord) {
      const hasLandlordInfo = !!(
        (this.contractForm.landlordCompanyName || (this.contractForm.landlordFirstName && this.contractForm.landlordLastName)) &&
        this.contractForm.landlordAddress
      );
      return basicValidation && hasLandlordInfo;
    }

    return basicValidation;
  }

  generateContract() {
    if (!this.canGenerateContract()) {
      this.toasts.warningDirect('Veuillez remplir tous les champs requis');
      return;
    }

    const activeContract = this.getActiveContract();
    if (!activeContract || !activeContract.propertyId) {
      this.toasts.errorDirect('Impossible de trouver le bien associé au locataire');
      return;
    }

    const dto: GenerateContractDto = {
      contractId: activeContract.id,
      tenantId: this.tenantId(),
      propertyId: activeContract.propertyId,
      contractType: this.contractFormType(),
      startDate: this.contractForm.startDate,
      endDate: this.contractForm.endDate,
      rent: this.contractForm.rent,
      deposit: this.contractForm.deposit || undefined,
      charges: this.contractForm.charges || undefined,
      additionalClauses: this.contractForm.additionalClauses || undefined,
      isThirdPartyLandlord: this.contractForm.isThirdPartyLandlord
    };

    // Add landlord info if third party
    if (this.contractForm.isThirdPartyLandlord) {
      dto.landlordInfo = {
        companyName: this.contractForm.landlordCompanyName || undefined,
        firstName: this.contractForm.landlordFirstName || undefined,
        lastName: this.contractForm.landlordLastName || undefined,
        address: this.contractForm.landlordAddress || undefined,
        siret: this.contractForm.landlordSiret || undefined,
        email: this.contractForm.landlordEmail || undefined,
        phone: this.contractForm.landlordPhone || undefined
      };
    }

    this.documentsApi.generateContract(dto).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const tenantName = this.tenantInfo()?.fullName.replace(/\s+/g, '_') || 'Locataire';
        const date = new Date().toISOString().split('T')[0];
        const numero = this.documents().length + 1;
        link.download = `Contrat_${this.contractFormType()}_${tenantName}_${date}_${numero}.pdf`;

        link.click();
        window.URL.revokeObjectURL(url);
        this.toasts.successDirect('Contrat généré avec succès !');
        this.showContractModal.set(false);
        this.loadDocuments();
      },
      error: (err) => {
        console.error('❌ Error generating contract:', err);
        const errorMsg = err?.error?.message || 'Erreur lors de la génération du contrat';
        this.toasts.errorDirect(errorMsg);
      }
    });
  }

  downloadDocument(doc: TenantDocument) {
    if (!doc.id) {
      console.error('❌ Document ID missing');
      return;
    }
    
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('❌ Download error:', err);
        this.toasts.errorDirect('Erreur lors du téléchargement du document');
      }
    });
  }

  async deleteDocument(doc: TenantDocument) {
    const confirmed = await this.confirmService.warning(
      'Dissocier le document',
      `Êtes-vous sûr de vouloir dissocier ${doc.fileName} ?

Le document sera archivé mais pas supprimé définitivement.`
    );
    if (!confirmed) return;
    
    if (!doc.id) {
      console.error('❌ Document ID missing');
      return;
    }

    this.documentsApi.dissociateDocument(doc.id).subscribe({
      next: () => {
        this.loadDocuments(); // Refresh list
      },
      error: (err) => {
        console.error('❌ Dissociate error:', err);
        this.toasts.errorDirect('Erreur lors de la dissociation du document');
      }
    });
  }

  exportAllDocuments() {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    this.isLoading.set(true);
    
    this.documentsApi.exportDocumentsZip(tenantId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Documents_Locataire_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Export ZIP error:', err);
        this.isLoading.set(false);
        this.toasts.errorDirect('Erreur lors de l\'export des documents');
      }
    });
  }
}
