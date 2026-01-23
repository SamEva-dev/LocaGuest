import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { PropertyDetailTab } from './property-detail-tab';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { PropertiesService } from '../../../../core/services/properties.service';
import { DocumentsApi } from '../../../../core/api/documents.api';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ToastService } from '../../../../core/ui/toast.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { Permissions } from '../../../../core/auth/permissions';

describe('PropertyDetailTab', () => {
  let component: PropertyDetailTab;
  let fixture: ComponentFixture<PropertyDetailTab>;

  let tabManager: jasmine.SpyObj<InternalTabManagerService>;
  let propertiesService: jasmine.SpyObj<PropertiesService>;
  let documentsApi: jasmine.SpyObj<DocumentsApi>;
  let auth: jasmine.SpyObj<AuthService>;
  let toasts: jasmine.SpyObj<ToastService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    tabManager = jasmine.createSpyObj<InternalTabManagerService>('InternalTabManagerService', [
      'openTenant',
      'openProperty',
      'openRelation',
      'setActiveTab',
      'closeTab',
    ]);

    propertiesService = jasmine.createSpyObj<PropertiesService>('PropertiesService', [
      'getProperty',
      'getPropertyPayments',
      'getPropertyContracts',
      'getAssociatedTenants',
      'getFinancialSummary',
      'getAvailableTenants',
      'assignTenant',
      'dissociateTenant',
    ]);

    documentsApi = jasmine.createSpyObj<DocumentsApi>('DocumentsApi', [
      'getPropertyDocuments',
      'downloadDocument',
      'dissociateDocument',
    ]);

    auth = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission']);
    toasts = jasmine.createSpyObj<ToastService>('ToastService', ['errorDirect', 'successDirect']);
    confirmService = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['warning']);

    // defaults
    auth.hasPermission.and.returnValue(true);
    propertiesService.getProperty.and.returnValue(of({ id: 'p1', name: 'P1', rooms: [] } as any));
    propertiesService.getPropertyPayments.and.returnValue(of([] as any));
    propertiesService.getPropertyContracts.and.returnValue(of([] as any));
    propertiesService.getAssociatedTenants.and.returnValue(of([] as any));
    propertiesService.getFinancialSummary.and.returnValue(of(null as any));
    documentsApi.getPropertyDocuments.and.returnValue(of([] as any));

    await TestBed.configureTestingModule({
      imports: [PropertyDetailTab],
      providers: [
        { provide: InternalTabManagerService, useValue: tabManager },
        { provide: PropertiesService, useValue: propertiesService },
        { provide: DocumentsApi, useValue: documentsApi },
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toasts },
        { provide: ConfirmService, useValue: confirmService },
      ],
    })
      .overrideTemplate(PropertyDetailTab, '')
      .compileComponents();

    fixture = TestBed.createComponent(PropertyDetailTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads property data when input data contains propertyId', fakeAsync(() => {
    propertiesService.getProperty.calls.reset();
    propertiesService.getPropertyPayments.calls.reset();
    propertiesService.getPropertyContracts.calls.reset();
    propertiesService.getAssociatedTenants.calls.reset();
    propertiesService.getFinancialSummary.calls.reset();
    documentsApi.getPropertyDocuments.calls.reset();

    fixture.componentRef.setInput('data', { propertyId: 'p1' });
    fixture.detectChanges();
    tick();

    expect(propertiesService.getProperty).toHaveBeenCalledWith('p1');
    expect(propertiesService.getPropertyPayments).toHaveBeenCalledWith('p1');
    expect(propertiesService.getPropertyContracts).toHaveBeenCalledWith('p1');
    expect(propertiesService.getAssociatedTenants).toHaveBeenCalledWith('p1');
    expect(propertiesService.getFinancialSummary).toHaveBeenCalledWith('p1');
    expect(documentsApi.getPropertyDocuments).toHaveBeenCalledWith('p1');
  }));

  it('selectSubTab refuses when permission is missing', () => {
    auth.hasPermission.and.callFake((p: string) => p !== Permissions.ContractsRead);

    component.selectSubTab('contracts');

    expect(toasts.errorDirect).toHaveBeenCalled();
    expect(component.activeSubTab()).not.toBe('contracts');
  });

  it('selectSubTab sets activeSubTab when permission is present', () => {
    auth.hasPermission.and.returnValue(true);

    component.selectSubTab('contracts');

    expect(component.activeSubTab()).toBe('contracts');
  });

  it('canUploadDocuments depends on DocumentsUpload permission', () => {
    auth.hasPermission.and.callFake((p: string) => p === Permissions.DocumentsUpload);
    expect(component.canUploadDocuments()).toBeTrue();

    auth.hasPermission.and.returnValue(false);
    expect(component.canUploadDocuments()).toBeFalse();
  });

  it('canDeleteDocuments depends on DocumentsDelete permission', () => {
    auth.hasPermission.and.callFake((p: string) => p === Permissions.DocumentsDelete);
    expect(component.canDeleteDocuments()).toBeTrue();

    auth.hasPermission.and.returnValue(false);
    expect(component.canDeleteDocuments()).toBeFalse();
  });
});
