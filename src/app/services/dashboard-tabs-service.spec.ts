import { TestBed } from '@angular/core/testing';

import { DashboardTabsService } from './dashboard-tabs-service';

describe('DashboardTabsService', () => {
  let service: DashboardTabsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardTabsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
