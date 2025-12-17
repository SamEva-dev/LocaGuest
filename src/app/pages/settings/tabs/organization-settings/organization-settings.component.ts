import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationsService, Organization } from '../../../../core/services/organizations.service';
import { BrandingThemeService } from '../../../../core/services/branding-theme.service';
import { ToastService } from '../../../../core/ui/toast.service';

interface OrganizationSettings {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  subscriptionPlan?: string;
  subscriptionExpiryDate?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  website?: string;
}

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-settings.component.html'
})
export class OrganizationSettingsComponent implements OnInit {
  private organizationsService = inject(OrganizationsService);
  private brandingThemeService = inject(BrandingThemeService);
  private toast = inject(ToastService);

  isLoading = signal(false);
  isSaving = signal(false);
  isUploadingLogo = signal(false);

  organization = signal<OrganizationSettings>({
    id: '',
    code: '',
    name: '',
    email: '',
    phone: '',
    status: '',
    subscriptionPlan: '',
    logoUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    website: ''
  });

  ngOnInit() {
    this.loadOrganization();
  }

  loadOrganization() {
    this.isLoading.set(true);
    this.organizationsService.getCurrentOrganization().subscribe({
      next: (org) => {
        this.organization.set(org);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading organization:', error);
        this.toast.error('SETTINGS.ORGANIZATION.LOAD_ERROR');
        this.isLoading.set(false);
      }
    });
  }

  onLogoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) {
      return;
    }

    const file = input.files[0];
    const org = this.organization();
    
    // Validation côté client
    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSize) {
      this.toast.error('SETTINGS.ORGANIZATION.LOGO_FILE_TOO_LARGE');
      input.value = ''; // Reset input
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toast.error('SETTINGS.ORGANIZATION.LOGO_INVALID_FILE_TYPE');
      input.value = ''; // Reset input
      return;
    }

    // Upload le fichier
    this.isUploadingLogo.set(true);
    this.organizationsService.uploadLogo(org.id, file).subscribe({
      next: (response) => {
        const current = this.organization();
        this.organization.set({
          ...current,
          logoUrl: response.logoUrl
        });
        this.toast.success('SETTINGS.ORGANIZATION.LOGO_UPLOAD_SUCCESS');
        this.isUploadingLogo.set(false);
        
        // Refresh branding to update logo in header
        this.brandingThemeService.refreshBranding();
      },
      error: (error) => {
        console.error('Error uploading logo:', error);
        const errorMessage = error.error?.error || 'Error uploading logo';
        this.toast.error(errorMessage);
        this.isUploadingLogo.set(false);
        input.value = ''; // Reset input
      }
    });
  }

  updateColor(colorType: 'primary' | 'secondary' | 'accent', event: Event) {
    const input = event.target as HTMLInputElement;
    const current = this.organization();
    
    if (colorType === 'primary') {
      this.organization.set({ ...current, primaryColor: input.value });
    } else if (colorType === 'secondary') {
      this.organization.set({ ...current, secondaryColor: input.value });
    } else if (colorType === 'accent') {
      this.organization.set({ ...current, accentColor: input.value });
    }
  }

  saveSettings() {
    const org = this.organization();
    
    if (!org.name || !org.email) {
      this.toast.error('SETTINGS.ORGANIZATION.REQUIRED_FIELDS');
      return;
    }

    this.isSaving.set(true);
    this.organizationsService.updateOrganizationSettings({
      organizationId: org.id,
      name: org.name,
      email: org.email,
      phone: org.phone,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor,
      accentColor: org.accentColor,
      website: org.website
    }).subscribe({
      next: (updated) => {
        this.organization.set(updated);
        this.toast.success('SETTINGS.ORGANIZATION.SAVE_SUCCESS');
        this.isSaving.set(false);
        
        // Refresh branding to apply new colors
        this.brandingThemeService.refreshBranding();
      },
      error: (error) => {
        console.error('Error updating organization:', error);
        this.toast.error('SETTINGS.ORGANIZATION.SAVE_ERROR');
        this.isSaving.set(false);
      }
    });
  }

  resetColors() {
    const current = this.organization();
    this.organization.set({
      ...current,
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B'
    });
  }
}
