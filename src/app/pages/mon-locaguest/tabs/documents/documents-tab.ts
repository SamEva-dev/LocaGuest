import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DocumentsApi, DocumentDto } from '../../../../core/api/documents.api';

interface DocumentWithTenantInfo extends DocumentDto {
  tenantName?: string;
  propertyName?: string;
}

interface DocumentStats {
  totalDocuments: number;
  thisMonthDocuments: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
}

@Component({
  selector: 'documents-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DatePipe],
  templateUrl: './documents-tab.html'
})
export class DocumentsTab implements OnInit {
  private documentsApi = inject(DocumentsApi);
  
  allDocuments = signal<DocumentWithTenantInfo[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');
  selectedCategory = signal('all');
  selectedType = signal('all');
  
  // Computed stats
  stats = computed(() => {
    const docs = this.allDocuments();
    const now = new Date();
    const thisMonth = docs.filter(d => {
      const createdDate = new Date(d.createdAt);
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    });
    
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    docs.forEach(doc => {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
      byType[doc.type] = (byType[doc.type] || 0) + 1;
    });
    
    return {
      totalDocuments: docs.length,
      thisMonthDocuments: thisMonth.length,
      byCategory,
      byType
    };
  });
  
  // Filtered documents
  filteredDocuments = computed(() => {
    let docs = this.allDocuments();
    
    // Search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      docs = docs.filter(d => 
        d.fileName.toLowerCase().includes(query) ||
        d.tenantName?.toLowerCase().includes(query) ||
        d.propertyName?.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (this.selectedCategory() !== 'all') {
      docs = docs.filter(d => d.category === this.selectedCategory());
    }
    
    // Type filter
    if (this.selectedType() !== 'all') {
      docs = docs.filter(d => d.type === this.selectedType());
    }
    
    // Sort by date (most recent first)
    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  
  categories = [
    { value: 'all', label: 'DOCUMENTS.CATEGORIES.ALL' },
    { value: 'Identite', label: 'DOCUMENTS.CATEGORIES.IDENTITY' },
    { value: 'Contrats', label: 'DOCUMENTS.CATEGORIES.CONTRACTS' },
    { value: 'EtatsDesLieux', label: 'DOCUMENTS.CATEGORIES.INVENTORIES' },
    { value: 'Justificatifs', label: 'DOCUMENTS.CATEGORIES.PROOFS' },
    { value: 'Quittances', label: 'DOCUMENTS.CATEGORIES.RECEIPTS' },
    { value: 'Autres', label: 'DOCUMENTS.CATEGORIES.OTHERS' }
  ];

  ngOnInit() {
    this.loadAllDocuments();
  }

  /**
   * Charge TOUS les documents de TOUS les locataires en un seul appel
   */
  loadAllDocuments() {
    this.isLoading.set(true);
    
    this.documentsApi.getAllDocuments().subscribe({
      next: (docs) => {
        // Les documents ont déjà tenantName et propertyName du backend
        const enrichedDocs = docs.map(doc => ({
          ...doc,
          tenantName: doc.tenantName || 'N/A',
          propertyName: doc.propertyName || 'N/A'
        }));
        
        this.allDocuments.set(enrichedDocs);
        this.isLoading.set(false);
        console.log('✅ Loaded', enrichedDocs.length, 'documents');
      },
      error: (err) => {
        console.error('❌ Error loading documents:', err);
        this.isLoading.set(false);
        this.allDocuments.set([]);
      }
    });
  }

  downloadDocument(doc: DocumentWithTenantInfo) {
    if (!doc.id) return;
    
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
        console.log('✅ Document downloaded:', doc.fileName);
      },
      error: (err) => {
        console.error('❌ Download error:', err);
        alert('Erreur lors du téléchargement');
      }
    });
  }
  
  viewDocument(doc: DocumentWithTenantInfo) {
    if (!doc.id) return;
    
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('❌ View error:', err);
        alert('Erreur lors de l\'ouverture');
      }
    });
  }
  
  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }
  
  onCategoryChange(value: string) {
    this.selectedCategory.set(value);
  }
  
  onTypeChange(value: string) {
    this.selectedType.set(value);
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Identite': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
      'Contrats': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30',
      'EtatsDesLieux': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30',
      'Justificatifs': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30',
      'Quittances': 'bg-green-100 text-green-700 dark:bg-green-900/30',
      'Autres': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30'
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  }
  
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'PieceIdentite': 'ph-identification-card',
      'Bail': 'ph-file-text',
      'Avenant': 'ph-file-plus',
      'EtatDesLieuxEntree': 'ph-clipboard-text',
      'EtatDesLieuxSortie': 'ph-clipboard',
      'Assurance': 'ph-shield-check',
      'BulletinSalaire': 'ph-currency-eur',
      'AvisImposition': 'ph-receipt',
      'Quittance': 'ph-file-check',
      'Autre': 'ph-file'
    };
    return icons[type] || 'ph-file';
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
