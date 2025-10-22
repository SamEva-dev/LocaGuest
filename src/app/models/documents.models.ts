export type DocumentCategory = 'contracts' | 'inventory' | 'termination' | 'works' | 'accounting' | 'other';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  uses: number;
  updatedAt: string;
  placeholders: string[]; // ex: ["landlord.name","tenant.name","property.address",...]
  content: string;        // HTML + moustaches {{variable}}
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  filename: string;
  createdAt: string;
  url?: string;     // (optionnel) URL de fichier
  previewHtml?: string; // (optionnel) rendu HTML serveur
  mime?: string;    // "application/pdf" | "text/html" | ...
}

export interface QuickGenPayload {
  templateId: string;
  variables: Record<string, string>;
  output: 'pdf' | 'html';
}

export interface TemplateUpsert {
  name: string;
  description: string;
  category: DocumentCategory;
  content: string;
}
