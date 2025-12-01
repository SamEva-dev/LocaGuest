import { Component, input, signal, computed, inject, output } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyDetail, UpdatePropertyDto } from '../../../../core/api/properties.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';

@Component({
  selector: 'property-info-tab',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './property-info-tab.html'
})
export class PropertyInfoTab {
  property = input.required<PropertyDetail>();
  propertyUpdated = output<void>();
  private propertiesService = inject(PropertiesService);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);

  // UI States
  isEditing = signal(false);
  isSaving = signal(false);
  isUploadingImages = signal(false);
  currentImageIndex = signal(0);
  showStatusDropdown = signal(false);

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
  propertyTypes = ['Apartment', 'House', 'Studio', 'Room', 'Parking', 'Commercial', 'Other'];

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

  currentImage = computed(() => {
    const images = this.property()?.imageUrls || [];
    return images[this.currentImageIndex()] || '/placeholder-property.jpg';
  });

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
    const prop = this.property();
    if (!prop) return;

    this.isUploadingImages.set(true);

    // TODO: Implement actual upload to backend
    // For now, we'll simulate with local file URLs
    const fileArray = Array.from(files);
    const newImageUrls: string[] = [];

    let processed = 0;
    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        newImageUrls.push(e.target.result);
        processed++;
        
        if (processed === fileArray.length) {
          // All files processed
          const currentImages = this.property().imageUrls || [];
          const updatedImages = [...currentImages, ...newImageUrls];
          
          // Update property with new images (cast as any for now - imageUrls not in UpdatePropertyDto yet)
          this.propertiesService.updateProperty(prop.id, { 
            imageUrls: updatedImages 
          } as any).subscribe({
            next: () => {
              console.log('✅ Images uploaded successfully');
              this.isUploadingImages.set(false);
              this.propertyUpdated.emit();
              this.toasts.successDirect(`${fileArray.length} photo(s) ajoutée(s) avec succès!`);
            },
            error: (err) => {
              console.error('❌ Error uploading images:', err);
              this.toasts.errorDirect('Erreur lors de l\'upload des photos');
              this.isUploadingImages.set(false);
            }
          });
        }
      };
      
      reader.readAsDataURL(file);
    });
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
    currentImages.splice(index, 1);

    // Cast as any for now - imageUrls not in UpdatePropertyDto yet
    this.propertiesService.updateProperty(prop.id, { 
      imageUrls: currentImages 
    } as any).subscribe({
      next: () => {
        console.log('✅ Image deleted successfully');
        if (this.currentImageIndex() >= currentImages.length && currentImages.length > 0) {
          this.currentImageIndex.set(currentImages.length - 1);
        }
        this.propertyUpdated.emit();
      },
      error: (err) => {
        console.error('❌ Error deleting image:', err);
        this.toasts.errorDirect('Erreur lors de la suppression de la photo');
      }
    });
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
