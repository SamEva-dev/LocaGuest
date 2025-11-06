import { ChangeDetectionStrategy, Component, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageSwitch } from '../../components/language-switch/language-switch';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'landing-page',
  imports: [RouterLink,TranslatePipe, LanguageSwitch],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  // Animated counters
  propertiesCount = signal(0);
  usersCount = signal(0);
  satisfactionCount = signal(0);

  features = [
    { icon: 'ph ph-buildings', title: 'FEATURES.ITEMS.PROPERTIES.TITLE', description: 'FEATURES.ITEMS.PROPERTIES.DESCRIPTION' },
    { icon: 'ph ph-users-three', title: 'FEATURES.ITEMS.TENANTS.TITLE', description: 'FEATURES.ITEMS.TENANTS.DESCRIPTION' },
    { icon: 'ph ph-file-text', title: 'FEATURES.ITEMS.DOCUMENTS.TITLE', description: 'FEATURES.ITEMS.DOCUMENTS.DESCRIPTION' },
    { icon: 'ph ph-chart-line-up', title: 'FEATURES.ITEMS.ANALYTICS.TITLE', description: 'FEATURES.ITEMS.ANALYTICS.DESCRIPTION' },
    { icon: 'ph ph-shield-check', title: 'FEATURES.ITEMS.LEGAL.TITLE', description: 'FEATURES.ITEMS.LEGAL.DESCRIPTION' },
    { icon: 'ph ph-gear-six', title: 'FEATURES.ITEMS.ACCOUNTING.TITLE', description: 'FEATURES.ITEMS.ACCOUNTING.DESCRIPTION' }
  ];

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollAnimations();
      this.animateCounters();
    }
  }

  private setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  private animateCounters() {
    this.animateValue(this.propertiesCount, 5000, 2000);
    this.animateValue(this.usersCount, 12000, 2500);
    this.animateValue(this.satisfactionCount, 98, 2000);
  }

  private animateValue(signal: any, target: number, duration: number) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        signal.set(target);
        clearInterval(timer);
      } else {
        signal.set(Math.floor(current));
      }
    }, 16);
  }
}
