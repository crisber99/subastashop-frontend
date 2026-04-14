import { TestBed } from '@angular/core/testing';

import { SuperAdminService } from './super-admin';

describe('SuperAdminService', () => {
  let service: SuperAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuperAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
