import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'auto';

export interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  // Signals
  readonly theme = signal<Theme>('auto');
  readonly isDark = signal<boolean>(false);
  readonly customColors = signal<CustomColors | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Load theme from localStorage
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        this.theme.set(savedTheme);
      }

      // Load custom colors
      const savedColors = localStorage.getItem('customColors');
      if (savedColors) {
        this.customColors.set(JSON.parse(savedColors));
      }

      // Apply theme on init
      this.applyTheme();

      // Watch system preference
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', () => this.applyTheme());

      // Effect: apply theme when changed
      effect(() => {
        this.applyTheme();
        localStorage.setItem('theme', this.theme());
      });

      // Effect: apply custom colors when changed
      effect(() => {
        const colors = this.customColors();
        if (colors) {
          this.applyCustomColors(colors);
          localStorage.setItem('customColors', JSON.stringify(colors));
        }
      });
    }
  }

  /**
   * Toggle between light and dark
   */
  toggle(): void {
    const newTheme = this.isDark() ? 'light' : 'dark';
    this.theme.set(newTheme);
  }

  /**
   * Toggle theme (alias for toggle)
   */
  toggleTheme(): void {
    this.toggle();
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  /**
   * Set dark mode on/off
   */
  setDarkMode(isDark: boolean): void {
    this.theme.set(isDark ? 'dark' : 'light');
  }

  /**
   * Set custom colors (user preference)
   */
  setCustomColors(colors: CustomColors): void {
    this.customColors.set(colors);
  }

  /**
   * Reset to default colors
   */
  resetColors(): void {
    this.customColors.set(null);
    localStorage.removeItem('customColors');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const theme = this.theme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = theme === 'dark' || (theme === 'auto' && prefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      this.isDark.set(true);
    } else {
      document.documentElement.classList.remove('dark');
      this.isDark.set(false);
    }
  }

  private applyCustomColors(colors: CustomColors): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Inject CSS variables for custom colors
    const root = document.documentElement;
    
    // You can implement a color palette generator here
    // For now, just set the base color
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
  }
}
