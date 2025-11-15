import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, inject, effect } from '@angular/core';
import { SubscriptionService } from '../services/subscription.service';

/**
 * Directive structurelle pour afficher un élément si la feature est accessible
 * Usage: <button *ngIfFeature="'unlimited_exports'">Export Illimité</button>
 */
@Directive({
  selector: '[ngIfFeature]',
  standalone: true
})
export class IfFeatureDirective implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  @Input() ngIfFeature!: string;

  ngOnInit() {
    // Use effect to reactively update view when plan changes
    effect(() => {
      const plan = this.subscriptionService.currentPlan();
      if (plan) {
        const hasAccess = this.checkFeature(plan);
        this.updateView(hasAccess);
      }
    });
  }

  private checkFeature(plan: any): boolean {
    const featureMap: Record<string, boolean> = {
      'unlimited_exports': plan.hasUnlimitedExports,
      'unlimited_versioning': plan.hasUnlimitedVersioning,
      'unlimited_ai': plan.hasUnlimitedAi,
      'private_templates': plan.hasPrivateTemplates,
      'team_templates': plan.hasTeamTemplates,
      'advanced_comparison': plan.hasAdvancedComparison,
      'api_access': plan.hasApiAccess,
      'api_read_write': plan.hasApiReadWrite,
      'email_notifications': plan.hasEmailNotifications,
      'slack_integration': plan.hasSlackIntegration,
      'webhooks': plan.hasWebhooks,
      'sso': plan.hasSso,
      'priority_support': plan.hasPrioritySupport,
      'dedicated_support': plan.hasDedicatedSupport
    };

    return featureMap[this.ngIfFeature] ?? false;
  }

  private updateView(show: boolean) {
    if (show) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
