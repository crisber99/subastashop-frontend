import { TestBed } from '@angular/core/testing';

import { OrdenService } from './orden';

describe('OrdenService', () => {
  let service: OrdenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
