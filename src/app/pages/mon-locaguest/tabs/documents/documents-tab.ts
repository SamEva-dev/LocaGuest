import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environnements/environment';

interface DocumentStats {
  totalDocuments: number;
  thisMonthDocuments: number;
  activeTemplates: number;
  timeSavedHours: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
  createdAt: Date;
}

interface GeneratedDocument {
  id: string;
  documentType: string;
  propertyName: string;
  tenantName: string;
  generatedAt: Date;
  fileName: string;
}

@Component({
  selector: 'documents-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './documents-tab.html'
})
export class DocumentsTab implements OnInit {
  private http = inject(HttpClient);
  
  stats = signal<DocumentStats | null>(null);
  templates = signal<DocumentTemplate[]>([]);
  recentDocs = signal<GeneratedDocument[]>([]);
  isLoading = signal(false);
  
  // Quick generation form
  selectedTemplate = '';
  selectedProperty = '';
  selectedTenant = '';
  notes = '';

  ngOnInit() {
    this.loadStats();
    this.loadTemplates();
    this.loadRecentDocuments();
  }

  loadStats() {
    this.http.get<DocumentStats>(`${environment.BASE_LOCAGUEST_API}/api/documents/stats`).subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading document stats:', err)
    });
  }

  loadTemplates() {
    this.http.get<DocumentTemplate[]>(`${environment.BASE_LOCAGUEST_API}/api/documents/templates`).subscribe({
      next: (data) => this.templates.set(data),
      error: (err) => console.error('Error loading templates:', err)
    });
  }

  loadRecentDocuments() {
    this.http.get<GeneratedDocument[]>(`${environment.BASE_LOCAGUEST_API}/api/documents/recent`).subscribe({
      next: (data) => this.recentDocs.set(data),
      error: (err) => console.error('Error loading recent documents:', err)
    });
  }

  useTemplate(template: DocumentTemplate) {
    this.selectedTemplate = template.name;
    // Scroll to quick generation form
    document.getElementById('quickGeneration')?.scrollIntoView({ behavior: 'smooth' });
  }

  generateDocument() {
    if (!this.selectedTemplate) {
      alert('Veuillez sélectionner un type de document');
      return;
    }

    const request = {
      templateType: this.selectedTemplate,
      propertyId: this.selectedProperty || '00000000-0000-0000-0000-000000000000',
      tenantId: this.selectedTenant || null,
      notes: this.notes
    };

    this.http.post<GeneratedDocument>(`${environment.BASE_LOCAGUEST_API}/api/documents/generate`, request).subscribe({
      next: (doc) => {
        alert(`Document généré : ${doc.fileName}`);
        this.loadRecentDocuments();
        // Reset form
        this.selectedTemplate = '';
        this.selectedProperty = '';
        this.selectedTenant = '';
        this.notes = '';
      },
      error: (err) => {
        console.error('Error generating document:', err);
        alert('Erreur lors de la génération du document');
      }
    });
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Contrats': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
      'États des lieux': 'bg-green-100 text-green-700 dark:bg-green-900/30',
      'Comptabilité': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30',
      'Résiliation': 'bg-red-100 text-red-700 dark:bg-red-900/30',
      'Modifications': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30',
      'Travaux': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  }
}
