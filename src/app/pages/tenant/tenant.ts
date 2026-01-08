import { Component, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './tenant.html'
})
export class Tenant {
  private route = inject(ActivatedRoute);
  activeTab = signal('info');

  tabs = [
    { id: 'info', label: 'TENANT.TABS.INFO' },
    { id: 'payments', label: 'TENANT.TABS.PAYMENTS' },
    { id: 'documents', label: 'TENANT.TABS.DOCUMENTS' }
  ];

  tenant = signal({
    id: this.route.snapshot.paramMap.get('id') || '1',
    name: 'Marie Dupont',
    email: 'marie.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    birthdate: '15/03/1990',
    occupation: 'Ingénieur',
    status: 'TENANT.ACTIVE',
    property: 'T3 - Centre Ville',
    rent: '€ 1,850',
    since: 'Jan 2023',
    payments: [
      { id: 'p1', date: 'Nov 2024', amount: '€ 1,850', status: 'paid', method: 'Virement' },
      { id: 'p2', date: 'Oct 2024', amount: '€ 1,850', status: 'paid', method: 'Virement' },
      { id: 'p3', date: 'Sep 2024', amount: '€ 1,850', status: 'paid', method: 'Virement' }
    ],
    documents: [
      { id: 'd1', name: 'Bail.pdf', size: '2.4 MB' },
      { id: 'd2', name: 'Pièce d\'identité.pdf', size: '850 KB' },
      { id: 'd3', name: 'Justificatif domicile.pdf', size: '1.2 MB' }
    ]
  });

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
