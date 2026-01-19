import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../core/services/internal-tab-manager.service';
import { SummaryTab } from './tabs/summary/summary-tab';
import { PropertyDetailTab } from './tabs/property-detail/property-detail-tab';
import { TenantDetailTab } from './tabs/tenant-detail/tenant-detail-tab';
import { RelationTab } from './tabs/relation/relation-tab';
import { MonLocaGuestTourService } from './mon-locaguest-tour.service';

@Component({
  selector: 'mon-locaguest',
  standalone: true,
  imports: [TranslatePipe, SummaryTab, PropertyDetailTab, TenantDetailTab, RelationTab],
  templateUrl: './mon-locaguest.html',
  styles: [`
    .scrollbar-thin {
      scrollbar-width: thin;
      scrollbar-color: rgb(203 213 225) transparent;
      
      &::-webkit-scrollbar {
        height: 4px;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      
      &::-webkit-scrollbar-thumb {
        background-color: rgb(203 213 225);
        border-radius: 2px;
      }
    }
  `]
})
export class MonLocaGuest {
  tabManager = inject(InternalTabManagerService);
  private tour = inject(MonLocaGuestTourService);

  startTour() {
    const type = this.tabManager.activeTab()?.type;
    if (type === 'property' || type === 'tenant') {
      this.tour.start(type);
      return;
    }
    this.tour.start('summary');
  }

  selectTab(tabId: string) {
    this.tabManager.setActiveTab(tabId);
  }

  closeTab(tabId: string, event: Event) {
    event.stopPropagation();
    this.tabManager.closeTab(tabId);
  }
}
