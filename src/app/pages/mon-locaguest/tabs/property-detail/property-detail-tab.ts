import { Component, input, signal, inject, effect, viewChild, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { RevenueChart } from '../../../../components/charts/revenue-chart/revenue-chart';
import { PropertyDetail, Contract, FinancialSummary, CreateContractDto } from '../../../../core/api/properties.api';
import { TenantListItem } from '../../../../core/api/tenants.api';
import { DocumentsApi, DocumentCategory, DocumentDto } from '../../../../core/api/documents.api';
import { PaymentsApi, Payment } from '../../../../core/api/payments.api';
import { PropertiesService } from '../../../../core/services/properties.service';
import { TenantSelectionModal, TenantSelectionResult } from '../../components/tenant-selection-modal/tenant-selection-modal';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { firstValueFrom } from 'rxjs';
import { PropertyInfoTab } from '../property-info/property-info-tab';
import { PropertyTenantsTab } from '../property-tenants/property-tenants-tab';
import { PropertyContractsTab } from '../property-contracts/property-contracts-tab';
import { PropertyPaymentsTab } from '../property-payments/property-payments-tab';
import { ImagesService } from '../../../../core/services/images.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Permissions } from '../../../../core/auth/permissions';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PaymentsRefreshService } from '../../../../core/services/payments-refresh.service';

@Component({
  selector: 'property-detail-tab',
  standalone: true,
  imports: [TranslatePipe, DatePipe, DecimalPipe, FormsModule, RevenueChart, TenantSelectionModal, PropertyInfoTab, PropertyTenantsTab, PropertyContractsTab, PropertyPaymentsTab],
  templateUrl: './property-detail-tab.html'
})
export class PropertyDetailTab {
  data = input<any>();
  private tabManager = inject(InternalTabManagerService);
  private propertiesService = inject(PropertiesService);
  private paymentsApi = inject(PaymentsApi);
  private documentsApi = inject(DocumentsApi);
  private auth = inject(AuthService);
  private imagesService = inject(ImagesService);
  private paymentsRefresh = inject(PaymentsRefreshService);
  
  // ✅ Services UI
  private toasts = inject(ToastService);
  private confirmService = inject(ConfirmService);
  
  tenantModal = viewChild<TenantSelectionModal>('tenantModal');
  contractsTab = viewChild<PropertyContractsTab>('contractsTab');
  infoTab = viewChild<PropertyInfoTab>('infoTab');

  private autoEditDone = signal(false);

  activeSubTab = signal('informations');
  isLoading = signal(false);
  
  property = signal<PropertyDetail | null>(null);
  payments = signal<Payment[]>([]);
  recentPayments = signal<Payment[]>([]);
  contracts = signal<Contract[]>([]);
  associatedTenants = signal<TenantListItem[]>([]);
  financialSummary = signal<FinancialSummary | null>(null);
  documentCategories = signal<DocumentCategory[]>([]);

  private coverBlobCache = signal<Map<string, string>>(new Map());

  coverImageUrl = computed(() => {
    const p = this.property();
    if (!p?.id) return null;

    const imageId = p.imageUrls?.[0];
    if (!imageId) return null;

    const cache = this.coverBlobCache();
    if (cache.has(imageId)) return cache.get(imageId)!;

    this.loadCoverBlob(imageId);
    return '/assets/images/hero-building.jpg';
  });

  private loadCoverBlob(imageId: string): void {
    this.imagesService.getImageBlob(imageId).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.coverBlobCache.update((current) => {
          const next = new Map(current);
          next.set(imageId, blobUrl);
          return next;
        });
      },
      error: () => {
        this.coverBlobCache.update((current) => {
          const next = new Map(current);
          next.set(imageId, '/assets/images/hero-building.jpg');
          return next;
        });
      }
    });
  }

  triggerPropertyAvatarUpload(): void {
    const p = this.property();
    if (!p?.id) return;

    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.accept = 'image/*';

    inputEl.onchange = (e: any) => {
      const file: File | undefined = e?.target?.files?.[0];
      if (!file) return;

      this.imagesService.uploadImages(p.id, [file], 'living_room').subscribe({
        next: (res) => {
          const imageId = res?.images?.[0]?.id;
          if (!imageId) {
            this.toasts.errorDirect('Erreur lors de l’upload de la photo');
            return;
          }

          // Persist: set as cover (first in ImageUrls)
          this.propertiesService.setCoverImage(p.id, imageId).subscribe({
            next: () => {
              this.loadCoverBlob(imageId);
              this.reloadProperty();
            },
            error: () => {
              this.toasts.errorDirect('Erreur lors de la mise à jour de la photo');
            }
          });
        },
        error: () => {
          this.toasts.errorDirect('Erreur lors de l’upload de la photo');
        }
      });
    };

    inputEl.click();
  }

  documentsCount = computed(() => {
    return (this.documentCategories() || []).reduce((sum, c) => sum + (c.documents?.length || 0), 0);
  });

  formattedAddress = computed(() => {
    const p = this.property();
    if (!p) return '';
    const parts = [p.address, p.postalCode, p.city, p.country].filter(v => typeof v === 'string' && v.trim().length > 0);
    return parts.join(', ');
  });

  computedOccupancyStatus = computed(() => {
    const p = this.property();
    if (!p) return { value: 'Unknown', label: '—', color: 'slate' as const };

    const activeContracts = this.contracts().filter(c => c.status === 'Active' || c.status === 'Signed');
    const usage = (p.propertyUsageType || '').toLowerCase();

    if (usage.includes('colocation')) {
      const total = p.totalRooms || 0;
      const occupied = p.occupiedRooms || 0;
      if (total > 0 && occupied === 0) return { value: 'Vacant', label: 'Vacant', color: 'slate' as const };
      if (total > 0 && occupied > 0 && occupied < total) return { value: 'PartiallyOccupied', label: 'Partiellement occupé', color: 'blue' as const };
      if (total > 0 && occupied >= total) return { value: 'Occupied', label: 'Occupé', color: 'emerald' as const };
    }

    if (usage === 'airbnb') {
      const nights = (p as any).nightsBookedPerMonth ?? p.nightsBookedPerMonth;
      if (typeof nights === 'number' && nights > 0) return { value: 'EstimatedOccupied', label: 'Occupation estimée', color: 'purple' as const };
      return { value: 'Unknown', label: 'Occupation à renseigner', color: 'slate' as const };
    }

    if (activeContracts.length > 0) return { value: 'Occupied', label: 'Occupé', color: 'emerald' as const };
    return { value: 'Vacant', label: 'Vacant', color: 'slate' as const };
  });

  completeness = computed(() => {
    const p = this.property();
    if (!p) return { percent: 0, missing: [] as string[] };

    const missing: string[] = [];
    if (!p.name || p.name.trim().length < 2) missing.push('Nom');
    if (!p.address || p.address.trim().length < 3) missing.push('Adresse');
    if (!p.city || p.city.trim().length < 2) missing.push('Ville');
    if (!p.postalCode || p.postalCode.trim().length < 4) missing.push('Code postal');
    if (!p.type) missing.push('Type');
    if (!p.propertyUsageType) missing.push('Usage');

    const hasRent = typeof p.rent === 'number' && p.rent > 0;
    if (!hasRent) missing.push('Loyer');

    const hasAtLeastOneDoc = (this.documentCategories() || []).some(c => (c.documents || []).length > 0);
    if (!hasAtLeastOneDoc) missing.push('Documents');

    const totalFields = 8;
    const done = totalFields - missing.length;
    const percent = Math.max(0, Math.min(100, Math.round((done / totalFields) * 100)));
    return { percent, missing };
  });

  alerts = computed(() => {
    const p = this.property();
    if (!p) return [] as Array<{ level: 'P0' | 'P1'; label: string }>;

    const items: Array<{ level: 'P0' | 'P1'; label: string }> = [];
    const docsCount = this.documentsCount();
    if (docsCount === 0) items.push({ level: 'P1', label: 'Aucun document' });

    const occupancy = this.computedOccupancyStatus();
    if ((p.status || '').toLowerCase() === 'vacant' && occupancy.value !== 'Vacant') {
      items.push({ level: 'P0', label: 'Incohérence: statut Vacant vs contrats/occupation' });
    }

    const expDates = [
      (p as any).electricDiagnosticExpiry,
      (p as any).gasDiagnosticExpiry
    ].filter(Boolean).map((d: any) => new Date(d));
    const now = new Date();
    const expired = expDates.some(d => !isNaN(d.getTime()) && d.getTime() < now.getTime());
    if (expired) items.push({ level: 'P0', label: 'Diagnostic expiré' });

    return items;
  });

  private currentMonthRange = computed(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from, to };
  });

  realMonthlyRevenue = computed(() => {
    const { from, to } = this.currentMonthRange();
    return (this.payments() || [])
      .filter(p => {
        const raw = (p as any).paymentDate as any;
        if (!raw) return false;
        const d = new Date(raw);
        const status = (p.status || '').toLowerCase();
        const isPaid = status === 'paid' || status === 'paidlate';
        return !isNaN(d.getTime()) && d >= from && d < to && isPaid;
      })
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  });

  expectedMonthlyRevenue = computed(() => {
    const fs = this.financialSummary();
    if (fs?.monthlyRent) return fs.monthlyRent;

    // fallback : somme des contrats actifs
    const active = (this.contracts() || []).filter(c => c.status === 'Active' || c.status === 'Signed');
    const expected = active.reduce((sum, c) => sum + (c.rent || 0) + (c.charges || 0), 0);
    if (expected > 0) return expected;

    return this.property()?.rent || 0;
  });

  arrearsTotal = computed(() => {
    const active = (this.contracts() || []).filter(c => c.status === 'Active' || c.status === 'Signed');
    return active.reduce((sum, c) => sum + (c.totalArrears || 0), 0);
  });

  nextDue = computed(() => {
    const active = (this.contracts() || []).filter(c => c.status === 'Active' || c.status === 'Signed');
    const withDue = active
      .filter(c => !!c.rentDueThisMonth && c.rentDueThisMonth > 0)
      .map(c => ({ amount: c.rentDueThisMonth || 0, date: c.lastPaymentDate ? new Date(c.lastPaymentDate) : null }));

    // On ne dispose pas d'une vraie "due date" dans le modèle actuel.
    // À défaut, on affiche simplement le montant dû ce mois-ci.
    const amount = withDue.reduce((sum, x) => sum + x.amount, 0);
    return { amount };
  });

  overviewAlerts = computed(() => {
    const p = this.property();
    if (!p) return [] as Array<{ level: 'P0' | 'P1'; title: string; action?: 'contracts' | 'documents' | 'payments' | 'tenants' }>;

    const items: Array<{ level: 'P0' | 'P1'; title: string; action?: 'contracts' | 'documents' | 'payments' | 'tenants' }> = [];

    if (this.documentsCount() === 0) {
      items.push({ level: 'P1', title: 'Aucun document sur le bien', action: 'documents' });
    }

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expDates = [
      (p as any).electricDiagnosticExpiry,
      (p as any).gasDiagnosticExpiry,
      (p as any).asbestosDiagnosticDate
    ].filter(Boolean).map((d: any) => new Date(d));

    const expired = expDates.some(d => !isNaN(d.getTime()) && d.getTime() < now.getTime());
    const expiring = expDates.some(d => !isNaN(d.getTime()) && d.getTime() >= now.getTime() && d.getTime() <= in30.getTime());
    if (expired) items.push({ level: 'P0', title: 'Diagnostic expiré', action: 'documents' });
    else if (expiring) items.push({ level: 'P1', title: 'Diagnostic bientôt expiré', action: 'documents' });

    const activeContracts = (this.contracts() || []).filter(c => c.status === 'Active' || c.status === 'Signed');
    if (activeContracts.length === 0) {
      items.push({ level: 'P1', title: 'Aucun contrat actif', action: 'contracts' });
    }

    const expiringContracts = activeContracts.filter(c => {
      const end = new Date(c.endDate);
      return !isNaN(end.getTime()) && end.getTime() >= now.getTime() && end.getTime() <= in30.getTime();
    });
    if (expiringContracts.length > 0) items.push({ level: 'P0', title: 'Contrat arrive à échéance (< 30j)', action: 'contracts' });

    if (this.arrearsTotal() > 0) items.push({ level: 'P0', title: 'Impayés détectés', action: 'payments' });

    const occ = this.computedOccupancyStatus();
    if ((p.status || '').toLowerCase() === 'vacant' && occ.value !== 'Vacant') {
      items.push({ level: 'P0', title: 'Incohérence: statut Vacant vs occupation', action: 'contracts' });
    }

    return items;
  });
  
  showTenantModal = signal(false);
  availableTenants = signal<any[]>([]);
  
  showDissociationModal = signal(false);
  dissociationForm = signal<{
    tenantId: string;
    tenantName: string;
    reason: string;
    customReason: string;
  } | null>(null);
  
  dissociationReasons = [
    'Fin de bail',
    'Résiliation anticipée',
    'Non-paiement',
    'Vente du bien',
    'Travaux',
    'Autre (préciser)'
  ];

  subTabs = [
    { id: 'overview', label: 'PROPERTY.SUB_TABS.OVERVIEW', icon: 'ph-sparkle' },
    { id: 'informations', label: 'PROPERTY.SUB_TABS.INFORMATIONS', icon: 'ph-info' },
    // Note: tab id kept as 'tenants' for backward compatibility (routing/tab manager)
    { id: 'tenants', label: 'PROPERTY.SUB_TABS.OCCUPANTS', icon: 'ph-users-three' },
    { id: 'contracts', label: 'PROPERTY.SUB_TABS.CONTRACTS', icon: 'ph-file-text' },
    { id: 'payments', label: 'PROPERTY.SUB_TABS.PAYMENTS', icon: 'ph-currency-eur' },
    { id: 'documents', label: 'PROPERTY.SUB_TABS.DOCUMENTS', icon: 'ph-folder' },
    { id: 'projection', label: 'PROPERTY.SUB_TABS.PROJECTION', icon: 'ph-chart-line-up' },
  ];

  get visibleSubTabs() {
    return this.subTabs.filter(t => this.canAccessSubTab(t.id));
  }

  openContracts() {
    this.selectSubTab('contracts');
  }

  openOccupancy() {
    this.selectSubTab('tenants');
  }

  openDocuments() {
    this.selectSubTab('documents');
  }

  openPayments() {
    this.selectSubTab('payments');
  }

  printSheet() {
    const p = this.property();
    if (!p?.id) {
      this.toasts.errorDirect('Impossible de générer la fiche');
      return;
    }

    void (async () => {
      try {
        const blob = await firstValueFrom(this.documentsApi.downloadPropertySheet(p.id));
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Fiche_Bien_${p.code || p.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('❌ Error printing property sheet:', err);
        this.toasts.errorDirect('Erreur lors de la génération de la fiche');
      }
    })();
  }

  projection = computed(() => {
    const p = this.property();
    if (!p) {
      return {
        grossMonthly: 0,
        grossAnnual: 0,
        estimatedNetAnnual: 0,
        netYieldPercent: 0,
        monthlyChargesTotal: 0,
        annualFixedChargesTotal: 0
      };
    }

    const grossMonthly = (p.rent || 0) + (p.charges || 0);
    const grossAnnual = grossMonthly * 12;

    // Optional rates
    const vacancyRate = (p.vacancyRate ?? 0) / 100;
    const managementFeesRate = (p.managementFeesRate ?? 0) / 100;
    const maintenanceRate = (p.maintenanceRate ?? 0) / 100;

    const estimatedVacancyLoss = grossAnnual * vacancyRate;
    const estimatedManagementFees = grossAnnual * managementFeesRate;
    const estimatedMaintenance = grossAnnual * maintenanceRate;

    const annualFixedChargesTotal =
      (p.propertyTax ?? 0) +
      (p.condominiumCharges ?? 0) +
      (p.insurance ?? 0);

    const estimatedNetAnnual =
      grossAnnual -
      estimatedVacancyLoss -
      estimatedManagementFees -
      estimatedMaintenance -
      annualFixedChargesTotal;

    const purchase = p.purchasePrice ?? 0;
    const netYieldPercent = purchase > 0 ? Math.max(0, (estimatedNetAnnual / purchase) * 100) : 0;

    const monthlyChargesTotal = (annualFixedChargesTotal + estimatedMaintenance + estimatedManagementFees) / 12;

    return {
      grossMonthly,
      grossAnnual,
      estimatedNetAnnual,
      netYieldPercent,
      monthlyChargesTotal,
      annualFixedChargesTotal
    };
  });

  constructor() {
    this.paymentsRefresh.refresh$.subscribe(() => {
      const propertyId = this.data()?.propertyId;
      if (!propertyId) return;

      this.paymentsApi.getPaymentsByProperty(propertyId).subscribe({
        next: (payments) => {
          const sortedPayments = (payments || []).slice().sort((a, b) => {
            const da = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
            const db = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
            return db - da;
          });
          this.payments.set(sortedPayments);
          this.recentPayments.set(sortedPayments.slice(0, 3));
        },
        error: (err) => console.error('❌ Error loading payments:', err)
      });
    });

    effect(() => {
      if (!this.canAccessSubTab(this.activeSubTab())) {
        this.activeSubTab.set('informations');
      }
    });

    effect(() => {
      const tabData = this.data();
      if (tabData?.propertyId) {
        this.autoEditDone.set(false);
        this.loadProperty(tabData.propertyId);
      }
    });

    effect(() => {
      const tabData = this.data();
      const prop = this.property();
      const info = this.infoTab();

      if (!tabData?.edit) return;
      if (!prop) return;
      if (!info) return;
      if (this.autoEditDone()) return;

      this.activeSubTab.set('informations');

      setTimeout(() => {
        this.infoTab()?.startEditing();
        this.autoEditDone.set(true);
      }, 0);
    });
    
    // ✅ Charger les EDL quand la tab "contracts" est activée
    effect(() => {
      const currentTab = this.activeSubTab();
      const contractsTabRef = this.contractsTab();
      
      if (currentTab === 'contracts' && contractsTabRef) {
        contractsTabRef.initializeInventories();
      }
    });
  }

  private canAccessSubTab(tabId: string): boolean {
    switch (tabId) {
      case 'overview':
        return this.auth.hasPermission(Permissions.PropertiesRead);
      case 'informations':
        return this.auth.hasPermission(Permissions.PropertiesRead);
      case 'tenants':
        return this.auth.hasPermission(Permissions.TenantsRead);
      case 'contracts':
        return this.auth.hasPermission(Permissions.ContractsRead);
      case 'documents':
        return this.auth.hasPermission(Permissions.DocumentsRead);
      case 'payments':
      case 'projection':
        return this.auth.hasPermission(Permissions.AnalyticsRead);
      default:
        return true;
    }
  }

  selectSubTab(tabId: string) {
    if (!this.canAccessSubTab(tabId)) {
      this.toasts.errorDirect('Accès refusé');
      return;
    }
    this.activeSubTab.set(tabId);
  }

  canUploadDocuments(): boolean {
    return this.auth.hasPermission(Permissions.DocumentsUpload);
  }

  canDeleteDocuments(): boolean {
    return this.auth.hasPermission(Permissions.DocumentsDelete);
  }

  reloadProperty() {
    const tabData = this.data();
    if (tabData?.propertyId) {
      this.loadProperty(tabData.propertyId);
    }
  }

  private loadProperty(id: string) {
    this.isLoading.set(true);
    
    // Load property details
    this.propertiesService.getProperty(id).subscribe({
      next: (property) => {
        this.property.set(property);
        this.isLoading.set(false);

        forkJoin({
          payments: this.paymentsApi.getPaymentsByProperty(id).pipe(
            catchError((err) => {
              console.error('❌ Error loading payments:', err);
              return of([] as Payment[]);
            })
          ),
          contracts: this.propertiesService.getPropertyContracts(id).pipe(
            catchError((err) => {
              console.error('❌ Error loading contracts:', err);
              return of([] as Contract[]);
            })
          ),
          tenants: this.propertiesService.getAssociatedTenants(id).pipe(
            catchError((err) => {
              console.error('❌ Error loading associated tenants:', err);
              return of([] as TenantListItem[]);
            })
          ),
          summary: this.propertiesService.getFinancialSummary(id).pipe(
            catchError((err) => {
              console.error('❌ Error loading financial summary:', err);
              return of(null as FinancialSummary | null);
            })
          ),
          documents: this.documentsApi.getPropertyDocuments(id).pipe(
            catchError((err) => {
              console.error('❌ Error loading documents:', err);
              return of([] as DocumentCategory[]);
            })
          )
        }).subscribe(({ payments, contracts, tenants, summary, documents }) => {
          const sortedPayments = (payments || []).slice().sort((a, b) => {
            const da = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
            const db = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
            return db - da;
          });

          this.payments.set(sortedPayments);
          this.recentPayments.set(sortedPayments.slice(0, 3));
          this.contracts.set(contracts);
          this.associatedTenants.set(tenants);
          this.financialSummary.set(summary);
          this.documentCategories.set(documents);
        });
      },
      error: (err) => {
        console.error('❌ Error loading property:', err);
        this.isLoading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  addTenant() {
    const propertyId = this.data()?.propertyId;
    if (!propertyId) {
      console.error('⚠️ No propertyId available');
      return;
    }
    this.propertiesService.getAvailableTenants(propertyId).subscribe({
      next: (tenants: any) => {
        this.availableTenants.set(tenants);
        this.showTenantModal.set(true);
        
        // Passer les locataires au modal après rendu
        setTimeout(() => {
          const modal = this.tenantModal();
          if (modal) {
            modal.setTenants(tenants);
          }
        }, 0);
      },
      error: (err: any) => {
        console.error('❌ Error loading available tenants:', err);
        this.toasts.errorDirect('Erreur lors du chargement des locataires disponibles');
      }
    });
  }

  closeTenantModal() {
    this.showTenantModal.set(false);
  }

  onTenantAssigned(result: TenantSelectionResult) {
    const propertyId = this.data()?.propertyId;
    if (!propertyId) return;

    const contractDto: CreateContractDto = {
      propertyId,
      tenantId: result.tenantId,
      type: result.type,
      startDate: result.startDate.toISOString(),  // Convertir en ISO string
      endDate: result.endDate.toISOString(),      // Convertir en ISO string
      rent: result.rent,
      deposit: result.deposit
    };
    this.propertiesService.assignTenant(propertyId, contractDto).subscribe({
      next: (contract: any) => {
        this.showTenantModal.set(false);
        // Recharger les contrats
        this.loadProperty(propertyId);
        this.toasts.successDirect(`Locataire ${result.tenantName} associé avec succès !`);
      },
      error: (err: any) => {
        console.error('❌ Error assigning tenant:', err);
        const errorMsg = err?.error?.message || err?.message || 'Erreur inconnue';
        this.toasts.errorDirect(`Erreur lors de l'association du locataire: ${errorMsg}`);
      }
    });
  }

  openTenantTab(tenant: TenantListItem) {
    if (!tenant.id) return;
    this.tabManager.openTenant(tenant.id, tenant.fullName || 'Tenant');
  }

  dissociateTenant(tenant: TenantListItem) {
    const tenantName = tenant.fullName || 'ce locataire';
    const propertyId = this.data()?.propertyId;
    
    if (!propertyId || !tenant.id) {
      console.error('⚠️ Missing propertyId or tenantId');
      return;
    }

    // Ouvrir le modal de dissociation
    this.dissociationForm.set({
      tenantId: tenant.id,
      tenantName: tenantName,
      reason: '',
      customReason: ''
    });
    this.showDissociationModal.set(true);
  }

  closeDissociationModal() {
    this.showDissociationModal.set(false);
    this.dissociationForm.set(null);
  }

  confirmDissociation() {
    const propertyId = this.data()?.propertyId;
    const form = this.dissociationForm();
    if (!propertyId || !form?.tenantId) return;

    const reason = (form.reason || '').trim();
    if (!reason) {
      this.toasts.errorDirect('Veuillez sélectionner un motif de dissociation');
      return;
    }

    const customReason = (form.customReason || '').trim();
    if (reason === 'Autre (préciser)' && !customReason) {
      this.toasts.errorDirect('Veuillez préciser le motif de la dissociation');
      return;
    }

    const finalReason = reason === 'Autre (préciser)' ? customReason : reason;
    void finalReason;

    this.propertiesService.dissociateTenant(propertyId, form.tenantId).subscribe({
      next: () => {
        this.closeDissociationModal();
        this.loadProperty(propertyId);
        this.toasts.successDirect('Association retirée avec succès');
      },
      error: (err: any) => {
        console.error('❌ Error dissociating tenant:', err);
        this.toasts.errorDirect('Erreur lors de la dissociation du locataire');
      }
    });
  }

  getUsageTypeIcon(usageType?: string): string {
    switch(usageType) {
      case 'Complete': return 'ph-house';
      case 'Colocation': return 'ph-users-three';
      case 'Airbnb': return 'ph-airplane-in-flight';
      default: return 'ph-house';
    }
  }

  getUsageTypeLabel(usageType?: string): string {
    switch(usageType) {
      case 'Complete': return 'Location complète';
      case 'Colocation': return 'Colocation';
      case 'Airbnb': return 'Airbnb';
      default: return 'Non défini';
    }
  }

  getUsageTypeColor(usageType?: string): string {
    switch(usageType) {
      case 'Complete': return 'emerald';
      case 'Colocation': return 'blue';
      case 'Airbnb': return 'purple';
      default: return 'slate';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Vacant': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'Occupied': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'PartiallyOccupied': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'Vacant': return 'Vacant';
      case 'Occupied': return 'Occupé';
      case 'PartiallyOccupied': return 'Partiellement occupé';
      default: return status;
    }
  }

  downloadDocument(doc: DocumentDto) {
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('❌ Error downloading document:', err);
        this.toasts.errorDirect('Erreur lors du téléchargement du document');
      }
    });
  }

  viewDocument(doc: DocumentDto) {
    this.documentsApi.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err: any) => {
        console.error('❌ Error viewing document:', err);
        this.toasts.errorDirect('Erreur lors de l\'ouverture du document');
      }
    });
  }

  async deleteDocument(doc: DocumentDto) {
    if (!this.canDeleteDocuments()) {
      this.toasts.errorDirect('Accès refusé');
      return;
    }
    const propertyId = this.data()?.propertyId;
    if (!propertyId) return;

    const confirmed = await this.confirmService.warning(
      'Dissocier le document',
      `Êtes-vous sûr de vouloir dissocier le document "${doc.fileName}" ?`
    );
    if (!confirmed) return;
    this.documentsApi.dissociateDocument(doc.id).subscribe({
      next: () => {
        this.toasts.successDirect('Document dissocié avec succès');
        // Recharger les documents
        this.documentsApi.getPropertyDocuments(propertyId).subscribe({
          next: (categories) => {
            this.documentCategories.set(categories);
          },
          error: (err) => console.error('❌ Error reloading documents:', err)
        });
      },
      error: (err: any) => {
        console.error('❌ Error dissociating document:', err);
        this.toasts.errorDirect('Erreur lors de la dissociation du document');
      }
    });
  }

  getDocumentIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return 'ph-file-pdf';
      case 'doc':
      case 'docx': return 'ph-file-doc';
      case 'xls':
      case 'xlsx': return 'ph-file-xls';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'ph-file-image';
      case 'zip':
      case 'rar': return 'ph-file-zip';
      default: return 'ph-file';
    }
  }

  getDocumentIconColor(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return 'text-rose-500';
      case 'doc':
      case 'docx': return 'text-blue-500';
      case 'xls':
      case 'xlsx': return 'text-emerald-500';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'text-purple-500';
      case 'zip':
      case 'rar': return 'text-amber-500';
      default: return 'text-slate-500';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getCategoryIcon(category: string): string {
    switch(category) {
      case 'Contrats': return 'ph-file-text';
      case 'EtatsLieux': return 'ph-clipboard-text';
      case 'Factures': return 'ph-receipt';
      case 'Quittances': return 'ph-currency-eur';
      case 'Diagnostics': return 'ph-first-aid-kit';
      case 'Photos': return 'ph-images';
      case 'Autres': return 'ph-folder';
      default: return 'ph-file';
    }
  }

  getCategoryLabel(category: string): string {
    switch(category) {
      case 'Contrats': return 'Contrats';
      case 'EtatsLieux': return 'États des lieux';
      case 'Factures': return 'Factures';
      case 'Quittances': return 'Quittances';
      case 'Diagnostics': return 'Diagnostics';
      case 'Photos': return 'Photos';
      case 'Autres': return 'Autres';
      default: return category;
    }
  }
}
