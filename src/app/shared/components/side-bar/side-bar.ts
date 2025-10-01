import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MenuItem } from '../../../models/menu';
import { Theme } from '../../../models/theme';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'side-bar',
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBar {
logout() {
throw new Error('Method not implemented.');
}
   private translate = inject(TranslateService)
  opened = input<boolean>(false);
  menuInHeader = input<boolean>(false);
  mobileSidebar = input<boolean>(false);
  Menus = input<MenuItem[]>([]);
  theme = input<Theme>();

  onToggleSidebar = output<void>();
  onToggleSubmenu = output<MenuItem>();
  onCloseMobileSidebar = output<void>();

}
