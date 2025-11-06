import { Component, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="p-6 md:p-8 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
            {{ getInitials(tenant().name) }}
          </div>
          <div>
            <h1 class="text-2xl font-bold">{{ tenant().name }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ tenant().email }}</p>
          </div>
        </div>
        <button class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <i class="ph ph-pencil-simple mr-2"></i>{{ 'TENANT.EDIT' | translate }}
        </button>
      </div>

      <!-- Stats -->
      <div class="grid sm:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ 'TENANT.STATUS' | translate }}</p>
          <p class="text-lg font-semibold mt-1 text-emerald-600">{{ tenant().status | translate }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ 'TENANT.PROPERTY' | translate }}</p>
          <p class="text-lg font-semibold mt-1">{{ tenant().property }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ 'TENANT.RENT' | translate }}</p>
          <p class="text-lg font-semibold mt-1">{{ tenant().rent }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ 'TENANT.SINCE' | translate }}</p>
          <p class="text-lg font-semibold mt-1">{{ tenant().since }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <div class="flex border-b border-slate-200 dark:border-slate-700 mb-6">
          @for (t of tabs; track t.id) {
            <button
              (click)="activeTab.set(t.id)"
              [class.border-b-2]="activeTab() === t.id"
              [class.border-amber-500]="activeTab() === t.id"
              [class.text-amber-600]="activeTab() === t.id"
              class="px-4 py-2 text-sm font-medium transition"
            >
              {{ t.label | translate }}
            </button>
          }
        </div>

        @if (activeTab() === 'info') {
          <div class="space-y-4">
            <div><span class="font-medium">{{ 'TENANT.PHONE' | translate }}:</span> {{ tenant().phone }}</div>
            <div><span class="font-medium">{{ 'TENANT.BIRTHDATE' | translate }}:</span> {{ tenant().birthdate }}</div>
            <div><span class="font-medium">{{ 'TENANT.OCCUPATION' | translate }}:</span> {{ tenant().occupation }}</div>
          </div>
        }

        @if (activeTab() === 'payments') {
          <div class="space-y-3">
            @for (payment of tenant().payments; track payment.id) {
              <div class="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-700">
                <div>
                  <p class="font-medium">{{ payment.date }}</p>
                  <p class="text-sm text-slate-500">{{ payment.method }}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ payment.amount }}</p>
                  <span 
                    class="text-xs px-2 py-1 rounded-full"
                    [class]="payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'"
                  >
                    {{ ('TENANT.PAYMENT_' + payment.status.toUpperCase()) | translate }}
                  </span>
                </div>
              </div>
            }
          </div>
        }

        @if (activeTab() === 'documents') {
          <div class="grid sm:grid-cols-2 gap-3">
            @for (doc of tenant().documents; track doc.id) {
              <div class="flex items-center gap-3 p-3 rounded border border-slate-200 dark:border-slate-700">
                <i class="ph ph-file-pdf text-2xl text-rose-500"></i>
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ doc.name }}</p>
                  <p class="text-xs text-slate-500">{{ doc.size }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
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
