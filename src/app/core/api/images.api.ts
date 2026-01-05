import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environnements/environment';

export interface PropertyImageDto {
  id: string;
  propertyId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  category: string;
  mimeType: string;
  createdAt: string;
}

export interface ImageUploadResponse {
  images: PropertyImageDto[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImagesApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_LOCAGUEST_API}/api/Images`;

  /**
   * Upload plusieurs images pour une propriété
   */
  uploadImages(propertyId: string, files: File[], category: string = 'other'): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('propertyId', propertyId);
    formData.append('category', category);
    files.forEach(file => {
      formData.append('files', file);
    });

    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Récupère l'URL pour afficher une image
   */
  getImageUrl(imageId: string): string {
    return `${this.baseUrl}/${imageId}`;
  }

  /**
   * Récupère une image en blob
   */
  getImageBlob(imageId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${imageId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Supprime une image
   */
  deleteImage(imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${imageId}`);
  }

  /**
   * Récupère les métadonnées d'une image
   */
  getImageMetadata(imageId: string): Observable<PropertyImageDto> {
    return this.http.get<PropertyImageDto>(`${this.baseUrl}/${imageId}/metadata`);
  }

  /**
   * Crée une URL blob pour affichage local
   */
  createBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Libère une URL blob
   */
  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
