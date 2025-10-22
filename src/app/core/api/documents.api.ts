import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LocaGuestApi } from './locaguest.api';
import { DocumentTemplate, TemplateUpsert, QuickGenPayload, GeneratedDocument } from '../../models/documents.models';

@Injectable({ providedIn: 'root' })
export class DocumentsApi {
  private readonly http = inject(LocaGuestApi);

  listTemplates(q?: string, cat?: string): Observable<DocumentTemplate[]> {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (cat) qs.set('category', cat);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.http.get<DocumentTemplate[]>(`/documents/templates${suffix}`);
  }

  getTemplate(id: string): Observable<DocumentTemplate> {
    return this.http.get<DocumentTemplate>(`/documents/templates/${id}`);
  }

  upsertTemplate(body: TemplateUpsert, id?: string): Observable<DocumentTemplate> {
    return id
      ? this.http.put<DocumentTemplate>(`/documents/templates/${id}`, body)
      : this.http.post<DocumentTemplate>(`/documents/templates`, body);
  }

  deleteTemplate(id: string) {
    return this.http.delete<void>(`/documents/templates/${id}`);
  }

  preview(payload: QuickGenPayload): Observable<GeneratedDocument> {
    // output='html' recommandé pour preview
    return this.http.post<GeneratedDocument>(`/documents/preview`, payload);
  }

  generate(payload: QuickGenPayload): Observable<GeneratedDocument> {
    // output='pdf' pour génération finale (ou html si tu veux)
    return this.http.post<GeneratedDocument>(`/documents/generate`, payload);
  }

  recent(): Observable<GeneratedDocument[]> {
    return this.http.get<GeneratedDocument[]>(`/documents/recent`);
  }

  download(documentId: string) {
    return this.http.getFile(`/documents/${documentId}/download`);
  }
}
