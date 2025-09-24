import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageSwitch } from '../../shared/components/language-switch/language-switch';

@Component({
  selector: 'landing-page',
  imports: [TranslatePipe, LanguageSwitch],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {

  private translate = inject(TranslateService)

 features = [
    { icon: 'ph ph-buildings', title: 'FEATURES.ITEMS.PROPERTIES.TITLE', description: 'FEATURES.ITEMS.PROPERTIES.DESCRIPTION' },
    { icon: 'ph ph-users-three', title: 'FEATURES.ITEMS.TENANTS.TITLE', description: 'FEATURES.ITEMS.TENANTS.DESCRIPTION' },
    { icon: 'ph ph-file-text', title: 'FEATURES.ITEMS.DOCUMENTS.TITLE', description: 'FEATURES.ITEMS.DOCUMENTS.DESCRIPTION' },
    { icon: 'ph ph-chart-line-up', title: 'FEATURES.ITEMS.ANALYTICS.TITLE', description: 'FEATURES.ITEMS.ANALYTICS.DESCRIPTION' },
    { icon: 'ph ph-shield-check', title: 'FEATURES.ITEMS.LEGAL.TITLE', description: 'FEATURES.ITEMS.LEGAL.DESCRIPTION' },
    { icon: 'ph ph-gear-six', title: 'FEATURES.ITEMS.ACCOUNTING.TITLE', description: 'FEATURES.ITEMS.ACCOUNTING.DESCRIPTION' }
  ];

}
