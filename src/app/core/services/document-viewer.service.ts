import { Injectable, inject } from '@angular/core';
import { DocumentsApi } from '../api/documents.api';
import { ToastService } from '../ui/toast.service';
import { firstValueFrom } from 'rxjs';

export interface ViewDocumentOptions {
  fileName?: string;
  mimeTypeHint?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentViewerService {
  private readonly documentsApi = inject(DocumentsApi);
  private readonly toasts = inject(ToastService);

  async open(documentId: string, options?: ViewDocumentOptions): Promise<void> {
    try {
      const blob = await firstValueFrom(this.documentsApi.downloadDocument(documentId));
      if (!blob) {
        this.toasts.errorDirect('Impossible d\'ouvrir le document');
        return;
      }

      const typedBlob = options?.mimeTypeHint
        ? new Blob([blob], { type: options.mimeTypeHint })
        : blob;

      const url = window.URL.createObjectURL(typedBlob);

      // Open in new tab for SaaS-like experience
      window.open(url, '_blank', 'noopener');

      // Release URL after a short delay to allow the browser to load it
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10_000);
    } catch (err) {
      console.error('❌ Error opening document:', err);
      this.toasts.errorDirect('Erreur lors de l\'ouverture du document');
    }
  }
}
