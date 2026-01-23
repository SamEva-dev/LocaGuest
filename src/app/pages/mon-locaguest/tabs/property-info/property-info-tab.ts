import { Component, input, signal, inject, computed, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PropertyDetail, PropertyImage, PropertyImageCategory } from '../../../../core/api/properties.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { ImagesService } from '../../../../core/services/images.service';
import { AvatarStorageService } from '../../../../core/services/avatar-storage.service';
import { DocumentsApi } from '../../../../core/api/documents.api';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'property-info-tab',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslateModule],
  templateUrl: './property-info-tab.html'
})
export class PropertyInfoTab implements OnDestroy {
  property = input.required<PropertyDetail>();
  propertyUpdated = output<void>();
  private propertiesService = inject(PropertiesService);
  private imagesService = inject(ImagesService);
  private avatarStorage = inject(AvatarStorageService);
  private documentsApi = inject(DocumentsApi);
  
  // Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private translate = inject(TranslateService);

  // UI States
  isEditing = signal(false);
  isSaving = signal(false);
  isUploadingImages = signal(false);
  currentImageIndex = signal(0);
  showStatusDropdown = signal(false);
  isPrintingSheet = signal(false);
  
  // Image upload modal
  showImageUploadModal = signal(false);
  pendingImages = signal<{file: File, preview: string, category: PropertyImageCategory}[]>([]);

  // Form data
  editForm = signal<Partial<PropertyDetail> | null>(null);

  // Available statuses
  availableStatuses = [
    { value: 'Vacant', label: 'PROPERTY.STATUS_VACANT', color: 'slate', icon: 'ph-house' },
    { value: 'Occupied', label: 'PROPERTY.STATUS_OCCUPIED', color: 'emerald', icon: 'ph-user' },
    { value: 'PartiallyOccupied', label: 'PROPERTY.STATUS_PARTIALLY_OCCUPIED', color: 'blue', icon: 'ph-users-three' },
    { value: 'Reserved', label: 'PROPERTY.STATUS_RESERVED', color: 'amber', icon: 'ph-calendar-check' },
    { value: 'UnderMaintenance', label: 'PROPERTY.STATUS_UNDER_MAINTENANCE', color: 'orange', icon: 'ph-wrench' }
  ];

  // Property types
  propertyTypes = ['APARTMENT', 'HOUSE', 'STUDIO', 'VILLA', 'DUPLEX', 'LOFT'];
  
  getPropertyTypeLabel(type: string): string {
    return `PROPERTY.INFO.PROPERTY_TYPES.${type.toUpperCase()}`;
  }
  
  imageCategories: {value: PropertyImageCategory, label: string, icon: string}[] = [
    { value: 'exterior', label: 'PROPERTY.INFO.IMAGE_CATEGORIES.EXTERIOR', icon: 'ph-house' },
    { value: 'living_room', label: 'PROPERTY.INFO.IMAGE_CATEGORIES.LIVING_ROOM', icon: 'ph-couch' },
    { value: 'kitchen', label: 'PROPERTY.INFO.IMAGE_CATEGORIES.KITCHEN', icon: 'ph-cooking-pot' },
    { value: 'bedroom', label: 'PROPERTY.INFO.IMAGE_CATEGORIES.BEDROOM', icon: 'ph-bed' },
    { value: 'bathroom', label: 'PROPERTY.INFO.IMAGE_CATEGORIES.BATHROOM', icon: 'ph-bathtub' },
    { value: 'other', label: 'PROPERTY.INFO.IMAGE_CATEGORIES.OTHER', icon: 'ph-image' }
  ];

  // Computed
  currentStatus = computed(() => {
    const status = this.property()?.status || 'Vacant';
    return this.availableStatuses.find(s => s.value === status) || this.availableStatuses[0];
  });

  hasImages = computed(() => {
    return this.property()?.imageUrls?.length > 0;
  });

  totalImages = computed(() => {
    return this.property()?.imageUrls?.length || 0;
  });

  // Cache des URLs blob pour les images (signal pour réactivité)
  private imageBlobCache = signal<Map<string, string>>(new Map());
  
  currentImage = computed(() => {
    const images = this.property()?.imageUrls || [];
    const imageId = images[this.currentImageIndex()];
    if (!imageId) return '/assets/images/hero-building.jpg';
    
    // Vérifier si l'image est déjà en cache
    const cache = this.imageBlobCache();
    if (cache.has(imageId)) {
      return cache.get(imageId)!;
    }
    
    // Charger l'image via HttpClient avec authentification
    this.loadImageBlob(imageId);
    return '/assets/images/hero-building.jpg'; // Placeholder temporaire pendant le chargement
  });
  
  private loadImageBlob(imageId: string): void {
    this.imagesService.getImageBlob(imageId).subscribe({
      next: (blob: Blob) => {
        console.log(blob);
        const blobUrl = URL.createObjectURL(blob);
        console.log(blobUrl);
        // Mettre à jour le signal avec une nouvelle Map
        this.imageBlobCache.update(cache => {
          const newCache = new Map(cache);
          newCache.set(imageId, blobUrl);
          return newCache;
        });
      },
      error: (err: any) => {
        console.error('Erreur chargement image:', err);
        // Mettre à jour le signal avec une nouvelle Map
        this.imageBlobCache.update(cache => {
          const newCache = new Map(cache);
          newCache.set(imageId, '/assets/images/hero-building.jpg');
          return newCache;
        });
      }
    });
  }

  async printPropertySheet() {
    const prop = this.property();
    if (!prop?.id) {
      this.toasts.error('PROPERTY.NOT_FOUND');
      return;
    }

    this.isPrintingSheet.set(true);
    try {
      const blob = await firstValueFrom(this.documentsApi.downloadPropertySheet(prop.id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Fiche_Bien_${prop.code || prop.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error printing property sheet:', err);
      this.toasts.error('PROPERTY.INFO.TOAST.SHEET_GENERATION_ERROR');
    } finally {
      this.isPrintingSheet.set(false);
    }
  }

  private clearImageCache(): void {
    // Révoquer toutes les URLs blob
    const cache = this.imageBlobCache();
    cache.forEach((blobUrl: string) => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    });
    this.imageBlobCache.set(new Map());
  }

  // Occupation info
  occupationInfo = computed(() => {
    const prop = this.property();
    if (!prop) return null;

    const usageType = prop.propertyUsageType?.toLowerCase();
    
    if (usageType === 'colocation') {
      return {
        type: this.translate.instant('PROPERTY.INFO.USAGE_TYPE.COLOCATION'),
        occupied: prop.occupiedRooms || 0,
        total: prop.totalRooms || 0,
        percentage: ((prop.occupiedRooms || 0) / (prop.totalRooms || 1)) * 100
      };
    }

    return null;
  });

  // Actions
  startEditing() {
    const prop = this.property();

    const toDateInput = (value: any): any => {
      if (!value) return value;
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
      }
      if (typeof value === 'string') {
        // Accept ISO strings and already formatted YYYY-MM-DD
        if (value.length >= 10) return value.slice(0, 10);
      }
      return value;
    };

    const edit: any = { ...prop };
    // Normalize all date inputs so <input type="date"> is prefilled.
    edit.purchaseDate = toDateInput(edit.purchaseDate);
    edit.electricDiagnosticDate = toDateInput(edit.electricDiagnosticDate);
    edit.electricDiagnosticExpiry = toDateInput(edit.electricDiagnosticExpiry);
    edit.gasDiagnosticDate = toDateInput(edit.gasDiagnosticDate);
    edit.gasDiagnosticExpiry = toDateInput(edit.gasDiagnosticExpiry);
    edit.asbestosDiagnosticDate = toDateInput(edit.asbestosDiagnosticDate);

    this.editForm.set(edit);
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.editForm.set(null);
    this.isEditing.set(false);
  }

  saveChanges() {
    const form = this.editForm();
    const prop = this.property();
    if (!form || !prop) return;

    this.isSaving.set(true);

    const dto: any = { ...form };

    const toIsoOrNull = (value: any): string | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'string') {
        const v = value.trim();
        if (v.length === 0) return null;
        // If already YYYY-MM-DD from input[type=date], convert to ISO.
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00.000Z`;
        return v;
      }
      return value;
    };

    // Ensure dates are sent in a backend-friendly format.
    dto.purchaseDate = toIsoOrNull(dto.purchaseDate);
    dto.electricDiagnosticDate = toIsoOrNull(dto.electricDiagnosticDate);
    dto.electricDiagnosticExpiry = toIsoOrNull(dto.electricDiagnosticExpiry);
    dto.gasDiagnosticDate = toIsoOrNull(dto.gasDiagnosticDate);
    dto.gasDiagnosticExpiry = toIsoOrNull(dto.gasDiagnosticExpiry);
    dto.asbestosDiagnosticDate = toIsoOrNull(dto.asbestosDiagnosticDate);

    this.propertiesService.updateProperty(prop.id, dto).subscribe({
      next: (updated) => {
        void updated;
        this.isEditing.set(false);
        this.editForm.set(null);
        this.isSaving.set(false);
        // Notify parent to reload property from DB
        this.propertyUpdated.emit();
      },
      error: (err) => {
        console.error('❌ Error updating property:', err);
        this.toasts.error('PROPERTY.INFO.ERRORS.UPDATE');
        this.isSaving.set(false);
      }
    });
  }

  async changeStatus(status: string) {
    const prop = this.property();
    if (!prop || prop.status === status) {
      this.showStatusDropdown.set(false);
      return;
    }

    const statusLabel = this.availableStatuses.find(s => s.value === status)?.label;
    const translatedStatusLabel = statusLabel ? this.translate.instant(statusLabel) : status;
    const confirmed = await this.confirmService.warning(
      this.translate.instant('PROPERTY.INFO.CONFIRM.CHANGE_STATUS_TITLE'),
      this.translate.instant('PROPERTY.INFO.CONFIRM.CHANGE_STATUS_MESSAGE', { status: translatedStatusLabel })
    );
    if (!confirmed) {
      this.showStatusDropdown.set(false);
      return;
    }

    this.propertiesService.updatePropertyStatus(prop.id, status).subscribe({
      next: () => {
        this.showStatusDropdown.set(false);
        // Notify parent to reload property from DB
        this.propertyUpdated.emit();
      },
      error: (err) => {
        console.error('❌ Error updating status:', err);
        this.toasts.error('PROPERTY.INFO.ERRORS.CHANGE_STATUS');
        this.showStatusDropdown.set(false);
      }
    });
  }

  // Carousel
  previousImage() {
    const total = this.totalImages();
    if (total === 0) return;
    this.currentImageIndex.update(i => (i - 1 + total) % total);
  }

  nextImage() {
    const total = this.totalImages();
    if (total === 0) return;
    this.currentImageIndex.update(i => (i + 1) % total);
  }

  goToImage(index: number) {
    this.currentImageIndex.set(index);
  }

  // ✅ Upload Images
  triggerImageUpload() {
    // Create invisible file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e: any) => {
      const files: FileList = e.target?.files;
      if (!files || files.length === 0) return;
      
      this.uploadImages(files);
    };
    
    input.click();
  }

  uploadImages(files: FileList) {
    const fileArray = Array.from(files);
    const pending: {file: File, preview: string, category: PropertyImageCategory}[] = [];

    let processed = 0;
    fileArray.forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        pending.push({
          file,
          preview: e.target.result,
          category: 'other' // Default category
        });
        processed++;
        
        if (processed === fileArray.length) {
          this.pendingImages.set(pending);
          this.showImageUploadModal.set(true);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }

  updateImageCategory(index: number, category: PropertyImageCategory) {
    const images = [...this.pendingImages()];
    if (!images[index]) return; // Guard contre index invalide
    
    images[index].category = category;
    this.pendingImages.set(images);
  }

  removePendingImage(index: number) {
    const images = [...this.pendingImages()];
    images.splice(index, 1);
    this.pendingImages.set(images);
  }

  cancelImageUpload() {
    this.pendingImages.set([]);
    this.showImageUploadModal.set(false);
  }

  async confirmImageUpload() {
    const prop = this.property();
    if (!prop) return;

    const pending = this.pendingImages();
    if (pending.length === 0) return;

    this.isUploadingImages.set(true);

    try {
      const byCategory = pending.reduce((acc, img) => {
        const key = img.category ?? 'other';
        acc[key] = acc[key] ?? [];
        acc[key].push(img.file);
        return acc;
      }, {} as Record<PropertyImageCategory, File[]>);

      const categories = Object.keys(byCategory) as PropertyImageCategory[];
      const results = await Promise.all(
        categories.map((category) => firstValueFrom(this.imagesService.uploadImages(prop.id, byCategory[category], category)))
      );

      const livingRoomImageId = results
        .flatMap(r => r?.images ?? [])
        .find(img => (img.category || '').toLowerCase() === 'living_room')
        ?.id;
      if (livingRoomImageId) {
        this.avatarStorage.setPropertyAvatarImageId(prop.id, livingRoomImageId);
      }

      const totalUploaded = results.reduce((sum, r) => sum + (r?.images?.length ?? 0), 0);
      if (totalUploaded === 0) {
        throw new Error(this.translate.instant('PROPERTY.INFO.ERROR_MESSAGES.NO_IMAGES_UPLOADED'));
      }

      this.clearImageCache();

      const currentImages = this.property().imageUrls || [];
      if (currentImages.length === 0) {
        this.currentImageIndex.set(0);
      }
      this.isUploadingImages.set(false);
      this.showImageUploadModal.set(false);
      this.pendingImages.set([]);
      this.propertyUpdated.emit();
      this.toasts.success('PROPERTY.INFO.SUCCESS.IMAGES_UPLOADED');
    } catch (err) {
      console.error('❌ Error uploading images:', err);
      this.toasts.error('PROPERTY.INFO.ERROR_MESSAGES.UPLOAD_IMAGES');
      this.isUploadingImages.set(false);
    }
  }

  getCategoryLabel(category: PropertyImageCategory): string {
    return this.imageCategories.find(c => c.value === category)?.label || 'PROPERTY.INFO.IMAGE_CATEGORIES.OTHER';
  }

  async deleteImage(index: number) {
    const prop = this.property();
    if (!prop) return;

    const confirmed = await this.confirmService.danger(
      this.translate.instant('PROPERTY.INFO.DELETE_CONFIRM.TITLE'),
      this.translate.instant('PROPERTY.INFO.DELETE_CONFIRM.MESSAGE'),
      this.translate.instant('PROPERTY.INFO.DELETE_CONFIRM.BUTTON')
    );
    if (!confirmed) return;

    const currentImages = [...(prop.imageUrls || [])];
    const imageIdToDelete = currentImages[index];
    
    try {
      // 1. Supprimer le fichier via le service (met à jour la propriété automatiquement en backend)
      await firstValueFrom(this.imagesService.deleteImage(imageIdToDelete));

      const currentAvatarId = this.avatarStorage.getPropertyAvatarImageId(prop.id);
      if (currentAvatarId && currentAvatarId === imageIdToDelete) {
        this.avatarStorage.setPropertyAvatarImageId(prop.id, null);
      }

      // 2. Succès - le backend a déjà mis à jour property.imageUrls
      
      // Supprimer l'URL blob du cache si elle existe
      const cache = this.imageBlobCache();
      if (cache.has(imageIdToDelete)) {
        const blobUrl = cache.get(imageIdToDelete)!;
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
        this.imageBlobCache.update(c => {
          const newCache = new Map(c);
          newCache.delete(imageIdToDelete);
          return newCache;
        });
      }
      
      currentImages.splice(index, 1); // Pour mise à jour locale immédiate
      if (this.currentImageIndex() >= currentImages.length && currentImages.length > 0) {
        this.currentImageIndex.set(currentImages.length - 1);
      } else if (currentImages.length === 0) {
        this.currentImageIndex.set(0);
      }
      this.propertyUpdated.emit(); // Recharger la propriété depuis le backend
      this.toasts.success('PROPERTY.INFO.SUCCESS.IMAGE_DELETED');
    } catch (err) {
      console.error('❌ Error deleting image:', err);
      this.toasts.error('PROPERTY.INFO.ERROR_MESSAGES.DELETE_IMAGE');
    }
  }

  // Lifecycle
  ngOnDestroy(): void {
    // Nettoyer toutes les URLs blob pour éviter les fuites mémoire
    const cache = this.imageBlobCache();
    cache.forEach((blobUrl: string) => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    });
    this.imageBlobCache.set(new Map());
  }

  // Helpers
  getUsageTypeLabel(type?: string): string {
    switch(type?.toLowerCase()) {
      case 'complete': return 'PROPERTY.INFO.USAGE_TYPE.COMPLETE';
      case 'colocation': return 'PROPERTY.INFO.USAGE_TYPE.COLOCATION';
      case 'airbnb': return 'PROPERTY.INFO.USAGE_TYPE.AIRBNB';
      default: return 'PROPERTY.INFO.USAGE_TYPE.UNDEFINED';
    }
  }

  getUsageTypeIcon(type?: string): string {
    switch(type?.toLowerCase()) {
      case 'complete': return 'ph-house';
      case 'colocation': return 'ph-users-three';
      case 'airbnb': return 'ph-airplane-in-flight';
      default: return 'ph-house';
    }
  }

  getUsageTypeColor(type?: string): string {
    switch(type?.toLowerCase()) {
      case 'complete': return 'emerald';
      case 'colocation': return 'blue';
      case 'airbnb': return 'purple';
      default: return 'slate';
    }
  }

  // Colocation helpers
  isColocation = computed(() => {
    const usageType = this.property()?.propertyUsageType?.toLowerCase();
    return usageType === 'colocation' || usageType === 'colocationindividual' || usageType === 'colocationsolidaire';
  });

  getOccupancyRate(): number {
    const prop = this.property();
    if (!prop || !prop.totalRooms || prop.totalRooms === 0) return 0;
    return ((prop.occupiedRooms || 0) / prop.totalRooms) * 100;
  }

  // Diagnostics helpers
  getDpeColor(rating?: string): string {
    if (!rating) return 'bg-slate-400';
    switch(rating.toUpperCase()) {
      case 'A': return 'bg-emerald-500';
      case 'B': return 'bg-green-500';
      case 'C': return 'bg-lime-500';
      case 'D': return 'bg-yellow-500';
      case 'E': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      case 'G': return 'bg-red-700';
      default: return 'bg-slate-400';
    }
  }

  getGesColor(rating?: string): string {
    if (!rating) return 'bg-slate-400';
    switch(rating.toUpperCase()) {
      case 'A': return 'bg-purple-500';
      case 'B': return 'bg-indigo-500';
      case 'C': return 'bg-blue-500';
      case 'D': return 'bg-cyan-500';
      case 'E': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      case 'G': return 'bg-red-700';
      default: return 'bg-slate-400';
    }
  }

  isDiagnosticExpired(expiryDate: Date | undefined): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  }

  // Validation helpers
  isMissingCriticalInfo(): boolean {
    const prop = this.property();
    if (!prop) return true;
    
    return !prop.name || 
           !prop.type || 
           !prop.propertyUsageType || 
           !prop.surface || prop.surface <= 0 ||
           !prop.address ||
           !prop.rent || prop.rent <= 0;
  }

  getMissingFields(): string[] {
    const prop = this.property();
    const missing: string[] = [];
    
    if (!prop) return [this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.ALL_INFO')];
    if (!prop.name) missing.push(this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.PROPERTY_NAME'));
    if (!prop.type) missing.push(this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.PROPERTY_TYPE'));
    if (!prop.propertyUsageType) missing.push(this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.RENTAL_USAGE'));
    if (!prop.surface || prop.surface <= 0) missing.push(this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.SURFACE'));
    if (!prop.address) missing.push(this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.ADDRESS'));
    if (!prop.rent || prop.rent <= 0) missing.push(this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.REFERENCE_RENT'));
    if (!prop.dpeRating) missing.push(this.translate.instant('PROPERTY.INFO.MISSING_FIELDS.DPE'));
    
    return missing;
  }
}
