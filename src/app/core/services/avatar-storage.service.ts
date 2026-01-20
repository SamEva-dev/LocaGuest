import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AvatarStorageService {
  private readonly tenantPrefix = 'tenant-avatar:';
  private readonly propertyPrefix = 'property-avatar:';

  getTenantAvatarDataUrl(tenantId: string): string | null {
    if (!tenantId) return null;
    try {
      return localStorage.getItem(`${this.tenantPrefix}${tenantId}`);
    } catch {
      return null;
    }
  }

  setTenantAvatarDataUrl(tenantId: string, dataUrl: string | null): void {
    if (!tenantId) return;
    try {
      const key = `${this.tenantPrefix}${tenantId}`;
      if (!dataUrl) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, dataUrl);
    } catch {
      // ignore storage errors
    }
  }

  getPropertyAvatarImageId(propertyId: string): string | null {
    if (!propertyId) return null;
    try {
      return localStorage.getItem(`${this.propertyPrefix}${propertyId}`);
    } catch {
      return null;
    }
  }

  setPropertyAvatarImageId(propertyId: string, imageId: string | null): void {
    if (!propertyId) return;
    try {
      const key = `${this.propertyPrefix}${propertyId}`;
      if (!imageId) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, imageId);
    } catch {
      // ignore storage errors
    }
  }
}
