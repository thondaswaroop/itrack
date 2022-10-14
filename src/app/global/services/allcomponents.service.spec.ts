import { TestBed } from '@angular/core/testing';

import { AllcomponentsService } from './allcomponents.service';

describe('AllcomponentsService', () => {
  let service: AllcomponentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllcomponentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
