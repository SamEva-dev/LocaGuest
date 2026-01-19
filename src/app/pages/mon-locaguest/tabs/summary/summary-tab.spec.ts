import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SummaryTab } from './summary-tab';
import { PropertiesApi } from '../../../../core/api/properties.api';
import { TenantsApi } from '../../../../core/api/tenants.api';
import { DashboardApi } from '../../../../core/api/dashboard.api';
import { InternalTabManagerService } from '../../../../core/services/internal-tab-manager.service';
import { ConfirmService } from '../../../../core/ui/confirm.service';
import { ToastService } from '../../../../core/ui/toast.service';

describe('SummaryTab', () => {
  let component: SummaryTab;
  let fixture: ComponentFixture<SummaryTab>;

  let propertiesApi: jasmine.SpyObj<PropertiesApi>;
  let tenantsApi: jasmine.SpyObj<TenantsApi>;
  let dashboardApi: jasmine.SpyObj<DashboardApi>;
  let tabManager: jasmine.SpyObj<InternalTabManagerService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;
  let toasts: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    propertiesApi = jasmine.createSpyObj<PropertiesApi>('PropertiesApi', ['getProperties', 'deleteProperty']);
    tenantsApi = jasmine.createSpyObj<TenantsApi>('TenantsApi', ['getTenants', 'deleteTenant']);
    dashboardApi = jasmine.createSpyObj<DashboardApi>('DashboardApi', ['getActivities', 'getDeadlines']);
    tabManager = jasmine.createSpyObj<InternalTabManagerService>('InternalTabManagerService', [
      'openProperty',
      'openTenant',
      'setActiveTab',
      'closeTab',
    ]);
    confirmService = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['danger']);
    toasts = jasmine.createSpyObj<ToastService>('ToastService', [
      'errorDirect',
      'successDirect',
      'warningDirect',
    ]);

    propertiesApi.getProperties.and.returnValue(of({ items: [], totalCount: 0 } as any));
    tenantsApi.getTenants.and.returnValue(of({ items: [], totalCount: 0 } as any));
    dashboardApi.getActivities.and.returnValue(of([] as any));
    dashboardApi.getDeadlines.and.returnValue(of([] as any));

    await TestBed.configureTestingModule({
      imports: [SummaryTab],
      providers: [
        { provide: PropertiesApi, useValue: propertiesApi },
        { provide: TenantsApi, useValue: tenantsApi },
        { provide: DashboardApi, useValue: dashboardApi },
        { provide: InternalTabManagerService, useValue: tabManager },
        { provide: ConfirmService, useValue: confirmService },
        { provide: ToastService, useValue: toasts },
      ],
    })
      .overrideTemplate(SummaryTab, '')
      .compileComponents();

    fixture = TestBed.createComponent(SummaryTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads properties, tenants, and notifications', () => {
    expect(propertiesApi.getProperties).toHaveBeenCalled();
    expect(tenantsApi.getTenants).toHaveBeenCalled();
    expect(dashboardApi.getActivities).toHaveBeenCalled();
    expect(dashboardApi.getDeadlines).toHaveBeenCalled();
  });

  it('openProperty delegates to tabManager.openProperty', () => {
    component.openProperty({ id: 'p1', name: 'P1' } as any);
    expect(tabManager.openProperty).toHaveBeenCalledWith('p1', 'P1');
  });

  it('openTenant delegates to tabManager.openTenant', () => {
    component.openTenant({ id: 't1', fullName: 'T1' } as any);
    expect(tabManager.openTenant).toHaveBeenCalledWith('t1', 'T1');
  });

  it('onSearchInput triggers reload after debounce', fakeAsync(() => {
    propertiesApi.getProperties.calls.reset();
    tenantsApi.getTenants.calls.reset();

    component.viewMode.set('properties');
    component.onSearchInput('abc');

    tick(350);

    expect(propertiesApi.getProperties).toHaveBeenCalled();
    expect(tenantsApi.getTenants).not.toHaveBeenCalled();
  }));

  it('deleteProperty shows error when occupied/reserved', async () => {
    await component.deleteProperty({ id: 'p1', name: 'P1', status: 'Occupied', occupiedRooms: 1 } as any);
    expect(toasts.errorDirect).toHaveBeenCalled();
    expect(confirmService.danger).not.toHaveBeenCalled();
    expect(propertiesApi.deleteProperty).not.toHaveBeenCalled();
  });

  it('deleteProperty calls api when confirmed', async () => {
    confirmService.danger.and.resolveTo(true);
    propertiesApi.deleteProperty.and.returnValue(of(void 0) as any);

    await component.deleteProperty({ id: 'p1', name: 'P1', status: 'Vacant', occupiedRooms: 0 } as any);

    expect(confirmService.danger).toHaveBeenCalled();
    expect(propertiesApi.deleteProperty).toHaveBeenCalledWith('p1');
  });

  it('deleteProperty does nothing when not confirmed', async () => {
    confirmService.danger.and.resolveTo(false);

    await component.deleteProperty({ id: 'p1', name: 'P1', status: 'Vacant', occupiedRooms: 0 } as any);

    expect(confirmService.danger).toHaveBeenCalled();
    expect(propertiesApi.deleteProperty).not.toHaveBeenCalled();
  });

  it('deleteTenant blocks when activeContracts > 0', async () => {
    await component.deleteTenant({ id: 't1', fullName: 'T1', activeContracts: 1 } as any);
    expect(toasts.errorDirect).toHaveBeenCalled();
    expect(confirmService.danger).not.toHaveBeenCalled();
    expect(tenantsApi.deleteTenant).not.toHaveBeenCalled();
  });

  it('deleteTenant calls api when confirmed', async () => {
    confirmService.danger.and.resolveTo(true);
    tenantsApi.deleteTenant.and.returnValue(of(void 0) as any);

    await component.deleteTenant({ id: 't1', fullName: 'T1', activeContracts: 0 } as any);

    expect(confirmService.danger).toHaveBeenCalled();
    expect(tenantsApi.deleteTenant).toHaveBeenCalledWith('t1');
  });

  it('load properties handles error without throwing', () => {
    propertiesApi.getProperties.and.returnValue(throwError(() => new Error('boom')));
    (component as any).loadProperties();
    expect(component.isLoading()).toBeFalse();
  });
});
