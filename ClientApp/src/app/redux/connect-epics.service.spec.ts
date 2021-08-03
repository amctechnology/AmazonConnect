import { TestBed } from '@angular/core/testing';

import { ConnectEpicsService } from './connect-epics.service';

describe('ConnectEpicsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConnectEpicsService = TestBed.get(ConnectEpicsService);
    expect(service).toBeTruthy();
  });
});
