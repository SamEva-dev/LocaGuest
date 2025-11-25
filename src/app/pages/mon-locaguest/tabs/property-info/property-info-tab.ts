import { Component, input, signal, computed, inject, output } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertyDetail, UpdatePropertyDto } from '../../../../core/api/properties.api';
import { PropertiesService } from '../../../../core/services/properties.service';

@Component({
  selector: 'property-info-tab',
  standalone: true,
  imports: [NgClass, TranslatePipe, FormsModule, DecimalPipe],
  templateUrl: './property-info-tab.html'
})
export class PropertyInfoTab {
  property = input.required<PropertyDetail>();
  propertyUpdated = output<void>();
  private propertiesService = inject(PropertiesService);

  // UI States
  isEditing = signal(false);
  isSaving = signal(false);
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
        alert('Erreur lors de la mise à jour du bien');
        this.isSaving.set(false);
      }
    });
  }

  changeStatus(status: string) {
    const prop = this.property();
    if (!prop || prop.status === status) {
      this.showStatusDropdown.set(false);
      return;
    }

    if (!confirm(`Voulez-vous vraiment changer le statut en "${this.availableStatuses.find(s => s.value === status)?.label}" ?`)) {
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
        alert('Erreur lors du changement de statut');
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
}
