import { TestBed } from '@angular/core/testing';

import { Authors } from './authors';

describe('Authors', () => {
  let service: Authors;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Authors);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
