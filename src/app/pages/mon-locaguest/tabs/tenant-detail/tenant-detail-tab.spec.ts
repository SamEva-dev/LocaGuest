import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { TenantDetailTab } from './tenant-detail-tab';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { TenantsService } from '../../../../core/services/tenants.service';
import { PropertiesService } from '../../../../core/services/properties.service';
import { InventoriesApiService } from '../../../../core/api/inventories.api';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { ContractsApi } from '../../../../core/api/contracts.api';
import { DocumentsApi } from '../../../../core/api/documents.api';
import { AddendumsApi } from '../../../../core/api/addendums.api';
import { InvoicesApi } from '../../../../core/api/invoices.api';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { DepositsApi } from '../../../../core/api/deposits.api';
import { Permissions } from '../../../../core/auth/permissions';

describe('TenantDetailTab', () => {
  let component: TenantDetailTab;
  let fixture: ComponentFixture<TenantDetailTab>;

  let tabManager: jasmine.SpyObj<InternalTabManagerService>;
  let tenantsService: jasmine.SpyObj<TenantsService>;
  let propertiesService: jasmine.SpyObj<PropertiesService>;
  let inventoriesApi: jasmine.SpyObj<InventoriesApiService>;
  let toasts: jasmine.SpyObj<ToastService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;
  let contractsApi: jasmine.SpyObj<ContractsApi>;
  let documentsApi: jasmine.SpyObj<DocumentsApi>;
  let addendumsApi: jasmine.SpyObj<AddendumsApi>;
  let invoicesApi: jasmine.SpyObj<InvoicesApi>;
  let auth: jasmine.SpyObj<AuthService>;
  let depositsApi: jasmine.SpyObj<DepositsApi>;

  beforeEach(async () => {
    tabManager = jasmine.createSpyObj<InternalTabManagerService>('InternalTabManagerService', [
      'openProperty',
      'openTenant',
      'openRelation',
      'setActiveTab',
      'closeTab',
    ]);

    tenantsService = jasmine.createSpyObj<TenantsService>('TenantsService', [
      'getTenant',
      'getTenantPayments',
      'getTenantContracts',
      'getPaymentStats',
    ]);

    propertiesService = jasmine.createSpyObj<PropertiesService>('PropertiesService', ['getProperty']);
    inventoriesApi = jasmine.createSpyObj<InventoriesApiService>('InventoriesApiService', []);
    toasts = jasmine.createSpyObj<ToastService>('ToastService', [
      'errorDirect',
      'successDirect',
      'warningDirect',
    ]);
    confirmService = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['ask', 'warning', 'danger']);
    contractsApi = jasmine.createSpyObj<ContractsApi>('ContractsApi', ['cancelNotice']);
    documentsApi = jasmine.createSpyObj<DocumentsApi>('DocumentsApi', [
      'downloadTenantSheet',
      'downloadDocument',
    ]);
    addendumsApi = jasmine.createSpyObj<AddendumsApi>('AddendumsApi', ['getAddendums']);
    invoicesApi = jasmine.createSpyObj<InvoicesApi>('InvoicesApi', ['getInvoicesByTenant', 'getInvoicePdf']);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission']);
    depositsApi = jasmine.createSpyObj<DepositsApi>('DepositsApi', ['getByContract', 'getReceiptPdfByContract']);

    auth.hasPermission.and.returnValue(true);

    tenantsService.getTenant.and.returnValue(of({ id: 't1', fullName: 'Tenant 1', status: 'Active' } as any));
    tenantsService.getTenantPayments.and.returnValue(of([] as any));
    tenantsService.getTenantContracts.and.returnValue(of([] as any));
    tenantsService.getPaymentStats.and.returnValue(of(null as any));

    invoicesApi.getInvoicesByTenant.and.returnValue(of([] as any));

    addendumsApi.getAddendums.and.returnValue(of({ data: [] } as any));

    documentsApi.downloadTenantSheet.and.returnValue(of(new Blob(['x'], { type: 'application/pdf' })) as any);
    documentsApi.downloadDocument.and.returnValue(of(new Blob(['x'], { type: 'application/pdf' })) as any);

    depositsApi.getByContract.and.returnValue(of(null as any));
    depositsApi.getReceiptPdfByContract.and.returnValue(of(new Blob(['x'], { type: 'application/pdf' })) as any);

    propertiesService.getProperty.and.returnValue(of({ id: 'p1', name: 'P1', rooms: [] } as any));

    await TestBed.configureTestingModule({
      imports: [TenantDetailTab],
      providers: [
        { provide: InternalTabManagerService, useValue: tabManager },
        { provide: TenantsService, useValue: tenantsService },
        { provide: PropertiesService, useValue: propertiesService },
        { provide: InventoriesApiService, useValue: inventoriesApi },
        { provide: ToastService, useValue: toasts },
        { provide: ConfirmService, useValue: confirmService },
        { provide: ContractsApi, useValue: contractsApi },
        { provide: DocumentsApi, useValue: documentsApi },
        { provide: AddendumsApi, useValue: addendumsApi },
        { provide: InvoicesApi, useValue: invoicesApi },
        { provide: AuthService, useValue: auth },
        { provide: DepositsApi, useValue: depositsApi },
      ],
    })
      .overrideTemplate(TenantDetailTab, '')
      .compileComponents();

    fixture = TestBed.createComponent(TenantDetailTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads tenant data when input data contains tenantId', fakeAsync(() => {
    tenantsService.getTenant.calls.reset();
    tenantsService.getTenantPayments.calls.reset();
    tenantsService.getTenantContracts.calls.reset();
    tenantsService.getPaymentStats.calls.reset();
    invoicesApi.getInvoicesByTenant.calls.reset();

    fixture.componentRef.setInput('data', { tenantId: 't1' });
    tick();

    expect(tenantsService.getTenant).toHaveBeenCalledWith('t1');
    expect(tenantsService.getTenantPayments).toHaveBeenCalledWith('t1');
    expect(invoicesApi.getInvoicesByTenant).toHaveBeenCalledWith('t1');
    expect(tenantsService.getTenantContracts).toHaveBeenCalledWith('t1');
    expect(tenantsService.getPaymentStats).toHaveBeenCalledWith('t1');
  }));

  it('selectSubTab does not change when permission missing', () => {
    component.activeSubTab.set('contracts');

    auth.hasPermission.and.callFake((p: string) => p !== Permissions.AnalyticsRead);

    component.selectSubTab('payments');

    expect(component.activeSubTab()).toBe('contracts');
  });

  it('selectSubTab changes when permission is present', () => {
    auth.hasPermission.and.returnValue(true);

    component.selectSubTab('documents');

    expect(component.activeSubTab()).toBe('documents');
  });
});
