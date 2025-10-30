import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { usresGuard } from './usres-guard';

describe('usresGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => usresGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
