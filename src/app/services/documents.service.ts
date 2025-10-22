import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DocumentsApi } from '../core/api/documents.api';
import { DocumentTemplate, GeneratedDocument, TemplateUpsert } from '../models/documents.models';
import { ToastService } from '../core/ui/toast.service';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly api = inject(DocumentsApi);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly templates = signal<DocumentTemplate[]>([]);
  readonly recent = signal<GeneratedDocument[]>([]);
  readonly selectedTemplate = signal<DocumentTemplate | null>(null);
  readonly previewDoc = signal<GeneratedDocument | null>(null);

  async loadTemplates(q?: string, category?: string) {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this.api.listTemplates(q, category));
      this.templates.set(list);
    } finally {
      this.loading.set(false);
    }
  }

  async loadRecent() {
    const list = await firstValueFrom(this.api.recent());
    this.recent.set(list);
  }

  async openPreview(templateId: string, variables: Record<string, string>) {
    this.loading.set(true);
    try {
      const resp = await firstValueFrom(this.api.preview({ templateId, variables, output: 'html' }));
      this.previewDoc.set(resp);
      this.toast.info('Aperçu généré');
      return resp;
    }catch {
      this.toast.error('Erreur lors de la génération de l’aperçu');
      //throw
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async generateDoc(templateId: string, variables: Record<string, string>, output: 'pdf' | 'html' = 'pdf') {
    this.loading.set(true);
    try {
      const resp = await firstValueFrom(this.api.generate({ templateId, variables, output }));
      this.toast.success('Document généré avec succès');
      return resp;
    } catch {
      this.toast.error('Erreur lors de la génération du document');
      //throw;
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async createTemplate(body: TemplateUpsert) {
    const tpl = await firstValueFrom(this.api.upsertTemplate(body));
    this.templates.update(list => [tpl, ...list]);
     this.toast.success('Modèle enregistré avec succès');
    return tpl;
  }

  async download(documentId: string) {
    try{
    const blob = await firstValueFrom(this.api.download(documentId));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `document-${documentId}.pdf`;
    a.click();
     this.toast.info('Téléchargement lancé');
    } catch {
      this.toast.error('Échec du téléchargement');
    }
  }
}
