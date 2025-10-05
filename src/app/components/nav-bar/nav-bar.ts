import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from '../../models/menu';
import { Theme } from '../../models/theme';
import { LanguageSwitch } from '../language-switch/language-switch';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'nav-bar',
  imports: [CommonModule, RouterModule, LanguageSwitch],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBar {
   private translate = inject(TranslateService)
isMobile = input<boolean>(false);
  opened = input<boolean>(false);
  menuInHeader = input<boolean>(false);
  mobileHeaderMenu = input<boolean>(false);
  Menus = input<MenuItem[]>([]);
  theme = input<Theme>();
  themes = input<Theme[]>([]);

  onToggleMenuInHeader = output<void>();
  onOpenMobileSidebar = output<void>();
  onOpenMobileHeader = output<void>();
  onCloseMobileHeader = output<void>();
  onToggleSubmenu = output<MenuItem>();
  themeChange = output<Theme>();
}
