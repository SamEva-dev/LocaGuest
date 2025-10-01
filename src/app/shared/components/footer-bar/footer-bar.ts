import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Theme } from '../../../models/theme';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'footer-bar',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './footer-bar.html',
  styleUrl: './footer-bar.scss'
})
export class FooterBar {
   private translate = inject(TranslateService)
 isMobile = input<boolean>(false);
  menuInHeader = input<boolean>(false);
  opened = input<boolean>(false);
  theme = input<Theme>();
  currentYear = new Date().getFullYear();
  appName = 'Mon Application';
}
