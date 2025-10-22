import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentTemplate } from '../../models/documents.models';
import { DocumentsService } from '../../services/documents.service';
import { NewTemplate } from '../template/new-template/new-template';
import { TemplatePreview } from '../template/template-preview/template-preview';
import { UseTemplate } from '../template/use-template/use-template';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NewTemplate, TemplatePreview, UseTemplate],
  templateUrl: './documents.html',
})
export class Documents implements OnInit {
   readonly svc = inject(DocumentsService);

  templates = this.svc.templates;
  recent = this.svc.recent;
  loading = this.svc.loading;
  previewDoc = this.svc.previewDoc;

  // UI state
  readonly isNewTemplateOpen = signal(false);
  readonly isPreviewOpen = signal(false);
  readonly isUseOpen = signal(false);
  readonly templateToUse = signal<DocumentTemplate | null>(null);

  // Filters
  readonly search = signal('');
  readonly category = signal('all');

  // Filtrage local avant fallback backend
  filteredTemplates = computed(() => {
    const q = this.search().toLowerCase();
    const cat = this.category();
    return this.templates().filter(t =>
      (cat === 'all' || t.category === cat) &&
      (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    );
  });

  async ngOnInit() {
    await this.svc.loadTemplates();
    await this.svc.loadRecent();
  }

  openNewTemplate() { this.isNewTemplateOpen.set(true); }
  closeNewTemplate() { this.isNewTemplateOpen.set(false); }

  async onPreview(template: DocumentTemplate) {
    await this.svc.openPreview(template.id, {});
    this.isPreviewOpen.set(true);
  }
  closePreview() { this.isPreviewOpen.set(false); }

  onUse(template: DocumentTemplate) {
    this.templateToUse.set(template);
    this.isUseOpen.set(true);
  }
  closeUse() { this.isUseOpen.set(false); }

  async onNewTemplateSaved() {
    await this.svc.loadTemplates();
  }

  async quickPreview(templateId: string, variables: Record<string,string>) {
    await this.svc.openPreview(templateId, variables);
    this.isPreviewOpen.set(true);
  }
  async quickGenerate(templateId: string, variables: Record<string,string>) {
    const doc = await this.svc.generateDoc(templateId, variables, 'pdf');
    if (doc.id) await this.svc.download(doc.id);
  }
}
