import { Component, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertiesService } from '../../core/services/properties.service';

@Component({
  selector: 'app-property',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './property.html'
})
export class Property {
  private route = inject(ActivatedRoute);
  private propertiesService = inject(PropertiesService);
  activeTab = signal('details');

  tabs = [
    { id: 'details', label: 'PROPERTY.TABS.DETAILS' },
    { id: 'tenants', label: 'PROPERTY.TABS.TENANTS' },
    { id: 'documents', label: 'PROPERTY.TABS.DOCUMENTS' }
  ];

  property = signal({
    id: this.route.snapshot.paramMap.get('id') || '1',
    name: '—',
    address: '—',
    status: 'PROPERTY.STATUS_OCCUPIED',
    rent: '€ 0',
    surface: 0,
    type: '—',
    rooms: 0,
    floor: 0,
    year: new Date().getFullYear(),
    tenants: [] as Array<{ id: string; name: string; email: string; status: string }>,
    documents: [] as Array<{ id: string; name: string; size: string }>
  });

  ngOnInit() {
    const id = this.property().id;
    this.propertiesService.getProperty(id).subscribe(detail => {
      this.property.update(p => ({
        ...p,
        name: detail.name,
        address: `${detail.address}, ${detail.city}`,
        status: detail.status === 'Occupied' ? 'PROPERTY.STATUS_OCCUPIED' : 'PROPERTY.STATUS_VACANT',
        rent: `€ ${detail.rent?.toLocaleString?.() ?? 0}`,
        surface: detail.surface ?? 0,
        type: detail.type,
        rooms: detail.bedrooms,
        floor: detail.floor ?? 0,
        year: new Date().getFullYear(),
        tenants: [],
        documents: (detail.imageUrls || []).map((u, i) => ({ id: `doc${i}`, name: u, size: '—' }))
      }));
    });
  }
}
