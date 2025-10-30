import { TestBed } from '@angular/core/testing';

import { Loans } from './loans';

describe('Loans', () => {
  let service: Loans;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Loans);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
