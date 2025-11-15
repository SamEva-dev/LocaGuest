import { ChangeDetectionStrategy, Component, inject, signal, effect, PLATFORM_ID, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageSwitch } from '../../components/language-switch/language-switch';
import { RouterLink, Router } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { SubscriptionService, Plan } from '../../core/services/subscription.service';

@Component({
  selector: 'landing-page',
  imports: [CommonModule, RouterLink, TranslatePipe, LanguageSwitch],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage implements OnInit {
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  // Animated counters
  propertiesCount = signal(0);
  usersCount = signal(0);
  satisfactionCount = signal(0);

  // Pricing plans
  plans = signal<Plan[]>([]);
  isAnnual = signal(false);

  features = [
    { icon: 'ph ph-buildings', title: 'FEATURES.ITEMS.PROPERTIES.TITLE', description: 'FEATURES.ITEMS.PROPERTIES.DESCRIPTION' },
    { icon: 'ph ph-users-three', title: 'FEATURES.ITEMS.TENANTS.TITLE', description: 'FEATURES.ITEMS.TENANTS.DESCRIPTION' },
    { icon: 'ph ph-file-text', title: 'FEATURES.ITEMS.DOCUMENTS.TITLE', description: 'FEATURES.ITEMS.DOCUMENTS.DESCRIPTION' },
    { icon: 'ph ph-chart-line-up', title: 'FEATURES.ITEMS.ANALYTICS.TITLE', description: 'FEATURES.ITEMS.ANALYTICS.DESCRIPTION' },
    { icon: 'ph ph-shield-check', title: 'FEATURES.ITEMS.LEGAL.TITLE', description: 'FEATURES.ITEMS.LEGAL.DESCRIPTION' },
    { icon: 'ph ph-gear-six', title: 'FEATURES.ITEMS.ACCOUNTING.TITLE', description: 'FEATURES.ITEMS.ACCOUNTING.DESCRIPTION' }
  ];

  ngOnInit() {
    this.subscriptionService.loadPlans().subscribe(
      plans => this.plans.set(plans)
    );
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollAnimations();
      this.animateCounters();
    }
  }

  selectPlan(plan: Plan) {
    if (plan.monthlyPrice === 0) {
      // Free plan - redirect to signup/login
      this.router.navigate(['/login']);
    } else {
      // Paid plan - redirect to login with plan preselected
      this.router.navigate(['/login'], { queryParams: { plan: plan.code } });
    }
  }

  contactSales() {
    window.location.href = 'mailto:contact@locaguest.com?subject=Plan Enterprise';
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
