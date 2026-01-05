import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ImagesApi, ImageUploadResponse, PropertyImageDto } from '../api/images.api';

/**
 * Service pour gérer les images des propriétés
 * Suit le pattern des autres services (PropertiesService, TenantsService)
 */
@Injectable({
  providedIn: 'root'
})
export class ImagesService {
  private imagesApi = inject(ImagesApi);

  /**
   * Upload plusieurs images pour une propriété
   */
  uploadImages(propertyId: string, files: File[], category: string = 'other'): Observable<ImageUploadResponse> {
    return this.imagesApi.uploadImages(propertyId, files, category).pipe(
      tap(response => {
        void response;
      })
    );
  }

  /**
   * Récupère l'URL pour afficher une image
   */
  getImageUrl(imageId: string): string {
    return this.imagesApi.getImageUrl(imageId);
  }

  /**
   * Récupère une image en blob (avec authentification)
   */
  getImageBlob(imageId: string): Observable<Blob> {
    return this.imagesApi.getImageBlob(imageId).pipe(
      tap(() => {
        void imageId;
      })
    );
  }

  /**
   * Supprime une image
   */
  deleteImage(imageId: string): Observable<void> {
    return this.imagesApi.deleteImage(imageId).pipe(
      tap(() => {
        void imageId;
      })
    );
  }

  /**
   * Récupère les métadonnées d'une image (si besoin plus tard)
   */
  getImageMetadata(imageId: string): Observable<PropertyImageDto> {
    return this.imagesApi.getImageMetadata(imageId);
  }
}
