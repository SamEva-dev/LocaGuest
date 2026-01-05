import { Injectable, inject, signal, effect } from '@angular/core';
import { OrganizationsService, Organization } from './organizations.service';
import { ThemeService } from './theme.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environnements/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandingThemeService {
  private organizationsService = inject(OrganizationsService);
  private themeService = inject(ThemeService);
  
  // Current branding state
  private brandingSignal = signal<Organization | null>(null);
  public branding = this.brandingSignal.asReadonly();

  // Default colors (fallback)
  private readonly defaultColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B'
  };

  constructor() {
    // React to theme changes (light/dark toggle)
    effect(() => {
      const isDark = this.themeService.isDark();
      const org = this.brandingSignal();
      
      if (org) {
        this.applyBranding(org, isDark);
      }
    });
  }

  /**
   * Load organization branding and apply to theme
   */
  async loadBranding(): Promise<void> {
    try {
      const org = await firstValueFrom(
        this.organizationsService.getCurrentOrganization()
      );
      
      this.brandingSignal.set(org);
      const isDark = this.themeService.isDark();
      this.applyBranding(org, isDark);
    } catch (error) {
      console.error('Error loading branding:', error);
      // Apply default colors on error
      this.applyDefaultBranding();
    }
  }

  /**
   * Apply branding colors to CSS variables (with dark mode support)
   */
  private applyBranding(org: Organization, isDark: boolean = false): void {
    const root = document.documentElement;
    
    // Get base colors
    const basePrimary = org.primaryColor || this.defaultColors.primary;
    const baseSecondary = org.secondaryColor || this.defaultColors.secondary;
    const baseAccent = org.accentColor || this.defaultColors.accent;
    
    // Adjust colors for dark mode if needed
    const primaryColor = isDark ? this.adjustColorForDarkMode(basePrimary) : basePrimary;
    const secondaryColor = isDark ? this.adjustColorForDarkMode(baseSecondary) : baseSecondary;
    const accentColor = isDark ? this.adjustColorForDarkMode(baseAccent) : baseAccent;
    
    // Apply primary color
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-primary-rgb', this.hexToRgb(primaryColor));
    
    // Apply secondary color
    root.style.setProperty('--color-secondary', secondaryColor);
    root.style.setProperty('--color-secondary-rgb', this.hexToRgb(secondaryColor));
    
    // Apply accent color
    root.style.setProperty('--color-accent', accentColor);
    root.style.setProperty('--color-accent-rgb', this.hexToRgb(accentColor));
  }

  /**
   * Apply default branding (fallback)
   */
  private applyDefaultBranding(): void {
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', this.defaultColors.primary);
    root.style.setProperty('--color-primary-rgb', this.hexToRgb(this.defaultColors.primary));
    
    root.style.setProperty('--color-secondary', this.defaultColors.secondary);
    root.style.setProperty('--color-secondary-rgb', this.hexToRgb(this.defaultColors.secondary));
    
    root.style.setProperty('--color-accent', this.defaultColors.accent);
    root.style.setProperty('--color-accent-rgb', this.hexToRgb(this.defaultColors.accent));
  }

  /**
   * Adjust color for dark mode (increase lightness)
   */
  private adjustColorForDarkMode(hex: string): string {
    const hsl = this.hexToHsl(hex);
    
    // Increase lightness by 30% for dark mode (more visible on dark background)
    // But cap at 85% to avoid pure white
    const newLightness = Math.min(hsl.l + 30, 85);
    
    return this.hslToHex(hsl.h, hsl.s, newLightness);
  }

  /**
   * Convert hex to HSL
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Convert HSL to hex
   */
  private hslToHex(h: number, s: number, l: number): string {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Convert hex color to RGB string
   */
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return '0, 0, 0'; // Fallback to black
    }
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r}, ${g}, ${b}`;
  }

  /**
   * Get logo URL (with fallback)
   */
  getLogoUrl(): string | null {
    const org = this.brandingSignal();
    if (!org || !org.logoUrl) {
      return null;
    }
    
    // If URL is relative, prepend API base URL
    if (org.logoUrl.startsWith('/')) {
      return `${environment.BASE_LOCAGUEST_API}${org.logoUrl}`;
    }
    
    return org.logoUrl;
  }

  /**
   * Get organization name
   */
  getOrganizationName(): string {
    return this.brandingSignal()?.name || 'LocaGuest';
  }

  /**
   * Refresh branding (after settings update)
   */
  async refreshBranding(): Promise<void> {
    await this.loadBranding();
  }
}
