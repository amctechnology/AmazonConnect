import { TestBed } from '@angular/core/testing';

import { ConnectInteractionOperationsService } from './connect-interaction-operations.service';

describe('ConnectInteractionOperationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConnectInteractionOperationsService = TestBed.get(
      ConnectInteractionOperationsService
    );
    expect(service).toBeTruthy();
  });
});
