import { Component, input, signal, inject, computed, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyDetail, PropertyImage, PropertyImageCategory } from '../../../../core/api/properties.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { ImagesService } from '../../../../core/services/images.service';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';

@Component({
  selector: 'property-info-tab',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './property-info-tab.html'
})
export class PropertyInfoTab implements OnDestroy {
  property = input.required<PropertyDetail>();
  propertyUpdated = output<void>();
  private propertiesService = inject(PropertiesService);
  private imagesService = inject(ImagesService);
  
  // Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);

  // UI States
  isEditing = signal(false);
  isSaving = signal(false);
  isUploadingImages = signal(false);
  currentImageIndex = signal(0);
  showStatusDropdown = signal(false);
  
  // Image upload modal
  showImageUploadModal = signal(false);
  pendingImages = signal<{file: File, preview: string, category: PropertyImageCategory}[]>([]);

  // Form data
  editForm = signal<Partial<PropertyDetail> | null>(null);

  // Available statuses
  availableStatuses = [
    { value: 'Vacant', label: 'Vacant', color: 'slate', icon: 'ph-house' },
    { value: 'Occupied', label: 'Occupé', color: 'emerald', icon: 'ph-user' },
    { value: 'PartiallyOccupied', label: 'Partiellement occupé', color: 'blue', icon: 'ph-users-three' },
    { value: 'Reserved', label: 'Réservé', color: 'amber', icon: 'ph-calendar-check' },
    { value: 'UnderMaintenance', label: 'En travaux', color: 'orange', icon: 'ph-wrench' }
  ];

  // Property types
  propertyTypes = ['Appartement', 'Maison', 'Studio', 'Villa', 'Duplex', 'Loft'];
  
  imageCategories: {value: PropertyImageCategory, label: string, icon: string}[] = [
    { value: 'exterior', label: 'Extérieur', icon: 'ph-house' },
    { value: 'living_room', label: 'Salon', icon: 'ph-couch' },
    { value: 'kitchen', label: 'Cuisine', icon: 'ph-cooking-pot' },
    { value: 'bedroom', label: 'Chambre', icon: 'ph-bed' },
    { value: 'bathroom', label: 'Salle de bain', icon: 'ph-bathtub' },
    { value: 'other', label: 'Autre', icon: 'ph-image' }
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
    if (!imageId) return '/placeholder-property.jpg';
    
    // Vérifier si l'image est déjà en cache
    const cache = this.imageBlobCache();
    if (cache.has(imageId)) {
      return cache.get(imageId)!;
    }
    
    // Charger l'image via HttpClient avec authentification
    this.loadImageBlob(imageId);
    return '/placeholder-property.jpg'; // Placeholder temporaire pendant le chargement
  });
  
  private loadImageBlob(imageId: string): void {
    this.imagesService.getImageBlob(imageId).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        console.log('✅ Image blob créée:', blobUrl);
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
          newCache.set(imageId, '/placeholder-property.jpg');
          return newCache;
        });
      }
    });
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
        type: 'Colocation',
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
    console.log('prop',prop)
    this.editForm.set({ ...prop });
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

    this.propertiesService.updateProperty(prop.id, form).subscribe({
      next: (updated) => {
        console.log('✅ Property updated successfully', updated);
        this.isEditing.set(false);
        this.editForm.set(null);
        this.isSaving.set(false);
        // Notify parent to reload property from DB
        this.propertyUpdated.emit();
      },
      error: (err) => {
        console.error('❌ Error updating property:', err);
        this.toasts.errorDirect('Erreur lors de la mise à jour du bien');
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
    const confirmed = await this.confirmService.warning(
      'Changer le statut',
      `Voulez-vous vraiment changer le statut en "${statusLabel}" ?`
    );
    if (!confirmed) {
      this.showStatusDropdown.set(false);
      return;
    }

    this.propertiesService.updatePropertyStatus(prop.id, status).subscribe({
      next: () => {
        console.log('✅ Status updated successfully');
        this.showStatusDropdown.set(false);
        // Notify parent to reload property from DB
        this.propertyUpdated.emit();
      },
      error: (err) => {
        console.error('❌ Error updating status:', err);
        this.toasts.errorDirect('Erreur lors du changement de statut');
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
      // 1. Upload des fichiers via le service (met à jour la propriété automatiquement en backend)
      const files = pending.map(img => img.file);
      const uploadResult = await this.imagesService.uploadImages(prop.id, files, 'other').toPromise();
      
      if (!uploadResult || uploadResult.images.length === 0) {
        throw new Error('Aucune image uploadée');
      }

      // 2. Succès - le backend a déjà mis à jour property.imageUrls
      console.log('✅ Images uploaded successfully');
      
      // Vider le cache pour forcer le rechargement des nouvelles images
      this.clearImageCache();
      
      const currentImages = this.property().imageUrls || [];
      if (currentImages.length === 0) {
        this.currentImageIndex.set(0);
      }
      this.isUploadingImages.set(false);
      this.showImageUploadModal.set(false);
      this.pendingImages.set([]);
      this.propertyUpdated.emit(); // Recharger la propriété depuis le backend
      this.toasts.successDirect(`${uploadResult.images.length} photo(s) ajoutée(s) avec succès!`);
    } catch (err) {
      console.error('❌ Error uploading images:', err);
      this.toasts.errorDirect('Erreur lors de l\'upload des photos');
      this.isUploadingImages.set(false);
    }
  }

  getCategoryLabel(category: PropertyImageCategory): string {
    return this.imageCategories.find(c => c.value === category)?.label || 'Autre';
  }

  async deleteImage(index: number) {
    const prop = this.property();
    if (!prop) return;

    const confirmed = await this.confirmService.danger(
      'Supprimer la photo',
      'Voulez-vous vraiment supprimer cette photo ?',
      'Supprimer'
    );
    if (!confirmed) return;

    const currentImages = [...(prop.imageUrls || [])];
    const imageIdToDelete = currentImages[index];
    
    try {
      // 1. Supprimer le fichier via le service (met à jour la propriété automatiquement en backend)
      await this.imagesService.deleteImage(imageIdToDelete).toPromise();

      // 2. Succès - le backend a déjà mis à jour property.imageUrls
      console.log('✅ Image deleted successfully');
      
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
      this.toasts.successDirect('Photo supprimée avec succès');
    } catch (err) {
      console.error('❌ Error deleting image:', err);
      this.toasts.errorDirect('Erreur lors de la suppression de la photo');
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
      case 'complete': return 'Location complète';
      case 'colocation': return 'Colocation';
      case 'airbnb': return 'Airbnb';
      default: return 'Non défini';
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
    
    if (!prop) return ['Toutes les informations'];
    if (!prop.name) missing.push('Nom du bien');
    if (!prop.type) missing.push('Type de bien');
    if (!prop.propertyUsageType) missing.push('Usage locatif');
    if (!prop.surface || prop.surface <= 0) missing.push('Surface');
    if (!prop.address) missing.push('Adresse');
    if (!prop.rent || prop.rent <= 0) missing.push('Loyer de référence');
    if (!prop.dpeRating) missing.push('DPE');
    
    return missing;
  }
}
