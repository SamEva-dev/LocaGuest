import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './features.component.html'
})
export class FeaturesComponent {
  features = [
    { icon: 'ph-buildings', key: 'PROPERTY_MANAGEMENT', color: 'blue' },
    { icon: 'ph-users', key: 'TENANT_MANAGEMENT', color: 'green' },
    { icon: 'ph-file-text', key: 'CONTRACTS', color: 'purple' },
    { icon: 'ph-credit-card', key: 'PAYMENTS', color: 'orange' },
    { icon: 'ph-folder-open', key: 'DOCUMENTS', color: 'pink' },
    { icon: 'ph-calculator', key: 'RENTABILITY', color: 'cyan' },
    { icon: 'ph-chart-line', key: 'DASHBOARD', color: 'indigo' },
    { icon: 'ph-bell', key: 'NOTIFICATIONS', color: 'yellow' }
  ];
}
